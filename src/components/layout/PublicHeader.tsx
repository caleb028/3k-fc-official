'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Search,
  Menu,
  X,
  User,
  ShoppingBag,
  ChevronDown,
  ChevronRight,
  Home,
  Calendar,
  Ticket,
} from 'lucide-react';
import { ClubCrest } from '@/components/ui/ClubCrest';
import { useLanguage } from '@/components/providers/LanguageProvider';

interface NavItem {
  key: string;
  label: string;
  href?: string;
  children?: { href: string; label: string; badge?: string }[];
}

const NAV_ITEMS: NavItem[] = [
  {
    key: 'news',
    label: 'News',
    href: '/news',
  },
  {
    key: 'video',
    label: 'Video',
    href: '/videos',
    children: [
      { href: '/videos', label: 'All 3K TV Videos' },
      { href: '/videos?category=HIGHLIGHTS', label: 'Match Highlights' },
      { href: '/videos?category=INTERVIEWS', label: 'Interviews & Reactions' },
      { href: '/videos?category=TRAINING', label: 'Training Sessions' },
      { href: '/videos?category=BEHIND_THE_SCENES', label: 'Behind The Scenes' },
    ],
  },
  {
    key: 'fixtures',
    label: 'Fixtures',
    href: '/fixtures',
    children: [
      { href: '/fixtures', label: 'Upcoming Fixtures' },
      { href: '/results', label: 'Match Results' },
      { href: '/table', label: 'League Standings' },
      { href: '/matches', label: 'Live Match Centre' },
    ],
  },
  {
    key: 'tickets',
    label: 'Tickets',
    href: '/tickets',
    children: [
      { href: '/tickets', label: 'Matchday Tickets' },
      { href: '/tickets#memberships', label: 'Season Memberships' },
      { href: '/ticket-terms', label: 'Gate QR & Entry Policy' },
      { href: '/news/fb-official-fan-travel-convoy-and-ticketing-advisory', label: 'Away Travel Advisory' },
    ],
  },
  {
    key: 'shop',
    label: 'Shop',
    href: '/shop',
    children: [
      { href: '/shop', label: 'Official Club Store' },
      { href: '/shop?category=KITS', label: 'Match Kits (Home, Away, Third)' },
      { href: '/shop?category=TRAINING', label: 'Training & Warmup Gear' },
      { href: '/shop?category=ACCESSORIES', label: 'Accessories & Memorabilia' },
    ],
  },
  {
    key: 'players',
    label: 'Players',
    href: '/team',
  },
  {
    key: 'club',
    label: 'Club',
    href: '/club',
    children: [
      { href: '/club', label: 'Club Heritage & Story' },
      { href: '/club#stadium', label: 'Moi Stadium Fortress' },
      { href: '/supporters', label: 'Supporters Club & Branches' },
      { href: '/team#staff', label: 'Technical Bench & Management' },
    ],
  },
  {
    key: 'more',
    label: 'More',
    children: [
      { href: '/partners', label: 'Official Partners & Sponsors' },
      { href: '/support-3k', label: 'Support 3K FC Fund' },
      { href: '/contact', label: 'Contact & Press Desk' },
      { href: '/account', label: 'Fan Account & Digital Pass' },
    ],
  },
];

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

  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileExpandedSection, setMobileExpandedSection] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const navContainerRef = useRef<HTMLDivElement | null>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Close dropdown on route change
  useEffect(() => {
    setOpenDropdown(null);
    setMobileMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile navigation drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (navContainerRef.current && !navContainerRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Never render public navigation inside /admin/*
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  const handleMouseEnter = (key: string) => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    setOpenDropdown(key);
  };

  const handleMouseLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setOpenDropdown(null);
    }, 180);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearchOpen(false);
    router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  const isItemActive = (item: NavItem): boolean => {
    if (item.href && (pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href)))) {
      return true;
    }
    if (item.children?.some((child) => pathname === child.href || (child.href !== '/' && pathname.startsWith(child.href.split('?')[0])))) {
      return true;
    }
    return false;
  };

  return (
    <>
      {/* SINGLE UNIFIED STICKY NAVBAR (Man City inspired luxury athletic bar) */}
      <header
        ref={navContainerRef}
        className="sticky top-0 z-50 bg-white/95 backdrop-blur-md text-slate-900 border-b border-slate-200 shadow-xs"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-18 md:h-20 gap-3 md:gap-6">
            {/* 1. STANDALONE ENLARGED CLUB CREST (No text, No slogan) */}
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

            {/* 2. UNIFIED HORIZONTAL NAVIGATION BAR (Title Case with Dropdowns) */}
            <nav
              aria-label="Primary Navigation"
              className="hidden xl:flex items-center gap-1 lg:gap-2 flex-1 justify-start ml-2"
            >
              {NAV_ITEMS.map((item) => {
                const hasChildren = !!item.children && item.children.length > 0;
                const isOpen = openDropdown === item.key;
                const active = isItemActive(item);

                return (
                  <div
                    key={item.key}
                    className="relative"
                    onMouseEnter={() => (hasChildren ? handleMouseEnter(item.key) : undefined)}
                    onMouseLeave={() => (hasChildren ? handleMouseLeave() : undefined)}
                  >
                    {hasChildren ? (
                      <button
                        type="button"
                        onClick={() => setOpenDropdown(isOpen ? null : item.key)}
                        aria-expanded={isOpen}
                        className={`inline-flex items-center gap-1 px-3 py-2 rounded-lg text-[15px] font-semibold transition-colors ${
                          active
                            ? 'text-club-primary font-bold'
                            : 'text-slate-800 hover:text-club-primary hover:bg-slate-50'
                        }`}
                      >
                        <span>{item.label}</span>
                        <ChevronDown
                          className={`w-3.5 h-3.5 transition-transform duration-200 ${
                            isOpen ? 'rotate-180 text-club-primary' : 'opacity-60'
                          }`}
                        />
                      </button>
                    ) : (
                      <Link
                        href={item.href || '#'}
                        className={`inline-flex items-center px-3 py-2 rounded-lg text-[15px] font-semibold transition-colors ${
                          active
                            ? 'text-club-primary font-bold'
                            : 'text-slate-800 hover:text-club-primary hover:bg-slate-50'
                        }`}
                      >
                        <span>{item.label}</span>
                      </Link>
                    )}

                    {/* Floating Dropdown Menu Panel */}
                    {hasChildren && isOpen && (
                      <div
                        className="absolute left-0 top-full pt-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                        onMouseEnter={() => handleMouseEnter(item.key)}
                        onMouseLeave={handleMouseLeave}
                      >
                        <div className="w-64 rounded-2xl bg-white border border-slate-200 shadow-2xl py-2.5 px-1.5 backdrop-blur-md">
                          {item.children!.map((child) => {
                            const isChildActive = pathname === child.href.split('?')[0];
                            return (
                              <Link
                                key={child.href}
                                href={child.href}
                                onClick={() => setOpenDropdown(null)}
                                className={`px-3.5 py-2.5 rounded-xl text-sm font-semibold transition flex items-center justify-between group ${
                                  isChildActive
                                    ? 'bg-slate-50 text-club-primary'
                                    : 'text-slate-700 hover:bg-slate-50 hover:text-club-primary'
                                }`}
                              >
                                <span>{child.label}</span>
                                <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-club-primary transition-opacity" />
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>

            {/* 3. RIGHT ACTION SUITE: Search, Sign In, Cart, Presented by Mozzart, Lang, Mobile Menu */}
            <div className="flex items-center gap-2 md:gap-3">
              {/* Language Switcher (EN / SW) */}
              <div
                role="group"
                aria-label="Language Switcher"
                className="hidden sm:inline-flex items-center rounded-full bg-slate-100 p-0.5 border border-slate-300 text-[10px] font-black"
              >
                <button
                  type="button"
                  onClick={() => setLocale('en')}
                  className={`px-2 py-0.5 rounded-full transition ${
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
                  className={`px-2 py-0.5 rounded-full transition ${
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
                className="p-2 rounded-full text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Sign in Pill Button (Avatar circle + 'Sign in') */}
              <Link
                href="/account"
                className="hidden md:inline-flex items-center gap-2 pl-1.5 pr-3.5 py-1.5 rounded-full bg-slate-100/90 hover:bg-slate-200/90 border border-slate-300/80 text-sm font-semibold text-slate-900 transition shadow-xs group"
                title="Member Sign in"
              >
                <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center shrink-0">
                  <User className="w-3.5 h-3.5" />
                </div>
                <span>Sign in</span>
              </Link>

              {/* Shopping Bag / Cart with Badge */}
              <Link
                href="/shop"
                className="relative p-2 rounded-full text-slate-800 hover:text-slate-950 hover:bg-slate-100 transition flex items-center justify-center"
                aria-label="Shopping Bag"
                title="Official Store & Cart"
              >
                <ShoppingBag className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-slate-900 text-white text-[10px] font-black flex items-center justify-center shadow-xs">
                  0
                </span>
              </Link>

              {/* Sponsor Integration: PRESENTED BY MOZZART (Exact match to Wix on Man City bar) */}
              <Link
                href="/partners"
                className="hidden lg:flex flex-col items-start leading-none pl-3 border-l border-slate-200 group"
                title="Mozzart Bet Kenya — Principal Partner"
              >
                <span className="text-[8px] font-black tracking-widest text-slate-400 uppercase">
                  PRESENTED BY
                </span>
                <span className="sponsor-badge-mozzart text-xs px-2 py-0.5 mt-0.5 group-hover:scale-105 transition-transform">
                  MOZZART
                </span>
              </Link>

              {/* Mobile Menu Toggle Button */}
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

        {/* Global Search Drawer Modal */}
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

        {/* Mobile Sub-Header Quick Navigation Pills (Man City Style) */}
        <div className="xl:hidden bg-slate-50 border-t border-slate-200 px-3 py-2 overflow-x-auto scrollbar-none flex items-center gap-1.5 text-xs font-bold whitespace-nowrap">
          <Link
            href="/news"
            className={`px-3 py-1 rounded-full transition text-[11px] font-bold ${
              pathname?.startsWith('/news')
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-800 hover:bg-slate-100'
            }`}
          >
            News
          </Link>
          <Link
            href="/fixtures"
            className={`px-3 py-1 rounded-full transition text-[11px] font-bold ${
              pathname?.startsWith('/fixtures') || pathname?.startsWith('/matches')
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-800 hover:bg-slate-100'
            }`}
          >
            Fixtures
          </Link>
          <Link
            href="/tickets"
            className={`px-3 py-1 rounded-full transition text-[11px] font-bold ${
              pathname?.startsWith('/tickets')
                ? 'bg-club-primary text-white shadow-xs'
                : 'bg-red-50 text-club-primary border border-red-200 hover:bg-red-100'
            }`}
          >
            Tickets
          </Link>
          <Link
            href="/shop"
            className={`px-3 py-1 rounded-full transition text-[11px] font-bold ${
              pathname?.startsWith('/shop')
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-800 hover:bg-slate-100'
            }`}
          >
            Shop
          </Link>
          <Link
            href="/videos"
            className={`px-3 py-1 rounded-full transition text-[11px] font-bold ${
              pathname?.startsWith('/videos')
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-800 hover:bg-slate-100'
            }`}
          >
            3K TV
          </Link>
          <Link
            href="/table"
            className={`px-3 py-1 rounded-full transition text-[11px] font-bold ${
              pathname?.startsWith('/table')
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-800 hover:bg-slate-100'
            }`}
          >
            Table
          </Link>
          <Link
            href="/team"
            className={`px-3 py-1 rounded-full transition text-[11px] font-bold ${
              pathname?.startsWith('/team')
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-800 hover:bg-slate-100'
            }`}
          >
            Squad
          </Link>
          <Link
            href="/club#stadium"
            className="px-3 py-1 rounded-full transition text-[11px] font-bold bg-white border border-slate-200 text-slate-800 hover:bg-slate-100"
          >
            Moi Stadium
          </Link>
        </div>
      </header>

      {/* Full-Screen Off-Canvas Mobile Drawer (Man City App Style) */}
      {mobileMenuOpen && (
        <div className="xl:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end animate-in fade-in duration-200">
          <div className="bg-white w-full h-[90vh] rounded-t-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
            {/* Drawer Top Handle & Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <ClubCrest
                  size="sm"
                  crestUrl={crestUrl}
                  crestConfirmed={crestConfirmed}
                  showWordmark={false}
                />
                <div>
                  <p className="athletic-label text-[10px] font-extrabold text-club-primary tracking-wider">
                    OFFICIAL FAN HUB
                  </p>
                  <h3 className="editorial-headline text-base font-black text-slate-950">
                    3K FOOTBALL CLUB
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="w-9 h-9 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-800 transition"
                aria-label="Close navigation menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {/* In-Drawer Quick Search Form */}
              <form onSubmit={handleSearchSubmit} className="relative">
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search news, players, fixtures, jerseys..."
                  className="w-full bg-slate-100 border border-slate-300 rounded-full pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-club-secondary"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </form>

              {/* Fan Account Card (Cityzens / 3K Fans Style) */}
              <div className="rounded-2xl bg-gradient-to-r from-slate-950 to-slate-900 p-4 text-white shadow-md">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] athletic-label font-bold tracking-widest text-slate-400">
                    3K FC DIGITAL FAN HUB
                  </span>
                  <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-white" />
                  </div>
                </div>
                <p className="editorial-headline text-lg font-black">Join the 3K FC Family</p>
                <p className="text-xs text-slate-300 mt-0.5 mb-3 leading-relaxed">
                  Sign in for instant M-Pesa QR tickets, matchday turnstile gate access &amp; official store perks.
                </p>
                <div className="flex items-center gap-2">
                  <Link
                    href="/account"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 py-2 px-3 rounded-full bg-club-primary hover:bg-red-700 text-white text-xs font-bold text-center athletic-label tracking-wider shadow-xs transition"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/tickets"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 py-2 px-3 rounded-full bg-white/15 hover:bg-white/25 text-white text-xs font-bold text-center athletic-label tracking-wider transition"
                  >
                    Get Tickets
                  </Link>
                </div>
              </div>

              {/* Mobile Navigation Accordion Categories */}
              <div className="space-y-1.5">
                {NAV_ITEMS.map((item) => {
                  const hasChildren = !!item.children && item.children.length > 0;
                  const isExpanded = mobileExpandedSection === item.key;

                  if (!hasChildren) {
                    return (
                      <Link
                        key={item.key}
                        href={item.href || '#'}
                        onClick={() => setMobileMenuOpen(false)}
                        className="block px-4 py-3 rounded-xl text-base font-semibold text-slate-800 hover:bg-slate-100 hover:text-club-primary transition"
                      >
                        {item.label}
                      </Link>
                    );
                  }

                  return (
                    <div key={item.key} className="rounded-xl border border-slate-200 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setMobileExpandedSection(isExpanded ? null : item.key)}
                        className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-base font-bold text-slate-900 transition"
                      >
                        <span>{item.label}</span>
                        <ChevronDown
                          className={`w-4 h-4 transition-transform duration-200 ${
                            isExpanded ? 'rotate-180 text-club-primary' : 'text-slate-400'
                          }`}
                        />
                      </button>

                      {isExpanded && (
                        <div className="bg-white px-2 py-2 space-y-1 border-t border-slate-100">
                          {item.children!.map((child) => (
                            <Link
                              key={child.href}
                              href={child.href}
                              onClick={() => setMobileMenuOpen(false)}
                              className="block px-3.5 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-club-primary transition"
                            >
                              {child.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Language & Partner Footer inside Drawer */}
              <div className="pt-4 border-t border-slate-200 space-y-3 pb-8">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600">Language / Lugha</span>
                  <div
                    role="group"
                    aria-label="Language Selector"
                    className="inline-flex items-center rounded-full bg-slate-100 p-0.5 border border-slate-300 text-[10px] font-black"
                  >
                    <button
                      type="button"
                      onClick={() => setLocale('en')}
                      className={`px-3 py-1 rounded-full transition ${
                        locale === 'en' ? 'bg-club-secondary text-white' : 'text-slate-600'
                      }`}
                    >
                      English
                    </button>
                    <button
                      type="button"
                      onClick={() => setLocale('sw')}
                      className={`px-3 py-1 rounded-full transition ${
                        locale === 'sw' ? 'bg-club-secondary text-white' : 'text-slate-600'
                      }`}
                    >
                      Kiswahili
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Principal Sponsor
                  </span>
                  <Link
                    href="/partners"
                    onClick={() => setMobileMenuOpen(false)}
                    className="sponsor-badge-mozzart text-xs px-3 py-1 shadow-xs"
                  >
                    MOZZART BET
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Thumb-Friendly Navigation Bar */}
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
          className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-full bg-club-primary text-white shadow-sm font-black transform hover:scale-105 transition"
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
        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded ${
            mobileMenuOpen ? 'text-club-primary font-black' : 'hover:text-slate-900'
          }`}
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
          <span>Menu</span>
        </button>
      </nav>
    </>
  );
}
