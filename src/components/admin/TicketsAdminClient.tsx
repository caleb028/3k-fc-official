'use client';

import React, { useState } from 'react';
import { Ticket, DollarSign, CheckCircle2, AlertCircle, Edit, Users, ShoppingBag } from 'lucide-react';

interface CategoryData {
  id: string;
  nameEn: string;
  nameSw: string;
  priceKesCents: number;
  isActive: boolean;
  fixture: {
    homeClub: { shortName: string };
    awayClub: { shortName: string };
    kickoffAt: string;
  };
  inventory: {
    totalCapacity: number;
    reservedCount: number;
    soldCount: number;
  } | null;
}

interface OrderData {
  id: string;
  orderNumber: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  totalKesCents: number;
  status: string;
  createdAt: string;
  ticketCount: number;
}

export function TicketsAdminClient({
  categories,
  orders,
}: {
  categories: CategoryData[];
  orders: OrderData[];
}) {
  const [activeTab, setActiveTab] = useState<'CATEGORIES' | 'ORDERS'>('CATEGORIES');
  const [editingCat, setEditingCat] = useState<CategoryData | null>(null);
  const [editCapacity, setEditCapacity] = useState<number>(0);
  const [editPriceKes, setEditPriceKes] = useState<number>(0);
  const [editActive, setEditActive] = useState<boolean>(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; success: boolean } | null>(null);

  const startEdit = (cat: CategoryData) => {
    setEditingCat(cat);
    setEditCapacity(cat.inventory?.totalCapacity ?? 1000);
    setEditPriceKes(cat.priceKesCents / 100);
    setEditActive(cat.isActive);
    setMessage(null);
  };

  const handleSaveCat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCat) return;
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_CATEGORY',
          payload: {
            categoryId: editingCat.id,
            totalCapacity: Number(editCapacity),
            priceKesCents: Math.round(Number(editPriceKes) * 100),
            isActive: editActive,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update category.');

      setMessage({ text: 'Ticket tier and capacity updated successfully.', success: true });
      setEditingCat(null);
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
          onClick={() => setActiveTab('CATEGORIES')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'CATEGORIES'
              ? 'bg-club-primary text-white shadow'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          Capacity &amp; Pricing Tiers ({categories.length})
        </button>
        <button
          onClick={() => setActiveTab('ORDERS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'ORDERS'
              ? 'bg-club-primary text-white shadow'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          Recent Ticket Orders ({orders.length})
        </button>
      </div>

      {/* Edit Drawer Modal */}
      {editingCat && (
        <div className="bg-[#121722] p-6 rounded-2xl border border-club-primary/40 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <h2 className="text-base font-bold text-white">
              Edit Category: {editingCat.nameEn} ({editingCat.fixture.homeClub.shortName} vs {editingCat.fixture.awayClub.shortName})
            </h2>
            <button onClick={() => setEditingCat(null)} className="text-slate-400 hover:text-white text-xs">
              Close
            </button>
          </div>

          <form onSubmit={handleSaveCat} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-slate-400 block mb-1">Total Venue Capacity (Seats/Spots)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={editCapacity}
                  onChange={(e) => setEditCapacity(parseInt(e.target.value))}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white font-mono"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Price (KES)</label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  required
                  value={editPriceKes}
                  onChange={(e) => setEditPriceKes(parseFloat(e.target.value))}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white font-mono"
                />
              </div>
              <div className="flex items-center pt-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editActive}
                    onChange={(e) => setEditActive(e.target.checked)}
                    className="rounded bg-black border-white/20 text-club-primary"
                  />
                  <span className="text-white font-medium select-none">Active for Public Purchase</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingCat(null)}
                className="px-4 py-2 bg-white/10 text-white rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 bg-club-primary hover:bg-club-dark text-white font-bold rounded-xl text-xs"
              >
                {loading ? 'Saving...' : 'Update Tier'}
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'CATEGORIES' && (
        <div className="bg-[#121722] rounded-2xl border border-white/10 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-black/30 text-slate-400 uppercase font-mono border-b border-white/5">
                <tr>
                  <th className="py-3 px-4">Fixture</th>
                  <th className="py-3 px-4">Category Tier</th>
                  <th className="py-3 px-3 text-right">Price (KES)</th>
                  <th className="py-3 px-3 text-center">Capacity</th>
                  <th className="py-3 px-3 text-center">Sold</th>
                  <th className="py-3 px-3 text-center">Available</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {categories.map((c) => {
                  const cap = c.inventory?.totalCapacity ?? 0;
                  const sold = c.inventory?.soldCount ?? 0;
                  const avail = Math.max(0, cap - sold);
                  return (
                    <tr key={c.id} className="hover:bg-white/5">
                      <td className="py-3 px-4 text-white font-bold">
                        {c.fixture.homeClub.shortName} vs {c.fixture.awayClub.shortName}
                        <span className="block text-[10px] text-slate-400 font-normal">
                          {new Date(c.fixture.kickoffAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-club-accent">{c.nameEn}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-white">
                        KES {(c.priceKesCents / 100).toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-center font-mono">{cap.toLocaleString()}</td>
                      <td className="py-3 px-3 text-center font-mono text-emerald-400">{sold.toLocaleString()}</td>
                      <td className="py-3 px-3 text-center font-mono text-club-accent font-bold">
                        {avail.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            c.isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                          }`}
                        >
                          {c.isActive ? 'Open' : 'Closed'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => startEdit(c)}
                          className="p-1.5 bg-white/5 hover:bg-white/10 rounded text-slate-300 hover:text-white transition"
                          title="Edit capacity and price"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'ORDERS' && (
        <div className="bg-[#121722] rounded-2xl border border-white/10 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-black/30 text-slate-400 uppercase font-mono border-b border-white/5">
                <tr>
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-4">Buyer</th>
                  <th className="py-3 px-3">Phone</th>
                  <th className="py-3 px-3 text-center">Tickets</th>
                  <th className="py-3 px-3 text-right">Total (KES)</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-white/5">
                    <td className="py-3 px-4 font-mono font-bold text-white">{o.orderNumber}</td>
                    <td className="py-3 px-4 font-medium text-white">
                      {o.buyerName}
                      <span className="block text-[10px] text-slate-400">{o.buyerEmail}</span>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-400">{o.buyerPhone}</td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-white">{o.ticketCount}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">
                      KES {(o.totalKesCents / 100).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          o.status === 'PAID'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : o.status === 'PENDING_PAYMENT'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      {new Date(o.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
