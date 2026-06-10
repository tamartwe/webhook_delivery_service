import { v4 as uuidv4 } from 'uuid';
import { DeliveryStore } from '../dal/delivery.store.js';
import { signPayload } from '../lib/hmac.js';
import { logger } from '../lib/logger.js';
import { DeliveryAttempt, KnownEventType, Subscription } from '../types/index.js';

const MAX_ATTEMPTS = 3;

function backoffMs(attemptNumber: number): number {
  return 2 ** (attemptNumber - 1) * 1000;
}

function sleep(ms: number): Promise<void> {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function createDeliveryService(store: DeliveryStore) {
  async function attemptDelivery(
    subscription: Subscription,
    eventType: KnownEventType,
    payload: Record<string, unknown>,
    attemptNumber: number,
  ): Promise<void> {
    const body = JSON.stringify({ type: eventType, payload });
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Webhook-Event': eventType,
    };

    if (subscription.secret) {
      headers['X-Webhook-Signature'] = signPayload(subscription.secret, body);
    }

    let httpStatus: number | undefined;
    let status: DeliveryAttempt['status'] = 'failed';

    try {
      const response = await fetch(subscription.targetUrl, {
        method: 'POST',
        headers,
        body,
        signal: AbortSignal.timeout(10_000),
      });

      httpStatus = response.status;
      if (response.ok) status = 'success';
    } catch (err) {
      logger.warn(
        { subscriptionId: subscription.id, attemptNumber, err },
        'Delivery attempt threw an error',
      );
    }

    store.append({
      id: uuidv4(),
      subscriptionId: subscription.id,
      eventType,
      payload,
      attemptNumber,
      status,
      httpStatus,
      respondedAt: new Date(),
    });

    logger.info(
      { subscriptionId: subscription.id, attemptNumber, status, httpStatus },
      'Delivery attempt recorded',
    );

    if (status !== 'success') {
      throw new Error(`Delivery failed with status ${httpStatus ?? 'no-response'}`);
    }
  }

  async function runDeliveryWithRetries(
    subscription: Subscription,
    eventType: KnownEventType,
    payload: Record<string, unknown>,
  ): Promise<void> {
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
      try {
        // eslint-disable-next-line no-await-in-loop
        await attemptDelivery(subscription, eventType, payload, attempt);
        return;
      } catch {
        if (attempt < MAX_ATTEMPTS) {
          const delay = backoffMs(attempt);
          logger.info(
            { subscriptionId: subscription.id, attempt, delayMs: delay },
            'Retrying delivery after backoff',
          );
          // eslint-disable-next-line no-await-in-loop
          await sleep(delay);
        }
      }
    }

    logger.error({ subscriptionId: subscription.id, eventType }, 'All delivery attempts exhausted');
  }

  return {
    /**
     * Schedules delivery on the next event-loop tick so the HTTP 202 response
     * is always flushed to the caller before the first delivery attempt begins.
     * Fire-and-forget — never blocks the caller.
     */
    scheduleDelivery(
      subscription: Subscription,
      eventType: KnownEventType,
      payload: Record<string, unknown>,
    ): void {
      setImmediate(() => {
        void runDeliveryWithRetries(subscription, eventType, payload).catch((err) => {
          logger.error({ err, subscriptionId: subscription.id }, 'Unexpected delivery error');
        });
      });
    },

    getHistory(subscriptionId: string): DeliveryAttempt[] {
      return store.findBySubscriptionId(subscriptionId);
    },
  };
}

export type DeliveryService = ReturnType<typeof createDeliveryService>;
