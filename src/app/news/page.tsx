import React from 'react';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { ArrowRight, Search, Newspaper, ExternalLink, MessageCircle, Share2, Users } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { Locale, resolveBilingualField, t } from '@/lib/i18n';
import { AuthenticMediaPlaceholder } from '@/components/ui/AuthenticMediaPlaceholder';
import { syncFacebookTeamNews, FACEBOOK_PAGE_URL } from '@/lib/facebook';

export const dynamic = 'force-dynamic';

export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const locale: Locale = cookieStore.get('3kfc_locale')?.value === 'sw' ? 'sw' : 'en';

  const selectedCategory = params.category || 'all';
  const query = (params.q || '').trim();

  // Automatically sync team news from official Facebook page: https://www.facebook.com/3kfootballclub
  await syncFacebookTeamNews().catch(() => null);

  const [categories, articles] = await Promise.all([
    prisma.category.findMany({ orderBy: { sortOrder: 'asc' } }),
    prisma.article.findMany({
      where: {
        status: 'PUBLISHED',
        ...(selectedCategory !== 'all'
          ? { category: { slug: selectedCategory } }
          : {}),
        ...(query
          ? {
              translations: {
                some: {
                  OR: [
                    { headline: { contains: query } },
                    { summary: { contains: query } },
                    { body: { contains: query } },
                  ],
                },
              },
            }
          : {}),
      },
      orderBy: [{ isFeatured: 'desc' }, { publishedAt: 'desc' }],
      include: {
        category: true,
        translations: true,
      },
    }),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 md:py-14 space-y-12">
      {/* Page Header */}
      <div className="border-b-2 border-slate-900 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="athletic-label text-xs font-black text-club-primary tracking-widest uppercase">
              3K FC Official Media Desk • Embu
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
              Live Facebook Sync
            </span>
          </div>
          <h1 className="editorial-headline font-black text-3xl md:text-5xl text-slate-900">
            {t('section.latest_news', locale)}
          </h1>
          <p className="text-sm text-slate-600 mt-2 max-w-2xl">
            Official club statements, match reports, squad travel briefings, and live team news automatically synchronized from our official Facebook desk.
          </p>
        </div>

        {/* Search Input */}
        <form action="/news" method="GET" className="flex items-center gap-2 w-full md:w-80">
          {selectedCategory !== 'all' && (
            <input type="hidden" name="category" value={selectedCategory} />
          )}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder={locale === 'sw' ? 'Tafuta habari...' : 'Search articles...'}
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-slate-300 text-sm focus:border-club-primary"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-club-primary text-white text-xs font-bold uppercase tracking-wider transition"
          >
            Filter
          </button>
        </form>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap items-center gap-2" role="navigation" aria-label="News Categories">
        <Link
          href="/news"
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition ${
            selectedCategory === 'all'
              ? 'bg-club-primary text-white shadow'
              : 'bg-white text-slate-700 border border-slate-300 hover:border-slate-900'
          }`}
        >
          All Categories
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/news?category=${cat.slug}`}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition ${
              selectedCategory === cat.slug
                ? 'bg-club-primary text-white shadow'
                : 'bg-white text-slate-700 border border-slate-300 hover:border-slate-900'
            }`}
          >
            {locale === 'sw' ? cat.nameSw : cat.nameEn}
          </Link>
        ))}
      </div>

      {/* Articles Grid */}
      {articles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
          {articles.map((art) => {
            const { record: tr, isFallback } = resolveBilingualField(art.translations, locale);
            const isFacebookStory =
              art.authorName.includes('Facebook') || art.slug.startsWith('fb-') || art.videoEmbedUrl?.includes('facebook.com');

            return (
              <article
                key={art.id}
                className="rounded-3xl bg-white border border-slate-200 overflow-hidden shadow-sm barca-card-hover group flex flex-col justify-between"
              >
                <div>
                  <AuthenticMediaPlaceholder
                    category={locale === 'sw' ? art.category.nameSw : art.category.nameEn}
                    label={tr?.headline || art.slug}
                    sublabel={art.featuredImageAlt}
                    aspectRatio="video"
                    imageUrl={art.featuredImageUrl}
                    isVerifiedAsset={!art.isPlaceholderImage}
                  />
                  <div className="p-6">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-2 gap-2">
                      <span className="font-bold uppercase text-club-primary truncate">
                        {locale === 'sw' ? art.category.nameSw : art.category.nameEn}
                      </span>
                      <span className="shrink-0">
                        {art.publishedAt
                          ? new Date(art.publishedAt).toLocaleDateString('en-KE', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : 'Published'}
                      </span>
                    </div>

                    {isFacebookStory && (
                      <div className="mb-2.5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-[#1877F2]/10 text-[#1877F2] border border-[#1877F2]/20">
                          <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                          </svg>
                          Official Facebook Desk
                        </span>
                      </div>
                    )}

                    <h2 className="editorial-headline font-bold text-xl text-slate-900 leading-snug">
                      <Link href={`/news/${art.slug}`} className="hover:text-club-primary transition">
                        {tr?.headline}
                      </Link>
                    </h2>
                    <p className="text-sm text-slate-600 mt-2.5 line-clamp-3 leading-relaxed">
                      {tr?.summary}
                    </p>
                    {isFallback && (
                      <p className="mt-3 text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded px-2.5 py-1">
                        {t('status.translation_fallback', locale)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium truncate max-w-[140px]">{art.authorName}</span>
                  <div className="flex items-center gap-3">
                    {isFacebookStory && (
                      <a
                        href={art.videoEmbedUrl || FACEBOOK_PAGE_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-bold text-[#1877F2] hover:underline"
                        title="View post on Facebook"
                      >
                        <span>Facebook</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    <Link
                      href={`/news/${art.slug}`}
                      className="inline-flex items-center gap-1 font-bold text-club-primary hover:underline"
                    >
                      <span>{t('action.read_more', locale)}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl bg-white border border-slate-200 p-12 text-center">
          <Newspaper className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h2 className="font-display font-bold text-xl text-slate-900">
            No matching articles found
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Try clearing your category filter or search terms.
          </p>
          <Link
            href="/news"
            className="mt-4 inline-block px-4 py-2 rounded-lg bg-club-primary text-white text-xs font-bold uppercase tracking-wider"
          >
            Reset Filters
          </Link>
        </div>
      )}

      {/* Official Facebook Social Hub Banner */}
      <section className="rounded-3xl bg-white border-2 border-slate-200 p-8 sm:p-10 shadow-sm overflow-hidden relative">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-[#1877F2] text-white">
                Official Social Channel
              </span>
              <span className="text-xs font-bold text-slate-500">
                131,000+ Embu Supporters
              </span>
            </div>
            <h2 className="editorial-headline font-black text-2xl sm:text-3xl text-slate-900">
              Follow 3K Football Club on Facebook
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Stay connected with daily live training updates, matchday lineups, live goal alerts, photo galleries, and post-match press conferences directly from the official 3K FC Facebook community.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <a
              href={FACEBOOK_PAGE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#1877F2] hover:bg-[#166fe5] text-white font-bold text-sm shadow-md transition"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span>Visit Official Facebook Page</span>
              <ExternalLink className="w-4 h-4 ml-1" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
