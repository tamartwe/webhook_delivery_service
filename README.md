# Webhook Delivery Service

A reliable webhook subscription and event delivery service. External systems register target URLs and event types they care about; when an identity event is ingested the service fans it out to all matching subscribers with automatic retries and HMAC signing.

---

## Features

- **Subscription management** — register, list, and remove webhook endpoints
- **Event ingestion** — ingest typed identity events and fan them out to matching subscribers
- **Reliable delivery** — async HTTP POST to each subscriber with up to 3 retries and exponential backoff (1 s → 2 s → 4 s)
- **HMAC-SHA256 signing** — optional `X-Webhook-Signature` header when a secret is provided at subscription time
- **Delivery history** — per-subscription log of every attempt with status, HTTP code, and timestamp
- **Non-blocking** — `POST /events` returns `202 Accepted` immediately; delivery happens in the background via `setImmediate`

---

## Supported event types

| Type | Meaning |
|---|---|
| `app.discovered` | A new risky application was discovered |
| `privilege.escalation` | A privilege escalation was detected |
| `token.revoked` | An identity token was revoked |

---

## API

### `POST /subscriptions`

Register a new webhook subscription.

**Request body**
```json
{
  "targetUrl": "https://your-server.com/webhook",
  "events": ["app.discovered", "token.revoked"],
  "secret": "optional-hmac-secret"
}
```

**Response `201`**
```json
{ "id": "d3e2f1a0-..." }
```

---

### `GET /subscriptions`

List all active subscriptions.

**Response `200`**
```json
[
  {
    "id": "d3e2f1a0-...",
    "targetUrl": "https://your-server.com/webhook",
    "events": ["app.discovered"],
    "createdAt": "2026-06-10T17:00:00.000Z"
  }
]
```

---

### `DELETE /subscriptions/:id`

Unregister a subscription.

**Response** `204 No Content`  
**Response** `404` if the subscription does not exist.

---

### `POST /events`

Ingest an identity event. Returns immediately; delivery happens in the background.

**Request body**
```json
{
  "type": "token.revoked",
  "payload": { "userId": "u-123", "reason": "manual-revocation" }
}
```

**Response `202`**
```json
{ "message": "Event accepted" }
```

---

### `GET /subscriptions/:id/deliveries`

Return the delivery attempt history for a subscription.

**Response `200`**
```json
[
  {
    "id": "a1b2c3...",
    "subscriptionId": "d3e2f1a0-...",
    "eventType": "token.revoked",
    "payload": { "userId": "u-123" },
    "attemptNumber": 1,
    "status": "failed",
    "httpStatus": 503,
    "respondedAt": "2026-06-10T17:00:01.000Z"
  },
  {
    "attemptNumber": 2,
    "status": "success",
    "httpStatus": 200,
    ...
  }
]
```

---

## Delivery behaviour

```
POST /events → 202 Accepted (immediate)
                    ↓  setImmediate (next event-loop tick)
              attempt 1 → POST targetUrl
                    ├── 2xx  → record success, done
                    └── fail → wait 1 s
              attempt 2 → POST targetUrl
                    ├── 2xx  → record success, done
                    └── fail → wait 2 s
              attempt 3 → POST targetUrl
                    ├── 2xx  → record success, done
                    └── fail → record failed (final), done
```

If a `secret` was provided at subscription time, each delivery request includes:
```
X-Webhook-Signature: sha256=<hmac-sha256-hex>
```
The signature is computed over the raw JSON request body.

---

## Project structure

```
src/
├── types/          index.ts              — Subscription, DeliveryAttempt, KnownEventType
├── schemas/        subscription.schema.ts / event.schema.ts  — Zod validation
├── lib/            logger.ts, hmac.ts, errors.ts
├── dal/            subscription.store.ts / delivery.store.ts — in-memory stores
├── services/       subscription.service.ts
│                   event.service.ts      — fan-out orchestration
│                   delivery.service.ts   — retry loop, HMAC, history
├── controllers/    subscriptions.controller.ts / events.controller.ts
├── routes/         subscriptions.routes.ts / events.routes.ts
├── app.ts          — Express app factory (no port binding)
├── index.ts        — server entry point
└── __tests__/      api.subscriptions.test.ts
                    api.events.test.ts
                    delivery.service.test.ts
                    subscription.service.test.ts
                    hmac.test.ts
```

---

## Getting started

```bash
npm install
npm run dev          # starts with tsx watch on port 3000
```

Set `PORT` to override the default:
```bash
PORT=8080 npm run dev
```

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start in watch mode (tsx) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled output |
| `npm test` | Run all tests (Vitest) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run lint` | Check for lint errors |
| `npm run lint:fix` | Auto-fix lint errors |
| `npm run format` | Format all files with Prettier |

---

## Stack

- **Runtime** — Node.js
- **Framework** — Express 5
- **Validation** — Zod
- **Logging** — Pino
- **Testing** — Vitest + Supertest
- **Language** — TypeScript 5
- **Linting** — ESLint (Airbnb) + Prettier
