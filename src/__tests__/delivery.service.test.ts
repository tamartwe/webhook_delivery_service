import { createHmac } from 'crypto';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { createDeliveryService } from '../services/delivery.service.js';
import { createDeliveryStore } from '../dal/delivery.store.js';
import { Subscription } from '../types/index.js';

const makeSub = (overrides: Partial<Subscription> = {}): Subscription => ({
  id: 'sub-1',
  targetUrl: 'https://target.example.com/hook',
  events: ['token.revoked'],
  createdAt: new Date(),
  ...overrides,
});

let service: ReturnType<typeof createDeliveryService>;

beforeEach(() => {
  service = createDeliveryService(createDeliveryStore()); // fresh store per test
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('deliveryService — successful delivery', () => {
  it('records a success attempt when the target responds 200', async () => {
    const sub = makeSub();

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200 }));

    service.scheduleDelivery(sub, 'token.revoked', { userId: 'u1' });

    await vi.runAllTimersAsync();

    const history = service.getHistory(sub.id, 1, 20);
    expect(history.data).toHaveLength(1);
    expect(history.total).toBe(1);
    expect(history.data[0].status).toBe('success');
    expect(history.data[0].attemptNumber).toBe(1);
    expect(history.data[0].httpStatus).toBe(200);
  });
});

describe('deliveryService — retry on failure', () => {
  it('retries up to 3 times and records each attempt', async () => {
    const sub = makeSub();

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503 }));

    service.scheduleDelivery(sub, 'token.revoked', {});

    await vi.runAllTimersAsync();

    const history = service.getHistory(sub.id, 1, 20);
    expect(history.data).toHaveLength(3);
    expect(history.total).toBe(3);
    expect(history.data.map((a) => a.attemptNumber)).toEqual([1, 2, 3]);
    expect(history.data.every((a) => a.status === 'failed')).toBe(true);
  });

  it('stops retrying after a successful attempt', async () => {
    const sub = makeSub();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 500 })
      .mockResolvedValueOnce({ ok: true, status: 200 });

    vi.stubGlobal('fetch', fetchMock);

    service.scheduleDelivery(sub, 'token.revoked', {});

    await vi.runAllTimersAsync();

    const history = service.getHistory(sub.id, 1, 20);
    expect(history.data).toHaveLength(2);
    expect(history.total).toBe(2);
    expect(history.data[0].status).toBe('failed');
    expect(history.data[1].status).toBe('success');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe('deliveryService — HMAC signing', () => {
  it('includes X-Webhook-Signature header when a secret is set', async () => {
    const secret = 'webhook-secret';
    const sub = makeSub({ secret });
    const payload = { userId: 'u42' };

    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal('fetch', fetchMock);

    service.scheduleDelivery(sub, 'token.revoked', payload);
    await vi.runAllTimersAsync();

    const [, callOptions] = fetchMock.mock.calls[0] as [
      string,
      RequestInit & { headers: Record<string, string> },
    ];
    const sentBody = callOptions.body as string;
    const expectedSig = `sha256=${createHmac('sha256', secret).update(sentBody, 'utf8').digest('hex')}`;

    expect(callOptions.headers['X-Webhook-Signature']).toBe(expectedSig);
  });

  it('does NOT include X-Webhook-Signature when no secret is set', async () => {
    const sub = makeSub({ secret: undefined });

    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal('fetch', fetchMock);

    service.scheduleDelivery(sub, 'token.revoked', {});
    await vi.runAllTimersAsync();

    const [, callOptions] = fetchMock.mock.calls[0] as [
      string,
      RequestInit & { headers: Record<string, string> },
    ];
    expect(callOptions.headers['X-Webhook-Signature']).toBeUndefined();
  });
});
