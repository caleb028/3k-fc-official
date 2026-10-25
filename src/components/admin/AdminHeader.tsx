'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, User, ShieldCheck } from 'lucide-react';

export function AdminHeader({
  user,
}: {
  user: {
    email: string;
    roles: string[];
    displayName?: string | null;
  };
}) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/admin/auth/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  };

  return (
    <header className="h-16 bg-[#111620] border-b border-white/10 px-6 flex items-center justify-between text-white sticky top-0 z-30">
      <div className="flex items-center gap-2 text-xs">
        <span className="font-bold text-slate-400">Back-Office Scope:</span>
        <span className="px-2 py-0.5 rounded bg-club-primary text-white font-mono font-bold text-[11px]">
          {user.roles.join(', ') || 'STAFF'}
        </span>
      </div>

      <div className="flex items-center gap-4 text-xs">
        <div className="flex items-center gap-2 text-right">
          <User className="w-4 h-4 text-club-accent" />
          <div>
            <span className="font-bold block text-slate-200">
              {user.displayName || user.email}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">{user.email}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-red-600 text-xs font-bold text-white transition border border-white/10"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </header>
  );
}
