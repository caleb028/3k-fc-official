'use client';

import React, { useState } from 'react';
import { Camera, ShieldCheck } from 'lucide-react';

interface AuthenticMediaPlaceholderProps {
  category: string;
  label: string;
  sublabel?: string;
  aspectRatio?: 'video' | 'square' | 'portrait' | 'hero';
  imageUrl?: string | null;
  isVerifiedAsset?: boolean;
  className?: string;
}

/**
 * 3K FC Media Component with Direct Image Display & Clean Light Aesthetic:
 * Always displays uploaded or selected photos. When no image is provided or fails,
 * recovers seamlessly with authentic club photography.
 */
export function AuthenticMediaPlaceholder({
  category,
  label,
  sublabel = '3K FC Official Media',
  aspectRatio = 'video',
  imageUrl,
  isVerifiedAsset = true,
  className = '',
}: AuthenticMediaPlaceholderProps) {
  const [imgError, setImgError] = useState(false);

  const aspectClass = {
    video: 'aspect-video',
    square: 'aspect-square',
    portrait: 'aspect-[3/4]',
    hero: 'min-h-[380px] md:min-h-[500px]',
  }[aspectRatio];

  // Resolve final image source with fallback
  const resolvedImg = imgError ? '/images/3k-fc-match-action.jpg' : imageUrl;

  // If image URL is present, render photo directly
  if (resolvedImg) {
    return (
      <div className={`relative overflow-hidden bg-slate-100 ${aspectClass} ${className}`}>
        <img
          src={resolvedImg}
          alt={label}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          loading="lazy"
          onError={() => setImgError(true)}
        />
        {/* Subtle gradient scrim at bottom for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent pointer-events-none" />

        {/* Category Pill Tag */}
        <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 bg-white/95 backdrop-blur-md text-club-primary text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-slate-200 shadow-sm">
          {category}
        </div>
      </div>
    );
  }

  // Fallback clean editorial card
  return (
    <div
      className={`relative overflow-hidden bg-slate-50 border border-slate-200 flex flex-col justify-between p-6 ${aspectClass} ${className}`}
      role="img"
      aria-label={`${label} (${sublabel})`}
    >
      <div className="relative z-10 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-[10px] athletic-label tracking-widest px-2.5 py-1 rounded-full bg-red-50 text-club-primary border border-red-200">
          <Camera className="w-3.5 h-3.5 text-club-primary" />
          {category}
        </span>
        <span className="text-[10px] athletic-label tracking-wider px-2 py-0.5 rounded-full bg-white text-slate-500 border border-slate-200">
          Official Media
        </span>
      </div>

      <div className="relative z-10 my-auto py-4">
        <div className="w-10 h-1 bg-gradient-to-r from-club-primary to-club-gold mb-3 rounded-full" />
        <p className="editorial-headline text-slate-900 text-xl md:text-2xl leading-tight line-clamp-2">
          {label}
        </p>
        <p className="text-xs text-slate-600 mt-2 leading-relaxed">
          {sublabel}
        </p>
      </div>

      <div className="relative z-10 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-200 pt-3">
        <span className="font-bold text-slate-700">3K FC Media Desk</span>
        <span className="text-slate-500 font-medium">Embu, Kenya</span>
      </div>
    </div>
  );
}
