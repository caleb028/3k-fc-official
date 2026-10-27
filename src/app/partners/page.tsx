import React from 'react';
import Link from 'next/link';
import { ExternalLink, BarChart3, ShieldCheck } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { PartnerEnquiryForm } from '@/components/sponsors/PartnerEnquiryForm';

export const dynamic = 'force-dynamic';

export default async function PartnersPage() {
  const sponsors = await prisma.sponsor.findMany({
    where: { isPublished: true },
    orderBy: { displayPriority: 'asc' },
    include: { placements: true },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 md:py-14 space-y-12">
      <div className="border-b-2 border-slate-900 pb-6">
        <p className="athletic-label text-xs font-extrabold text-club-primary">
          Commercial Partnerships &amp; Measurable Brand Exposure
        </p>
        <h1 className="editorial-headline font-black text-3xl md:text-5xl text-slate-900 mt-1">
          Official Sponsors &amp; Partners
        </h1>
        <p className="text-sm text-slate-600 mt-2 max-w-2xl">
          3K FC provides partners with transparent, UTM-attributed digital placements across our homepage, Match Centre, ticketing box office, and official store.
        </p>
      </div>

      {/* Sponsor Directory */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sponsors.map((sp) => (
          <article
            key={sp.id}
            className="rounded-2xl bg-white border border-slate-200 p-6 md:p-8 shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <span className="px-2.5 py-1 rounded bg-slate-900 text-white text-xs font-bold uppercase tracking-wider">
                  {sp.category.replace(/_/g, ' ')}
                </span>
                <span className="px-2.5 py-1 rounded bg-amber-100 text-amber-900 text-xs font-bold uppercase">
                  {sp.contractStatus.replace(/_/g, ' ')}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {sp.businessName.toLowerCase().includes('mozzart') && (
                  <span className="sponsor-badge-mozzart text-sm px-3 py-1">
                    MOZZART
                  </span>
                )}
                <h2 className="editorial-headline font-black text-2xl md:text-3xl text-slate-900">
                  {sp.businessName}
                </h2>
              </div>

              <p className="text-sm text-slate-700 mt-3 leading-relaxed">
                {sp.descriptionEn}
              </p>

              {sp.verificationNote && (
                <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3 mt-4">
                  <strong>Verification Status:</strong> {sp.verificationNote}
                </p>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Active Placements: {sp.placements.length}
              </span>
              <Link
                href={`/api/sponsors/track?sponsorId=${sp.id}&zone=PARTNERS_DIRECTORY&target=${encodeURIComponent(
                  sp.websiteUrl
                )}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 hover:bg-club-primary text-white text-xs font-bold transition"
              >
                <span>Visit Official Partner Website</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </article>
        ))}

        {/* Measurable Attribution & Reporting Architecture Card */}
        <div className="rounded-2xl bg-white border border-slate-200 text-slate-800 p-6 md:p-8 shadow-sm flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs athletic-label tracking-wider text-club-primary">
              <BarChart3 className="w-4 h-4" />
              <span>Substantiated Commercial Reporting</span>
            </div>
            <h2 className="editorial-headline font-bold text-2xl text-slate-900 mt-2">
              Measurable Impressions, Clicks &amp; UTM Attribution
            </h2>
            <p className="text-xs text-slate-600 mt-3 leading-relaxed">
              Every sponsor placement on the 3K FC platform separates measured server-recorded events (impressions, clicks, referral visits, and attributed ticket/shop conversions) from estimated reach. Downloadable CSV reports are available in the Sponsor Manager dashboard.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-emerald-700 font-bold">
            <ShieldCheck className="w-4 h-4" />
            <span>Consent-Compliant First-Party Attribution</span>
          </div>
        </div>
      </section>

      {/* Partnership Enquiry Section */}
      <section id="enquire" className="pt-6">
        <PartnerEnquiryForm />
      </section>
    </div>
  );
}
