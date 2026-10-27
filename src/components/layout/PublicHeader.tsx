'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement | null>(null);

  // Close "MORE" dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setMoreMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
      {/* STICKY MAIN HEADER (Clean White with Enlarged Standalone Club Crest) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md text-slate-900 border-b border-slate-200 shadow-xs">
        {/* Brand Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between min-h-[76px] sm:min-h-[88px] py-2 gap-4">
            {/* 3K FC Official Standalone Enlarged Crest (No text, No slogan) */}
            <Link
              href="/"
              className="shrink-0 focus:outline-none flex items-center group py-1"
              aria-label="3K Football Club Official Homepage"
            >
              <ClubCrest
                size="lg"
                crestUrl={crestUrl}
                crestConfirmed={crestConfirmed}
                showWordmark={false}
              />
            </Link>

            {/* Right Action Areas: Language Switcher, Sign In, Search, Tickets Pill, Store Pill, Mobile Toggle */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Language Switcher */}
              <div
                role="group"
                aria-label="Language Switcher"
                className="inline-flex items-center rounded-full bg-slate-100 p-0.5 border border-slate-300"
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

              {/* Accessible Search Trigger */}
              <button
                type="button"
                onClick={() => setSearchOpen((prev) => !prev)}
                aria-label={t('nav.search')}
                className="p-2 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
              >
                <Search className="w-4 h-4" />
              </button>

              {/* Member Sign-In */}
              <Link
                href="/account"
                className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition border border-slate-300 shadow-xs"
              >
                <User className="w-3.5 h-3.5 text-club-secondary" />
                <span>Sign In</span>
              </Link>

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

        {/* PRIMARY NAVIGATION BAR (Matches Uploaded Screenshot Exactly: FIRST TEAM, MATCHES, STANDINGS, NEWS, TICKETS, STORE, SUPPORTERS, HERITAGE, PARTNERS, MORE ˇ) */}
        <div className="border-t border-slate-200 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <nav
              aria-label="Official Club Navigation"
              className="flex items-center justify-start md:justify-center gap-5 sm:gap-7 md:gap-8 lg:gap-10 py-2.5 overflow-x-auto no-scrollbar scroll-smooth"
            >
              {/* 1. FIRST TEAM (Two lines stacked exactly as in image) */}
              <Link
                href="/team"
                className={`shrink-0 athletic-label text-xs tracking-wider transition px-1 py-1 flex flex-col items-center justify-center text-center leading-none ${
                  pathname === '/team' || pathname?.startsWith('/team/')
                    ? 'text-club-primary font-black border-b-2 border-club-primary pb-0.5'
                    : 'text-slate-800 hover:text-club-primary font-bold'
                }`}
              >
                <span className="block text-[11px] font-extrabold tracking-wider leading-none">FIRST</span>
                <span className="block text-[11px] font-extrabold tracking-wider leading-none mt-0.5">TEAM</span>
              </Link>

              {/* 2. MATCHES */}
              <Link
                href="/fixtures"
                className={`shrink-0 athletic-label text-xs tracking-wider transition px-1 py-2 ${
                  pathname === '/fixtures' || pathname?.startsWith('/fixtures') || pathname === '/matches'
                    ? 'text-club-primary font-black border-b-2 border-club-primary'
                    : 'text-slate-800 hover:text-club-primary font-bold'
                }`}
              >
                <span>MATCHES</span>
              </Link>

              {/* 3. STANDINGS */}
              <Link
                href="/table"
                className={`shrink-0 athletic-label text-xs tracking-wider transition px-1 py-2 ${
                  pathname === '/table' || pathname?.startsWith('/table') || pathname === '/standings'
                    ? 'text-club-primary font-black border-b-2 border-club-primary'
                    : 'text-slate-800 hover:text-club-primary font-bold'
                }`}
              >
                <span>STANDINGS</span>
              </Link>

              {/* 4. NEWS */}
              <Link
                href="/news"
                className={`shrink-0 athletic-label text-xs tracking-wider transition px-1 py-2 ${
                  pathname === '/news' || pathname?.startsWith('/news')
                    ? 'text-club-primary font-black border-b-2 border-club-primary'
                    : 'text-slate-800 hover:text-club-primary font-bold'
                }`}
              >
                <span>NEWS</span>
              </Link>

              {/* 5. TICKETS */}
              <Link
                href="/tickets"
                className={`shrink-0 athletic-label text-xs tracking-wider transition px-1 py-2 ${
                  pathname === '/tickets' || pathname?.startsWith('/tickets')
                    ? 'text-club-primary font-black border-b-2 border-club-primary'
                    : 'text-slate-800 hover:text-club-primary font-bold'
                }`}
              >
                <span>TICKETS</span>
              </Link>

              {/* 6. STORE */}
              <Link
                href="/shop"
                className={`shrink-0 athletic-label text-xs tracking-wider transition px-1 py-2 ${
                  pathname === '/shop' || pathname?.startsWith('/shop') || pathname === '/store'
                    ? 'text-club-primary font-black border-b-2 border-club-primary'
                    : 'text-slate-800 hover:text-club-primary font-bold'
                }`}
              >
                <span>STORE</span>
              </Link>

              {/* 7. SUPPORTERS */}
              <Link
                href="/supporters"
                className={`shrink-0 athletic-label text-xs tracking-wider transition px-1 py-2 ${
                  pathname === '/supporters' || pathname?.startsWith('/supporters')
                    ? 'text-club-primary font-black border-b-2 border-club-primary'
                    : 'text-slate-800 hover:text-club-primary font-bold'
                }`}
              >
                <span>SUPPORTERS</span>
              </Link>

              {/* 8. HERITAGE */}
              <Link
                href="/club"
                className={`shrink-0 athletic-label text-xs tracking-wider transition px-1 py-2 ${
                  pathname === '/club' || pathname?.startsWith('/club') || pathname === '/heritage'
                    ? 'text-club-primary font-black border-b-2 border-club-primary'
                    : 'text-slate-800 hover:text-club-primary font-bold'
                }`}
              >
                <span>HERITAGE</span>
              </Link>

              {/* 9. PARTNERS */}
              <Link
                href="/partners"
                className={`shrink-0 athletic-label text-xs tracking-wider transition px-1 py-2 ${
                  pathname === '/partners' || pathname?.startsWith('/partners')
                    ? 'text-club-primary font-black border-b-2 border-club-primary'
                    : 'text-slate-800 hover:text-club-primary font-bold'
                }`}
              >
                <span>PARTNERS</span>
              </Link>

              {/* 10. MORE ˇ (Interactive Dropdown) */}
              <div className="relative shrink-0" ref={moreMenuRef}>
                <button
                  type="button"
                  onClick={() => setMoreMenuOpen((prev) => !prev)}
                  className={`athletic-label text-xs tracking-wider transition px-1 py-2 inline-flex items-center gap-1 font-bold ${
                    moreMenuOpen ? 'text-club-primary font-black' : 'text-slate-800 hover:text-club-primary'
                  }`}
                  aria-expanded={moreMenuOpen}
                >
                  <span>MORE</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      moreMenuOpen ? 'rotate-180 text-club-primary' : ''
                    }`}
                  />
                </button>

                {moreMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white border border-slate-200 shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2">
                    <Link
                      href="/results"
                      onClick={() => setMoreMenuOpen(false)}
                      className="block px-4 py-2.5 text-xs athletic-label text-slate-800 hover:bg-slate-50 hover:text-club-primary transition font-bold"
                    >
                      Confirmed Results
                    </Link>
                    <Link
                      href="/videos"
                      onClick={() => setMoreMenuOpen(false)}
                      className="block px-4 py-2.5 text-xs athletic-label text-slate-800 hover:bg-slate-50 hover:text-club-primary transition font-bold"
                    >
                      Video Hub &amp; Highlights
                    </Link>
                    <Link
                      href="/support-3k"
                      onClick={() => setMoreMenuOpen(false)}
                      className="block px-4 py-2.5 text-xs athletic-label text-slate-800 hover:bg-slate-50 hover:text-club-primary transition font-bold"
                    >
                      Support 3K Donations
                    </Link>
                    <Link
                      href="/contact"
                      onClick={() => setMoreMenuOpen(false)}
                      className="block px-4 py-2.5 text-xs athletic-label text-slate-800 hover:bg-slate-50 hover:text-club-primary transition font-bold"
                    >
                      Contact &amp; Press Desk
                    </Link>
                    <Link
                      href="/club"
                      onClick={() => setMoreMenuOpen(false)}
                      className="block px-4 py-2.5 text-xs athletic-label text-slate-800 hover:bg-slate-50 hover:text-club-primary transition font-bold"
                    >
                      Moi Stadium Fortress
                    </Link>
                    <Link
                      href="/account"
                      onClick={() => setMoreMenuOpen(false)}
                      className="block px-4 py-2.5 text-xs athletic-label text-slate-800 hover:bg-slate-50 hover:text-club-primary transition font-bold"
                    >
                      Fan Account &amp; Pass
                    </Link>
                  </div>
                )}
              </div>
            </nav>
          </div>
        </div>

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
          <div className="xl:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-2 shadow-xl animate-in fade-in slide-in-from-top-2">
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Link
                href="/team"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs athletic-label tracking-wider text-slate-800 transition flex items-center justify-between border border-slate-200"
              >
                <span>FIRST TEAM</span>
              </Link>
              <Link
                href="/fixtures"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs athletic-label tracking-wider text-slate-800 transition flex items-center justify-between border border-slate-200"
              >
                <span>MATCHES</span>
              </Link>
              <Link
                href="/table"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs athletic-label tracking-wider text-slate-800 transition flex items-center justify-between border border-slate-200"
              >
                <span>STANDINGS</span>
              </Link>
              <Link
                href="/news"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs athletic-label tracking-wider text-slate-800 transition flex items-center justify-between border border-slate-200"
              >
                <span>NEWS</span>
              </Link>
              <Link
                href="/tickets"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-3 rounded-xl bg-red-50 hover:bg-red-100 text-xs athletic-label tracking-wider text-club-primary font-bold transition flex items-center justify-between border border-red-200"
              >
                <span>TICKETS</span>
              </Link>
              <Link
                href="/shop"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-xs athletic-label tracking-wider text-club-secondary font-bold transition flex items-center justify-between border border-blue-200"
              >
                <span>STORE</span>
              </Link>
              <Link
                href="/supporters"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs athletic-label tracking-wider text-slate-800 transition flex items-center justify-between border border-slate-200"
              >
                <span>SUPPORTERS</span>
              </Link>
              <Link
                href="/club"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs athletic-label tracking-wider text-slate-800 transition flex items-center justify-between border border-slate-200"
              >
                <span>HERITAGE</span>
              </Link>
              <Link
                href="/partners"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs athletic-label tracking-wider text-slate-800 transition flex items-center justify-between border border-slate-200"
              >
                <span>PARTNERS</span>
              </Link>
              <Link
                href="/results"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs athletic-label tracking-wider text-slate-800 transition flex items-center justify-between border border-slate-200"
              >
                <span>RESULTS</span>
              </Link>
              <Link
                href="/videos"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs athletic-label tracking-wider text-slate-800 transition flex items-center justify-between border border-slate-200"
              >
                <span>3K TV / VIDEOS</span>
              </Link>
              <Link
                href="/support-3k"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-xs athletic-label tracking-wider text-club-primary transition flex items-center justify-between"
              >
                <span>SUPPORT 3K</span>
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
