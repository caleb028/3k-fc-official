import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { Locale } from '@/lib/i18n';
import { AuthenticMediaPlaceholder } from '@/components/ui/AuthenticMediaPlaceholder';

export const dynamic = 'force-dynamic';

export default async function PlayerDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const cookieStore = await cookies();
  const locale: Locale = cookieStore.get('3kfc_locale')?.value === 'sw' ? 'sw' : 'en';

  const player = await prisma.player.findUnique({
    where: { slug },
    include: {
      squadMemberships: {
        include: { season: true, team: true },
        orderBy: { updatedAt: 'desc' },
      },
    },
  });

  if (!player) {
    notFound();
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 md:py-14">
      <Link
        href="/team"
        className="inline-flex items-center gap-1.5 athletic-label text-xs tracking-wider text-club-primary hover:underline mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Squad &amp; Technical Bench</span>
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm barca-card-hover group">
        <div className="md:col-span-5">
          <AuthenticMediaPlaceholder
            category={player.isCaptain ? 'Club Captain' : player.position}
            label={`#${player.shirtNumber ?? '--'} ${player.fullName}`}
            sublabel="Official Approved Player Portrait"
            aspectRatio="portrait"
            imageUrl={player.photoUrl}
            isVerifiedAsset={player.photoVerified}
            className="h-full"
          />
        </div>

        <div className="md:col-span-7 p-6 sm:p-10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full bg-club-primary text-white athletic-label text-xs tracking-wider shadow">
                {player.specificRole || player.position}
              </span>
              {player.shirtNumber && (
                <span className="font-condensed font-black text-5xl text-slate-900">
                  #{player.shirtNumber}
                </span>
              )}
            </div>

            <h1 className="editorial-headline text-3xl sm:text-4xl md:text-5xl text-slate-900 mt-3">
              {player.fullName}
            </h1>

            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-500 block">Nationality</span>
                <strong className="text-slate-900">{player.nationality}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Primary Position</span>
                <strong className="text-slate-900">{player.position}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Squad Role</span>
                <strong className="text-slate-900">
                  {player.isCaptain ? 'First Team Captain' : 'First Team Squad'}
                </strong>
              </div>
            </div>

            <div className="mt-6">
              <h2 className="font-display font-bold text-lg text-slate-900 mb-2">
                Official Player Biography
              </h2>
              <p className="text-sm text-slate-700 leading-relaxed">
                {locale === 'sw' && player.biographySw
                  ? player.biographySw
                  : player.biographyEn}
              </p>
            </div>

            {/* Verified Season Statistics Table */}
            <div className="mt-8">
              <h2 className="font-display font-bold text-lg text-slate-900 mb-3">
                Verified Season Statistics
              </h2>
              {player.squadMemberships.map((sm) => (
                <div
                  key={sm.id}
                  className="rounded-xl border border-slate-200 overflow-hidden mb-3"
                >
                  <div className="bg-slate-900 text-white px-4 py-2 text-xs flex items-center justify-between">
                    <span className="font-bold">
                      {sm.season.name} • {sm.team.name}
                    </span>
                    <span className="text-emerald-400 inline-flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Verified Record
                    </span>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-6 divide-x divide-slate-200 text-center py-3 bg-white">
                    <div>
                      <div className="text-[10px] uppercase text-slate-500">Appearances</div>
                      <div className="font-mono font-bold text-base text-slate-900">
                        {sm.appearances}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-slate-500">Starts</div>
                      <div className="font-mono font-bold text-base text-slate-900">
                        {sm.starts}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-slate-500">Goals</div>
                      <div className="font-mono font-bold text-base text-slate-900">
                        {sm.goals}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-slate-500">Assists</div>
                      <div className="font-mono font-bold text-base text-slate-900">
                        {sm.assists}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-slate-500">Yellow Cards</div>
                      <div className="font-mono font-bold text-base text-amber-600">
                        {sm.yellowCards}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-slate-500">Red Cards</div>
                      <div className="font-mono font-bold text-base text-red-600">
                        {sm.redCards}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-slate-500">
            Source: {player.squadMemberships[0]?.statsSourceNote || 'Official 3K FC Match Records'}
          </div>
        </div>
      </div>
    </div>
  );
}
