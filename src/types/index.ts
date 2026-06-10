export const KNOWN_EVENT_TYPES = [
  'app.discovered',
  'privilege.escalation',
  'token.revoked',
] as const;

export type KnownEventType = (typeof KNOWN_EVENT_TYPES)[number];

export interface Subscription {
  id: string;
  targetUrl: string;
  events: KnownEventType[];
  secret?: string;
  createdAt: Date;
}

/** Safe for HTTP responses — secret is never exposed to callers. */
export type PublicSubscription = Omit<Subscription, 'secret'>;

export type DeliveryStatus = 'success' | 'failed';

export interface DeliveryAttempt {
  id: string;
  subscriptionId: string;
  eventType: KnownEventType;
  payload: Record<string, unknown>;
  attemptNumber: number;
  status: DeliveryStatus;
  httpStatus?: number;
  respondedAt: Date;
}
