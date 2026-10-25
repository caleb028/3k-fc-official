import React from 'react';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireAdminPermission } from '@/lib/auth';
import { UsersAdminClient } from '@/components/admin/UsersAdminClient';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  try {
    await requireAdminPermission('users', 'read');
  } catch {
    redirect('/admin/dashboard');
  }

  const [users, roles] = await Promise.all([
    prisma.user.findMany({
      where: { isStaff: true },
      orderBy: { createdAt: 'desc' },
      include: {
        profile: true,
        userRoles: {
          include: { role: true },
        },
      },
    }),
    prisma.role.findMany({
      where: { slug: { not: 'SUPPORTER' } },
      orderBy: { slug: 'asc' },
    }),
  ]);

  const formattedUsers = users.map((u) => ({
    id: u.id,
    email: u.email,
    phone: u.phone,
    status: u.status,
    isStaff: u.isStaff,
    createdAt: u.createdAt.toISOString(),
    profile: u.profile
      ? {
          firstName: u.profile.firstName,
          lastName: u.profile.lastName,
        }
      : null,
    roles: u.userRoles.map((ur) => ({
      slug: ur.role.slug,
      name: ur.role.name,
    })),
  }));

  const formattedRoles = roles.map((r) => ({
    slug: r.slug,
    name: r.name,
  }));

  return (
    <div className="space-y-6">
      <div className="border-b border-white/10 pb-4">
        <h1 className="editorial-headline font-black text-2xl text-white">
          Staff Users &amp; Role-Based Access Control
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Manage authorized club personnel accounts, provision new staff logins, assign granular permissions, and audit system credentials.
        </p>
      </div>

      <UsersAdminClient users={formattedUsers} availableRoles={formattedRoles} />
    </div>
  );
}
