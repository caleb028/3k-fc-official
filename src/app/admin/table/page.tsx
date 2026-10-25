import React from 'react';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireAdminPermission } from '@/lib/auth';
import { TableAdminClient } from '@/components/admin/TableAdminClient';

export const dynamic = 'force-dynamic';

export default async function AdminTablePage() {
  try {
    await requireAdminPermission('table', 'read');
  } catch {
    redirect('/admin/dashboard');
  }

  const standings = await prisma.leagueStanding.findMany({
    orderBy: { position: 'asc' },
    include: {
      club: true,
      competition: true,
      season: true,
    },
  });

  const formatted = standings.map((st) => ({
    id: st.id,
    position: st.position,
    played: st.played,
    won: st.won,
    drawn: st.drawn,
    lost: st.lost,
    goalsFor: st.goalsFor,
    goalsAgainst: st.goalsAgainst,
    goalDifference: st.goalDifference,
    points: st.points,
    form: st.form,
    qualificationNote: st.qualificationNote,
    isAvailable: st.isAvailable,
    dataSource: st.dataSource,
    lastUpdatedAt: st.lastUpdatedAt.toISOString(),
    club: {
      name: st.club.name,
      shortName: st.club.shortName,
      isOurClub: st.club.isOurClub,
    },
    competition: {
      name: st.competition.name,
      shortName: st.competition.shortName,
    },
    season: {
      name: st.season.name,
    },
  }));

  return (
    <div className="space-y-6">
      <div className="border-b border-white/10 pb-4">
        <h1 className="editorial-headline font-black text-2xl text-white">
          League Table &amp; Standings Management
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Maintain verified FKF league standings, positions, goal differentials, points, form guides, and promotion/qualification indicators.
        </p>
      </div>

      <TableAdminClient standings={formatted} />
    </div>
  );
}
