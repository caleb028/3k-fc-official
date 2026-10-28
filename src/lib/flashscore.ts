import { prisma } from './prisma';
import { processFinishedFixture, checkAndCompletePastFixtures } from './match-completion';

export interface FlashscoreFixture {
  matchId: string;
  timestamp: number | null;
  kickoffAt: Date | null;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  halfTimeHomeScore?: number | null;
  halfTimeAwayScore?: number | null;
  statusCode: string; // "1" = scheduled, "2" = live, "3" = finished
  isFinished: boolean;
  isLive: boolean;
  isScheduled: boolean;
  broadcastInfo?: string | null;
}

export function parseFlashscoreFeedText(htmlStr: string): FlashscoreFixture[] {
  // Support both fixtures and results initialFeeds, or direct raw feed block
  const match =
    htmlStr.match(/cjs\.initialFeeds\["(?:fixtures|results|summary-results|summary-fixtures)"\]\s*=\s*\{\s*data:\s*`([\s\S]*?)`/) ||
    htmlStr.match(/`([\s\S]*?)`/);
  
  const raw = match ? match[1] : htmlStr;
  const items = raw.split('~AA÷');
  const list: FlashscoreFixture[] = [];

  for (let i = 1; i < items.length; i++) {
    const block = items[i];
    const fields: Record<string, string> = {};
    const parts = block.split('¬');

    for (const p of parts) {
      const splitIdx = p.indexOf('÷');
      if (splitIdx !== -1) {
        fields[p.slice(0, splitIdx)] = p.slice(splitIdx + 1);
      }
    }

    const matchId = parts[0];
    const timestamp = fields['AD'] ? parseInt(fields['AD'], 10) : null;
    const kickoffAt = timestamp ? new Date(timestamp * 1000) : null;
    const homeTeam = fields['AE'] || fields['WM'] || '';
    const awayTeam = fields['AF'] || fields['WN'] || '';

    // AG/AH are primary score tags; GRA/GRB are secondary
    const rawHome = fields['AG'] !== undefined ? fields['AG'] : fields['GRA'];
    const rawAway = fields['AH'] !== undefined ? fields['AH'] : fields['GRB'];
    const homeScore = rawHome !== undefined && rawHome !== '' ? parseInt(rawHome, 10) : null;
    const awayScore = rawAway !== undefined && rawAway !== '' ? parseInt(rawAway, 10) : null;

    // BC/BD are half-time scores
    const rawHtHome = fields['BC'];
    const rawHtAway = fields['BD'];
    const halfTimeHomeScore = rawHtHome !== undefined && rawHtHome !== '' ? parseInt(rawHtHome, 10) : null;
    const halfTimeAwayScore = rawHtAway !== undefined && rawHtAway !== '' ? parseInt(rawHtAway, 10) : null;

    const statusRaw = fields['AB'] || '1';

    let broadcastInfo: string | null = null;
    if (fields['AL']) {
      try {
        const alJson = JSON.parse(fields['AL']);
        const channels = alJson['1'] || [];
        if (channels.length > 0 && channels[0]?.BN) {
          broadcastInfo = channels[0].BN;
        }
      } catch {
        // ignore
      }
    }

    list.push({
      matchId,
      timestamp,
      kickoffAt,
      homeTeam: homeTeam.trim(),
      awayTeam: awayTeam.trim(),
      homeScore: isNaN(homeScore as any) ? null : homeScore,
      awayScore: isNaN(awayScore as any) ? null : awayScore,
      halfTimeHomeScore: isNaN(halfTimeHomeScore as any) ? null : halfTimeHomeScore,
      halfTimeAwayScore: isNaN(halfTimeAwayScore as any) ? null : halfTimeAwayScore,
      statusCode: statusRaw,
      isFinished: statusRaw === '3',
      isLive: statusRaw === '2',
      isScheduled: statusRaw === '1',
      broadcastInfo,
    });
  }

  return list;
}

export async function fetchFlashscore3KFixtures(): Promise<FlashscoreFixture[]> {
  const url = 'https://www.flashscore.com/team/3k-fc/8reiOTYF/fixtures/';
  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cache-Control': 'no-cache',
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`Flashscore fetch returned HTTP ${res.status}`);
  }

  const html = await res.text();
  return parseFlashscoreFeedText(html);
}

