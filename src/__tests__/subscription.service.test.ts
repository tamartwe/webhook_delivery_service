import { describe, it, expect, beforeEach } from 'vitest';
import { createSubscriptionService } from '../services/subscription.service.js';
import { createSubscriptionStore } from '../dal/subscription.store.js';

let service: ReturnType<typeof createSubscriptionService>;

beforeEach(() => {
  service = createSubscriptionService(createSubscriptionStore()); // fresh store per test
});

describe('subscriptionService.create', () => {
  it('creates a subscription and returns it with a generated id', () => {
    const sub = service.create({
      targetUrl: 'https://example.com/hook',
      events: ['app.discovered'],
    });

    expect(sub.id).toBeDefined();
    expect(sub.targetUrl).toBe('https://example.com/hook');
    expect(sub.events).toEqual(['app.discovered']);
    expect(sub.createdAt).toBeInstanceOf(Date);
  });

  it('stores the subscription so it appears in list()', () => {
    service.create({
      targetUrl: 'https://example.com/hook',
      events: ['token.revoked'],
    });

    const list = service.list();
    expect(list).toHaveLength(1);
    expect(list[0].events).toContain('token.revoked');
  });

  it('accepts a secret but does not return it in the public view', () => {
    const sub = service.create({
      targetUrl: 'https://example.com/hook',
      events: ['privilege.escalation'],
      secret: 'my-secret',
    });
    expect('secret' in sub).toBe(false);
  });
});

describe('subscriptionService.delete', () => {
  it('removes the subscription', () => {
    const sub = service.create({
      targetUrl: 'https://example.com/hook',
      events: ['token.revoked'],
    });

    service.delete(sub.id);
    expect(service.list()).toHaveLength(0);
  });

  it('throws NotFoundError for a non-existent id', () => {
    expect(() => service.delete('does-not-exist')).toThrow('not found');
  });
});

describe('subscriptionService.findByEventType', () => {
  it('returns only subscriptions that include the requested event type', () => {
    service.create({ targetUrl: 'https://a.com', events: ['app.discovered'] });
    service.create({ targetUrl: 'https://b.com', events: ['token.revoked'] });
    service.create({ targetUrl: 'https://c.com', events: ['app.discovered', 'token.revoked'] });

    const found = service.findByEventType('app.discovered');
    expect(found).toHaveLength(2);
    expect(found.map((s) => s.targetUrl)).toEqual(
      expect.arrayContaining(['https://a.com', 'https://c.com']),
    );
  });
});
