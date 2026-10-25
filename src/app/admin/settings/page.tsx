import React from 'react';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireAdminPermission } from '@/lib/auth';
import { AdminSettingsClient } from '@/components/admin/AdminSettingsClient';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  try {
    await requireAdminPermission('settings', 'read');
  } catch {
    redirect('/admin/dashboard');
  }

  const settings = await prisma.clubSettings.findUnique({ where: { id: 'default' } });

  return (
    <div className="space-y-6">
      <div className="border-b border-white/10 pb-4">
        <h1 className="editorial-headline font-black text-2xl text-white">
          Club Configuration &amp; Brand Tokens
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Configure design system color tokens, confirm provisional themes, and manage venue and sponsorship verification notices.
        </p>
      </div>

      <AdminSettingsClient
        initialSettings={{
          paletteStatus: settings?.paletteStatus || 'PROVISIONAL',
          primaryColor: settings?.primaryColor || '#B91C1C',
          secondaryColor: settings?.secondaryColor || '#0F766E',
          accentColor: settings?.accentColor || '#F59E0B',
          homeStadiumName: settings?.homeStadiumName || 'Moi Stadium, Embu',
          homeStadiumConfirmed: settings?.homeStadiumConfirmed || false,
          homeStadiumVerificationNote:
            settings?.homeStadiumVerificationNote ||
            "Subject to confirmation of the club's official match venue.",
          mainSponsorName: settings?.mainSponsorName || 'Mozzart Bet Kenya',
          mainSponsorConfirmed: settings?.mainSponsorConfirmed || false,
          mainSponsorVerificationNote:
            settings?.mainSponsorVerificationNote ||
            'Subject to confirmation of current sponsorship agreement.',
          crestAssetUrl: settings?.crestAssetUrl || null,
          crestConfirmed: settings?.crestConfirmed || false,
        }}
      />
    </div>
  );
}
