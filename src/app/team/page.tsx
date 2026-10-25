import React from 'react';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { Search, ShieldCheck, Award, ArrowRight, Sparkles } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { Locale } from '@/lib/i18n';
import { AuthenticMediaPlaceholder } from '@/components/ui/AuthenticMediaPlaceholder';

export const dynamic = 'force-dynamic';

export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<{ position?: string; q?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const locale: Locale = cookieStore.get('3kfc_locale')?.value === 'sw' ? 'sw' : 'en';

  const selectedPos = (params.position || 'ALL').toUpperCase();
  const query = (params.q || '').trim();
  const sortMode = params.sort || 'shirt';

  const [players, staff] = await Promise.all([
    prisma.player.findMany({
      where: {
        isActive: true,
        ...(selectedPos !== 'ALL' ? { position: selectedPos } : {}),
        ...(query
          ? {
              OR: [
                { fullName: { contains: query } },
                { nickname: { contains: query } },
                { specificRole: { contains: query } },
              ],
            }
          : {}),
      },
      orderBy:
        sortMode === 'name'
          ? [{ fullName: 'asc' }]
          : [{ shirtNumber: 'asc' }, { isCaptain: 'desc' }],
      include: {
        squadMemberships: {
          include: { season: true },
          orderBy: { updatedAt: 'desc' },
          take: 1,
        },
      },
    }),
    prisma.staffMember.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    }),
  ]);

  const positions = ['ALL', 'GOALKEEPER', 'DEFENDER', 'MIDFIELDER', 'FORWARD'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 md:py-16 space-y-12">
      {/* Header */}
      <div className="border-b-2 border-slate-900 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="athletic-label text-xs text-club-primary">
            3K Football Club — Embu • 2026/27 FKF Premier League Squad
          </p>
          <h1 className="editorial-headline text-4xl md:text-5xl text-slate-900 mt-1">
            First Team &amp; Technical Bench
          </h1>
          <p className="text-sm text-slate-600 mt-2 max-w-2xl leading-relaxed">
            Official club profiles and statistics for 3K FC first team players and coaching staff for the 2026/27 FKF Premier League season.
          </p>
        </div>

        {/* Search & Sort */}
        <form action="/team" method="GET" className="flex flex-wrap items-center gap-2">
          {selectedPos !== 'ALL' && <input type="hidden" name="position" value={selectedPos} />}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Search player name..."
              className="pl-9 pr-3.5 py-2 rounded-full bg-white border border-slate-300 text-sm focus:outline-none focus:border-club-primary"
            />
          </div>
          <select
            name="sort"
            defaultValue={sortMode}
            aria-label="Sort players by"
            className="px-4 py-2 rounded-full bg-white border border-slate-300 text-xs font-bold"
          >
            <option value="shirt">Sort by Shirt #</option>
            <option value="name">Sort by Name</option>
          </select>
          <button
            type="submit"
            className="px-5 py-2 rounded-full bg-slate-900 hover:bg-club-primary text-white text-xs athletic-label tracking-wider transition"
          >
            Apply
          </button>
        </form>
      </div>

      {/* FC Barcelona-Style Official Kit Showcase: Red Home, Black Away, Blue Third */}
      <section className="rounded-3xl bg-[#081326] border border-white/10 text-white overflow-hidden shadow-2xl p-8 sm:p-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-club-primary/20 border border-club-primary/40 text-club-primary text-xs athletic-label tracking-widest">
              <Sparkles className="w-3.5 h-3.5" />
              <span>OFFICIAL 2026/27 KIT COLLECTION</span>
            </span>
            <h2 className="editorial-headline text-3xl sm:text-4xl text-white mt-2">
              Official Match Kits: Home (Red), Away (Black) &amp; Third (Blue)
            </h2>
          </div>
          <Link
            href="/shop"
            className="athletic-label text-xs tracking-wider text-club-accent hover:underline inline-flex items-center gap-1"
          >
            <span>VISIT OFFICIAL STORE</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* Red Home Jersey */}
          <div className="rounded-2xl bg-[#0A1832] border border-white/15 p-5 flex flex-col justify-between barca-card-hover group">
            <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-black/40 mb-4">
              <img
                src="/images/3k-fc-jersey-home-red.png"
                alt="3K FC 2026/27 Official Home Jersey (Red)"
                className="w-full h-full object-contain barca-img-zoom p-2"
              />
              <span className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full text-[10px] athletic-label tracking-wider bg-club-primary text-white font-extrabold shadow">
                HOME
              </span>
            </div>
            <div>
              <h3 className="editorial-headline text-lg text-white">2026/27 Home Jersey (Red)</h3>
              <p className="font-mono font-bold text-sm text-club-accent mt-1">KES 2,500</p>
            </div>
            <Link
              href="/shop/3k-fc-2026-27-official-home-replica-jersey"
              className="mt-4 w-full text-center px-4 py-2.5 rounded-full bg-club-primary hover:bg-red-700 text-white athletic-label text-xs tracking-wider transition shadow-sm"
            >
              Buy Home Jersey
            </Link>
          </div>

          {/* Black Away Jersey */}
          <div className="rounded-2xl bg-[#0A1832] border border-white/15 p-5 flex flex-col justify-between barca-card-hover group">
            <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-black/40 mb-4">
              <img
                src="/images/3k-fc-jersey-away-black.png"
                alt="3K FC 2026/27 Official Away Jersey (Black)"
                className="w-full h-full object-contain barca-img-zoom p-2"
              />
              <span className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full text-[10px] athletic-label tracking-wider bg-slate-900 text-amber-300 border border-amber-400/30 font-extrabold shadow">
                AWAY
              </span>
            </div>
            <div>
              <h3 className="editorial-headline text-lg text-white">2026/27 Away Jersey (Black)</h3>
              <p className="font-mono font-bold text-sm text-club-accent mt-1">KES 2,500</p>
            </div>
            <Link
              href="/shop/3k-fc-2026-27-official-away-replica-jersey"
              className="mt-4 w-full text-center px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white athletic-label text-xs tracking-wider transition border border-white/20 shadow-sm"
            >
              Buy Away Jersey
            </Link>
          </div>

          {/* Blue Third Jersey */}
          <div className="rounded-2xl bg-[#0A1832] border border-white/15 p-5 flex flex-col justify-between barca-card-hover group">
            <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-black/40 mb-4">
              <img
                src="/images/3k-fc-jersey-third-blue.png"
                alt="3K FC 2026/27 Official Third Jersey (Blue)"
                className="w-full h-full object-contain barca-img-zoom p-2"
              />
              <span className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full text-[10px] athletic-label tracking-wider bg-[#0E4494] text-white font-extrabold shadow">
                THIRD
              </span>
            </div>
            <div>
              <h3 className="editorial-headline text-lg text-white">2026/27 Third Jersey (Blue)</h3>
              <p className="font-mono font-bold text-sm text-club-accent mt-1">KES 2,500</p>
            </div>
            <Link
              href="/shop/3k-fc-2026-27-official-third-replica-jersey"
              className="mt-4 w-full text-center px-4 py-2.5 rounded-full bg-[#0E4494] hover:bg-blue-700 text-white athletic-label text-xs tracking-wider transition shadow-sm"
            >
              Buy Third Jersey
            </Link>
          </div>
        </div>
      </section>

      {/* Position Filter Pills */}
      <div className="flex flex-wrap items-center gap-2">
        {positions.map((pos) => (
          <Link
            key={pos}
            href={pos === 'ALL' ? '/team' : `/team?position=${pos}`}
            className={`px-4 py-2 rounded-full text-xs athletic-label tracking-wider transition ${
              selectedPos === pos
                ? 'bg-club-primary text-white shadow'
                : 'bg-white text-slate-700 border border-slate-300 hover:border-slate-900'
            }`}
          >
            {pos === 'ALL' ? 'All Positions' : `${pos}S`}
          </Link>
        ))}
      </div>

      {/* First Team Players Grid */}
      <section className="mb-14">
        <h2 className="editorial-headline text-3xl text-slate-900 mb-6">
          First Team Squad Registry
        </h2>

        {players.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {players.map((player) => {
              const stats = player.squadMemberships[0];
              return (
                <article
                  key={player.id}
                  className="rounded-3xl bg-white border border-slate-200 overflow-hidden shadow-sm barca-card-hover group flex flex-col justify-between"
                >
                  <div>
                    <AuthenticMediaPlaceholder
                      category={player.isCaptain ? 'Club Captain' : player.position}
                      label={`#${player.shirtNumber ?? '--'} ${player.fullName}`}
                      sublabel="Official First Team Player Portrait"
                      aspectRatio="video"
                      imageUrl={player.photoUrl}
                      isVerifiedAsset={player.photoVerified}
                    />
                    <div className="p-6">
                      <div className="flex items-center justify-between">
                        <span className="athletic-label text-xs tracking-wider text-club-primary">
                          {player.specificRole || player.position}
                        </span>
                        <span className="font-condensed font-black text-3xl text-slate-900">
                          #{player.shirtNumber ?? '—'}
                        </span>
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

                      {stats && (
                        <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-4 gap-2 text-center">
                          <div className="bg-slate-50 rounded-xl p-2">
                            <div className="text-[10px] athletic-label text-slate-500">Apps</div>
                            <div className="font-mono font-bold text-sm text-slate-900">
                              {stats.appearances}
                            </div>
                          </div>
                          <div className="bg-slate-50 rounded-xl p-2">
                            <div className="text-[10px] athletic-label text-slate-500">Starts</div>
                            <div className="font-mono font-bold text-sm text-slate-900">
                              {stats.starts}
                            </div>
                          </div>
                          <div className="bg-slate-50 rounded-xl p-2">
                            <div className="text-[10px] athletic-label text-slate-500">Goals</div>
                            <div className="font-mono font-bold text-sm text-slate-900">
                              {stats.goals}
                            </div>
                          </div>
                          <div className="bg-slate-50 rounded-xl p-2">
                            <div className="text-[10px] athletic-label text-slate-500">Assists</div>
                            <div className="font-mono font-bold text-sm text-slate-900">
                              {stats.assists}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-semibold text-[11px]">{player.nationality}</span>
                    <Link
                      href={`/team/${player.slug}`}
                      className="inline-flex items-center gap-1 athletic-label text-xs tracking-wider text-club-primary hover:underline"
                    >
                      <span>CAREER RECORD</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-3xl bg-white border border-slate-200 p-8 text-center text-sm text-slate-600">
            No player profiles match the selected position filter. Additional 2026/27 FKF Premier League squad profiles are published via the Club Admin Dashboard as FKF registrations are ratified.
          </div>
        )}
      </section>

      {/* Technical Bench Section */}
      <section className="mb-14 pt-8 border-t-2 border-slate-900">
        <div className="mb-6">
          <p className="athletic-label text-xs text-emerald-700">
            Coaching &amp; Performance Leadership
          </p>
          <h2 className="editorial-headline text-3xl md:text-4xl text-slate-900">
            Technical Bench
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {staff.map((member) => (
            <article
              key={member.id}
              className="rounded-3xl bg-white border border-slate-200 overflow-hidden shadow-sm barca-card-hover group"
            >
              <AuthenticMediaPlaceholder
                category="Technical Bench"
                label={`${member.fullName} — ${member.roleTitleEn}`}
                sublabel="Official Technical Staff Portrait Slot"
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
            </article>
          ))}
        </div>
      </section>

      {/* Top Scorer & Season Statistics Integrity Panel */}
      <section className="rounded-3xl bg-[#081326] text-white p-8 md:p-10 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 athletic-label text-xs tracking-wider text-club-accent">
            <Award className="w-4 h-4" />
            <span>2026/27 Season Statistical Leaderboard</span>
          </div>
          <h3 className="editorial-headline text-2xl md:text-3xl text-white">
            Verified Match Records &amp; Player Privacy Policy
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Top scorer rankings, starts, assists, and disciplinary records are computed automatically from confirmed 2026/27 FKF Premier League match events. Sensitive personal player details are protected in compliance with club governance and Kenyan data protection regulations.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-emerald-400 font-bold shrink-0">
          <ShieldCheck className="w-5 h-5" />
          <span className="athletic-label tracking-wider">100% VERIFIED CLUB DATA</span>
        </div>
      </section>
    </div>
  );
}
