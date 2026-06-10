import { Subscription, KnownEventType } from '../types/index.js';

const store = new Map<string, Subscription>();

export const subscriptionStore = {
  save(sub: Subscription): void {
    store.set(sub.id, sub);
  },

  findById(id: string): Subscription | undefined {
    return store.get(id);
  },

  findAll(): Subscription[] {
    return Array.from(store.values());
  },

  delete(id: string): void {
    store.delete(id);
  },

  findByEventType(type: KnownEventType): Subscription[] {
    return Array.from(store.values()).filter((sub) => sub.events.includes(type));
  },

  /** Clears all data — used in tests only. */
  _reset(): void {
    store.clear();
  },
};