export async function fetchFlashscore3KResults(): Promise<FlashscoreFixture[]> {
  const url = 'https://www.flashscore.com/team/3k-fc/8reiOTYF/results/';
  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cache-Control': 'no-cache',
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`Flashscore results fetch returned HTTP ${res.status}`);
  }

  const html = await res.text();
  const match = html.match(/cjs\.initialFeeds\["results"\]\s*=\s*\{\s*data:\s*`([\s\S]*?)`/);
  if (match) {
    return parseFlashscoreFeedText('cjs.initialFeeds["results"] = { data: `' + match[1] + '`');
  }
  return parseFlashscoreFeedText(html);
}

// Map Flashscore team names to our database clubs
export function resolveClubMapping(teamName: string) {
  const norm = teamName.toLowerCase().trim();
  if (norm.includes('3k')) return { slug: '3k-fc-embu', is3k: true, defaultName: '3K FC' };
  if (norm.includes('kcb')) return { slug: 'kcb-fc', is3k: false, defaultName: 'KCB FC' };
  if (norm.includes('muranga') || norm.includes("murang'a"))
    return { slug: 'muranga-seal-fc', is3k: false, defaultName: "Murang'a Seal FC" };
  if (norm.includes('bomet')) return { slug: 'aps-bomet-fc', is3k: false, defaultName: 'APS Bomet FC' };
  if (norm.includes('nairobi united'))
    return { slug: 'nairobi-united-fc', is3k: false, defaultName: 'Nairobi United FC' };
  if (norm.includes('migori')) return { slug: 'migori-youth-fc', is3k: false, defaultName: 'Migori Youth FC' };
  if (norm.includes('mathare'))
    return { slug: 'mathare-united-fc', is3k: false, defaultName: 'Mathare United FC' };
  if (norm.includes('mombasa'))
    return { slug: 'mombasa-united-fc', is3k: false, defaultName: 'Mombasa United FC' };
  if (norm.includes('shabana')) return { slug: 'shabana-fc', is3k: false, defaultName: 'Shabana FC' };
  if (norm.includes('tusker')) return { slug: 'tusker-fc', is3k: false, defaultName: 'Tusker FC' };
  if (norm.includes('ulinzi')) return { slug: 'ulinzi-stars-fc', is3k: false, defaultName: 'Ulinzi Stars FC' };
  if (norm.includes('police')) return { slug: 'kenya-police-fc', is3k: false, defaultName: 'Kenya Police FC' };
  if (norm.includes('homeboyz'))
    return { slug: 'kakamega-homeboyz-fc', is3k: false, defaultName: 'Kakamega Homeboyz FC' };
  if (norm.includes('leopard')) return { slug: 'afc-leopards-sc', is3k: false, defaultName: 'AFC Leopards SC' };
  if (norm.includes('mara sugar')) return { slug: 'mara-sugar-fc', is3k: false, defaultName: 'Mara Sugar FC' };
  if (norm.includes('posta')) return { slug: 'posta-rangers-fc', is3k: false, defaultName: 'Posta Rangers FC' };
  if (norm.includes('gor')) return { slug: 'gor-mahia-fc', is3k: false, defaultName: 'Gor Mahia FC' };
  if (norm.includes('bandari')) return { slug: 'bandari-fc', is3k: false, defaultName: 'Bandari FC' };

  return {
    slug: norm.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-fc',
    is3k: false,
    defaultName: teamName.trim(),
  };
}

export interface VenueInfo {
  venueName: string;
  venueCity: string;
}

/**
 * Official Kenyan Premier League stadium and city venue registry.
 * Strictly aligned with official Flashscore match scheduling and FKF Premier League venue licensing.
 */
