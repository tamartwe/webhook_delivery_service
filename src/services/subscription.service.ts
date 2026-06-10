import { v4 as uuidv4 } from 'uuid';
import { SubscriptionStore } from '../dal/subscription.store.js';
import { NotFoundError } from '../lib/errors.js';
import {
  Subscription,
  PublicSubscription,
  PaginatedResult,
  KnownEventType,
} from '../types/index.js';
import { CreateSubscriptionInput } from '../schemas/subscription.schema.js';

function toPublic(sub: Subscription): PublicSubscription {
  return {
    id: sub.id,
    targetUrl: sub.targetUrl,
    events: sub.events,
    createdAt: sub.createdAt,
  };
}

export function createSubscriptionService(store: SubscriptionStore) {
  return {
    /** Creates a subscription and returns the public view (no secret). */
    create(input: CreateSubscriptionInput): PublicSubscription {
      const sub: Subscription = {
        id: uuidv4(),
        targetUrl: input.targetUrl,
        events: input.events,
        secret: input.secret,
        createdAt: new Date(),
      };
      store.save(sub);
      return toPublic(sub);
    },

    delete(id: string): void {
      const existing = store.findById(id);
      if (!existing) throw new NotFoundError('Subscription', id);
      store.delete(id);
    },

    /** Returns a paginated page of subscriptions without secrets. */
    list(page: number, limit: number): PaginatedResult<PublicSubscription> {
      const result = store.findPaginated(page, limit);
      return { ...result, data: result.data.map(toPublic) };
    },

    /** Internal use only — returns full Subscription including secret for HMAC signing. */
    findByEventType(type: KnownEventType): Subscription[] {
      return store.findByEventType(type);
    },

    /** Internal use only — verifies existence. Returns full Subscription. */
    getById(id: string): Subscription {
      const sub = store.findById(id);
      if (!sub) throw new NotFoundError('Subscription', id);
      return sub;
    },
  };
}

export type SubscriptionService = ReturnType<typeof createSubscriptionService>;
