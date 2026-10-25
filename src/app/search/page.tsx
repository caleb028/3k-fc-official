import React from 'react';
import Link from 'next/link';
import { Search, Newspaper, Users, Calendar, ShoppingBag, Video, ArrowRight } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { formatKes } from '@/lib/money';

export const dynamic = 'force-dynamic';

export default async function SearchResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q || '').trim();

  if (!query) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <Search className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h1 className="editorial-headline font-bold text-2xl text-slate-900">
          Search the 3K FC Digital Platform
        </h1>
        <p className="text-sm text-slate-600 mt-2">
          Enter a search query in the header to find news articles, first team players, fixtures, merchandise, or match highlights.
        </p>
      </div>
    );
  }

  const [articles, players, fixtures, products, videos] = await Promise.all([
    prisma.article.findMany({
      where: {
        status: 'PUBLISHED',
        translations: {
          some: {
            OR: [
              { headline: { contains: query } },
              { summary: { contains: query } },
              { body: { contains: query } },
            ],
          },
        },
      },
      include: { category: true, translations: true },
      take: 6,
    }),
    prisma.player.findMany({
      where: {
        isActive: true,
        OR: [
          { fullName: { contains: query } },
          { nickname: { contains: query } },
          { specificRole: { contains: query } },
          { position: { contains: query } },
        ],
      },
      take: 6,
    }),
    prisma.fixture.findMany({
      where: {
        OR: [
          { homeClub: { name: { contains: query } } },
          { awayClub: { name: { contains: query } } },
          { venueName: { contains: query } },
          { competition: { name: { contains: query } } },
        ],
      },
      include: { homeClub: true, awayClub: true, competition: true },
      take: 4,
    }),
    prisma.product.findMany({
      where: {
        isAvailable: true,
        OR: [
          { nameEn: { contains: query } },
          { descriptionEn: { contains: query } },
          { category: { contains: query } },
        ],
      },
      take: 4,
    }),
    prisma.video.findMany({
      where: {
        status: 'PUBLISHED',
        OR: [
          { titleEn: { contains: query } },
          { descriptionEn: { contains: query } },
          { category: { contains: query } },
        ],
      },
      take: 4,
    }),
  ]);

  const totalResults =
    articles.length + players.length + fixtures.length + products.length + videos.length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 md:py-14 space-y-10">
      <div className="border-b-2 border-slate-900 pb-6">
        <p className="athletic-label text-xs font-extrabold text-club-primary">
          Platform-Wide Search Results
        </p>
        <h1 className="editorial-headline font-black text-3xl md:text-5xl text-slate-900 mt-1">
          Search: &ldquo;{query}&rdquo;
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Found <strong>{totalResults}</strong> matching results across club news, players, fixtures, products, and video features.
        </p>
      </div>

      {totalResults === 0 ? (
        <div className="rounded-2xl bg-white border border-slate-200 p-12 text-center text-slate-600">
          No matches found for &ldquo;{query}&rdquo;. Try another search term.
        </div>
      ) : (
        <div className="space-y-12">
          {/* Articles */}
          {articles.length > 0 && (
            <section>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-club-primary mb-4">
                <Newspaper className="w-4 h-4" />
                <span>Articles &amp; Press Releases ({articles.length})</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {articles.map((art) => (
                  <Link
                    key={art.id}
                    href={`/news/${art.slug}`}
                    className="block rounded-xl bg-white border border-slate-200 p-5 hover:border-club-primary transition shadow-sm"
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider text-club-primary block mb-1">
                      {art.category.nameEn}
                    </span>
                    <h3 className="font-display font-bold text-lg text-slate-900 line-clamp-2">
                      {art.translations[0]?.headline}
                    </h3>
                    <p className="text-xs text-slate-600 mt-2 line-clamp-2">
                      {art.translations[0]?.summary}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Players */}
          {players.length > 0 && (
            <section>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-club-primary mb-4">
                <Users className="w-4 h-4" />
                <span>First Team Players ({players.length})</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {players.map((p) => (
                  <Link
                    key={p.id}
                    href={`/team/${p.slug}`}
                    className="flex items-center justify-between p-4 rounded-xl bg-white border border-slate-200 hover:border-club-primary transition"
                  >
                    <div>
                      <span className="text-[10px] uppercase font-bold text-club-primary block">
                        {p.position}
                      </span>
                      <strong className="text-slate-900 text-sm">{p.fullName}</strong>
                    </div>
                    {p.shirtNumber && (
                      <span className="font-display font-black text-xl text-slate-900">
                        #{p.shirtNumber}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Fixtures */}
          {fixtures.length > 0 && (
            <section>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-club-primary mb-4">
                <Calendar className="w-4 h-4" />
                <span>Fixtures &amp; Matches ({fixtures.length})</span>
              </div>
              <div className="space-y-3">
                {fixtures.map((f) => (
                  <Link
                    key={f.id}
                    href={`/matches/${f.slug}`}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-white border border-slate-200 hover:border-club-primary transition gap-3"
                  >
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">
                        {f.competition.name}
                      </span>
                      <strong className="text-slate-900 text-sm">
                        {f.homeClub.name} vs {f.awayClub.name}
                      </strong>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-club-primary">
                      <span>Match Centre</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Products */}
          {products.length > 0 && (
            <section>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-club-primary mb-4">
                <ShoppingBag className="w-4 h-4" />
                <span>Store Merchandise ({products.length})</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {products.map((p) => (
                  <Link
                    key={p.id}
                    href={`/shop/${p.slug}`}
                    className="p-4 rounded-xl bg-white border border-slate-200 hover:border-club-primary transition flex flex-col justify-between"
                  >
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">
                        {p.category}
                      </span>
                      <h4 className="font-bold text-sm text-slate-900 line-clamp-2 mt-1">
                        {p.nameEn}
                      </h4>
                    </div>
                    <span className="font-mono font-bold text-club-primary text-sm mt-3">
                      {formatKes(p.priceKesCents)}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Videos */}
          {videos.length > 0 && (
            <section>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-club-primary mb-4">
                <Video className="w-4 h-4" />
                <span>Video Highlights ({videos.length})</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {videos.map((v) => (
                  <Link
                    key={v.id}
                    href="/videos"
                    className="p-4 rounded-xl bg-white border border-slate-200 hover:border-club-primary transition"
                  >
                    <span className="text-[10px] uppercase font-bold text-club-accent block">
                      {v.category}
                    </span>
                    <strong className="text-sm text-slate-900 block mt-1">{v.titleEn}</strong>
                    <span className="text-xs text-slate-500 mt-2 block">{v.durationLabel}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
