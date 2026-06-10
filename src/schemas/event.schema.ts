import { z } from 'zod';
import { KNOWN_EVENT_TYPES } from '../types/index.js';

export const ingestEventSchema = z.object({
  type: z.enum(KNOWN_EVENT_TYPES, {
    errorMap: () => ({
      message: `type must be one of: ${KNOWN_EVENT_TYPES.join(', ')}`,
    }),
  }),
  payload: z.record(z.unknown()),
});

export type IngestEventInput = z.infer<typeof ingestEventSchema>;
