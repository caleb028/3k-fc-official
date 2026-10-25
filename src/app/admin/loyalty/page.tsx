import React from 'react';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireAdminPermission } from '@/lib/auth';
import { LoyaltyAdminClient } from '@/components/admin/LoyaltyAdminClient';

export const dynamic = 'force-dynamic';

export default async function AdminLoyaltyPage() {
  try {
    await requireAdminPermission('loyalty', 'read');
  } catch {
    redirect('/admin/dashboard');
  }

  const [accounts, ledger, rewards] = await Promise.all([
    prisma.loyaltyAccount.findMany({
      orderBy: { balancePoints: 'desc' },
      include: {
        user: { include: { profile: true } },
      },
    }),
    prisma.loyaltyLedgerEntry.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        account: {
          include: { user: true },
        },
      },
    }),
    prisma.loyaltyReward.findMany({
      orderBy: { pointsCost: 'asc' },
    }),
  ]);

  const formattedAccounts = accounts.map((a) => ({
    id: a.id,
    userId: a.userId,
    balancePoints: a.balancePoints,
    lifetimePointsEarned: a.lifetimePointsEarned,
    user: {
      email: a.user.email,
      profile: a.user.profile
        ? {
            firstName: a.user.profile.firstName,
            lastName: a.user.profile.lastName,
          }
        : null,
    },
  }));

  const formattedLedger = ledger.map((l) => ({
    id: l.id,
    eventType: l.eventType,
    pointsDelta: l.pointsDelta,
    balanceAfter: l.balanceAfter,
    reason: l.reason,
    createdAt: l.createdAt.toISOString(),
    account: {
      user: { email: l.account.user.email },
    },
  }));

  const formattedRewards = rewards.map((r) => ({
    id: r.id,
    code: r.code,
    titleEn: r.titleEn,
    pointsCost: r.pointsCost,
    rewardType: r.rewardType,
    isActive: r.isActive,
  }));

  return (
    <div className="space-y-6">
      <div className="border-b border-white/10 pb-4">
        <h1 className="editorial-headline font-black text-2xl text-white">
          Loyalty Programme &amp; Ledger Audit
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Review fan reward balances, inspect immutable double-entry ledger transactions, execute manual point adjustments, and manage vouchers.
        </p>
      </div>

      <LoyaltyAdminClient accounts={formattedAccounts} ledger={formattedLedger} rewards={formattedRewards} />
    </div>
  );
}
