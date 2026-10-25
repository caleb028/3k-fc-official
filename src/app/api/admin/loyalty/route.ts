import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdminPermission } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';
import { awardOrAdjustLoyaltyPoints } from '@/lib/loyalty/service';

const adjustLoyaltySchema = z.object({
  userId: z.string().min(1),
  pointsDelta: z.number().int(),
  reason: z.string().min(3),
});

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdminPermission('loyalty', 'update');
    const body = await req.json();
    const action = body.action;

    if (action === 'MANUAL_ADJUSTMENT') {
      const parsed = adjustLoyaltySchema.safeParse(body.payload);
      if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid parameters', issues: parsed.error.flatten() }, { status: 400 });
      }

      const result = await awardOrAdjustLoyaltyPoints({
        userId: parsed.data.userId,
        idempotencyKey: `admin-adj-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        pointsDelta: parsed.data.pointsDelta,
        eventType: 'ADMIN_MANUAL_ADJUSTMENT',
        reason: `${parsed.data.reason} (Authorized by ${admin.email})`,
        authorizedByUserId: admin.id,
      });

      await recordAuditLog({
        actorId: admin.id,
        actorEmail: admin.email,
        actorRole: admin.roles[0],
        action: 'LOYALTY_POINTS_MANUALLY_ADJUSTED',
        targetType: 'LoyaltyAccount',
        targetId: parsed.data.userId,
        after: result,
        reason: parsed.data.reason,
      });

      return NextResponse.json({ success: true, result });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to adjust loyalty points' },
      { status: 403 }
    );
  }
}
