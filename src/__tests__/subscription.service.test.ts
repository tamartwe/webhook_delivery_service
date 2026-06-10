import { describe, it, expect, beforeEach } from 'vitest';
import { subscriptionService } from '../services/subscription.service.js';
import { subscriptionStore } from '../dal/subscription.store.js';

beforeEach(() => {
  subscriptionStore._reset();
});

describe('subscriptionService.create', () => {
  it('creates a subscription and returns it with a generated id', () => {
    const sub = subscriptionService.create({
      targetUrl: 'https://example.com/hook',
      events: ['app.discovered'],
    });

    expect(sub.id).toBeDefined();
    expect(sub.targetUrl).toBe('https://example.com/hook');
    expect(sub.events).toEqual(['app.discovered']);
    expect(sub.createdAt).toBeInstanceOf(Date);
  });

  it('stores the subscription so it appears in list()', () => {
    subscriptionService.create({
      targetUrl: 'https://example.com/hook',
      events: ['token.revoked'],
    });

    const list = subscriptionService.list();
    expect(list).toHaveLength(1);
    expect(list[0].events).toContain('token.revoked');
  });

  it('preserves an optional secret', () => {
    const sub = subscriptionService.create({
      targetUrl: 'https://example.com/hook',
      events: ['privilege.escalation'],
      secret: 'my-secret',
    });
    expect(sub.secret).toBe('my-secret');
  });
});

describe('subscriptionService.delete', () => {
  it('removes the subscription', () => {
    const sub = subscriptionService.create({
      targetUrl: 'https://example.com/hook',
      events: ['token.revoked'],
    });

    subscriptionService.delete(sub.id);
    expect(subscriptionService.list()).toHaveLength(0);
  });

  it('throws NotFoundError for a non-existent id', () => {
    expect(() => subscriptionService.delete('does-not-exist')).toThrow('not found');
  });
});

describe('subscriptionService.findByEventType', () => {
  it('returns only subscriptions that include the requested event type', () => {
    subscriptionService.create({
      targetUrl: 'https://a.com',
      events: ['app.discovered'],
    });
    subscriptionService.create({
      targetUrl: 'https://b.com',
      events: ['token.revoked'],
    });
    subscriptionService.create({
      targetUrl: 'https://c.com',
      events: ['app.discovered', 'token.revoked'],
    });

    const found = subscriptionService.findByEventType('app.discovered');
    expect(found).toHaveLength(2);
    expect(found.map((s) => s.targetUrl)).toEqual(
      expect.arrayContaining(['https://a.com', 'https://c.com']),
    );
  });
});
