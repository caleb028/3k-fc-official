'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Calendar, Clock, MapPin, Ticket, ArrowRight, ShieldCheck } from 'lucide-react';
import { ClubCrest } from '@/components/ui/ClubCrest';

export interface MatchBarFixtureData {
  id: string;
  slug: string;
  competitionName: string;
  roundName?: string | null;
  kickoffAt: string;
  kickoffConfirmed: boolean;
  venueName: string;
  venueConfirmed: boolean;
  status: string; // SCHEDULED, POSTPONED, DELAYED, LIVE, HALF_TIME, FULL_TIME, CANCELLED
  liveMinute?: number | null;
  homeClubName: string;
  homeClubShort: string;
  homeClubIsOur: boolean;
  awayClubName: string;
  awayClubShort: string;
  awayClubIsOur: boolean;
  homeScore?: number | null;
  awayScore?: number | null;
  ticketsAvailable: boolean;
}

export function LiveMatchBar({ fixture }: { fixture: MatchBarFixtureData | null }) {
  const [countdownText, setCountdownText] = useState<string | null>(null);

  useEffect(() => {
    if (!fixture || fixture.status !== 'SCHEDULED' || !fixture.kickoffConfirmed) {
      setCountdownText(null);
      return;
    }

    const updateTimer = () => {
      const diffMs = new Date(fixture.kickoffAt).getTime() - Date.now();
      if (diffMs <= 0) {
        setCountdownText('Kick-off Window Reached');
        return;
      }
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
      const mins = Math.floor((diffMs / (1000 * 60)) % 60);
      setCountdownText(`${days}D : ${hours}H : ${mins}M`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 30_000);
    return () => clearInterval(interval);
  }, [fixture]);

  if (!fixture || fixture.status === 'FULL_TIME') {
    return (
      <div className="bg-slate-50 border-b border-slate-200 text-slate-700 py-3 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs">
          <span className="athletic-label tracking-wider text-slate-700">
            2026/27 FKF Premier League • Single Matchweek Fixture Schedule
          </span>
          <Link href="/fixtures" className="text-club-primary font-black hover:underline athletic-label tracking-wider">
            View Matchweek Fixture →
          </Link>
        </div>
      </div>
    );
  }

  const isLive = fixture.status === 'LIVE' || fixture.status === 'HALF_TIME';
  const formattedDate = new Date(fixture.kickoffAt).toLocaleDateString('en-KE', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Africa/Nairobi',
  });
  const formattedTime = new Date(fixture.kickoffAt).toLocaleTimeString('en-KE', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Africa/Nairobi',
  });

  return (
    <section
      aria-label="Live Match and Next Fixture Bar"
      className="bg-white border-b border-slate-200 text-slate-900 py-2.5 px-3 md:px-4 shadow-xs"
    >
      <div className="max-w-7xl mx-auto">
        {/* MOBILE LAYOUT (Dedicated Man City Mobile Matchday Card) */}
        <div className="md:hidden space-y-2.5">
          {/* Top Row: Competition, Venue & Status */}
          <div className="flex items-center justify-between text-[11px] gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="px-2 py-0.5 rounded-full text-[9px] athletic-label font-extrabold bg-club-primary text-white shrink-0 shadow-xs">
                {fixture.status === 'LIVE' && fixture.liveMinute
                  ? `LIVE • ${fixture.liveMinute}'`
                  : 'NEXT MATCH'}
              </span>
              <span className="athletic-label font-extrabold text-club-secondary truncate">
                {fixture.competitionName}
              </span>
            </div>

            <div className="flex items-center gap-1 text-slate-500 text-[10px] truncate shrink-0">
              <MapPin className="w-3 h-3 text-club-primary shrink-0" />
              <span className="truncate max-w-[140px]">
                {(fixture.venueName || 'Moi Stadium, Embu').split(',')[0]}
              </span>
            </div>
          </div>

          {/* Center Matchup Card */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 flex items-center justify-between">
            {/* Home Team */}
            <div className="flex flex-col items-center gap-1 text-center flex-1 min-w-0">
              {fixture.homeClubIsOur ? (
                <ClubCrest size="sm" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-white border border-slate-300 flex items-center justify-center text-[10px] font-black text-slate-700 shadow-xs">
                  {(fixture.homeClubShort || '3K').slice(0, 3).toUpperCase()}
                </div>
              )}
              <span className={`text-xs font-bold truncate max-w-[95px] ${fixture.homeClubIsOur ? 'text-club-primary' : 'text-slate-800'}`}>
                {fixture.homeClubName || '3K FC'}
              </span>
            </div>

            {/* Score / VS Center Module */}
            <div className="flex flex-col items-center justify-center px-2 shrink-0">
              {isLive ? (
                <div className="px-3 py-1 rounded-xl bg-slate-950 font-condensed font-black text-lg text-white shadow-xs tracking-wider">
                  {fixture.homeScore ?? 0} : {fixture.awayScore ?? 0}
                </div>
              ) : (
                <div className="flex flex-col items-center text-center">
                  <span className="px-2.5 py-1 rounded-full bg-white border border-slate-300 text-[10px] athletic-label font-black text-slate-900 shadow-xs">
                    {fixture.kickoffConfirmed ? formattedTime : '15:00 EAT'}
                  </span>
                  {countdownText ? (
                    <span className="text-[9px] font-mono font-bold text-emerald-600 mt-0.5">
                      {countdownText}
                    </span>
                  ) : (
                    <span className="text-[9px] text-slate-400 font-medium mt-0.5">
                      {(formattedDate || '').split(',')[0] || 'Matchday'}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Away Team */}
            <div className="flex flex-col items-center gap-1 text-center flex-1 min-w-0">
              {fixture.awayClubIsOur ? (
                <ClubCrest size="sm" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-white border border-slate-300 flex items-center justify-center text-[10px] font-black text-slate-700 shadow-xs">
                  {(fixture.awayClubShort || 'OPP').slice(0, 3).toUpperCase()}
                </div>
              )}
              <span className={`text-xs font-bold truncate max-w-[95px] ${fixture.awayClubIsOur ? 'text-club-primary' : 'text-slate-800'}`}>
                {fixture.awayClubName || 'Opponent'}
              </span>
            </div>
          </div>

          {/* Bottom Actions Row */}
          <div className="grid grid-cols-2 gap-2">
            <Link
              href={`/matches/${fixture.slug}`}
              className="py-2 px-3 rounded-xl bg-white border border-slate-300 text-slate-800 athletic-label text-[11px] font-bold text-center hover:bg-slate-50 transition flex items-center justify-center gap-1"
            >
              <span>Match Centre</span>
              <ArrowRight className="w-3 h-3 text-slate-500" />
            </Link>

            {fixture.ticketsAvailable ? (
              <Link
                href={`/tickets?fixture=${fixture.slug}`}
                className="py-2 px-3 rounded-xl bg-club-primary hover:bg-red-700 text-white athletic-label text-[11px] font-extrabold text-center transition flex items-center justify-center gap-1 shadow-xs"
              >
                <Ticket className="w-3 h-3" />
                <span>Buy Tickets</span>
              </Link>
            ) : (
              <Link
                href="/fixtures"
                className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white athletic-label text-[11px] font-bold text-center transition"
              >
                All Fixtures
              </Link>
            )}
          </div>
        </div>

        {/* DESKTOP LAYOUT (Horizontal Bar) */}
        <div className="hidden md:flex items-center justify-between gap-4">
          {/* Left: Competition & Venue Info */}
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="px-3 py-1 rounded-full text-[10px] athletic-label tracking-wider font-extrabold bg-club-primary text-white shadow-xs">
              {fixture.status === 'LIVE' && fixture.liveMinute
                ? `LIVE • ${fixture.liveMinute}'`
                : fixture.status.replace('_', ' ')}
            </span>
            <span className="athletic-label text-xs tracking-wider font-extrabold text-club-secondary">
              {fixture.competitionName}
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
              <MapPin className="w-3 h-3 text-club-primary" />
              <span>{fixture.venueName || 'Moi Stadium, Embu'}</span>
            </span>
          </div>

          {/* Center: Crest vs Crest Matchup */}
          <div className="flex items-center gap-6 md:gap-8">
            {/* Home Team */}
            <div className="flex items-center gap-3">
              {fixture.homeClubIsOur ? (
                <ClubCrest size="sm" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-[10px] font-black text-slate-700">
                  {(fixture.homeClubShort || '3K').slice(0, 3).toUpperCase()}
                </div>
              )}
              <span className={`editorial-headline text-base md:text-lg ${fixture.homeClubIsOur ? 'text-club-primary font-black' : 'text-slate-700'}`}>
                {fixture.homeClubName || '3K FC'}
              </span>
            </div>

            {/* Score or VS Time Badge */}
            {isLive ? (
              <div className="px-4 py-1.5 rounded-xl bg-slate-900 font-condensed font-black text-xl tracking-widest text-white shadow-xs">
                {fixture.homeScore ?? 0} : {fixture.awayScore ?? 0}
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-[11px] athletic-label tracking-widest text-club-secondary font-black">
                  {fixture.kickoffConfirmed ? formattedTime : 'TBD'}
                </span>
                {countdownText && (
                  <span className="text-[10px] font-mono font-bold text-emerald-600 mt-1">
                    {countdownText}
                  </span>
                )}
              </div>
            )}

            {/* Away Team */}
            <div className="flex items-center gap-3">
              <span className={`editorial-headline text-base md:text-lg ${fixture.awayClubIsOur ? 'text-club-primary font-black' : 'text-slate-700'}`}>
                {fixture.awayClubName || 'Opponent'}
              </span>
              {fixture.awayClubIsOur ? (
                <ClubCrest size="sm" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-[10px] font-black text-slate-700">
                  {(fixture.awayClubShort || 'OPP').slice(0, 3).toUpperCase()}
                </div>
              )}
            </div>
          </div>

          {/* Right: Actions (Match Centre & Tickets) */}
          <div className="flex items-center gap-3">
            <Link
              href={`/matches/${fixture.slug}`}
              className="athletic-label text-xs tracking-wider text-slate-600 hover:text-club-secondary transition inline-flex items-center gap-1 font-bold"
            >
              <span>MATCH CENTRE</span>
              <ArrowRight className="w-3.5 h-3.5 text-club-secondary" />
            </Link>

            {fixture.ticketsAvailable && (
              <Link
                href={`/tickets?fixture=${fixture.slug}`}
                className="px-4 py-1.5 rounded-full athletic-label text-xs tracking-wider bg-club-primary hover:bg-red-700 text-white font-extrabold shadow-xs transition transform hover:-translate-y-0.5"
              >
                BUY TICKETS
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
