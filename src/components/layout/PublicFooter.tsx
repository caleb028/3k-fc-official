'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MapPin, Mail, Phone, ShieldCheck, ExternalLink } from 'lucide-react';
import { ClubCrest } from '@/components/ui/ClubCrest';

export function PublicFooter() {
  const pathname = usePathname();
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <footer className="bg-club-surfaceDark text-slate-300 border-t border-white/10 pb-20 md:pb-10">
      {/* Sponsor & Partner Verification Banner */}
      <div className="border-b border-white/10 bg-[#0E131B] py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <p className="athletic-label text-xs font-bold text-club-accent">
              Commercial & Community Partnerships
            </p>
            <h3 className="font-display font-bold text-lg text-white mt-1">
              Mozzart Bet Kenya • Principal Partner Showcase
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Note: Principal sponsorship status displayed subject to confirmation of the current 2026/27 sponsorship agreement.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/partners"
              className="px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-bold uppercase tracking-wider border border-white/15 transition"
            >
              Partner Directory & Enquiries
            </Link>
            <Link
              href="/support-3k"
              className="px-4 py-2.5 rounded-lg bg-club-primary hover:bg-red-600 text-white text-xs font-bold uppercase tracking-wider transition"
            >
              Support 3K FC Fund
            </Link>
          </div>
        </div>
      </div>

      {/* Main Footer Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
        {/* Col 1-2: Club Identity */}
        <div className="lg:col-span-2 space-y-4">
          <ClubCrest size="md" showWordmark={true} />
          <p className="text-sm text-slate-400 leading-relaxed max-w-md">
            The official digital home of <strong>3K Football Club (Embu County, Kenya)</strong>.
            Proudly representing Mount Kenya and competing in the <strong>2026/27 FKF Premier League</strong>.
          </p>
          <div className="space-y-2 text-xs text-slate-300 pt-1">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-club-accent shrink-0 mt-0.5" />
              <span>
                Moi Stadium, Embu County, Kenya{' '}
                <em className="text-slate-400">(Subject to official match venue confirmation)</em>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-club-accent shrink-0" />
              <span>official@3kfc.co.ke • media@3kfc.co.ke</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-club-accent shrink-0" />
              <span>+254 700 300 300 (Club Secretariat — Embu)</span>
            </div>
          </div>
        </div>

        {/* Col 3: Football & Media */}
        <div>
          <h4 className="athletic-label text-xs font-bold text-white mb-4">
            Football &amp; Media
          </h4>
          <ul className="space-y-2.5 text-sm">
            <li><Link href="/news" className="hover:text-white transition">Latest Club News</Link></li>
            <li><Link href="/fixtures" className="hover:text-white transition">Fixtures Schedule</Link></li>
            <li><Link href="/results" className="hover:text-white transition">Confirmed Results</Link></li>
            <li><Link href="/table" className="hover:text-white transition">FKF Premier League Table</Link></li>
            <li><Link href="/team" className="hover:text-white transition">First Team &amp; Technical Bench</Link></li>
            <li><Link href="/videos" className="hover:text-white transition">Video Hub &amp; Highlights</Link></li>
          </ul>
        </div>

        {/* Col 4: Supporters & Commerce */}
        <div>
          <h4 className="athletic-label text-xs font-bold text-white mb-4">
            Supporters &amp; Store
          </h4>
          <ul className="space-y-2.5 text-sm">
            <li><Link href="/tickets" className="hover:text-white transition">Matchday QR Tickets</Link></li>
            <li><Link href="/shop" className="hover:text-white transition">Official Online Store (KES)</Link></li>
            <li><Link href="/supporters" className="hover:text-white transition">Membership &amp; Loyalty</Link></li>
            <li><Link href="/support-3k" className="hover:text-white transition">Support 3K Donations</Link></li>
            <li><Link href="/club" className="hover:text-white transition">Club Heritage &amp; Journey</Link></li>
            <li><Link href="/contact" className="hover:text-white transition">Contact &amp; Accreditation</Link></li>
          </ul>
        </div>

        {/* Col 5: Legal, Policies & Data Protection */}
        <div>
          <h4 className="athletic-label text-xs font-bold text-white mb-4">
            Policies &amp; Governance
          </h4>
          <ul className="space-y-2.5 text-sm">
            <li><Link href="/privacy" className="hover:text-white transition">Privacy Policy (KDPA 2019)</Link></li>
            <li><Link href="/terms" className="hover:text-white transition">Terms of Use</Link></li>
            <li><Link href="/ticket-terms" className="hover:text-white transition">Ticketing &amp; Gate Terms</Link></li>
            <li><Link href="/refund-policy" className="hover:text-white transition">Refund &amp; Cancellation Policy</Link></li>
            <li><Link href="/delivery-policy" className="hover:text-white transition">Store Collection &amp; Delivery</Link></li>
            <li>
              <Link
                href="/partners#enquire"
                className="inline-flex items-center gap-1 text-club-accent hover:underline"
              >
                <span>Sponsor Enquiries</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Copyright & Compliance Bar */}
      <div className="border-t border-white/10 pt-6 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              &copy; {new Date().getFullYear()} 3K Football Club, Embu County, Kenya. All rights reserved.
            </span>
          </div>
          <div className="text-center sm:text-right">
            <span>Architecture &amp; Platform Specification Prepared by <strong>Caleb Ngiciri</strong></span>
          </div>
        </div>
      </div>
    </footer>
  );
}
