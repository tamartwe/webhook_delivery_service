import { DeliveryAttempt } from '../types/index.js';

const store = new Map<string, DeliveryAttempt[]>();

export const deliveryStore = {
  append(attempt: DeliveryAttempt): void {
    const existing = store.get(attempt.subscriptionId) ?? [];
    store.set(attempt.subscriptionId, [...existing, attempt]);
  },

  findBySubscriptionId(subscriptionId: string): DeliveryAttempt[] {
    return store.get(subscriptionId) ?? [];
  },

  /** Clears all data — used in tests only. */
  _reset(): void {
    store.clear();
  },
};
