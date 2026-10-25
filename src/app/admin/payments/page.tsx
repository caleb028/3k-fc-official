import React from 'react';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireAdminPermission } from '@/lib/auth';
import { PaymentsAdminClient } from '@/components/admin/PaymentsAdminClient';

export const dynamic = 'force-dynamic';

export default async function AdminPaymentsPage() {
  try {
    await requireAdminPermission('payments', 'read');
  } catch {
    redirect('/admin/dashboard');
  }

  const transactions = await prisma.paymentTransaction.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  const formatted = transactions.map((t) => ({
    id: t.id,
    reference: t.reference,
    provider: t.provider,
    environment: t.environment,
    purpose: t.purpose,
    phoneNormalized: t.phoneNormalized,
    amountKesCents: t.amountKesCents,
    providerFeeKesCents: t.providerFeeKesCents,
    netProceedsKesCents: t.netProceedsKesCents,
    mpesaReceiptNumber: t.mpesaReceiptNumber,
    status: t.status,
    resultDescription: t.resultDescription,
    confirmedAt: t.confirmedAt ? t.confirmedAt.toISOString() : null,
    createdAt: t.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div className="border-b border-white/10 pb-4">
        <h1 className="editorial-headline font-black text-2xl text-white">
          Payments &amp; Financial Reconciliation
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Inspect incoming M-Pesa Daraja STK Push transactions, merchant requests, receipts, gross amounts, provider fees, and execute finance audits.
        </p>
      </div>

      <PaymentsAdminClient transactions={formatted} />
    </div>
  );
}
