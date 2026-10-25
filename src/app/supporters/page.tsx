import React from 'react';
import { prisma } from '@/lib/prisma';
import { SupportersClient } from '@/components/supporters/SupportersClient';
import { Sparkles, ShieldCheck, Heart, Award } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function SupportersPage() {
  const [plans, rewards] = await Promise.all([
    prisma.membershipPlan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    }),
    prisma.loyaltyReward.findMany({
      where: { isActive: true },
      orderBy: { pointsCost: 'asc' },
    }),
  ]);

  const formattedPlans = plans.map((p) => {
    let benefits: string[] = [];
    try {
      benefits = JSON.parse(p.benefitsJsonEn);
    } catch {
      benefits = [];
    }
    return {
      id: p.id,
      slug: p.slug,
      nameEn: p.nameEn,
      billingCycle: p.billingCycle,
      durationDays: p.durationDays,
      priceKesCents: p.priceKesCents,
      merchDiscountPercent: p.merchDiscountPercent,
      welcomeLoyaltyPoints: p.welcomeLoyaltyPoints,
      benefits,
    };
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 md:py-14 space-y-10">
      {/* FC Barcelona Culers-Style Hero Banner with Authentic Fan Photo */}
      <section className="relative rounded-3xl overflow-hidden bg-[#081326] text-white border border-white/10 shadow-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-center">
          {/* Left Text Column */}
          <div className="lg:col-span-7 p-8 sm:p-12 md:p-14 z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-club-accent/20 border border-club-accent/40 text-club-accent text-xs athletic-label tracking-widest">
              <Sparkles className="w-3.5 h-3.5" />
              <span>3K STARS • OFFICIAL SUPPORTERS CLUB</span>
            </div>

            <h1 className="editorial-headline text-4xl sm:text-5xl md:text-6xl text-white mt-3 tracking-tight">
              Més Que Un Club: More Than A Football Team
            </h1>

            <p className="text-sm md:text-base text-slate-200 mt-4 leading-relaxed max-w-xl">
              Be part of 3K FC&apos;s historic debut in the 2026/27 FKF Premier League. Receive an encrypted Digital Membership Card, priority Moi Stadium tickets, M-Pesa automated renewals, and earn auditable loyalty points.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-300">
              <span className="inline-flex items-center gap-1.5 text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
                <span>Verified Digital Card</span>
              </span>
              <span className="inline-flex items-center gap-1.5 text-amber-400">
                <Award className="w-4 h-4" />
                <span>Loyalty Points on Every Match</span>
              </span>
              <span className="inline-flex items-center gap-1.5 text-blue-400">
                <Heart className="w-4 h-4" />
                <span>100% Embu County Community</span>
              </span>
            </div>
          </div>

          {/* Right Photographic Showcase */}
          <div className="lg:col-span-5 relative h-72 lg:h-full min-h-[340px] overflow-hidden">
            <img
              src="/images/3k-fc-fan-celebration.jpg"
              alt="Passionate 3K FC Supporters in Official Red and Gold Kit"
              className="w-full h-full object-cover barca-img-zoom"
            />
            <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-[#081326] via-transparent to-transparent pointer-events-none" />
            <div className="absolute bottom-4 right-4 inline-flex items-center gap-1 bg-black/80 backdrop-blur-md px-3 py-1 rounded-full border border-emerald-500/40 text-emerald-400 text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verified 3K FC Supporters</span>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Membership Plans & Rewards Client */}
      <SupportersClient plans={formattedPlans} rewards={rewards} />
    </div>
  );
}
