'use client';

import React, { useState } from 'react';
import { Award, CheckCircle2, AlertCircle, PlusCircle, MinusCircle, History, Gift } from 'lucide-react';

interface LoyaltyAccountItem {
  id: string;
  userId: string;
  balancePoints: number;
  lifetimePointsEarned: number;
  user: {
    email: string;
    profile: { firstName: string; lastName: string } | null;
  };
}

interface LedgerItem {
  id: string;
  eventType: string;
  pointsDelta: number;
  balanceAfter: number;
  reason: string;
  createdAt: string;
  account: {
    user: { email: string };
  };
}

interface RewardItem {
  id: string;
  code: string;
  titleEn: string;
  pointsCost: number;
  rewardType: string;
  isActive: boolean;
}

export function LoyaltyAdminClient({
  accounts,
  ledger,
  rewards,
}: {
  accounts: LoyaltyAccountItem[];
  ledger: LedgerItem[];
  rewards: RewardItem[];
}) {
  const [activeTab, setActiveTab] = useState<'ACCOUNTS' | 'LEDGER' | 'REWARDS'>('ACCOUNTS');
  const [adjustingAccount, setAdjustingAccount] = useState<LoyaltyAccountItem | null>(null);
  const [pointsDelta, setPointsDelta] = useState<number>(50);
  const [reason, setReason] = useState<string>('Matchday volunteer appreciation bonus');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; success: boolean } | null>(null);

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingAccount || !reason) return;
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/loyalty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'MANUAL_ADJUSTMENT',
          payload: {
            userId: adjustingAccount.userId,
            pointsDelta: Number(pointsDelta),
            reason,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Adjustment failed.');

      setMessage({ text: 'Loyalty points successfully credited/debited and committed to ledger.', success: true });
      setAdjustingAccount(null);
    } catch (err: any) {
      setMessage({ text: err.message, success: false });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 text-sm font-semibold ${
            message.success
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
          }`}
        >
          {message.success ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-4">
        <button
          onClick={() => setActiveTab('ACCOUNTS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'ACCOUNTS'
              ? 'bg-club-primary text-white shadow'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          Fan Accounts ({accounts.length})
        </button>
        <button
          onClick={() => setActiveTab('LEDGER')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'LEDGER'
              ? 'bg-club-primary text-white shadow'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          Immutable Ledger Audit ({ledger.length})
        </button>
        <button
          onClick={() => setActiveTab('REWARDS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'REWARDS'
              ? 'bg-club-primary text-white shadow'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          Rewards Catalog ({rewards.length})
        </button>
      </div>

      {/* Adjustment Drawer Modal */}
      {adjustingAccount && (
        <div className="bg-[#121722] p-6 rounded-2xl border border-club-primary/40 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <h2 className="text-base font-bold text-white">
              Adjust Loyalty Points: {adjustingAccount.user.email} (Current Balance:{' '}
              {adjustingAccount.balancePoints} Pts)
            </h2>
            <button onClick={() => setAdjustingAccount(null)} className="text-slate-400 hover:text-white text-xs">
              Close
            </button>
          </div>

          <form onSubmit={handleAdjust} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-slate-400 block mb-1">Points Delta (+ Credit, - Debit)</label>
                <input
                  type="number"
                  required
                  value={pointsDelta}
                  onChange={(e) => setPointsDelta(parseInt(e.target.value))}
                  placeholder="e.g. 100 or -50"
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white font-mono"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Administrative Reason (Required for Audit)</label>
                <input
                  type="text"
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAdjustingAccount(null)}
                className="px-4 py-2 bg-white/10 text-white rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 bg-club-primary hover:bg-club-dark text-white font-bold rounded-xl text-xs"
              >
                {loading ? 'Adjusting...' : 'Commit Ledger Entry'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Accounts List */}
      {activeTab === 'ACCOUNTS' && (
        <div className="bg-[#121722] rounded-2xl border border-white/10 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-black/30 text-slate-400 uppercase font-mono border-b border-white/5">
                <tr>
                  <th className="py-3 px-4">Supporter</th>
                  <th className="py-3 px-3 text-right">Current Balance</th>
                  <th className="py-3 px-3 text-right">Lifetime Earned</th>
                  <th className="py-3 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {accounts.map((a) => (
                  <tr key={a.id} className="hover:bg-white/5">
                    <td className="py-3 px-4 text-white font-medium">
                      {a.user.profile
                        ? `${a.user.profile.firstName} ${a.user.profile.lastName}`
                        : a.user.email}
                      <span className="block text-[10px] text-slate-400">{a.user.email}</span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-club-accent">
                      {a.balancePoints.toLocaleString()} Pts
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-400">
                      {a.lifetimePointsEarned.toLocaleString()} Pts
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => setAdjustingAccount(a)}
                        className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-[11px] text-white transition"
                      >
                        Manual Adjust
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Ledger History */}
      {activeTab === 'LEDGER' && (
        <div className="bg-[#121722] rounded-2xl border border-white/10 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-black/30 text-slate-400 uppercase font-mono border-b border-white/5">
                <tr>
                  <th className="py-3 px-4">Account</th>
                  <th className="py-3 px-3">Event Type</th>
                  <th className="py-3 px-3 text-right">Delta</th>
                  <th className="py-3 px-3 text-right">Balance After</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {ledger.map((l) => (
                  <tr key={l.id} className="hover:bg-white/5">
                    <td className="py-3 px-4 font-mono text-white">{l.account.user.email}</td>
                    <td className="py-3 px-3 font-semibold text-club-accent">{l.eventType}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold">
                      <span className={l.pointsDelta > 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {l.pointsDelta > 0 ? `+${l.pointsDelta}` : l.pointsDelta} Pts
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-white">{l.balanceAfter} Pts</td>
                    <td className="py-3 px-4 text-slate-300 text-[11px]">{l.reason}</td>
                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      {new Date(l.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Rewards Catalog */}
      {activeTab === 'REWARDS' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {rewards.map((r) => (
            <div key={r.id} className="bg-[#121722] p-6 rounded-2xl border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase bg-club-primary/20 text-club-accent px-2 py-0.5 rounded">
                  {r.rewardType}
                </span>
                <span className="text-xs text-emerald-400 font-bold font-mono">{r.pointsCost} Points</span>
              </div>
              <h3 className="text-base font-bold text-white">{r.titleEn}</h3>
              <p className="text-xs text-slate-400 font-mono">Code: {r.code}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
