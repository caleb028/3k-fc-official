import React from 'react';
import Link from 'next/link';
import { cookies } from 'next/headers';
import {
  ArrowRight,
  Trophy,
  Users,
  ShoppingBag,
  ShieldCheck,
  Sparkles,
  MapPin,
  HeartHandshake,
  Clock,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Flame,
  Star,
} from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { formatKes } from '@/lib/money';
import { Locale, resolveBilingualField, t } from '@/lib/i18n';
import { LiveMatchBar, MatchBarFixtureData } from '@/components/football/LiveMatchBar';
import { AuthenticMediaPlaceholder } from '@/components/ui/AuthenticMediaPlaceholder';
import { ClickToLoadVideoCard } from '@/components/media/ClickToLoadVideoCard';
import { syncFlashscoreMatchweekFixture, syncFlashscoreStandings } from '@/lib/flashscore';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const cookieStore = await cookies();
  const locale: Locale = cookieStore.get('3kfc_locale')?.value === 'sw' ? 'sw' : 'en';

  // Automatically sync single matchweek fixture & live table standings from Flashscore
  await Promise.all([
    syncFlashscoreMatchweekFixture().catch(() => null),
    syncFlashscoreStandings().catch(() => null),
  ]);

  const [
    settings,
    nextOrLiveFixture,
    featuredArticles,
    latestArticles,
    videos,
    standingsPl,
    promotionStandingNsl,
    players,
    staff,
    products,
    membershipPlans,
    sponsors,
  ] = await Promise.all([
    prisma.clubSettings.findUnique({ where: { id: 'default' } }).catch(() => null),
    // Only active upcoming or live matchweek fixture (finished fixtures removed)
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
    prisma.video
      .findMany({
        where: { status: 'PUBLISHED' },
        orderBy: { publishedAt: 'desc' },
        take: 3,
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
    prisma.leagueStanding
      .findFirst({
        where: {
          competition: { slug: 'fkf-national-super-league' },
          club: { isOurClub: true },
        },
        include: { club: true, competition: true, season: true },
      })
      .catch(() => null),
    prisma.player
      .findMany({
        where: { isActive: true },
        orderBy: [{ isCaptain: 'desc' }, { shirtNumber: 'asc' }],
        take: 4,
        include: {
          squadMemberships: { take: 1 },
        },
      })
      .catch(() => []),
    prisma.staffMember
      .findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        take: 2,
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
    prisma.membershipPlan
      .findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        take: 2,
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
        competitionName: nextOrLiveFixture.competition.name,
        roundName: nextOrLiveFixture.roundName,
        kickoffAt: nextOrLiveFixture.kickoffAt.toISOString(),
        kickoffConfirmed: nextOrLiveFixture.kickoffConfirmed,
        venueName: nextOrLiveFixture.venueName,
        venueConfirmed: nextOrLiveFixture.venueConfirmed,
        status: nextOrLiveFixture.status,
        liveMinute: nextOrLiveFixture.liveMinute,
        homeClubName: nextOrLiveFixture.homeClub.name,
        homeClubShort: nextOrLiveFixture.homeClub.shortName,
        homeClubIsOur: nextOrLiveFixture.homeClub.isOurClub,
        awayClubName: nextOrLiveFixture.awayClub.name,
        awayClubShort: nextOrLiveFixture.awayClub.shortName,
        awayClubIsOur: nextOrLiveFixture.awayClub.isOurClub,
        homeScore: nextOrLiveFixture.homeScore,
        awayScore: nextOrLiveFixture.awayScore,
        ticketsAvailable: nextOrLiveFixture.ticketsAvailable,
      }
    : null;

  const primaryHero = featuredArticles[0] || latestArticles[0] || null;
  const secondaryHeroes = featuredArticles.slice(1, 3);

  return (
    <div className="bg-[#F8FAFC]">
      {/* SECTION 5A: FC BARCELONA-STYLE LIVE MATCH & NEXT-FIXTURE TICKER */}
      <LiveMatchBar fixture={matchBarFixture} />

      {/* SECTION 5B: FC BARCELONA SIGNATURE HERO EDITORIAL SECTION */}
      <section
        aria-label="Featured Club Editorial"
        className="bg-[#081326] text-white py-8 md:py-14 px-4 sm:px-6 relative overflow-hidden"
      >
        {/* Subtle Blaugrana Atmospheric Glow */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 10% 20%, rgba(14, 68, 148, 0.7), transparent 40%), radial-gradient(circle at 90% 80%, rgba(225, 29, 42, 0.6), transparent 45%)',
          }}
        />

        <div className="max-w-7xl mx-auto relative z-10">
          {primaryHero ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              {/* Primary Prominent Hero Card (Barça Lead Editorial) */}
              <div className="lg:col-span-8 rounded-3xl overflow-hidden bg-[#0A1832] border border-white/15 flex flex-col justify-between shadow-2xl group barca-card-hover">
                <div className="relative overflow-hidden">
                  <AuthenticMediaPlaceholder
                    category={
                      locale === 'sw'
                        ? primaryHero.category.nameSw
                        : primaryHero.category.nameEn
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
                </div>

                <div className="p-6 sm:p-8 md:p-10 bg-gradient-to-t from-[#040A14] via-[#0A1832] to-[#0A1832]">
                  <div className="flex flex-wrap items-center gap-3 text-xs mb-3">
                    <span className="px-3 py-1 rounded-full bg-club-primary text-white athletic-label text-xs tracking-wider shadow">
                      {locale === 'sw'
                        ? primaryHero.category.nameSw
                        : primaryHero.category.nameEn}
                    </span>
                    <span className="text-slate-300 font-semibold text-xs">
                      {primaryHero.publishedAt
                        ? new Date(primaryHero.publishedAt).toLocaleDateString('en-KE', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })
                        : 'Official Release'}
                    </span>
                    <span className="text-slate-400">• By {primaryHero.authorName}</span>
                  </div>

                  <h1 className="editorial-headline text-3xl sm:text-4xl md:text-5xl text-white tracking-tight">
                    <Link href={`/news/${primaryHero.slug}`} className="hover:text-club-accent transition">
                      {resolveBilingualField(primaryHero.translations, locale).record?.headline}
                    </Link>
                  </h1>

                  <p className="text-slate-300 text-sm md:text-base mt-3 leading-relaxed max-w-3xl">
                    {resolveBilingualField(primaryHero.translations, locale).record?.summary}
                  </p>

                  <div className="mt-8 flex flex-wrap items-center gap-4">
                    <Link
                      href={`/news/${primaryHero.slug}`}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-club-primary hover:bg-red-600 text-white athletic-label text-xs tracking-wider shadow-lg transition transform hover:-translate-y-0.5"
                    >
                      <span>READ FULL STORY</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link
                      href="/club"
                      className="inline-flex items-center gap-1.5 px-5 py-3 rounded-full bg-white/10 hover:bg-white/20 text-slate-200 athletic-label text-xs tracking-wider border border-white/20 transition"
                    >
                      <span>OUR EMBU STORY</span>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Secondary Featured Editorial Side Panel */}
              <div className="hidden lg:flex lg:col-span-4 flex-col justify-between gap-6">
                {secondaryHeroes.map((item) => {
                  const trans = resolveBilingualField(item.translations, locale).record;
                  return (
                    <article
                      key={item.id}
                      className="flex-1 rounded-3xl bg-[#0A1832] border border-white/15 p-6 flex flex-col justify-between group barca-card-hover"
                    >
                      <div>
                        <div className="flex items-center justify-between text-xs mb-3">
                          <span className="athletic-label text-xs tracking-wider text-club-accent font-extrabold">
                            {locale === 'sw' ? item.category.nameSw : item.category.nameEn}
                          </span>
                          <span className="text-slate-400 text-[11px]">{item.authorName}</span>
                        </div>
                        <h2 className="editorial-headline text-2xl text-white group-hover:text-club-accent transition leading-tight">
                          <Link href={`/news/${item.slug}`}>
                            {trans?.headline}
                          </Link>
                        </h2>
                        <p className="text-xs text-slate-300 mt-2.5 line-clamp-3 leading-relaxed">
                          {trans?.summary}
                        </p>
                      </div>
                      <div className="pt-4 mt-4 border-t border-white/10 flex items-center justify-between">
                        <Link
                          href={`/news/${item.slug}`}
                          className="inline-flex items-center gap-1.5 text-xs athletic-label tracking-wider text-club-accent hover:underline"
                        >
                          <span>READ MORE</span>
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </article>
                  );
                })}

                {/* FC Barcelona-Style Milestone Honour Callout Card */}
                {promotionStandingNsl && (
                  <div className="rounded-3xl bg-gradient-to-br from-[#0E4494] via-[#0A1832] to-[#B91C1C] border border-amber-400/40 p-6 shadow-xl relative overflow-hidden">
                    <div className="flex items-center gap-2 text-xs athletic-label tracking-wider text-amber-300 font-extrabold">
                      <Trophy className="w-4 h-4 text-amber-400" />
                      <span>Club Milestone</span>
                    </div>
                    <p className="editorial-headline text-2xl text-white mt-2">
                      77 Points • 2025/26 NSL Runners-Up
                    </p>
                    <p className="text-xs text-slate-200 mt-1.5 leading-relaxed">
                      First club in Embu County history promoted automatically to the <strong>2026/27 FKF Premier League</strong>.
                    </p>
                    <div className="mt-4 pt-3 border-t border-white/15 flex items-center justify-between text-[11px] text-amber-300 font-bold">
                      <span>Historical Record</span>
                      <Link href="/club" className="hover:underline flex items-center gap-1">
                        <span>Heritage Timeline</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-3xl bg-[#0A1832] border border-white/10 p-10 text-center">
              <p className="text-lg font-semibold text-white">No published hero stories yet.</p>
            </div>
          )}
        </div>
      </section>

      {/* SECTION 5C & 5E: LATEST NEWS + LEAGUE TABLE (FC Barcelona Clean Grid) */}
      <section className="py-12 md:py-18 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Latest News (8 cols) */}
          <div className="lg:col-span-8">
            <div className="flex items-end justify-between border-b-2 border-slate-900 pb-3 mb-6">
              <div>
                <p className="athletic-label text-xs text-club-primary">
                  Official Editorial Desk
                </p>
                <h2 className="editorial-headline text-3xl md:text-4xl text-slate-900 mt-0.5">
                  {t('section.latest_news', locale)}
                </h2>
              </div>
              <Link
                href="/news"
                className="athletic-label text-xs tracking-wider text-club-primary hover:underline inline-flex items-center gap-1"
              >
                <span>VIEW ALL NEWS</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {latestArticles.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {latestArticles.map((art) => {
                  const { record: tr, isFallback } = resolveBilingualField(
                    art.translations,
                    locale
                  );
                  return (
                    <article
                      key={art.id}
                      className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-sm barca-card-hover flex flex-col justify-between group"
                    >
                      <div>
                        <AuthenticMediaPlaceholder
                          category={
                            locale === 'sw' ? art.category.nameSw : art.category.nameEn
                          }
                          label={tr?.headline || art.slug}
                          sublabel={art.featuredImageAlt}
                          aspectRatio="video"
                          imageUrl={art.featuredImageUrl}
                          isVerifiedAsset={!art.isPlaceholderImage}
                        />
                        <div className="p-6">
                          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                            <span className="athletic-label text-xs tracking-wider text-club-primary">
                              {locale === 'sw' ? art.category.nameSw : art.category.nameEn}
                            </span>
                            <span className="text-[11px] font-semibold text-slate-400">
                              {art.publishedAt
                                ? new Date(art.publishedAt).toLocaleDateString('en-KE', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                  })
                                : ''}
                            </span>
                          </div>
                          <h3 className="editorial-headline text-xl text-slate-900 group-hover:text-club-primary transition leading-snug">
                            <Link href={`/news/${art.slug}`}>
                              {tr?.headline}
                            </Link>
                          </h3>
                          <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                            {tr?.summary}
                          </p>
                          {isFallback && (
                            <p className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-0.5 mt-2">
                              {t('status.translation_fallback', locale)}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-medium text-[11px]">{art.authorName}</span>
                        <Link
                          href={`/news/${art.slug}`}
                          className="athletic-label text-xs tracking-wider text-club-primary hover:underline inline-flex items-center gap-1"
                        >
                          <span>READ MORE</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl bg-white border border-slate-200 p-8 text-center text-slate-600">
                No published articles available.
              </div>
            )}
          </div>

          {/* SECTION 5E: LEAGUE TABLE SNAPSHOT (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="flex items-end justify-between border-b-2 border-slate-900 pb-3">
              <div>
                <p className="athletic-label text-xs text-club-primary">
                  FKF Premier League • 2026/27
                </p>
                <h2 className="editorial-headline text-3xl text-slate-900">
                  {t('section.league_table', locale)}
                </h2>
              </div>
              <Link
                href="/table"
                className="athletic-label text-xs tracking-wider text-club-primary hover:underline inline-flex items-center gap-1"
              >
                <span>FULL TABLE</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden barca-card-hover">
              <div className="bg-[#081326] text-white px-5 py-3.5 flex items-center justify-between text-xs">
                <span className="athletic-label tracking-wider font-extrabold text-white">2026/27 STANDINGS</span>
                <span className="text-amber-400 font-bold text-[11px]">FKF PREMIER LEAGUE</span>
              </div>

              {standingsPl.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-600 athletic-label tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-4">#</th>
                        <th className="py-2.5 px-3">CLUB</th>
                        <th className="py-2.5 px-2 text-center">P</th>
                        <th className="py-2.5 px-2 text-center">GD</th>
                        <th className="py-2.5 px-4 text-right">PTS</th>
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
                                ? 'bg-club-blue/10 font-bold text-slate-900 border-l-4 border-l-club-primary'
                                : 'text-slate-700 hover:bg-slate-50'
                            }
                          >
                            <td className="py-3 px-4 font-mono font-bold">{row.position}</td>
                            <td className="py-3 px-3">
                              <span className={isOur ? 'text-club-primary font-black' : 'font-medium'}>
                                {row.club.name}
                              </span>
                            </td>
                            <td className="py-3 px-2 text-center font-mono">{row.played}</td>
                            <td className="py-3 px-2 text-center font-mono">
                              {row.goalDifference > 0
                                ? `+${row.goalDifference}`
                                : row.goalDifference}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-black text-slate-900">
                              {row.points}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-slate-600">
                  Official 2026/27 competition table data is currently awaiting FKF matchday 1 confirmation.
                </div>
              )}

              <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  Pre-Season Official Table
                </span>
                <Link href="/table" className="athletic-label text-xs tracking-wider text-club-primary hover:underline">
                  Full Standings →
                </Link>
              </div>
            </div>

            {/* Verified 2025/26 NSL Final Record Card */}
            {promotionStandingNsl && (
              <div className="rounded-2xl bg-gradient-to-br from-[#081326] to-[#0E1E3A] text-white p-6 border border-white/10 shadow-md">
                <div className="flex items-center justify-between text-xs text-club-accent athletic-label tracking-wider font-extrabold">
                  <span>2025/26 FKF NSL Promotion Record</span>
                  <span className="text-emerald-400 font-bold">Automatic Promotion</span>
                </div>
                <div className="mt-4 grid grid-cols-4 gap-2 text-center bg-black/40 rounded-xl p-3 border border-white/10">
                  <div>
                    <div className="text-[10px] text-slate-300 uppercase font-bold">Pos</div>
                    <div className="font-condensed font-black text-2xl text-amber-400">
                      #{promotionStandingNsl.position}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-300 uppercase font-bold">Played</div>
                    <div className="font-mono font-bold text-lg">{promotionStandingNsl.played}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-300 uppercase font-bold">Won</div>
                    <div className="font-mono font-bold text-lg">{promotionStandingNsl.won}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-300 uppercase font-bold">Points</div>
                    <div className="font-condensed font-black text-2xl text-emerald-400">
                      {promotionStandingNsl.points}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                  {promotionStandingNsl.qualificationNote}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* SECTION 5D: LATEST VIDEOS (Barça TV / 3K TV Aesthetic) */}
      <section className="bg-[#081326] text-white py-12 md:py-18 px-4 sm:px-6 border-y border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <p className="athletic-label text-xs text-club-accent">
                3K TV • Match Highlights, Features &amp; Documentaries
              </p>
              <h2 className="editorial-headline text-3xl md:text-4xl text-white mt-1">
                {t('section.latest_videos', locale)}
              </h2>
            </div>
            <Link
              href="/videos"
              className="athletic-label text-xs tracking-wider text-club-accent hover:underline inline-flex items-center gap-1.5"
            >
              <span>OPEN VIDEO HUB</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {videos.map((vid) => (
              <ClickToLoadVideoCard
                key={vid.id}
                title={locale === 'sw' && vid.titleSw ? vid.titleSw : vid.titleEn}
                description={
                  locale === 'sw' && vid.descriptionSw ? vid.descriptionSw : vid.descriptionEn
                }
                category={vid.category}
                youtubeVideoId={vid.youtubeVideoId}
                durationLabel={vid.durationLabel}
                hasCaptions={vid.hasCaptions}
              />
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 5F: SQUAD & TECHNICAL BENCH SPOTLIGHT (FC Barcelona Style) */}
      <section className="py-12 md:py-18 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b-2 border-slate-900 pb-3 mb-8">
          <div>
            <p className="athletic-label text-xs text-club-primary">
              2026/27 FKF Premier League Squad
            </p>
            <h2 className="editorial-headline text-3xl md:text-4xl text-slate-900">
              {t('section.squad_spotlight', locale)}
            </h2>
          </div>
          <Link
            href="/team"
            className="athletic-label text-xs tracking-wider text-club-primary hover:underline inline-flex items-center gap-1.5"
          >
            <Users className="w-4 h-4" />
            <span>FULL SQUAD &amp; TECHNICAL BENCH</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* First Team Spotlight Players */}
          {players.map((player) => (
            <article
              key={player.id}
              className="rounded-3xl bg-white border border-slate-200 overflow-hidden shadow-sm barca-card-hover flex flex-col justify-between group"
            >
              <div>
                <AuthenticMediaPlaceholder
                  category={player.isCaptain ? 'Club Captain' : player.position}
                  label={`#${player.shirtNumber ?? '--'} ${player.fullName}`}
                  sublabel="Official 2026/27 First Team Portrait"
                  aspectRatio="video"
                  imageUrl={player.photoUrl}
                  isVerifiedAsset={player.photoVerified}
                />
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <span className="athletic-label text-xs tracking-wider text-club-primary">
                      {player.specificRole || player.position}
                    </span>
                    {player.shirtNumber && (
                      <span className="font-condensed font-black text-3xl text-slate-900">
                        #{player.shirtNumber}
                      </span>
                    )}
                  </div>
                  <h3 className="editorial-headline text-2xl text-slate-900 mt-1 group-hover:text-club-primary transition">
                    <Link href={`/team/${player.slug}`}>
                      {player.fullName}
                    </Link>
                  </h3>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    {locale === 'sw' && player.biographySw
                      ? player.biographySw
                      : player.biographyEn}
                  </p>
                </div>
              </div>
              <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-semibold text-[11px]">Nationality: {player.nationality}</span>
                <Link
                  href={`/team/${player.slug}`}
                  className="athletic-label text-xs tracking-wider text-club-primary hover:underline"
                >
                  FULL PROFILE →
                </Link>
              </div>
            </article>
          ))}

          {/* Technical Leadership Coach */}
          {staff.slice(0, 1).map((member) => (
            <article
              key={member.id}
              className="rounded-3xl bg-white border border-slate-200 overflow-hidden shadow-sm barca-card-hover flex flex-col justify-between group"
            >
              <div>
                <AuthenticMediaPlaceholder
                  category="Technical Bench"
                  label={`${member.fullName} — ${member.roleTitleEn}`}
                  sublabel="Official Technical Staff Portrait"
                  aspectRatio="video"
                  imageUrl={member.photoUrl}
                  isVerifiedAsset={member.photoVerified}
                />
                <div className="p-6">
                  <span className="athletic-label text-xs tracking-wider text-emerald-700">
                    {locale === 'sw' && member.roleTitleSw
                      ? member.roleTitleSw
                      : member.roleTitleEn}
                  </span>
                  <h3 className="editorial-headline text-2xl text-slate-900 mt-1">
                    {member.fullName}
                  </h3>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    {locale === 'sw' && member.biographySw
                      ? member.biographySw
                      : member.biographyEn}
                  </p>
                </div>
              </div>
              <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-semibold text-[11px]">3K FC Technical Leadership</span>
                <Link href="/team" className="athletic-label text-xs tracking-wider text-club-primary hover:underline">
                  TECHNICAL BENCH →
                </Link>
              </div>
            </article>
          ))}

          {/* First Team & Academy Spotlight Card */}
          <div className="rounded-3xl bg-[#081326] text-white p-7 flex flex-col justify-between border border-white/10 barca-card-hover">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs athletic-label tracking-wider text-club-accent">
                <Star className="w-4 h-4 text-club-accent" />
                Embu Stars Academy
              </span>
              <h3 className="editorial-headline text-2xl text-white mt-2">
                Nurturing Mount Kenya's Football Talent
              </h3>
              <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                From grassroots development across Embu County to top-flight FKF Premier League competition, 3K FC provides a professional pathway for aspiring local talent.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-white/10">
              <Link
                href="/team"
                className="inline-flex items-center gap-1.5 athletic-label text-xs tracking-wider text-club-accent hover:underline"
              >
                <span>EXPLORE ENTIRE SQUAD</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5G: OFFICIAL STORE (Barça Store Clean Styling) */}
      <section className="bg-white border-y border-slate-200 py-12 md:py-18 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b-2 border-slate-900 pb-3 mb-8">
            <div>
              <p className="athletic-label text-xs text-club-primary">
                Official Club Merchandise • Prices in KES
              </p>
              <h2 className="editorial-headline text-3xl md:text-4xl text-slate-900">
                {t('section.official_merch', locale)}
              </h2>
            </div>
            <Link
              href="/shop"
              className="athletic-label text-xs tracking-wider text-club-primary hover:underline inline-flex items-center gap-1.5"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>VISIT ONLINE STORE</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => {
              const totalStock = product.variants.reduce(
                (acc, v) => acc + Math.max(0, v.stockQuantity - v.reservedQuantity),
                0
              );
              const primaryImg = product.images?.[0]?.url || null;

              return (
                <article
                  key={product.id}
                  className="rounded-3xl bg-[#F8FAFC] border border-slate-200 overflow-hidden flex flex-col justify-between barca-card-hover group"
                >
                  <div>
                    <AuthenticMediaPlaceholder
                      category={product.category}
                      label={locale === 'sw' ? product.nameSw : product.nameEn}
                      sublabel="Authentic 3K FC Merchandise Item"
                      aspectRatio="square"
                      imageUrl={primaryImg}
                      isVerifiedAsset={!!primaryImg}
                    />
                    <div className="p-5">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        {product.isAuthenticClubGear && (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-extrabold text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Authentic Gear
                          </span>
                        )}
                        <span
                          className={`font-mono text-xs font-bold ${
                            totalStock > 0 ? 'text-slate-600' : 'text-red-600'
                          }`}
                        >
                          {totalStock > 0 ? `${totalStock} in stock` : 'Sold Out'}
                        </span>
                      </div>
                      <h3 className="editorial-headline text-xl text-slate-900 group-hover:text-club-primary transition leading-snug">
                        <Link href={`/shop/${product.slug}`}>
                          {locale === 'sw' ? product.nameSw : product.nameEn}
                        </Link>
                      </h3>
                      <p className="font-mono font-black text-xl text-club-primary mt-2">
                        {formatKes(product.priceKesCents)}
                      </p>
                    </div>
                  </div>
                  <div className="p-5 pt-0">
                    <Link
                      href={`/shop/${product.slug}`}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-full bg-slate-900 hover:bg-club-primary text-white athletic-label text-xs tracking-wider transition transform hover:-translate-y-0.5 shadow-md"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>SELECT SIZE &amp; BUY (M-PESA)</span>
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 5H & 5J: SUPPORTERS' COMMUNITY & EMBU HERITAGE ("Culers" Style) */}
      <section className="py-12 md:py-18 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* FC Barcelona-Style Culers Membership Showcase (7 cols) */}
          <div className="lg:col-span-7 rounded-3xl bg-gradient-to-br from-[#081326] via-[#0D1C38] to-[#160B12] text-white p-8 md:p-12 border border-white/10 flex flex-col justify-between shadow-2xl relative overflow-hidden barca-card-hover">
            {/* Background Genuine Cheering Fan Image Overlay with Dark Scrim */}
            <div className="absolute inset-0 opacity-15 pointer-events-none">
              <img
                src="/images/3k-fc-fan-celebration.jpg"
                alt="3K FC Supporter Celebration"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="relative z-10">
              <span className="inline-flex items-center gap-1.5 athletic-label text-xs tracking-widest text-club-accent">
                <Sparkles className="w-4 h-4 text-club-accent" />
                {t('section.supporters_club', locale)} • 3K Stars
              </span>
              <h2 className="editorial-headline text-3xl md:text-5xl text-white mt-2 tracking-tight">
                Join the Official 3K FC Supporters Club • Earn Exclusive Rewards
              </h2>
              <p className="text-sm text-slate-200 mt-3 leading-relaxed">
                Receive your official Digital Membership Card, enjoy priority access to Moi Stadium home match tickets, earn loyalty points on every match attendance and store order, and unlock member discounts.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                {membershipPlans.map((plan) => (
                  <div
                    key={plan.id}
                    className="rounded-2xl bg-black/50 border border-white/15 p-5 flex flex-col justify-between backdrop-blur-sm"
                  >
                    <div>
                      <span className="text-[10px] athletic-label tracking-wider text-club-accent">
                        {plan.billingCycle}
                      </span>
                      <h3 className="editorial-headline text-xl text-white mt-1">
                        {locale === 'sw' ? plan.nameSw : plan.nameEn}
                      </h3>
                      <p className="font-mono font-black text-xl text-emerald-400 mt-1">
                        {formatKes(plan.priceKesCents)}
                      </p>
                    </div>
                    <p className="text-xs text-slate-300 mt-2">
                      +{plan.welcomeLoyaltyPoints} loyalty points • {plan.merchDiscountPercent}% store discount
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative z-10 mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/supporters"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-club-accent hover:bg-amber-400 text-slate-950 athletic-label text-xs tracking-wider font-black shadow-lg transition transform hover:-translate-y-0.5"
              >
                <span>EXPLORE MEMBERSHIP PLANS</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/support-3k"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-white/10 hover:bg-white/20 text-white athletic-label text-xs tracking-wider border border-white/20 transition"
              >
                <HeartHandshake className="w-4 h-4 text-club-accent" />
                <span>SUPPORT 3K DONATIONS</span>
              </Link>
            </div>
          </div>

          {/* Embu County Heritage Roots (5 cols) */}
          <div className="lg:col-span-5 rounded-3xl bg-white border border-slate-200 p-8 md:p-10 flex flex-col justify-between shadow-sm barca-card-hover">
            <div>
              <div className="inline-flex items-center gap-1.5 athletic-label text-xs tracking-wider text-emerald-700">
                <MapPin className="w-4 h-4" />
                <span>Embu County • Mount Kenya Region</span>
              </div>
              <h2 className="editorial-headline text-3xl text-slate-900 mt-2">
                {t('section.embu_community', locale)}
              </h2>
              <p className="text-sm text-slate-600 mt-3 leading-relaxed">
                3K Football Club proudly represents Embu County as its premier football ambassador, competing in Kenya&apos;s top-flight division at Moi Stadium, Embu.
              </p>
              <div className="mt-6 space-y-2.5 text-xs text-slate-700 bg-slate-50 p-5 rounded-2xl border border-slate-200">
                <div>
                  <strong>Home Fortress:</strong> {settings?.homeStadiumName || 'Moi Stadium, Embu'}
                </div>
                <div>
                  <strong>Historic Promotion:</strong> 2nd Place in 2025/26 FKF NSL (77 Points)
                </div>
                <div>
                  <strong>Club Motto:</strong> &ldquo;God&apos;s Favourite Club&rdquo; • &ldquo;Home of Stars&rdquo;
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between">
              <Link
                href="/club"
                className="athletic-label text-xs tracking-wider text-club-primary hover:underline inline-flex items-center gap-1"
              >
                <span>READ FULL CLUB HERITAGE &amp; TIMELINE</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5I: SPONSOR SHOWCASE */}
      <section className="bg-[#081326] text-white py-12 px-4 sm:px-6 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <span className="athletic-label text-xs tracking-widest text-club-accent">
                Commercial Partnerships
              </span>
              <h2 className="editorial-headline text-2xl text-white mt-1">
                {t('section.sponsors', locale)}
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              {sponsors.map((sp) => (
                <div
                  key={sp.id}
                  className="rounded-2xl bg-white/5 border border-white/15 px-6 py-4 flex items-center gap-4 barca-card-hover"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="editorial-headline text-lg text-white">
                        {sp.businessName}
                      </span>
                      <span className="text-[10px] athletic-label tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                        Official Partner
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {sp.descriptionEn || 'Principal Club & Kit Partner'}
                    </p>
                  </div>
                  <Link
                    href={`/api/sponsors/track?sponsorId=${sp.id}&zone=HOMEPAGE_MAIN&target=${encodeURIComponent(
                      sp.websiteUrl
                    )}`}
                    className="p-2.5 rounded-full bg-white/10 hover:bg-club-primary text-white transition"
                    title={`Visit ${sp.businessName}`}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
