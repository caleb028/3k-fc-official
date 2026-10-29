import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdminPermission } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';
import { processFinishedFixture, retireFixturePreMatchNews } from '@/lib/match-completion';

const confirmResultSchema = z.object({
  fixtureId: z.string().min(1),
  homeScore: z.number().int().min(0),
  awayScore: z.number().int().min(0),
  halfTimeHomeScore: z.number().int().min(0).optional().nullable(),
  halfTimeAwayScore: z.number().int().min(0).optional().nullable(),
  attendance: z.number().int().min(0).optional().nullable(),
  refereeName: z.string().optional().nullable(),
  highlightsVideoUrl: z.string().url().optional().nullable().or(z.literal('')),
  reportHeadline: z.string().optional().nullable(),
  reportSummary: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdminPermission('results', 'update');
    const raw = await req.json();
    const parsed = confirmResultSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid result parameters.', issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { fixtureId, homeScore, awayScore, ...rest } = parsed.data;

    const before = await prisma.fixture.findUnique({
      where: { id: fixtureId },
      include: { homeClub: true, awayClub: true, competition: true },
    });
    if (!before) {
      return NextResponse.json({ error: 'Fixture not found' }, { status: 404 });
    }

    // 1. Update Fixture Status to FULL_TIME with scores
    const updated = await prisma.fixture.update({
      where: { id: fixtureId },
      data: {
        status: 'FULL_TIME',
        homeScore,
        awayScore,
        halfTimeHomeScore: rest.halfTimeHomeScore ?? null,
        halfTimeAwayScore: rest.halfTimeAwayScore ?? null,
        attendance: rest.attendance ?? null,
        refereeName: rest.refereeName || null,
        highlightsVideoUrl: rest.highlightsVideoUrl || null,
        resultUpdatedById: admin.id,
        resultUpdatedAt: new Date(),
      },
      include: {
        homeClub: true,
        awayClub: true,
        competition: true,
      },
    });

    // 2. Automatically retire pre-match previews and build-up news for this fixture
    await retireFixturePreMatchNews(fixtureId).catch(() => {});

    // 3. Automatically generate or update Match Report if provided or auto-generate summary
    const headline =
      rest.reportHeadline ||
      `${before.homeClub.name} ${homeScore} - ${awayScore} ${before.awayClub.name}: Official Match Summary`;
    const summary =
      rest.reportSummary ||
      `Full-time whistle at ${before.venueName}. ${before.homeClub.name} recorded ${homeScore} goals against ${before.awayClub.name}'s ${awayScore} goals in the ${before.competition.name}.`;

    await prisma.matchReport.upsert({
      where: { fixtureId },
      update: {
        headlineEn: headline,
        summaryEn: summary,
        bodyEn: summary,
      },
      create: {
        fixtureId,
        headlineEn: headline,
        summaryEn: summary,
        bodyEn: summary,
        authorName: '3K FC Matchday Editorial',
      },
    });

    // 3. Automatically & Logically recalculate League Standings for this competition!
    try {
      const allCompletedFixtures = await prisma.fixture.findMany({
        where: {
          competitionId: before.competitionId,
          seasonId: before.seasonId,
          status: 'FULL_TIME',
          homeScore: { not: null },
          awayScore: { not: null },
        },
      });

      // Map club stats
      const clubStats: Record<
        string,
        { played: number; won: number; drawn: number; lost: number; gf: number; ga: number; pts: number }
      > = {};

      for (const fix of allCompletedFixtures) {
        const hs = fix.homeScore ?? 0;
        const as = fix.awayScore ?? 0;

        if (!clubStats[fix.homeClubId]) {
          clubStats[fix.homeClubId] = { played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, pts: 0 };
        }
        if (!clubStats[fix.awayClubId]) {
          clubStats[fix.awayClubId] = { played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, pts: 0 };
        }

        clubStats[fix.homeClubId].played += 1;
        clubStats[fix.awayClubId].played += 1;
        clubStats[fix.homeClubId].gf += hs;
        clubStats[fix.homeClubId].ga += as;
        clubStats[fix.awayClubId].gf += as;
        clubStats[fix.awayClubId].ga += hs;

        if (hs > as) {
          clubStats[fix.homeClubId].won += 1;
          clubStats[fix.homeClubId].pts += 3;
          clubStats[fix.awayClubId].lost += 1;
        } else if (hs === as) {
          clubStats[fix.homeClubId].drawn += 1;
          clubStats[fix.homeClubId].pts += 1;
          clubStats[fix.awayClubId].drawn += 1;
          clubStats[fix.awayClubId].pts += 1;
        } else {
          clubStats[fix.awayClubId].won += 1;
          clubStats[fix.awayClubId].pts += 3;
          clubStats[fix.homeClubId].lost += 1;
        }
      }

      // Update league standings table for clubs
      for (const [clubId, stats] of Object.entries(clubStats)) {
        const gd = stats.gf - stats.ga;
        await prisma.leagueStanding.upsert({
          where: {
            competitionId_seasonId_clubId: {
              competitionId: before.competitionId,
              seasonId: before.seasonId,
              clubId,
            },
          },
          update: {
            played: stats.played,
            won: stats.won,
            drawn: stats.drawn,
            lost: stats.lost,
            goalsFor: stats.gf,
            goalsAgainst: stats.ga,
            goalDifference: gd,
            points: stats.pts,
            isAvailable: true,
            lastUpdatedAt: new Date(),
          },
          create: {
            competitionId: before.competitionId,
            seasonId: before.seasonId,
            clubId,
            position: 99,
            played: stats.played,
            won: stats.won,
            drawn: stats.drawn,
            lost: stats.lost,
            goalsFor: stats.gf,
            goalsAgainst: stats.ga,
            goalDifference: gd,
            points: stats.pts,
            isAvailable: true,
          },
        });
      }

      // Re-rank all positions in this competition/season
      const allStandings = await prisma.leagueStanding.findMany({
        where: {
          competitionId: before.competitionId,
          seasonId: before.seasonId,
        },
        orderBy: [{ points: 'desc' }, { goalDifference: 'desc' }, { goalsFor: 'desc' }],
      });

      for (let i = 0; i < allStandings.length; i++) {
        await prisma.leagueStanding.update({
          where: { id: allStandings[i].id },
          data: { position: i + 1 },
        });
      }
    } catch (tableErr) {
      console.warn('League table standings auto-recalculation notice:', tableErr);
    }

    // 4. Audit Log
    await recordAuditLog({
      actorId: admin.id,
      actorEmail: admin.email,
      actorRole: admin.roles[0],
      action: 'OFFICIAL_RESULT_CONFIRMED',
      targetType: 'Fixture',
      targetId: updated.id,
      before,
      after: updated,
      reason: `Result published by ${admin.email}: ${before.homeClub.name} ${homeScore} - ${awayScore} ${before.awayClub.name}`,
    });

    revalidatePath('/', 'layout');
    revalidatePath('/');
    revalidatePath('/fixtures');
    revalidatePath('/results');
    revalidatePath('/table');
    revalidatePath('/news');
    revalidatePath('/admin/results');

    return NextResponse.json({ success: true, fixture: updated });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to confirm match result' },
      { status: 403 }
    );
  }
}
