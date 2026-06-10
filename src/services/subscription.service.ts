import { v4 as uuidv4 } from 'uuid';
import { subscriptionStore } from '../dal/subscription.store.js';
import { NotFoundError } from '../lib/errors.js';
import { Subscription, KnownEventType } from '../types/index.js';
import { CreateSubscriptionInput } from '../schemas/subscription.schema.js';

export const subscriptionService = {
  create(input: CreateSubscriptionInput): Subscription {
    const sub: Subscription = {
      id: uuidv4(),
      targetUrl: input.targetUrl,
      events: input.events,
      secret: input.secret,
      createdAt: new Date(),
    };
    subscriptionStore.save(sub);
    return sub;
  },

  delete(id: string): void {
    const existing = subscriptionStore.findById(id);
    if (!existing) {
      throw new NotFoundError('Subscription', id);
    }
    subscriptionStore.delete(id);
  },

  list(): Subscription[] {
    return subscriptionStore.findAll();
  },

  findByEventType(type: KnownEventType): Subscription[] {
    return subscriptionStore.findByEventType(type);
  },

  getById(id: string): Subscription {
    const sub = subscriptionStore.findById(id);
    if (!sub) {
      throw new NotFoundError('Subscription', id);
    }
    return sub;
  },
};
