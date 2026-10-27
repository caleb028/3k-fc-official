'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Search,
  Menu,
  X,
  Ticket,
  ShoppingBag,
  User,
  Calendar,
  Home,
  Globe,
  ChevronDown,
  Sparkles,
  HeartHandshake,
  PlayCircle,
  ShieldCheck,
} from 'lucide-react';
import { ClubCrest } from '@/components/ui/ClubCrest';
import { useLanguage } from '@/components/providers/LanguageProvider';

interface PublicHeaderProps {
  paletteStatus?: string;
  crestUrl?: string | null;
  crestConfirmed?: boolean;
  venueConfirmed?: boolean;
  sponsorConfirmed?: boolean;
}

export function PublicHeader({
  crestUrl = '/images/3k-fc-crest.png',
  crestConfirmed = true,
}: PublicHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { locale, setLocale, t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Never render public navigation inside /admin/*
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearchOpen(false);
    router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  const navLinks = [
    { href: '/team', label: 'FIRST TEAM' },
    { href: '/fixtures', label: 'MATCHES' },
    { href: '/table', label: 'STANDINGS' },
    { href: '/news', label: 'NEWS' },
    { href: '/tickets', label: 'TICKETS' },
    { href: '/shop', label: 'STORE' },
    { href: '/supporters', label: 'SUPPORTERS' },
    { href: '/club', label: 'HERITAGE' },
    { href: '/partners', label: 'PARTNERS' },
  ];

  return (
    <>
      {/* TOP UTILITY BAR (Clean Light Luxury) */}
      <div className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs py-2 px-4 select-none">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Club Slogan & Heritage */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-club-primary font-black uppercase tracking-widest text-[11px]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>God&apos;s Favourite Club</span>
            </span>
            <span className="text-slate-300 hidden sm:inline">•</span>
            <span className="text-slate-500 font-semibold text-[11px] hidden sm:inline">
              Home of Stars • Embu County, Kenya
            </span>
          </div>

          {/* Quick Links & Language Switcher */}
          <div className="flex items-center gap-4 text-[11px] font-bold">
            <Link
              href="/videos"
              className="inline-flex items-center gap-1 text-slate-600 hover:text-club-secondary transition"
            >
              <PlayCircle className="w-3.5 h-3.5 text-club-secondary" />
              <span className="hidden sm:inline">3K TV</span>
            </Link>

            <Link
              href="/support-3k"
              className="inline-flex items-center gap-1 text-club-primary hover:underline transition"
            >
              <HeartHandshake className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('nav.donations')}</span>
            </Link>

            {/* Language Switcher */}
            <div
              role="group"
              aria-label="Language Switcher"
              className="inline-flex items-center rounded-full bg-slate-200/70 p-0.5 border border-slate-300"
            >
              <button
                type="button"
                onClick={() => setLocale('en')}
                className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-black transition ${
                  locale === 'en'
                    ? 'bg-club-secondary text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                aria-pressed={locale === 'en'}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLocale('sw')}
                className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-black transition ${
                  locale === 'sw'
                    ? 'bg-club-secondary text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                aria-pressed={locale === 'sw'}
              >
                SW
              </button>
            </div>

            {/* Member Sign-In */}
            <Link
              href="/account"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white hover:bg-slate-100 text-slate-800 font-bold transition border border-slate-300 shadow-xs"
            >
              <User className="w-3 h-3 text-club-secondary" />
              <span>Sign In</span>
            </Link>
          </div>
        </div>
      </div>

      {/* STICKY MAIN HEADER (Clean White with Club Accent Texts) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md text-slate-900 border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-18 md:h-20 gap-4">
            {/* 3K FC Official Crest & Athletic Wordmark */}
            <Link href="/" className="shrink-0 focus:outline-none flex items-center gap-3 group">
              <ClubCrest
                size="md"
                crestUrl={crestUrl}
                crestConfirmed={crestConfirmed}
                showWordmark={true}
                darkText={true}
              />
            </Link>

            {/* Desktop Primary Navigation (Clean High-Contrast Typography) */}
            <nav
              aria-label="Primary Navigation"
              className="hidden xl:flex items-center gap-1"
            >
              {navLinks.map((item) => {
                const isActive =
                  pathname === item.href || pathname?.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`relative px-3.5 py-2 athletic-label text-xs tracking-wider transition ${
                      isActive
                        ? 'text-club-primary font-black'
                        : 'text-slate-700 hover:text-club-secondary hover:bg-slate-100 rounded-lg font-bold'
                    }`}
                  >
                    <span>{item.label}</span>
                    {isActive && (
                      <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-club-primary rounded-full" />
                    )}
                  </Link>
                );
              })}

              {/* More Dropdown */}
              <div className="relative group">
                <button
                  type="button"
                  className="px-2.5 py-2 athletic-label text-xs tracking-wider text-slate-700 hover:text-club-secondary hover:bg-slate-100 rounded-lg inline-flex items-center gap-1 font-bold"
                >
                  <span>MORE</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                <div className="absolute right-0 mt-1 w-52 rounded-xl bg-white border border-slate-200 shadow-xl py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <Link
                    href="/results"
                    className="block px-4 py-2.5 text-xs athletic-label text-slate-700 hover:bg-slate-50 hover:text-club-primary transition font-bold"
                  >
                    Confirmed Results
                  </Link>
                  <Link
                    href="/videos"
                    className="block px-4 py-2.5 text-xs athletic-label text-slate-700 hover:bg-slate-50 hover:text-club-primary transition font-bold"
                  >
                    Video Hub &amp; Highlights
                  </Link>
                  <Link
                    href="/support-3k"
                    className="block px-4 py-2.5 text-xs athletic-label text-slate-700 hover:bg-slate-50 hover:text-club-primary transition font-bold"
                  >
                    Support 3K Donations
                  </Link>
                  <Link
                    href="/contact"
                    className="block px-4 py-2.5 text-xs athletic-label text-slate-700 hover:bg-slate-50 hover:text-club-primary transition font-bold"
                  >
                    Contact &amp; Press Desk
                  </Link>
                </div>
              </div>
            </nav>

            {/* Right Action Areas: Search, Tickets Pill, Store Pill, Mobile Toggle */}
            <div className="flex items-center gap-2.5">
              {/* Accessible Search Trigger */}
              <button
                type="button"
                onClick={() => setSearchOpen((prev) => !prev)}
                aria-label={t('nav.search')}
                className="p-2.5 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
              >
                <Search className="w-4 h-4" />
              </button>

              {/* TICKETS Action Pill */}
              <Link
                href="/tickets"
                className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-full athletic-label text-xs tracking-wider bg-club-primary hover:bg-red-700 text-white font-extrabold shadow-sm transition transform hover:-translate-y-0.5"
              >
                <Ticket className="w-3.5 h-3.5" />
                <span>TICKETS</span>
              </Link>

              {/* STORE Action Pill */}
              <Link
                href="/shop"
                className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-full athletic-label text-xs tracking-wider bg-club-secondary hover:bg-blue-800 text-white font-extrabold shadow-sm transition transform hover:-translate-y-0.5"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>STORE</span>
              </Link>

              {/* Mobile Menu Button */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                aria-expanded={mobileMenuOpen}
                aria-label="Toggle Navigation Menu"
                className="xl:hidden p-2 rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-100"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Subtle Bottom Border Line */}
        <div className="h-0.5 w-full bg-slate-200" />

        {/* Search Drawer Modal */}
        {searchOpen && (
          <div className="border-t border-slate-200 bg-white py-4 px-4 shadow-lg animate-in fade-in duration-200">
            <form
              onSubmit={handleSearchSubmit}
              className="max-w-3xl mx-auto flex items-center gap-2"
              role="search"
            >
              <label htmlFor="global-club-search" className="sr-only">
                Search 3K FC articles, players, fixtures and store merchandise
              </label>
              <input
                id="global-club-search"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  locale === 'sw'
                    ? 'Tafuta habari za 3K FC, wachezaji, ratiba za mechi au jezi...'
                    : 'Search 3K FC news, players, fixtures, results or official jerseys...'
                }
                className="flex-1 bg-slate-50 border border-slate-300 rounded-full px-5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-club-secondary"
                autoFocus
              />
              <button
                type="submit"
                className="px-6 py-2.5 rounded-full bg-club-secondary hover:bg-blue-800 text-white athletic-label text-xs tracking-wider transition"
              >
                Search
              </button>
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="p-2.5 rounded-full text-slate-500 hover:text-slate-800"
                aria-label="Close Search"
              >
                <X className="w-5 h-5" />
              </button>
            </form>
          </div>
        )}

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="xl:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-2 shadow-xl">
            <div className="grid grid-cols-2 gap-2 pt-2">
              {navLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs athletic-label tracking-wider text-slate-800 transition flex items-center justify-between border border-slate-200"
                >
                  <span>{item.label}</span>
                </Link>
              ))}
              <Link
                href="/videos"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs athletic-label tracking-wider text-slate-800 transition border border-slate-200"
              >
                3K TV / Highlights
              </Link>
              <Link
                href="/support-3k"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-xs athletic-label tracking-wider text-club-primary transition"
              >
                Support 3K Donations
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Mobile Bottom Thumb-Friendly Bar */}
      <nav
        aria-label="Mobile Quick Navigation"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 flex items-center justify-around py-2 px-1 text-[10px] font-bold uppercase tracking-wider text-slate-600 shadow-lg"
      >
        <Link
          href="/"
          className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded ${
            pathname === '/' ? 'text-club-primary font-black' : 'hover:text-slate-900'
          }`}
        >
          <Home className="w-5 h-5" />
          <span>Home</span>
        </Link>
        <Link
          href="/fixtures"
          className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded ${
            pathname?.startsWith('/fixtures') || pathname?.startsWith('/matches')
              ? 'text-club-primary font-black'
              : 'hover:text-slate-900'
          }`}
        >
          <Calendar className="w-5 h-5" />
          <span>Matches</span>
        </Link>
        <Link
          href="/tickets"
          className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-full bg-club-primary text-white shadow-sm font-black"
        >
          <Ticket className="w-5 h-5" />
          <span>Tickets</span>
        </Link>
        <Link
          href="/shop"
          className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded ${
            pathname?.startsWith('/shop') ? 'text-club-primary font-black' : 'hover:text-slate-900'
          }`}
        >
          <ShoppingBag className="w-5 h-5" />
          <span>Store</span>
        </Link>
        <Link
          href="/account"
          className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded ${
            pathname?.startsWith('/account') ? 'text-club-primary font-black' : 'hover:text-slate-900'
          }`}
        >
          <User className="w-5 h-5" />
          <span>Account</span>
        </Link>
      </nav>
    </>
  );
}
