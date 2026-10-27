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
} from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { formatKes } from '@/lib/money';
import { Locale, resolveBilingualField, t } from '@/lib/i18n';
import { LiveMatchBar, MatchBarFixtureData } from '@/components/football/LiveMatchBar';
import { AuthenticMediaPlaceholder } from '@/components/ui/AuthenticMediaPlaceholder';
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
    standingsPl,
    products,
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
        take: 4,
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
        take: 3,
        include: { variants: true, images: true },
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
  const otherNews = latestArticles.filter((a) => a.id !== primaryHero?.id).slice(0, 3);

  return (
    <div className="bg-white text-slate-900 min-h-screen">
      {/* 1. MATCH STATUS BAR (Crisp White with Text Accents) */}
      <LiveMatchBar fixture={matchBarFixture} />

      {/* 2. HERO FEATURE STORY (Clean White Aesthetic with Bold Geometric Typography) */}
      {primaryHero && (
        <section aria-label="Lead Story" className="py-8 md:py-12 border-b border-slate-200 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left Photo (6 cols) */}
              <div className="lg:col-span-7 rounded-3xl overflow-hidden border border-slate-200 shadow-sm group">
                <Link href={`/news/${primaryHero.slug}`} className="block relative overflow-hidden">
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
                </Link>
              </div>

              {/* Right Details (5 cols) */}
              <div className="lg:col-span-5 flex flex-col justify-center space-y-4">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full text-[10px] athletic-label tracking-wider font-extrabold bg-red-50 text-club-primary border border-red-200">
                    {locale === 'sw'
                      ? primaryHero.category.nameSw
                      : primaryHero.category.nameEn}
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

                <h1 className="editorial-headline text-3xl sm:text-4xl md:text-5xl text-slate-950 tracking-tight leading-tight">
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
        </section>
      )}

      {/* 3. CORE EDITORIAL GRID: LATEST NEWS (8 Cols) + LEAGUE TABLE (4 Cols) */}
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {otherNews.map((art) => {
                const tr = resolveBilingualField(art.translations, locale).record;
                return (
                  <article
                    key={art.id}
                    className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-xs hover:shadow-md hover:border-slate-300 transition flex flex-col justify-between group"
                  >
                    <div>
                      <AuthenticMediaPlaceholder
                        category={locale === 'sw' ? art.category.nameSw : art.category.nameEn}
                        label={tr?.headline || art.slug}
                        sublabel={art.featuredImageAlt}
                        aspectRatio="video"
                        imageUrl={art.featuredImageUrl}
                        isVerifiedAsset={!art.isPlaceholderImage}
                      />
                      <div className="p-4">
                        <div className="flex items-center justify-between text-[11px] mb-2">
                          <span className="athletic-label text-[10px] font-bold text-club-primary uppercase">
                            {locale === 'sw' ? art.category.nameSw : art.category.nameEn}
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
                        <h3 className="editorial-headline text-lg text-slate-950 group-hover:text-club-primary transition leading-snug line-clamp-2">
                          <Link href={`/news/${art.slug}`}>{tr?.headline}</Link>
                        </h3>
                        <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                          {tr?.summary}
                        </p>
                      </div>
                    </div>
                    <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-slate-500 font-medium">{art.authorName}</span>
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

      {/* 4. UPCOMING MATCH & TICKETING CTA (Clean White Card) */}
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

      {/* 5. OFFICIAL CLUB GEAR (Clean 3-Kit Row) */}
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {products.slice(0, 3).map((product) => {
              const primaryImg = product.images?.[0]?.url || null;
              return (
                <article
                  key={product.id}
                  className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between group"
                >
                  <AuthenticMediaPlaceholder
                    category={product.category}
                    label={locale === 'sw' ? product.nameSw : product.nameEn}
                    sublabel="Authentic Gear"
                    aspectRatio="square"
                    imageUrl={primaryImg}
                    isVerifiedAsset={!!primaryImg}
                  />
                  <div className="p-5 flex items-center justify-between border-t border-slate-100">
                    <div>
                      <h3 className="editorial-headline text-lg text-slate-950 group-hover:text-club-primary transition">
                        <Link href={`/shop/${product.slug}`}>
                          {locale === 'sw' ? product.nameSw : product.nameEn}
                        </Link>
                      </h3>
                      <p className="font-mono font-black text-lg text-club-primary mt-0.5">
                        {formatKes(product.priceKesCents)}
                      </p>
                    </div>

                    <Link
                      href={`/shop/${product.slug}`}
                      className="px-4 py-2 rounded-full bg-slate-900 hover:bg-club-primary text-white athletic-label text-xs tracking-wider transition"
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

      {/* 6. OFFICIAL COMMERCIAL PARTNERS (Clean Minimalist Strip) */}
      {sponsors.length > 0 && (
        <section className="py-8 bg-slate-50 border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="athletic-label text-xs font-bold text-slate-500">
                Official Commercial Partners
              </span>
              <div className="flex flex-wrap items-center gap-6">
                {sponsors.map((sp) => (
                  <span
                    key={sp.id}
                    className="editorial-headline text-sm font-bold text-slate-700 hover:text-club-primary transition"
                  >
                    {sp.businessName}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
