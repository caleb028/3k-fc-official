import React from 'react';

export default function DeliveryPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 md:py-14 space-y-6 text-slate-800 text-sm leading-relaxed">
      <div className="border-b-2 border-slate-900 pb-4">
        <h1 className="editorial-headline font-black text-3xl md:text-4xl text-slate-900">
          Store Collection &amp; Delivery Policy
        </h1>
        <p className="text-xs text-slate-500 mt-1">Fulfillment Information for 3K FC Official Merchandise</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 space-y-5 shadow-sm">
        <section className="space-y-2">
          <h2 className="font-display font-bold text-lg text-slate-900">1. Free Collection in Embu Town</h2>
          <p>
            Supporters in Embu County may collect paid merchandise orders free of charge at the <strong>3K FC Official Club Desk — Moi Stadium Complex, Embu Town</strong>. Orders are prepared within 24 hours of confirmed M-Pesa payment.
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="font-display font-bold text-lg text-slate-900">2. Regional &amp; Nationwide Delivery</h2>
          <p>
            We deliver across Kenya via insured courier partners:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs">
            <li><strong>Embu County &amp; Mount Kenya Regional:</strong> KES 250 (1-2 business days).</li>
            <li><strong>Nairobi &amp; Nationwide Courier:</strong> KES 400 (2-3 business days).</li>
          </ul>
        </section>
        <section className="space-y-2">
          <h2 className="font-display font-bold text-lg text-slate-900">3. Order Tracking</h2>
          <p>
            Supporters can monitor the progress of their order from pending payment to dispatch directly within their <strong>Personal Fan Account</strong>.
          </p>
        </section>
      </div>
    </div>
  );
}
