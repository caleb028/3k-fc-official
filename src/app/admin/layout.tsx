import React from 'react';
import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/lib/auth';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthenticatedUser('ADMIN');

  // Login and setup pages have their own self-contained layout
  // (We check inside subpages or allow login/setup without sidebar)
  return (
    <AdminLayoutInner user={user}>
      {children}
    </AdminLayoutInner>
  );
}

function AdminLayoutInner({
  user,
  children,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user: any;
  children: React.ReactNode;
}) {
  // If unauthenticated, public children (like /admin/login or /admin/setup) render directly
  if (!user || !user.isStaff) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#0A0D12] text-slate-100 flex">
      {/* 22-Module Admin Sidebar */}
      <AdminSidebar />

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader
          user={{
            email: user.email,
            roles: user.roles,
            displayName: user.profile?.displayName,
          }}
        />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
