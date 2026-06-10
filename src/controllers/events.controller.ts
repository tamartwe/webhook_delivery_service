import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { ingestEventSchema } from '../schemas/event.schema.js';
import { eventService } from '../services/event.service.js';
import { ValidationError } from '../lib/errors.js';

export const eventsController = {
  ingest(req: Request, res: Response, next: NextFunction): void {
    try {
      const input = ingestEventSchema.parse(req.body);
      eventService.ingest(input.type, input.payload as Record<string, unknown>);
      res.status(202).json({ message: 'Event accepted' });
    } catch (err) {
      if (err instanceof ZodError) {
        next(new ValidationError('Invalid request body', err.flatten()));
      } else {
        next(err);
      }
    }
  },
};
