import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { subscriptionStore } from '../dal/subscription.store.js';
import { deliveryStore } from '../dal/delivery.store.js';

const app = createApp();

beforeEach(() => {
  subscriptionStore._reset();
  deliveryStore._reset();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('POST /events — validation (no fake timers)', () => {
  it('returns 202 Accepted immediately', async () => {
    const res = await request(app)
      .post('/events')
      .send({ type: 'token.revoked', payload: { userId: 'u1' } });

    expect(res.status).toBe(202);
    expect(res.body.message).toBeDefined();
  });

  it('returns 400 for an unknown event type', async () => {
    const res = await request(app).post('/events').send({ type: 'unknown.event', payload: {} });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('returns 400 when payload is missing', async () => {
    const res = await request(app).post('/events').send({ type: 'token.revoked' });

    expect(res.status).toBe(400);
  });

  it('returns 400 when type is missing', async () => {
    const res = await request(app)
      .post('/events')
      .send({ payload: { userId: 'u1' } });

    expect(res.status).toBe(400);
  });
});

describe('POST /events — delivery fan-out (fake timers)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('fans out to matching subscribers when event is accepted', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal('fetch', fetchMock);

    // Register two subscribers for token.revoked
    await request(app)
      .post('/subscriptions')
      .send({ targetUrl: 'https://hook-a.com/recv', events: ['token.revoked'] });

    await request(app)
      .post('/subscriptions')
      .send({ targetUrl: 'https://hook-b.com/recv', events: ['token.revoked'] });

    // Register one subscriber for a different event
    await request(app)
      .post('/subscriptions')
      .send({ targetUrl: 'https://hook-c.com/recv', events: ['app.discovered'] });

    await request(app)
      .post('/events')
      .send({ type: 'token.revoked', payload: { userId: 'u1' } });

    // Let async delivery tasks execute
    await vi.runAllTimersAsync();

    // Only the two token.revoked subscribers should be called
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const calledUrls = fetchMock.mock.calls.map((args: unknown[]) => args[0] as string);
    expect(calledUrls).toContain('https://hook-a.com/recv');
    expect(calledUrls).toContain('https://hook-b.com/recv');
    expect(calledUrls).not.toContain('https://hook-c.com/recv');
  });

  it('records deliveries in history after successful fan-out', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200 }));

    const subRes = await request(app)
      .post('/subscriptions')
      .send({ targetUrl: 'https://hook.example.com/recv', events: ['app.discovered'] });

    const subId = subRes.body.id;

    await request(app)
      .post('/events')
      .send({ type: 'app.discovered', payload: { appId: 'app-42' } });

    await vi.runAllTimersAsync();

    const deliveriesRes = await request(app).get(`/subscriptions/${subId}/deliveries`);

    expect(deliveriesRes.status).toBe(200);
    expect(deliveriesRes.body).toHaveLength(1);
    expect(deliveriesRes.body[0].status).toBe('success');
    expect(deliveriesRes.body[0].eventType).toBe('app.discovered');
    expect(deliveriesRes.body[0].attemptNumber).toBe(1);
  });

  it('delivery history reflects retries on repeated failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503 }));

    const subRes = await request(app)
      .post('/subscriptions')
      .send({ targetUrl: 'https://flaky.example.com/recv', events: ['privilege.escalation'] });

    const subId = subRes.body.id;

    await request(app)
      .post('/events')
      .send({ type: 'privilege.escalation', payload: { userId: 'u99' } });

    await vi.runAllTimersAsync();

    const deliveriesRes = await request(app).get(`/subscriptions/${subId}/deliveries`);

    expect(deliveriesRes.status).toBe(200);
    expect(deliveriesRes.body).toHaveLength(3);
    expect(deliveriesRes.body.every((d: { status: string }) => d.status === 'failed')).toBe(true);
  });
});
