import { describe, it, expect } from 'vitest';
import { createHmac } from 'crypto';
import { signPayload } from '../lib/hmac.js';

describe('signPayload', () => {
  it('returns a sha256= prefixed hex signature', () => {
    const result = signPayload('mysecret', '{"hello":"world"}');
    expect(result).toMatch(/^sha256=[a-f0-9]{64}$/);
  });

  it('produces the correct HMAC value', () => {
    const secret = 'supersecret';
    const body = '{"type":"token.revoked","payload":{}}';
    const expected = `sha256=${createHmac('sha256', secret).update(body, 'utf8').digest('hex')}`;
    expect(signPayload(secret, body)).toBe(expected);
  });

  it('produces different signatures for different secrets', () => {
    const body = '{"type":"app.discovered","payload":{}}';
    const sig1 = signPayload('secretA', body);
    const sig2 = signPayload('secretB', body);
    expect(sig1).not.toBe(sig2);
  });

  it('produces different signatures for different bodies', () => {
    const secret = 'sharedSecret';
    const sig1 = signPayload(secret, '{"type":"app.discovered"}');
    const sig2 = signPayload(secret, '{"type":"token.revoked"}');
    expect(sig1).not.toBe(sig2);
  });
});
