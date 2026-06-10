import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { createSubscriptionSchema } from '../schemas/subscription.schema.js';
import { subscriptionService } from '../services/subscription.service.js';
import { deliveryService } from '../services/delivery.service.js';
import { ValidationError } from '../lib/errors.js';

export const subscriptionsController = {
  create(req: Request, res: Response, next: NextFunction): void {
    try {
      const input = createSubscriptionSchema.parse(req.body);
      const subscription = subscriptionService.create(input);
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
      subscriptionService.delete(req.params.id as string);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },

  list(_req: Request, res: Response, next: NextFunction): void {
    try {
      const subscriptions = subscriptionService.list();
      res.status(200).json(subscriptions);
    } catch (err) {
      next(err);
    }
  },

  getDeliveries(req: Request, res: Response, next: NextFunction): void {
    try {
      const id = req.params.id as string;
      subscriptionService.getById(id);
      const history = deliveryService.getHistory(id);
      res.status(200).json(history);
    } catch (err) {
      next(err);
    }
  },
};
