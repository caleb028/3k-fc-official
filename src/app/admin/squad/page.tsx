import React from 'react';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireAdminPermission } from '@/lib/auth';
import { SquadAdminClient } from '@/components/admin/SquadAdminClient';

export const dynamic = 'force-dynamic';

export default async function AdminSquadPage() {
  try {
    await requireAdminPermission('squad', 'read');
  } catch {
    redirect('/admin/dashboard');
  }

  const [players, staff] = await Promise.all([
    prisma.player.findMany({
      orderBy: [{ shirtNumber: 'asc' }, { lastName: 'asc' }],
    }),
    prisma.staffMember.findMany({
      orderBy: { sortOrder: 'asc' },
    }),
  ]);

  const formattedPlayers = players.map((p) => ({
    id: p.id,
    slug: p.slug,
    firstName: p.firstName,
    lastName: p.lastName,
    fullName: p.fullName,
    nickname: p.nickname,
    shirtNumber: p.shirtNumber,
    position: p.position,
    specificRole: p.specificRole,
    nationality: p.nationality,
    biographyEn: p.biographyEn,
    biographySw: p.biographySw,
    isCaptain: p.isCaptain,
    isSpotlight: p.isSpotlight,
    isActive: p.isActive,
    photoVerified: p.photoVerified,
  }));

  const formattedStaff = staff.map((s) => ({
    id: s.id,
    slug: s.slug,
    fullName: s.fullName,
    roleTitleEn: s.roleTitleEn,
    roleTitleSw: s.roleTitleSw,
    category: s.category,
    biographyEn: s.biographyEn,
    sortOrder: s.sortOrder,
    isActive: s.isActive,
  }));

  return (
    <div className="space-y-6">
      <div className="border-b border-white/10 pb-4">
        <h1 className="editorial-headline font-black text-2xl text-white">
          Squad &amp; Technical Staff Management
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Manage first-team players, shirt numbers, positions, captaincy designations, coaching staff, and verified statistical profiles.
        </p>
      </div>

      <SquadAdminClient initialPlayers={formattedPlayers} initialStaff={formattedStaff} />
    </div>
  );
}
