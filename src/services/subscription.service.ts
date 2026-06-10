import { v4 as uuidv4 } from 'uuid';
import { SubscriptionStore } from '../dal/subscription.store.js';
import { NotFoundError } from '../lib/errors.js';
import { Subscription, KnownEventType } from '../types/index.js';
import { CreateSubscriptionInput } from '../schemas/subscription.schema.js';

export function createSubscriptionService(store: SubscriptionStore) {
  return {
    create(input: CreateSubscriptionInput): Subscription {
      const sub: Subscription = {
        id: uuidv4(),
        targetUrl: input.targetUrl,
        events: input.events,
        secret: input.secret,
        createdAt: new Date(),
      };
      store.save(sub);
      return sub;
    },

    delete(id: string): void {
      const existing = store.findById(id);
      if (!existing) throw new NotFoundError('Subscription', id);
      store.delete(id);
    },

    list(): Subscription[] {
      return store.findAll();
    },

    findByEventType(type: KnownEventType): Subscription[] {
      return store.findByEventType(type);
    },

    getById(id: string): Subscription {
      const sub = store.findById(id);
      if (!sub) throw new NotFoundError('Subscription', id);
      return sub;
    },
  };
}

export type SubscriptionService = ReturnType<typeof createSubscriptionService>;
