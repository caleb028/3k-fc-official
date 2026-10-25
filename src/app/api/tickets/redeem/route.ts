import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { validateAndRedeemTicketAtGate } from '@/lib/tickets/service';
import { requireAdminPermission } from '@/lib/auth';

const redeemSchema = z.object({
  qrTokenOrTicketCode: z.string().min(4),
  assignedFixtureId: z.string().min(1),
  gateName: z.string().min(2).default('Main Gate A — Moi Stadium'),
  wasOfflineSync: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  try {
    // Enforce server-side Gate Staff / Ticketing Manager / Super Admin RBAC permission
    const staff = await requireAdminPermission('gate', 'redeem');

    const raw = await req.json();
    const parsed = redeemSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid gate scan payload.' }, { status: 400 });
    }

    const scanResult = await validateAndRedeemTicketAtGate({
      qrTokenOrTicketCode: parsed.data.qrTokenOrTicketCode,
      assignedFixtureId: parsed.data.assignedFixtureId,
      gateName: parsed.data.gateName,
      staffUserId: staff.id,
      staffName: staff.profile?.displayName || staff.email,
      wasOfflineSync: parsed.data.wasOfflineSync,
    });

    return NextResponse.json(scanResult);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unauthorized gate scan attempt.';
    const status = msg.startsWith('UNAUTHENTICATED') ? 401 : msg.startsWith('FORBIDDEN') ? 403 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
