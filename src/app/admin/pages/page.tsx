import React from 'react';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireAdminPermission } from '@/lib/auth';
import { PagesAdminClient } from '@/components/admin/PagesAdminClient';

export const dynamic = 'force-dynamic';

export default async function AdminPagesPage() {
  try {
    await requireAdminPermission('pages', 'read');
  } catch {
    redirect('/admin/dashboard');
  }

  const pages = await prisma.staticPage.findMany({
    orderBy: { slug: 'asc' },
    include: {
      translations: true,
    },
  });

  const formatted = pages.map((p) => ({
    id: p.id,
    slug: p.slug,
    status: p.status,
    updatedAt: p.updatedAt.toISOString(),
    translations: p.translations.map((t) => ({
      locale: t.locale,
      title: t.title,
      summary: t.summary,
      body: t.body,
      seoTitle: t.seoTitle,
      seoDescription: t.seoDescription,
    })),
  }));

  return (
    <div className="space-y-6">
      <div className="border-b border-white/10 pb-4">
        <h1 className="editorial-headline font-black text-2xl text-white">
          Website Pages &amp; Editorial Content
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Manage bilingual static editorial pages including Club History, Moi Stadium Guide, Secretariat Contact, and Kenya Data Protection Act 2019 legal policies.
        </p>
      </div>

      <PagesAdminClient initialPages={formatted} />
    </div>
  );
}
