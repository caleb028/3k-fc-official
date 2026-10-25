'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Radio, AlertCircle, Send, CheckCircle2, Trophy, Clock, ExternalLink } from 'lucide-react';

interface FixtureOption {
  id: string;
  slug: string;
  homeClub: { name: string; shortName: string };
  awayClub: { name: string; shortName: string };
  status: string;
  liveMinute: number | null;
  homeScore: number | null;
  awayScore: number | null;
  kickoffAt: string;
  venueName: string;
}

export function MatchCentreAdminClient({ fixtures }: { fixtures: FixtureOption[] }) {
  const [selectedId, setSelectedId] = useState<string>(fixtures[0]?.id || '');
  const activeFixture = fixtures.find((f) => f.id === selectedId) || fixtures[0];

  // Score & status state
  const [status, setStatus] = useState<string>(activeFixture?.status || 'SCHEDULED');
  const [liveMinute, setLiveMinute] = useState<string>(activeFixture?.liveMinute?.toString() || '');
  const [homeScore, setHomeScore] = useState<string>(activeFixture?.homeScore?.toString() || '0');
  const [awayScore, setAwayScore] = useState<string>(activeFixture?.awayScore?.toString() || '0');
  const [statusMessage, setStatusMessage] = useState<{ text: string; success: boolean } | null>(null);
  const [loadingScore, setLoadingScore] = useState(false);

  // Commentary state
  const [blogMinute, setBlogMinute] = useState<string>(liveMinute || '');
  const [blogEventType, setBlogEventType] = useState<string>('COMMENTARY');
  const [blogHeadline, setBlogHeadline] = useState<string>('');
  const [blogBodyEn, setBlogBodyEn] = useState<string>('');
  const [blogBodySw, setBlogBodySw] = useState<string>('');
  const [blogPinned, setBlogPinned] = useState(false);
  const [loadingBlog, setLoadingBlog] = useState(false);

  // Event state
  const [eventMinute, setEventMinute] = useState<string>(liveMinute || '');
  const [eventType, setEventType] = useState<string>('GOAL');
  const [eventSide, setEventSide] = useState<'HOME' | 'AWAY'>('HOME');
  const [eventPlayer, setEventPlayer] = useState<string>('');
  const [eventDescEn, setEventDescEn] = useState<string>('');
  const [loadingEvent, setLoadingEvent] = useState(false);

  const handleUpdateScoreStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFixture) return;
    setLoadingScore(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/admin/match-centre', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_SCORE_STATUS',
          payload: {
            fixtureId: activeFixture.id,
            status,
            liveMinute: liveMinute ? parseInt(liveMinute, 10) : null,
            homeScore: homeScore ? parseInt(homeScore, 10) : 0,
            awayScore: awayScore ? parseInt(awayScore, 10) : 0,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update score.');
      setStatusMessage({ text: 'Match status and score updated successfully!', success: true });
    } catch (err: any) {
      setStatusMessage({ text: err.message, success: false });
    } finally {
      setLoadingScore(false);
    }
  };

  const handlePostBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFixture || !blogBodyEn) return;
    setLoadingBlog(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/admin/match-centre', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ADD_BLOG_UPDATE',
          payload: {
            fixtureId: activeFixture.id,
            minute: blogMinute ? parseInt(blogMinute, 10) : null,
            eventType: blogEventType,
            headlineEn: blogHeadline || null,
            bodyEn: blogBodyEn,
            bodySw: blogBodySw || null,
            isPinned: blogPinned,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to publish commentary.');
      setStatusMessage({ text: 'Commentary entry published to live Match Centre.', success: true });
      setBlogHeadline('');
      setBlogBodyEn('');
      setBlogBodySw('');
    } catch (err: any) {
      setStatusMessage({ text: err.message, success: false });
    } finally {
      setLoadingBlog(false);
    }
  };

  const handleLogEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFixture || !eventDescEn) return;
    setLoadingEvent(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/admin/match-centre', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ADD_MATCH_EVENT',
          payload: {
            fixtureId: activeFixture.id,
            minute: parseInt(eventMinute || '0', 10),
            type: eventType,
            clubSide: eventSide,
            playerName: eventPlayer || null,
            descriptionEn: eventDescEn,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to log match event.');
      setStatusMessage({ text: `Event (${eventType}) recorded on match timeline.`, success: true });
      setEventPlayer('');
      setEventDescEn('');
    } catch (err: any) {
      setStatusMessage({ text: err.message, success: false });
    } finally {
      setLoadingEvent(false);
    }
  };

  if (!fixtures || fixtures.length === 0) {
    return (
      <div className="p-8 text-center bg-[#121722] rounded-2xl border border-white/10 text-slate-400">
        <Radio className="w-8 h-8 mx-auto mb-2 text-slate-500" />
        <p>No fixtures found in system. Please create fixtures in the Fixtures module first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {statusMessage && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 text-sm font-semibold ${
            statusMessage.success
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
          }`}
        >
          {statusMessage.success ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Select Fixture */}
      <div className="bg-[#121722] p-5 rounded-2xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <label className="text-xs uppercase font-mono text-slate-400 block mb-1">Select Active Match</label>
          <select
            value={selectedId}
            onChange={(e) => {
              setSelectedId(e.target.value);
              const found = fixtures.find((f) => f.id === e.target.value);
              if (found) {
                setStatus(found.status);
                setLiveMinute(found.liveMinute?.toString() || '');
                setHomeScore(found.homeScore?.toString() || '0');
                setAwayScore(found.awayScore?.toString() || '0');
              }
            }}
            className="bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white font-semibold text-sm focus:outline-none focus:border-club-primary"
          >
            {fixtures.map((f) => (
              <option key={f.id} value={f.id} className="bg-slate-900 text-white">
                {f.homeClub.shortName} vs {f.awayClub.shortName} ({f.status} — {new Date(f.kickoffAt).toLocaleDateString()})
              </option>
            ))}
          </select>
        </div>

        {activeFixture && (
          <Link
            href={`/matches/${activeFixture.slug}`}
            target="_blank"
            className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition"
          >
            <span>Open Public Match Centre</span>
            <ExternalLink className="w-4 h-4" />
          </Link>
        )}
      </div>

      {activeFixture && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Match Score & Status Console */}
          <div className="bg-[#121722] p-6 rounded-2xl border border-white/10 space-y-6">
            <div className="flex items-center gap-2 pb-3 border-b border-white/10">
              <Clock className="w-5 h-5 text-amber-400" />
              <h2 className="text-base font-bold text-white">Live Scoreboard &amp; Status</h2>
            </div>

            <form onSubmit={handleUpdateScoreStatus} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-400 block mb-1">Match Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white font-medium"
                  >
                    <option value="SCHEDULED">SCHEDULED</option>
                    <option value="LIVE">LIVE</option>
                    <option value="HALF_TIME">HALF_TIME</option>
                    <option value="FULL_TIME">FULL_TIME</option>
                    <option value="POSTPONED">POSTPONED</option>
                    <option value="DELAYED">DELAYED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Live Minute (&apos;)</label>
                  <input
                    type="number"
                    min="0"
                    max="120"
                    placeholder="e.g. 64"
                    value={liveMinute}
                    onChange={(e) => setLiveMinute(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white font-mono"
                  />
                </div>
              </div>

              <div className="p-4 bg-black/30 rounded-xl border border-white/5 space-y-3">
                <span className="font-bold text-white block">Official Score</span>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-400 block mb-1 truncate">{activeFixture.homeClub.name}</label>
                    <input
                      type="number"
                      min="0"
                      value={homeScore}
                      onChange={(e) => setHomeScore(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-center text-xl font-mono font-bold text-white"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1 truncate">{activeFixture.awayClub.name}</label>
                    <input
                      type="number"
                      min="0"
                      value={awayScore}
                      onChange={(e) => setAwayScore(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-center text-xl font-mono font-bold text-white"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loadingScore}
                className="w-full bg-club-primary hover:bg-club-dark text-white font-bold py-3 rounded-xl transition text-xs shadow-md disabled:opacity-50"
              >
                {loadingScore ? 'Broadcasting...' : 'Broadcast Score & Status'}
              </button>
            </form>

            {/* Event Logger Sub-panel */}
            <div className="pt-4 border-t border-white/10 space-y-4">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Log Official Match Event</h3>
              </div>
              <form onSubmit={handleLogEvent} className="space-y-3 text-xs">
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-slate-400 block mb-1">Min (&apos;)</label>
                    <input
                      type="number"
                      required
                      value={eventMinute}
                      onChange={(e) => setEventMinute(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Type</label>
                    <select
                      value={eventType}
                      onChange={(e) => setEventType(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white"
                    >
                      <option value="GOAL">GOAL</option>
                      <option value="PENALTY_GOAL">PENALTY_GOAL</option>
                      <option value="OWN_GOAL">OWN_GOAL</option>
                      <option value="YELLOW_CARD">YELLOW_CARD</option>
                      <option value="RED_CARD">RED_CARD</option>
                      <option value="SUBSTITUTION">SUBSTITUTION</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Club Side</label>
                    <select
                      value={eventSide}
                      onChange={(e) => setEventSide(e.target.value as any)}
                      className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white"
                    >
                      <option value="HOME">HOME ({activeFixture.homeClub.shortName})</option>
                      <option value="AWAY">AWAY ({activeFixture.awayClub.shortName})</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Player Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Daniel Wabwire"
                    value={eventPlayer}
                    onChange={(e) => setEventPlayer(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Description (English)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Clinical volley into the bottom left corner from 18 yards."
                    value={eventDescEn}
                    onChange={(e) => setEventDescEn(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loadingEvent}
                  className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-2.5 rounded-lg transition"
                >
                  {loadingEvent ? 'Saving Event...' : 'Record Event to Timeline'}
                </button>
              </form>
            </div>
          </div>

          {/* Touchline Live Commentary Box */}
          <div className="bg-[#121722] p-6 rounded-2xl border border-white/10 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-white/10">
              <Radio className="w-5 h-5 text-club-accent animate-pulse" />
              <h2 className="text-base font-bold text-white">Touchline Live Commentary</h2>
            </div>

            <form onSubmit={handlePostBlog} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-400 block mb-1">Minute (&apos;)</label>
                  <input
                    type="number"
                    value={blogMinute}
                    onChange={(e) => setBlogMinute(e.target.value)}
                    placeholder="Optional, e.g. 78"
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Update Type</label>
                  <select
                    value={blogEventType}
                    onChange={(e) => setBlogEventType(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white"
                  >
                    <option value="COMMENTARY">COMMENTARY</option>
                    <option value="CHANCE">CHANCE</option>
                    <option value="GOAL">GOAL</option>
                    <option value="CARD">CARD</option>
                    <option value="ANNOUNCEMENT">ANNOUNCEMENT</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Headline (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Magnificent double save by 3K FC keeper!"
                  value={blogHeadline}
                  onChange={(e) => setBlogHeadline(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Commentary Body (English)</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Describe the action on the pitch..."
                  value={blogBodyEn}
                  onChange={(e) => setBlogBodyEn(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white resize-none"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Commentary Body (Kiswahili — Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Eleza matukio uwanjani kwa Kiswahili..."
                  value={blogBodySw}
                  onChange={(e) => setBlogBodySw(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white resize-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="pinBlog"
                  checked={blogPinned}
                  onChange={(e) => setBlogPinned(e.target.checked)}
                  className="rounded bg-black border-white/20 text-club-primary"
                />
                <label htmlFor="pinBlog" className="text-slate-300 select-none">
                  Pin to top of live feed
                </label>
              </div>

              <button
                type="submit"
                disabled={loadingBlog}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{loadingBlog ? 'Publishing...' : 'Publish Live Commentary'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
