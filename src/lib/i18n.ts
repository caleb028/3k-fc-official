export type Locale = 'en' | 'sw';

export interface BilingualDictionaryEntry {
  en: string;
  sw: string;
}

export const UI_DICTIONARY: Record<string, BilingualDictionaryEntry> = {
  // Navigation
  'nav.news': { en: 'News', sw: 'Habari' },
  'nav.fixtures_results': { en: 'Fixtures & Results', sw: 'Ratiba na Matokeo' },
  'nav.table': { en: 'Table', sw: 'Msimamo wa Ligi' },
  'nav.team': { en: 'Team', sw: 'Kikosi' },
  'nav.tickets': { en: 'Tickets', sw: 'Tiketi' },
  'nav.shop': { en: 'Shop', sw: 'Duka Rasmi' },
  'nav.club': { en: 'Club', sw: 'Klabu Yetu' },
  'nav.supporters': { en: 'Supporters', sw: 'Mashabiki' },
  'nav.partners': { en: 'Partners', sw: 'Washirika' },
  'nav.videos': { en: 'Video Hub', sw: 'Kituo cha Video' },
  'nav.donations': { en: 'Support 3K', sw: 'Saidia 3K FC' },
  'nav.search': { en: 'Search', sw: 'Tafuta' },
  'nav.account': { en: 'My Account', sw: 'Akaunti Yangu' },
  'nav.buy_tickets': { en: 'Buy Tickets', sw: 'Nunua Tiketi' },

  // Match Bar & Statuses
  'match.next_fixture': { en: 'Next Official Fixture', sw: 'Mechi Inayofuata' },
  'match.live_now': { en: 'LIVE MATCHDAY', sw: 'MECHI INAYOENDELEA' },
  'match.full_time': { en: 'FULL TIME', sw: 'DAKIKA 90 ZIMEKAMILIKA' },
  'match.half_time': { en: 'HALF TIME', sw: 'MAPUMZIKO' },
  'match.scheduled': { en: 'SCHEDULED', sw: 'IMEPANGWA' },
  'match.postponed': { en: 'POSTPONED', sw: 'IMEAHIRISHWA' },
  'match.delayed': { en: 'DELAYED', sw: 'IMECHELEWESHWA' },
  'match.cancelled': { en: 'CANCELLED', sw: 'IMEFUTWA' },
  'match.match_centre': { en: 'Match Centre', sw: 'Kituo cha Mechi' },
  'match.kickoff_tbc': { en: 'Kick-off time awaiting official FKF confirmation', sw: 'Muda wa kuanza unasubiri uthibitisho rasmi wa FKF' },
  'match.venue_subject': { en: 'Moi Stadium, Embu (Subject to official venue confirmation)', sw: 'Uwanja wa Moi, Embu (Unasubiri uthibitisho rasmi wa uwanja)' },

  // Sections
  'section.latest_news': { en: 'Latest Club News', sw: 'Habari Mpya za Klabu' },
  'section.latest_videos': { en: '3K FC TV & Video Hub', sw: 'Runinga na Video za 3K FC' },
  'section.league_table': { en: 'Standings Snapshot', sw: 'Msimamo wa Ligi' },
  'section.squad_spotlight': { en: 'First Team & Technical Bench', sw: 'Kikosi cha Kwanza na Benchi la Ufundi' },
  'section.official_merch': { en: 'Official 3K FC Store', sw: 'Duka Rasmi la Jezi na Bidhaa' },
  'section.supporters_club': { en: 'Official Supporters Club & Loyalty', sw: 'Klabu ya Mashabiki na Uanachama' },
  'section.sponsors': { en: 'Official Partners & Sponsors', sw: 'Wadhamini na Washirika Rasmi' },
  'section.embu_community': { en: 'Pride of Embu County • Home of Stars', sw: 'Fahari ya Kaunti ya Embu • Maskani ya Nyota' },

  // Common Actions & States
  'action.read_more': { en: 'Read Full Story', sw: 'Soma Habari Kamili' },
  'action.view_all': { en: 'View All', sw: 'Tazama Zote' },
  'action.pay_mpesa': { en: 'Pay with M-Pesa STK Push', sw: 'Lipa kwa M-Pesa STK Push' },
  'action.download_ics': { en: 'Download ICS Calendar', sw: 'Pakua Kalenda (ICS)' },
  'status.translation_fallback': {
    en: 'Displaying English version (Kiswahili translation in editorial preparation)',
    sw: 'Inaonyesha toleo la Kiingereza (Tafsiri ya Kiswahili inaandaliwa na wahariri)',
  },
  'status.provisional_theme': {
    en: 'Provisional Brand Palette Active — Awaiting Official Crest & Palette Confirmation by Club Administrator',
    sw: 'Rangi za Muda Zinatumika — Zinasubiri Uthibitisho Rasmi wa Nembo na Rangi kutoka kwa Utawala wa Klabu',
  },
};

export function t(key: string, locale: Locale = 'en'): string {
  const entry = UI_DICTIONARY[key];
  if (!entry) return key;
  return entry[locale] || entry.en;
}

export function resolveBilingualField<T extends { locale: string }>(
  translations: T[],
  preferredLocale: Locale
): { record: T | undefined; isFallback: boolean } {
  const exact = translations.find((item) => item.locale === preferredLocale);
  if (exact) {
    return { record: exact, isFallback: false };
  }
  const fallback = translations.find((item) => item.locale === 'en') ?? translations[0];
  return { record: fallback, isFallback: preferredLocale !== 'en' && Boolean(fallback) };
}
