import { createHmac } from 'crypto';

/**
 * Signs a JSON body string with HMAC-SHA256.
 * Returns the header value in the format `sha256=<hex>`.
 */
export function signPayload(secret: string, body: string): string {
  const hex = createHmac('sha256', secret).update(body, 'utf8').digest('hex');
  return `sha256=${hex}`;
}
