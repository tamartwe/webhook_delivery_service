import { Subscription, KnownEventType, PaginatedResult } from '../types/index.js';

export interface SubscriptionStore {
  save(sub: Subscription): void;
  findById(id: string): Subscription | undefined;
  findPaginated(page: number, limit: number): PaginatedResult<Subscription>;
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

    findPaginated(page, limit) {
      const all = Array.from(store.values());
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

    delete(id) {
      store.delete(id);
    },

    findByEventType(type) {
      return Array.from(store.values()).filter((sub) => sub.events.includes(type));
    },
  };
}
