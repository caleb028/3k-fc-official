'use client';

import React, { useState } from 'react';
import { Send } from 'lucide-react';

export function PartnerEnquiryForm() {
  const [organisation, setOrganisation] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [partnershipInterest, setPartnershipInterest] = useState('MAIN_PARTNERSHIP');
  const [budgetRange, setBudgetRange] = useState('');
  const [message, setMessage] = useState('');
  const [consentGranted, setConsentGranted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/sponsors/enquire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organisation,
          contactPerson,
          businessEmail,
          phone,
          partnershipInterest,
          budgetRange,
          message,
          consentGranted,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: 'error', text: data.error || 'Could not submit enquiry.' });
      } else {
        setFeedback({ type: 'success', text: data.message });
        setOrganisation('');
        setContactPerson('');
        setBusinessEmail('');
        setPhone('');
        setMessage('');
      }
    } catch {
      setFeedback({ type: 'error', text: 'Network error while submitting enquiry.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl bg-white border border-slate-200 p-6 md:p-8 shadow-sm space-y-4"
    >
      <h2 className="editorial-headline font-bold text-2xl text-slate-900">
        Commercial Partnership Enquiry Form
      </h2>
      <p className="text-xs text-slate-600">
        Partner with Embu County’s historic FKF Premier League club. Connect with our Commercial Directorate for measurable brand exposure across matchdays, kits, and digital channels.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Organisation Name</label>
          <input
            type="text"
            required
            value={organisation}
            onChange={(e) => setOrganisation(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Contact Person</label>
          <input
            type="text"
            required
            value={contactPerson}
            onChange={(e) => setContactPerson(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Business Email</label>
          <input
            type="email"
            required
            value={businessEmail}
            onChange={(e) => setBusinessEmail(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
          <input
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Partnership Interest
          </label>
          <select
            value={partnershipInterest}
            onChange={(e) => setPartnershipInterest(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm bg-white"
          >
            <option value="MAIN_PARTNERSHIP">Principal / Shirt Partnership</option>
            <option value="KIT_BRANDING">Technical Kit &amp; Training Wear</option>
            <option value="MATCHDAY_SPONSORSHIP">Moi Stadium Matchday Perimeter &amp; Activation</option>
            <option value="DIGITAL_MEDIA">Digital &amp; Match Centre Sponsorship</option>
            <option value="COMMUNITY_YOUTH">Community &amp; Youth Football Partner</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Estimated Annual Budget Range (KES — Optional)
          </label>
          <input
            type="text"
            value={budgetRange}
            onChange={(e) => setBudgetRange(e.target.value)}
            placeholder="e.g. KES 1M - 5M"
            className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">
          Partnership Objectives &amp; Message
        </label>
        <textarea
          rows={4}
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm"
        />
      </div>

      <label className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer">
        <input
          type="checkbox"
          required
          checked={consentGranted}
          onChange={(e) => setConsentGranted(e.target.checked)}
          className="mt-0.5 w-4 h-4 text-club-primary"
        />
        <span>
          I consent to 3K FC storing and processing these business contact details in accordance with the Kenya Data Protection Act, 2019 to respond to this commercial enquiry.
        </span>
      </label>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs font-bold ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {feedback.text}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-club-primary hover:bg-red-600 text-white text-xs font-bold uppercase tracking-wider shadow transition"
      >
        <Send className="w-4 h-4" />
        <span>{submitting ? 'Submitting...' : 'Submit Partnership Enquiry'}</span>
      </button>
    </form>
  );
}
