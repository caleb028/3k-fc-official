import React from 'react';

export default function TicketTermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 md:py-14 space-y-6 text-slate-800 text-sm leading-relaxed">
      <div className="border-b-2 border-slate-900 pb-4">
        <h1 className="editorial-headline font-black text-3xl md:text-4xl text-slate-900">
          Ticketing &amp; Stadium Gate Entry Terms
        </h1>
        <p className="text-xs text-slate-500 mt-1">Matchday Admission Regulations • Moi Stadium, Embu</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 space-y-5 shadow-sm">
        <section className="space-y-2">
          <h2 className="font-display font-bold text-lg text-slate-900">1. Valid Matchday Admission</h2>
          <p>
            Admission to 3K FC home matches at Moi Stadium or designated alternative venues requires a valid, cryptographically signed QR ticket issued upon confirmed M-Pesa payment. Each ticket is single-use and redeemed atomically at turnstiles.
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="font-display font-bold text-lg text-slate-900">2. Anti-Touting &amp; Duplication Prevention</h2>
          <p>
            Presenting duplicate, previously redeemed, or altered ticket barcodes will result in refusal of entry. Attempting to scan a ticket across two devices simultaneously will be automatically rejected by atomic database locks.
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="font-display font-bold text-lg text-slate-900">3. Verified Ticket Transfer</h2>
          <p>
            Ticket holders may transfer tickets to friends or family using the official <strong>Ticket Transfer</strong> workflow. Upon transfer, the previous QR token is instantly invalidated and a fresh credential is generated for the recipient.
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="font-display font-bold text-lg text-slate-900">4. Stadium Ground Regulations</h2>
          <p>
            Supporters must comply with stadium steward instructions. Prohibited items, pitch invasions, or violent conduct will result in immediate ejection and referral to law enforcement authorities.
          </p>
        </section>
      </div>
    </div>
  );
}
