import React from 'react';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireAdminPermission } from '@/lib/auth';
import { MembershipsAdminClient } from '@/components/admin/MembershipsAdminClient';

export const dynamic = 'force-dynamic';

export default async function AdminMembershipsPage() {
  try {
    await requireAdminPermission('memberships', 'read');
  } catch {
    redirect('/admin/dashboard');
  }

  const [plans, members] = await Promise.all([
    prisma.membershipPlan.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: { select: { memberships: true } },
      },
    }),
    prisma.membership.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { include: { profile: true } },
        plan: true,
        card: true,
      },
    }),
  ]);

  const formattedPlans = plans.map((p) => ({
    id: p.id,
    slug: p.slug,
    nameEn: p.nameEn,
    nameSw: p.nameSw,
    billingCycle: p.billingCycle,
    priceKesCents: p.priceKesCents,
    merchDiscountPercent: p.merchDiscountPercent,
    welcomeLoyaltyPoints: p.welcomeLoyaltyPoints,
    isActive: p.isActive,
    memberCount: p._count.memberships,
  }));

  const formattedMembers = members.map((m) => ({
    id: m.id,
    membershipNumber: m.membershipNumber,
    status: m.status,
    startsAt: m.startsAt ? m.startsAt.toISOString() : null,
    expiresAt: m.expiresAt ? m.expiresAt.toISOString() : null,
    createdAt: m.createdAt.toISOString(),
    user: {
      email: m.user.email,
      phone: m.user.phone,
      profile: m.user.profile
        ? {
            firstName: m.user.profile.firstName,
            lastName: m.user.profile.lastName,
          }
        : null,
    },
    plan: {
      nameEn: m.plan.nameEn,
      priceKesCents: m.plan.priceKesCents,
    },
    card: m.card
      ? {
          cardIdentifier: m.card.cardIdentifier,
          validityStatus: m.card.validityStatus,
        }
      : null,
  }));

  return (
    <div className="space-y-6">
      <div className="border-b border-white/10 pb-4">
        <h1 className="editorial-headline font-black text-2xl text-white">
          Supporters&apos; Club &amp; Membership Management
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Review official club members, manage monthly and seasonal tiers, verify digital cards, and monitor supporter subscriptions.
        </p>
      </div>

      <MembershipsAdminClient plans={formattedPlans} members={formattedMembers} />
    </div>
  );
}
