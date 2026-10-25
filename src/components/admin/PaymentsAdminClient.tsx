'use client';

import React, { useState } from 'react';
import { CreditCard, CheckCircle2, AlertCircle, Search, RefreshCw, FileText } from 'lucide-react';

interface PaymentTx {
  id: string;
  reference: string;
  provider: string;
  environment: string;
  purpose: string;
  phoneNormalized: string;
  amountKesCents: number;
  providerFeeKesCents: number;
  netProceedsKesCents: number;
  mpesaReceiptNumber: string | null;
  status: string;
  resultDescription: string | null;
  confirmedAt: string | null;
  createdAt: string;
}

export function PaymentsAdminClient({ transactions }: { transactions: PaymentTx[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [purposeFilter, setPurposeFilter] = useState('ALL');
  const [reconcilingTx, setReconcilingTx] = useState<PaymentTx | null>(null);
  const [verifiedStatus, setVerifiedStatus] = useState<'SUCCESS' | 'FAILED' | 'CANCELLED'>('SUCCESS');
  const [mpesaReceipt, setMpesaReceipt] = useState('');
  const [reconcileNotes, setReconcileNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; success: boolean } | null>(null);

  const filtered = transactions.filter((t) => {
    const matchesSearch =
      t.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.phoneNormalized.includes(searchTerm) ||
      (t.mpesaReceiptNumber && t.mpesaReceiptNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    const matchesPurpose = purposeFilter === 'ALL' || t.purpose === purposeFilter;
    return matchesSearch && matchesStatus && matchesPurpose;
  });

  const handleReconcile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reconcilingTx || !reconcileNotes) return;
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'RECONCILE',
          payload: {
            transactionId: reconcilingTx.id,
            verifiedStatus,
            mpesaReceiptNumber: mpesaReceipt || null,
            notes: reconcileNotes,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Reconciliation failed.');

      setMessage({ text: 'Payment reconciled and committed to audit trail.', success: true });
      setReconcilingTx(null);
      setReconcileNotes('');
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

      {/* Filters */}
      <div className="bg-[#121722] p-4 rounded-2xl border border-white/10 flex flex-col md:flex-row gap-4 justify-between items-center text-xs">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search by M-Pesa receipt, phone, reference..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 pl-9 text-white placeholder-slate-500"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white font-medium"
          >
            <option value="ALL">All Statuses</option>
            <option value="SUCCESS">SUCCESS</option>
            <option value="PENDING">PENDING</option>
            <option value="FAILED">FAILED</option>
          </select>

          <select
            value={purposeFilter}
            onChange={(e) => setPurposeFilter(e.target.value)}
            className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white font-medium"
          >
            <option value="ALL">All Revenue Streams</option>
            <option value="TICKET_ORDER">TICKET_ORDER</option>
            <option value="SHOP_ORDER">SHOP_ORDER</option>
            <option value="MEMBERSHIP">MEMBERSHIP</option>
            <option value="DONATION">DONATION</option>
          </select>
        </div>
      </div>

      {/* Reconciliation Modal */}
      {reconcilingTx && (
        <div className="bg-[#121722] p-6 rounded-2xl border border-amber-500/40 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <h2 className="text-base font-bold text-white">
              Manual Financial Reconciliation: {reconcilingTx.reference}
            </h2>
            <button onClick={() => setReconcilingTx(null)} className="text-slate-400 hover:text-white text-xs">
              Close
            </button>
          </div>

          <form onSubmit={handleReconcile} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-slate-400 block mb-1">Target Status</label>
                <select
                  value={verifiedStatus}
                  onChange={(e) => setVerifiedStatus(e.target.value as any)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white"
                >
                  <option value="SUCCESS">SUCCESS (Mark Paid)</option>
                  <option value="FAILED">FAILED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">M-Pesa Receipt Number</label>
                <input
                  type="text"
                  placeholder="e.g. SLK9A8F76G"
                  value={mpesaReceipt}
                  onChange={(e) => setMpesaReceipt(e.target.value.toUpperCase())}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white font-mono uppercase"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Amount</label>
                <div className="p-2.5 bg-black/50 border border-white/10 rounded-lg text-emerald-400 font-bold font-mono">
                  KES {(reconcilingTx.amountKesCents / 100).toLocaleString()}
                </div>
              </div>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Audited Reconciliation Note (Required)</label>
              <input
                type="text"
                required
                placeholder="State Safaricom statement verification reason..."
                value={reconcileNotes}
                onChange={(e) => setReconcileNotes(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReconcilingTx(null)}
                className="px-4 py-2 bg-white/10 text-white rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs"
              >
                {loading ? 'Reconciling...' : 'Confirm Reconciliation'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Ledger Table */}
      <div className="bg-[#121722] rounded-2xl border border-white/10 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-black/30 text-slate-400 uppercase font-mono border-b border-white/5">
              <tr>
                <th className="py-3 px-4">Reference</th>
                <th className="py-3 px-3">Stream</th>
                <th className="py-3 px-3">Phone</th>
                <th className="py-3 px-3 text-right">Gross (KES)</th>
                <th className="py-3 px-3 text-right">Fee</th>
                <th className="py-3 px-3 text-right">Net</th>
                <th className="py-3 px-3">M-Pesa Receipt</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {filtered.map((t) => (
                <tr key={t.id} className="hover:bg-white/5">
                  <td className="py-3 px-4 font-mono font-bold text-white">{t.reference}</td>
                  <td className="py-3 px-3 font-semibold text-club-accent">{t.purpose}</td>
                  <td className="py-3 px-3 font-mono text-slate-400">{t.phoneNormalized}</td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-white">
                    KES {(t.amountKesCents / 100).toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-400">
                    KES {(t.providerFeeKesCents / 100).toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-emerald-400 font-bold">
                    KES {(t.netProceedsKesCents / 100).toLocaleString()}
                  </td>
                  <td className="py-3 px-3 font-mono text-white">{t.mpesaReceiptNumber || '-'}</td>
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        t.status === 'SUCCESS'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : t.status === 'PENDING'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-rose-500/20 text-rose-300'
                      }`}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-[11px]">
                    {new Date(t.createdAt).toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {t.status !== 'SUCCESS' && (
                      <button
                        onClick={() => {
                          setReconcilingTx(t);
                          setMpesaReceipt(t.mpesaReceiptNumber || '');
                        }}
                        className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-[11px] text-amber-400 hover:text-white transition"
                        title="Reconcile transaction"
                      >
                        Reconcile
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
  );
}
