import React from 'react';

export default function RefundPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 md:py-14 space-y-6 text-slate-800 text-sm leading-relaxed">
      <div className="border-b-2 border-slate-900 pb-4">
        <h1 className="editorial-headline font-black text-3xl md:text-4xl text-slate-900">
          Refund &amp; Cancellation Policy
        </h1>
        <p className="text-xs text-slate-500 mt-1">Official Policy for Match Tickets &amp; Merchandise</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 space-y-5 shadow-sm">
        <section className="space-y-2">
          <h2 className="font-display font-bold text-lg text-slate-900">1. Match Postponement or Cancellation</h2>
          <p>
            In the event of a fixture being postponed, rescheduled, or cancelled by the Football Kenya Federation, tickets remain valid for the rescheduled fixture. If a match is cancelled entirely, supporters are entitled to an approved refund or credit voucher processed through the finance department.
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="font-display font-bold text-lg text-slate-900">2. Merchandise Returns &amp; Exchanges</h2>
          <p>
            Unworn merchandise in its original condition with club tags intact may be exchanged for a different size within 14 days of purchase at the Embu Town Club Desk or returned by courier. Customized items with player names or numbers cannot be returned unless defective.
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="font-display font-bold text-lg text-slate-900">3. Loyalty Point Adjustments</h2>
          <p>
            In accordance with our auditable points engine, any loyalty points awarded for a transaction are automatically reversed upon approval of a refund.
          </p>
        </section>
      </div>
    </div>
  );
}
