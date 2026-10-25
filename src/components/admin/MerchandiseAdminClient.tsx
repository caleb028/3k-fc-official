'use client';

import React, { useState } from 'react';
import { ShoppingBag, Package, CheckCircle2, AlertCircle, Edit, Truck, Box } from 'lucide-react';

interface VariantData {
  id: string;
  sku: string;
  size: string;
  color: string;
  stockQuantity: number;
  reservedQuantity: number;
}

interface ProductData {
  id: string;
  slug: string;
  sku: string;
  nameEn: string;
  category: string;
  priceKesCents: number;
  isAvailable: boolean;
  variants: VariantData[];
}

interface ShopOrderData {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  county: string;
  totalKesCents: number;
  status: string;
  createdAt: string;
  deliveryOption: { nameEn: string; code: string };
  fulfilment: { status: string; trackingReference: string | null } | null;
  items: Array<{ productName: string; variantLabel: string; quantity: number }>;
}

export function MerchandiseAdminClient({
  products,
  orders,
}: {
  products: ProductData[];
  orders: ShopOrderData[];
}) {
  const [activeTab, setActiveTab] = useState<'PRODUCTS' | 'ORDERS'>('PRODUCTS');
  const [adjustingVariant, setAdjustingVariant] = useState<VariantData | null>(null);
  const [productForVariant, setProductForVariant] = useState<ProductData | null>(null);
  const [stockDelta, setStockDelta] = useState<number>(10);
  const [adjustReason, setAdjustReason] = useState<string>('Inventory Restock from Supplier');

  const [managingOrder, setManagingOrder] = useState<ShopOrderData | null>(null);
  const [orderStatus, setOrderStatus] = useState<string>('PROCESSING');
  const [trackingRef, setTrackingRef] = useState<string>('');
  const [orderNotes, setOrderNotes] = useState<string>('');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; success: boolean } | null>(null);

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingVariant) return;
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/merchandise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ADJUST_STOCK',
          payload: {
            variantId: adjustingVariant.id,
            delta: Number(stockDelta),
            reason: adjustReason,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to adjust stock.');

      setMessage({ text: 'Stock level successfully updated.', success: true });
      setAdjustingVariant(null);
    } catch (err: any) {
      setMessage({ text: err.message, success: false });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!managingOrder) return;
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/merchandise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_ORDER_STATUS',
          payload: {
            orderId: managingOrder.id,
            status: orderStatus,
            trackingReference: trackingRef || null,
            notes: orderNotes || null,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update order status.');

      setMessage({ text: 'Order fulfillment status updated.', success: true });
      setManagingOrder(null);
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
          onClick={() => setActiveTab('PRODUCTS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'PRODUCTS'
              ? 'bg-club-primary text-white shadow'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          Product Catalog &amp; Stock ({products.length})
        </button>
        <button
          onClick={() => setActiveTab('ORDERS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'ORDERS'
              ? 'bg-club-primary text-white shadow'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          Customer Orders &amp; Fulfilment ({orders.length})
        </button>
      </div>

      {/* Stock Adjust Drawer Modal */}
      {adjustingVariant && productForVariant && (
        <div className="bg-[#121722] p-6 rounded-2xl border border-club-primary/40 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <h2 className="text-base font-bold text-white">
              Adjust Inventory Stock: {productForVariant.nameEn} (Size {adjustingVariant.size})
            </h2>
            <button onClick={() => setAdjustingVariant(null)} className="text-slate-400 hover:text-white text-xs">
              Close
            </button>
          </div>

          <form onSubmit={handleAdjustStock} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-slate-400 block mb-1">Current In-Stock Quantity</label>
                <div className="p-2.5 bg-black/50 border border-white/10 rounded-lg text-white font-mono font-bold">
                  {adjustingVariant.stockQuantity} units
                </div>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Adjustment Delta (+ or -)</label>
                <input
                  type="number"
                  required
                  value={stockDelta}
                  onChange={(e) => setStockDelta(parseInt(e.target.value))}
                  placeholder="e.g. 25 or -2"
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white font-mono"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Reason for Audit Log</label>
                <input
                  type="text"
                  required
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAdjustingVariant(null)}
                className="px-4 py-2 bg-white/10 text-white rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 bg-club-primary hover:bg-club-dark text-white font-bold rounded-xl text-xs"
              >
                {loading ? 'Adjusting...' : 'Commit Stock Movement'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Order Status Modal */}
      {managingOrder && (
        <div className="bg-[#121722] p-6 rounded-2xl border border-club-primary/40 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <h2 className="text-base font-bold text-white">
              Manage Fulfilment: {managingOrder.orderNumber} ({managingOrder.customerName})
            </h2>
            <button onClick={() => setManagingOrder(null)} className="text-slate-400 hover:text-white text-xs">
              Close
            </button>
          </div>

          <form onSubmit={handleUpdateOrder} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-slate-400 block mb-1">Order Status</label>
                <select
                  value={orderStatus}
                  onChange={(e) => setOrderStatus(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white"
                >
                  <option value="PAID">PAID</option>
                  <option value="PROCESSING">PROCESSING</option>
                  <option value="READY_FOR_COLLECTION">READY_FOR_COLLECTION (Embu Hub)</option>
                  <option value="DISPATCHED">DISPATCHED (Courier)</option>
                  <option value="DELIVERED">DELIVERED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Tracking Number / Waybill</label>
                <input
                  type="text"
                  placeholder="e.g. EMB-CR-9821"
                  value={trackingRef}
                  onChange={(e) => setTrackingRef(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white font-mono"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Dispatch Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Handed to G4S Courier Embu branch"
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setManagingOrder(null)}
                className="px-4 py-2 bg-white/10 text-white rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 bg-club-primary hover:bg-club-dark text-white font-bold rounded-xl text-xs"
              >
                {loading ? 'Updating...' : 'Update Fulfilment'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Products Table */}
      {activeTab === 'PRODUCTS' && (
        <div className="bg-[#121722] rounded-2xl border border-white/10 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-black/30 text-slate-400 uppercase font-mono border-b border-white/5">
                <tr>
                  <th className="py-3 px-4">Item &amp; SKU</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3 text-right">Price (KES)</th>
                  <th className="py-3 px-4">Size Variants &amp; Stock Levels</th>
                  <th className="py-3 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-white/5">
                    <td className="py-3 px-4 text-white font-bold">
                      {p.nameEn}
                      <span className="block text-[10px] text-slate-500 font-mono">{p.sku}</span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-club-accent">{p.category}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-white">
                      KES {(p.priceKesCents / 100).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1.5">
                        {p.variants.map((v) => (
                          <button
                            key={v.id}
                            onClick={() => {
                              setProductForVariant(p);
                              setAdjustingVariant(v);
                            }}
                            className="bg-black/40 hover:bg-club-primary/20 border border-white/10 hover:border-club-primary rounded px-2 py-1 text-[11px] font-mono transition flex items-center gap-1.5"
                            title="Click to adjust stock"
                          >
                            <span className="text-slate-400 font-bold">{v.size}:</span>
                            <span className={v.stockQuantity > 5 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                              {v.stockQuantity}
                            </span>
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          p.isAvailable ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-500/20 text-slate-400'
                        }`}
                      >
                        {p.isAvailable ? 'Available' : 'Hidden'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Orders Table */}
      {activeTab === 'ORDERS' && (
        <div className="bg-[#121722] rounded-2xl border border-white/10 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-black/30 text-slate-400 uppercase font-mono border-b border-white/5">
                <tr>
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-3">Delivery Method</th>
                  <th className="py-3 px-4">Items</th>
                  <th className="py-3 px-3 text-right">Total (KES)</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-white/5">
                    <td className="py-3 px-4 font-mono font-bold text-white">{o.orderNumber}</td>
                    <td className="py-3 px-4 text-white font-medium">
                      {o.customerName}
                      <span className="block text-[10px] text-slate-400 font-mono">{o.customerPhone}</span>
                    </td>
                    <td className="py-3 px-3 text-slate-300 font-medium">
                      {o.deliveryOption.nameEn}
                      <span className="block text-[10px] text-slate-500">{o.county}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {o.items.map((i, idx) => (
                        <div key={idx} className="text-[11px]">
                          {i.quantity}x {i.productName} ({i.variantLabel})
                        </div>
                      ))}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">
                      KES {(o.totalKesCents / 100).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          o.status === 'DELIVERED'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : o.status === 'DISPATCHED' || o.status === 'READY_FOR_COLLECTION'
                            ? 'bg-blue-500/20 text-blue-300'
                            : o.status === 'PAID'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-slate-500/20 text-slate-400'
                        }`}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => {
                          setManagingOrder(o);
                          setOrderStatus(o.status);
                          setTrackingRef(o.fulfilment?.trackingReference || '');
                        }}
                        className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-[11px] text-white transition"
                      >
                        Fulfil
                      </button>
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
