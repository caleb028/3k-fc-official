import React from 'react';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireAdminPermission } from '@/lib/auth';
import { ResultsAdminClient } from '@/components/admin/ResultsAdminClient';

export const dynamic = 'force-dynamic';

export default async function AdminResultsPage() {
  try {
    await requireAdminPermission('results', 'read');
  } catch {
    redirect('/admin/dashboard');
  }

  const fixtures = await prisma.fixture.findMany({
    orderBy: { kickoffAt: 'desc' },
    include: {
      homeClub: true,
      awayClub: true,
    },
  });

  const formatted = fixtures.map((f) => ({
    id: f.id,
    slug: f.slug,
    homeClub: { name: f.homeClub.name, shortName: f.homeClub.shortName },
    awayClub: { name: f.awayClub.name, shortName: f.awayClub.shortName },
    status: f.status,
    homeScore: f.homeScore,
    awayScore: f.awayScore,
    halfTimeHomeScore: f.halfTimeHomeScore,
    halfTimeAwayScore: f.halfTimeAwayScore,
    kickoffAt: f.kickoffAt.toISOString(),
    attendance: f.attendance,
    refereeName: f.refereeName,
    highlightsVideoUrl: f.highlightsVideoUrl,
    resultUpdatedAt: f.resultUpdatedAt ? f.resultUpdatedAt.toISOString() : null,
  }));

  return (
    <div className="space-y-6">
      <div className="border-b border-white/10 pb-4">
        <h1 className="editorial-headline font-black text-2xl text-white">
          Official Match Results Management
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Lock confirmed final scores, half-time scores, official attendance, and match referee records with immutable editor audit trails.
        </p>
      </div>

      <ResultsAdminClient fixtures={formatted} />
    </div>
  );
}
