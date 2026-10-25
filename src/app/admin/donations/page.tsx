import React from 'react';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireAdminPermission } from '@/lib/auth';
import { DonationsAdminClient } from '@/components/admin/DonationsAdminClient';

export const dynamic = 'force-dynamic';

export default async function AdminDonationsPage() {
  try {
    await requireAdminPermission('donations', 'read');
  } catch {
    redirect('/admin/dashboard');
  }

  const [campaigns, donations] = await Promise.all([
    prisma.donationCampaign.findMany({
      orderBy: { createdAt: 'desc' },
    }),
    prisma.donation.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        campaign: true,
        receipt: true,
      },
    }),
  ]);

  const formattedCampaigns = campaigns.map((c) => ({
    id: c.id,
    slug: c.slug,
    titleEn: c.titleEn,
    targetKesCents: c.targetKesCents,
    confirmedTotalKesCents: c.confirmedTotalKesCents,
    confirmedDonorCount: c.confirmedDonorCount,
    isActive: c.isActive,
  }));

  const formattedDonations = donations.map((d) => ({
    id: d.id,
    donorName: d.donorName,
    donorEmail: d.donorEmail,
    donorPhone: d.donorPhone,
    amountKesCents: d.amountKesCents,
    paymentMethod: d.paymentMethod,
    status: d.status,
    isAnonymous: d.isAnonymous,
    publicRecognitionConsent: d.publicRecognitionConsent,
    supporterMessage: d.supporterMessage,
    confirmedAt: d.confirmedAt ? d.confirmedAt.toISOString() : null,
    createdAt: d.createdAt.toISOString(),
    campaign: { titleEn: d.campaign.titleEn },
    receipt: d.receipt ? { receiptNumber: d.receipt.receiptNumber } : null,
  }));

  return (
    <div className="space-y-6">
      <div className="border-b border-white/10 pb-4">
        <h1 className="editorial-headline font-black text-2xl text-white">
          Supporter Donations &amp; Community Funds
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Review community contribution records with strict accounting separation between confirmed funds and pending pledges.
        </p>
      </div>

      <DonationsAdminClient campaigns={formattedCampaigns} donations={formattedDonations} />
    </div>
  );
}