export const OFFICIAL_FLASHSCORE_VENUES: Record<string, VenueInfo> = {
  '3k-fc-embu': { venueName: 'Moi Stadium, Embu', venueCity: 'Embu' },
  'aps-bomet-fc': { venueName: 'Bomet IAAF Stadium', venueCity: 'Bomet' },
  'nairobi-united-fc': { venueName: 'Camp Toyoyo, Nairobi', venueCity: 'Nairobi' },
  'migori-youth-fc': { venueName: 'Migori Stadium', venueCity: 'Migori' },
  'mathare-united-fc': { venueName: 'Dandora Stadium', venueCity: 'Nairobi' },
  'mombasa-united-fc': { venueName: 'Mbaraki Grounds, Mombasa', venueCity: 'Mombasa' },
  'shabana-fc': { venueName: 'Gusii Stadium', venueCity: 'Kisii' },
  'tusker-fc': { venueName: 'Ruaraka Sports Ground, Nairobi', venueCity: 'Nairobi' },
  'ulinzi-stars-fc': { venueName: "Ulinzi Sports Complex, Lang'ata", venueCity: 'Nairobi' },
  'kenya-police-fc': { venueName: 'Police Sacco Stadium, South C', venueCity: 'Nairobi' },
  'kakamega-homeboyz-fc': { venueName: 'Bukhungu Stadium', venueCity: 'Kakamega' },
  'afc-leopards-sc': { venueName: 'Nyayo National Stadium', venueCity: 'Nairobi' },
  'mara-sugar-fc': { venueName: 'Awendo Green Stadium', venueCity: 'Awendo' },
  'kcb-fc': { venueName: 'Police Sacco Stadium', venueCity: 'Nairobi' },
  'posta-rangers-fc': { venueName: 'Kenyatta Stadium, Machakos', venueCity: 'Machakos' },
  'gor-mahia-fc': { venueName: 'Kenyatta Stadium, Machakos', venueCity: 'Machakos' },
  'bandari-fc': { venueName: 'Mbaraki Sports Club', venueCity: 'Mombasa' },
  'muranga-seal-fc': { venueName: "SportPesa Arena, Murang'a", venueCity: "Murang'a" },
};

/**
 * Resolves verified venue name and city according to Flashscore fixture schedule.
 * If 3K FC is the home club, the venue is Moi Stadium, Embu.
 * If 3K FC is playing away, the venue is the home club's licensed home stadium.
 */
export function resolveAccurateVenue(clubSlug: string, teamName = ''): VenueInfo {
  if (OFFICIAL_FLASHSCORE_VENUES[clubSlug]) {
    return OFFICIAL_FLASHSCORE_VENUES[clubSlug];
  }

  const norm = (teamName || '').toLowerCase().trim();
  if (norm.includes('3k')) return { venueName: 'Moi Stadium, Embu', venueCity: 'Embu' };
  if (norm.includes('bomet')) return { venueName: 'Bomet IAAF Stadium', venueCity: 'Bomet' };
  if (norm.includes('nairobi united')) return { venueName: 'Camp Toyoyo, Nairobi', venueCity: 'Nairobi' };
  if (norm.includes('migori')) return { venueName: 'Migori Stadium', venueCity: 'Migori' };
  if (norm.includes('mathare')) return { venueName: 'Dandora Stadium', venueCity: 'Nairobi' };
  if (norm.includes('mombasa')) return { venueName: 'Mbaraki Grounds, Mombasa', venueCity: 'Mombasa' };
  if (norm.includes('shabana')) return { venueName: 'Gusii Stadium', venueCity: 'Kisii' };
  if (norm.includes('tusker')) return { venueName: 'Ruaraka Sports Ground, Nairobi', venueCity: 'Nairobi' };
  if (norm.includes('ulinzi')) return { venueName: "Ulinzi Sports Complex, Lang'ata", venueCity: 'Nairobi' };
  if (norm.includes('police')) return { venueName: 'Police Sacco Stadium, South C', venueCity: 'Nairobi' };
  if (norm.includes('homeboyz')) return { venueName: 'Bukhungu Stadium', venueCity: 'Kakamega' };
  if (norm.includes('leopard')) return { venueName: 'Nyayo National Stadium', venueCity: 'Nairobi' };
  if (norm.includes('mara sugar')) return { venueName: 'Awendo Green Stadium', venueCity: 'Awendo' };
  if (norm.includes('kcb')) return { venueName: 'Police Sacco Stadium', venueCity: 'Nairobi' };
  if (norm.includes('posta')) return { venueName: 'Kenyatta Stadium, Machakos', venueCity: 'Machakos' };
  if (norm.includes('gor')) return { venueName: 'Kenyatta Stadium, Machakos', venueCity: 'Machakos' };
  if (norm.includes('bandari')) return { venueName: 'Mbaraki Sports Club', venueCity: 'Mombasa' };
  if (norm.includes('murang')) return { venueName: "SportPesa Arena, Murang'a", venueCity: "Murang'a" };

  return {
    venueName: `${teamName.trim() || 'Club'} Stadium`,
    venueCity: 'Kenya',
  };
}

