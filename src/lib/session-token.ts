import crypto from 'crypto';

export interface SessionPayload {
  v: 1;
  uid: string;
  eml: string;
  scp: 'PUBLIC' | 'ADMIN';
  stf: boolean;
  rls: string[];
  iat: number;
  exp: number;
  nce: string;
}

export function getSessionSecret(): string {
  return (
    process.env.AUTH_SESSION_SECRET ||
    'dev-3kfc-embu-session-secret-key-3kfc2026-super-admin-stateless'
  );
}

export function signSessionPayload(payload: SessionPayload): string {
  const json = JSON.stringify(payload);
  const b64 = Buffer.from(json, 'utf8').toString('base64url');
  const sig = crypto
    .createHmac('sha256', getSessionSecret())
    .update(b64)
    .digest('base64url');
  return `${b64}.${sig}`;
}

export function verifySessionToken(token: string): SessionPayload | null {
  if (!token || typeof token !== 'string' || !token.includes('.')) {
    return null;
  }
  const parts = token.split('.');
  if (parts.length !== 2) {
    return null;
  }
  const [b64, sig] = parts;
  const expectedSig = crypto
    .createHmac('sha256', getSessionSecret())
    .update(b64)
    .digest('base64url');

  const bufProvided = Buffer.from(sig, 'utf8');
  const bufExpected = Buffer.from(expectedSig, 'utf8');
  if (
    bufProvided.length !== bufExpected.length ||
    !crypto.timingSafeEqual(bufProvided, bufExpected)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(b64, 'base64url').toString('utf8')
    ) as SessionPayload;
    if (
      payload.v !== 1 ||
      !payload.uid ||
      !payload.scp ||
      !payload.exp ||
      payload.exp * 1000 < Date.now()
    ) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function hashSessionToken(rawToken: string): string {
  const secret = getSessionSecret();
  return crypto.createHmac('sha256', secret).update(rawToken).digest('hex');
}
