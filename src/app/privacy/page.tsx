import React from 'react';
import { ShieldCheck } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 md:py-14 space-y-6 text-slate-800 text-sm leading-relaxed">
      <div className="border-b-2 border-slate-900 pb-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700">
          <ShieldCheck className="w-4 h-4" />
          <span>Statutory Data Protection Statement</span>
        </div>
        <h1 className="editorial-headline font-black text-3xl md:text-4xl text-slate-900 mt-1">
          Privacy Policy
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Compliance with the Kenya Data Protection Act, 2019 • Effective Season 2026/27
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 space-y-6 shadow-sm">
        <section className="space-y-2">
          <h2 className="font-display font-bold text-lg text-slate-900">1. Data Controller</h2>
          <p>
            <strong>3K Football Club (&ldquo;3K FC&rdquo;)</strong>, headquartered at Moi Stadium Complex, Embu Town, Embu County, Kenya, acts as the Data Controller responsible for personal data processed through this official website and fan platform.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display font-bold text-lg text-slate-900">2. Information We Collect</h2>
          <p>We collect only necessary information to provide club media, matchday ticketing, merchandise fulfillment, and supporter memberships:</p>
          <ul className="list-disc pl-5 space-y-1 text-xs">
            <li><strong>Supporter Account Details:</strong> Name, email address, password hash, preferred language.</li>
            <li><strong>Ticketing &amp; Orders:</strong> Contact name, phone number, M-Pesa transaction identifiers, delivery address.</li>
            <li><strong>Technical Telemetry:</strong> Anonymized session cookies and rate-limiting IP hashes.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-display font-bold text-lg text-slate-900">3. QR Code Privacy Guard</h2>
          <p>
            In strict compliance with our platform architecture, <strong>no sensitive personal information (PII) is ever encoded inside match ticket QR codes</strong>. QR codes contain solely an HMAC-SHA256 cryptographically signed ticket identifier verified at stadium turnstiles.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display font-bold text-lg text-slate-900">4. M-Pesa Payment Security</h2>
          <p>
            Payment transactions are processed through Safaricom Daraja API endpoints. 3K FC never stores payment PINs or full unmasked phone numbers in publicly exposed endpoints.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display font-bold text-lg text-slate-900">5. Supporter Rights</h2>
          <p>
            Under the Kenya Data Protection Act (2019), supporters possess the right to access, rectify, or request deletion of their account records by contacting <code>privacy@3kfc.co.ke</code>.
          </p>
        </section>
      </div>
    </div>
  );
}
