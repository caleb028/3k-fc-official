'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Lock, Mail, ArrowRight } from 'lucide-react';
import { ClubCrest } from '@/components/ui/ClubCrest';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Authentication rejected.');
      } else {
        // Direct document navigation guarantees browser sends newly set session cookie cleanly
        window.location.href = '/admin/dashboard';
      }
    } catch {
      setErrorMsg('Network error while signing in to back-office.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0D12] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <ClubCrest size="lg" className="justify-center" />
          <h1 className="editorial-headline font-black text-3xl text-white mt-2">
            3K FC Back-Office Sign In
          </h1>
          <p className="text-xs text-slate-400">
            Protected administration portal for authorised club personnel.
          </p>
        </div>

        <form
          onSubmit={handleLogin}
          className="rounded-2xl bg-[#121722] border border-white/10 p-6 sm:p-8 space-y-4 shadow-2xl"
        >
          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/40 text-xs font-bold text-red-200">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Staff Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@3kfc.co.ke"
                className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-black/50 border border-white/15 text-white text-sm focus:border-club-accent"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-black/50 border border-white/15 text-white text-sm focus:border-club-accent"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-club-primary hover:bg-red-600 text-white text-xs font-bold uppercase tracking-wider shadow transition"
          >
            <span>{submitting ? 'Authenticating Staff...' : 'Sign In to Dashboard'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="pt-4 border-t border-white/10 text-center text-xs text-slate-400">
            First time setting up the platform?{' '}
            <Link href="/admin/setup" className="text-club-accent font-bold hover:underline">
              Initial Super Admin Setup →
            </Link>
          </div>
        </form>

        <div className="text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Role-Based Access Control • Server-Enforced Sessions</span>
        </div>
      </div>
    </div>
  );
}
