import express, { Request, Response, NextFunction } from 'express';
import subscriptionsRouter from './routes/subscriptions.routes.js';
import eventsRouter from './routes/events.routes.js';
import { NotFoundError, ValidationError } from './lib/errors.js';
import { logger } from './lib/logger.js';

export function createApp() {
  const app = express();

  app.use(express.json());

  app.use('/subscriptions', subscriptionsRouter);
  app.use('/events', eventsRouter);

  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok' });
  });

  // 404 handler
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Not found' });
  });

  // Centralised error handler
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
