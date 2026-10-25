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
      <div className="bg-[#040A14] border-b border-white/10 text-slate-300 py-3 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs">
          <span className="athletic-label tracking-wider text-slate-300">
            2026/27 FKF Premier League • Single Matchweek Fixture Schedule
          </span>
          <Link href="/fixtures" className="text-club-accent font-extrabold hover:underline athletic-label tracking-wider">
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
      aria-label="FC Barcelona Style Live Match and Next Fixture Bar"
      className="bg-gradient-to-r from-[#040A14] via-[#0A1B3A] to-[#040A14] border-b border-white/10 text-white py-3 px-4 shadow-inner"
    >
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Left: Competition & Venue Info */}
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="px-3 py-1 rounded-full text-[10px] athletic-label tracking-wider font-extrabold bg-club-primary text-white shadow-sm">
            {fixture.status === 'LIVE' && fixture.liveMinute
              ? `LIVE • ${fixture.liveMinute}'`
              : fixture.status.replace('_', ' ')}
          </span>
          <span className="athletic-label text-xs tracking-wider font-extrabold text-club-accent">
            {fixture.competitionName}
          </span>
          <span className="text-slate-500 hidden sm:inline">•</span>
          <span className="text-xs text-slate-300 flex items-center gap-1 hidden sm:inline-flex">
            <MapPin className="w-3 h-3 text-club-accent" />
            <span>{fixture.venueName}</span>
          </span>
        </div>

        {/* Center: Crest vs Crest Matchup */}
        <div className="flex items-center gap-6 md:gap-8">
          {/* Home Team */}
          <div className="flex items-center gap-3">
            {fixture.homeClubIsOur ? (
              <ClubCrest size="sm" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/20 flex items-center justify-center text-[10px] font-black text-slate-200">
                {fixture.homeClubShort.slice(0, 3).toUpperCase()}
              </div>
            )}
            <span className={`editorial-headline text-base md:text-lg ${fixture.homeClubIsOur ? 'text-white' : 'text-slate-300'}`}>
              {fixture.homeClubName}
            </span>
          </div>

          {/* Score or VS Time Badge */}
          {isLive ? (
            <div className="px-4 py-1.5 rounded-xl bg-black/80 border border-white/20 font-condensed font-black text-xl tracking-widest text-club-accent shadow-inner">
              {fixture.homeScore ?? 0} : {fixture.awayScore ?? 0}
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <span className="px-3 py-1 rounded-full bg-white/10 text-[11px] athletic-label tracking-widest text-club-accent font-extrabold">
                {fixture.kickoffConfirmed ? formattedTime : 'TBD'}
              </span>
              {countdownText && (
                <span className="text-[10px] font-mono font-bold text-emerald-400 mt-1">
                  {countdownText}
                </span>
              )}
            </div>
          )}

          {/* Away Team */}
          <div className="flex items-center gap-3">
            <span className={`editorial-headline text-base md:text-lg ${fixture.awayClubIsOur ? 'text-white' : 'text-slate-300'}`}>
              {fixture.awayClubName}
            </span>
            {fixture.awayClubIsOur ? (
              <ClubCrest size="sm" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/20 flex items-center justify-center text-[10px] font-black text-slate-200">
                {fixture.awayClubShort.slice(0, 3).toUpperCase()}
              </div>
            )}
          </div>
        </div>

        {/* Right: Actions (Match Centre & Tickets) */}
        <div className="flex items-center gap-3">
          <Link
            href={`/matches/${fixture.slug}`}
            className="athletic-label text-xs tracking-wider text-slate-300 hover:text-white transition inline-flex items-center gap-1"
          >
            <span>MATCH CENTRE</span>
            <ArrowRight className="w-3.5 h-3.5 text-club-accent" />
          </Link>

          {fixture.ticketsAvailable && (
            <Link
              href={`/tickets?fixture=${fixture.slug}`}
              className="px-4 py-1.5 rounded-full athletic-label text-xs tracking-wider bg-club-primary hover:bg-red-700 text-white font-extrabold shadow-md transition transform hover:-translate-y-0.5"
            >
              BUY TICKETS
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
