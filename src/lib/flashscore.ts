import { prisma } from './prisma';

export interface FlashscoreFixture {
  matchId: string;
  timestamp: number | null;
  kickoffAt: Date | null;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  statusCode: string; // "1" = scheduled, "2" = live, "3" = finished
  isFinished: boolean;
  isLive: boolean;
  isScheduled: boolean;
  broadcastInfo?: string | null;
}

export function parseFlashscoreFeedText(htmlStr: string): FlashscoreFixture[] {
  const match = htmlStr.match(/cjs\.initialFeeds\["fixtures"\]\s*=\s*\{\s*data:\s*`([\s\S]*?)`/);
  if (!match) return [];

  const raw = match[1];
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
    const homeScore = fields['GRA'] !== undefined ? parseInt(fields['GRA'], 10) : null;
    const awayScore = fields['GRB'] !== undefined ? parseInt(fields['GRB'], 10) : null;
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
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
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

let lastSyncTime = 0;
const SYNC_COOLDOWN_MS = 15_000; // 15 seconds cooldown

/**
 * Synchronize single matchweek fixture from Flashscore.
 * Requirement:
 * 1. Fetch the single matchweek fixture from Flashscore: https://www.flashscore.com/team/3k-fc/8reiOTYF/fixtures/
 * 2. After a fixture is finished, it should be removed from the website.
 */
export async function syncFlashscoreMatchweekFixture(force = false) {
  const now = Date.now();
  if (!force && now - lastSyncTime < SYNC_COOLDOWN_MS) {
    return { synced: false, message: 'Cooldown active' };
  }
  lastSyncTime = now;

  const rawFixtures = await fetchFlashscore3KFixtures();
  if (!rawFixtures.length) {
    return { synced: false, message: 'No fixtures found on Flashscore' };
  }

  // 1. Identify finished fixtures and REMOVE them from the website
  const finishedMatches = rawFixtures.filter((f) => f.isFinished);
  const finishedMatchSlugs: string[] = [];

  for (const f of finishedMatches) {
    const homeMap = resolveClubMapping(f.homeTeam);
    const awayMap = resolveClubMapping(f.awayTeam);
    finishedMatchSlugs.push(`${homeMap.slug}-vs-${awayMap.slug}`);
    finishedMatchSlugs.push(`${awayMap.slug}-vs-${homeMap.slug}`);
  }

  // Remove finished fixtures from the database so they are completely removed from the website
  if (finishedMatchSlugs.length > 0) {
    const toDelete = await prisma.fixture.findMany({
      where: {
        OR: [
          { status: 'FULL_TIME' },
          ...finishedMatchSlugs.map((s) => ({ slug: { contains: s } })),
        ],
      },
      select: { id: true, slug: true },
    });

    for (const fix of toDelete) {
      // Clean up relations first if any exist
      await prisma.ticketCategory.deleteMany({ where: { fixtureId: fix.id } }).catch(() => {});
      await prisma.liveBlogUpdate.deleteMany({ where: { fixtureId: fix.id } }).catch(() => {});
      await prisma.matchPoll.deleteMany({ where: { fixtureId: fix.id } }).catch(() => {});
      await prisma.fixture.delete({ where: { id: fix.id } }).catch(() => {});
    }
  }

  // 2. Identify the SINGLE current matchweek fixture (first upcoming / live match)
  const scheduledOrLive = rawFixtures.filter((f) => !f.isFinished && (f.isScheduled || f.isLive));
  const singleMatchweek = scheduledOrLive[0];

  if (!singleMatchweek || !singleMatchweek.kickoffAt) {
    return { synced: true, message: 'No active upcoming matchweek fixture found on Flashscore' };
  }

  // Resolve 3K FC club
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
  }

  const isHome = singleMatchweek.homeTeam.toLowerCase().includes('3k');
  const opponentRaw = isHome ? singleMatchweek.awayTeam : singleMatchweek.homeTeam;
  const oppMap = resolveClubMapping(opponentRaw);

  let oppClub = await prisma.club.findUnique({ where: { slug: oppMap.slug } });
  if (!oppClub) {
    oppClub = await prisma.club.create({
      data: {
        name: oppMap.defaultName,
        shortName: oppMap.defaultName.replace(' FC', '').replace(' SC', ''),
        slug: oppMap.slug,
        city: 'Kenya',
        isOurClub: false,
      },
    });
  }

  const homeClubId = isHome ? club3k.id : oppClub.id;
  const awayClubId = isHome ? oppClub.id : club3k.id;

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

  const fixtureSlug = `${isHome ? '3k-fc' : oppClub.slug}-vs-${isHome ? oppClub.slug : '3k-fc'}-matchweek`;
  const venueName = isHome ? 'Moi Stadium, Embu' : oppClub.stadiumName || `${oppClub.name} Stadium`;
  const venueCity = isHome ? 'Embu' : oppClub.city || 'Kenya';

  // Check if this fixture already exists
  const existingFixture = await prisma.fixture.findFirst({
    where: {
      OR: [
        { slug: fixtureSlug },
        {
          homeClubId,
          awayClubId,
          status: { in: ['SCHEDULED', 'LIVE', 'HALF_TIME'] },
        },
      ],
    },
  });

  let activeFixture;
  if (existingFixture) {
    activeFixture = await prisma.fixture.update({
      where: { id: existingFixture.id },
      data: {
        kickoffAt: singleMatchweek.kickoffAt,
        kickoffConfirmed: true,
        venueName,
        venueCity,
        status: singleMatchweek.isLive ? 'LIVE' : 'SCHEDULED',
        broadcastInfo: singleMatchweek.broadcastInfo || 'Broadcast: Azam Sports / FKF TV',
        ticketsAvailable: isHome,
      },
      include: { homeClub: true, awayClub: true, competition: true },
    });
  } else {
    activeFixture = await prisma.fixture.create({
      data: {
        slug: fixtureSlug,
        competitionId: comp.id,
        seasonId: season.id,
        homeClubId,
        awayClubId,
        isHomeMatch: isHome,
        roundName: 'FKF Premier League — Matchweek Fixture',
        kickoffAt: singleMatchweek.kickoffAt,
        kickoffConfirmed: true,
        venueName,
        venueCity,
        venueConfirmed: true,
        status: singleMatchweek.isLive ? 'LIVE' : 'SCHEDULED',
        broadcastInfo: singleMatchweek.broadcastInfo || 'Broadcast: Azam Sports / FKF TV',
        ticketsAvailable: isHome,
      },
      include: { homeClub: true, awayClub: true, competition: true },
    });

    if (isHome) {
      await prisma.ticketCategory.createMany({
        data: [
          {
            fixtureId: activeFixture.id,
            nameEn: 'General Admission (Terraces)',
            nameSw: 'Jukwaa la Kawaida (Terraces)',
            descriptionEn: 'General admission at Moi Stadium, Embu.',
            priceKesCents: 20000, // KES 200
            maxPerOrder: 6,
            isActive: true,
          },
          {
            fixtureId: activeFixture.id,
            nameEn: 'VIP / Main Dais Pass',
            nameSw: 'Jukwaa Kuu la VIP',
            descriptionEn: 'Covered VIP Dais seating.',
            priceKesCents: 50000, // KES 500
            maxPerOrder: 4,
            isActive: true,
          },
        ],
      });
    }
  }

  // Remove any OTHER old/stale fixtures in the database so that ONLY the single matchweek fixture is displayed
  await prisma.fixture.deleteMany({
    where: {
      id: { not: activeFixture.id },
      status: { in: ['FULL_TIME', 'SCHEDULED', 'POSTPONED'] },
      kickoffAt: { lt: new Date(singleMatchweek.kickoffAt.getTime() - 2 * 3600 * 1000) },
    },
  }).catch(() => {});

  return {
    synced: true,
    fixture: activeFixture,
    opponent: oppClub.name,
    kickoffAt: singleMatchweek.kickoffAt,
    isHome,
    broadcastInfo: singleMatchweek.broadcastInfo,
    removedFinishedCount: finishedMatchSlugs.length,
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
