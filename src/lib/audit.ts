import { prisma } from './prisma';

export interface AuditLogInput {
  actorId?: string | null;
  actorEmail?: string | null;
  actorRole?: string | null;
  action: string;
  targetType: string;
  targetId: string;
  before?: unknown;
  after?: unknown;
  reason?: string;
  ipAddress?: string;
}

export async function recordAuditLog(input: AuditLogInput) {
  return prisma.auditLog.create({
    data: {
      actorId: input.actorId ?? null,
      actorEmail: input.actorEmail ?? 'system@3kfc.co.ke',
      actorRole: input.actorRole ?? 'SYSTEM',
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      beforeJson: input.before !== undefined ? JSON.stringify(input.before) : null,
      afterJson: input.after !== undefined ? JSON.stringify(input.after) : null,
      reason: input.reason ?? null,
      ipAddress: input.ipAddress ?? null,
    },
  });
}
