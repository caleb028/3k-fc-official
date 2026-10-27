import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { ArrowLeft, Calendar, User, Share2, ArrowRight, ExternalLink } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { Locale, resolveBilingualField, t } from '@/lib/i18n';
import { AuthenticMediaPlaceholder } from '@/components/ui/AuthenticMediaPlaceholder';

export const dynamic = 'force-dynamic';

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const cookieStore = await cookies();
  const locale: Locale = cookieStore.get('3kfc_locale')?.value === 'sw' ? 'sw' : 'en';

  const article = await prisma.article.findUnique({
    where: { slug },
    include: {
      category: true,
      translations: true,
      tags: { include: { tag: true } },
    },
  });

  if (!article || article.status !== 'PUBLISHED') {
    notFound();
  }

  // Increment privacy-conscious article view counter
  await prisma.article
    .update({
      where: { id: article.id },
      data: { viewCount: { increment: 1 } },
    })
    .catch(() => null);

  const { record: tr, isFallback } = resolveBilingualField(article.translations, locale);

  const relatedArticles = await prisma.article.findMany({
    where: {
      status: 'PUBLISHED',
      id: { not: article.id },
      categoryId: article.categoryId,
    },
    orderBy: { publishedAt: 'desc' },
    take: 2,
    include: {
      category: true,
      translations: true,
    },
  });

  const paragraphs = (tr?.body || '').split('\n\n').filter(Boolean);

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 py-10 md:py-14">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-6">
        <Link
          href="/news"
          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-club-primary hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Official Club News</span>
        </Link>
      </nav>

      {/* Article Header */}
      <header className="mb-8">
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 mb-3">
          <span className="px-2.5 py-1 rounded bg-club-primary text-white font-bold uppercase tracking-wider">
            {locale === 'sw' ? article.category.nameSw : article.category.nameEn}
          </span>
          <span className="inline-flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-club-primary" />
            {article.publishedAt
              ? new Date(article.publishedAt).toLocaleDateString('en-KE', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })
              : 'Official Release'}
          </span>
          <span className="inline-flex items-center gap-1">
            <User className="w-3.5 h-3.5 text-club-primary" />
            {article.authorName}
          </span>
        </div>

        <h1 className="editorial-headline font-black text-3xl sm:text-4xl md:text-5xl text-slate-900">
          {tr?.headline}
        </h1>

        <p className="text-lg md:text-xl text-slate-700 font-medium mt-4 leading-relaxed">
          {tr?.summary}
        </p>

        {isFallback && (
          <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-300 text-xs text-amber-900">
            {t('status.translation_fallback', locale)}
          </div>
        )}
      </header>

      {/* Featured Image or Authentic Placeholder */}
      <div className="rounded-2xl overflow-hidden mb-8 shadow-md">
        <AuthenticMediaPlaceholder
          category={locale === 'sw' ? article.category.nameSw : article.category.nameEn}
          label={tr?.headline || article.slug}
          sublabel={article.featuredImageAlt}
          aspectRatio="video"
          imageUrl={article.featuredImageUrl}
          isVerifiedAsset={!article.isPlaceholderImage}
        />
      </div>

      {/* Article Body */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-10 shadow-sm space-y-5 text-slate-800 text-base md:text-lg leading-relaxed">
        {paragraphs.map((p, idx) => (
          <p key={idx}>{p}</p>
        ))}

        {/* Share & Metadata Footer */}
        <div className="pt-6 mt-8 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-club-primary" />
            <span>Official 3K FC Publication • Embu County, Kenya</span>
          </div>
          <div>
            <span>Available in English &amp; Kiswahili (Switch language in top header)</span>
          </div>
        </div>
      </div>

      {/* Related Stories */}
      {relatedArticles.length > 0 && (
        <section className="mt-12 pt-8 border-t-2 border-slate-900">
          <h2 className="editorial-headline font-bold text-2xl text-slate-900 mb-6">
            Related Club Stories
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {relatedArticles.map((rel) => {
              const relTr = resolveBilingualField(rel.translations, locale).record;
              return (
                <div
                  key={rel.id}
                  className="rounded-xl bg-white border border-slate-200 p-5 flex flex-col justify-between"
                >
                  <div>
                    <span className="text-xs font-bold uppercase text-club-primary">
                      {locale === 'sw' ? rel.category.nameSw : rel.category.nameEn}
                    </span>
                    <h3 className="editorial-headline font-bold text-lg text-slate-900 mt-1">
                      <Link href={`/news/${rel.slug}`} className="hover:text-club-primary">
                        {relTr?.headline}
                      </Link>
                    </h3>
                    <p className="text-xs text-slate-600 mt-2 line-clamp-2">{relTr?.summary}</p>
                  </div>
                  <Link
                    href={`/news/${rel.slug}`}
                    className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-club-primary hover:underline"
                  >
                    <span>{t('action.read_more', locale)}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </article>
  );
}
