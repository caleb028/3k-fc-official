'use client';

import React, { useState } from 'react';
import { Gift, CheckCircle2, AlertCircle, Search, DollarSign, ShieldCheck } from 'lucide-react';

interface CampaignItem {
  id: string;
  slug: string;
  titleEn: string;
  targetKesCents: number | null;
  confirmedTotalKesCents: number;
  confirmedDonorCount: number;
  isActive: boolean;
}

interface DonationItem {
  id: string;
  donorName: string;
  donorEmail: string | null;
  donorPhone: string | null;
  amountKesCents: number;
  paymentMethod: string;
  status: string;
  isAnonymous: boolean;
  publicRecognitionConsent: boolean;
  supporterMessage: string | null;
  confirmedAt: string | null;
  createdAt: string;
  campaign: { titleEn: string };
  receipt: { receiptNumber: string } | null;
}

export function DonationsAdminClient({
  campaigns,
  donations,
}: {
  campaigns: CampaignItem[];
  donations: DonationItem[];
}) {
  const [activeTab, setActiveTab] = useState<'DONATIONS' | 'CAMPAIGNS'>('DONATIONS');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; success: boolean } | null>(null);

  const filtered = donations.filter((d) => {
    const q = searchTerm.toLowerCase();
    return (
      d.donorName.toLowerCase().includes(q) ||
      (d.donorEmail && d.donorEmail.toLowerCase().includes(q)) ||
      (d.donorPhone && d.donorPhone.includes(q)) ||
      (d.receipt && d.receipt.receiptNumber.toLowerCase().includes(q))
    );
  });

  const handleConfirm = async (donationId: string, status: string) => {
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/donations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CONFIRM_DONATION',
          payload: { donationId, status },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update donation.');

      setMessage({ text: 'Donation status updated successfully.', success: true });
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
          onClick={() => setActiveTab('DONATIONS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'DONATIONS'
              ? 'bg-club-primary text-white shadow'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          Individual Contributions ({donations.length})
        </button>
        <button
          onClick={() => setActiveTab('CAMPAIGNS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'CAMPAIGNS'
              ? 'bg-club-primary text-white shadow'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          Community Campaigns ({campaigns.length})
        </button>
      </div>

      {activeTab === 'DONATIONS' && (
        <div className="space-y-4">
          <div className="bg-[#121722] p-4 rounded-2xl border border-white/10 flex items-center text-xs">
            <div className="relative w-full md:w-80">
              <input
                type="text"
                placeholder="Search by donor name, email, phone, receipt #..."
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
                    <th className="py-3 px-4">Donor Name</th>
                    <th className="py-3 px-3">Campaign</th>
                    <th className="py-3 px-3 text-right">Amount (KES)</th>
                    <th className="py-3 px-3">Receipt #</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-4">Supporter Message</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {filtered.map((d) => (
                    <tr key={d.id} className="hover:bg-white/5">
                      <td className="py-3 px-4 text-white font-medium">
                        {d.isAnonymous ? `${d.donorName} (Anonymous)` : d.donorName}
                        <span className="block text-[10px] text-slate-400">{d.donorEmail || d.donorPhone || 'No contact'}</span>
                      </td>
                      <td className="py-3 px-3 text-club-accent font-semibold">{d.campaign.titleEn}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">
                        KES {(d.amountKesCents / 100).toLocaleString()}
                      </td>
                      <td className="py-3 px-3 font-mono text-white">{d.receipt?.receiptNumber || '-'}</td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            d.status === 'CONFIRMED'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : d.status === 'PENDING'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-rose-500/20 text-rose-300'
                          }`}
                        >
                          {d.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-300 text-[11px] max-w-xs truncate">
                        {d.supporterMessage || '-'}
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-[11px]">
                        {new Date(d.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {d.status !== 'CONFIRMED' && (
                          <button
                            onClick={() => handleConfirm(d.id, 'CONFIRMED')}
                            disabled={loading}
                            className="px-2 py-1 bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300 hover:text-white rounded text-[11px] transition font-bold"
                          >
                            Confirm
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'CAMPAIGNS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {campaigns.map((c) => (
            <div key={c.id} className="bg-[#121722] p-6 rounded-2xl border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-club-accent font-bold">
                  {c.confirmedDonorCount} Verified Donors
                </span>
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                    c.isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-500/20 text-slate-400'
                  }`}
                >
                  {c.isActive ? 'Active' : 'Closed'}
                </span>
              </div>
              <h3 className="text-base font-bold text-white">{c.titleEn}</h3>
              <div>
                <span className="text-xs text-slate-400 block mb-1">Confirmed Funds Raised</span>
                <p className="text-2xl font-black text-white font-mono">
                  KES {(c.confirmedTotalKesCents / 100).toLocaleString()}
                </p>
                {c.targetKesCents && (
                  <span className="text-xs text-slate-400 font-mono">
                    Target: KES {(c.targetKesCents / 100).toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
