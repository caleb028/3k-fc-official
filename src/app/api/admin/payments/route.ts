import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdminPermission } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';

const reconcileSchema = z.object({
  transactionId: z.string().min(1),
  verifiedStatus: z.enum(['SUCCESS', 'FAILED', 'CANCELLED']),
  mpesaReceiptNumber: z.string().optional().nullable(),
  notes: z.string().min(3),
});

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdminPermission('payments', 'reconcile');
    const body = await req.json();
    const action = body.action;

    if (action === 'RECONCILE') {
      const parsed = reconcileSchema.safeParse(body.payload);
      if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid reconciliation parameters', issues: parsed.error.flatten() }, { status: 400 });
      }

      const tx = await prisma.paymentTransaction.findUnique({
        where: { id: parsed.data.transactionId },
      });
      if (!tx) {
        return NextResponse.json({ error: 'Payment transaction not found' }, { status: 404 });
      }

      const previousStatus = tx.status;
      const updated = await prisma.paymentTransaction.update({
        where: { id: tx.id },
        data: {
          status: parsed.data.verifiedStatus,
          mpesaReceiptNumber: parsed.data.mpesaReceiptNumber || tx.mpesaReceiptNumber,
          confirmedAt: parsed.data.verifiedStatus === 'SUCCESS' ? new Date() : tx.confirmedAt,
        },
      });

      await prisma.paymentReconciliation.create({
        data: {
          transactionId: tx.id,
          verifiedBy: `FINANCE_OFFICER_AUDIT (${admin.email})`,
          previousStatus,
          verifiedStatus: parsed.data.verifiedStatus,
          notes: parsed.data.notes,
        },
      });

      await recordAuditLog({
        actorId: admin.id,
        actorEmail: admin.email,
        actorRole: admin.roles[0],
        action: 'PAYMENT_MANUALLY_RECONCILED',
        targetType: 'PaymentTransaction',
        targetId: tx.id,
        before: tx,
        after: updated,
        reason: parsed.data.notes,
      });

      return NextResponse.json({ success: true, transaction: updated });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to reconcile payment' },
      { status: 403 }
    );
  }
}
