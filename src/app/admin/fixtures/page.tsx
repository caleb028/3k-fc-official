import React from 'react';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireAdminPermission } from '@/lib/auth';
import { FixturesAdminClient } from '@/components/admin/FixturesAdminClient';
import { syncFlashscoreMatchweekFixture } from '@/lib/flashscore';

export const dynamic = 'force-dynamic';

export default async function AdminFixturesPage() {
  try {
    await requireAdminPermission('fixtures', 'read');
  } catch {
    redirect('/admin/dashboard');
  }

  // Ensure fresh upcoming fixtures directly fetched from Flashscore (purging any past fixtures)
  await syncFlashscoreMatchweekFixture().catch(() => null);

  const pastCutoff = new Date(Date.now() - 3 * 3600 * 1000);

  const [fixtures, clubs, competitions] = await Promise.all([
    prisma.fixture.findMany({
      where: {
        status: { in: ['SCHEDULED', 'LIVE', 'HALF_TIME'] },
        kickoffAt: { gte: pastCutoff },
      },
      orderBy: { kickoffAt: 'asc' },
      include: {
        competition: true,
        homeClub: true,
        awayClub: true,
      },
    }),
    prisma.club.findMany({
      orderBy: [{ isOurClub: 'desc' }, { name: 'asc' }],
    }),
    prisma.competition.findMany({
      orderBy: { tier: 'asc' },
    }),
  ]);

  const formattedFixtures = fixtures.map((f) => ({
    id: f.id,
    slug: f.slug,
    roundName: f.roundName,
    matchday: f.matchday,
    kickoffAt: f.kickoffAt.toISOString(),
    kickoffConfirmed: f.kickoffConfirmed,
    venueName: f.venueName,
    venueCity: f.venueCity,
    isHomeMatch: f.isHomeMatch,
    status: f.status,
    ticketsAvailable: f.ticketsAvailable,
    homeScore: f.homeScore,
    awayScore: f.awayScore,
    homeClub: {
      name: f.homeClub.name,
      shortName: f.homeClub.shortName,
      isOurClub: f.homeClub.isOurClub,
    },
    awayClub: {
      name: f.awayClub.name,
      shortName: f.awayClub.shortName,
      isOurClub: f.awayClub.isOurClub,
    },
    competition: {
      name: f.competition.name,
      shortName: f.competition.shortName,
    },
  }));

  const formattedClubs = clubs.map((c) => ({
    id: c.id,
    name: c.name,
    shortName: c.shortName,
    city: c.city,
    isOurClub: c.isOurClub,
  }));

  const formattedCompetitions = competitions.map((comp) => ({
    id: comp.id,
    name: comp.name,
    shortName: comp.shortName,
    slug: comp.slug,
  }));

  return (
    <div className="space-y-6">
      <div className="border-b border-white/10 pb-4">
        <h1 className="editorial-headline font-black text-2xl text-white">
          Fixture Operations &amp; Rescheduling
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Maintain the official schedule, post upcoming matches, update kick-off times, and launch ticket sales.
        </p>
      </div>

      <FixturesAdminClient
        initialFixtures={formattedFixtures}
        clubs={formattedClubs}
        competitions={formattedCompetitions}
      />
    </div>
  );
}
