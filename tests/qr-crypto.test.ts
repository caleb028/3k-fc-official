import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import { generateTicketCode, signTicketPayload, verifyTicketToken, QrTicketPayload } from '@/lib/tickets/qr-crypto';

describe('HMAC-SHA256 Signed QR Ticket Security', () => {
  const samplePayload: QrTicketPayload = {
    v: 1,
    tkt: '3K-TKT-A9B8C7D6',
    ord: 'ord-12345',
    fix: 'fix-98765',
    cat: 'cat-vip-01',
    iat: Math.floor(Date.now() / 1000),
    nce: crypto.randomBytes(8).toString('hex'),
  };

  it('generates unpredictable ticket codes prefixed with 3K-TKT-', () => {
    const code1 = generateTicketCode();
    const code2 = generateTicketCode();
    expect(code1).toMatch(/^3K-TKT-[A-F0-9]{10}$/);
    expect(code2).toMatch(/^3K-TKT-[A-F0-9]{10}$/);
    expect(code1).not.toBe(code2);
  });

  it('signs and verifies a valid ticket payload successfully', () => {
    const token = signTicketPayload(samplePayload);
    expect(token).toContain('.');

    const result = verifyTicketToken(token);
    expect(result.validSignature).toBe(true);
    expect(result.payload).not.toBeNull();
    expect(result.payload?.tkt).toBe('3K-TKT-A9B8C7D6');
    expect(result.payload?.fix).toBe('fix-98765');
  });

  it('detects and rejects payload tampering immediately', () => {
    const token = signTicketPayload(samplePayload);
    const [payloadB64, sig] = token.split('.');

    // Tamper with payload (change ticket code inside payload)
    const decoded = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    decoded.tkt = '3K-TKT-FORGED99';
    const tamperedB64 = Buffer.from(JSON.stringify(decoded)).toString('base64url');
    const tamperedToken = `${tamperedB64}.${sig}`;

    const result = verifyTicketToken(tamperedToken);
    expect(result.validSignature).toBe(false);
    expect(result.payload).toBeNull();
  });

  it('detects and rejects forged signature', () => {
    const token = signTicketPayload(samplePayload);
    const [payloadB64] = token.split('.');
    const forgedToken = `${payloadB64}.fakeSignatureInvalid123456789`;

    const result = verifyTicketToken(forgedToken);
    expect(result.validSignature).toBe(false);
    expect(result.payload).toBeNull();
  });

  it('ensures zero PII (names, emails, phones) exists in signed QR payload', () => {
    const token = signTicketPayload(samplePayload);
    const [payloadB64] = token.split('.');
    const decoded = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));

    expect(decoded).not.toHaveProperty('name');
    expect(decoded).not.toHaveProperty('email');
    expect(decoded).not.toHaveProperty('phone');
    expect(decoded).not.toHaveProperty('buyerName');
  });
});
