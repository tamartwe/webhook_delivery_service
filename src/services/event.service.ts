import { SubscriptionService } from './subscription.service.js';
import { DeliveryService } from './delivery.service.js';
import { logger } from '../lib/logger.js';
import { KnownEventType } from '../types/index.js';

export function createEventService(
  subscriptionSvc: SubscriptionService,
  deliverySvc: DeliveryService,
) {
  return {
    ingest(type: KnownEventType, payload: Record<string, unknown>): void {
      const subscribers = subscriptionSvc.findByEventType(type);

      logger.info(
        { eventType: type, subscriberCount: subscribers.length },
        'Event ingested, fanning out deliveries',
      );

      subscribers.forEach((sub) => {
        deliverySvc.scheduleDelivery(sub, type, payload);
      });
    },
  };
}

export type EventService = ReturnType<typeof createEventService>;
