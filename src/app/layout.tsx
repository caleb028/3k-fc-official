import type { Metadata, Viewport } from 'next';
import { cookies } from 'next/headers';
import './globals.css';
import { prisma } from '@/lib/prisma';
import { LanguageProvider } from '@/components/providers/LanguageProvider';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { Locale } from '@/lib/i18n';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: {
    default: '3K FC Official Website | Embu County, Kenya • FKF Premier League',
    template: '%s | 3K FC Official Website',
  },
  description:
    'The official digital headquarters of 3K Football Club, Embu County, Kenya (Home of Stars • God\'s Favourite Club). Official news, 2026/27 FKF Premier League fixtures, results, squad, M-Pesa QR tickets, store, and supporters club.',
  keywords: [
    '3K FC',
    '3K FC Embu',
    'FKF Premier League',
    'Moi Stadium Embu',
    'Embu County Football',
    '3K FC Tickets',
    'Kenyan Football',
  ],
  manifest: '/manifest.webmanifest',
  openGraph: {
    type: 'website',
    locale: 'en_KE',
    siteName: '3K FC Official Website',
    title: '3K FC Official Website & Digital Fan Platform — Embu, Kenya',
    description:
      'Official news, fixtures, Match Centre, M-Pesa QR ticketing, merchandise and Supporters Club for 3K FC Embu.',
  },
};

export const viewport: Viewport = {
  themeColor: '#0E4494',
  width: 'device-width',
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const savedLocale = cookieStore.get('3kfc_locale')?.value;
  const initialLocale: Locale = savedLocale === 'sw' ? 'sw' : 'en';

  const settings = await prisma.clubSettings.findUnique({ where: { id: 'default' } }).catch(() => null);

  const cssVariables = {
    '--club-primary': settings?.primaryColor || '#E11D2A',
    '--club-primary-dark': settings?.primaryDarkColor || '#B91C1C',
    '--club-secondary': settings?.secondaryColor || '#0E4494',
    '--club-secondary-dark': '#0A2E68',
    '--club-red': '#E11D2A',
    '--club-blue': '#0E4494',
    '--club-accent': settings?.accentColor || '#D4AF37',
    '--club-gold': '#D4AF37',
    '--surface-light': '#FFFFFF',
    '--surface-offwhite': '#FFFFFF',
    '--surface-dark': '#0F172A',
    '--surface-card-dark': '#1E293B',
  } as React.CSSProperties;

  return (
    <html
      lang={initialLocale}
      style={cssVariables}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Nunito:wght@600;700;800;900&family=Rubik:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,700;1,900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col bg-white text-slate-900">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-club-primary focus:text-white focus:rounded-md focus:font-bold"
        >
          Skip to main content
        </a>
        <LanguageProvider initialLocale={initialLocale}>
          <PublicHeader
            paletteStatus={settings?.paletteStatus || 'CONFIRMED'}
            crestUrl={settings?.crestAssetUrl || '/images/3k-fc-crest.png'}
            crestConfirmed={settings?.crestConfirmed ?? true}
            venueConfirmed={settings?.homeStadiumConfirmed || false}
            sponsorConfirmed={settings?.mainSponsorConfirmed || false}
          />
          <main id="main-content" className="flex-1">
            {children}
          </main>
          <PublicFooter />
        </LanguageProvider>
      </body>
    </html>
  );
}
