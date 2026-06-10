import { Subscription, KnownEventType } from '../types/index.js';

export interface SubscriptionStore {
  save(sub: Subscription): void;
  findById(id: string): Subscription | undefined;
  findAll(): Subscription[];
  delete(id: string): void;
  findByEventType(type: KnownEventType): Subscription[];
}

export function createSubscriptionStore(): SubscriptionStore {
  const store = new Map<string, Subscription>();

  return {
    save(sub) {
      store.set(sub.id, sub);
    },
    findById(id) {
      return store.get(id);
    },
    findAll() {
      return Array.from(store.values());
    },
    delete(id) {
      store.delete(id);
    },
    findByEventType(type) {
      return Array.from(store.values()).filter((sub) => sub.events.includes(type));
    },
  };
}
