import React from 'react';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireAdminPermission } from '@/lib/auth';
import { TicketsAdminClient } from '@/components/admin/TicketsAdminClient';

export const dynamic = 'force-dynamic';

export default async function AdminTicketsPage() {
  try {
    await requireAdminPermission('tickets', 'read');
  } catch {
    redirect('/admin/dashboard');
  }

  const [categories, orders] = await Promise.all([
    prisma.ticketCategory.findMany({
      orderBy: { fixture: { kickoffAt: 'desc' } },
      include: {
        inventory: true,
        fixture: {
          include: {
            homeClub: true,
            awayClub: true,
          },
        },
      },
    }),
    prisma.ticketOrder.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        tickets: true,
      },
    }),
  ]);

  const formattedCategories = categories.map((c) => ({
    id: c.id,
    nameEn: c.nameEn,
    nameSw: c.nameSw,
    priceKesCents: c.priceKesCents,
    isActive: c.isActive,
    fixture: {
      homeClub: { shortName: c.fixture.homeClub.shortName },
      awayClub: { shortName: c.fixture.awayClub.shortName },
      kickoffAt: c.fixture.kickoffAt.toISOString(),
    },
    inventory: c.inventory
      ? {
          totalCapacity: c.inventory.totalCapacity,
          reservedCount: c.inventory.reservedCount,
          soldCount: c.inventory.soldCount,
        }
      : null,
  }));

  const formattedOrders = orders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    buyerName: o.buyerName,
    buyerEmail: o.buyerEmail,
    buyerPhone: o.buyerPhone,
    totalKesCents: o.totalKesCents,
    status: o.status,
    createdAt: o.createdAt.toISOString(),
    ticketCount: o.tickets.length,
  }));

  return (
    <div className="space-y-6">
      <div className="border-b border-white/10 pb-4">
        <h1 className="editorial-headline font-black text-2xl text-white">
          Match Ticketing Operations
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Manage match category allocations, dynamic pricing tiers in KES, capacity limits, and review buyer orders.
        </p>
      </div>

      <TicketsAdminClient categories={formattedCategories} orders={formattedOrders} />
    </div>
  );
}
