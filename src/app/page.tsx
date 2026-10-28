import React from 'react';
import Link from 'next/link';
import { cookies } from 'next/headers';
import {
  ArrowRight,
  Trophy,
  ShoppingBag,
  Clock,
  ChevronRight,
  ExternalLink,
  MapPin,
  Ticket,
  Calendar,
  CheckCircle2,
  Play,
} from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { formatKes } from '@/lib/money';
import { Locale, resolveBilingualField, t } from '@/lib/i18n';
import { LiveMatchBar, MatchBarFixtureData } from '@/components/football/LiveMatchBar';
import { AuthenticMediaPlaceholder } from '@/components/ui/AuthenticMediaPlaceholder';
import { ClubCrest } from '@/components/ui/ClubCrest';
import { syncFlashscoreMatchweekFixture, syncFlashscoreStandings } from '@/lib/flashscore';
import { syncFacebookTeamNews } from '@/lib/facebook';
import { checkAndCompletePastFixtures } from '@/lib/match-completion';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const cookieStore = await cookies();
  const locale: Locale = cookieStore.get('3kfc_locale')?.value === 'sw' ? 'sw' : 'en';

  // Automatically retire finished match previews and ensure results are posted
  await checkAndCompletePastFixtures().catch(() => null);

  const [
    settings,
    nextOrLiveFixture,
    upcomingFixtures,
    featuredArticles,
    latestArticles,
    standingsPl,
    products,
    videos,
    sponsors,
  ] = await Promise.all([
    prisma.clubSettings.findUnique({ where: { id: 'default' } }).catch(() => null),
    prisma.fixture
      .findFirst({
        where: {
          status: { in: ['LIVE', 'HALF_TIME', 'SCHEDULED'] },
          kickoffAt: { gte: new Date(Date.now() - 3 * 3600 * 1000) },
        },
        orderBy: [{ kickoffAt: 'asc' }],
        include: { competition: true, homeClub: true, awayClub: true },
      })
      .catch(() => null),
    prisma.fixture
      .findMany({
        where: {
          status: { in: ['LIVE', 'HALF_TIME', 'SCHEDULED'] },
          kickoffAt: { gte: new Date(Date.now() - 3 * 3600 * 1000) },
        },
        orderBy: [{ kickoffAt: 'asc' }],
        take: 4,
        include: { competition: true, homeClub: true, awayClub: true },
      })
      .catch(() => []),
    prisma.article
      .findMany({
        where: { status: 'PUBLISHED', isFeatured: true },
        orderBy: [{ heroOrder: 'asc' }, { publishedAt: 'desc' }],
        take: 3,
        include: {
          category: true,
          translations: true,
        },
      })
      .catch(() => []),
    prisma.article
      .findMany({
        where: { status: 'PUBLISHED' },
        orderBy: { publishedAt: 'desc' },
        take: 6,
        include: {
          category: true,
          translations: true,
        },
      })
      .catch(() => []),
    prisma.leagueStanding
      .findMany({
        where: {
          competition: { slug: 'fkf-premier-league' },
        },
        orderBy: [{ position: 'asc' }],
        take: 6,
        include: { club: true, competition: true, season: true },
      })
      .catch(() => []),
    prisma.product
      .findMany({
        where: { isAvailable: true },
        orderBy: { isFeatured: 'desc' },
        take: 4,
        include: { variants: true, images: true },
      })
      .catch(() => []),
    prisma.video
      .findMany({
        where: { status: 'PUBLISHED' },
        orderBy: { publishedAt: 'desc' },
        take: 4,
      })
      .catch(() => []),
    prisma.sponsor
      .findMany({
        where: { isPublished: true },
        orderBy: { displayPriority: 'asc' },
        include: { placements: true },
      })
      .catch(() => []),
  ]);

  const matchBarFixture: MatchBarFixtureData | null = nextOrLiveFixture
    ? {
        id: nextOrLiveFixture.id,
        slug: nextOrLiveFixture.slug,
        competitionName: nextOrLiveFixture.competition?.name || 'FKF Premier League',
        roundName: nextOrLiveFixture.roundName,
        kickoffAt: nextOrLiveFixture.kickoffAt.toISOString(),
        kickoffConfirmed: nextOrLiveFixture.kickoffConfirmed,
        venueName: nextOrLiveFixture.venueName || 'Moi Stadium, Embu',
        venueConfirmed: nextOrLiveFixture.venueConfirmed,
        status: nextOrLiveFixture.status,
        liveMinute: nextOrLiveFixture.liveMinute,
        homeClubName: nextOrLiveFixture.homeClub?.name || '3K FC',
        homeClubShort: nextOrLiveFixture.homeClub?.shortName || '3K',
        homeClubIsOur: nextOrLiveFixture.homeClub?.isOurClub ?? true,
        awayClubName: nextOrLiveFixture.awayClub?.name || 'Opponent',
        awayClubShort: nextOrLiveFixture.awayClub?.shortName || 'OPP',
        awayClubIsOur: nextOrLiveFixture.awayClub?.isOurClub ?? false,
        homeScore: nextOrLiveFixture.homeScore,
        awayScore: nextOrLiveFixture.awayScore,
        ticketsAvailable: nextOrLiveFixture.ticketsAvailable,
      }
    : null;

  const primaryHero = featuredArticles[0] || latestArticles[0] || null;
  const otherNews = latestArticles.filter((a) => a.id !== primaryHero?.id).slice(0, 3);

  return (
    <div className="bg-white text-slate-900 min-h-screen">
      {/* 1. MATCH STATUS BAR (Crisp White with Text Accents) */}
      <LiveMatchBar fixture={matchBarFixture} />

      {/* 2. HERO FEATURE STORY (Man City Style: Immersive Card on Mobile, 2-Col on Desktop) */}
      {primaryHero && (
        <section aria-label="Lead Story" className="border-b border-slate-200 bg-white">
          {/* A. MOBILE IMMERSIVE MAGAZINE HERO CARD */}
          <div className="lg:hidden px-3 pt-3 pb-6">
            <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-200 shadow-sm group">
              <Link href={`/news/${primaryHero.slug}`} className="block relative">
                <AuthenticMediaPlaceholder
                  category={
                    locale === 'sw'
                      ? primaryHero.category?.nameSw || 'Habari'
                      : primaryHero.category?.nameEn || 'News'
                  }
                  label={
                    resolveBilingualField(primaryHero.translations, locale).record?.headline ||
                    '3K FC Official Statement'
                  }
                  sublabel={primaryHero.featuredImageAlt}
                  aspectRatio="hero"
                  imageUrl={primaryHero.featuredImageUrl}
                  isVerifiedAsset={!primaryHero.isPlaceholderImage}
                />

                {/* Dark Cinematic Gradient for High Contrast Legibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-transparent flex flex-col justify-end p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[9px] athletic-label font-extrabold bg-club-primary text-white tracking-wider shadow-xs">
                      {locale === 'sw'
                        ? primaryHero.category?.nameSw || 'Habari'
                        : primaryHero.category?.nameEn || 'News'}
                    </span>
                    <span className="text-[10px] text-slate-300 font-medium">
                      {primaryHero.publishedAt
                        ? new Date(primaryHero.publishedAt).toLocaleDateString('en-KE', {
                            day: 'numeric',
                            month: 'short',
                          })
                        : 'Official'}
                    </span>
                  </div>

                  <h1 className="editorial-headline text-xl sm:text-2xl text-white font-extrabold leading-snug drop-shadow-sm">
                    {resolveBilingualField(primaryHero.translations, locale).record?.headline}
                  </h1>

                  <p className="text-slate-200 text-xs mt-1.5 line-clamp-2 leading-relaxed">
                    {resolveBilingualField(primaryHero.translations, locale).record?.summary}
                  </p>

                  <div className="mt-3 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-club-primary text-white athletic-label text-[11px] font-extrabold shadow-sm">
                      <span>READ FULL STORY</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          </div>

          {/* B. DESKTOP 2-COLUMN HERO SECTION */}
          <div className="hidden lg:block py-10 md:py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <div className="grid grid-cols-12 gap-8 items-center">
                {/* Left Photo (7 cols) */}
                <div className="col-span-7 rounded-3xl overflow-hidden border border-slate-200 shadow-sm group">
                  <Link href={`/news/${primaryHero.slug}`} className="block relative overflow-hidden">
                    <AuthenticMediaPlaceholder
                      category={
                        locale === 'sw'
                          ? primaryHero.category?.nameSw || 'Habari'
                          : primaryHero.category?.nameEn || 'News'
                      }
                      label={
                        resolveBilingualField(primaryHero.translations, locale).record?.headline ||
                        '3K FC Official Statement'
                      }
                      sublabel={primaryHero.featuredImageAlt}
                      aspectRatio="hero"
                      imageUrl={primaryHero.featuredImageUrl}
                      isVerifiedAsset={!primaryHero.isPlaceholderImage}
                    />
                  </Link>
                </div>

                {/* Right Details (5 cols) */}
                <div className="col-span-5 flex flex-col justify-center space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full text-[10px] athletic-label tracking-wider font-extrabold bg-red-50 text-club-primary border border-red-200">
                      {locale === 'sw'
                        ? primaryHero.category?.nameSw || 'Habari'
                        : primaryHero.category?.nameEn || 'News'}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      {primaryHero.publishedAt
                        ? new Date(primaryHero.publishedAt).toLocaleDateString('en-KE', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        : 'Official Statement'}
                    </span>
                  </div>

                  <h1 className="editorial-headline text-3xl sm:text-4xl text-slate-950 tracking-tight leading-tight">
                    <Link
                      href={`/news/${primaryHero.slug}`}
                      className="hover:text-club-primary transition"
                    >
                      {resolveBilingualField(primaryHero.translations, locale).record?.headline}
                    </Link>
                  </h1>

                  <p className="text-slate-600 text-sm md:text-base leading-relaxed line-clamp-3">
                    {resolveBilingualField(primaryHero.translations, locale).record?.summary}
                  </p>

                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    <Link
                      href={`/news/${primaryHero.slug}`}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-slate-950 hover:bg-club-primary text-white athletic-label text-xs tracking-wider transition shadow-sm"
                    >
                      <span>READ FULL STORY</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>

                    <Link
                      href="/fixtures"
                      className="inline-flex items-center gap-1.5 px-5 py-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 athletic-label text-xs tracking-wider border border-slate-300 transition"
                    >
                      <span>FIXTURES &amp; TICKETS</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 3. UPCOMING MATCHES CAROUSEL (Man City Style Swipeable Fixtures Carousel) */}
      {upcomingFixtures.length > 0 && (
        <section aria-label="Upcoming Fixtures Carousel" className="py-8 bg-slate-50 border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-club-primary" />
                <h2 className="editorial-headline text-lg sm:text-xl font-bold text-slate-950">
                  Next Matches • Fixture Schedule
                </h2>
              </div>
              <Link
                href="/fixtures"
                className="athletic-label text-xs text-club-secondary hover:text-club-primary transition inline-flex items-center gap-1 font-bold"
              >
                <span>FULL SCHEDULE</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Mobile Swipeable / Desktop Grid Carousel */}
            <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-none pb-2 -mx-4 px-4 sm:mx-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
              {upcomingFixtures.map((fix) => {
                const matchDate = new Date(fix.kickoffAt).toLocaleDateString('en-KE', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  timeZone: 'Africa/Nairobi',
                });
                const matchTime = new Date(fix.kickoffAt).toLocaleTimeString('en-KE', {
                  hour: '2-digit',
                  minute: '2-digit',
                  timeZone: 'Africa/Nairobi',
                });

                return (
                  <article
                    key={fix.id}
                    className="min-w-[270px] sm:min-w-0 snap-center rounded-2xl bg-white border border-slate-200 p-3.5 shadow-xs hover:shadow-md transition flex flex-col justify-between group"
                  >
                    <div>
                      {/* Competition & Date Pill */}
                      <div className="flex items-center justify-between text-[11px] mb-3 pb-2 border-b border-slate-100">
                        <span className="athletic-label text-[10px] font-extrabold text-club-secondary truncate max-w-[150px]">
                          {fix.competition?.name || 'FKF Premier League'}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-slate-500">
                          {matchDate}
                        </span>
                      </div>

                      {/* Crests & Matchup */}
                      <div className="flex items-center justify-between py-2">
                        {/* Home Team */}
                        <div className="flex flex-col items-center gap-1 text-center flex-1 min-w-0">
                          {fix.homeClub?.isOurClub ? (
                            <ClubCrest size="sm" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-[10px] font-black text-slate-700">
                              {(fix.homeClub?.shortName || fix.homeClub?.name || '3K').slice(0, 3).toUpperCase()}
                            </div>
                          )}
                          <span className={`text-[11px] font-bold truncate max-w-[85px] ${fix.homeClub?.isOurClub ? 'text-club-primary font-black' : 'text-slate-800'}`}>
                            {fix.homeClub?.shortName || fix.homeClub?.name || '3K FC'}
                          </span>
                        </div>

                        {/* VS / Time Badge */}
                        <div className="flex flex-col items-center justify-center px-2 shrink-0">
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-mono font-extrabold text-slate-800">
                            {matchTime}
                          </span>
                          <span className="text-[9px] font-bold text-slate-400 mt-0.5">EAT</span>
                        </div>

                        {/* Away Team */}
                        <div className="flex flex-col items-center gap-1 text-center flex-1 min-w-0">
                          {fix.awayClub?.isOurClub ? (
                            <ClubCrest size="sm" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-[10px] font-black text-slate-700">
                              {(fix.awayClub?.shortName || fix.awayClub?.name || 'OPP').slice(0, 3).toUpperCase()}
                            </div>
                          )}
                          <span className={`text-[11px] font-bold truncate max-w-[85px] ${fix.awayClub?.isOurClub ? 'text-club-primary font-black' : 'text-slate-800'}`}>
                            {fix.awayClub?.shortName || fix.awayClub?.name || 'Opponent'}
                          </span>
                        </div>
                      </div>

                      {/* Verified Stadium Venue */}
                      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-1 text-[10px] text-slate-500 truncate">
                        <MapPin className="w-3 h-3 text-club-primary shrink-0" />
                        <span className="truncate">{fix.venueName || 'Moi Stadium, Embu'}</span>
                      </div>
                    </div>

                    {/* Action Link */}
                    <div className="mt-3 pt-2">
                      {fix.ticketsAvailable ? (
                        <Link
                          href={`/tickets?fixture=${fix.slug}`}
                          className="w-full py-1.5 rounded-xl bg-club-primary hover:bg-red-700 text-white athletic-label text-[10px] font-extrabold text-center transition flex items-center justify-center gap-1 shadow-2xs"
                        >
                          <Ticket className="w-3 h-3" />
                          <span>Buy Tickets</span>
                        </Link>
                      ) : (
                        <Link
                          href={`/matches/${fix.slug}`}
                          className="w-full py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 athletic-label text-[10px] font-bold text-center transition flex items-center justify-center gap-1"
                        >
                          <span>Match Centre</span>
                          <ChevronRight className="w-3 h-3 text-slate-500" />
                        </Link>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* 4. CORE EDITORIAL GRID: LATEST NEWS (8 Cols) + LEAGUE TABLE (4 Cols) */}
      <section className="py-10 md:py-14 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Latest News Articles (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
              <div>
                <p className="athletic-label text-xs font-bold text-club-primary">
                  Official Club Desk
                </p>
                <h2 className="editorial-headline text-2xl md:text-3xl text-slate-950">
                  {t('section.latest_news', locale)}
                </h2>
              </div>
              <Link
                href="/news"
                className="athletic-label text-xs text-club-secondary hover:text-club-primary transition inline-flex items-center gap-1 font-bold"
              >
                <span>VIEW ALL NEWS</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Mobile Horizontal Snap Carousel / Desktop 3-Col Grid */}
            <div className="flex gap-3.5 overflow-x-auto snap-x snap-mandatory scrollbar-none pb-2 -mx-4 px-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-5">
              {otherNews.map((art) => {
                const tr = resolveBilingualField(art.translations, locale).record;
                return (
                  <article
                    key={art.id}
                    className="min-w-[280px] sm:min-w-0 snap-center rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-xs hover:shadow-md hover:border-slate-300 transition flex flex-col justify-between group"
                  >
                    <div>
                      <AuthenticMediaPlaceholder
                        category={locale === 'sw' ? art.category?.nameSw || 'Habari' : art.category?.nameEn || 'News'}
                        label={tr?.headline || art.slug}
                        sublabel={art.featuredImageAlt}
                        aspectRatio="video"
                        imageUrl={art.featuredImageUrl}
                        isVerifiedAsset={!art.isPlaceholderImage}
                      />
                      <div className="p-4">
                        <div className="flex items-center justify-between text-[11px] mb-2">
                          <span className="athletic-label text-[10px] font-bold text-club-primary uppercase">
                            {locale === 'sw' ? art.category?.nameSw || 'Habari' : art.category?.nameEn || 'News'}
                          </span>
                          <span className="text-slate-400 font-mono text-[10px]">
                            {art.publishedAt
                              ? new Date(art.publishedAt).toLocaleDateString('en-KE', {
                                  day: 'numeric',
                                  month: 'short',
                                })
                              : ''}
                          </span>
                        </div>
                        <h3 className="editorial-headline text-base sm:text-lg text-slate-950 group-hover:text-club-primary transition leading-snug line-clamp-2">
                          <Link href={`/news/${art.slug}`}>{tr?.headline}</Link>
                        </h3>
                        <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                          {tr?.summary}
                        </p>
                      </div>
                    </div>
                    <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-slate-500 font-medium truncate max-w-[130px]">{art.authorName}</span>
                      <Link
                        href={`/news/${art.slug}`}
                        className="athletic-label text-[11px] font-bold text-club-secondary hover:text-club-primary transition inline-flex items-center gap-0.5"
                      >
                        <span>READ</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          {/* Standings Snapshot (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
              <div>
                <p className="athletic-label text-xs font-bold text-club-secondary">
                  FKF Premier League
                </p>
                <h2 className="editorial-headline text-2xl md:text-3xl text-slate-950">
                  {t('section.league_table', locale)}
                </h2>
              </div>
              <Link
                href="/table"
                className="athletic-label text-xs text-club-secondary hover:text-club-primary transition inline-flex items-center gap-1 font-bold"
              >
                <span>FULL TABLE</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">
              <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between text-xs">
                <span className="athletic-label tracking-wider font-extrabold text-slate-800">
                  2026/27 STANDINGS
                </span>
                <span className="text-club-primary font-bold text-[11px]">MATCHWEEK 1</span>
              </div>

              {standingsPl.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100/70 text-slate-600 athletic-label tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">#</th>
                        <th className="py-2.5 px-2">CLUB</th>
                        <th className="py-2.5 px-2 text-center">P</th>
                        <th className="py-2.5 px-2 text-center">GD</th>
                        <th className="py-2.5 px-3 text-right">PTS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {standingsPl.map((row) => {
                        const isOur = row.club.isOurClub;
                        return (
                          <tr
                            key={row.id}
                            className={
                              isOur
                                ? 'bg-red-50/50 font-bold text-slate-900 border-l-4 border-l-club-primary'
                                : 'text-slate-700 hover:bg-slate-50'
                            }
                          >
                            <td className="py-2.5 px-3 font-mono font-bold">{row.position}</td>
                            <td className="py-2.5 px-2">
                              <span className={isOur ? 'text-club-primary font-black' : 'font-medium'}>
                                {row.club.name}
                              </span>
                            </td>
                            <td className="py-2.5 px-2 text-center font-mono">{row.played}</td>
                            <td className="py-2.5 px-2 text-center font-mono">
                              {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900">
                              {row.points}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-slate-500">
                  Awaiting FKF Premier League matchday 1 kick-off.
                </div>
              )}

              <div className="bg-slate-50 px-4 py-2.5 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
                <span className="inline-flex items-center gap-1 font-medium">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Flashscore Live Sync
                </span>
                <Link
                  href="/table"
                  className="athletic-label text-xs font-bold text-club-primary hover:underline"
                >
                  Full 18 Teams →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. 3K TV & VIDEO HIGHLIGHTS CAROUSEL (Man City Style Video Feed) */}
      {videos.length > 0 && (
        <section aria-label="3K TV Videos Carousel" className="py-10 bg-slate-950 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800">
              <div>
                <p className="athletic-label text-xs font-bold text-club-primary">
                  3K TV &amp; Match Highlights
                </p>
                <h2 className="editorial-headline text-2xl sm:text-3xl font-black text-white">
                  Featured Videos &amp; Broadcasts
                </h2>
              </div>
              <Link
                href="/videos"
                className="athletic-label text-xs text-slate-300 hover:text-white transition inline-flex items-center gap-1 font-bold"
              >
                <span>ALL VIDEOS</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Mobile Swipeable / Desktop Grid Carousel */}
            <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-none pb-2 -mx-4 px-4 sm:mx-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
              {videos.map((vid) => (
                <article
                  key={vid.id}
                  className="min-w-[260px] sm:min-w-0 snap-center rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-md hover:border-slate-700 transition flex flex-col justify-between group"
                >
                  <Link href={`/videos?v=${vid.slug}`} className="block">
                    <div className="relative aspect-video bg-slate-800 overflow-hidden">
                      {vid.thumbnailUrl ? (
                        <img
                          src={vid.thumbnailUrl}
                          alt={vid.titleEn}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                          <Play className="w-10 h-10 text-white/40" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition flex items-center justify-center">
                        <div className="w-11 h-11 rounded-full bg-club-primary text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition">
                          <Play className="w-5 h-5 fill-white ml-0.5" />
                        </div>
                      </div>
                      <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/85 text-white text-[10px] font-mono font-bold">
                        {vid.durationLabel}
                      </span>
                      <span className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-slate-950/90 text-white text-[9px] athletic-label font-bold">
                        {vid.category}
                      </span>
                    </div>

                    <div className="p-3.5">
                      <h3 className="editorial-headline text-sm font-bold text-white group-hover:text-club-primary transition line-clamp-2 leading-snug">
                        {locale === 'sw' && vid.titleSw ? vid.titleSw : vid.titleEn}
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                        {locale === 'sw' && vid.descriptionSw ? vid.descriptionSw : vid.descriptionEn}
                      </p>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 6. NEXT HOME MATCH & TICKETING CTA */}
      <section className="py-6 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="rounded-3xl bg-slate-50 border border-slate-200 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xs">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-club-secondary text-xs athletic-label font-bold">
              <Calendar className="w-3.5 h-3.5" />
              <span>Next Home Match • Moi Stadium, Embu</span>
            </div>
            <h3 className="editorial-headline text-2xl md:text-3xl text-slate-950 mt-1">
              {matchBarFixture
                ? `${matchBarFixture.homeClubName} vs ${matchBarFixture.awayClubName}`
                : '3K FC Premier League Matchday 1'}
            </h3>
            <p className="text-xs text-slate-600 max-w-xl">
              Support the Stars from the stands. Instant digital M-Pesa QR tickets with turnstile gate scanning at Moi Stadium, Embu.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
            <Link
              href="/tickets"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-club-primary hover:bg-red-700 text-white athletic-label text-xs tracking-wider font-extrabold shadow-sm transition transform hover:-translate-y-0.5"
            >
              <Ticket className="w-4 h-4" />
              <span>GET MATCH TICKETS</span>
            </Link>
            <Link
              href="/team"
              className="inline-flex items-center gap-1.5 px-5 py-3.5 rounded-full bg-white hover:bg-slate-100 text-slate-800 athletic-label text-xs tracking-wider border border-slate-300 transition"
            >
              <span>VIEW SQUAD</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 7. OFFICIAL CLUB GEAR (Man City Style Swipeable Merchandise Row) */}
      {products.length > 0 && (
        <section className="py-10 md:py-14 max-w-7xl mx-auto px-4 sm:px-6 border-t border-slate-200 mt-6">
          <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3 mb-6">
            <div>
              <p className="athletic-label text-xs font-bold text-club-primary">
                Official 3K FC Kit
              </p>
              <h2 className="editorial-headline text-2xl md:text-3xl text-slate-950">
                Official Merchandise
              </h2>
            </div>
            <Link
              href="/shop"
              className="athletic-label text-xs text-club-secondary hover:text-club-primary transition inline-flex items-center gap-1 font-bold"
            >
              <span>VISIT SHOP</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Mobile Swipeable / Desktop Grid */}
          <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-none pb-2 -mx-4 px-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-6">
            {products.slice(0, 3).map((product) => {
              const primaryImg = product.images?.[0]?.url || null;
              return (
                <article
                  key={product.id}
                  className="min-w-[260px] sm:min-w-0 snap-center rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between group"
                >
                  <AuthenticMediaPlaceholder
                    category={product.category}
                    label={locale === 'sw' ? product.nameSw : product.nameEn}
                    sublabel="Authentic Gear"
                    aspectRatio="square"
                    imageUrl={primaryImg}
                    isVerifiedAsset={!!primaryImg}
                  />
                  <div className="p-4 sm:p-5 flex items-center justify-between border-t border-slate-100">
                    <div>
                      <h3 className="editorial-headline text-base sm:text-lg text-slate-950 group-hover:text-club-primary transition">
                        <Link href={`/shop/${product.slug}`}>
                          {locale === 'sw' ? product.nameSw : product.nameEn}
                        </Link>
                      </h3>
                      <p className="font-mono font-black text-base sm:text-lg text-club-primary mt-0.5">
                        {formatKes(product.priceKesCents)}
                      </p>
                    </div>

                    <Link
                      href={`/shop/${product.slug}`}
                      className="px-4 py-2 rounded-full bg-slate-900 hover:bg-club-primary text-white athletic-label text-xs tracking-wider transition shadow-2xs"
                    >
                      BUY
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* 8. OFFICIAL COMMERCIAL PARTNERS (Clean Minimalist Strip with Principal Sponsor Showcase) */}
      <section className="py-8 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <span className="athletic-label text-xs font-bold text-slate-500">
                Principal Sponsor:
              </span>
              <Link
                href="/partners"
                className="sponsor-badge-mozzart text-sm px-3.5 py-1 shadow-xs hover:scale-105 transition-transform"
                title="Mozzart Bet Kenya — Principal Partner"
              >
                MOZZART
              </Link>
              <span className="text-xs text-slate-600 font-semibold hidden sm:inline">
                Mozzart Bet Kenya
              </span>
            </div>

            {sponsors.length > 0 && (
              <div className="flex flex-wrap items-center gap-4">
                <span className="athletic-label text-xs text-slate-400">Partners:</span>
                {sponsors.map((sp) => (
                  <span
                    key={sp.id}
                    className="editorial-headline text-xs md:text-sm font-bold text-slate-700 hover:text-club-primary transition"
                  >
                    {sp.businessName}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
