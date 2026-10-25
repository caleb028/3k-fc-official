'use client';

import React, { useState, useEffect } from 'react';
import {
  Ticket,
  ShieldCheck,
  Smartphone,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Send,
  AlertTriangle,
} from 'lucide-react';
import { formatKes } from '@/lib/money';

interface CategoryOption {
  id: string;
  nameEn: string;
  nameSw: string;
  descriptionEn?: string | null;
  priceKesCents: number;
  maxPerOrder: number;
  isAccessibleSeating: boolean;
  availableCapacity: number;
}

interface FixtureOption {
  id: string;
  slug: string;
  title: string;
  competitionName: string;
  kickoffAt: string;
  kickoffConfirmed: boolean;
  venueName: string;
  categories: CategoryOption[];
}

export function TicketingClient({
  fixtures,
  initialFixtureSlug,
}: {
  fixtures: FixtureOption[];
  initialFixtureSlug?: string;
}) {
  const [activeTab, setActiveTab] = useState<'purchase' | 'transfer'>('purchase');
  const [selectedFixtureId, setSelectedFixtureId] = useState<string>(
    fixtures.find((f) => f.slug === initialFixtureSlug)?.id || fixtures[0]?.id || ''
  );
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [buyerName, setBuyerName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [pendingTx, setPendingTx] = useState<{
    txId: string;
    reference: string;
    checkoutRequestId: string;
    orderNumber: string;
    totalKesCents: number;
    environment: string;
    status: string;
  } | null>(null);

  const [issuedTickets, setIssuedTickets] = useState<
    Array<{
      id: string;
      ticketCode: string;
      signedToken: string;
      holderName: string;
      categoryName: string;
      status: string;
      qrDataUrl: string;
    }>
  >([]);

  // Transfer state
  const [transferCode, setTransferCode] = useState('');
  const [transferOwnerEmail, setTransferOwnerEmail] = useState('');
  const [transferRecipientName, setTransferRecipientName] = useState('');
  const [transferRecipientEmail, setTransferRecipientEmail] = useState('');
  const [transferRecipientPhone, setTransferRecipientPhone] = useState('');
  const [transferResult, setTransferResult] = useState<{
    type: 'success' | 'error';
    text: string;
    newTicketCode?: string;
  } | null>(null);

  const currentFixture = fixtures.find((f) => f.id === selectedFixtureId) || fixtures[0];

  const totalOrderCents = currentFixture
    ? currentFixture.categories.reduce((sum, cat) => {
        const qty = quantities[cat.id] || 0;
        return sum + cat.priceKesCents * qty;
      }, 0)
    : 0;

  // Poll server payment status when awaiting confirmation
  useEffect(() => {
    if (!pendingTx || pendingTx.status !== 'PENDING') return;

    const timer = setInterval(async () => {
      try {
        const res = await fetch(`/api/payments/${pendingTx.txId}/status`, { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (data.transaction.status !== 'PENDING') {
          setPendingTx((prev) =>
            prev ? { ...prev, status: data.transaction.status } : null
          );
          if (data.issuedTickets) {
            setIssuedTickets(data.issuedTickets);
          }
        }
      } catch {
        // retry on next interval
      }
    }, 3000);

    return () => clearInterval(timer);
  }, [pendingTx]);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!currentFixture) return;
    const selectedItems = Object.entries(quantities)
      .filter(([, q]) => q > 0)
      .map(([categoryId, quantity]) => ({ categoryId, quantity }));

    if (selectedItems.length === 0) {
      setErrorMsg('Please select at least 1 ticket quantity.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/tickets/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fixtureId: currentFixture.id,
          buyerName,
          buyerEmail,
          buyerPhone,
          items: selectedItems,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Could not create ticket order.');
      } else {
        setPendingTx({
          txId: data.payment.id,
          reference: data.payment.reference,
          checkoutRequestId: data.payment.checkoutRequestId,
          orderNumber: data.order.orderNumber,
          totalKesCents: data.order.totalKesCents,
          environment: data.payment.environment,
          status: data.payment.status,
        });
      }
    } catch {
      setErrorMsg('Network error while creating ticket order.');
    } finally {
      setSubmitting(false);
    }
  };

  // Sandbox Webhook Callback Trigger (dispatches real Daraja callback structure to /api/payments/mpesa/callback)
  const triggerSandboxDarajaWebhook = async (resultCode: number) => {
    if (!pendingTx) return;
    await fetch('/api/payments/mpesa/callback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        Body: {
          stkCallback: {
            MerchantRequestID: `MR-${pendingTx.reference}`,
            CheckoutRequestID: pendingTx.checkoutRequestId,
            ResultCode: resultCode,
            ResultDesc:
              resultCode === 0
                ? 'The service request is processed successfully.'
                : 'Request cancelled by user',
            CallbackMetadata:
              resultCode === 0
                ? {
                    Item: [
                      { Name: 'Amount', Value: Math.trunc(pendingTx.totalKesCents / 100) },
                      {
                        Name: 'MpesaReceiptNumber',
                        Value: `SANDBOX${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
                      },
                    ],
                  }
                : undefined,
          },
        },
      }),
    });

    const statusRes = await fetch(`/api/payments/${pendingTx.txId}/status`, { cache: 'no-store' });
    if (statusRes.ok) {
      const statusData = await statusRes.json();
      setPendingTx((prev) =>
        prev ? { ...prev, status: statusData.transaction.status } : null
      );
      if (statusData.issuedTickets) {
        setIssuedTickets(statusData.issuedTickets);
      }
    }
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTransferResult(null);
    try {
      const res = await fetch('/api/tickets/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketCode: transferCode.trim().toUpperCase(),
          currentOwnerEmail: transferOwnerEmail,
          recipientName: transferRecipientName,
          recipientEmail: transferRecipientEmail,
          recipientPhone: transferRecipientPhone || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setTransferResult({ type: 'error', text: data.error || 'Transfer failed.' });
      } else {
        setTransferResult({
          type: 'success',
          text: data.message,
          newTicketCode: data.newTicketCode,
        });
      }
    } catch {
      setTransferResult({ type: 'error', text: 'Network error during ticket transfer.' });
    }
  };

  return (
    <div>
      {/* Mode Switcher */}
      <div className="flex items-center gap-3 mb-8">
        <button
          type="button"
          onClick={() => setActiveTab('purchase')}
          className={`px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
            activeTab === 'purchase'
              ? 'bg-club-primary text-white shadow'
              : 'bg-white text-slate-700 border border-slate-300'
          }`}
        >
          1. Purchase Match Tickets
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('transfer')}
          className={`px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
            activeTab === 'transfer'
              ? 'bg-club-primary text-white shadow'
              : 'bg-white text-slate-700 border border-slate-300'
          }`}
        >
          2. Transfer Ticket &amp; Rotate QR
        </button>
      </div>

      {activeTab === 'purchase' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Fixture & Category Selection + Buyer Form */}
          <div className="lg:col-span-7 space-y-6">
            <form
              onSubmit={handleCreateOrder}
              className="rounded-2xl bg-white border border-slate-200 p-6 md:p-8 shadow-sm space-y-6"
            >
              {/* Step 1: Select Fixture */}
              <div>
                <label
                  htmlFor="fixture-select"
                  className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-2"
                >
                  Step 1 — Select Official Home Fixture
                </label>
                <select
                  id="fixture-select"
                  value={selectedFixtureId}
                  onChange={(e) => {
                    setSelectedFixtureId(e.target.value);
                    setQuantities({});
                  }}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-900"
                >
                  {fixtures.map((fix) => (
                    <option key={fix.id} value={fix.id}>
                      {fix.title} — {new Date(fix.kickoffAt).toLocaleDateString('en-KE')} ({fix.venueName})
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 2-3: Ticket Categories & Quantities */}
              <div>
                <span className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-3">
                  Step 2 — Select Ticket Category &amp; Quantity
                </span>
                <div className="space-y-3">
                  {currentFixture?.categories.map((cat) => {
                    const qty = quantities[cat.id] || 0;
                    return (
                      <div
                        key={cat.id}
                        className="rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/60"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-display font-bold text-base text-slate-900">
                              {cat.nameEn}
                            </span>
                            {cat.isAccessibleSeating && (
                              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                                Accessible
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 mt-0.5">{cat.descriptionEn}</p>
                          <p className="text-[11px] text-slate-500 mt-1">
                            Remaining Capacity: <strong>{cat.availableCapacity}</strong> • Max per order: {cat.maxPerOrder}
                          </p>
                        </div>

                        <div className="flex items-center gap-4">
                          <span className="font-mono font-extrabold text-base text-club-primary">
                            {formatKes(cat.priceKesCents)}
                          </span>
                          <select
                            aria-label={`Quantity for ${cat.nameEn}`}
                            value={qty}
                            onChange={(e) =>
                              setQuantities((prev) => ({
                                ...prev,
                                [cat.id]: parseInt(e.target.value, 10),
                              }))
                            }
                            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold"
                          >
                            {Array.from(
                              { length: Math.min(cat.maxPerOrder, cat.availableCapacity) + 1 },
                              (_, i) => i
                            ).map((num) => (
                              <option key={num} value={num}>
                                {num}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Step 5: Contact & M-Pesa Phone Details */}
              <div className="pt-4 border-t border-slate-200 space-y-4">
                <span className="block text-xs font-extrabold uppercase tracking-wider text-slate-700">
                  Step 3 — Supporter Contact &amp; M-Pesa Details
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="buyer-name"
                      className="block text-xs font-semibold text-slate-700 mb-1"
                    >
                      Full Name (Printed on Ticket)
                    </label>
                    <input
                      id="buyer-name"
                      type="text"
                      required
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                      placeholder="e.g. John Kariuki"
                      className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="buyer-email"
                      className="block text-xs font-semibold text-slate-700 mb-1"
                    >
                      Email Address (For Ticket Delivery &amp; Transfer Verification)
                    </label>
                    <input
                      id="buyer-email"
                      type="email"
                      required
                      value={buyerEmail}
                      onChange={(e) => setBuyerEmail(e.target.value)}
                      placeholder="supporter@example.com"
                      className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="buyer-phone"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    Safaricom M-Pesa Phone Number
                  </label>
                  <input
                    id="buyer-phone"
                    type="tel"
                    required
                    value={buyerPhone}
                    onChange={(e) => setBuyerPhone(e.target.value)}
                    placeholder="0712345678 or 254712345678"
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm font-mono"
                  />
                </div>
              </div>

              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs font-bold text-red-800">
                  {errorMsg}
                </div>
              )}

              <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs text-slate-500 block">Server-Validated Total</span>
                  <span className="font-mono font-black text-2xl text-slate-900">
                    {formatKes(totalOrderCents)}
                  </span>
                </div>
                <button
                  type="submit"
                  disabled={submitting || totalOrderCents === 0}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-club-primary hover:bg-red-600 disabled:opacity-50 text-white text-sm font-bold shadow-lg transition"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>
                    {submitting
                      ? 'Reserving Capacity & Initiating STK Push...'
                      : 'Reserve Capacity & Pay via M-Pesa'}
                  </span>
                </button>
              </div>
            </form>
          </div>

          {/* Right: Live Order & QR Ticket Status Panel */}
          <div className="lg:col-span-5 space-y-6">
            {pendingTx ? (
              <div className="rounded-2xl bg-slate-900 text-white p-6 md:p-8 border border-slate-800 space-y-6 shadow-xl">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-club-accent font-bold">
                      Order #{pendingTx.orderNumber}
                    </span>
                    <h2 className="font-display font-bold text-xl text-white">
                      M-Pesa Daraja Verification
                    </h2>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase ${
                      pendingTx.status === 'SUCCESS'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : pendingTx.status === 'PENDING'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-red-500/20 text-red-300 border border-red-500/40'
                    }`}
                  >
                    {pendingTx.status}
                  </span>
                </div>

                {pendingTx.status === 'PENDING' && (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-200">
                      <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 animate-spin" />
                      <div>
                        <p className="font-bold text-white">
                          Payment Awaiting Server Confirmation ({formatKes(pendingTx.totalKesCents)})
                        </p>
                        <p className="mt-1 text-slate-300">
                          Tickets are issued strictly after the server verifies the M-Pesa Daraja callback for CheckoutRequestID{' '}
                          <code className="text-amber-300">{pendingTx.checkoutRequestId}</code>.
                        </p>
                      </div>
                    </div>

                    {/* Clearly Identified Sandbox Webhook Simulator */}
                    {pendingTx.environment === 'sandbox' && (
                      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-400/30 space-y-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                          <AlertTriangle className="w-4 h-4" />
                          <span>Sandbox Development Mode — Callback Webhook Tester</span>
                        </div>
                        <p className="text-[11px] text-slate-300">
                          Simulate Safaricom Daraja’s HTTPS callback to{' '}
                          <code>/api/payments/mpesa/callback</code> to test server-side ticket issuance or cancellation:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => triggerSandboxDarajaWebhook(0)}
                            className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition"
                          >
                            Confirm Sandbox Callback (ResultCode 0)
                          </button>
                          <button
                            type="button"
                            onClick={() => triggerSandboxDarajaWebhook(1032)}
                            className="px-3.5 py-2 rounded-lg bg-red-700 hover:bg-red-600 text-white text-xs font-bold transition"
                          >
                            Simulate User Cancel (1032)
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {pendingTx.status === 'SUCCESS' && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center gap-3 text-xs text-emerald-200">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      <span>
                        Payment confirmed on server! Below are your cryptographically signed QR match tickets (zero PII encoded in QR).
                      </span>
                    </div>

                    {issuedTickets.map((tkt) => (
                      <div
                        key={tkt.id}
                        className="rounded-xl bg-white text-slate-900 p-5 border-2 border-club-accent shadow-lg space-y-3"
                      >
                        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                          <div>
                            <span className="text-[10px] font-extrabold uppercase text-club-primary">
                              {tkt.categoryName}
                            </span>
                            <h3 className="font-display font-bold text-base text-slate-900">
                              {tkt.holderName}
                            </h3>
                          </div>
                          <span className="px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-xs font-mono font-bold">
                            {tkt.status}
                          </span>
                        </div>

                        <div className="flex flex-col items-center justify-center py-2">
                          <img
                            src={tkt.qrDataUrl}
                            alt={`QR Ticket ${tkt.ticketCode}`}
                            className="w-44 h-44 border border-slate-200 rounded-lg p-1"
                          />
                          <span className="font-mono font-black text-sm text-slate-900 mt-2">
                            {tkt.ticketCode}
                          </span>
                          <span className="text-[10px] text-slate-500 mt-0.5">
                            Present QR at Moi Stadium Gate for Atomic Scan
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {(pendingTx.status === 'FAILED' || pendingTx.status === 'CANCELLED') && (
                  <div className="p-4 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center gap-3 text-xs text-red-200">
                    <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                    <span>
                      Payment was {pendingTx.status.toLowerCase()}. Reserved ticket capacity has been released back to the pool.
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-2xl bg-slate-900 text-white p-6 md:p-8 border border-slate-800 space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-club-accent">
                  <ShieldCheck className="w-4 h-4" />
                  <span>3K FC Secure QR Ticketing Architecture</span>
                </div>
                <h2 className="editorial-headline font-bold text-2xl text-white">
                  Cryptographically Signed Matchday Entry
                </h2>
                <ul className="space-y-2.5 text-xs text-slate-300 leading-relaxed">
                  <li>• <strong>Server-Side Hold:</strong> 15-minute transactional capacity reservation prevents overselling.</li>
                  <li>• <strong>Verified M-Pesa Daraja Callback:</strong> Tickets are never issued from browser redirects—only after server callback verification.</li>
                  <li>• <strong>Zero PII in QR:</strong> QR codes contain only an HMAC-SHA256 signed ticket token and nonce.</li>
                  <li>• <strong>Atomic Gate Redemption:</strong> Prevents duplicate or simultaneous entry across multiple stadium gates.</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: TICKET TRANSFER WORKFLOW */}
      {activeTab === 'transfer' && (
        <div className="max-w-2xl rounded-2xl bg-white border border-slate-200 p-6 md:p-8 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-club-primary mb-2">
            <RefreshCw className="w-4 h-4" />
            <span>Credential Rotation &amp; Auditable Transfer</span>
          </div>
          <h2 className="editorial-headline font-bold text-2xl text-slate-900">
            Transfer an Eligible Ticket to Another Supporter
          </h2>
          <p className="text-xs text-slate-600 mt-1 mb-6">
            Transferring a ticket immediately invalidates the previous ticket code and rotates the cryptographic QR signature so any earlier screenshot cannot be used at the gate.
          </p>

          <form onSubmit={handleTransferSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Current Ticket Code
                </label>
                <input
                  type="text"
                  required
                  value={transferCode}
                  onChange={(e) => setTransferCode(e.target.value)}
                  placeholder="3K-TKT-XXXXXXXX"
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm font-mono uppercase"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Current Owner Email (Order Email)
                </label>
                <input
                  type="email"
                  required
                  value={transferOwnerEmail}
                  onChange={(e) => setTransferOwnerEmail(e.target.value)}
                  placeholder="owner@example.com"
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  New Recipient Full Name
                </label>
                <input
                  type="text"
                  required
                  value={transferRecipientName}
                  onChange={(e) => setTransferRecipientName(e.target.value)}
                  placeholder="Recipient Full Name"
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  New Recipient Email
                </label>
                <input
                  type="email"
                  required
                  value={transferRecipientEmail}
                  onChange={(e) => setTransferRecipientEmail(e.target.value)}
                  placeholder="recipient@example.com"
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                New Recipient Phone (Optional)
              </label>
              <input
                type="tel"
                value={transferRecipientPhone}
                onChange={(e) => setTransferRecipientPhone(e.target.value)}
                placeholder="07XXXXXXXX"
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm"
              />
            </div>

            {transferResult && (
              <div
                className={`p-4 rounded-xl text-xs font-bold ${
                  transferResult.type === 'success'
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                <p>{transferResult.text}</p>
                {transferResult.newTicketCode && (
                  <p className="mt-2 font-mono text-sm">
                    New Rotated Ticket Code: <strong>{transferResult.newTicketCode}</strong>
                  </p>
                )}
              </div>
            )}

            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-club-primary hover:bg-red-600 text-white text-xs font-bold uppercase tracking-wider transition"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Execute Verified Ticket Transfer</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
