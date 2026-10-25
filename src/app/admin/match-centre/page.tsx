import React from 'react';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireAdminPermission } from '@/lib/auth';
import { MatchCentreAdminClient } from '@/components/admin/MatchCentreAdminClient';

export const dynamic = 'force-dynamic';

export default async function AdminMatchCentrePage() {
  try {
    await requireAdminPermission('match_centre', 'read');
  } catch {
    redirect('/admin/dashboard');
  }

  const fixtures = await prisma.fixture.findMany({
    orderBy: { kickoffAt: 'desc' },
    take: 20,
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
    liveMinute: f.liveMinute,
    homeScore: f.homeScore,
    awayScore: f.awayScore,
    kickoffAt: f.kickoffAt.toISOString(),
    venueName: f.venueName,
  }));

  return (
    <div className="space-y-6">
      <div className="border-b border-white/10 pb-4">
        <h1 className="editorial-headline font-black text-2xl text-white">
          Live Match Centre Console
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Broadcast real-time scores, verified match events, and touchline commentary directly to public supporters.
        </p>
      </div>

      <MatchCentreAdminClient fixtures={formatted} />
    </div>
  );
}
