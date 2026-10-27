import React from 'react';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  MapPin,
  Ticket,
  Download,
  ArrowRight,
  Radio,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { ClubCrest } from '@/components/ui/ClubCrest';
import { syncFlashscoreMatchweekFixture } from '@/lib/flashscore';

export const dynamic = 'force-dynamic';

export default async function FixturesPage({
  searchParams,
}: {
  searchParams: Promise<{ competition?: string; season?: string; venue?: string }>;
}) {
  const params = await searchParams;
  const selectedCompetition = params.competition || 'all';
  const selectedVenue = params.venue || 'all';

  // Automatically fetch fresh single matchweek fixture from Flashscore and remove finished fixtures
  await syncFlashscoreMatchweekFixture().catch(() => null);

  const [competitions, seasons, fixtures] = await Promise.all([
    prisma.competition.findMany({ orderBy: { tier: 'asc' } }),
    prisma.season.findMany({ orderBy: { startDate: 'desc' } }),
    // Only active upcoming or in-progress matchweek fixtures (finished fixtures are removed)
    prisma.fixture.findMany({
      where: {
        status: { in: ['SCHEDULED', 'LIVE', 'HALF_TIME'] },
        ...(selectedCompetition !== 'all'
          ? { competition: { slug: selectedCompetition } }
          : {}),
        ...(selectedVenue === 'home'
          ? { isHomeMatch: true }
          : selectedVenue === 'away'
            ? { isHomeMatch: false }
            : {}),
      },
      orderBy: { kickoffAt: 'asc' },
      include: {
        competition: true,
        season: true,
        homeClub: true,
        awayClub: true,
      },
    }),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 md:py-14">
      {/* Header */}
      <div className="border-b-2 border-slate-900 pb-6 mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="athletic-label text-xs font-extrabold text-club-primary">
            2026/27 FKF Premier League &amp; Domestic Cup Schedule
          </p>
          <h1 className="editorial-headline font-black text-3xl md:text-5xl text-slate-900 mt-1">
            Official Fixtures
          </h1>
          <p className="text-sm text-slate-600 mt-2 max-w-2xl">
            Upcoming 3K FC fixtures in chronological order (East Africa Time — UTC+3). Export any fixture to your phone calendar in ICS format.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/results"
            className="px-4 py-2.5 rounded-lg bg-white border border-slate-300 hover:border-slate-900 text-xs font-bold uppercase tracking-wider text-slate-800 transition"
          >
            View Confirmed Results
          </Link>
          <Link
            href="/table"
            className="px-4 py-2.5 rounded-lg bg-slate-900 hover:bg-club-primary text-xs font-bold uppercase tracking-wider text-white transition"
          >
            League Standings
          </Link>
        </div>
      </div>

      {/* Live Matchweek Flashscore Synchronization Notice */}
      <div className="rounded-2xl bg-white text-slate-800 p-4 sm:p-5 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <div>
            <span className="athletic-label text-club-primary tracking-wider block sm:inline mr-2">
              Flashscore Live Matchweek Sync:
            </span>
            <span className="text-slate-600">
              Fetched directly from Flashscore. Single matchweek fixture schedule updated in real time; finished fixtures are automatically removed.
            </span>
          </div>
        </div>
        <a
          href="https://www.flashscore.com/team/3k-fc/8reiOTYF/fixtures/"
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 px-3.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-club-primary font-bold hover:underline inline-flex items-center gap-1.5 transition border border-slate-200"
        >
          <span>Flashscore Official Fixtures</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mr-2">
            Filter:
          </span>
          <Link
            href="/fixtures"
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              selectedCompetition === 'all' && selectedVenue === 'all'
                ? 'bg-club-primary text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Matches
          </Link>
          <Link
            href="/fixtures?venue=home"
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              selectedVenue === 'home'
                ? 'bg-club-primary text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Home (Embu)
          </Link>
          <Link
            href="/fixtures?venue=away"
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              selectedVenue === 'away'
                ? 'bg-club-primary text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Away
          </Link>
          {competitions.map((comp) => (
            <Link
              key={comp.id}
              href={`/fixtures?competition=${comp.slug}`}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                selectedCompetition === comp.slug
                  ? 'bg-club-primary text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {comp.shortName}
            </Link>
          ))}
        </div>

        <div className="text-xs text-slate-500">
          Season: <strong>{seasons.find((s) => s.isCurrent)?.name || '2026/27'}</strong> • Timezone: <strong>Africa/Nairobi (EAT)</strong>
        </div>
      </div>

      {/* Fixtures List */}
      {fixtures.length > 0 ? (
        <div className="space-y-4">
          {fixtures.map((fix) => {
            const dateStr = new Date(fix.kickoffAt).toLocaleDateString('en-KE', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              timeZone: 'Africa/Nairobi',
            });
            const timeStr = new Date(fix.kickoffAt).toLocaleTimeString('en-KE', {
              hour: '2-digit',
              minute: '2-digit',
              timeZone: 'Africa/Nairobi',
            });

            return (
              <article
                key={fix.id}
                className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm hover:shadow-md transition flex flex-col lg:flex-row lg:items-center justify-between gap-6"
              >
                {/* Left: Date, Competition & Venue */}
                <div className="space-y-1.5 lg:w-72">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider">
                      {fix.competition.shortName}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                        fix.isHomeMatch
                          ? 'bg-red-100 text-club-primary'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {fix.isHomeMatch ? 'HOME' : 'AWAY'}
                    </span>
                    <span className="text-xs font-bold text-emerald-700 uppercase">
                      {fix.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm font-bold text-slate-900 pt-1">
                    <Calendar className="w-4 h-4 text-club-primary" />
                    <span>{dateStr}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-600">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {timeStr} EAT{' '}
                      {!fix.kickoffConfirmed && (
                        <em className="text-slate-400 font-medium">(Time TBD)</em>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-600">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{fix.venueName}</span>
                  </div>
                </div>

                {/* Middle: Matchup */}
                <div className="flex-1 flex items-center justify-center gap-4 sm:gap-8 py-3 px-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-3 text-right">
                    <span
                      className={`font-display font-bold text-base sm:text-xl ${
                        fix.homeClub.isOurClub ? 'text-club-primary' : 'text-slate-900'
                      }`}
                    >
                      {fix.homeClub.name}
                    </span>
                    {fix.homeClub.isOurClub ? (
                      <ClubCrest size="sm" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-700">
                        {fix.homeClub.shortName.slice(0, 3).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="px-3 py-1 rounded bg-slate-900 text-white font-mono text-xs font-extrabold">
                    VS
                  </div>

                  <div className="flex items-center gap-3 text-left">
                    {fix.awayClub.isOurClub ? (
                      <ClubCrest size="sm" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-700">
                        {fix.awayClub.shortName.slice(0, 3).toUpperCase()}
                      </div>
                    )}
                    <span
                      className={`font-display font-bold text-base sm:text-xl ${
                        fix.awayClub.isOurClub ? 'text-club-primary' : 'text-slate-900'
                      }`}
                    >
                      {fix.awayClub.name}
                    </span>
                  </div>
                </div>

                {/* Right: Fan Utilities (ICS Calendar, Match Centre, Tickets) */}
                <div className="flex flex-wrap items-center gap-2.5 lg:justify-end">
                  <a
                    href={`/api/fixtures/${fix.id}/ics`}
                    download={`${fix.slug}.ics`}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition"
                    title="Download ICS Calendar File"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>ICS Calendar</span>
                  </a>

                  <Link
                    href={`/matches/${fix.slug}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition"
                  >
                    <Radio className="w-3.5 h-3.5 text-club-accent" />
                    <span>Match Centre</span>
                  </Link>

                  {fix.ticketsAvailable && (
                    <Link
                      href={`/tickets?fixture=${fix.slug}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-club-primary hover:bg-red-600 text-white text-xs font-bold shadow transition"
                    >
                      <Ticket className="w-3.5 h-3.5" />
                      <span>Buy Tickets</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl bg-white border border-slate-200 p-12 text-center">
          <AlertCircle className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h2 className="font-display font-bold text-xl text-slate-900">
            No upcoming fixtures matching this filter
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Official fixtures will appear here as soon as confirmed by the Football Kenya Federation and club administration.
          </p>
        </div>
      )}
    </div>
  );
}
