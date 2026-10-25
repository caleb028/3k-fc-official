import React from 'react';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireAdminPermission } from '@/lib/auth';
import { AuditLogsClient } from '@/components/admin/AuditLogsClient';

export const dynamic = 'force-dynamic';

export default async function AdminAuditLogsPage() {
  try {
    await requireAdminPermission('audit_logs', 'read');
  } catch {
    redirect('/admin/dashboard');
  }

  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 150,
  });

  const formatted = logs.map((l) => ({
    id: l.id,
    actorEmail: l.actorEmail,
    actorRole: l.actorRole,
    action: l.action,
    targetType: l.targetType,
    targetId: l.targetId,
    beforeJson: l.beforeJson,
    afterJson: l.afterJson,
    reason: l.reason,
    ipAddress: l.ipAddress,
    createdAt: l.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div className="border-b border-white/10 pb-4">
        <h1 className="editorial-headline font-black text-2xl text-white">
          Immutable System Audit Trail
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Cryptographically recorded log of back-office modifications, score updates, gate turnstile redemptions, palette confirmations, and role changes.
        </p>
      </div>

      <AuditLogsClient logs={formatted} />
    </div>
  );
}