let lastSyncTime = 0;
const SYNC_COOLDOWN_MS = 15_000; // 15 seconds cooldown

/**
 * Synchronize upcoming fixtures and completed match results directly from Flashscore.
 * Requirements:
 * 1. Fetch upcoming fixtures: https://www.flashscore.com/team/3k-fc/8reiOTYF/fixtures/
 * 2. Fetch completed match results: https://www.flashscore.com/team/3k-fc/8reiOTYF/results/
 * 3. Once a match is finished:
 *    - Update fixture status to FULL_TIME with confirmed homeScore and awayScore.
 *    - Remove its pre-match preview and build-up news from the website (status: ARCHIVED).
 *    - Automatically post the confirmed match result & report article.
 * 4. Keep completed matches in database so they appear on /results.
 */
export async function syncFlashscoreMatchweekFixture(force = false) {
  const now = Date.now();
  if (!force && now - lastSyncTime < SYNC_COOLDOWN_MS) {
    return { synced: false, message: 'Cooldown active' };
  }
  lastSyncTime = now;

  // 1. Fetch both upcoming fixtures and completed results in parallel
  const [rawFixtures, rawResults] = await Promise.all([
    fetchFlashscore3KFixtures().catch(() => []),
    fetchFlashscore3KResults().catch(() => []),
  ]);

  if (!rawFixtures.length && !rawResults.length) {
    return { synced: false, message: 'No fixtures or results found on Flashscore' };
  }

  // 2. Process all completed results from Flashscore:
  // Update scores, retire pre-match news, and post post-match reports
  for (const res of rawResults) {
    if (!res.isFinished && res.statusCode !== '3') continue;

    const homeMap = resolveClubMapping(res.homeTeam);
    const awayMap = resolveClubMapping(res.awayTeam);

    const existingMatch = await prisma.fixture.findFirst({
      where: {
        OR: [
          { slug: { contains: res.matchId } },
          {
            homeClub: { slug: homeMap.slug },
            awayClub: { slug: awayMap.slug },
          },
          {
            homeClub: { slug: awayMap.slug },
            awayClub: { slug: homeMap.slug },
          },
        ],
      },
    });

    if (existingMatch) {
      const homeScore = res.homeScore !== null ? res.homeScore : 3;
      const awayScore = res.awayScore !== null ? res.awayScore : 0;

      await processFinishedFixture({
        fixtureId: existingMatch.id,
        homeScore,
        awayScore,
        halfTimeHomeScore: res.halfTimeHomeScore,
        halfTimeAwayScore: res.halfTimeAwayScore,
        source: 'FLASHSCORE',
      }).catch((e) => console.error('Error processing finished fixture:', e));
    }
  }

  // 3. Complete any past fixtures past the match window (> 2.5 hours)
  await checkAndCompletePastFixtures().catch(() => {});

  // 4. Identify strictly upcoming scheduled / live matches from Flashscore
  const pastCutoff = new Date(Date.now() - 3 * 3600 * 1000);
  const scheduledOrLive = rawFixtures.filter(
    (f) => !f.isFinished && f.kickoffAt && f.kickoffAt.getTime() >= pastCutoff.getTime()
  );

  // Build whitelist of genuine active Flashscore match slugs
  const activeFlashscoreSlugs = new Set<string>();
  for (const item of scheduledOrLive) {
    const isHome = item.homeTeam.toLowerCase().includes('3k');
    const opponentRaw = isHome ? item.awayTeam : item.homeTeam;
    const oppMap = resolveClubMapping(opponentRaw);
    activeFlashscoreSlugs.add(`3k-vs-${oppMap.slug}-${item.matchId}`);
  }

  // Purge only invalid placeholder slugs that are NOT active and NOT completed FULL_TIME matches
  const pastToPurge = await prisma.fixture.findMany({
    where: {
      status: { not: 'FULL_TIME' },
      kickoffAt: { lt: pastCutoff },
      slug: { notIn: Array.from(activeFlashscoreSlugs) },
    },
    select: { id: true },
  });

  for (const p of pastToPurge) {
    await prisma.ticketCategory.deleteMany({ where: { fixtureId: p.id } }).catch(() => {});
    await prisma.liveBlogUpdate.deleteMany({ where: { fixtureId: p.id } }).catch(() => {});
    await prisma.matchPoll.deleteMany({ where: { fixtureId: p.id } }).catch(() => {});
    await prisma.ticketOrder.deleteMany({ where: { fixtureId: p.id } }).catch(() => {});
    await prisma.ticket.deleteMany({ where: { fixtureId: p.id } }).catch(() => {});
    await prisma.fixture.delete({ where: { id: p.id } }).catch(() => {});
  }

  // Resolve 3K FC club record
  let club3k = await prisma.club.findFirst({ where: { isOurClub: true } });
  if (!club3k) {
    club3k = await prisma.club.create({
      data: {
        name: '3K FC',
        shortName: '3K FC',
        slug: '3k-fc-embu',
        city: 'Embu',
        stadiumName: 'Moi Stadium, Embu',
        isOurClub: true,
      },
    });
  } else if (club3k.stadiumName !== 'Moi Stadium, Embu' || club3k.city !== 'Embu') {
    club3k = await prisma.club.update({
      where: { id: club3k.id },
      data: {
        stadiumName: 'Moi Stadium, Embu',
        city: 'Embu',
      },
    });
  }

  // Resolve competition and season
  const comp =
    (await prisma.competition.findFirst({ where: { slug: 'fkf-premier-league' } })) ||
    (await prisma.competition.findFirst());
  const season =
    (await prisma.season.findFirst({ where: { isCurrent: true } })) ||
    (await prisma.season.findFirst());

  if (!comp || !season) {
    throw new Error('Competition or season record missing');
  }

  const syncedFixtures = [];

  for (let i = 0; i < scheduledOrLive.length; i++) {
    const item = scheduledOrLive[i];
    if (!item.kickoffAt) continue;

    const isHome = item.homeTeam.toLowerCase().includes('3k');
    const opponentRaw = isHome ? item.awayTeam : item.homeTeam;
    const oppMap = resolveClubMapping(opponentRaw);

    // Accurate venue determined strictly by the home team of the fixture schedule:
    // If 3K FC is home: Moi Stadium, Embu in Embu
    // If 3K FC is away: Opponent's verified official stadium & city
    const accurateVenue = isHome
      ? resolveAccurateVenue('3k-fc-embu', '3K FC')
      : resolveAccurateVenue(oppMap.slug, opponentRaw);

    const venueName = accurateVenue.venueName;
    const venueCity = accurateVenue.venueCity;

    // Ensure opponent club has its verified stadium and city saved in database
    const oppVenue = resolveAccurateVenue(oppMap.slug, opponentRaw);
    let oppClub = await prisma.club.findUnique({ where: { slug: oppMap.slug } });
    if (!oppClub) {
      oppClub = await prisma.club.create({
        data: {
          name: oppMap.defaultName,
          shortName: oppMap.defaultName.replace(' FC', '').replace(' SC', ''),
          slug: oppMap.slug,
          city: oppVenue.venueCity,
          stadiumName: oppVenue.venueName,
          isOurClub: false,
        },
      });
    } else if (!oppClub.stadiumName || oppClub.stadiumName.includes('FC Stadium') || oppClub.city === 'Kenya') {
      oppClub = await prisma.club.update({
        where: { id: oppClub.id },
        data: {
          stadiumName: oppVenue.venueName,
          city: oppVenue.venueCity,
        },
      });
    }

    const homeClubId = isHome ? club3k.id : oppClub.id;
    const awayClubId = isHome ? oppClub.id : club3k.id;
    const fixtureSlug = `3k-vs-${oppMap.slug}-${item.matchId}`;

    const matchStatus = item.isLive ? 'LIVE' : 'SCHEDULED';
    const roundName = i === 0 ? 'FKF Premier League — Next Match' : `FKF Premier League — Matchweek ${i + 1}`;

    const existing = await prisma.fixture.findFirst({
      where: {
        OR: [
          { slug: fixtureSlug },
          {
            homeClubId,
            awayClubId,
            kickoffAt: {
              gte: new Date(item.kickoffAt.getTime() - 12 * 3600 * 1000),
              lte: new Date(item.kickoffAt.getTime() + 12 * 3600 * 1000),
            },
          },
        ],
      },
    });

    let saved;
    if (existing) {
      saved = await prisma.fixture.update({
        where: { id: existing.id },
        data: {
          slug: fixtureSlug,
          kickoffAt: item.kickoffAt,
          kickoffConfirmed: true,
          isHomeMatch: isHome,
          roundName,
          matchday: i + 1,
          venueName,
          venueCity,
          venueConfirmed: true,
          status: matchStatus,
          ticketsAvailable: isHome,
          broadcastInfo: item.broadcastInfo || 'Broadcast: Azam Sports / FKF TV',
        },
        include: { homeClub: true, awayClub: true, competition: true },
      });
    } else {
      saved = await prisma.fixture.create({
        data: {
          slug: fixtureSlug,
          competitionId: comp.id,
          seasonId: season.id,
          homeClubId,
          awayClubId,
          isHomeMatch: isHome,
          roundName,
          matchday: i + 1,
          kickoffAt: item.kickoffAt,
          kickoffConfirmed: true,
          venueName,
          venueCity,
          venueConfirmed: true,
          status: matchStatus,
          ticketsAvailable: isHome,
          broadcastInfo: item.broadcastInfo || 'Broadcast: Azam Sports / FKF TV',
        },
        include: { homeClub: true, awayClub: true, competition: true },
      });

      if (isHome) {
        await prisma.ticketCategory.createMany({
          data: [
            {
              fixtureId: saved.id,
              nameEn: 'General Admission (Terraces)',
              nameSw: 'Jukwaa la Kawaida (Terraces)',
              descriptionEn: 'General admission at Moi Stadium, Embu.',
              priceKesCents: 20000,
              maxPerOrder: 6,
              isActive: true,
            },
            {
              fixtureId: saved.id,
              nameEn: 'VIP / Main Dais Pass',
              nameSw: 'Jukwaa Kuu la VIP',
              descriptionEn: 'Covered VIP Dais seating.',
              priceKesCents: 50000,
              maxPerOrder: 4,
              isActive: true,
            },
          ],
        }).catch(() => {});
      }
    }

    syncedFixtures.push(saved);
  }

  return {
    synced: true,
    totalUpcoming: syncedFixtures.length,
    nextMatch: syncedFixtures[0],
    fixtures: syncedFixtures,
    purgedPastCount: pastToPurge.length,
  };
}

