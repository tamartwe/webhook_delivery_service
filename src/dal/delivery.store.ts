import { DeliveryAttempt, PaginatedResult } from '../types/index.js';

export interface DeliveryStore {
  append(attempt: DeliveryAttempt): void;
  findPaginated(
    subscriptionId: string,
    page: number,
    limit: number,
  ): PaginatedResult<DeliveryAttempt>;
}

export function createDeliveryStore(): DeliveryStore {
  const store = new Map<string, DeliveryAttempt[]>();

  return {
    append(attempt) {
      const existing = store.get(attempt.subscriptionId) ?? [];
      store.set(attempt.subscriptionId, [...existing, attempt]);
    },

    findPaginated(subscriptionId, page, limit) {
      const all = store.get(subscriptionId) ?? [];
      const total = all.length;

      if (total === 0) return { data: [], total: 0, totalPages: 0, page, limit };

      const start = (page - 1) * limit;
      return {
        data: all.slice(start, start + limit),
        total,
        totalPages: Math.ceil(total / limit),
        page,
        limit,
      };
    },
  };
}
