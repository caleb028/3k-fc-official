'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Trophy, CheckCircle2, AlertCircle, Video, ExternalLink, FileText } from 'lucide-react';

interface ResultFixture {
  id: string;
  slug: string;
  homeClub: { name: string; shortName: string };
  awayClub: { name: string; shortName: string };
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  halfTimeHomeScore: number | null;
  halfTimeAwayScore: number | null;
  kickoffAt: string;
  attendance: number | null;
  refereeName: string | null;
  highlightsVideoUrl: string | null;
  resultUpdatedAt: string | null;
}

export function ResultsAdminClient({ fixtures }: { fixtures: ResultFixture[] }) {
  const [selectedFixture, setSelectedFixture] = useState<ResultFixture | null>(fixtures[0] || null);
  const [homeScore, setHomeScore] = useState<number>(selectedFixture?.homeScore ?? 0);
  const [awayScore, setAwayScore] = useState<number>(selectedFixture?.awayScore ?? 0);
  const [htHomeScore, setHtHomeScore] = useState<string>(selectedFixture?.halfTimeHomeScore?.toString() ?? '');
  const [htAwayScore, setHtAwayScore] = useState<string>(selectedFixture?.halfTimeAwayScore?.toString() ?? '');
  const [attendance, setAttendance] = useState<string>(selectedFixture?.attendance?.toString() ?? '');
  const [referee, setReferee] = useState<string>(selectedFixture?.refereeName ?? '');
  const [highlightsUrl, setHighlightsUrl] = useState<string>(selectedFixture?.highlightsVideoUrl ?? '');
  const [reportHeadline, setReportHeadline] = useState<string>('');
  const [reportSummary, setReportSummary] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; success: boolean } | null>(null);

  const handleSelect = (f: ResultFixture) => {
    setSelectedFixture(f);
    setHomeScore(f.homeScore ?? 0);
    setAwayScore(f.awayScore ?? 0);
    setHtHomeScore(f.halfTimeHomeScore?.toString() ?? '');
    setHtAwayScore(f.halfTimeAwayScore?.toString() ?? '');
    setAttendance(f.attendance?.toString() ?? '');
    setReferee(f.refereeName ?? '');
    setHighlightsUrl(f.highlightsVideoUrl ?? '');
    setReportHeadline(`${f.homeClub.name} vs ${f.awayClub.name}: Match Report`);
    setReportSummary('');
    setMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFixture) return;

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fixtureId: selectedFixture.id,
          homeScore: Number(homeScore),
          awayScore: Number(awayScore),
          halfTimeHomeScore: htHomeScore ? parseInt(htHomeScore, 10) : null,
          halfTimeAwayScore: htAwayScore ? parseInt(htAwayScore, 10) : null,
          attendance: attendance ? parseInt(attendance, 10) : null,
          refereeName: referee || null,
          highlightsVideoUrl: highlightsUrl || null,
          reportHeadline: reportHeadline || null,
          reportSummary: reportSummary || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update result.');

      setMessage({
        text: `Match result published! ${selectedFixture.homeClub.name} ${homeScore} - ${awayScore} ${selectedFixture.awayClub.name} is now live on the Results page, Match Centre, and League Standings!`,
        success: true,
      });

      // Update local state
      setSelectedFixture({
        ...selectedFixture,
        status: 'FULL_TIME',
        homeScore: Number(homeScore),
        awayScore: Number(awayScore),
      });
    } catch (err: any) {
      setMessage({ text: err.message, success: false });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between gap-3 text-xs font-semibold ${
            message.success
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {message.success ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
            <span>{message.text}</span>
          </div>

          {selectedFixture && message.success && (
            <Link
              href={`/matches/${selectedFixture.slug}`}
              target="_blank"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold uppercase tracking-wider text-[11px] shrink-0"
            >
              <span>View Match Centre</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Match Selector List */}
        <div className="bg-[#121722] rounded-2xl border border-white/10 p-4 space-y-2 max-h-[680px] overflow-y-auto">
          <span className="text-xs uppercase font-mono text-slate-400 block px-2 mb-2">
            Select Fixture to Enter Result
          </span>
          {fixtures.map((f) => {
            const isSelected = selectedFixture?.id === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => handleSelect(f)}
                className={`w-full text-left p-3 rounded-xl border text-xs transition ${
                  isSelected
                    ? 'bg-club-primary/20 border-club-primary text-white shadow'
                    : 'bg-black/30 border-white/5 text-slate-300 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1">
                  <span>{new Date(f.kickoffAt).toLocaleDateString()}</span>
                  <span
                    className={`font-bold px-1.5 py-0.5 rounded ${
                      f.status === 'FULL_TIME'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : f.status === 'LIVE'
                        ? 'bg-red-500/20 text-red-400 animate-pulse'
                        : 'bg-white/10 text-amber-300'
                    }`}
                  >
                    {f.status}
                  </span>
                </div>
                <div className="font-bold text-white text-sm flex justify-between items-center">
                  <span className="truncate max-w-[100px]">{f.homeClub.shortName}</span>
                  <span className="font-mono text-club-accent px-2 font-black text-base">
                    {f.homeScore !== null ? f.homeScore : '-'} : {f.awayScore !== null ? f.awayScore : '-'}
                  </span>
                  <span className="truncate max-w-[100px] text-right">{f.awayClub.shortName}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Lock Result Editor */}
        {selectedFixture ? (
          <div className="lg:col-span-2 bg-[#121722] p-6 sm:p-8 rounded-2xl border border-white/10 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/10 gap-2">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-club-accent" />
                <h2 className="text-lg font-bold text-white">
                  Post Result: {selectedFixture.homeClub.name} vs {selectedFixture.awayClub.name}
                </h2>
              </div>
              <span className="text-xs font-mono text-slate-400">
                Kickoff: {new Date(selectedFixture.kickoffAt).toLocaleDateString()}
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 text-xs">
              {/* Full-Time Score Box */}
              <div className="p-5 bg-black/40 rounded-2xl border border-white/10 space-y-4">
                <span className="font-bold text-white block uppercase tracking-wider text-xs">
                  Full-Time Score
                </span>
                <div className="grid grid-cols-2 gap-6 items-center">
                  <div className="text-center">
                    <label className="text-slate-300 block mb-2 font-bold text-sm">
                      {selectedFixture.homeClub.name} (Home)
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={homeScore}
                      onChange={(e) => setHomeScore(Number(e.target.value))}
                      className="w-full bg-black/70 border border-white/20 rounded-2xl p-4 text-center text-4xl font-mono font-black text-white focus:border-club-accent"
                    />
                  </div>
                  <div className="text-center">
                    <label className="text-slate-300 block mb-2 font-bold text-sm">
                      {selectedFixture.awayClub.name} (Away)
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={awayScore}
                      onChange={(e) => setAwayScore(Number(e.target.value))}
                      className="w-full bg-black/70 border border-white/20 rounded-2xl p-4 text-center text-4xl font-mono font-black text-white focus:border-club-accent"
                    />
                  </div>
                </div>
              </div>

              {/* Match Details: Half-Time & Attendance */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Half-Time Score (HT Home - HT Away)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      min="0"
                      placeholder="HT Home"
                      value={htHomeScore}
                      onChange={(e) => setHtHomeScore(e.target.value)}
                      className="bg-black/50 border border-white/15 rounded-xl p-2.5 text-white font-mono text-center text-sm"
                    />
                    <input
                      type="number"
                      min="0"
                      placeholder="HT Away"
                      value={htAwayScore}
                      onChange={(e) => setHtAwayScore(e.target.value)}
                      className="bg-black/50 border border-white/15 rounded-xl p-2.5 text-white font-mono text-center text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Match Attendance</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 5200"
                    value={attendance}
                    onChange={(e) => setAttendance(e.target.value)}
                    className="w-full bg-black/50 border border-white/15 rounded-xl p-2.5 text-white font-mono text-sm"
                  />
                </div>
              </div>

              {/* Referee & Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Match Referee</label>
                  <input
                    type="text"
                    placeholder="e.g. Peter Waweru (FIFA)"
                    value={referee}
                    onChange={(e) => setReferee(e.target.value)}
                    className="w-full bg-black/50 border border-white/15 rounded-xl p-2.5 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Match Highlights URL (YouTube)</label>
                  <div className="relative">
                    <input
                      type="url"
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={highlightsUrl}
                      onChange={(e) => setHighlightsUrl(e.target.value)}
                      className="w-full bg-black/50 border border-white/15 rounded-xl p-2.5 text-white pl-8 text-sm font-mono"
                    />
                    <Video className="w-4 h-4 text-slate-500 absolute left-2.5 top-3" />
                  </div>
                </div>
              </div>

              {/* Quick Match Report */}
              <div className="p-4 bg-black/30 rounded-xl border border-white/10 space-y-3">
                <span className="font-bold text-white flex items-center gap-1.5 text-xs">
                  <FileText className="w-4 h-4 text-club-accent" />
                  <span>Match Report &amp; Highlights Summary (Optional)</span>
                </span>
                <input
                  type="text"
                  placeholder="Report Headline: e.g. 3K FC Secure Thrilling Top-Flight Victory in Embu"
                  value={reportHeadline}
                  onChange={(e) => setReportHeadline(e.target.value)}
                  className="w-full bg-black/50 border border-white/15 rounded-xl p-2.5 text-white font-bold"
                />
                <textarea
                  rows={2}
                  placeholder="Summary: e.g. Dante Wabwire and Stephen Barasa found the net as 3K FC claimed all three points before an electric home crowd at Moi Stadium..."
                  value={reportSummary}
                  onChange={(e) => setReportSummary(e.target.value)}
                  className="w-full bg-black/50 border border-white/15 rounded-xl p-2.5 text-white"
                />
              </div>

              {/* Submit */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-club-primary hover:bg-red-600 text-white font-bold uppercase tracking-wider py-3.5 rounded-xl transition text-xs shadow-lg disabled:opacity-50"
                >
                  {loading ? 'Publishing Result & Recalculating Standings...' : 'Publish Full-Time Result (FULL_TIME)'}
                </button>
                <p className="text-[11px] text-slate-400 text-center mt-2">
                  Publishing automatically updates the Results page, Match Centre, and FKF League Standings table.
                </p>
              </div>
            </form>
          </div>
        ) : (
          <div className="lg:col-span-2 bg-[#121722] p-8 rounded-2xl border border-white/10 text-center text-slate-400">
            Select a fixture from the left to enter official results.
          </div>
        )}
      </div>
    </div>
  );
}
