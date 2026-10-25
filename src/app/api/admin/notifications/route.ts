import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdminPermission } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';

const broadcastSchema = z.object({
  category: z.enum(['FIXTURE_REMINDER', 'KICKOFF_ALERT', 'GOAL_RESULT', 'TICKET_CONFIRMATION', 'MEMBERSHIP_RENEWAL', 'ORDER_STATUS', 'CLUB_ANNOUNCEMENT']),
  titleEn: z.string().min(3),
  titleSw: z.string().optional().nullable(),
  bodyEn: z.string().min(5),
  bodySw: z.string().optional().nullable(),
  actionUrl: z.string().optional().nullable(),
  channels: z.array(z.enum(['WEB_PUSH', 'EMAIL', 'SMS', 'WHATSAPP'])).min(1),
});

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdminPermission('notifications', 'publish');
    const raw = await req.json();
    const parsed = broadcastSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid broadcast parameters', issues: parsed.error.flatten() }, { status: 400 });
    }

    const notif = await prisma.notification.create({
      data: {
        category: parsed.data.category,
        titleEn: parsed.data.titleEn,
        titleSw: parsed.data.titleSw,
        bodyEn: parsed.data.bodyEn,
        bodySw: parsed.data.bodySw,
        actionUrl: parsed.data.actionUrl,
      },
    });

    // Create queued delivery records for the selected channels
    for (const ch of parsed.data.channels) {
      await prisma.notificationDelivery.create({
        data: {
          notificationId: notif.id,
          channel: ch,
          recipientAddress: 'ALL_ACTIVE_SUBSCRIBERS',
          status: 'QUEUED',
        },
      });
    }

    await recordAuditLog({
      actorId: admin.id,
      actorEmail: admin.email,
      actorRole: admin.roles[0],
      action: 'NOTIFICATION_BROADCAST_QUEUED',
      targetType: 'Notification',
      targetId: notif.id,
      after: { ...notif, channels: parsed.data.channels },
      reason: `Broadcast alert [${notif.category}] dispatched across ${parsed.data.channels.join(', ')} by ${admin.email}`,
    });

    return NextResponse.json({ success: true, notification: notif });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to broadcast notification' },
      { status: 403 }
    );
  }
}
