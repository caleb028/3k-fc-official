'use client';

import React, { useState } from 'react';
import {
  HeartHandshake,
  ShieldCheck,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { formatKes, kesToCents } from '@/lib/money';

interface CampaignData {
  id: string;
  slug: string;
  titleEn: string;
  purposeEn: string;
  disclaimerEn: string;
  targetKesCents: number | null;
  confirmedTotalKesCents: number;
  confirmedDonorCount: number;
  pendingCount: number;
}

export function DonationClient({
  campaign,
  publicRecognizedDonors,
}: {
  campaign: CampaignData;
  publicRecognizedDonors: Array<{
    id: string;
    donorName: string;
    amountKesCents: number;
    supporterMessage?: string | null;
    confirmedAt?: string | null;
  }>;
}) {
  const presetWholeAmounts = [200, 500, 1000, 2500, 5000, 10000];
  const [selectedAmountWhole, setSelectedAmountWhole] = useState<number>(1000);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [donorPhone, setDonorPhone] = useState('');
  const [country, setCountry] = useState('Kenya');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [publicConsent, setPublicConsent] = useState(false);
  const [supporterMessage, setSupporterMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [pendingDonation, setPendingDonation] = useState<{
    donationId: string;
    txId: string;
    checkoutRequestId: string;
    amountKesCents: number;
    environment: string;
    status: string;
    receiptNumber?: string;
  } | null>(null);

  const [confirmedTotalCents, setConfirmedTotalCents] = useState(
    campaign.confirmedTotalKesCents
  );
  const [confirmedCount, setConfirmedCount] = useState(campaign.confirmedDonorCount);

  const effectiveWholeKes = customAmount.trim()
    ? parseInt(customAmount.trim(), 10) || 0
    : selectedAmountWhole;

  const handleDonate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (effectiveWholeKes < 50) {
      setErrorMsg('Minimum contribution is KES 50.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/donations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: campaign.id,
          donorName: isAnonymous ? 'Anonymous Supporter' : donorName,
          donorEmail,
          donorPhone,
          country,
          amountWholeKes: effectiveWholeKes,
          paymentMethod: 'MPESA_DARAJA',
          isAnonymous,
          publicRecognitionConsent: isAnonymous ? false : publicConsent,
          supporterMessage,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Could not initiate contribution.');
      } else {
        setPendingDonation({
          donationId: data.donation.id,
          txId: data.payment.id,
          checkoutRequestId: data.payment.checkoutRequestId,
          amountKesCents: data.donation.amountKesCents,
          environment: data.payment.environment,
          status: data.payment.status,
        });
      }
    } catch {
      setErrorMsg('Network error while initiating donation.');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmSandboxDonation = async () => {
    if (!pendingDonation) return;
    await fetch('/api/payments/mpesa/callback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        Body: {
          stkCallback: {
            MerchantRequestID: `MR-${pendingDonation.donationId}`,
            CheckoutRequestID: pendingDonation.checkoutRequestId,
            ResultCode: 0,
            ResultDesc: 'The service request is processed successfully.',
            CallbackMetadata: {
              Item: [
                { Name: 'Amount', Value: Math.trunc(pendingDonation.amountKesCents / 100) },
                { Name: 'MpesaReceiptNumber', Value: '3KDON77412' },
              ],
            },
          },
        },
      }),
    });

    const stRes = await fetch(`/api/payments/${pendingDonation.txId}/status`, {
      cache: 'no-store',
    });
    if (stRes.ok) {
      const stData = await stRes.json();
      setPendingDonation((prev) =>
        prev
          ? {
              ...prev,
              status: stData.transaction.status,
              receiptNumber: stData.donationReceipt?.receiptNumber,
            }
          : null
      );
      if (stData.transaction.status === 'SUCCESS') {
        setConfirmedTotalCents((c) => c + pendingDonation.amountKesCents);
        setConfirmedCount((c) => c + 1);
      }
    }
  };

  const progressPct =
    campaign.targetKesCents && campaign.targetKesCents > 0
      ? Math.min(100, Math.round((confirmedTotalCents / campaign.targetKesCents) * 100))
      : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Left 7 Cols: Donation Form */}
      <div className="lg:col-span-7 space-y-6">
        <form
          onSubmit={handleDonate}
          className="rounded-2xl bg-white border border-slate-200 p-6 md:p-8 shadow-sm space-y-6"
        >
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-club-primary">
              Official Club Support Campaign
            </span>
            <h2 className="editorial-headline font-bold text-2xl text-slate-900 mt-1">
              {campaign.titleEn}
            </h2>
            <p className="text-xs text-slate-600 mt-1">{campaign.purposeEn}</p>
          </div>

          {/* Preset Amounts in KES */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Select Contribution Amount (KES)
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {presetWholeAmounts.map((amt) => {
                const active = !customAmount.trim() && selectedAmountWhole === amt;
                return (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => {
                      setSelectedAmountWhole(amt);
                      setCustomAmount('');
                    }}
                    className={`py-2.5 px-3 rounded-xl font-mono font-bold text-sm border transition ${
                      active
                        ? 'bg-club-primary text-white border-club-primary shadow'
                        : 'bg-slate-50 text-slate-800 border-slate-300 hover:border-slate-900'
                    }`}
                  >
                    KES {amt.toLocaleString('en-KE')}
                  </button>
                );
              })}
            </div>

            <div className="mt-3">
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Or Enter Custom Amount (Whole KES)
              </label>
              <input
                type="number"
                min={50}
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="Custom amount in KES (e.g. 1500)"
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm font-mono"
              />
            </div>
          </div>

          {/* Donor Details & Privacy Controls */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="w-4 h-4 text-club-primary"
              />
              <span>Make this a Private / Anonymous Contribution</span>
            </label>

            {!isAnonymous && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Supporter Name
                  </label>
                  <input
                    type="text"
                    required={!isAnonymous}
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email (For Official Receipt)
                  </label>
                  <input
                    type="email"
                    value={donorEmail}
                    onChange={(e) => setDonorEmail(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  M-Pesa Phone Number
                </label>
                <input
                  type="tel"
                  required
                  value={donorPhone}
                  onChange={(e) => setDonorPhone(e.target.value)}
                  placeholder="07XXXXXXXX"
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Country / Location
                </label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm"
                />
              </div>
            </div>

            {!isAnonymous && (
              <label className="flex items-start gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={publicConsent}
                  onChange={(e) => setPublicConsent(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-club-primary"
                />
                <span>
                  I consent to having my name and supporter message publicly recognized on the 3K FC Supporters Honour Wall once my payment is confirmed.
                </span>
              </label>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Message of Support to the Team (Optional)
              </label>
              <input
                type="text"
                value={supporterMessage}
                onChange={(e) => setSupporterMessage(e.target.value)}
                placeholder="All the best to 3K FC in the FKF Premier League!"
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm"
              />
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs font-bold text-red-800">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-club-primary hover:bg-red-600 text-white text-sm font-bold shadow-lg transition"
          >
            <Smartphone className="w-4 h-4" />
            <span>
              {submitting
                ? 'Initiating Contribution...'
                : `Contribute ${
                    effectiveWholeKes >= 50 ? formatKes(kesToCents(effectiveWholeKes)) : 'Now'
                  } via M-Pesa`}
            </span>
          </button>

          <p className="text-[11px] text-slate-500 leading-relaxed">
            <strong>Disclaimer:</strong> {campaign.disclaimerEn}
          </p>
        </form>
      </div>

      {/* Right 5 Cols: Financial Transparency & Verified Running Total */}
      <div className="lg:col-span-5 space-y-6">
        <div className="rounded-2xl bg-slate-900 text-white p-6 md:p-8 border border-slate-800 space-y-5 shadow-xl">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-club-accent">
            <ShieldCheck className="w-4 h-4" />
            <span>Financial Transparency &amp; Audit Policy</span>
          </div>

          <div>
            <span className="text-xs text-slate-400 block">
              Verified Confirmed Contributions (Excludes Pending/Failed Payments)
            </span>
            <div className="font-mono font-black text-3xl text-emerald-400 mt-1">
              {formatKes(confirmedTotalCents)}
            </div>
            {campaign.targetKesCents && (
              <div className="mt-3 space-y-1.5">
                <div className="flex justify-between text-xs text-slate-300">
                  <span>Campaign Target: {formatKes(campaign.targetKesCents)}</span>
                  <span>{progressPct}%</span>
                </div>
                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs bg-white/5 p-4 rounded-xl border border-white/10">
            <div>
              <span className="text-slate-400 block">Confirmed Donors</span>
              <strong className="font-mono text-lg text-white">{confirmedCount}</strong>
            </div>
            <div>
              <span className="text-slate-400 block">Awaiting Callback</span>
              <strong className="font-mono text-lg text-amber-300">
                {campaign.pendingCount} pending
              </strong>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Running totals include only server-confirmed payments. Refunds or charge reversals automatically deduct from the confirmed campaign total. Anonymous contributions are counted in the financial total while keeping donor identity private.
          </p>

          {pendingDonation && (
            <div className="p-4 rounded-xl bg-white/10 border border-white/15 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold">Contribution Status:</span>
                <span className="px-2 py-0.5 rounded bg-amber-500 text-black font-extrabold">
                  {pendingDonation.status}
                </span>
              </div>

              {pendingDonation.status === 'PENDING' &&
                pendingDonation.environment === 'sandbox' && (
                  <div className="space-y-2 pt-2 border-t border-white/10">
                    <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Sandbox Callback Verification</span>
                    </div>
                    <button
                      type="button"
                      onClick={confirmSandboxDonation}
                      className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                    >
                      Verify Sandbox Donation &amp; Issue Receipt
                    </button>
                  </div>
                )}

              {pendingDonation.status === 'SUCCESS' && (
                <div className="p-3 rounded-lg bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-white">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Official Donation Receipt Issued</span>
                  </div>
                  <p className="font-mono">
                    Receipt #: <strong>{pendingDonation.receiptNumber}</strong>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Consent-Verified Public Donor Recognition Wall */}
        <div className="rounded-2xl bg-white border border-slate-200 p-6 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-club-primary">
            <HeartHandshake className="w-4 h-4" />
            <span>Supporters Honour Wall (Consent-Verified)</span>
          </div>
          {publicRecognizedDonors.length > 0 ? (
            <ul className="divide-y divide-slate-100 text-xs">
              {publicRecognizedDonors.map((d) => (
                <li key={d.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <strong className="text-slate-900">{d.donorName}</strong>
                    {d.supporterMessage && (
                      <p className="text-slate-500 italic">&ldquo;{d.supporterMessage}&rdquo;</p>
                    )}
                  </div>
                  <span className="font-mono font-bold text-emerald-700">
                    {formatKes(d.amountKesCents)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-500">
              Verified supporters who opt into public recognition will appear here after payment confirmation.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
