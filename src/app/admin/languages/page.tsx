import React from 'react';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireAdminPermission } from '@/lib/auth';
import { LanguagesAdminClient } from '@/components/admin/LanguagesAdminClient';

export const dynamic = 'force-dynamic';

export default async function AdminLanguagesPage() {
  try {
    await requireAdminPermission('languages', 'read');
  } catch {
    redirect('/admin/dashboard');
  }

  const phrases = await prisma.translationKey.findMany({
    orderBy: { key: 'asc' },
  });

  const formatted = phrases.map((p) => ({
    id: p.id,
    namespace: p.namespace,
    key: p.key,
    valueEn: p.valueEn,
    valueSw: p.valueSw,
    isVerifiedSw: p.isVerifiedSw,
  }));

  return (
    <div className="space-y-6">
      <div className="border-b border-white/10 pb-4">
        <h1 className="editorial-headline font-black text-2xl text-white">
          Bilingual Dictionary &amp; Localization
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Maintain verified English and Kiswahili UI phrases, translation keys, and linguistic accuracy across public digital channels.
        </p>
      </div>

      <LanguagesAdminClient initialPhrases={formatted} />
    </div>
  );
}
