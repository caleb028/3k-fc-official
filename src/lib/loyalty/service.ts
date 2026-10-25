import { prisma } from '../prisma';
import { recordAuditLog } from '../audit';

/**
 * Auditable Loyalty Points Engine
 * Section 13 Rules:
 * - Never award points based only on an unverified frontend event.
 * - Reverse or adjust points after refunds or charge reversals where applicable.
 * - Prevent duplicate event processing (via idempotencyKey).
 * - Maintain an immutable or auditable points ledger.
 * - Record the reason for every points adjustment.
 * - Restrict manual point changes to authorised personnel.
 */

export async function awardOrAdjustLoyaltyPoints(params: {
  userId: string;
  idempotencyKey: string;
  eventType:
    | 'MATCH_ATTENDANCE_VERIFIED'
    | 'SHOP_ORDER_COMPLETED'
    | 'MEMBERSHIP_ACTIVATED'
    | 'REWARD_REDEEMED'
    | 'REFUND_REVERSAL'
    | 'ADMIN_MANUAL_ADJUSTMENT';
  pointsDelta: number;
  reason: string;
  sourceReferenceId?: string;
  authorizedByUserId?: string;
}) {
  if (!Number.isInteger(params.pointsDelta) || params.pointsDelta === 0) {
    throw new Error('Points delta must be a non-zero integer.');
  }
  if (!params.reason || params.reason.trim().length < 4) {
    throw new Error('A clear reason is required for every loyalty points ledger entry.');
  }
  if (params.eventType === 'ADMIN_MANUAL_ADJUSTMENT' && !params.authorizedByUserId) {
    throw new Error('Manual loyalty point adjustments require an authorized staff actor ID.');
  }

  return prisma.$transaction(async (tx) => {
    // 1. Check idempotency key to prevent duplicate event processing
    const existingEntry = await tx.loyaltyLedgerEntry.findUnique({
      where: { idempotencyKey: params.idempotencyKey },
    });
    if (existingEntry) {
      return { entry: existingEntry, duplicateIgnored: true };
    }

    // 2. Ensure LoyaltyAccount exists for user
    let account = await tx.loyaltyAccount.findUnique({
      where: { userId: params.userId },
    });
    if (!account) {
      account = await tx.loyaltyAccount.create({
        data: {
          userId: params.userId,
          balancePoints: 0,
          lifetimePointsEarned: 0,
        },
      });
    }

    const nextBalance = account.balancePoints + params.pointsDelta;
    if (params.eventType === 'REWARD_REDEEMED' && nextBalance < 0) {
      throw new Error('INSUFFICIENT_LOYALTY_POINTS: Supporter does not have enough points for this redemption.');
    }

    const updatedBalance = Math.max(0, nextBalance);
    const updatedLifetime =
      params.pointsDelta > 0
        ? account.lifetimePointsEarned + params.pointsDelta
        : account.lifetimePointsEarned;

    await tx.loyaltyAccount.update({
      where: { id: account.id },
      data: {
        balancePoints: updatedBalance,
        lifetimePointsEarned: updatedLifetime,
      },
    });

    const entry = await tx.loyaltyLedgerEntry.create({
      data: {
        accountId: account.id,
        idempotencyKey: params.idempotencyKey,
        eventType: params.eventType,
        pointsDelta: params.pointsDelta,
        balanceAfter: updatedBalance,
        reason: params.reason.trim(),
        sourceReferenceId: params.sourceReferenceId ?? null,
        authorizedByUserId: params.authorizedByUserId ?? null,
      },
    });

    return { entry, duplicateIgnored: false };
  });
}

export async function reversePointsForRefund(params: {
  userId: string;
  refundReferenceId: string;
  pointsToReverse: number;
  reason: string;
}) {
  const result = await awardOrAdjustLoyaltyPoints({
    userId: params.userId,
    idempotencyKey: `refund-rev-${params.refundReferenceId}`,
    eventType: 'REFUND_REVERSAL',
    pointsDelta: -Math.abs(params.pointsToReverse),
    reason: params.reason,
    sourceReferenceId: params.refundReferenceId,
  });

  await recordAuditLog({
    action: 'LOYALTY_POINTS_REVERSED_ON_REFUND',
    targetType: 'LoyaltyAccount',
    targetId: params.userId,
    after: { pointsDelta: -Math.abs(params.pointsToReverse), reason: params.reason },
  });

  return result;
}
