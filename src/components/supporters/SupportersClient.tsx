'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  Smartphone,
  ShieldCheck,
  Award,
  AlertTriangle,
} from 'lucide-react';
import { formatKes } from '@/lib/money';

interface PlanItem {
  id: string;
  slug: string;
  nameEn: string;
  billingCycle: string;
  durationDays: number;
  priceKesCents: number;
  merchDiscountPercent: number;
  welcomeLoyaltyPoints: number;
  benefits: string[];
}

interface RewardItem {
  id: string;
  code: string;
  titleEn: string;
  descriptionEn: string;
  pointsCost: number;
}

export function SupportersClient({
  plans,
  rewards,
}: {
  plans: PlanItem[];
  rewards: RewardItem[];
}) {
  const [selectedPlanId, setSelectedPlanId] = useState(plans[1]?.id || plans[0]?.id || '');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [pendingSub, setPendingSub] = useState<{
    membershipNumber: string;
    planName: string;
    txId: string;
    checkoutRequestId: string;
    amountKesCents: number;
    environment: string;
    status: string;
    card?: {
      cardIdentifier: string;
      tierLabel: string;
      holderDisplayName: string;
      validityStatus: string;
    } | null;
  } | null>(null);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/memberships/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: selectedPlanId,
          firstName,
          lastName,
          email,
          phone,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Could not initiate membership.');
      } else {
        setPendingSub({
          membershipNumber: data.membership.membershipNumber,
          planName: data.membership.planName,
          txId: data.payment.id,
          checkoutRequestId: data.payment.checkoutRequestId,
          amountKesCents: data.payment.amountKesCents,
          environment: data.payment.environment,
          status: data.payment.status,
        });
      }
    } catch {
      setErrorMsg('Network error while submitting membership registration.');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmSandboxMembershipPayment = async () => {
    if (!pendingSub) return;
    await fetch('/api/payments/mpesa/callback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        Body: {
          stkCallback: {
            MerchantRequestID: `MR-${pendingSub.membershipNumber}`,
            CheckoutRequestID: pendingSub.checkoutRequestId,
            ResultCode: 0,
            ResultDesc: 'The service request is processed successfully.',
            CallbackMetadata: {
              Item: [
                { Name: 'Amount', Value: Math.trunc(pendingSub.amountKesCents / 100) },
                { Name: 'MpesaReceiptNumber', Value: '3KMEM99102' },
              ],
            },
          },
        },
      }),
    });

    const res = await fetch(`/api/payments/${pendingSub.txId}/status`, { cache: 'no-store' });
    if (res.ok) {
      const statusData = await res.json();
      setPendingSub((prev) =>
        prev
          ? {
              ...prev,
              status: statusData.transaction.status,
              card: statusData.membership?.card || null,
            }
          : null
      );
    }
  };

  return (
    <div className="space-y-12">
      {/* Plans & Application Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-6">
          <h2 className="editorial-headline font-bold text-2xl text-slate-900">
            Select Your Official 3K FC Membership Plan
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {plans.map((plan) => {
              const active = selectedPlanId === plan.id;
              return (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlanId(plan.id)}
                  className={`rounded-2xl p-6 border-2 cursor-pointer transition flex flex-col justify-between ${
                    active
                      ? 'border-club-primary bg-red-50/30 shadow-md'
                      : 'border-slate-200 bg-white hover:border-slate-400'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="px-2.5 py-0.5 rounded bg-slate-900 text-white font-bold uppercase">
                        {plan.billingCycle}
                      </span>
                      <span className="text-emerald-700 font-bold">
                        +{plan.welcomeLoyaltyPoints} Points
                      </span>
                    </div>
                    <h3 className="editorial-headline font-bold text-xl text-slate-900 mt-3">
                      {plan.nameEn}
                    </h3>
                    <p className="font-mono font-black text-2xl text-club-primary mt-1">
                      {formatKes(plan.priceKesCents)}
                    </p>
                    <ul className="mt-4 space-y-2 text-xs text-slate-700">
                      {plan.benefits.map((b, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedPlanId(plan.id)}
                    className={`mt-6 w-full py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider ${
                      active ? 'bg-club-primary text-white' : 'bg-slate-900 text-white'
                    }`}
                  >
                    {active ? 'Selected Plan' : 'Choose Plan'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Registration & Digital Membership Card Issuance */}
        <div className="lg:col-span-5 space-y-6">
          <form
            onSubmit={handleSubscribe}
            className="rounded-2xl bg-white border border-slate-200 p-6 md:p-8 shadow-sm space-y-4"
          >
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-club-primary">
              <Sparkles className="w-4 h-4" />
              <span>Instant Digital Membership Activation</span>
            </div>
            <h3 className="editorial-headline font-bold text-2xl text-slate-900">
              Activate via M-Pesa STK Push
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">First Name</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Last Name</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                M-Pesa Phone Number
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="07XXXXXXXX"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono"
              />
            </div>

            {errorMsg && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs font-bold text-red-800">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-club-primary hover:bg-red-600 text-white text-xs font-bold uppercase tracking-wider shadow transition"
            >
              <Smartphone className="w-4 h-4" />
              <span>
                {submitting ? 'Initiating Membership Payment...' : 'Pay & Activate Membership'}
              </span>
            </button>
          </form>

          {pendingSub && (
            <div className="rounded-2xl bg-slate-900 text-white p-6 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-club-accent">
                  {pendingSub.membershipNumber}
                </span>
                <span className="px-2.5 py-0.5 rounded bg-white/10 text-xs font-bold">
                  {pendingSub.status}
                </span>
              </div>

              {pendingSub.status === 'PENDING' && pendingSub.environment === 'sandbox' && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-400/30 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Sandbox Callback Verification</span>
                  </div>
                  <button
                    type="button"
                    onClick={confirmSandboxMembershipPayment}
                    className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                  >
                    Confirm Sandbox Membership Payment (ResultCode 0)
                  </button>
                </div>
              )}

              {pendingSub.status === 'SUCCESS' && pendingSub.card && (
                <div className="rounded-xl bg-gradient-to-br from-club-primary via-club-primaryDark to-black p-5 border-2 border-club-accent shadow-xl space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold uppercase tracking-widest text-club-accent">
                      3K FC Official Digital Membership Card
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500 text-black font-extrabold text-[10px]">
                      {pendingSub.card.validityStatus}
                    </span>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-300">{pendingSub.card.tierLabel}</div>
                    <div className="font-display font-black text-xl text-white">
                      {pendingSub.card.holderDisplayName}
                    </div>
                  </div>
                  <div className="pt-2 border-t border-white/15 flex items-center justify-between text-xs font-mono text-amber-300">
                    <span>ID: {pendingSub.card.cardIdentifier}</span>
                    <span>Embu • Home of Stars</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Auditable Loyalty Programme Section */}
      <section className="rounded-2xl bg-slate-900 text-white p-6 md:p-10 border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-club-accent">
              <Award className="w-4 h-4" />
              <span>Auditable Points Engine &amp; Immutable Ledger</span>
            </div>
            <h2 className="editorial-headline font-black text-2xl md:text-3xl text-white mt-1">
              3K FC Supporters Loyalty Programme
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Points are awarded strictly from server-verified events (confirmed gate scan attendance, paid merchandise orders, and membership activations) and automatically reversed on refunds.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-emerald-400 font-bold">
            <ShieldCheck className="w-5 h-5" />
            <span>Zero Unverified Frontend Point Grants</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {rewards.map((rw) => (
            <div
              key={rw.id}
              className="rounded-xl bg-white/5 border border-white/15 p-5 flex items-center justify-between gap-4"
            >
              <div>
                <span className="text-[10px] font-mono text-club-accent uppercase">
                  {rw.code}
                </span>
                <h3 className="font-display font-bold text-lg text-white">{rw.titleEn}</h3>
                <p className="text-xs text-slate-300 mt-1">{rw.descriptionEn}</p>
              </div>
              <div className="shrink-0 text-right">
                <span className="px-3 py-1.5 rounded-lg bg-club-accent text-black font-mono font-extrabold text-xs">
                  {rw.pointsCost} PTS
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
