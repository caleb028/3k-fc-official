import React from 'react';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireAdminPermission } from '@/lib/auth';
import { NewsAdminClient } from '@/components/admin/NewsAdminClient';
import { syncFacebookTeamNews } from '@/lib/facebook';

export const dynamic = 'force-dynamic';

export default async function AdminNewsPage() {
  try {
    await requireAdminPermission('articles', 'read');
  } catch {
    redirect('/admin/dashboard');
  }

  // Automatically ensure team news from official Facebook page is synchronized
  await syncFacebookTeamNews().catch(() => null);

  const [articles, categories] = await Promise.all([
    prisma.article.findMany({
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      include: {
        category: true,
        translations: true,
      },
    }),
    prisma.category.findMany({ orderBy: { sortOrder: 'asc' } }),
  ]);

  const formattedArticles = articles.map((a) => ({
    id: a.id,
    slug: a.slug,
    categoryId: a.categoryId,
    authorName: a.authorName,
    status: a.status,
    isFeatured: a.isFeatured,
    heroOrder: a.heroOrder,
    viewCount: a.viewCount,
    featuredImageUrl: a.featuredImageUrl,
    publishedAt: a.publishedAt ? a.publishedAt.toISOString() : null,
    category: {
      nameEn: a.category.nameEn,
      slug: a.category.slug,
    },
    translations: a.translations.map((t) => ({
      locale: t.locale,
      headline: t.headline,
      summary: t.summary,
    })),
  }));

  const formattedCategories = categories.map((cat) => ({
    id: cat.id,
    nameEn: cat.nameEn,
    nameSw: cat.nameSw,
    slug: cat.slug,
  }));

  return (
    <div className="space-y-6">
      <div className="border-b border-white/10 pb-4">
        <h1 className="editorial-headline font-black text-2xl text-white">
          Editorial &amp; Media Management
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Publish official club announcements, match previews, and bilingual articles directly to the website.
        </p>
      </div>

      <NewsAdminClient
        initialArticles={formattedArticles}
        categories={formattedCategories}
      />
    </div>
  );
}