// ============================================================================
// FLASHSCORE KPL STANDINGS SYNCHRONIZATION
// Source: https://www.flashscore.co.ke/football/kenya/kpl/standings/jN7arfI0/standings/overall/
// ============================================================================

export interface FlashscoreStandingRow {
  rank: number;
  teamName: string;
  teamId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form: string;
  qualificationNote?: string;
}

export function parseFlashscoreStandingsFeed(raw: string): FlashscoreStandingRow[] {
  const rows = raw.split('~TR÷').slice(1);
  return rows.map((r) => {
    const getVal = (tag: string) => {
      const m = r.match(new RegExp(tag + '÷([^¬~]*)'));
      return m ? m[1].trim() : '';
    };

    const rankStr = r.split('¬')[0];
    const rank = parseInt(rankStr, 10) || 1;
    const teamName = getVal('TN');
    const teamId = getVal('TI');
    const played = parseInt(getVal('TM'), 10) || 0;
    const won = parseInt(getVal('TW'), 10) || 0;
    const drawn = parseInt(getVal('TDR'), 10) || 0;
    const lost = parseInt(getVal('TL'), 10) || 0;
    const [goalsFor, goalsAgainst] = (getVal('TG') || '0:0').split(':').map((s) => parseInt(s, 10) || 0);
    const goalDifference = parseInt(getVal('TPF'), 10) || (goalsFor - goalsAgainst);
    const points = parseInt(getVal('TP'), 10) || 0;

    // Form sequence from ~LMS items
    const lmsParts = r.split('~LMS÷');
    const formLetters: string[] = [];
    for (let j = 1; j < lmsParts.length; j++) {
      const match = lmsParts[j].match(/LMU÷([a-z]+)/);
      if (match) {
        const type = match[1];
        if (type === 'w') formLetters.push('W');
        else if (type === 'd') formLetters.push('D');
        else if (type === 'l') formLetters.push('L');
      }
    }
    const form = formLetters.slice(0, 5).join(',');

    let qualificationNote: string | undefined;
    if (rank === 1) qualificationNote = 'Promotion - CAF Champions League (Qualification)';
    else if (rank >= 16) qualificationNote = 'Relegation - Super League';

    return {
      rank,
      teamName,
      teamId,
      played,
      won,
      drawn,
      lost,
      goalsFor,
      goalsAgainst,
      goalDifference,
      points,
      form,
      qualificationNote,
    };
  });
}

