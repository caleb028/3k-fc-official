import React from 'react';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireAdminPermission } from '@/lib/auth';
import { SponsorsAdminClient } from '@/components/admin/SponsorsAdminClient';

export const dynamic = 'force-dynamic';

export default async function AdminSponsorsPage() {
  try {
    await requireAdminPermission('sponsors', 'read');
  } catch {
    redirect('/admin/dashboard');
  }

  const [sponsors, enquiries] = await Promise.all([
    prisma.sponsor.findMany({
      orderBy: { displayPriority: 'asc' },
    }),
    prisma.sponsorEnquiry.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
  ]);

  const formattedSponsors = sponsors.map((s) => ({
    id: s.id,
    slug: s.slug,
    businessName: s.businessName,
    category: s.category,
    descriptionEn: s.descriptionEn,
    websiteUrl: s.websiteUrl,
    contractStatus: s.contractStatus,
    verificationNote: s.verificationNote,
    displayPriority: s.displayPriority,
    isPublished: s.isPublished,
  }));

  const formattedEnquiries = enquiries.map((e) => ({
    id: e.id,
    organisation: e.organisation,
    contactPerson: e.contactPerson,
    businessEmail: e.businessEmail,
    phone: e.phone,
    partnershipInterest: e.partnershipInterest,
    budgetRange: e.budgetRange,
    message: e.message,
    status: e.status,
    createdAt: e.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div className="border-b border-white/10 pb-4">
        <h1 className="editorial-headline font-black text-2xl text-white">
          Sponsors &amp; Commercial Partnerships
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Manage commercial brand showcases, verify partner contract statuses, configure Mozzart Bet Kenya placement, and process inbound corporate enquiries.
        </p>
      </div>

      <SponsorsAdminClient sponsors={formattedSponsors} enquiries={formattedEnquiries} />
    </div>
  );
}
