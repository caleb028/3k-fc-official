import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdminPermission } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';

const activateMembershipSchema = z.object({
  membershipId: z.string().min(1),
  status: z.enum(['ACTIVE', 'EXPIRED', 'CANCELLED']),
  durationDays: z.number().int().min(1).default(365),
  reason: z.string().min(2),
});

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdminPermission('memberships', 'update');
    const body = await req.json();
    const action = body.action;

    if (action === 'SET_STATUS') {
      const parsed = activateMembershipSchema.safeParse(body.payload);
      if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid parameters', issues: parsed.error.flatten() }, { status: 400 });
      }

      const membership = await prisma.membership.findUnique({
        where: { id: parsed.data.membershipId },
        include: { user: true, plan: true },
      });
      if (!membership) {
        return NextResponse.json({ error: 'Membership not found' }, { status: 404 });
      }

      const now = new Date();
      const expires = new Date(now.getTime() + parsed.data.durationDays * 24 * 60 * 60 * 1000);

      const updated = await prisma.membership.update({
        where: { id: membership.id },
        data: {
          status: parsed.data.status,
          startsAt: parsed.data.status === 'ACTIVE' ? now : membership.startsAt,
          expiresAt: parsed.data.status === 'ACTIVE' ? expires : membership.expiresAt,
        },
      });

      await recordAuditLog({
        actorId: admin.id,
        actorEmail: admin.email,
        actorRole: admin.roles[0],
        action: 'MEMBERSHIP_STATUS_UPDATED',
        targetType: 'Membership',
        targetId: membership.id,
        before: membership,
        after: updated,
        reason: `${parsed.data.reason} by ${admin.email}`,
      });

      return NextResponse.json({ success: true, membership: updated });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to update membership' },
      { status: 403 }
    );
  }
}