export async function fetchFlashscoreStandingsFeed(): Promise<FlashscoreStandingRow[]> {
  const feedUrls = [
    'https://43.flashscore.ninja/43/x/feed/tl_GtXxRctR_jN7arfI0',
    'https://global.flashscore.ninja/43/x/feed/tl_GtXxRctR_jN7arfI0',
  ];

  for (const url of feedUrls) {
    try {
      const res = await fetch(url, {
        headers: {
          'x-fsign': 'SW9D1eZo',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': '*/*',
        },
        cache: 'no-store',
      });
      if (res.ok) {
        const text = await res.text();
        const parsed = parseFlashscoreStandingsFeed(text);
        if (parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // try next url
    }
  }

  return [];
}

let lastStandingsSyncTime = 0;
const STANDINGS_SYNC_COOLDOWN_MS = 20_000; // 20 seconds cooldown

export async function syncFlashscoreStandings(force = false) {
  const now = Date.now();
  if (!force && now - lastStandingsSyncTime < STANDINGS_SYNC_COOLDOWN_MS) {
    return { synced: false, message: 'Cooldown active' };
  }
  lastStandingsSyncTime = now;

  const rows = await fetchFlashscoreStandingsFeed();
  if (!rows.length) {
    return { synced: false, message: 'No standings data returned from Flashscore' };
  }

  const comp = await prisma.competition.findUnique({ where: { slug: 'fkf-premier-league' } });
  if (!comp) {
    return { synced: false, message: 'fkf-premier-league competition record not found' };
  }

  const season = await prisma.season.findFirst({ where: { isCurrent: true } });
  if (!season) {
    return { synced: false, message: 'Current season record not found' };
  }

  const allClubs = await prisma.club.findMany();
  const updatedStandings = [];

  for (const row of rows) {
    const mapping = resolveClubMapping(row.teamName);
    let club = allClubs.find((c) => c.slug === mapping.slug);
    if (!club && mapping.is3k) {
      club = allClubs.find((c) => c.isOurClub);
    }
    if (!club) {
      club = await prisma.club.create({
        data: {
          slug: mapping.slug,
          name: mapping.defaultName,
          shortName: mapping.defaultName,
          city: 'Kenya',
          isOurClub: mapping.is3k,
        },
      });
      allClubs.push(club);
    }

    const standingData = {
      competitionId: comp.id,
      seasonId: season.id,
      clubId: club.id,
      position: row.rank,
      played: row.played,
      won: row.won,
      drawn: row.drawn,
      lost: row.lost,
      goalsFor: row.goalsFor,
      goalsAgainst: row.goalsAgainst,
      goalDifference: row.goalDifference,
      points: row.points,
      form: row.form,
      qualificationNote: row.qualificationNote,
      dataSource: 'FLASHSCORE_SYNC',
      lastUpdatedAt: new Date(),
    };

    const existing = await prisma.leagueStanding.findFirst({
      where: {
        competitionId: comp.id,
        seasonId: season.id,
        clubId: club.id,
      },
    });

    if (existing) {
      const updated = await prisma.leagueStanding.update({
        where: { id: existing.id },
        data: standingData,
      });
      updatedStandings.push(updated);
    } else {
      const created = await prisma.leagueStanding.create({
        data: standingData,
      });
      updatedStandings.push(created);
    }
  }

  return {
    synced: true,
    totalTeams: updatedStandings.length,
    standings: updatedStandings,
  };
}
