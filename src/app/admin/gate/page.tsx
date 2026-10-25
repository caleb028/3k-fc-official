import React from 'react';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireAdminPermission } from '@/lib/auth';
import { GateScanningClient } from '@/components/admin/GateScanningClient';

export const dynamic = 'force-dynamic';

export default async function AdminGatePage() {
  try {
    await requireAdminPermission('gate', 'redeem');
  } catch {
    redirect('/admin/dashboard');
  }

  const fixtures = await prisma.fixture.findMany({
    where: {
      status: { in: ['SCHEDULED', 'LIVE', 'HALF_TIME'] },
    },
    orderBy: { kickoffAt: 'asc' },
    include: { homeClub: true, awayClub: true },
  });

  const formatted = fixtures.map((f) => ({
    id: f.id,
    slug: f.slug,
    title: `${f.homeClub.name} vs ${f.awayClub.name}`,
    venueName: f.venueName,
  }));

  return <GateScanningClient fixtures={formatted} />;
}
