import React from 'react';
import Link from 'next/link';
import { CheckCircle2, ShieldCheck, ArrowRight, FileText, Trophy } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { checkAndCompletePastFixtures } from '@/lib/match-completion';

export const dynamic = 'force-dynamic';

export default async function ResultsPage() {
  await checkAndCompletePastFixtures().catch(() => null);

  const [completedFixtures, nslPromotionRecord] = await Promise.all([
    prisma.fixture.findMany({
      where: { status: 'FULL_TIME' },
      orderBy: { kickoffAt: 'desc' },
      include: {
        competition: true,
        season: true,
        homeClub: true,
        awayClub: true,
        resultUpdatedBy: { include: { profile: true } },
        matchReport: true,
      },
    }),
    prisma.leagueStanding.findFirst({
      where: {
        competition: { slug: 'fkf-national-super-league' },
        club: { isOurClub: true },
      },
      include: { competition: true, season: true, club: true },
    }),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 md:py-14">
      <div className="border-b-2 border-slate-900 pb-6 mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="athletic-label text-xs font-extrabold text-club-primary">
            Official FKF Premier League Matchday Records
          </p>
          <h1 className="editorial-headline font-black text-3xl md:text-5xl text-slate-900 mt-1">
            Match Results &amp; Reports
          </h1>
          <p className="text-sm text-slate-600 mt-2 max-w-2xl">
            Official matchday scores, goalscorers, statistics and verified technical reports for 3K FC.
          </p>
        </div>

        <Link
          href="/fixtures"
          className="px-4 py-2.5 rounded-lg bg-slate-900 hover:bg-club-primary text-xs font-bold uppercase tracking-wider text-white transition"
        >
          View Upcoming Fixtures →
        </Link>
      </div>

      {/* Verified 2025/26 NSL Campaign Summary Banner */}
      {nslPromotionRecord && (
        <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-[#191322] to-club-primaryDark text-white p-6 md:p-8 mb-8 border border-white/10 shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-club-accent">
                <Trophy className="w-4 h-4" />
                Verified Historical Season Summary • {nslPromotionRecord.season.name} {nslPromotionRecord.competition.name}
              </span>
              <h2 className="editorial-headline font-bold text-2xl text-white mt-1">
                2nd Place Finish • {nslPromotionRecord.points} Points • Automatic Promotion to FKF Premier League
              </h2>
              <p className="text-xs text-slate-300 mt-1.5">
                Played {nslPromotionRecord.played} • Won {nslPromotionRecord.won} • Drawn {nslPromotionRecord.drawn} • Lost {nslPromotionRecord.lost} • Goals For {nslPromotionRecord.goalsFor} • Goals Against {nslPromotionRecord.goalsAgainst} (GD +{nslPromotionRecord.goalDifference})
              </p>
            </div>
            <Link
              href="/table?competition=fkf-national-super-league"
              className="shrink-0 px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold uppercase tracking-wider text-white border border-white/15 transition"
            >
              View 2025/26 NSL Record
            </Link>
          </div>
        </div>
      )}

      {/* Completed Fixtures List */}
      {completedFixtures.length > 0 ? (
        <div className="space-y-4">
          {completedFixtures.map((fix) => (
            <article
              key={fix.id}
              className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2 py-0.5 rounded bg-slate-900 text-white font-bold">
                    {fix.competition.shortName}
                  </span>
                  <span className="text-slate-500">
                    {new Date(fix.kickoffAt).toLocaleDateString('en-KE', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                  <span className="text-emerald-700 font-bold inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    CONFIRMED FT
                  </span>
                </div>
                <p className="text-xs text-slate-500">{fix.venueName}</p>
                {fix.resultUpdatedAt && (
                  <p className="text-[11px] text-slate-400">
                    Verified by {fix.resultUpdatedBy?.email || 'Authorised Matchday Staff'} on{' '}
                    {new Date(fix.resultUpdatedAt).toLocaleString('en-KE')}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-center gap-6 bg-slate-50 px-6 py-3 rounded-xl border border-slate-200">
                <span className="font-display font-bold text-lg text-slate-900">
                  {fix.homeClub.name}
                </span>
                <span className="px-4 py-1.5 rounded-lg bg-slate-900 text-club-accent font-display font-black text-2xl">
                  {fix.homeScore ?? 0} - {fix.awayScore ?? 0}
                </span>
                <span className="font-display font-bold text-lg text-slate-900">
                  {fix.awayClub.name}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href={`/matches/${fix.slug}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-club-primary hover:bg-red-600 text-white text-xs font-bold transition"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Report, Lineups &amp; Stats</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl bg-white border border-slate-200 p-10 text-center">
          <Trophy className="w-10 h-10 text-club-accent mx-auto mb-3" />
          <h2 className="editorial-headline font-bold text-2xl text-slate-900">
            2026/27 Season Results Awaiting Kick-off
          </h2>
          <p className="text-sm text-slate-600 mt-2 max-w-xl mx-auto leading-relaxed">
            Official 2026/27 FKF Premier League match results, lineups and highlights will appear here as soon as games conclude.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              href="/fixtures"
              className="px-5 py-2.5 rounded-lg bg-club-primary text-white text-xs font-bold uppercase tracking-wider"
            >
              Browse Upcoming Fixtures
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
