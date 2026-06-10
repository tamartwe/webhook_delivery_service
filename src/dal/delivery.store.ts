import { DeliveryAttempt } from '../types/index.js';

export interface DeliveryStore {
  append(attempt: DeliveryAttempt): void;
  findBySubscriptionId(subscriptionId: string): DeliveryAttempt[];
}

export function createDeliveryStore(): DeliveryStore {
  const store = new Map<string, DeliveryAttempt[]>();

  return {
    append(attempt) {
      const existing = store.get(attempt.subscriptionId) ?? [];
      store.set(attempt.subscriptionId, [...existing, attempt]);
    },
    findBySubscriptionId(subscriptionId) {
      return store.get(subscriptionId) ?? [];
    },
  };
}
