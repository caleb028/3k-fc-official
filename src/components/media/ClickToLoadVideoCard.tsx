'use client';

import React, { useState } from 'react';
import { Play, Subtitles } from 'lucide-react';

interface ClickToLoadVideoCardProps {
  title: string;
  description: string;
  category: string;
  youtubeVideoId: string;
  durationLabel: string;
  hasCaptions?: boolean;
}

/**
 * Section 5D & Section 15:
 * At launch, support verified YouTube embeds and thumbnails.
 * Use click-to-load embeds to minimise unnecessary network usage.
 */
export function ClickToLoadVideoCard({
  title,
  description,
  category,
  youtubeVideoId,
  durationLabel,
  hasCaptions = true,
}: ClickToLoadVideoCardProps) {
  const [activated, setActivated] = useState(false);

  return (
    <article className="rounded-xl overflow-hidden bg-[#121722] border border-white/10 flex flex-col shadow-lg">
      <div className="relative aspect-video bg-black">
        {activated ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${youtubeVideoId}?autoplay=1&rel=0`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full border-0"
          />
        ) : (
          <button
            type="button"
            onClick={() => setActivated(true)}
            aria-label={`Play video: ${title}`}
            className="w-full h-full relative group text-left flex flex-col justify-between p-4 bg-gradient-to-br from-[#191F2E] via-[#1B1118] to-[#2D0E14]"
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded bg-club-primary text-white">
                {category.replace(/_/g, ' ')}
              </span>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-black/75 text-white border border-white/15">
                {durationLabel}
              </span>
            </div>

            <div className="my-auto flex flex-col items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-club-primary group-hover:bg-red-600 group-hover:scale-105 transition flex items-center justify-center shadow-xl border-2 border-white/30">
                <Play className="w-6 h-6 text-white fill-white ml-0.5" />
              </div>
              <span className="text-[11px] font-semibold text-slate-300 mt-2 bg-black/50 px-2.5 py-0.5 rounded-full">
                Click to Load Video Stream (Data Saver)
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-300">
              <span>3K FC Official Media</span>
              {hasCaptions && (
                <span className="inline-flex items-center gap-1 text-emerald-300">
                  <Subtitles className="w-3.5 h-3.5" />
                  CC Available
                </span>
              )}
            </div>
          </button>
        )}
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-display font-bold text-white text-base md:text-lg leading-snug">
            {title}
          </h3>
          <p className="text-xs text-slate-300 mt-2 leading-relaxed line-clamp-2">
            {description}
          </p>
        </div>
      </div>
    </article>
  );
}
