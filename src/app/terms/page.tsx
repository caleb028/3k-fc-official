import React from 'react';

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 md:py-14 space-y-6 text-slate-800 text-sm leading-relaxed">
      <div className="border-b-2 border-slate-900 pb-4">
        <h1 className="editorial-headline font-black text-3xl md:text-4xl text-slate-900">
          Terms of Use
        </h1>
        <p className="text-xs text-slate-500 mt-1">Official Digital Platform Governance • 3K FC Embu</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 space-y-5 shadow-sm">
        <section className="space-y-2">
          <h2 className="font-display font-bold text-lg text-slate-900">1. Acceptance of Terms</h2>
          <p>
            By accessing or using the official digital platform of 3K FC (website, ticketing portal, and merchandise store), you agree to abide by these terms, applicable laws of Kenya, and Football Kenya Federation (FKF) spectator regulations.
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="font-display font-bold text-lg text-slate-900">2. Intellectual Property &amp; Club Trademarks</h2>
          <p>
            The 3K FC name, official crest, wordmark, photographic assets, and editorial articles are protected intellectual property of 3K Football Club. Unauthorized reproduction or commercial use is strictly prohibited.
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="font-display font-bold text-lg text-slate-900">3. Supporter Account Responsibility</h2>
          <p>
            You are responsible for maintaining the confidentiality of your account credentials. Any activity conducted under your fan account remains your responsibility.
          </p>
        </section>
      </div>
    </div>
  );
}
