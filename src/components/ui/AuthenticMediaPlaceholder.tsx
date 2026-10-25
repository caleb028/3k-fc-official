import React from 'react';
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
 * FC Barcelona-Style Media Component with Strict Photographic Integrity Guard:
 * Only genuine 3K FC club photographs are displayed with authentic verification badges.
 * If authentic assets are unavailable, displays a clean, elegant FC Barcelona-style placeholder.
 */
export function AuthenticMediaPlaceholder({
  category,
  label,
  sublabel = '3K FC Official Media',
  aspectRatio = 'video',
  imageUrl,
  isVerifiedAsset = false,
  className = '',
}: AuthenticMediaPlaceholderProps) {
  const aspectClass = {
    video: 'aspect-video',
    square: 'aspect-square',
    portrait: 'aspect-[3/4]',
    hero: 'min-h-[380px] md:min-h-[500px]',
  }[aspectRatio];

  if (imageUrl && isVerifiedAsset) {
    return (
      <div className={`relative overflow-hidden bg-[#081326] ${aspectClass} ${className}`}>
        <img
          src={imageUrl}
          alt={label}
          className="w-full h-full object-cover barca-img-zoom"
          loading="lazy"
        />
        {/* Subtle gradient scrim at bottom for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

        {/* Category Pill Tag */}
        <div className="absolute top-3 left-3 inline-flex items-center gap-1 bg-[#0E4494]/90 backdrop-blur-md text-white text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full border border-white/20 shadow-md">
          {category}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-br from-[#081326] via-[#0E1E3A] to-[#160B12] border border-white/10 flex flex-col justify-between p-6 ${aspectClass} ${className}`}
      role="img"
      aria-label={`${label} (${sublabel})`}
    >
      {/* Subtle Blaugrana geometric glow */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 85% 15%, rgba(225, 29, 42, 0.5), transparent 50%), radial-gradient(circle at 15% 85%, rgba(14, 68, 148, 0.6), transparent 55%)',
        }}
      />

      <div className="relative z-10 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full bg-[#0E4494]/40 text-amber-300 border border-amber-400/30">
          <Camera className="w-3.5 h-3.5 text-amber-400" />
          {category}
        </span>
        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-black/60 text-slate-300 border border-white/10">
          Official Media
        </span>
      </div>

      <div className="relative z-10 my-auto py-4">
        <div className="w-10 h-1 bg-gradient-to-r from-club-red to-club-gold mb-3 rounded-full" />
        <p className="editorial-headline text-white text-xl md:text-2xl leading-tight line-clamp-2">
          {label}
        </p>
        <p className="text-xs text-slate-300 mt-2 leading-relaxed">
          {sublabel}
        </p>
      </div>

      <div className="relative z-10 flex items-center justify-between text-[11px] text-slate-400 border-t border-white/10 pt-3">
        <span className="font-semibold text-slate-300">3K FC Official Media</span>
        <span className="text-slate-400 font-medium">Embu, Kenya</span>
      </div>
    </div>
  );
}
