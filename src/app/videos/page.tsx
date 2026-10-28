import React from 'react';
import { prisma } from '@/lib/prisma';
import { ClickToLoadVideoCard } from '@/components/media/ClickToLoadVideoCard';
import { syncFacebookTeamNews } from '@/lib/facebook';

export const dynamic = 'force-dynamic';

export default async function VideosPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const params = await searchParams;
  const selectedCat = (params.category || 'ALL').toUpperCase();

  const categories = [
    'ALL',
    'HIGHLIGHTS',
    'GOALS',
    'INTERVIEWS',
    'TRAINING',
    'BEHIND_THE_SCENES',
    'DOCUMENTARY',
  ];

  const videos = await prisma.video.findMany({
    where: {
      status: 'PUBLISHED',
      ...(selectedCat !== 'ALL' ? { category: selectedCat } : {}),
    },
    orderBy: { publishedAt: 'desc' },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 md:py-14">
      <div className="border-b-2 border-slate-900 pb-6 mb-8">
        <p className="athletic-label text-xs font-extrabold text-club-primary">
          Official Media &amp; Broadcast Library
        </p>
        <h1 className="editorial-headline font-black text-3xl md:text-5xl text-slate-900 mt-1">
          3K FC TV &amp; Video Hub
        </h1>
        <p className="text-sm text-slate-600 mt-2 max-w-2xl">
          Watch verified match highlights, tactical coach interviews, training sessions in Embu, and club documentary features. Streams on-demand with click-to-load data saving.
        </p>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap items-center gap-2 mb-8">
        {categories.map((cat) => (
          <a
            key={cat}
            href={cat === 'ALL' ? '/videos' : `/videos?category=${cat}`}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition ${
              selectedCat === cat
                ? 'bg-club-primary text-white shadow'
                : 'bg-white text-slate-700 border border-slate-300 hover:border-slate-900'
            }`}
          >
            {cat.replace(/_/g, ' ')}
          </a>
        ))}
      </div>

      {videos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((vid) => (
            <ClickToLoadVideoCard
              key={vid.id}
              title={vid.titleEn}
              description={vid.descriptionEn}
              category={vid.category}
              youtubeVideoId={vid.youtubeVideoId}
              durationLabel={vid.durationLabel}
              hasCaptions={vid.hasCaptions}
              sourceUrl={vid.sourceUrl}
              thumbnailUrl={vid.thumbnailUrl || undefined}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl bg-white border border-slate-200 p-12 text-center text-sm text-slate-600">
          No published video features found for this category.
        </div>
      )}
    </div>
  );
}
