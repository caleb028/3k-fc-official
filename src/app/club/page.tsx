import React from 'react';
import Link from 'next/link';
import {
  Trophy,
  MapPin,
  Users,
  ShieldCheck,
  Calendar,
  Compass,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { AuthenticMediaPlaceholder } from '@/components/ui/AuthenticMediaPlaceholder';

export const dynamic = 'force-dynamic';

export default async function ClubHistoryPage() {
  const [milestones, leadership, settings] = await Promise.all([
    prisma.historyMilestone.findMany({
      orderBy: { sortOrder: 'asc' },
    }),
    prisma.staffMember.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    }),
    prisma.clubSettings.findUnique({ where: { id: 'default' } }),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 md:py-16 space-y-16">
      {/* FC Barcelona-Style Club Heritage Header Banner */}
      <section className="relative rounded-3xl overflow-hidden bg-[#081326] text-white border border-white/10 shadow-2xl p-8 sm:p-12 md:p-14">
        <div className="max-w-3xl relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-club-primary/20 border border-club-primary/40 text-club-primary text-xs athletic-label tracking-widest">
            <Sparkles className="w-3.5 h-3.5" />
            <span>HERITAGE &amp; COMMUNITY PRIDE</span>
          </div>
          <h1 className="editorial-headline text-4xl sm:text-5xl md:text-6xl text-white mt-3 tracking-tight">
            The Historic Journey of 3K FC Embu
          </h1>
          <p className="text-sm md:text-base text-slate-200 mt-4 leading-relaxed">
            From grassroots community football roots in Embu County to making history as the county&apos;s first-ever club in Kenya&apos;s top-flight division.
          </p>
        </div>
      </section>

      {/* Visual Timeline Section */}
      <section>
        <div className="flex items-center gap-2 text-xs athletic-label text-club-primary mb-2">
          <Trophy className="w-4 h-4" />
          <span>Historical Journey</span>
        </div>
        <h2 className="editorial-headline text-3xl md:text-4xl text-slate-900 mb-10">
          From Village Pitches to the FKF Premier League
        </h2>

        <div className="space-y-10 relative before:absolute before:inset-0 before:left-5 md:before:left-1/2 before:w-0.5 before:bg-slate-200">
          {milestones.map((m, index) => {
            const isEven = index % 2 === 0;
            return (
              <div
                key={m.id}
                className={`relative flex flex-col md:flex-row items-start md:items-center ${
                  isEven ? 'md:flex-row-reverse' : ''
                } gap-6 md:gap-12 pl-12 md:pl-0`}
              >
                {/* Timeline Node Point */}
                <div className="absolute left-3.5 md:left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-club-primary border-4 border-white shadow-md z-10" />

                {/* Timeline Card (FC Barcelona Card Style) */}
                <div className="w-full md:w-1/2">
                  <div className="rounded-3xl bg-white border border-slate-200 p-6 md:p-8 shadow-sm barca-card-hover group overflow-hidden">
                    {/* If milestone has an authentic image, showcase it with zoom! */}
                    {m.imageUrl && (
                      <div className="rounded-2xl overflow-hidden mb-6 -mx-2 -mt-2">
                        <AuthenticMediaPlaceholder
                          category="Milestone Archive"
                          label={m.titleEn}
                          sublabel="Verified Historical Milestone Photography"
                          aspectRatio="video"
                          imageUrl={m.imageUrl}
                          isVerifiedAsset={true}
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                      <span className="athletic-label text-xs tracking-wider text-club-primary">
                        {m.eraOrSeason}
                      </span>
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-extrabold text-[11px]">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Verified
                      </span>
                    </div>

                    <h3 className="editorial-headline text-2xl text-slate-900 leading-snug group-hover:text-club-primary transition">
                      {m.titleEn}
                    </h3>

                    <p className="text-sm text-slate-600 mt-3 leading-relaxed">
                      {m.descriptionEn}
                    </p>

                    <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Source: {m.verificationSource}</span>
                      <span className="font-bold text-slate-500">Milestone #{m.sortOrder}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Stadium Guide Section */}
      <section className="rounded-3xl bg-white text-slate-800 p-8 md:p-12 border border-slate-200 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-4">
            <span className="inline-flex items-center gap-1.5 text-xs athletic-label tracking-wider text-club-primary">
              <MapPin className="w-4 h-4" />
              <span>Official Match Venue &amp; Fortress</span>
            </span>
            <h2 className="editorial-headline text-3xl md:text-5xl text-slate-900">
              {settings?.homeStadiumName || 'Moi Stadium, Embu'}
            </h2>
            <p className="text-xs text-amber-700 font-medium bg-amber-50 border border-amber-200 p-2.5 rounded-xl">
              Notice: {settings?.homeStadiumVerificationNote || 'Subject to confirmation of the club\'s official match venue.'}
            </p>
            <p className="text-sm text-slate-600 leading-relaxed">
              Located in the heart of Embu Town, Moi Stadium has served as the historic fortress where 3K FC captured the FKF Division One Zone A title and mounted its 77-point NSL promotion campaign. Matchday crowds regularly turn out in thousands, creating an electric atmosphere for visiting teams.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 text-xs text-slate-700">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <strong className="block text-slate-900 mb-1 athletic-label">Travel &amp; Directions</strong>
                <span className="text-slate-600">Easily accessible from Embu Town Centre via Nairobi-Meru Highway. Ample parking at stadium perimeter.</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <strong className="block text-slate-900 mb-1 athletic-label">Accessibility Support</strong>
                <span className="text-slate-600">Dedicated accessible spectator gates and steward assistance for supporters with disabilities.</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 rounded-2xl overflow-hidden shadow-sm border border-slate-200">
            <AuthenticMediaPlaceholder
              category="Stadium Facility"
              label="Moi Stadium, Embu County"
              sublabel="Official Match Venue Photographic Slot"
              aspectRatio="square"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
