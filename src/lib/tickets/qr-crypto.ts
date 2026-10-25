import crypto from 'crypto';

/**
 * Signed QR Ticket Token Service
 * Section 10:
 * - Unique, unpredictable ticket identifier
 * - Signed or otherwise securely verifiable token
 * - Associated order and match
 * - Ticket category
 * - Validity status
 * - Issue timestamp
 * - Never encode sensitive personal information (PII) directly in a QR code.
 */
export interface QrTicketPayload {
  v: 1;
  tkt: string;  // Ticket Code e.g. "3K-TKT-A1B2C3D4"
  ord: string;  // Order ID
  fix: string;  // Fixture ID
  cat: string;  // Ticket Category ID
  iat: number;  // Issued At Unix timestamp (seconds)
  nce: string;  // Cryptographic random nonce (rotates on transfer)
}

function getSigningSecret(): string {
  return process.env.QR_TICKET_SIGNING_SECRET || 'dev-3kfc-embu-qr-hmac-secret-key-1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d';
}

export function generateTicketCode(): string {
  const randomBytes = crypto.randomBytes(5).toString('hex').toUpperCase();
  return `3K-TKT-${randomBytes}`;
}

export function signTicketPayload(payload: QrTicketPayload): string {
  const json = JSON.stringify(payload);
  const base64Payload = Buffer.from(json, 'utf8').toString('base64url');
  const signature = crypto
    .createHmac('sha256', getSigningSecret())
    .update(base64Payload)
    .digest('base64url');
  return `${base64Payload}.${signature}`;
}

export function verifyTicketToken(token: string): {
  validSignature: boolean;
  payload: QrTicketPayload | null;
} {
  if (!token || typeof token !== 'string' || !token.includes('.')) {
    return { validSignature: false, payload: null };
  }
  const parts = token.split('.');
  if (parts.length !== 2) {
    return { validSignature: false, payload: null };
  }
  const [base64Payload, providedSig] = parts;
  const expectedSig = crypto
    .createHmac('sha256', getSigningSecret())
    .update(base64Payload)
    .digest('base64url');

  const bufProvided = Buffer.from(providedSig, 'utf8');
  const bufExpected = Buffer.from(expectedSig, 'utf8');
  if (bufProvided.length !== bufExpected.length || !crypto.timingSafeEqual(bufProvided, bufExpected)) {
    return { validSignature: false, payload: null };
  }

  try {
    const decoded = JSON.parse(Buffer.from(base64Payload, 'base64url').toString('utf8')) as QrTicketPayload;
    if (decoded.v !== 1 || !decoded.tkt || !decoded.fix || !decoded.ord || !decoded.cat) {
      return { validSignature: false, payload: null };
    }
    return { validSignature: true, payload: decoded };
  } catch {
    return { validSignature: false, payload: null };
  }
}
