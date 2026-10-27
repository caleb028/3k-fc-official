import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  Calendar,
  Ticket,
  ShoppingBag,
  HeartHandshake,
  Gift,
  Newspaper,
  CreditCard,
  ShieldCheck,
  TrendingUp,
  ArrowRight,
  ScanLine,
  ExternalLink,
  RefreshCw,
  Clock,
  MapPin,
} from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';
import { formatKes } from '@/lib/money';
import { syncFlashscoreMatchweekFixture } from '@/lib/flashscore';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const user = await getAuthenticatedUser('ADMIN');
  if (!user || !user.isStaff) {
    redirect('/admin/login');
  }

  // Ensure fresh upcoming fixtures directly fetched from Flashscore (purging any past fixtures)
  await syncFlashscoreMatchweekFixture().catch(() => null);

  const pastCutoff = new Date(Date.now() - 3 * 3600 * 1000);

  // Live database-backed metrics (Section 20: Never use hardcoded demo statistics)
  const [
    upcomingFixturesCount,
    finishedResultsCount,
    publishedArticlesCount,
    draftArticlesCount,
    ticketsSoldCount,
    confirmedTicketRevenue,
    pendingPaymentsCount,
    shopOrdersCount,
    activeMembersCount,
    confirmedDonationsTotal,
    activeSponsorsCount,
    settings,
    upcomingFixtures,
  ] = await Promise.all([
    prisma.fixture.count({
      where: {
        status: { in: ['SCHEDULED', 'LIVE', 'HALF_TIME'] },
        kickoffAt: { gte: pastCutoff },
      },
    }).catch(() => 0),
    prisma.fixture.count({ where: { status: 'FULL_TIME' } }).catch(() => 0),
    prisma.article.count({ where: { status: 'PUBLISHED' } }).catch(() => 0),
    prisma.article.count({ where: { status: 'DRAFT' } }).catch(() => 0),
    prisma.ticket.count({ where: { status: { in: ['VALID', 'REDEEMED'] } } }).catch(() => 0),
    prisma.ticketOrder.aggregate({
      where: { status: 'PAID' },
      _sum: { totalKesCents: true },
    }).catch(() => ({ _sum: { totalKesCents: 0 } })),
    prisma.paymentTransaction.count({ where: { status: 'PENDING' } }).catch(() => 0),
    prisma.shopOrder.count().catch(() => 0),
    prisma.membership.count({ where: { status: 'ACTIVE' } }).catch(() => 0),
    prisma.donation.aggregate({
      where: { status: 'CONFIRMED' },
      _sum: { amountKesCents: true },
    }).catch(() => ({ _sum: { amountKesCents: 0 } })),
    prisma.sponsor.count({ where: { isPublished: true } }).catch(() => 0),
    prisma.clubSettings.findUnique({ where: { id: 'default' } }).catch(() => null),
    prisma.fixture.findMany({
      where: {
        status: { in: ['SCHEDULED', 'LIVE', 'HALF_TIME'] },
        kickoffAt: { gte: pastCutoff },
      },
      orderBy: { kickoffAt: 'asc' },
      take: 8,
      include: {
        homeClub: true,
        awayClub: true,
        competition: true,
      },
    }).catch(() => []),
  ]);

  const totalTicketKesCents = confirmedTicketRevenue?._sum?.totalKesCents || 0;
  const totalDonationsKesCents = confirmedDonationsTotal?._sum?.amountKesCents || 0;

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-club-primary text-white">
              Back-Office Control Room
            </span>
            <span className="text-xs text-slate-400">
              Season 2026/27 • Database State: Live
            </span>
          </div>
          <h1 className="editorial-headline font-black text-3xl text-white mt-1">
            3K FC Platform Operations
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Authorized administrator session: <strong>{user.email}</strong> ({user.roles.join(', ')})
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/gate"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-club-primary hover:bg-red-600 text-white text-xs font-bold uppercase tracking-wider shadow transition"
          >
            <ScanLine className="w-4 h-4" />
            <span>Launch Gate Turnstile Scanner</span>
          </Link>
        </div>
      </div>

      {/* Provisional Palette Warning Banner (if unconfirmed) */}
      {settings?.paletteStatus === 'PROVISIONAL' && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-400/30 flex items-center justify-between gap-4">
          <div className="text-xs text-amber-200">
            <strong>Provisional Brand Palette Active:</strong> Section 3 requires the administrator to confirm the official brand colors and crest asset before final public release.
          </div>
          <Link
            href="/admin/settings"
            className="shrink-0 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold"
          >
            Confirm Palette &amp; Crest →
          </Link>
        </div>
      )}

      {/* Core Operational KPI Grid (Database-Backed) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Ticket Revenue */}
        <div className="rounded-2xl bg-[#121722] border border-white/10 p-5 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-bold uppercase tracking-wider">Ticket Revenue</span>
            <Ticket className="w-4 h-4 text-club-accent" />
          </div>
          <div className="font-mono font-black text-2xl text-white">
            {formatKes(totalTicketKesCents)}
          </div>
          <div className="text-xs text-slate-400">
            <strong>{ticketsSoldCount}</strong> verified tickets issued
          </div>
        </div>

        {/* Memberships */}
        <div className="rounded-2xl bg-[#121722] border border-white/10 p-5 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-bold uppercase tracking-wider">Active Members</span>
            <HeartHandshake className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="font-mono font-black text-2xl text-white">
            {activeMembersCount}
          </div>
          <div className="text-xs text-slate-400">
            Supporters with active digital cards
          </div>
        </div>

        {/* Confirmed Donations */}
        <div className="rounded-2xl bg-[#121722] border border-white/10 p-5 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-bold uppercase tracking-wider">Confirmed Donations</span>
            <Gift className="w-4 h-4 text-amber-400" />
          </div>
          <div className="font-mono font-black text-2xl text-emerald-400">
            {formatKes(totalDonationsKesCents)}
          </div>
          <div className="text-xs text-slate-400">
            Strictly excludes pending payments
          </div>
        </div>

        {/* Store Orders */}
        <div className="rounded-2xl bg-[#121722] border border-white/10 p-5 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-bold uppercase tracking-wider">Merchandise Orders</span>
            <ShoppingBag className="w-4 h-4 text-club-primary" />
          </div>
          <div className="font-mono font-black text-2xl text-white">
            {shopOrdersCount}
          </div>
          <div className="text-xs text-slate-400">
            Embu collection &amp; nationwide deliveries
          </div>
        </div>
      </div>

      {/* Official Upcoming Fixtures — Directly Fetched from Flashscore */}
      <div className="rounded-2xl bg-[#121722] border border-white/10 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h2 className="font-bold uppercase tracking-wider text-white">
              Official Upcoming Fixtures • Flashscore Live Feed
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Upcoming Matches Only
            </span>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://www.flashscore.com/team/3k-fc/8reiOTYF/fixtures/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition font-medium"
            >
              <span>Source: Flashscore Kenya</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <Link
              href="/admin/fixtures"
              className="px-3.5 py-1.5 rounded-lg bg-club-primary hover:bg-red-600 text-white text-xs font-bold uppercase tracking-wider transition"
            >
              Manage Fixtures →
            </Link>
          </div>
        </div>

        {upcomingFixtures && upcomingFixtures.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-black/30 text-slate-400 uppercase font-mono border-b border-white/5">
                <tr>
                  <th className="py-3 px-4">Matchup</th>
                  <th className="py-3 px-4">Competition</th>
                  <th className="py-3 px-4">Kick-off (EAT)</th>
                  <th className="py-3 px-4">Venue</th>
                  <th className="py-3 px-4">Ticketing</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {upcomingFixtures.map((f: any) => {
                  const dateStr = new Date(f.kickoffAt).toLocaleDateString('en-KE', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    timeZone: 'Africa/Nairobi',
                  });
                  const timeStr = new Date(f.kickoffAt).toLocaleTimeString('en-KE', {
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZone: 'Africa/Nairobi',
                  });

                  return (
                    <tr key={f.id} className="hover:bg-white/5 transition">
                      <td className="py-3.5 px-4 font-bold text-white">
                        <div className="text-sm">
                          <span className={f.homeClub.isOurClub ? 'text-club-accent' : 'text-white'}>
                            {f.homeClub.shortName}
                          </span>{' '}
                          <span className="text-slate-500 font-normal">vs</span>{' '}
                          <span className={f.awayClub.isOurClub ? 'text-club-accent' : 'text-white'}>
                            {f.awayClub.shortName}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {f.isHomeMatch ? 'Home Match at Moi Stadium' : 'Away Match'}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-club-accent font-semibold">
                        {f.competition?.shortName || 'FKF Premier League'}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-200">
                        <div>{dateStr}</div>
                        <div className="text-[11px] text-slate-400">{timeStr} EAT</div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-300 max-w-xs truncate">
                        {f.venueName}
                      </td>

                      <td className="py-3.5 px-4">
                        {f.ticketsAvailable ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            <Ticket className="w-3 h-3" />
                            <span>Tickets On Sale</span>
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[11px]">
                            {f.isHomeMatch ? 'Tickets Pending' : 'Away Gate'}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href="/admin/fixtures"
                            className="p-1.5 rounded hover:bg-white/10 text-slate-400 hover:text-white transition"
                            title="Edit Fixture"
                          >
                            Edit
                          </Link>
                          <Link
                            href={`/matches/${f.slug}`}
                            target="_blank"
                            className="p-1.5 rounded hover:bg-white/10 text-slate-400 hover:text-club-accent transition"
                            title="View Public Match Centre"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400 text-xs">
            No upcoming fixtures found on Flashscore. Click "Sync from Flashscore" to refresh.
          </div>
        )}
      </div>

      {/* Operational Modules Quick Access Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Match Operations */}
        <div className="rounded-2xl bg-[#121722] border border-white/10 p-6 space-y-4">
          <h2 className="font-display font-bold text-lg text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-club-accent" />
            <span>Football Operations</span>
          </h2>
          <ul className="space-y-2 text-xs text-slate-300">
            <li className="flex justify-between py-1 border-b border-white/5">
              <span>Upcoming Scheduled Fixtures:</span>
              <strong className="font-mono text-white">{upcomingFixturesCount}</strong>
            </li>
            <li className="flex justify-between py-1 border-b border-white/5">
              <span>Completed Full-Time Results:</span>
              <strong className="font-mono text-white">{finishedResultsCount}</strong>
            </li>
            <li className="flex justify-between py-1">
              <span>Home Stadium:</span>
              <strong className="text-amber-300">{settings?.homeStadiumName || 'Moi Stadium'}</strong>
            </li>
          </ul>
          <div className="pt-2 flex gap-2">
            <Link
              href="/admin/fixtures"
              className="flex-1 text-center py-2 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold text-white"
            >
              Manage Fixtures
            </Link>
            <Link
              href="/admin/match-centre"
              className="flex-1 text-center py-2 rounded-lg bg-club-primary hover:bg-red-600 text-xs font-bold text-white"
            >
              Match Centre
            </Link>
          </div>
        </div>

        {/* Editorial Operations */}
        <div className="rounded-2xl bg-[#121722] border border-white/10 p-6 space-y-4">
          <h2 className="font-display font-bold text-lg text-white flex items-center gap-2">
            <Newspaper className="w-4 h-4 text-club-accent" />
            <span>Editorial &amp; Media Desk</span>
          </h2>
          <ul className="space-y-2 text-xs text-slate-300">
            <li className="flex justify-between py-1 border-b border-white/5">
              <span>Published Articles:</span>
              <strong className="font-mono text-emerald-400">{publishedArticlesCount}</strong>
            </li>
            <li className="flex justify-between py-1 border-b border-white/5">
              <span>Draft Content:</span>
              <strong className="font-mono text-amber-300">{draftArticlesCount}</strong>
            </li>
            <li className="flex justify-between py-1">
              <span>Bilingual Support:</span>
              <strong className="text-white">EN &amp; Kiswahili</strong>
            </li>
          </ul>
          <div className="pt-2 flex gap-2">
            <Link
              href="/admin/news"
              className="w-full text-center py-2 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold text-white"
            >
              Publish &amp; Edit Articles
            </Link>
          </div>
        </div>

        {/* Commercial & Compliance */}
        <div className="rounded-2xl bg-[#121722] border border-white/10 p-6 space-y-4">
          <h2 className="font-display font-bold text-lg text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Commercial &amp; Compliance</span>
          </h2>
          <ul className="space-y-2 text-xs text-slate-300">
            <li className="flex justify-between py-1 border-b border-white/5">
              <span>Published Sponsors:</span>
              <strong className="font-mono text-white">{activeSponsorsCount}</strong>
            </li>
            <li className="flex justify-between py-1 border-b border-white/5">
              <span>Pending M-Pesa Txs:</span>
              <strong className="font-mono text-amber-300">{pendingPaymentsCount}</strong>
            </li>
            <li className="flex justify-between py-1">
              <span>Data Protection:</span>
              <strong className="text-emerald-400">KDPA 2019 Active</strong>
            </li>
          </ul>
          <div className="pt-2 flex gap-2">
            <Link
              href="/admin/reports"
              className="flex-1 text-center py-2 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold text-white"
            >
              Reports &amp; Exports
            </Link>
            <Link
              href="/admin/audit-logs"
              className="flex-1 text-center py-2 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold text-white"
            >
              Audit Logs
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
