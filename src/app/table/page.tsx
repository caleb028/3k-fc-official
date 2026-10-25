import React from 'react';
import Link from 'next/link';
import { Clock, ShieldCheck, Info, ExternalLink } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { syncFlashscoreStandings } from '@/lib/flashscore';
import { ClubCrest } from '@/components/ui/ClubCrest';

export const dynamic = 'force-dynamic';

export default async function LeagueTablePage({
  searchParams,
}: {
  searchParams: Promise<{ competition?: string }>;
}) {
  const params = await searchParams;
  const selectedCompSlug = params.competition || 'fkf-premier-league';

  // Automatically sync standings from Flashscore if premier league is selected
  if (selectedCompSlug === 'fkf-premier-league') {
    await syncFlashscoreStandings().catch(() => {});
  }

  const [competitions, standings] = await Promise.all([
    prisma.competition.findMany({
      where: {
        slug: { in: ['fkf-premier-league', 'fkf-national-super-league'] },
      },
      orderBy: { tier: 'asc' },
    }),
    prisma.leagueStanding.findMany({
      where: {
        competition: { slug: selectedCompSlug },
      },
      orderBy: [{ position: 'asc' }, { points: 'desc' }, { goalDifference: 'desc' }],
      include: {
        club: true,
        competition: true,
        season: true,
      },
    }),
  ]);

  const currentComp =
    competitions.find((c) => c.slug === selectedCompSlug) || competitions[0];
  const lastUpdated = standings[0]?.lastUpdatedAt;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 md:py-14">
      <div className="border-b-2 border-slate-900 pb-6 mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <p className="athletic-label text-xs font-extrabold text-club-primary tracking-wider uppercase">
              Official Competition Standings • Flashscore Live Sync
            </p>
          </div>
          <h1 className="editorial-headline font-black text-3xl md:text-5xl text-slate-900 mt-1">
            {currentComp?.name || 'League Standings'}
          </h1>
          <p className="text-sm text-slate-600 mt-2 max-w-2xl">
            Live league table standing fetched directly from official Kenyan Premier League match data. Highlighted row indicates <strong>3K FC (Embu)</strong>.
          </p>
        </div>

        {/* Competition Selector & Flashscore Link */}
        <div className="flex flex-wrap items-center gap-2">
          {competitions.map((comp) => (
            <Link
              key={comp.id}
              href={`/table?competition=${comp.slug}`}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
                selectedCompSlug === comp.slug
                  ? 'bg-club-primary text-white shadow'
                  : 'bg-white text-slate-800 border border-slate-300 hover:border-slate-900'
              }`}
            >
              {comp.name}
            </Link>
          ))}
          <a
            href="https://www.flashscore.co.ke/football/kenya/kpl/standings/jN7arfI0/standings/overall/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-slate-600 hover:text-slate-900 border border-slate-300 hover:border-slate-400 bg-white"
          >
            <span>Flashscore Table</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Competition Status Banner */}
      <div className="rounded-xl bg-slate-900 text-slate-200 p-4 mb-6 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-club-accent uppercase tracking-wider">FKF Premier League</span>
          <span>• 18 Clubs • Season 2026/27</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-400">
          <Clock className="w-3.5 h-3.5 text-club-accent" />
          <span>
            Last Updated:{' '}
            {lastUpdated
              ? new Date(lastUpdated).toLocaleString('en-KE', { timeZone: 'Africa/Nairobi' })
              : 'Official Standings'}
          </span>
        </div>
      </div>

      {/* Table */}
      {standings.length > 0 ? (
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-600 text-xs uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4 text-center">#</th>
                  <th className="py-3.5 px-4">Club</th>
                  <th className="py-3.5 px-3 text-center">MP</th>
                  <th className="py-3.5 px-3 text-center">W</th>
                  <th className="py-3.5 px-3 text-center">D</th>
                  <th className="py-3.5 px-3 text-center">L</th>
                  <th className="py-3.5 px-3 text-center">GF</th>
                  <th className="py-3.5 px-3 text-center">GA</th>
                  <th className="py-3.5 px-3 text-center">GD</th>
                  <th className="py-3.5 px-4 text-right">Pts</th>
                  <th className="py-3.5 px-4 text-center">Form</th>
                  <th className="py-3.5 px-4">Qualification / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {standings.map((row) => {
                  const isOur = row.club.isOurClub;
                  const isTop = row.position === 1;
                  const isBottom = row.position >= 16;
                  const formItems = row.form ? row.form.split(',') : [];

                  return (
                    <tr
                      key={row.id}
                      className={
                        isOur
                          ? 'bg-[#004D98]/10 font-bold text-slate-900 border-l-4 border-l-[#A50044]'
                          : 'hover:bg-slate-50 text-slate-700'
                      }
                    >
                      <td className="py-4 px-4 text-center font-mono font-bold">
                        <span
                          className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs ${
                            isTop
                              ? 'bg-amber-500/10 text-amber-600 font-black'
                              : isBottom
                              ? 'bg-rose-500/10 text-rose-600'
                              : 'text-slate-600'
                          }`}
                        >
                          {row.position}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          {isOur ? (
                            <ClubCrest size="sm" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-[10px] font-black text-slate-700">
                              {row.club.shortName?.slice(0, 3).toUpperCase() || 'FC'}
                            </div>
                          )}
                          <div>
                            <span
                              className={`font-display font-bold text-base ${
                                isOur ? 'text-[#004D98]' : 'text-slate-900'
                              }`}
                            >
                              {row.club.name}
                            </span>
                            {isOur && (
                              <span className="ml-2 text-[10px] font-black uppercase px-2 py-0.5 rounded bg-[#A50044] text-white tracking-wider">
                                OUR CLUB
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-3 text-center font-mono">{row.played}</td>
                      <td className="py-4 px-3 text-center font-mono">{row.won}</td>
                      <td className="py-4 px-3 text-center font-mono">{row.drawn}</td>
                      <td className="py-4 px-3 text-center font-mono">{row.lost}</td>
                      <td className="py-4 px-3 text-center font-mono">{row.goalsFor}</td>
                      <td className="py-4 px-3 text-center font-mono">{row.goalsAgainst}</td>
                      <td className="py-4 px-3 text-center font-mono font-bold">
                        {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                      </td>
                      <td className="py-4 px-4 text-right font-mono font-black text-base text-slate-900">
                        {row.points}
                      </td>
                      <td className="py-4 px-4 text-center">
                        {formItems.length > 0 ? (
                          <div className="flex items-center justify-center gap-1">
                            {formItems.map((f, i) => (
                              <span
                                key={i}
                                className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-black text-white ${
                                  f === 'W'
                                    ? 'bg-emerald-600'
                                    : f === 'D'
                                    ? 'bg-slate-400'
                                    : 'bg-rose-600'
                                }`}
                              >
                                {f}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-xs">
                        {row.qualificationNote ? (
                          <span
                            className={`font-semibold ${
                              isTop
                                ? 'text-emerald-700'
                                : isBottom
                                ? 'text-rose-700'
                                : 'text-slate-500'
                            }`}
                          >
                            {row.qualificationNote}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-white border border-slate-200 p-12 text-center">
          <Info className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h2 className="font-display font-bold text-xl text-slate-900">
            Official Competition Data Currently Unavailable
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Standings will be displayed here as soon as verified by the Football Kenya Federation.
          </p>
        </div>
      )}
    </div>
  );
}
