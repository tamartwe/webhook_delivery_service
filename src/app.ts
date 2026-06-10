import express, { Request, Response, NextFunction } from 'express';
import { SubscriptionStore, createSubscriptionStore } from './dal/subscription.store.js';
import { DeliveryStore, createDeliveryStore } from './dal/delivery.store.js';
import { createSubscriptionService } from './services/subscription.service.js';
import { createDeliveryService } from './services/delivery.service.js';
import { createEventService } from './services/event.service.js';
import { createSubscriptionsController } from './controllers/subscriptions.controller.js';
import { createEventsController } from './controllers/events.controller.js';
import { createSubscriptionsRouter } from './routes/subscriptions.routes.js';
import { createEventsRouter } from './routes/events.routes.js';
import { NotFoundError, ValidationError } from './lib/errors.js';
import { logger } from './lib/logger.js';

export interface AppDeps {
  subscriptionStore?: SubscriptionStore;
  deliveryStore?: DeliveryStore;
}

export function createApp(deps: AppDeps = {}) {
  const subscriptionStore = deps.subscriptionStore ?? createSubscriptionStore();
  const deliveryStore = deps.deliveryStore ?? createDeliveryStore();

  const subscriptionSvc = createSubscriptionService(subscriptionStore);
  const deliverySvc = createDeliveryService(deliveryStore);
  const eventSvc = createEventService(subscriptionSvc, deliverySvc);

  const subscriptionsCtrl = createSubscriptionsController(subscriptionSvc, deliverySvc);
  const eventsCtrl = createEventsController(eventSvc);

  const app = express();
  app.use(express.json());

  app.use('/subscriptions', createSubscriptionsRouter(subscriptionsCtrl));
  app.use('/events', createEventsRouter(eventsCtrl));

  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok' });
  });

  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Not found' });
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof ValidationError) {
      res.status(err.statusCode).json({ error: err.message, details: err.details });
      return;
    }
    if (err instanceof NotFoundError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    logger.error({ err }, 'Unhandled error');
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}
