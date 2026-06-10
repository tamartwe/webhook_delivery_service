import { z } from 'zod';
import { KNOWN_EVENT_TYPES } from '../types/index.js';

export const createSubscriptionSchema = z.object({
  targetUrl: z.string().url({ message: 'targetUrl must be a valid URL' }),
  events: z
    .array(z.enum(KNOWN_EVENT_TYPES))
    .min(1, { message: 'At least one event type is required' }),
  secret: z.string().optional(),
});

export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;
