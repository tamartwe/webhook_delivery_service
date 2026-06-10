import { Router } from 'express';
import { createEventsController } from '../controllers/events.controller.js';

export function createEventsRouter(controller: ReturnType<typeof createEventsController>): Router {
  const router = Router();
  router.post('/', controller.ingest);
  return router;
}
