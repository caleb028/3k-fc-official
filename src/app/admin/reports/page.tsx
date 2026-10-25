import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { FileBarChart2, Download, ShieldCheck, DollarSign } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { requireAdminPermission } from '@/lib/auth';
import { formatKes } from '@/lib/money';

export const dynamic = 'force-dynamic';

export default async function AdminReportsPage() {
  try {
    await requireAdminPermission('reports', 'read');
  } catch {
    redirect('/admin/dashboard');
  }

  // Financial reconciliation figures
  const [
    ticketSalesPaid,
    shopSalesPaid,
    donationsPaid,
    refundsTotal,
    recentPayments,
  ] = await Promise.all([
    prisma.ticketOrder.aggregate({
      where: { status: 'PAID' },
      _sum: { totalKesCents: true },
    }),
    prisma.shopOrder.aggregate({
      where: { status: 'PAID' },
      _sum: { totalKesCents: true },
    }),
    prisma.donation.aggregate({
      where: { status: 'CONFIRMED' },
      _sum: { amountKesCents: true },
    }),
    prisma.refundTransaction.aggregate({
      where: { status: 'VERIFIED_COMPLETED' },
      _sum: { amountKesCents: true },
    }),
    prisma.paymentTransaction.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ]);

  const grossTicketCents = ticketSalesPaid._sum.totalKesCents || 0;
  const grossShopCents = shopSalesPaid._sum.totalKesCents || 0;
  const grossDonationCents = donationsPaid._sum.amountKesCents || 0;
  const totalRefundCents = refundsTotal._sum.amountKesCents || 0;
  const grossCollectionsCents = grossTicketCents + grossShopCents + grossDonationCents;
  const netProceedsCents = grossCollectionsCents - totalRefundCents;

  const reportTypes = [
    { type: 'payments', label: 'Confirmed Payments & M-Pesa Reconciliations' },
    { type: 'tickets', label: 'Ticket Issuance & Gate Redemptions' },
    { type: 'merchandise', label: 'Merchandise Revenue & Order Fulfillment' },
    { type: 'donations', label: 'Verified Supporter Donations' },
  ];

  return (
    <div className="space-y-8">
      <div className="border-b border-white/10 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-club-accent">
            <FileBarChart2 className="w-4 h-4" />
            <span>Section 20 Financial &amp; Commercial Reporting</span>
          </div>
          <h1 className="editorial-headline font-black text-2xl md:text-3xl text-white mt-1">
            Authorised Reports &amp; Financial Reconciliation
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            All monetary figures in KES. Separates gross sales collections, refunds, and net proceeds.
          </p>
        </div>
      </div>

      {/* Financial Breakdown Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="rounded-2xl bg-[#121722] border border-white/10 p-5 space-y-2">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">
            Gross Ticket Sales
          </span>
          <div className="font-mono font-black text-2xl text-white">
            {formatKes(grossTicketCents)}
          </div>
          <span className="text-xs text-slate-400">Paid matchday orders</span>
        </div>

        <div className="rounded-2xl bg-[#121722] border border-white/10 p-5 space-y-2">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">
            Gross Store Revenue
          </span>
          <div className="font-mono font-black text-2xl text-white">
            {formatKes(grossShopCents)}
          </div>
          <span className="text-xs text-slate-400">Merchandise &amp; gear</span>
        </div>

        <div className="rounded-2xl bg-[#121722] border border-white/10 p-5 space-y-2">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">
            Approved Refunds
          </span>
          <div className="font-mono font-black text-2xl text-red-400">
            {formatKes(totalRefundCents)}
          </div>
          <span className="text-xs text-slate-400">Reconciled reversals</span>
        </div>

        <div className="rounded-2xl bg-[#121722] border border-white/10 p-5 space-y-2">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">
            Net Proceeds (KES)
          </span>
          <div className="font-mono font-black text-2xl text-emerald-400">
            {formatKes(netProceedsCents)}
          </div>
          <span className="text-xs text-emerald-300">Gross minus refunds</span>
        </div>
      </div>

      {/* Downloadable Exports Section */}
      <div className="rounded-2xl bg-[#121722] border border-white/10 p-6 md:p-8 space-y-6">
        <h2 className="font-display font-bold text-xl text-white">
          Download Authorised CSV &amp; JSON Reports
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reportTypes.map((r) => (
            <div
              key={r.type}
              className="p-4 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between gap-4"
            >
              <div>
                <strong className="text-white text-sm block">{r.label}</strong>
                <span className="text-xs text-slate-400 font-mono">Dataset: {r.type}</span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`/api/admin/reports/export?type=${r.type}&format=csv`}
                  download
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-club-primary hover:bg-red-600 text-white text-xs font-bold transition shadow"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>CSV</span>
                </a>
                <a
                  href={`/api/admin/reports/export?type=${r.type}&format=json`}
                  target="_blank"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition"
                >
                  JSON
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Transactions Audit Table */}
      <div className="rounded-2xl bg-[#121722] border border-white/10 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between text-xs">
          <span className="font-bold uppercase tracking-wider text-white">
            Recent Payment Transactions (M-Pesa Daraja)
          </span>
          <span className="text-slate-400">Last 10 records</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-black/30 text-slate-400 uppercase font-mono border-b border-white/5">
              <tr>
                <th className="py-3 px-4">Reference</th>
                <th className="py-3 px-4">Purpose</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">M-Pesa Receipt</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {recentPayments.map((p) => (
                <tr key={p.id} className="hover:bg-white/5 font-mono">
                  <td className="py-3 px-4 text-white font-bold">{p.reference}</td>
                  <td className="py-3 px-4">{p.purpose}</td>
                  <td className="py-3 px-4 font-bold text-club-accent">
                    {formatKes(p.amountKesCents)}
                  </td>
                  <td className="py-3 px-4">{p.mpesaReceiptNumber || '—'}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        p.status === 'SUCCESS'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : p.status === 'PENDING'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-red-500/20 text-red-300'
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400">
                    {new Date(p.createdAt).toLocaleDateString('en-KE')}
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
