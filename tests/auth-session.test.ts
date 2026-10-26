import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import {
  signSessionPayload,
  verifySessionToken,
  SessionPayload,
} from '@/lib/session-token';

describe('Cryptographic Stateless Session Token Security', () => {
  const samplePayload: SessionPayload = {
    v: 1,
    uid: 'user-super-admin-01',
    eml: 'admin@3kfc.co.ke',
    scp: 'ADMIN',
    stf: true,
    rls: ['SUPER_ADMIN'],
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 12 * 3600,
    nce: crypto.randomBytes(12).toString('hex'),
  };

  it('signs and verifies an administration session token successfully', () => {
    const token = signSessionPayload(samplePayload);
    expect(token).toContain('.');

    const verified = verifySessionToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.v).toBe(1);
    expect(verified?.uid).toBe('user-super-admin-01');
    expect(verified?.eml).toBe('admin@3kfc.co.ke');
    expect(verified?.scp).toBe('ADMIN');
    expect(verified?.stf).toBe(true);
    expect(verified?.rls).toContain('SUPER_ADMIN');
  });

  it('detects and rejects payload tampering immediately', () => {
    const token = signSessionPayload(samplePayload);
    const [payloadB64, sig] = token.split('.');

    // Tamper with payload (escalate role or change user id)
    const decoded = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    decoded.uid = 'attacker-user-id';
    const tamperedB64 = Buffer.from(JSON.stringify(decoded)).toString('base64url');
    const tamperedToken = `${tamperedB64}.${sig}`;

    const result = verifySessionToken(tamperedToken);
    expect(result).toBeNull();
  });

  it('detects and rejects forged signature with wrong secret', () => {
    const token = signSessionPayload(samplePayload);
    const [payloadB64] = token.split('.');

    const forgedSig = crypto
      .createHmac('sha256', 'wrong-attacker-secret-key')
      .update(payloadB64)
      .digest('base64url');
    const forgedToken = `${payloadB64}.${forgedSig}`;

    const result = verifySessionToken(forgedToken);
    expect(result).toBeNull();
  });

  it('detects and rejects expired tokens', () => {
    const expiredPayload: SessionPayload = {
      ...samplePayload,
      iat: Math.floor(Date.now() / 1000) - 7200,
      exp: Math.floor(Date.now() / 1000) - 3600, // expired 1 hour ago
    };

    const token = signSessionPayload(expiredPayload);
    const result = verifySessionToken(token);
    expect(result).toBeNull();
  });

  it('rejects malformed token strings safely', () => {
    expect(verifySessionToken('')).toBeNull();
    expect(verifySessionToken('invalid-token')).toBeNull();
    expect(verifySessionToken('a.b.c')).toBeNull();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(verifySessionToken(null as any)).toBeNull();
  });
});
