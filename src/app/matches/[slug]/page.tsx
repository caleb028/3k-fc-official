import React from 'react';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { MatchCentreClient } from '@/components/football/MatchCentreClient';

export const dynamic = 'force-dynamic';

export default async function MatchCentrePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const fixture = await prisma.fixture.findUnique({
    where: { slug },
    include: {
      competition: true,
      season: true,
      homeClub: true,
      awayClub: true,
      events: { orderBy: { minute: 'desc' } },
      liveBlogUpdates: {
        where: { status: 'PUBLISHED' },
        orderBy: [{ isPinned: 'desc' }, { publishedAt: 'desc' }],
      },
      lineups: {
        where: { isConfirmed: true },
        include: { players: { orderBy: { sortOrder: 'asc' } } },
      },
      statistics: true,
      poll: {
        include: {
          options: { orderBy: { voteCount: 'desc' } },
        },
      },
    },
  });

  if (!fixture) {
    notFound();
  }

  return (
    <MatchCentreClient
      slug={slug}
      initialFixture={JSON.parse(JSON.stringify(fixture))}
    />
  );
}
