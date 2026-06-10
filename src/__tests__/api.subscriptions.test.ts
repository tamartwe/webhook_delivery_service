import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { subscriptionStore } from '../dal/subscription.store.js';
import { deliveryStore } from '../dal/delivery.store.js';

const app = createApp();

beforeEach(() => {
  subscriptionStore._reset();
  deliveryStore._reset();
});

describe('POST /subscriptions', () => {
  it('creates a subscription and returns 201 with an id', async () => {
    const res = await request(app)
      .post('/subscriptions')
      .send({ targetUrl: 'https://example.com/hook', events: ['token.revoked'] });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(typeof res.body.id).toBe('string');
  });

  it('creates a subscription with an optional secret', async () => {
    const res = await request(app)
      .post('/subscriptions')
      .send({
        targetUrl: 'https://example.com/hook',
        events: ['app.discovered'],
        secret: 'mysecret',
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
  });

  it('returns 400 for an invalid URL', async () => {
    const res = await request(app)
      .post('/subscriptions')
      .send({ targetUrl: 'not-a-url', events: ['token.revoked'] });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('returns 400 when events array is empty', async () => {
    const res = await request(app)
      .post('/subscriptions')
      .send({ targetUrl: 'https://example.com/hook', events: [] });

    expect(res.status).toBe(400);
  });

  it('returns 400 when events contains an unknown event type', async () => {
    const res = await request(app)
      .post('/subscriptions')
      .send({ targetUrl: 'https://example.com/hook', events: ['unknown.event'] });

    expect(res.status).toBe(400);
  });

  it('returns 400 when targetUrl is missing', async () => {
    const res = await request(app)
      .post('/subscriptions')
      .send({ events: ['token.revoked'] });

    expect(res.status).toBe(400);
  });
});

describe('GET /subscriptions', () => {
  it('returns an empty array when there are no subscriptions', async () => {
    const res = await request(app).get('/subscriptions');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns all registered subscriptions', async () => {
    await request(app)
      .post('/subscriptions')
      .send({ targetUrl: 'https://a.com/hook', events: ['token.revoked'] });

    await request(app)
      .post('/subscriptions')
      .send({ targetUrl: 'https://b.com/hook', events: ['app.discovered'] });

    const res = await request(app).get('/subscriptions');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });
});

describe('DELETE /subscriptions/:id', () => {
  it('deletes an existing subscription and returns 204', async () => {
    const createRes = await request(app)
      .post('/subscriptions')
      .send({ targetUrl: 'https://example.com/hook', events: ['token.revoked'] });

    const { id } = createRes.body;

    const deleteRes = await request(app).delete(`/subscriptions/${id}`);
    expect(deleteRes.status).toBe(204);

    const listRes = await request(app).get('/subscriptions');
    expect(listRes.body).toHaveLength(0);
  });

  it('returns 404 for a non-existent subscription id', async () => {
    const res = await request(app).delete('/subscriptions/non-existent-id');
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/not found/i);
  });
});

describe('GET /subscriptions/:id/deliveries', () => {
  it('returns an empty array for a subscription with no deliveries', async () => {
    const createRes = await request(app)
      .post('/subscriptions')
      .send({ targetUrl: 'https://example.com/hook', events: ['token.revoked'] });

    const res = await request(app).get(`/subscriptions/${createRes.body.id}/deliveries`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns 404 for a non-existent subscription id', async () => {
    const res = await request(app).get('/subscriptions/non-existent-id/deliveries');
    expect(res.status).toBe(404);
  });
});
