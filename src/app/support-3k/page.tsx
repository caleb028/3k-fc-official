import React from 'react';
import { prisma } from '@/lib/prisma';
import { DonationClient } from '@/components/donations/DonationClient';

export const dynamic = 'force-dynamic';

export default async function Support3kPage() {
  const campaign = await prisma.donationCampaign.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
  });

  if (!campaign) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-14 text-center">
        <h1 className="editorial-headline font-black text-3xl text-slate-900">
          Support 3K FC
        </h1>
        <p className="text-sm text-slate-600 mt-2">
          No active fundraising campaign is currently open.
        </p>
      </div>
    );
  }

  const [pendingCount, publicDonors] = await Promise.all([
    prisma.donation.count({
      where: { campaignId: campaign.id, status: 'PENDING' },
    }),
    prisma.donation.findMany({
      where: {
        campaignId: campaign.id,
        status: 'CONFIRMED',
        isAnonymous: false,
        publicRecognitionConsent: true,
      },
      orderBy: { confirmedAt: 'desc' },
      take: 10,
    }),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 md:py-14">
      <div className="border-b-2 border-slate-900 pb-6 mb-8">
        <p className="athletic-label text-xs font-extrabold text-club-primary">
          Official Club Support &amp; Financial Transparency
        </p>
        <h1 className="editorial-headline font-black text-3xl md:text-5xl text-slate-900 mt-1">
          Support 3K FC: Official Contributions
        </h1>
        <p className="text-sm text-slate-600 mt-2 max-w-2xl">
          Back 3K FC’s 2026/27 FKF Premier League campaign and youth development in Embu County. Confirmed contributions are separated from pending payments and receive an official club receipt.
        </p>
      </div>

      <DonationClient
        campaign={{
          id: campaign.id,
          slug: campaign.slug,
          titleEn: campaign.titleEn,
          purposeEn: campaign.purposeEn,
          disclaimerEn: campaign.disclaimerEn,
          targetKesCents: campaign.targetKesCents,
          confirmedTotalKesCents: campaign.confirmedTotalKesCents,
          confirmedDonorCount: campaign.confirmedDonorCount,
          pendingCount,
        }}
        publicRecognizedDonors={publicDonors.map((d) => ({
          id: d.id,
          donorName: d.donorName,
          amountKesCents: d.amountKesCents,
          supporterMessage: d.supporterMessage,
          confirmedAt: d.confirmedAt?.toISOString() ?? null,
        }))}
      />
    </div>
  );
}
