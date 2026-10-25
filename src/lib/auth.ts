import crypto from 'crypto';
import { cookies } from 'next/headers';
import { prisma } from './prisma';
import { hasRolePermission, ResourceKey, ActionKey } from './rbac';
import { recordAuditLog } from './audit';

export const FAN_SESSION_COOKIE = '3kfc_fan_session';
export const ADMIN_SESSION_COOKIE = '3kfc_admin_session';

const loginAttemptBucket = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(key: string, maxRequests = 8, windowMs = 60_000): boolean {
  const now = Date.now();
  const existing = loginAttemptBucket.get(key);
  if (!existing || existing.resetAt <= now) {
    loginAttemptBucket.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (existing.count >= maxRequests) {
    return false;
  }
  existing.count += 1;
  return true;
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100_000, 64, 'sha512').toString('hex');
  return `pbkdf2_sha512$100000$${salt}$${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split('$');
  if (parts.length !== 4 || parts[0] !== 'pbkdf2_sha512') {
    return false;
  }
  const iterations = parseInt(parts[1], 10);
  const salt = parts[2];
  const expectedHash = parts[3];
  const computed = crypto.pbkdf2Sync(password, salt, iterations, 64, 'sha512').toString('hex');
  const bufExpected = Buffer.from(expectedHash, 'hex');
  const bufComputed = Buffer.from(computed, 'hex');
  if (bufExpected.length !== bufComputed.length) return false;
  return crypto.timingSafeEqual(bufExpected, bufComputed);
}

export function hashSessionToken(rawToken: string): string {
  const secret = process.env.AUTH_SESSION_SECRET || 'dev-3kfc-embu-session-secret-key';
  return crypto.createHmac('sha256', secret).update(rawToken).digest('hex');
}

export async function createSession(
  userId: string,
  scope: 'PUBLIC' | 'ADMIN',
  ipAddress?: string,
  userAgent?: string
): Promise<string> {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashSessionToken(rawToken);
  const durationHours = scope === 'ADMIN' ? 12 : 24 * 14;
  const expiresAt = new Date(Date.now() + durationHours * 3600 * 1000);

  await prisma.session.create({
    data: {
      tokenHash,
      userId,
      scope,
      ipAddress: ipAddress ?? null,
      userAgent: userAgent ?? null,
      expiresAt,
    },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { lastLoginAt: new Date() },
  });

  return rawToken;
}

export async function getAuthenticatedUser(scope: 'PUBLIC' | 'ADMIN' = 'PUBLIC') {
  try {
    const cookieStore = await cookies();
    const cookieName = scope === 'ADMIN' ? ADMIN_SESSION_COOKIE : FAN_SESSION_COOKIE;
    const rawToken = cookieStore.get(cookieName)?.value;
    if (!rawToken) return null;

    const tokenHash = hashSessionToken(rawToken);
    const session = await prisma.session.findUnique({
      where: { tokenHash },
      include: {
        user: {
          include: {
            profile: true,
            userRoles: {
              include: { role: true },
            },
          },
        },
      },
    });

    if (!session || session.scope !== scope || session.expiresAt < new Date()) {
      return null;
    }

    if (session.user.status !== 'ACTIVE') {
      return null;
    }

    const roleSlugs = session.user.userRoles.map((ur) => ur.role.slug);
    return {
      id: session.user.id,
      email: session.user.email,
      phone: session.user.phone,
      isStaff: session.user.isStaff,
      profile: session.user.profile,
      roles: roleSlugs,
    };
  } catch {
    return null;
  }
}

export async function requireAdminPermission(resource: ResourceKey, action: ActionKey) {
  const user = await getAuthenticatedUser('ADMIN');
  if (!user || !user.isStaff) {
    throw new Error('UNAUTHENTICATED_ADMIN: Staff authentication required.');
  }
  const permitted = hasRolePermission(user.roles, resource, action);
  if (!permitted) {
    throw new Error(`FORBIDDEN_ADMIN: Role [${user.roles.join(', ')}] lacks permission [${resource}:${action}].`);
  }
  return user;
}

/**
 * Controlled First-Run Super Administrator Provisioning
 * No hardcoded admin passwords in source code. Requires valid ADMIN_BOOTSTRAP_TOKEN
 * and only runs if zero SUPER_ADMIN users exist in the database.
 */
export async function bootstrapSuperAdmin(params: {
  bootstrapToken: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}) {
  const expectedToken = process.env.ADMIN_BOOTSTRAP_TOKEN;
  if (!expectedToken || params.bootstrapToken !== expectedToken) {
    throw new Error('Invalid administrator bootstrap token.');
  }

  if (params.password.length < 10) {
    throw new Error('Super Administrator password must be at least 10 characters long.');
  }

  const existingSuperAdmin = await prisma.userRole.findFirst({
    where: {
      role: { slug: 'SUPER_ADMIN' },
    },
  });

  if (existingSuperAdmin) {
    throw new Error('A Super Administrator account has already been provisioned on this platform.');
  }

  let superRole = await prisma.role.findUnique({ where: { slug: 'SUPER_ADMIN' } });
  if (!superRole) {
    superRole = await prisma.role.create({
      data: {
        slug: 'SUPER_ADMIN',
        name: 'Super Administrator',
        description: 'Platform owner with full access management and audit authority.',
        isSystem: true,
      },
    });
  }

  const passwordHash = hashPassword(params.password);
  const user = await prisma.user.create({
    data: {
      email: params.email.toLowerCase().trim(),
      passwordHash,
      isStaff: true,
      status: 'ACTIVE',
      profile: {
        create: {
          firstName: params.firstName.trim(),
          lastName: params.lastName.trim(),
          displayName: `${params.firstName.trim()} ${params.lastName.trim()}`,
          county: 'Embu',
        },
      },
      userRoles: {
        create: {
          roleId: superRole.id,
          assignedBy: 'FIRST_RUN_BOOTSTRAP',
        },
      },
    },
  });

  await recordAuditLog({
    actorId: user.id,
    actorEmail: user.email,
    actorRole: 'SUPER_ADMIN',
    action: 'SUPER_ADMIN_PROVISIONED',
    targetType: 'User',
    targetId: user.id,
    after: { email: user.email, role: 'SUPER_ADMIN' },
    reason: 'Controlled first-run Super Administrator bootstrap',
  });

  return user;
}
