import { Router } from 'express';
import { subscriptionsController } from '../controllers/subscriptions.controller.js';

const router = Router();

router.post('/', subscriptionsController.create);
router.get('/', subscriptionsController.list);
router.delete('/:id', subscriptionsController.remove);
router.get('/:id/deliveries', subscriptionsController.getDeliveries);

export default router;
