import React from 'react';
import Link from 'next/link';
import { WifiOff, Home, ArrowLeft } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 text-center">
      <div className="max-w-md space-y-4 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
        <WifiOff className="w-12 h-12 text-slate-400 mx-auto" />
        <h1 className="editorial-headline font-black text-2xl text-slate-900">
          You are currently offline
        </h1>
        <p className="text-xs text-slate-600 leading-relaxed">
          Please check your internet or mobile data connection. Previously loaded public news and fixture shells remain cached in your PWA.
        </p>
        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-club-primary text-white text-xs font-bold uppercase tracking-wider"
          >
            <Home className="w-4 h-4" />
            <span>Return to Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
