'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldAlert, KeyRound, ArrowRight } from 'lucide-react';
import { ClubCrest } from '@/components/ui/ClubCrest';

export default function AdminSetupPage() {
  const router = useRouter();
  const [bootstrapToken, setBootstrapToken] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/auth/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bootstrapToken,
          email,
          password,
          firstName,
          lastName,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Setup failed.' });
      } else {
        setMessage({ type: 'success', text: data.message });
        setTimeout(() => {
          router.push('/admin/login');
        }, 1500);
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error during bootstrap.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0D12] flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-2">
          <ClubCrest size="lg" className="justify-center" />
          <h1 className="editorial-headline font-black text-3xl text-white mt-2">
            First-Run Super Admin Setup
          </h1>
          <p className="text-xs text-slate-400">
            Provision the initial platform owner account using the server&apos;s ADMIN_BOOTSTRAP_TOKEN.
          </p>
        </div>

        <form
          onSubmit={handleSetup}
          className="rounded-2xl bg-[#121722] border border-white/10 p-6 sm:p-8 space-y-4 shadow-2xl"
        >
          {message && (
            <div
              className={`p-3 rounded-lg text-xs font-bold ${
                message.type === 'success'
                  ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/40'
                  : 'bg-red-500/20 text-red-200 border border-red-500/40'
              }`}
            >
              {message.text}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Admin Bootstrap Token (from environment)
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-amber-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={bootstrapToken}
                onChange={(e) => setBootstrapToken(e.target.value)}
                placeholder="Enter ADMIN_BOOTSTRAP_TOKEN"
                className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-black/50 border border-white/15 text-white text-sm font-mono focus:border-club-accent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">First Name</label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Caleb"
                className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/15 text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Last Name</label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Ngiciri"
                className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/15 text-white text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Super Admin Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@3kfc.co.ke"
              className="w-full px-3 py-2.5 rounded-lg bg-black/50 border border-white/15 text-white text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Master Password (Min 10 chars)
            </label>
            <input
              type="password"
              required
              minLength={10}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-3 py-2.5 rounded-lg bg-black/50 border border-white/15 text-white text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-club-primary hover:bg-red-600 text-white text-xs font-bold uppercase tracking-wider shadow transition"
          >
            <span>{submitting ? 'Provisioning...' : 'Provision Super Administrator'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="text-center pt-2 text-xs text-slate-400">
            Already provisioned?{' '}
            <Link href="/admin/login" className="text-club-accent font-bold hover:underline">
              Go to Sign In
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
