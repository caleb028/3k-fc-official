'use client';

import React, { useState } from 'react';
import { HeartHandshake, CheckCircle2, AlertCircle, Shield, CreditCard, Search } from 'lucide-react';

interface MemberPlan {
  id: string;
  slug: string;
  nameEn: string;
  nameSw: string;
  billingCycle: string;
  priceKesCents: number;
  merchDiscountPercent: number;
  welcomeLoyaltyPoints: number;
  isActive: boolean;
  memberCount: number;
}

interface MemberRecord {
  id: string;
  membershipNumber: string;
  status: string;
  startsAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  user: {
    email: string;
    phone: string | null;
    profile: { firstName: string; lastName: string } | null;
  };
  plan: {
    nameEn: string;
    priceKesCents: number;
  };
  card: {
    cardIdentifier: string;
    validityStatus: string;
  } | null;
}

export function MembershipsAdminClient({
  plans,
  members,
}: {
  plans: MemberPlan[];
  members: MemberRecord[];
}) {
  const [activeTab, setActiveTab] = useState<'MEMBERS' | 'PLANS'>('MEMBERS');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMember, setSelectedMember] = useState<MemberRecord | null>(null);
  const [targetStatus, setTargetStatus] = useState<'ACTIVE' | 'EXPIRED' | 'CANCELLED'>('ACTIVE');
  const [reason, setReason] = useState('Official club executive approval');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; success: boolean } | null>(null);

  const filteredMembers = members.filter((m) => {
    const q = searchTerm.toLowerCase();
    const name = `${m.user.profile?.firstName ?? ''} ${m.user.profile?.lastName ?? ''}`.toLowerCase();
    return (
      m.membershipNumber.toLowerCase().includes(q) ||
      m.user.email.toLowerCase().includes(q) ||
      (m.user.phone && m.user.phone.includes(q)) ||
      name.includes(q)
    );
  });

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember || !reason) return;
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/memberships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SET_STATUS',
          payload: {
            membershipId: selectedMember.id,
            status: targetStatus,
            durationDays: 365,
            reason,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update membership status.');

      setMessage({ text: 'Membership status updated successfully.', success: true });
      setSelectedMember(null);
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
          onClick={() => setActiveTab('MEMBERS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'MEMBERS'
              ? 'bg-club-primary text-white shadow'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          Active Supporters &amp; Cards ({members.length})
        </button>
        <button
          onClick={() => setActiveTab('PLANS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'PLANS'
              ? 'bg-club-primary text-white shadow'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          Membership Tiers &amp; Plans ({plans.length})
        </button>
      </div>

      {/* Status Modal Drawer */}
      {selectedMember && (
        <div className="bg-[#121722] p-6 rounded-2xl border border-club-primary/40 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <h2 className="text-base font-bold text-white">
              Manage Membership: {selectedMember.membershipNumber} (
              {selectedMember.user.profile?.firstName || selectedMember.user.email})
            </h2>
            <button onClick={() => setSelectedMember(null)} className="text-slate-400 hover:text-white text-xs">
              Close
            </button>
          </div>

          <form onSubmit={handleUpdateStatus} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-slate-400 block mb-1">New Membership Status</label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value as any)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white"
                >
                  <option value="ACTIVE">ACTIVE (Issue/Validate Digital Card)</option>
                  <option value="EXPIRED">EXPIRED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Administrative Reason for Audit</label>
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
                onClick={() => setSelectedMember(null)}
                className="px-4 py-2 bg-white/10 text-white rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 bg-club-primary hover:bg-club-dark text-white font-bold rounded-xl text-xs"
              >
                {loading ? 'Committing...' : 'Commit Status Update'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Members Directory */}
      {activeTab === 'MEMBERS' && (
        <div className="space-y-4">
          <div className="bg-[#121722] p-4 rounded-2xl border border-white/10 flex items-center text-xs">
            <div className="relative w-full md:w-80">
              <input
                type="text"
                placeholder="Search by member #, email, phone, name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 pl-9 text-white placeholder-slate-500"
              />
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            </div>
          </div>

          <div className="bg-[#121722] rounded-2xl border border-white/10 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-black/30 text-slate-400 uppercase font-mono border-b border-white/5">
                  <tr>
                    <th className="py-3 px-4">Member #</th>
                    <th className="py-3 px-4">Supporter</th>
                    <th className="py-3 px-3">Plan Tier</th>
                    <th className="py-3 px-3">Digital Card ID</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-4">Valid Until</th>
                    <th className="py-3 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {filteredMembers.map((m) => (
                    <tr key={m.id} className="hover:bg-white/5">
                      <td className="py-3 px-4 font-mono font-bold text-white">{m.membershipNumber}</td>
                      <td className="py-3 px-4 text-white font-medium">
                        {m.user.profile
                          ? `${m.user.profile.firstName} ${m.user.profile.lastName}`
                          : m.user.email}
                        <span className="block text-[10px] text-slate-400">{m.user.email}</span>
                      </td>
                      <td className="py-3 px-3 font-semibold text-club-accent">{m.plan.nameEn}</td>
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-400">
                        {m.card?.cardIdentifier || '-'}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            m.status === 'ACTIVE'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : m.status === 'PENDING_PAYMENT'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-rose-500/20 text-rose-300'
                          }`}
                        >
                          {m.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-[11px]">
                        {m.expiresAt ? new Date(m.expiresAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => {
                            setSelectedMember(m);
                            setTargetStatus(m.status === 'ACTIVE' ? 'EXPIRED' : 'ACTIVE');
                          }}
                          className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-[11px] text-white transition"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Plans List */}
      {activeTab === 'PLANS' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((p) => (
            <div key={p.id} className="bg-[#121722] p-6 rounded-2xl border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase bg-club-primary/20 text-club-accent px-2 py-0.5 rounded">
                  {p.billingCycle}
                </span>
                <span className="text-xs text-slate-400 font-bold">{p.memberCount} Members</span>
              </div>
              <h3 className="text-base font-bold text-white">{p.nameEn}</h3>
              <p className="text-2xl font-black text-white font-mono">
                KES {(p.priceKesCents / 100).toLocaleString()}
              </p>
              <div className="space-y-1.5 text-xs text-slate-300 pt-2 border-t border-white/5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Merchandise Discount:</span>
                  <span className="font-bold text-emerald-400">{p.merchDiscountPercent}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Welcome Loyalty:</span>
                  <span className="font-bold text-club-accent">+{p.welcomeLoyaltyPoints} Pts</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
