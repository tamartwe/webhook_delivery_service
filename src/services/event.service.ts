import { subscriptionService } from './subscription.service.js';
import { deliveryService } from './delivery.service.js';
import { logger } from '../lib/logger.js';
import { KnownEventType } from '../types/index.js';

export const eventService = {
  ingest(type: KnownEventType, payload: Record<string, unknown>): void {
    const subscribers = subscriptionService.findByEventType(type);

    logger.info(
      { eventType: type, subscriberCount: subscribers.length },
      'Event ingested, fanning out deliveries',
    );

    subscribers.forEach((sub) => {
      deliveryService.scheduleDelivery(sub, type, payload);
    });
  },
};
