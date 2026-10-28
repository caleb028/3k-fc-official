'use client';

import React, { useState } from 'react';

interface ClubCrestProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  crestUrl?: string | null;
  crestConfirmed?: boolean;
  showWordmark?: boolean;
  className?: string;
  darkText?: boolean;
}

export function ClubCrest({
  size = 'md',
  crestUrl = '/images/3k-fc-crest.png',
  crestConfirmed = true,
  showWordmark = false,
  className = '',
  darkText = false,
}: ClubCrestProps) {
  const [imageError, setImageError] = useState(false);

  const dimensions = {
    sm: 'w-9 h-9',
    md: 'w-10 h-10 md:w-12 md:h-12',
    lg: 'w-12 h-12 md:w-14 md:h-14',
    xl: 'w-16 h-16 md:w-20 md:h-20',
    '2xl': 'w-24 h-24 sm:w-32 sm:h-32',
  }[size];

  const resolvedCrestUrl = crestUrl || '/images/3k-fc-crest.png';

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {crestConfirmed ? (
        <div className={`${dimensions} shrink-0 relative rounded-full overflow-hidden bg-white shadow-md border-2 border-club-blue flex items-center justify-center`}>
          {!imageError ? (
            <img
              src={resolvedCrestUrl}
              alt="3K Football Club Official Crest"
              className="w-full h-full object-contain"
              onError={() => setImageError(true)}
            />
          ) : (
            <svg viewBox="0 0 100 100" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <circle cx="50" cy="50" r="48" fill="#0E4494" />
              <circle cx="50" cy="50" r="44" fill="#E11D2A" />
              <circle cx="50" cy="32" r="32" fill="#FFFFFF" />
              <path d="M50 24 L56 38 L70 38 L59 47 L63 61 L50 52 L37 61 L41 47 L30 38 L44 38 Z" fill="#D4AF37" />
              <text x="50" y="74" fontSize="10" fontWeight="900" fill="#0E4494" textAnchor="middle" fontFamily="sans-serif">3K FC</text>
            </svg>
          )}
        </div>
      ) : (
        <div
          className={`${dimensions} relative rounded-full bg-gradient-to-br from-[#E11D2A] via-[#0E4494] to-[#0A2E68] border-2 border-[#D4AF37] flex flex-col items-center justify-center shadow-md`}
          title="3K Football Club Official Crest"
          aria-label="3K FC Official Crest"
        >
          <span className="font-display font-black tracking-tighter text-white leading-none text-xs">
            3K
          </span>
          <span className="text-[8px] font-bold tracking-widest text-[#D4AF37] uppercase leading-none mt-0.5">
            EMBU
          </span>
        </div>
      )}

      {showWordmark && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className={`font-display font-black text-lg md:text-xl tracking-tight leading-none ${darkText ? 'text-slate-900' : 'text-white'}`}>
              3K FC
            </span>
            <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-club-red text-white border border-white/20 shadow-sm">
              EMBU
            </span>
          </div>
          <span className={`text-[11px] tracking-wide font-bold mt-0.5 uppercase ${darkText ? 'text-club-primary' : 'text-club-gold'}`}>
            Home of Stars • Est. 2013
          </span>
        </div>
      )}
    </div>
  );
}
