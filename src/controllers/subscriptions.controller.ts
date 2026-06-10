import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { createSubscriptionSchema } from '../schemas/subscription.schema.js';
import { paginationSchema } from '../schemas/pagination.schema.js';
import { SubscriptionService } from '../services/subscription.service.js';
import { DeliveryService } from '../services/delivery.service.js';
import { ValidationError } from '../lib/errors.js';

export function createSubscriptionsController(
  subscriptionSvc: SubscriptionService,
  deliverySvc: DeliveryService,
) {
  return {
    create(req: Request, res: Response, next: NextFunction): void {
      try {
        const input = createSubscriptionSchema.parse(req.body);
        const subscription = subscriptionSvc.create(input);
        res.status(201).json({ id: subscription.id });
      } catch (err) {
        if (err instanceof ZodError) {
          next(new ValidationError('Invalid request body', err.flatten()));
        } else {
          next(err);
        }
      }
    },

    remove(req: Request, res: Response, next: NextFunction): void {
      try {
        subscriptionSvc.delete(String(req.params.id));
        res.status(204).send();
      } catch (err) {
        next(err);
      }
    },

    list(req: Request, res: Response, next: NextFunction): void {
      try {
        const parsed = paginationSchema.safeParse(req.query);
        if (!parsed.success) {
          next(new ValidationError('Invalid pagination params', parsed.error.flatten()));
          return;
        }
        const { page, limit } = parsed.data;
        res.status(200).json(subscriptionSvc.list(page, limit));
      } catch (err) {
        next(err);
      }
    },

    getDeliveries(req: Request, res: Response, next: NextFunction): void {
      try {
        const id = String(req.params.id);
        subscriptionSvc.getById(id); // verifies the subscription exists

        const parsed = paginationSchema.safeParse(req.query);
        if (!parsed.success) {
          next(new ValidationError('Invalid pagination params', parsed.error.flatten()));
          return;
        }
        const { page, limit } = parsed.data;
        res.status(200).json(deliverySvc.getHistory(id, page, limit));
      } catch (err) {
        next(err);
      }
    },
  };
}
