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
  sourceUrl?: string;
  thumbnailUrl?: string;
}

/**
 * Click-To-Load Video Card:
 * Supports verified YouTube streams and Facebook Video players with data saver mode.
 * Loads direct Facebook video thumbnails and stream embeds on demand.
 */
export function ClickToLoadVideoCard({
  title,
  description,
  category,
  youtubeVideoId,
  durationLabel,
  hasCaptions = true,
  sourceUrl,
  thumbnailUrl,
}: ClickToLoadVideoCardProps) {
  const [activated, setActivated] = useState(false);

  const isFacebookVideo =
    sourceUrl?.includes('facebook.com') || youtubeVideoId.startsWith('fb-');

  return (
    <article className="rounded-xl overflow-hidden bg-[#121722] border border-white/10 flex flex-col shadow-lg group">
      <div className="relative aspect-video bg-black overflow-hidden">
        {activated ? (
          isFacebookVideo ? (
            <iframe
              src={`https://www.facebook.com/plugins/video.php?height=314&href=${encodeURIComponent(
                sourceUrl || `https://www.facebook.com/3kfootballclub/videos/${youtubeVideoId}`
              )}&show_text=false&width=560&autoplay=true`}
              title={title}
              allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
              allowFullScreen
              className="w-full h-full border-0"
            />
          ) : (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${youtubeVideoId}?autoplay=1&rel=0`}
              title={title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full border-0"
            />
          )
        ) : (
          <button
            type="button"
            onClick={() => setActivated(true)}
            aria-label={`Play video: ${title}`}
            className="w-full h-full relative text-left flex flex-col justify-between p-4 bg-gradient-to-br from-[#191F2E] via-[#1B1118] to-[#2D0E14] overflow-hidden"
          >
            {/* Direct Thumbnail Image from Facebook / Source */}
            {thumbnailUrl && (
              <img
                src={thumbnailUrl}
                alt={title}
                className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-70 group-hover:scale-105 transition-all duration-500"
                loading="lazy"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/40 pointer-events-none" />

            <div className="relative z-10 flex items-center justify-between w-full">
              <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded bg-club-primary text-white shadow">
                {category.replace(/_/g, ' ')}
              </span>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-black/80 text-white border border-white/15 backdrop-blur-sm">
                {durationLabel}
              </span>
            </div>

            <div className="relative z-10 my-auto flex flex-col items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-club-primary group-hover:bg-red-600 group-hover:scale-110 transition-all flex items-center justify-center shadow-xl border-2 border-white/30">
                <Play className="w-6 h-6 text-white fill-white ml-0.5" />
              </div>
              <span className="text-[11px] font-semibold text-slate-200 mt-2 bg-black/60 px-3 py-0.5 rounded-full backdrop-blur-sm">
                Click to Load Video
              </span>
            </div>

            <div className="relative z-10 flex items-center justify-between text-[11px] text-slate-300">
              <span className="font-semibold">3K FC Official Media</span>
              {hasCaptions && (
                <span className="inline-flex items-center gap-1 text-emerald-300 font-mono text-[10px]">
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
