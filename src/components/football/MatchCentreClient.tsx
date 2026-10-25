'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Radio,
  Wifi,
  WifiOff,
  Pin,
  Clock,
  ShieldCheck,
  Users,
  BarChart3,
  Vote,
  Ticket,
  AlertTriangle,
} from 'lucide-react';

interface MatchCentreClientProps {
  slug: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialFixture: any;
}

export function MatchCentreClient({ slug, initialFixture }: MatchCentreClientProps) {
  const [fixture, setFixture] = useState(initialFixture);
  const [activeTab, setActiveTab] = useState<'blog' | 'timeline' | 'lineups' | 'stats' | 'poll'>('blog');
  const [connectionState, setConnectionState] = useState<'SSE_CONNECTED' | 'POLLING_FALLBACK' | 'RECONNECTING'>('SSE_CONNECTED');
  const [selectedPollOption, setSelectedPollOption] = useState<string>('');
  const [pollSubmitting, setPollSubmitting] = useState(false);
  const [pollFeedback, setPollFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let pollTimer: NodeJS.Timeout | null = null;

    const startPollingFallback = () => {
      setConnectionState('POLLING_FALLBACK');
      if (pollTimer) clearInterval(pollTimer);
      pollTimer = setInterval(async () => {
        try {
          const res = await fetch(`/api/matches/${slug}/stream?mode=poll`, { cache: 'no-store' });
          if (res.ok) {
            const data = await res.json();
            if (data.fixture) setFixture(data.fixture);
          }
        } catch {
          setConnectionState('RECONNECTING');
        }
      }, 10000);
    };

    try {
      eventSource = new EventSource(`/api/matches/${slug}/stream`);
      eventSource.onopen = () => {
        setConnectionState('SSE_CONNECTED');
      };
      eventSource.onmessage = (evt) => {
        try {
          const parsed = JSON.parse(evt.data);
          if (parsed.fixture) {
            setFixture(parsed.fixture);
          }
        } catch {
          // ignore parse error
        }
      };
      eventSource.onerror = () => {
        eventSource?.close();
        startPollingFallback();
      };
    } catch {
      startPollingFallback();
    }

    return () => {
      eventSource?.close();
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [slug]);

  const handlePollVote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPollOption) return;
    setPollSubmitting(true);
    setPollFeedback(null);

    try {
      const res = await fetch(`/api/matches/${slug}/poll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionId: selectedPollOption }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPollFeedback({ type: 'error', text: data.error || 'Could not submit vote.' });
      } else {
        setPollFeedback({ type: 'success', text: data.message });
        if (data.poll) {
          setFixture((prev: typeof initialFixture) => ({ ...prev, poll: data.poll }));
        }
      }
    } catch {
      setPollFeedback({ type: 'error', text: 'Network error while submitting vote.' });
    } finally {
      setPollSubmitting(false);
    }
  };

  const isLiveOrDone =
    fixture.status === 'LIVE' || fixture.status === 'HALF_TIME' || fixture.status === 'FULL_TIME';

  const totalVotes =
    fixture.poll?.options?.reduce((acc: number, o: { voteCount: number }) => acc + o.voteCount, 0) || 0;

  return (
    <div>
      {/* Match Header Banner */}
      <section className="bg-gradient-to-br from-club-surfaceDark via-[#17121E] to-club-primaryDark text-white py-10 px-4 sm:px-6 border-b border-white/15">
        <div className="max-w-6xl mx-auto">
          {/* Top Status & Real-Time Connection Indicator */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs mb-6">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded bg-club-primary text-white font-extrabold uppercase tracking-wider">
                {fixture.competition.name} • {fixture.season.name}
              </span>
              <span className="px-2.5 py-1 rounded bg-white/10 text-club-accent font-bold uppercase">
                {fixture.status.replace('_', ' ')}
                {fixture.status === 'LIVE' && fixture.liveMinute ? ` (${fixture.liveMinute}')` : ''}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {connectionState === 'SSE_CONNECTED' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                  <Wifi className="w-3.5 h-3.5" />
                  <span>Live Match Stream Connected (SSE)</span>
                </span>
              )}
              {connectionState === 'POLLING_FALLBACK' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                  <Radio className="w-3.5 h-3.5" />
                  <span>Polling Fallback Active (Auto-Syncing)</span>
                </span>
              )}
              {connectionState === 'RECONNECTING' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 font-semibold">
                  <WifiOff className="w-3.5 h-3.5" />
                  <span>Match Update Connection Interrupted — Retrying...</span>
                </span>
              )}
            </div>
          </div>

          {/* Scoreboard */}
          <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-6 bg-black/40 border border-white/15 rounded-2xl p-6 md:p-8 text-center">
            <div>
              <span className="text-[11px] uppercase tracking-widest text-slate-400 block mb-1">
                Home Club
              </span>
              <h1 className="editorial-headline font-black text-2xl md:text-3xl text-white">
                {fixture.homeClub.name}
              </h1>
            </div>

            <div className="flex flex-col items-center justify-center">
              {isLiveOrDone ? (
                <div className="font-display font-black text-4xl md:text-5xl text-club-accent tracking-wider">
                  {fixture.homeScore ?? 0} : {fixture.awayScore ?? 0}
                </div>
              ) : (
                <div className="px-5 py-2 rounded-xl bg-white/10 font-mono font-bold text-lg text-white">
                  {new Date(fixture.kickoffAt).toLocaleTimeString('en-KE', {
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZone: 'Africa/Nairobi',
                  })}{' '}
                  EAT
                  {!fixture.kickoffConfirmed && (
                    <span className="block text-[10px] text-amber-300 font-normal">
                      Time Subject to Confirmation
                    </span>
                  )}
                </div>
              )}
              <span className="text-xs text-slate-300 mt-2">
                {new Date(fixture.kickoffAt).toLocaleDateString('en-KE', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
              <span className="text-xs text-slate-400 mt-0.5">{fixture.venueName}</span>
            </div>

            <div>
              <span className="text-[11px] uppercase tracking-widest text-slate-400 block mb-1">
                Away Club
              </span>
              <h2 className="editorial-headline font-black text-2xl md:text-3xl text-white">
                {fixture.awayClub.name}
              </h2>
            </div>
          </div>

          {/* Matchday Ticket Action Bar */}
          {fixture.status === 'SCHEDULED' && fixture.ticketsAvailable && (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 bg-white/5 rounded-2xl px-6 py-3.5 border border-white/10">
              <span className="text-xs text-slate-200">
                Official QR Tickets available for this fixture via M-Pesa STK Push.
              </span>
              <Link
                href={`/tickets?fixture=${fixture.slug}`}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-club-primary hover:bg-red-600 text-white athletic-label text-xs tracking-wider transition shadow-md"
              >
                <Ticket className="w-4 h-4" />
                <span>PURCHASE MATCH TICKETS</span>
              </Link>
            </div>
          )}

          {/* Authentic Matchday Action Spotlight Card */}
          <div className="mt-8 rounded-3xl overflow-hidden bg-black/40 border border-white/15 relative">
            <div className="grid grid-cols-1 md:grid-cols-12 items-center">
              <div className="md:col-span-5 relative h-60 md:h-full min-h-[220px]">
                <img
                  src="/images/3k-fc-match-action.jpg"
                  alt="3K FC Matchday Competitive Action"
                  className="w-full h-full object-cover barca-img-zoom"
                />
                <div className="absolute top-3 left-3 inline-flex items-center gap-1 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-emerald-500/40 text-emerald-400 text-[10px] font-bold">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Verified Match Action</span>
                </div>
              </div>
              <div className="md:col-span-7 p-6 sm:p-8">
                <span className="text-[10px] athletic-label tracking-widest text-club-accent font-extrabold uppercase">
                  MATCHDAY INTENSITY • 2026/27 SEASON
                </span>
                <h3 className="editorial-headline text-2xl text-white mt-1">
                  High-Intensity First Team Competitive Action
                </h3>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  Live ball-by-ball commentary, confirmed starting XI formations, and real-time statistics verified by authorised 3K FC technical bench media officials.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Match Centre Navigation Tabs */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div
          role="tablist"
          aria-label="Match Centre Sections"
          className="flex flex-wrap items-center gap-2 border-b border-slate-300 pb-4 mb-8"
        >
          {[
            { id: 'blog', label: 'Live Touchline Blog', icon: Radio },
            { id: 'timeline', label: 'Match Timeline', icon: Clock },
            { id: 'lineups', label: 'Confirmed Lineups', icon: Users },
            { id: 'stats', label: 'Match Statistics', icon: BarChart3 },
            { id: 'poll', label: 'Man of the Match Poll', icon: Vote },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={active}
                type="button"
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
                  active
                    ? 'bg-club-primary text-white shadow'
                    : 'bg-white text-slate-700 border border-slate-300 hover:border-slate-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: LIVE MATCH BLOG */}
        {activeTab === 'blog' && (
          <div className="space-y-4">
            {fixture.liveBlogUpdates && fixture.liveBlogUpdates.length > 0 ? (
              fixture.liveBlogUpdates.map(
                (upd: {
                  id: string;
                  minute?: number | null;
                  eventType: string;
                  headlineEn?: string | null;
                  bodyEn: string;
                  isPinned: boolean;
                  authorName: string;
                  publishedAt: string;
                }) => (
                  <article
                    key={upd.id}
                    className={`rounded-xl p-5 border ${
                      upd.isPinned
                        ? 'bg-amber-50/70 border-amber-300'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-2">
                      <div className="flex items-center gap-2">
                        {upd.isPinned && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500 text-black font-bold">
                            <Pin className="w-3 h-3" />
                            Pinned Update
                          </span>
                        )}
                        {upd.minute && (
                          <span className="px-2 py-0.5 rounded bg-slate-900 text-white font-mono font-bold">
                            {upd.minute}&apos;
                          </span>
                        )}
                        <span className="font-bold uppercase text-club-primary">
                          {upd.eventType}
                        </span>
                      </div>
                      <span className="text-slate-500">
                        {upd.authorName} •{' '}
                        {new Date(upd.publishedAt).toLocaleTimeString('en-KE', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    {upd.headlineEn && (
                      <h3 className="font-display font-bold text-lg text-slate-900 mb-1">
                        {upd.headlineEn}
                      </h3>
                    )}
                    <p className="text-sm text-slate-700 leading-relaxed">{upd.bodyEn}</p>
                  </article>
                )
              )
            ) : (
              <div className="rounded-xl bg-white border border-slate-200 p-8 text-center text-sm text-slate-600">
                No touchline blog updates published yet for this fixture.
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MATCH TIMELINE */}
        {activeTab === 'timeline' && (
          <div className="rounded-2xl bg-white border border-slate-200 p-6">
            <h2 className="editorial-headline font-bold text-xl text-slate-900 mb-4">
              Verified Match Events Timeline
            </h2>
            {fixture.events && fixture.events.length > 0 ? (
              <div className="space-y-3">
                {fixture.events.map(
                  (ev: {
                    id: string;
                    minute: number;
                    type: string;
                    clubSide: string;
                    playerName?: string;
                    descriptionEn: string;
                  }) => (
                    <div
                      key={ev.id}
                      className="flex items-center gap-4 p-3 rounded-lg bg-slate-50 border border-slate-200 text-sm"
                    >
                      <span className="px-2.5 py-1 rounded bg-slate-900 text-white font-mono font-bold text-xs">
                        {ev.minute}&apos;
                      </span>
                      <span className="px-2 py-0.5 rounded bg-club-primary/10 text-club-primary font-bold text-xs uppercase">
                        {ev.type.replace('_', ' ')}
                      </span>
                      <span className="font-semibold text-slate-900">
                        {ev.playerName ? `${ev.playerName} — ` : ''}
                        {ev.descriptionEn}
                      </span>
                    </div>
                  )
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-600">
                No official timeline events (goals, cards, substitutions) have been recorded yet for this match.
              </p>
            )}
          </div>
        )}

        {/* TAB 3: CONFIRMED LINEUPS (Strict Guard: Never display unconfirmed lineups as official) */}
        {activeTab === 'lineups' && (
          <div className="rounded-2xl bg-white border border-slate-200 p-6">
            <h2 className="editorial-headline font-bold text-xl text-slate-900 mb-4">
              Official Starting Elevens &amp; Substitutes
            </h2>
            {fixture.lineups && fixture.lineups.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {fixture.lineups.map(
                  (lu: {
                    id: string;
                    clubSide: string;
                    formation: string;
                    headCoachName: string;
                    players: Array<{
                      id: string;
                      shirtNumber: number;
                      playerName: string;
                      position: string;
                      isStarter: boolean;
                    }>;
                  }) => (
                    <div key={lu.id} className="border border-slate-200 rounded-xl p-4">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
                        <strong className="text-slate-900">
                          {lu.clubSide === 'HOME' ? fixture.homeClub.name : fixture.awayClub.name}
                        </strong>
                        <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded">
                          Formation: {lu.formation}
                        </span>
                      </div>
                      <ul className="space-y-1.5 text-sm">
                        {lu.players.map((p) => (
                          <li key={p.id} className="flex items-center justify-between">
                            <span>
                              <strong className="font-mono mr-2">#{p.shirtNumber}</strong>
                              {p.playerName}
                            </span>
                            <span className="text-xs text-slate-500">{p.position}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
                )}
              </div>
            ) : (
              <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <ShieldCheck className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="font-bold text-slate-900 text-sm">
                  Official Lineups Not Yet Confirmed
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  In accordance with 3K FC editorial policy, unconfirmed or speculative team sheets are never displayed as official. Confirmed starting elevens are published approximately 60 minutes prior to kick-off.
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: MATCH STATISTICS (Label unavailable statistics clearly) */}
        {activeTab === 'stats' && (
          <div className="rounded-2xl bg-white border border-slate-200 p-6">
            <h2 className="editorial-headline font-bold text-xl text-slate-900 mb-4">
              Verified Match Statistics
            </h2>
            {fixture.statistics && fixture.statistics.length > 0 ? (
              <div className="space-y-4">
                {fixture.statistics.map(
                  (st: {
                    id: string;
                    labelEn: string;
                    homeValue: number;
                    awayValue: number;
                    unit?: string;
                  }) => (
                    <div key={st.id} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-slate-800">
                        <span>
                          {st.homeValue}
                          {st.unit || ''}
                        </span>
                        <span className="uppercase">{st.labelEn}</span>
                        <span>
                          {st.awayValue}
                          {st.unit || ''}
                        </span>
                      </div>
                    </div>
                  )
                )}
              </div>
            ) : (
              <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                <p className="font-bold text-slate-900 text-sm">
                  Match Statistics Unavailable
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  Possession, shots, corners, and foul metrics are displayed only when backed by verified official matchday recording.
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: MAN OF THE MATCH FAN POLL */}
        {activeTab === 'poll' && (
          <div className="rounded-2xl bg-white border border-slate-200 p-6 md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <h2 className="editorial-headline font-bold text-2xl text-slate-900">
                {fixture.poll?.titleEn || 'Supporters Man of the Match Poll'}
              </h2>
              <span className="text-xs font-bold uppercase px-2.5 py-1 rounded bg-emerald-100 text-emerald-800">
                Status: {fixture.poll?.status || 'OPEN'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-6">
              {fixture.poll?.disclaimerEn ||
                'Official 3K FC Supporters Poll — not an official FKF competition award. One vote per authenticated supporter account.'}
            </p>

            {fixture.poll?.options ? (
              <form onSubmit={handlePollVote} className="space-y-4">
                <div className="space-y-3">
                  {fixture.poll.options.map(
                    (opt: { id: string; playerName: string; position?: string; voteCount: number }) => {
                      const pct =
                        totalVotes > 0 ? Math.round((opt.voteCount / totalVotes) * 100) : 0;
                      return (
                        <label
                          key={opt.id}
                          className={`block rounded-xl border p-4 cursor-pointer transition ${
                            selectedPollOption === opt.id
                              ? 'border-club-primary bg-red-50/40'
                              : 'border-slate-200 hover:border-slate-400'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <input
                                type="radio"
                                name="pollOption"
                                value={opt.id}
                                checked={selectedPollOption === opt.id}
                                onChange={() => setSelectedPollOption(opt.id)}
                                className="w-4 h-4 text-club-primary"
                              />
                              <div>
                                <span className="font-bold text-sm text-slate-900">
                                  {opt.playerName}
                                </span>
                                {opt.position && (
                                  <span className="ml-2 text-[11px] uppercase text-slate-500">
                                    {opt.position}
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className="text-xs font-mono font-bold text-slate-700">
                              {opt.voteCount} votes ({pct}%)
                            </span>
                          </div>
                          <div className="mt-2 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-club-primary transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </label>
                      );
                    }
                  )}
                </div>

                {pollFeedback && (
                  <div
                    className={`p-3 rounded-lg text-xs font-bold ${
                      pollFeedback.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-red-50 text-red-800 border border-red-200'
                    }`}
                  >
                    {pollFeedback.text}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-slate-500">
                    Total Verified Supporter Votes: <strong>{totalVotes}</strong>
                  </span>
                  <button
                    type="submit"
                    disabled={pollSubmitting || !selectedPollOption}
                    className="px-5 py-2.5 rounded-lg bg-club-primary hover:bg-red-600 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider transition"
                  >
                    {pollSubmitting ? 'Submitting Vote...' : 'Submit Authenticated Vote'}
                  </button>
                </div>
              </form>
            ) : (
              <p className="text-sm text-slate-600">No active poll configured for this fixture.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
