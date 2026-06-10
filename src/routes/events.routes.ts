import { Router } from 'express';
import { eventsController } from '../controllers/events.controller.js';

const router = Router();

router.post('/', eventsController.ingest);

export default router;
