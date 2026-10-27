import React from 'react';
import { prisma } from '@/lib/prisma';
import { releaseExpiredTicketHolds } from '@/lib/tickets/service';
import { TicketingClient } from '@/components/tickets/TicketingClient';

export const dynamic = 'force-dynamic';

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ fixture?: string }>;
}) {
  const params = await searchParams;
  await releaseExpiredTicketHolds().catch(() => null);

  const fixtures = await prisma.fixture.findMany({
    where: {
      ticketsAvailable: true,
      status: 'SCHEDULED',
    },
    orderBy: { kickoffAt: 'asc' },
    include: {
      competition: true,
      homeClub: true,
      awayClub: true,
      ticketCategories: {
        where: { isActive: true },
        include: { inventory: true },
      },
    },
  });

  const formattedFixtures = fixtures.map((f) => ({
    id: f.id,
    slug: f.slug,
    title: `${f.homeClub.name} vs ${f.awayClub.name}`,
    competitionName: f.competition.name,
    kickoffAt: f.kickoffAt.toISOString(),
    kickoffConfirmed: f.kickoffConfirmed,
    venueName: f.venueName,
    categories: f.ticketCategories.map((c) => ({
      id: c.id,
      nameEn: c.nameEn,
      nameSw: c.nameSw,
      descriptionEn: c.descriptionEn,
      priceKesCents: c.priceKesCents,
      maxPerOrder: c.maxPerOrder,
      isAccessibleSeating: c.isAccessibleSeating,
      availableCapacity: c.inventory
        ? Math.max(0, c.inventory.totalCapacity - c.inventory.soldCount - c.inventory.reservedCount)
        : 0,
    })),
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 md:py-16 space-y-10">
      {/* Matchday Atmosphere Hero Banner */}
      <section className="relative rounded-3xl overflow-hidden bg-white text-slate-800 border border-slate-200 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-center">
          <div className="lg:col-span-7 p-8 sm:p-12 md:p-14 z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-club-primary text-xs athletic-label tracking-widest">
              <span>OFFICIAL MATCHDAY BOX OFFICE</span>
            </div>
            <h1 className="editorial-headline text-4xl sm:text-5xl md:text-6xl text-slate-900 mt-3 tracking-tight">
              Moi Stadium Matchday Experience
            </h1>
            <p className="text-sm md:text-base text-slate-600 mt-3 leading-relaxed max-w-xl">
              Secure official 3K FC matchday tickets with instant M-Pesa STK Push checkout and cryptographically signed QR entry passes. Specific stadium seating allocations subject to FKF venue confirmation.
            </p>
          </div>
          <div className="lg:col-span-5 relative h-64 lg:h-full min-h-[280px] overflow-hidden">
            <img
              src="/images/3k-fc-fan-celebration.jpg"
              alt="Electric Matchday Atmosphere with 3K FC Supporters"
              className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-white via-transparent to-transparent pointer-events-none" />
            <div className="absolute bottom-4 right-4 inline-flex items-center gap-1 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full border border-slate-200 text-club-primary text-xs font-bold shadow-sm">
              <span>Electric Fortress Atmosphere</span>
            </div>
          </div>
        </div>
      </section>

      <TicketingClient
        fixtures={formattedFixtures}
        initialFixtureSlug={params.fixture}
      />
    </div>
  );
}
