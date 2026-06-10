import { Router } from 'express';
import { createSubscriptionsController } from '../controllers/subscriptions.controller.js';

export function createSubscriptionsRouter(
  controller: ReturnType<typeof createSubscriptionsController>,
): Router {
  const router = Router();
  router.post('/', controller.create);
  router.get('/', controller.list);
  router.delete('/:id', controller.remove);
  router.get('/:id/deliveries', controller.getDeliveries);
  return router;
}
