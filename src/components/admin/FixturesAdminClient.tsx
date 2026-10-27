'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Plus,
  MapPin,
  Clock,
  Ticket,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Radio,
  Trophy,
  RefreshCw,
} from 'lucide-react';

interface ClubOption {
  id: string;
  name: string;
  shortName: string;
  city: string | null;
  isOurClub: boolean;
}

interface CompetitionOption {
  id: string;
  name: string;
  shortName: string;
  slug: string;
}

interface FixtureRecord {
  id: string;
  slug: string;
  roundName: string | null;
  matchday: number | null;
  kickoffAt: string;
  kickoffConfirmed: boolean;
  venueName: string;
  venueCity: string;
  isHomeMatch: boolean;
  status: string;
  ticketsAvailable: boolean;
  homeScore: number | null;
  awayScore: number | null;
  homeClub: { name: string; shortName: string; isOurClub: boolean };
  awayClub: { name: string; shortName: string; isOurClub: boolean };
  competition: { name: string; shortName: string };
}

export function FixturesAdminClient({
  initialFixtures,
  clubs,
  competitions,
}: {
  initialFixtures: FixtureRecord[];
  clubs: ClubOption[];
  competitions: CompetitionOption[];
}) {
  const [fixtures, setFixtures] = useState<FixtureRecord[]>(initialFixtures);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [syncingFlashscore, setSyncingFlashscore] = useState(false);
  const [message, setMessage] = useState<{ text: string; success: boolean } | null>(null);

  const handleSyncFlashscore = async () => {
    setSyncingFlashscore(true);
    setMessage(null);
    try {
      const res = await fetch('/api/fixtures/sync', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to sync from Flashscore.');

      setMessage({
        text: `Successfully synced upcoming fixtures & KPL standings from Flashscore! Past fixtures were purged and the official upcoming schedule was refreshed.`,
        success: true,
      });

      // Reload page to reflect fresh database state
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch (err: any) {
      setMessage({ text: err.message, success: false });
    } finally {
      setSyncingFlashscore(false);
    }
  };

  // Form State
  const [isHome, setIsHome] = useState(true);
  const [selectedOpponentId, setSelectedOpponentId] = useState(
    clubs.find((c) => !c.isOurClub)?.id || ''
  );
  const [customOpponentName, setCustomOpponentName] = useState('');
  const [selectedCompId, setSelectedCompId] = useState(competitions[0]?.id || '');
  const [roundName, setRoundName] = useState('FKF Premier League — Matchday');
  const [matchday, setMatchday] = useState<number>(4);
  const [kickoffAt, setKickoffAt] = useState('2026-11-28T15:00');
  const [kickoffConfirmed, setKickoffConfirmed] = useState(true);
  const [venueName, setVenueName] = useState('Moi Stadium, Embu');
  const [ticketsAvailable, setTicketsAvailable] = useState(true);

  const opponentClubs = clubs.filter((c) => !c.isOurClub);

  const handleOpenAdd = () => {
    setShowAddModal(true);
    setMessage(null);
  };

  const handleHomeToggle = (home: boolean) => {
    setIsHome(home);
    if (home) {
      setVenueName('Moi Stadium, Embu');
    } else {
      const opp = clubs.find((c) => c.id === selectedOpponentId);
      setVenueName(opp ? `${opp.name} Ground` : 'Away Stadium');
    }
  };

  const handleCreateFixture = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/fixtures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isHome,
          awayClubId: isHome ? (selectedOpponentId !== 'CUSTOM' ? selectedOpponentId : undefined) : undefined,
          homeClubId: !isHome ? (selectedOpponentId !== 'CUSTOM' ? selectedOpponentId : undefined) : undefined,
          opponentName: selectedOpponentId === 'CUSTOM' ? customOpponentName : undefined,
          competitionId: selectedCompId,
          roundName: `${roundName} ${matchday}`.trim(),
          matchday: Number(matchday),
          kickoffAt: new Date(kickoffAt).toISOString(),
          kickoffConfirmed,
          venueName,
          ticketsAvailable,
          status: 'SCHEDULED',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to post upcoming fixture.');

      setMessage({ text: 'Match posted successfully! It is now live on the public schedule and match ticker.', success: true });
      setShowAddModal(false);

      // Refresh list locally
      if (data.fixture) {
        setFixtures([data.fixture, ...fixtures]);
      }
    } catch (err: any) {
      setMessage({ text: err.message, success: false });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch('/api/admin/fixtures', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Status update failed.');

      setFixtures(fixtures.map((f) => (f.id === id ? { ...f, status: newStatus } : f)));
      setMessage({ text: `Fixture status updated to ${newStatus}.`, success: true });
    } catch (err: any) {
      setMessage({ text: err.message, success: false });
    }
  };

  const handleDeleteFixture = async (id: string) => {
    if (!confirm('Are you sure you want to delete this fixture?')) return;
    try {
      const res = await fetch(`/api/admin/fixtures?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Delete failed.');

      setFixtures(fixtures.filter((f) => f.id !== id));
      setMessage({ text: 'Fixture removed from schedule.', success: true });
    } catch (err: any) {
      setMessage({ text: err.message, success: false });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
            Fixtures &amp; Scheduling Engine
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Post upcoming matches, update venues and kick-off times, or launch ticket sales.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleSyncFlashscore}
            disabled={syncingFlashscore}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#081326] hover:bg-slate-800 text-club-accent border border-white/15 text-xs font-bold uppercase tracking-wider shadow transition disabled:opacity-50"
            title="Fetch single matchweek fixture from Flashscore and remove finished fixtures"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncingFlashscore ? 'animate-spin' : ''}`} />
            <span>{syncingFlashscore ? 'Syncing...' : 'Sync from Flashscore'}</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-club-primary hover:bg-red-600 text-white text-xs font-bold uppercase tracking-wider shadow transition"
          >
            <Plus className="w-4 h-4" />
            <span>Post Upcoming Match</span>
          </button>
        </div>
      </div>

      {/* Alert Banner */}
      {message && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 text-xs font-semibold ${
            message.success
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
          }`}
        >
          {message.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Add Upcoming Match Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-[#121722] border border-white/15 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-club-accent px-2 py-0.5 rounded bg-club-primary/20">
                  New Fixture
                </span>
                <h3 className="editorial-headline text-2xl text-white mt-1">
                  Schedule Upcoming 3K FC Match
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white text-xl font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateFixture} className="space-y-4 text-xs">
              {/* Home or Away */}
              <div>
                <label className="block text-slate-300 font-bold mb-2">Venue Arrangement</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleHomeToggle(true)}
                    className={`py-3 px-4 rounded-xl font-bold uppercase text-xs transition border ${
                      isHome
                        ? 'bg-club-primary text-white border-club-primary shadow'
                        : 'bg-black/40 text-slate-400 border-white/10 hover:bg-white/5'
                    }`}
                  >
                    HOME Match (Moi Stadium, Embu)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleHomeToggle(false)}
                    className={`py-3 px-4 rounded-xl font-bold uppercase text-xs transition border ${
                      !isHome
                        ? 'bg-club-primary text-white border-club-primary shadow'
                        : 'bg-black/40 text-slate-400 border-white/10 hover:bg-white/5'
                    }`}
                  >
                    AWAY Match (Away Stadium)
                  </button>
                </div>
              </div>

              {/* Opponent Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Opponent Club</label>
                  <select
                    value={selectedOpponentId}
                    onChange={(e) => {
                      setSelectedOpponentId(e.target.value);
                      if (!isHome && e.target.value !== 'CUSTOM') {
                        const opp = clubs.find((c) => c.id === e.target.value);
                        setVenueName(opp ? `${opp.name} Stadium` : 'Away Stadium');
                      }
                    }}
                    className="w-full bg-black/50 border border-white/15 rounded-xl p-2.5 text-white"
                  >
                    {opponentClubs.map((club) => (
                      <option key={club.id} value={club.id}>
                        {club.shortName} ({club.name} • {club.city || 'Kenya'})
                      </option>
                    ))}
                    <option value="CUSTOM">+ Enter Other / New Opponent</option>
                  </select>
                </div>

                {selectedOpponentId === 'CUSTOM' ? (
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Opponent Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Shabana FC, Ulinzi Stars"
                      value={customOpponentName}
                      onChange={(e) => setCustomOpponentName(e.target.value)}
                      className="w-full bg-black/50 border border-white/15 rounded-xl p-2.5 text-white"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Competition</label>
                    <select
                      value={selectedCompId}
                      onChange={(e) => setSelectedCompId(e.target.value)}
                      className="w-full bg-black/50 border border-white/15 rounded-xl p-2.5 text-white"
                    >
                      {competitions.map((comp) => (
                        <option key={comp.id} value={comp.id}>
                          {comp.name} ({comp.shortName})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Matchday & Round */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Round / Competition Stage</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. FKF Premier League — Matchday"
                    value={roundName}
                    onChange={(e) => setRoundName(e.target.value)}
                    className="w-full bg-black/50 border border-white/15 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Matchday #</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={matchday}
                    onChange={(e) => setMatchday(Number(e.target.value))}
                    className="w-full bg-black/50 border border-white/15 rounded-xl p-2.5 text-white font-mono"
                  />
                </div>
              </div>

              {/* Date & Time and Venue */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Kick-off Date &amp; Time (EAT)</label>
                  <input
                    type="datetime-local"
                    required
                    value={kickoffAt}
                    onChange={(e) => setKickoffAt(e.target.value)}
                    className="w-full bg-black/50 border border-white/15 rounded-xl p-2.5 text-white font-mono"
                  />
                  <label className="flex items-center gap-2 mt-1.5 cursor-pointer text-slate-400">
                    <input
                      type="checkbox"
                      checked={kickoffConfirmed}
                      onChange={(e) => setKickoffConfirmed(e.target.checked)}
                      className="rounded bg-black border-white/20 text-club-primary"
                    />
                    <span>Confirmed Kick-off Time</span>
                  </label>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Stadium / Match Venue</label>
                  <input
                    type="text"
                    required
                    value={venueName}
                    onChange={(e) => setVenueName(e.target.value)}
                    className="w-full bg-black/50 border border-white/15 rounded-xl p-2.5 text-white"
                  />
                  {isHome && (
                    <span className="text-[10px] text-amber-300 block mt-1 font-semibold">
                      Default: Moi Stadium, Embu
                    </span>
                  )}
                </div>
              </div>

              {/* Ticketing Options */}
              <div className="p-4 bg-black/40 rounded-xl border border-white/10 flex items-center justify-between">
                <div>
                  <span className="font-bold text-white block">Enable Online Ticket Sales</span>
                  <span className="text-slate-400 text-[11px]">
                    Automatically provision Terraces (KES 200) and VIP Dais (KES 500) ticket tiers.
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ticketsAvailable}
                    onChange={(e) => setTicketsAvailable(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-club-primary"></div>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl bg-club-primary hover:bg-red-600 text-white font-bold uppercase tracking-wider transition shadow-lg disabled:opacity-50"
                >
                  {loading ? 'Posting Match...' : 'Publish Match to Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fixtures Table */}
      <div className="rounded-2xl bg-[#121722] border border-white/10 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between text-xs">
          <span className="font-bold uppercase text-white">Upcoming Fixtures ({fixtures.length}) • Flashscore Feed</span>
          <span className="text-slate-400 font-mono">Timezone: Africa/Nairobi (UTC+3)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-black/30 text-slate-400 uppercase font-mono border-b border-white/5">
              <tr>
                <th className="py-3 px-4">Matchup</th>
                <th className="py-3 px-4">Competition</th>
                <th className="py-3 px-4">Kick-off Date</th>
                <th className="py-3 px-4">Venue</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Tickets</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {fixtures.map((f) => {
                const dateStr = new Date(f.kickoffAt).toLocaleDateString('en-KE', {
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
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white text-sm">
                        <span className={f.homeClub.isOurClub ? 'text-club-accent' : 'text-white'}>
                          {f.homeClub.shortName}
                        </span>{' '}
                        <span className="text-slate-500 font-normal">vs</span>{' '}
                        <span className={f.awayClub.isOurClub ? 'text-club-accent' : 'text-white'}>
                          {f.awayClub.shortName}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {f.isHomeMatch ? 'Home at Moi Stadium' : 'Away Match'}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-club-accent font-semibold">
                      {f.competition.shortName}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-300">
                      <div>{dateStr}</div>
                      <div className="text-[11px] text-slate-400">
                        {timeStr} {f.kickoffConfirmed ? 'EAT' : '(TBD)'}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-300 max-w-xs truncate">
                      {f.venueName}
                    </td>

                    <td className="py-3.5 px-4">
                      <select
                        value={f.status}
                        onChange={(e) => handleStatusChange(f.id, e.target.value)}
                        className={`text-[10px] font-bold uppercase rounded-lg px-2.5 py-1 font-mono border ${
                          f.status === 'FULL_TIME'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : f.status === 'LIVE'
                            ? 'bg-red-500/30 text-white border-red-500 animate-pulse'
                            : 'bg-white/10 text-white border-white/20'
                        }`}
                      >
                        <option value="SCHEDULED">SCHEDULED</option>
                        <option value="LIVE">LIVE</option>
                        <option value="HALF_TIME">HALF_TIME</option>
                        <option value="FULL_TIME">FULL_TIME</option>
                        <option value="POSTPONED">POSTPONED</option>
                        <option value="CANCELLED">CANCELLED</option>
                      </select>
                    </td>

                    <td className="py-3.5 px-4">
                      {f.ticketsAvailable ? (
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <Ticket className="w-3 h-3" />
                          <span>On Sale</span>
                        </span>
                      ) : (
                        <span className="text-slate-500">Closed</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {f.status === 'SCHEDULED' || f.status === 'LIVE' ? (
                          <Link
                            href="/admin/results"
                            className="px-2.5 py-1 rounded bg-white/10 hover:bg-club-primary text-white text-[11px] font-bold transition flex items-center gap-1"
                            title="Enter Full-Time Result"
                          >
                            <Trophy className="w-3 h-3 text-club-accent" />
                            <span>Score</span>
                          </Link>
                        ) : null}

                        <Link
                          href={`/matches/${f.slug}`}
                          target="_blank"
                          className="p-1.5 rounded hover:bg-white/10 text-slate-400 hover:text-white transition"
                          title="View on Public Site"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>

                        <button
                          type="button"
                          onClick={() => handleDeleteFixture(f.id)}
                          className="p-1.5 rounded hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition"
                          title="Delete Fixture"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
