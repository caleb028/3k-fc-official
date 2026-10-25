import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdminPermission, hashPassword } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional().nullable(),
  roleSlug: z.enum([
    'SUPER_ADMIN',
    'CLUB_EXECUTIVE',
    'MEDIA_MANAGER',
    'MATCHDAY_EDITOR',
    'TICKETING_MANAGER',
    'GATE_STAFF',
    'STORE_MANAGER',
    'MEMBERSHIP_MANAGER',
    'SPONSOR_MANAGER',
    'FINANCE_OFFICER',
  ]),
});

const updateStatusSchema = z.object({
  userId: z.string().min(1),
  status: z.enum(['ACTIVE', 'SUSPENDED']),
  reason: z.string().min(3),
});

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdminPermission('users', 'manage_roles');
    const body = await req.json();
    const action = body.action;

    if (action === 'CREATE_STAFF') {
      const parsed = createUserSchema.safeParse(body.payload);
      if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid user parameters', issues: parsed.error.flatten() }, { status: 400 });
      }

      const existing = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
      if (existing) {
        return NextResponse.json({ error: 'A user with this email already exists' }, { status: 409 });
      }

      const role = await prisma.role.findUnique({ where: { slug: parsed.data.roleSlug } });
      if (!role) {
        return NextResponse.json({ error: 'Role not found' }, { status: 404 });
      }

      const passwordHash = hashPassword(parsed.data.password);
      const user = await prisma.user.create({
        data: {
          email: parsed.data.email.toLowerCase(),
          passwordHash,
          phone: parsed.data.phone || null,
          isStaff: true,
          status: 'ACTIVE',
          profile: {
            create: {
              firstName: parsed.data.firstName,
              lastName: parsed.data.lastName,
            },
          },
          userRoles: {
            create: { roleId: role.id },
          },
        },
        include: { profile: true, userRoles: { include: { role: true } } },
      });

      await recordAuditLog({
        actorId: admin.id,
        actorEmail: admin.email,
        actorRole: admin.roles[0],
        action: 'STAFF_USER_CREATED',
        targetType: 'User',
        targetId: user.id,
        after: { email: user.email, role: parsed.data.roleSlug },
        reason: `New staff account provisioned for ${user.email} with role [${parsed.data.roleSlug}] by ${admin.email}`,
      });

      return NextResponse.json({ success: true, user: { id: user.id, email: user.email } });
    }

    if (action === 'UPDATE_STATUS') {
      const parsed = updateStatusSchema.safeParse(body.payload);
      if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid parameters', issues: parsed.error.flatten() }, { status: 400 });
      }

      const targetUser = await prisma.user.findUnique({ where: { id: parsed.data.userId } });
      if (!targetUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const updated = await prisma.user.update({
        where: { id: targetUser.id },
        data: { status: parsed.data.status },
      });

      await recordAuditLog({
        actorId: admin.id,
        actorEmail: admin.email,
        actorRole: admin.roles[0],
        action: 'USER_STATUS_UPDATED',
        targetType: 'User',
        targetId: targetUser.id,
        before: targetUser,
        after: updated,
        reason: parsed.data.reason,
      });

      return NextResponse.json({ success: true, user: updated });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to manage user' },
      { status: 403 }
    );
  }
}
