import React from 'react';
import { redirect } from 'next/navigation';
import QRCode from 'qrcode';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';
import { FanAccountClient } from '@/components/account/FanAccountClient';

export const dynamic = 'force-dynamic';

export default async function FanAccountPage() {
  const user = await getAuthenticatedUser('PUBLIC');
  if (!user) {
    redirect('/login');
  }

  const [dbUser, tickets, memberships, shopOrders, loyalty, notificationPrefs, donations] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: user.id },
        include: { profile: true },
      }),
      prisma.ticket.findMany({
        where: { ownerUserId: user.id },
        orderBy: { issuedAt: 'desc' },
        include: {
          category: true,
          fixture: { include: { homeClub: true, awayClub: true } },
        },
      }),
      prisma.membership.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        include: { plan: true, card: true },
      }),
      prisma.shopOrder.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        include: { deliveryOption: true, fulfilment: true },
      }),
      prisma.loyaltyAccount.findUnique({
        where: { userId: user.id },
        include: {
          ledgerEntries: { orderBy: { createdAt: 'desc' }, take: 15 },
        },
      }),
      prisma.notificationPreference.findMany({
        where: { userId: user.id },
      }),
      prisma.donation.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        include: { receipt: true },
      }),
    ]);

  const ticketsWithQr = [];
  for (const tkt of tickets) {
    const qrDataUrl = await QRCode.toDataURL(tkt.signedToken, { width: 220, margin: 1 }).catch(
      () => ''
    );
    ticketsWithQr.push({
      id: tkt.id,
      ticketCode: tkt.ticketCode,
      signedToken: tkt.signedToken,
      holderName: tkt.holderName,
      categoryName: tkt.category.nameEn,
      fixtureTitle: `${tkt.fixture.homeClub.name} vs ${tkt.fixture.awayClub.name}`,
      kickoffAt: tkt.fixture.kickoffAt.toISOString(),
      status: tkt.status,
      qrDataUrl,
    });
  }

  const accountData = {
    user: {
      id: user.id,
      email: user.email,
      phone: user.phone,
      profile: dbUser?.profile
        ? {
            firstName: dbUser.profile.firstName,
            lastName: dbUser.profile.lastName,
            displayName: dbUser.profile.displayName,
            county: dbUser.profile.county,
            supporterNumber: dbUser.profile.supporterNumber,
            preferredLanguage: dbUser.profile.preferredLanguage,
          }
        : null,
    },
    tickets: ticketsWithQr,
    memberships: memberships.map((m) => ({
      id: m.id,
      membershipNumber: m.membershipNumber,
      planName: m.plan.nameEn,
      status: m.status,
      expiresAt: m.expiresAt ? m.expiresAt.toISOString() : null,
      card: m.card
        ? {
            cardIdentifier: m.card.cardIdentifier,
            tierLabel: m.card.tierLabel,
            validityStatus: m.card.validityStatus,
          }
        : null,
    })),
    shopOrders: shopOrders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      totalKesCents: o.totalKesCents,
      status: o.status,
      createdAt: o.createdAt.toISOString(),
      deliveryName: o.deliveryOption.nameEn,
      fulfilmentStatus: o.fulfilment?.status,
    })),
    loyalty: loyalty
      ? {
          balancePoints: loyalty.balancePoints,
          lifetimePointsEarned: loyalty.lifetimePointsEarned,
          ledger: loyalty.ledgerEntries.map((l) => ({
            id: l.id,
            eventType: l.eventType,
            pointsDelta: l.pointsDelta,
            balanceAfter: l.balanceAfter,
            reason: l.reason,
            createdAt: l.createdAt.toISOString(),
          })),
        }
      : null,
    notificationPreferences: notificationPrefs.map((p) => ({
      channel: p.channel,
      category: p.category,
      enabled: p.enabled,
    })),
    donations: donations.map((d) => ({
      id: d.id,
      amountKesCents: d.amountKesCents,
      status: d.status,
      receiptNumber: d.receipt?.receiptNumber ?? null,
      createdAt: d.createdAt.toISOString(),
    })),
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 md:py-14">
      <FanAccountClient data={accountData} />
    </div>
  );
}
