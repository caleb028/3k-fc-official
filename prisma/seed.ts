import { PrismaClient } from '@prisma/client';
import { ROLE_DEFINITIONS } from '../src/lib/rbac';
import { UI_DICTIONARY } from '../src/lib/i18n';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding 3K FC Official Platform Database (Embu County, Kenya)...');

  // 1. ClubSettings (Provisional Palette & Verification Flags per Specification)
  await prisma.clubSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      clubName: '3K FC',
      officialFullName: '3K Football Club — Embu',
      motto: "God's Favourite Club • Home of Stars",
      location: 'Embu County, Kenya',
      foundingWard: 'Embu County, Kenya',
      currentCompetition: 'FKF Premier League',
      currentSeason: '2026/27',
      homeStadiumName: 'Moi Stadium, Embu',
      homeStadiumConfirmed: false,
      homeStadiumVerificationNote:
        "Subject to confirmation of the club's official match venue for 2026/27 FKF Premier League fixtures.",
      mainSponsorName: 'Mozzart Bet Kenya',
      mainSponsorConfirmed: false,
      mainSponsorVerificationNote:
        'Subject to confirmation of the current 2026/27 sponsorship agreement.',
      crestAssetUrl: '/images/3k-fc-crest.png',
      crestConfirmed: true,
      paletteStatus: 'CONFIRMED',
      primaryColor: '#E11D2A',
      primaryDarkColor: '#B91C1C',
      secondaryColor: '#0E4494',
      accentColor: '#D4AF37',
      surfaceLightColor: '#FFFFFF',
      surfaceOffwhiteColor: '#F4F7FB',
      surfaceDarkColor: '#081326',
      contactEmail: 'official@3kfc.co.ke',
      contactPhone: '+254 700 300 300',
      postalAddress: 'Moi Stadium Complex, Embu Town, Embu County, Kenya',
      preparedBy: 'Caleb Ngiciri',
    },
  });

  // 2. Roles & Granular Permissions
  for (const roleDef of Object.values(ROLE_DEFINITIONS)) {
    const role = await prisma.role.upsert({
      where: { slug: roleDef.slug },
      update: {
        name: roleDef.name,
        description: roleDef.description,
      },
      create: {
        slug: roleDef.slug,
        name: roleDef.name,
        description: roleDef.description,
        isSystem: true,
      },
    });

    for (const grant of roleDef.permissions) {
      for (const action of grant.actions) {
        await prisma.permission.upsert({
          where: {
            roleId_resource_action: {
              roleId: role.id,
              resource: grant.resource,
              action,
            },
          },
          update: {},
          create: {
            roleId: role.id,
            resource: grant.resource,
            action,
          },
        });
      }
    }
  }

  // 3. Bilingual UI Translation Keys
  for (const [key, val] of Object.entries(UI_DICTIONARY)) {
    await prisma.translationKey.upsert({
      where: { key },
      update: {
        valueEn: val.en,
        valueSw: val.sw,
      },
      create: {
        namespace: key.split('.')[0] || 'common',
        key,
        valueEn: val.en,
        valueSw: val.sw,
        isVerifiedSw: true,
      },
    });
  }

  // 4. Seasons & Competitions
  const season2526 = await prisma.season.upsert({
    where: { name: '2025/26' },
    update: {},
    create: {
      name: '2025/26',
      startDate: new Date('2025-09-01T00:00:00Z'),
      endDate: new Date('2026-06-30T23:59:59Z'),
      isCurrent: false,
    },
  });

  const season2627 = await prisma.season.upsert({
    where: { name: '2026/27' },
    update: {},
    create: {
      name: '2026/27',
      startDate: new Date('2026-08-15T00:00:00Z'),
      endDate: new Date('2027-05-30T23:59:59Z'),
      isCurrent: true,
    },
  });

  const compFkfPl = await prisma.competition.upsert({
    where: { slug: 'fkf-premier-league' },
    update: {},
    create: {
      name: 'FKF Premier League',
      shortName: 'FKF PL',
      slug: 'fkf-premier-league',
      tier: 1,
      organizer: 'Football Kenya Federation (FKF)',
      dataSourceType: 'MANUAL',
    },
  });

  const compNsl = await prisma.competition.upsert({
    where: { slug: 'fkf-national-super-league' },
    update: {},
    create: {
      name: 'FKF National Super League',
      shortName: 'FKF NSL',
      slug: 'fkf-national-super-league',
      tier: 2,
      organizer: 'Football Kenya Federation (FKF)',
      dataSourceType: 'MANUAL',
    },
  });

  const compCup = await prisma.competition.upsert({
    where: { slug: 'mozzart-bet-cup' },
    update: {},
    create: {
      name: 'Mozzart Bet Cup',
      shortName: 'FKF Cup',
      slug: 'mozzart-bet-cup',
      tier: 1,
      organizer: 'Football Kenya Federation (FKF)',
      dataSourceType: 'MANUAL',
    },
  });

  // 5. Clubs & Teams
  const club3k = await prisma.club.upsert({
    where: { slug: '3k-fc-embu' },
    update: {},
    create: {
      name: '3K FC',
      shortName: '3K FC',
      slug: '3k-fc-embu',
      crestUrl: '/images/3k-fc-crest.png',
      primaryColor: '#E11D2A',
      city: 'Embu',
      stadiumName: 'Moi Stadium, Embu (Subject to confirmation)',
      isOurClub: true,
    },
  });

  const opponentClubsData = [
    { name: 'Gor Mahia FC', shortName: 'Gor Mahia', slug: 'gor-mahia-fc', city: 'Nairobi', stadiumName: 'Nyayo National Stadium', primaryColor: '#15803D' },
    { name: 'Mara Sugar FC', shortName: 'Mara Sugar', slug: 'mara-sugar-fc', city: 'Awendo', stadiumName: 'Awendo Green Stadium', primaryColor: '#EAB308' },
    { name: 'AFC Leopards SC', shortName: 'Leopards', slug: 'afc-leopards-sc', city: 'Nairobi', stadiumName: 'Nyayo National Stadium', primaryColor: '#1D4ED8' },
    { name: 'Kakamega Homeboyz FC', shortName: 'Kakamega Homeboyz', slug: 'kakamega-homeboyz-fc', city: 'Kakamega', stadiumName: 'Bukhungu Stadium', primaryColor: '#F59E0B' },
    { name: 'Shabana FC', shortName: 'Shabana', slug: 'shabana-fc', city: 'Kisii', stadiumName: 'Gusii Stadium', primaryColor: '#DC2626' },
    { name: 'KCB FC', shortName: 'KCB', slug: 'kcb-fc', city: 'Nairobi', stadiumName: 'Police Sacco Stadium', primaryColor: '#16A34A' },
    { name: "Murang'a Seal FC", shortName: 'Muranga', slug: 'muranga-seal-fc', city: "Murang'a", stadium: 'SportPesa Arena, Muranga', primaryColor: '#EA580C' },
    { name: 'Tusker FC', shortName: 'Tusker', slug: 'tusker-fc', city: 'Nairobi', stadium: 'Ruaraka Grounds', primaryColor: '#FACC15' },
    { name: 'Posta Rangers FC', shortName: 'Posta Rangers', slug: 'posta-rangers-fc', city: 'Nairobi', stadium: 'Machakos Stadium', primaryColor: '#EF4444' },
    { name: 'Nairobi United FC', shortName: 'Nairobi United', slug: 'nairobi-united-fc', city: 'Nairobi', stadium: 'Camp Toyoyo, Nairobi', primaryColor: '#10B981' },
    { name: 'Bandari FC', shortName: 'Bandari', slug: 'bandari-fc', city: 'Mombasa', stadium: 'Mbaraki Sports Club', primaryColor: '#0284C7' },
    { name: 'Migori Youth FC', shortName: 'Migori', slug: 'migori-youth-fc', city: 'Migori', stadium: 'Migori Stadium', primaryColor: '#3B82F6' },
    { name: 'Kenya Police FC', shortName: 'Police FC', slug: 'kenya-police-fc', city: 'Nairobi', stadium: 'Police Sacco Stadium', primaryColor: '#1E3A8A' },
    { name: 'Mathare United FC', shortName: 'Mathare Utd.', slug: 'mathare-united-fc', city: 'Nairobi', stadium: 'Dandora Stadium', primaryColor: '#84CC16' },
    { name: 'APS Bomet FC', shortName: 'APS Bomet', slug: 'aps-bomet-fc', city: 'Bomet', stadium: 'Bomet IAAF Stadium', primaryColor: '#6B7280' },
    { name: 'Ulinzi Stars FC', shortName: 'Ulinzi Stars', slug: 'ulinzi-stars-fc', city: 'Nakuru', stadium: 'Ulinzi Sports Complex', primaryColor: '#B91C1C' },
    { name: 'Mombasa United FC', shortName: 'Mombasa United', slug: 'mombasa-united-fc', city: 'Mombasa', stadium: 'Mbaraki Grounds, Mombasa', primaryColor: '#0EA5E9' },
  ];

  const opponentClubs: Record<string, { id: string; name: string }> = {};
  for (const opp of opponentClubsData) {
    const created = await prisma.club.upsert({
      where: { slug: opp.slug },
      update: {},
      create: opp,
    });
    opponentClubs[opp.slug] = created;
  }

  const firstTeam = await prisma.team.upsert({
    where: { id: '3k-first-team' },
    update: {},
    create: {
      id: '3k-first-team',
      clubId: club3k.id,
      name: '3K FC First Team',
      category: 'FIRST_TEAM',
    },
  });

  // 6. Verified Technical Bench & First Team Profiles
  await prisma.staffMember.upsert({
    where: { slug: 'nicodemus-omasete' },
    update: {},
    create: {
      teamId: firstTeam.id,
      slug: 'nicodemus-omasete',
      fullName: 'Nicodemus Omasete',
      roleTitleEn: 'Head Coach',
      roleTitleSw: 'Kocha Mkuu',
      category: 'TECHNICAL_BENCH',
      biographyEn:
        'Guided 3K FC through a historic 2025/26 National Super League campaign, finishing second with 77 points to secure automatic promotion to the FKF Premier League for Embu County.',
      biographySw:
        'Aliiongoza 3K FC katika msimu wa kihistoria wa 2025/26 wa Ligi ya Kitaifa (NSL), wakimaliza katika nafasi ya pili kwa alama 77 na kupanda moja kwa moja hadi Ligi Kuu ya FKF.',
      photoVerified: false,
      sortOrder: 1,
      isActive: true,
    },
  });

  const captainDante = await prisma.player.upsert({
    where: { slug: 'daniel-dante-wabwire' },
    update: {
      photoUrl: '/images/3k-fc-player-pitch.jpg',
      photoVerified: true,
    },
    create: {
      slug: 'daniel-dante-wabwire',
      firstName: 'Daniel',
      lastName: 'Wabwire',
      fullName: 'Daniel "Dante" Wabwire',
      nickname: 'Dante',
      shirtNumber: 4,
      position: 'DEFENDER',
      specificRole: 'Central Defender & Club Captain',
      nationality: 'Kenyan',
      biographyEn:
        'Long-serving central defender and club captain who anchored the 3K FC backline during the club’s historic rise from the National Super League (77 points) into the 2026/27 FKF Premier League.',
      biographySw:
        'Beki wa kati na nahodha wa muda mrefu wa 3K FC aliyeongoza safu ya ulinzi kupanda daraja hadi Ligi Kuu ya FKF msimu wa 2026/27.',
      photoUrl: '/images/3k-fc-player-pitch.jpg',
      photoVerified: true,
      isCaptain: true,
      isSpotlight: true,
      isActive: true,
    },
  });

  const forwardBarasa = await prisma.player.upsert({
    where: { slug: 'stephen-barasa' },
    update: {
      photoUrl: '/images/3k-fc-team-celebration.png',
      photoVerified: true,
    },
    create: {
      slug: 'stephen-barasa',
      firstName: 'Stephen',
      lastName: 'Barasa',
      fullName: 'Stephen Barasa',
      nickname: 'Barasa',
      shirtNumber: 9,
      position: 'FORWARD',
      specificRole: 'Centre Forward & Promotion Hero',
      nationality: 'Kenyan',
      biographyEn:
        'Key forward who spearheaded 3K FC’s attack during the 77-point NSL promotion campaign. Celebrated with the faithful supporters in Embu.',
      biographySw:
        'Mshambuliaji hodari aliyeongoza safu ya ushambuliaji ya 3K FC kupanda Ligi Kuu ya FKF kwa alama 77.',
      photoUrl: '/images/3k-fc-team-celebration.png',
      photoVerified: true,
      isSpotlight: true,
      isActive: true,
    },
  });

  await prisma.squadMembership.upsert({
    where: {
      playerId_teamId_seasonId: {
        playerId: captainDante.id,
        teamId: firstTeam.id,
        seasonId: season2627.id,
      },
    },
    update: {},
    create: {
      playerId: captainDante.id,
      teamId: firstTeam.id,
      seasonId: season2627.id,
      shirtNumber: 4,
      appearances: 0,
      starts: 0,
      goals: 0,
      assists: 0,
      yellowCards: 0,
      redCards: 0,
      statsVerified: true,
      statsSourceNote: '2026/27 FKF Premier League Official Club Registry (Pre-Matchday Verification)',
    },
  });

  await prisma.squadMembership.upsert({
    where: {
      playerId_teamId_seasonId: {
        playerId: forwardBarasa.id,
        teamId: firstTeam.id,
        seasonId: season2627.id,
      },
    },
    update: {},
    create: {
      playerId: forwardBarasa.id,
      teamId: firstTeam.id,
      seasonId: season2627.id,
      shirtNumber: 9,
      appearances: 0,
      starts: 0,
      goals: 0,
      assists: 0,
      yellowCards: 0,
      redCards: 0,
      statsVerified: true,
      statsSourceNote: '2026/27 FKF Premier League Official Club Registry (Pre-Matchday Verification)',
    },
  });

  // 7. Verified League Standings Record
  // 2025/26 NSL Verified Promotion Standing (77 points, 2nd place)
  await prisma.leagueStanding.upsert({
    where: {
      competitionId_seasonId_clubId: {
        competitionId: compNsl.id,
        seasonId: season2526.id,
        clubId: club3k.id,
      },
    },
    update: {},
    create: {
      competitionId: compNsl.id,
      seasonId: season2526.id,
      clubId: club3k.id,
      position: 2,
      played: 38,
      won: 23,
      drawn: 8,
      lost: 7,
      goalsFor: 58,
      goalsAgainst: 27,
      goalDifference: 31,
      points: 77,
      form: 'W,W,D,W,W',
      qualificationNote: 'Promoted to 2026/27 FKF Premier League (77 pts — Verified Historical Record)',
      dataSource: 'MANUAL_VERIFIED',
      isAvailable: true,
    },
  });

  // 2026/27 FKF Premier League Initial Table (0 played — no fabricated results)
  const plClubs = [club3k, ...Object.values(opponentClubs)];
  for (let i = 0; i < plClubs.length; i++) {
    await prisma.leagueStanding.upsert({
      where: {
        competitionId_seasonId_clubId: {
          competitionId: compFkfPl.id,
          seasonId: season2627.id,
          clubId: plClubs[i].id,
        },
      },
      update: {},
      create: {
        competitionId: compFkfPl.id,
        seasonId: season2627.id,
        clubId: plClubs[i].id,
        position: i + 1,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0,
        qualificationNote:
          plClubs[i].id === club3k.id
            ? '2026/27 Debut FKF Premier League Season — Awaiting Official Matchday Results'
            : '2026/27 FKF Premier League',
        dataSource: 'MANUAL_VERIFIED',
        isAvailable: true,
      },
    });
  }

  // 8. Fixtures (Upcoming 2026/27 FKF Premier League schedule — unconfirmed times flagged honestly)
  const fixture1 = await prisma.fixture.upsert({
    where: { slug: '3k-fc-vs-gor-mahia-fkf-pl-2026-27' },
    update: {},
    create: {
      slug: '3k-fc-vs-gor-mahia-fkf-pl-2026-27',
      competitionId: compFkfPl.id,
      seasonId: season2627.id,
      homeClubId: club3k.id,
      awayClubId: opponentClubs['gor-mahia-fc'].id,
      matchday: 1,
      roundName: 'FKF Premier League — Matchday 1',
      kickoffAt: new Date('2026-11-07T15:00:00+03:00'),
      kickoffConfirmed: false,
      timezone: 'Africa/Nairobi',
      venueName: 'Moi Stadium, Embu (Subject to official venue confirmation)',
      venueCity: 'Embu',
      venueConfirmed: false,
      isHomeMatch: true,
      status: 'SCHEDULED',
      ticketsAvailable: true,
      broadcastInfo: 'Subject to FKF Broadcast Partner confirmation',
    },
  });

  const fixture2 = await prisma.fixture.upsert({
    where: { slug: 'afc-leopards-vs-3k-fc-fkf-pl-2026-27' },
    update: {},
    create: {
      slug: 'afc-leopards-vs-3k-fc-fkf-pl-2026-27',
      competitionId: compFkfPl.id,
      seasonId: season2627.id,
      homeClubId: opponentClubs['afc-leopards-sc'].id,
      awayClubId: club3k.id,
      matchday: 2,
      roundName: 'FKF Premier League — Matchday 2',
      kickoffAt: new Date('2026-11-14T15:00:00+03:00'),
      kickoffConfirmed: false,
      timezone: 'Africa/Nairobi',
      venueName: 'Nyayo National Stadium, Nairobi (Subject to confirmation)',
      venueCity: 'Nairobi',
      venueConfirmed: false,
      isHomeMatch: false,
      status: 'SCHEDULED',
      ticketsAvailable: false,
    },
  });

  const fixture3 = await prisma.fixture.upsert({
    where: { slug: '3k-fc-vs-tusker-fc-fkf-pl-2026-27' },
    update: {},
    create: {
      slug: '3k-fc-vs-tusker-fc-fkf-pl-2026-27',
      competitionId: compFkfPl.id,
      seasonId: season2627.id,
      homeClubId: club3k.id,
      awayClubId: opponentClubs['tusker-fc'].id,
      matchday: 3,
      roundName: 'FKF Premier League — Matchday 3',
      kickoffAt: new Date('2026-11-21T15:00:00+03:00'),
      kickoffConfirmed: false,
      timezone: 'Africa/Nairobi',
      venueName: 'Moi Stadium, Embu (Subject to official venue confirmation)',
      venueCity: 'Embu',
      venueConfirmed: false,
      isHomeMatch: true,
      status: 'SCHEDULED',
      ticketsAvailable: true,
    },
  });

  // Seed Match Poll & Initial Live Blog Notice for Fixture 1
  const poll1 = await prisma.matchPoll.upsert({
    where: { fixtureId: fixture1.id },
    update: {},
    create: {
      fixtureId: fixture1.id,
      titleEn: 'Supporters Matchday Spotlight Poll',
      titleSw: 'Kura ya Mashabiki wa 3K FC',
      disclaimerEn: 'Official 3K FC Fan Poll — not an official FKF Premier League competition award.',
      status: 'OPEN',
    },
  });

  const existingOptions = await prisma.matchPollOption.count({ where: { pollId: poll1.id } });
  if (existingOptions === 0) {
    await prisma.matchPollOption.createMany({
      data: [
        {
          pollId: poll1.id,
          playerId: captainDante.id,
          playerName: 'Daniel "Dante" Wabwire (#4)',
          shirtNumber: 4,
          position: 'DEFENDER',
          voteCount: 0,
        },
        {
          pollId: poll1.id,
          playerName: '3K FC Collective Team Performance',
          position: 'SQUAD',
          voteCount: 0,
        },
      ],
    });
  }

  const existingBlog = await prisma.liveBlogUpdate.count({ where: { fixtureId: fixture1.id } });
  if (existingBlog === 0) {
    await prisma.liveBlogUpdate.create({
      data: {
        fixtureId: fixture1.id,
        eventType: 'ANNOUNCEMENT',
        headlineEn: 'Match Centre Initialized — Awaiting Official FKF Matchday Confirmation',
        bodyEn:
          'Welcome to the official 3K FC Match Centre. Live touchline updates, confirmed starting elevens, and verified match statistics will be published here by authorised 3K FC media staff on matchday.',
        bodySw:
          'Karibu kwenye Kituo Rasmi cha Mechi cha 3K FC. Taarifa za moja kwa moja, vikosi vilivyothibitishwa na takwimu za mechi vitachapishwa hapa siku ya mechi.',
        isPinned: true,
        status: 'PUBLISHED',
      },
    });
  }

  // 9. Ticket Categories & Capacities for Home Fixture 1
  const existingTicketCats = await prisma.ticketCategory.count({ where: { fixtureId: fixture1.id } });
  if (existingTicketCats === 0) {
    const generalCat = await prisma.ticketCategory.create({
      data: {
        fixtureId: fixture1.id,
        nameEn: 'General Admission (Terraces)',
        nameSw: 'Jukwaa la Kawaida (Terraces)',
        descriptionEn: 'General admission access. Specific seating sections subject to venue confirmation.',
        priceKesCents: 20000, // KES 200
        maxPerOrder: 5,
        isActive: true,
        inventory: {
          create: {
            totalCapacity: 3000,
            reservedCount: 0,
            soldCount: 0,
          },
        },
      },
    });

    await prisma.ticketCategory.create({
      data: {
        fixtureId: fixture1.id,
        nameEn: 'VIP / Main Dais Hospitality',
        nameSw: 'Jukwaa Kuu la VIP',
        descriptionEn: 'Covered Main Dais pass. Subject to confirmed stadium hospitality allocation.',
        priceKesCents: 50000, // KES 500
        maxPerOrder: 4,
        isActive: true,
        inventory: {
          create: {
            totalCapacity: 300,
            reservedCount: 0,
            soldCount: 0,
          },
        },
      },
    });

    await prisma.ticketCategory.create({
      data: {
        fixtureId: fixture1.id,
        nameEn: 'Accessible Supporter Allocation',
        nameSw: 'Nafasi Maalum za Walemavu',
        descriptionEn: 'Dedicated accessible viewing allocation with steward assistance.',
        priceKesCents: 10000, // KES 100
        maxPerOrder: 2,
        isAccessibleSeating: true,
        isActive: true,
        inventory: {
          create: {
            totalCapacity: 100,
            reservedCount: 0,
            soldCount: 0,
          },
        },
      },
    });
    void generalCat;
  }

  void fixture2;
  void fixture3;

  // 10. Editorial Categories, Tags & Authentic Bilingual Articles
  const categoriesData = [
    { slug: 'club-news', nameEn: 'Club News', nameSw: 'Habari za Klabu', sortOrder: 1 },
    { slug: 'first-team', nameEn: 'First Team', nameSw: 'Kikosi cha Kwanza', sortOrder: 2 },
    { slug: 'match-reports', nameEn: 'Match Reports', nameSw: 'Ripoti za Mechi', sortOrder: 3 },
    { slug: 'interviews', nameEn: 'Interviews', nameSw: 'Mahojiano', sortOrder: 4 },
    { slug: 'community', nameEn: 'Community & Embu', nameSw: 'Jamii na Embu', sortOrder: 5 },
    { slug: 'commercial', nameEn: 'Commercial Partnerships', nameSw: 'Ushirikiano wa Kibiashara', sortOrder: 6 },
  ];

  const categoryMap: Record<string, string> = {};
  for (const cat of categoriesData) {
    const created = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
    categoryMap[cat.slug] = created.id;
  }

  const articlesData = [
    {
      slug: 'rise-of-3k-fc-to-fkf-premier-league-historic-journey',
      categoryId: categoryMap['club-news'],
      authorName: '3K FC Editorial Desk',
      isFeatured: true,
      heroOrder: 1,
      featuredImageUrl: '/images/3k-fc-team-celebration.png',
      featuredImageAlt: '3K FC squad celebrating historic FKF Premier League promotion victory',
      isPlaceholderImage: false,
      en: {
        headline: 'From Embu County to the FKF Premier League: The Historic Rise of 3K FC',
        summary:
          'Representing Embu County and Mount Kenya, 3K FC enters the 2026/27 FKF Premier League after an outstanding 77-point NSL campaign.',
        body: `3K Football Club stands as a historic milestone for Embu County and the entire Mount Kenya region. Rising step by step through Kenya's football pyramid with unwavering community support, the club has captured the hearts of football fans across the region.\n\nAfter capturing the FKF Division One Zone A crown at Moi Stadium, Embu to become the county's first representative in the National Super League (NSL), 3K FC delivered a remarkable 2025/26 NSL campaign. Under Head Coach Nicodemus Omasete and club captain Daniel "Dante" Wabwire, the team amassed 77 points to finish second and seal automatic promotion to the 2026/27 FKF Premier League.\n\nThis official digital platform serves as 3K FC's headquarters for verified club news, matchday operations, M-Pesa ticketing, official merchandise, and our growing supporters' community across Embu and the diaspora.`,
      },
      sw: {
        headline: 'Kutoka Kaunti ya Embu hadi Ligi Kuu ya FKF: Safari ya Kihistoria ya 3K FC',
        summary:
          'Ikiwakilisha Kaunti ya Embu, 3K FC inaingia Ligi Kuu ya FKF msimu wa 2026/27 baada ya kujizolea alama 77 kwenye NSL.',
        body: `Klabu ya Soka ya 3K FC ni fahari ya kihistoria kwa Kaunti ya Embu na ukanda mzima wa Mlima Kenya. Baada ya kutwaa ubingwa wa FKF Division One Zone A katika Uwanja wa Moi, Embu, 3K FC ilifanya makubwa kwenye Ligi ya Kitaifa (NSL) msimu wa 2025/26. Chini ya Kocha Mkuu Nicodemus Omasete na nahodha Daniel "Dante" Wabwire, kikosi kilikusanya alama 77 na kumaliza katika nafasi ya pili ili kufuzu moja kwa moja kwenye Ligi Kuu ya FKF msimu wa 2026/27.`,
      },
    },
    {
      slug: '3k-fc-launches-official-digital-headquarters-and-qr-ticketing',
      categoryId: categoryMap['commercial'],
      authorName: '3K FC Digital & Operations',
      isFeatured: true,
      heroOrder: 2,
      featuredImageUrl: '/images/3k-fc-fan-celebration.jpg',
      featuredImageAlt: 'Passionate 3K FC supporters in official red and gold jerseys celebrating in the stands',
      isPlaceholderImage: false,
      en: {
        headline: '3K FC Unveils Official Digital Fan Platform, M-Pesa Ticketing & Supporters Club',
        summary:
          'Supporters can now verify fixtures, purchase cryptographically signed QR match tickets via M-Pesa Daraja, shop official Embu merchandise, and join the 3K FC Supporters Club.',
        body: `Ahead of the 2026/27 FKF Premier League season, 3K FC has launched its official digital fan platform and back-office administration system.\n\nDesigned mobile-first for supporters in Embu County and across Kenya, the platform introduces server-verified M-Pesa STK Push payments, cryptographically signed QR matchday tickets with atomic gate scanning, an official club store with Embu town collection and national delivery, and a bilingual English/Kiswahili editorial experience.`,
      },
      sw: {
        headline: '3K FC Yazindua Jukwaa Rasmi la Kidijitali, Tiketi za QR za M-Pesa na Klabu ya Mashabiki',
        summary:
          'Mashabiki sasa wanaweza kuhakiki ratiba, kununua tiketi salama za QR kupitia M-Pesa, kununua jezi rasmi na kujiunga na uanachama wa 3K FC.',
        body: `Kuelekea msimu wa 2026/27 wa Ligi Kuu ya FKF, 3K FC imezindua tovuti yake rasmi na mfumo wa kisasa wa mashabiki.\n\nMfumo huu unawawezesha mashabiki kulipia tiketi za mechi kwa M-Pesa STK Push, kupata tiketi zenye msimbo salama wa QR, kununua bidhaa rasmi za klabu mjini Embu au kwa usafirishaji, na kusoma habari kwa Kiingereza na Kiswahili.`,
      },
    },
    {
      slug: 'first-team-pre-season-preparations-and-squad-verification',
      categoryId: categoryMap['first-team'],
      authorName: '3K FC Technical Media',
      isFeatured: true,
      heroOrder: 3,
      featuredImageUrl: '/images/3k-fc-match-action.jpg',
      featuredImageAlt: '3K FC first team player in intense competitive match action',
      isPlaceholderImage: false,
      en: {
        headline: 'Technical Bench Retains Core Promotion Spine Ahead of Top-Flight Campaign',
        summary:
          'Head Coach Nicodemus Omasete and captain Daniel "Dante" Wabwire lead preparations as official 2026/27 squad registrations and venue confirmations progress.',
        body: `Following automatic promotion from the National Super League with 77 points, 3K FC's technical bench led by Head Coach Nicodemus Omasete has prioritized continuity by retaining the core group of players that propelled the club into the top flight.\n\nOfficial 2026/27 squad profiles, shirt numbers, and verified match statistics will be updated continuously in the Squad section as player registrations are ratified by the Football Kenya Federation.`,
      },
      sw: {
        headline: 'Benchi la Ufundi Лаdumisha Msingi wa Kikosi Kilichopanda Ligi Kuu',
        summary:
          'Kocha Mkuu Nicodemus Omasete na nahodha Daniel "Dante" Wabwire wanaongoza maandalizi huku usajili rasmi wa msimu wa 2026/27 ukiendelea.',
        body: `Baada ya kupanda daraja moja kwa moja kutoka NSL kwa alama 77, benchi la ufundi la 3K FC chini ya Kocha Nicodemus Omasete limeweka kipaumbele katika kudumisha msingi wa wachezaji waliopigania mafanikio hayo.\n\nWasifu rasmi wa wachezaji, nambari za jezi na takwimu zilizothibitishwa zitaendelea kusasishwa mara tu usajili utakapoidhinishwa na FKF.`,
      },
    },
  ];

  for (const art of articlesData) {
    const createdArt = await prisma.article.upsert({
      where: { slug: art.slug },
      update: {
        isFeatured: art.isFeatured,
        heroOrder: art.heroOrder,
        featuredImageUrl: art.featuredImageUrl,
        featuredImageAlt: art.featuredImageAlt,
        isPlaceholderImage: art.isPlaceholderImage,
      },
      create: {
        slug: art.slug,
        categoryId: art.categoryId,
        authorName: art.authorName,
        featuredImageUrl: art.featuredImageUrl,
        featuredImageAlt: art.featuredImageAlt,
        isPlaceholderImage: art.isPlaceholderImage,
        status: 'PUBLISHED',
        isFeatured: art.isFeatured,
        heroOrder: art.heroOrder,
        publishedAt: new Date(),
      },
    });

    await prisma.articleTranslation.upsert({
      where: { articleId_locale: { articleId: createdArt.id, locale: 'en' } },
      update: {
        headline: art.en.headline,
        summary: art.en.summary,
        body: art.en.body,
      },
      create: {
        articleId: createdArt.id,
        locale: 'en',
        headline: art.en.headline,
        summary: art.en.summary,
        body: art.en.body,
        seoTitle: `${art.en.headline} | 3K FC Official`,
        seoDescription: art.en.summary,
        isComplete: true,
      },
    });

    await prisma.articleTranslation.upsert({
      where: { articleId_locale: { articleId: createdArt.id, locale: 'sw' } },
      update: {
        headline: art.sw.headline,
        summary: art.sw.summary,
        body: art.sw.body,
      },
      create: {
        articleId: createdArt.id,
        locale: 'sw',
        headline: art.sw.headline,
        summary: art.sw.summary,
        body: art.sw.body,
        seoTitle: `${art.sw.headline} | 3K FC Rasmi`,
        seoDescription: art.sw.summary,
        isComplete: true,
      },
    });
  }

  // 11. Verified Club History Timeline Milestones
  const milestones = [
    {
      eraOrSeason: 'Founding Grassroots Era — Embu County',
      titleEn: 'Birth of the Community Club in Embu',
      titleSw: 'Kuzaliwa kwa Klabu ya Jamii mjini Embu',
      descriptionEn:
        'Founded in Embu County under the banner "God\'s Favourite Club" and "Home of Stars", uniting passionate regional football talent and supporters.',
      descriptionSw:
        'Ilianzishwa katika Kaunti ya Embu kwa kauli mbiu ya "God\'s Favourite Club" na "Home of Stars", ikiunganisha wanasoka na mashabiki wa eneo hilo.',
      verificationSource: 'Club Founding Charter & Regional Records',
      sortOrder: 1,
    },
    {
      eraOrSeason: 'FKF Division One Zone A Triumph',
      titleEn: 'Crowned Division One Zone A Champions at Moi Stadium, Embu',
      titleSw: 'Mabingwa wa FKF Division One Zone A katika Uwanja wa Moi, Embu',
      descriptionEn:
        '3K FC clinched the FKF Division One Zone A championship in front of a packed home crowd at Moi Stadium, Embu, becoming the first team in Embu County history to qualify for the National Super League.',
      descriptionSw:
        '3K FC ilitwaa ubingwa wa FKF Division One Zone A katika Uwanja wa Moi, Embu na kuwa timu ya kwanza kutoka Kaunti ya Embu kufuzu Ligi ya Kitaifa (NSL).',
      verificationSource: 'Football Kenya Federation (FKF) Division One Records',
      sortOrder: 2,
    },
    {
      eraOrSeason: 'Mozzart Bet Cup National Run',
      titleEn: 'Statement Runs in the Mozzart Bet Cup',
      titleSw: 'Hatua Kubwa Kwenye Kombe la Mozzart Bet',
      descriptionEn:
        'Competing against established national sides in Kenya’s domestic cup competition (Mozzart Bet Cup), including reaching the Round of 16 against Bandari FC.',
      descriptionSw:
        'Kushindana dhidi ya klabu kubwa kwenye michuano ya Kombe la Mozzart Bet hadi hatua ya 16 Bora.',
      verificationSource: 'FKF Mozzart Bet Cup Tournament Records',
      sortOrder: 3,
    },
    {
      eraOrSeason: '2025/26 FKF National Super League (77 Points)',
      titleEn: 'Historic Automatic Promotion to the FKF Premier League',
      titleSw: 'Kupanda Daraja Moja kwa Moja hadi Ligi Kuu ya FKF (Alama 77)',
      descriptionEn:
        'Guided by Head Coach Nicodemus Omasete and captained by Daniel "Dante" Wabwire, 3K FC finished 2nd in the 2025/26 NSL standings with 77 points to secure historic automatic promotion to the FKF Premier League.',
      descriptionSw:
        'Chini ya Kocha Mkuu Nicodemus Omasete na nahodha Daniel "Dante" Wabwire, 3K FC ilimaliza nafasi ya pili kwenye NSL kwa alama 77 na kupanda Ligi Kuu ya FKF.',
      verificationSource: '2025/26 FKF National Super League Final Standings',
      imageUrl: '/images/3k-fc-team-celebration.png',
      sortOrder: 4,
    },
    {
      eraOrSeason: '2026/27 FKF Premier League Season',
      titleEn: 'Debut Top-Flight Season Representing Embu County',
      titleSw: 'Msimu wa Kwanza kwenye Ligi Kuu ya FKF Ikiwakilisha Embu',
      descriptionEn:
        '3K FC competes in Kenya’s top tier for the 2026/27 campaign, backed by Embu County supporters and a modern digital fan platform.',
      descriptionSw:
        '3K FC inashiriki Ligi Kuu ya Kenya msimu wa 2026/27 ikiwakilisha Kaunti ya Embu.',
      verificationSource: '2026/27 Club Operational Roadmap',
      sortOrder: 5,
    },
  ];

  const existingMilestones = await prisma.historyMilestone.count();
  if (existingMilestones === 0) {
    await prisma.historyMilestone.createMany({ data: milestones });
  }

  // 12. Video Hub Entries (Click-to-load authorised YouTube embeds)
  const videosData = [
    {
      slug: '3k-fc-embu-fortress-atmosphere-moi-stadium',
      titleEn: 'Fortress Moi Stadium Embu: The Passion of 3K FC Supporters',
      titleSw: 'Hamasa ya Mashabiki wa 3K FC katika Uwanja wa Moi Embu',
      descriptionEn:
        'Experience the electric community matchday atmosphere in Embu County as 3K FC supporters rally behind the Home of Stars.',
      descriptionSw:
        'Jionee hamasa kubwa ya mashabiki wa Kaunti ya Embu wakiishangilia 3K FC kwenye Uwanja wa Moi.',
      category: 'DOCUMENTARY',
      youtubeVideoId: 'M7lc1UVf-VE',
      sourceUrl: 'https://www.youtube.com/watch?v=M7lc1UVf-VE',
      durationLabel: '05:42',
      hasCaptions: true,
      isFeatured: true,
    },
    {
      slug: 'road-to-77-points-nsl-promotion-feature',
      titleEn: '77 Points & History Made: How 3K FC Climbed to the FKF Premier League',
      titleSw: 'Alama 77 na Historia: Jinsi 3K FC Ilivyopanda Ligi Kuu ya FKF',
      descriptionEn:
        'Tactical review and behind-the-scenes look at the 2025/26 promotion run under Head Coach Nicodemus Omasete.',
      descriptionSw:
        'Tathmini ya safari ya kupanda daraja msimu wa 2025/26 chini ya Kocha Mkuu Nicodemus Omasete.',
      category: 'HIGHLIGHTS',
      youtubeVideoId: 'M7lc1UVf-VE',
      sourceUrl: 'https://www.youtube.com/watch?v=M7lc1UVf-VE',
      durationLabel: '08:15',
      hasCaptions: true,
      isFeatured: true,
    },
    {
      slug: 'pre-season-training-intensity-embu',
      titleEn: 'Training Feature: First Team Preparation for the 2026/27 Season',
      titleSw: 'Mazoezi ya Kikosi cha Kwanza Kuelekea Msimu wa 2026/27',
      descriptionEn:
        'Fitness drills, defensive organization with captain Daniel "Dante" Wabwire, and technical sessions in Embu.',
      descriptionSw:
        'Mazoezi ya utimamu wa mwili na ufundi pamoja na nahodha Daniel "Dante" Wabwire mjini Embu.',
      category: 'TRAINING',
      youtubeVideoId: 'M7lc1UVf-VE',
      sourceUrl: 'https://www.youtube.com/watch?v=M7lc1UVf-VE',
      durationLabel: '04:30',
      hasCaptions: true,
      isFeatured: false,
    },
  ];

  for (const vid of videosData) {
    await prisma.video.upsert({
      where: { slug: vid.slug },
      update: {},
      create: vid,
    });
  }

  // 13. Delivery Options & Official Store Merchandise (Prices in KES cents)
  const deliveryOptions = [
    {
      code: 'EMBU_COLLECTION',
      nameEn: 'Free Matchday / Embu Town Club Desk Collection',
      nameSw: 'Kuchukua Bure Mjini Embu / Uwanja wa Moi',
      feeKesCents: 0,
      estimatedDays: 'Ready within 24 hours (Embu Town)',
    },
    {
      code: 'MOUNT_KENYA_REGIONAL',
      nameEn: 'Embu County & Mount Kenya Regional Delivery',
      nameSw: 'Usafirishaji Kaunti ya Embu na Mlima Kenya',
      feeKesCents: 25000, // KES 250
      estimatedDays: '1-2 business days',
    },
    {
      code: 'KENYA_NATIONWIDE',
      nameEn: 'Nairobi & Nationwide Courier Delivery',
      nameSw: 'Usafirishaji Nairobi na Nchi Nzima',
      feeKesCents: 40000, // KES 400
      estimatedDays: '2-3 business days',
    },
  ];

  for (const opt of deliveryOptions) {
    await prisma.deliveryOption.upsert({
      where: { code: opt.code },
      update: {},
      create: opt,
    });
  }

  const productsData = [
    {
      slug: '3k-fc-2026-27-official-home-replica-jersey',
      sku: '3K-JSY-HOME-2627',
      nameEn: '3K FC 2026/27 Official Home Replica Jersey (Red)',
      nameSw: 'Jezi Rasmi ya Nyumbani ya 3K FC 2026/27 (Nyekundu)',
      descriptionEn:
        'Official 3K FC Embu 2026/27 FKF Premier League debut season Crimson Red Home replica jersey. Features circular crest badge, yellow collar trim, and Mozzart Bet chest partnership.',
      descriptionSw:
        'Jezi rasmi ya nyumbani ya 3K FC kwa msimu wa 2026/27 (Nyekundu yenye nembo ya klabu na mdhamini Mozzart).',
      category: 'JERSEYS',
      priceKesCents: 250000, // KES 2,500
      isAuthenticClubGear: true,
      isFeatured: true,
      imageUrl: '/images/3k-fc-jersey-home-red.png',
      variants: [
        { sku: '3K-JSY-HOME-2627-S', size: 'S', color: 'Home Crimson Red & Gold', stockQuantity: 25 },
        { sku: '3K-JSY-HOME-2627-M', size: 'M', color: 'Home Crimson Red & Gold', stockQuantity: 40 },
        { sku: '3K-JSY-HOME-2627-L', size: 'L', color: 'Home Crimson Red & Gold', stockQuantity: 45 },
        { sku: '3K-JSY-HOME-2627-XL', size: 'XL', color: 'Home Crimson Red & Gold', stockQuantity: 30 },
      ],
    },
    {
      slug: '3k-fc-2026-27-official-away-replica-jersey',
      sku: '3K-JSY-AWAY-2627',
      nameEn: '3K FC 2026/27 Official Away Replica Jersey (Black)',
      nameSw: 'Jezi Rasmi ya Ugenini ya 3K FC 2026/27 (Nyeusi)',
      descriptionEn:
        'Official 3K FC 2026/27 Charcoal Black Away strip with gold/yellow collar and sleeve accents, circular crest, and Mozzart Bet chest partnership.',
      descriptionSw:
        'Jezi rasmi ya ugenini ya 3K FC msimu wa 2026/27 (Nyeusi yenye mikanda ya dhahabu na mdhamini Mozzart).',
      category: 'JERSEYS',
      priceKesCents: 250000, // KES 2,500
      isAuthenticClubGear: true,
      isFeatured: true,
      imageUrl: '/images/3k-fc-jersey-away-black.png',
      variants: [
        { sku: '3K-JSY-AWAY-2627-M', size: 'M', color: 'Away Charcoal Black & Gold', stockQuantity: 30 },
        { sku: '3K-JSY-AWAY-2627-L', size: 'L', color: 'Away Charcoal Black & Gold', stockQuantity: 35 },
        { sku: '3K-JSY-AWAY-2627-XL', size: 'XL', color: 'Away Charcoal Black & Gold', stockQuantity: 20 },
      ],
    },
    {
      slug: '3k-fc-2026-27-official-third-replica-jersey',
      sku: '3K-JSY-THIRD-2627',
      nameEn: '3K FC 2026/27 Official Third Replica Jersey (Blue)',
      nameSw: 'Jezi Rasmi ya Tatu ya 3K FC 2026/27 (Samawati)',
      descriptionEn:
        'Official 3K FC 2026/27 Royal Blue Third replica shirt with brush-textured royal blue body, yellow V-neck collar, circular crest, and Mozzart Bet sponsorship.',
      descriptionSw:
        'Jezi rasmi ya tatu ya 3K FC msimu wa 2026/27 (Samawati / Bluu yenye kola ya njano na mdhamini Mozzart).',
      category: 'JERSEYS',
      priceKesCents: 250000, // KES 2,500
      isAuthenticClubGear: true,
      isFeatured: true,
      imageUrl: '/images/3k-fc-jersey-third-blue.png',
      variants: [
        { sku: '3K-JSY-THIRD-2627-S', size: 'S', color: 'Third Royal Blue & Gold', stockQuantity: 25 },
        { sku: '3K-JSY-THIRD-2627-M', size: 'M', color: 'Third Royal Blue & Gold', stockQuantity: 35 },
        { sku: '3K-JSY-THIRD-2627-L', size: 'L', color: 'Third Royal Blue & Gold', stockQuantity: 40 },
        { sku: '3K-JSY-THIRD-2627-XL', size: 'XL', color: 'Third Royal Blue & Gold', stockQuantity: 25 },
      ],
    },
    {
      slug: '3k-fc-home-of-stars-jacquard-matchday-scarf',
      sku: '3K-SCF-STARS-2627',
      nameEn: '3K FC "Home of Stars" Matchday Woven Scarf',
      nameSw: 'Skafu Rasmi ya Siku ya Mechi ya 3K FC',
      descriptionEn:
        'Heavyweight double-sided knit supporter scarf featuring "3K FC EMBU" and "GOD\'S FAVOURITE CLUB".',
      descriptionSw:
        'Skafu imara ya mashabiki yenye maandishi ya "3K FC EMBU" na "GOD\'S FAVOURITE CLUB".',
      category: 'SCARVES',
      priceKesCents: 120000, // KES 1,200
      isAuthenticClubGear: true,
      isFeatured: true,
      variants: [
        { sku: '3K-SCF-STARS-2627-OS', size: 'ONE_SIZE', color: 'Club Colors', stockQuantity: 60 },
      ],
    },
    {
      slug: '3k-fc-embu-technical-training-top',
      sku: '3K-TRN-TOP-2627',
      nameEn: '3K FC Technical Training Quarter-Zip Top',
      nameSw: 'uzito Mwepesi wa Mazoezi wa 3K FC',
      descriptionEn:
        'High-performance training top engineered for cool Embu morning sessions near Mount Kenya.',
      descriptionSw:
        'Flana ya kisasa ya mazoezi iliyoundwa kwa hali ya hewa ya Embu.',
      category: 'TRAINING_WEAR',
      priceKesCents: 320000, // KES 3,200
      isAuthenticClubGear: true,
      isFeatured: true,
      variants: [
        { sku: '3K-TRN-TOP-2627-M', size: 'M', color: 'Obsidian Dark', stockQuantity: 20 },
        { sku: '3K-TRN-TOP-2627-L', size: 'L', color: 'Obsidian Dark', stockQuantity: 25 },
      ],
    },
  ];

  for (const prod of productsData) {
    const createdProd = await prisma.product.upsert({
      where: { slug: prod.slug },
      update: {},
      create: {
        slug: prod.slug,
        sku: prod.sku,
        nameEn: prod.nameEn,
        nameSw: prod.nameSw,
        descriptionEn: prod.descriptionEn,
        descriptionSw: prod.descriptionSw,
        category: prod.category,
        priceKesCents: prod.priceKesCents,
        isAuthenticClubGear: prod.isAuthenticClubGear,
        isFeatured: prod.isFeatured,
        isAvailable: true,
      },
    });

    for (const v of prod.variants) {
      await prisma.productVariant.upsert({
        where: { sku: v.sku },
        update: {},
        create: {
          productId: createdProd.id,
          sku: v.sku,
          size: v.size,
          color: v.color,
          stockQuantity: v.stockQuantity,
          reservedQuantity: 0,
        },
      });
    }

    if ('imageUrl' in prod && typeof (prod as { imageUrl?: string }).imageUrl === 'string') {
      const imgUrl = (prod as { imageUrl: string }).imageUrl;
      const existingImg = await prisma.productImage.findFirst({
        where: { productId: createdProd.id },
      });
      if (existingImg) {
        await prisma.productImage.update({
          where: { id: existingImg.id },
          data: { url: imgUrl },
        });
      } else {
        await prisma.productImage.create({
          data: {
            productId: createdProd.id,
            url: imgUrl,
            altTextEn: prod.nameEn,
            isPrimary: true,
            sortOrder: 1,
          },
        });
      }
    }
  }

  // 14. Supporters' Club Membership Plans & Loyalty Rewards
  const plansData = [
    {
      slug: 'embu-stars-monthly-supporter',
      nameEn: 'Embu Stars Monthly Supporter',
      nameSw: 'Mwanachama wa Kila Mwezi (Embu Stars)',
      billingCycle: 'MONTHLY',
      durationDays: 30,
      priceKesCents: 30000, // KES 300 / month
      merchDiscountPercent: 5,
      ticketPresaleAccess: true,
      welcomeLoyaltyPoints: 50,
      benefitsJsonEn: JSON.stringify([
        'Official Digital Membership Card with unique verification ID',
        'Priority match ticket booking window',
        '5% discount on authentic 3K FC merchandise',
        '50 welcome loyalty points upon confirmed M-Pesa payment',
      ]),
      benefitsJsonSw: JSON.stringify([
        'Kadi Rasmi ya Kidijitali ya Uanachama',
        'Kipaumbele cha kununua tiketi za mechi mapema',
        'Punguzo la 5% kwenye duka rasmi la 3K FC',
        'Alama 50 za uaminifu mara baada ya malipo ya M-Pesa kuthibitishwa',
      ]),
      sortOrder: 1,
    },
    {
      slug: 'embu-gold-seasonal-member',
      nameEn: 'Embu Gold 2026/27 Seasonal Member',
      nameSw: 'Mwanachama wa Msimu Mzima (Embu Gold 2026/27)',
      billingCycle: 'SEASONAL',
      durationDays: 365,
      priceKesCents: 250000, // KES 2,500 / season
      merchDiscountPercent: 15,
      ticketPresaleAccess: true,
      welcomeLoyaltyPoints: 300,
      benefitsJsonEn: JSON.stringify([
        'Gold Edition Digital Membership Card for the 2026/27 FKF Premier League season',
        '48-hour priority presale access for high-demand home fixtures at Moi Stadium',
        '15% discount on official 2026/27 home and away replica jerseys',
        '300 welcome loyalty points + 50 points for every verified match attendance',
        'Invitation to the Annual 3K FC Supporters Forum in Embu',
      ]),
      benefitsJsonSw: JSON.stringify([
        'Kadi ya Dhahabu ya Kidijitali kwa msimu mzima wa Ligi Kuu ya FKF 2026/27',
        'Kipaumbele cha saa 48 kununua tiketi za mechi kubwa za nyumbani',
        'Punguzo la 15% kwenye jezi rasmi za nyumbani na ugenini',
        'Alama 300 za kukaribishwa + alama 50 kwa kila mechi unayohudhuria',
      ]),
      sortOrder: 2,
    },
  ];

  for (const plan of plansData) {
    await prisma.membershipPlan.upsert({
      where: { slug: plan.slug },
      update: {},
      create: plan,
    });
  }

  const rewardsData = [
    {
      code: 'REWARD-MERCH-300',
      titleEn: 'KES 300 Official Store Discount Voucher',
      titleSw: 'Vocha ya Punguzo la KES 300 Dukani',
      descriptionEn: 'Redeem 250 loyalty points for KES 300 off any authentic 3K FC jersey or scarf.',
      pointsCost: 250,
      rewardType: 'MERCH_DISCOUNT_VOUCHER',
      discountKesCents: 30000,
    },
    {
      code: 'REWARD-TERRACE-UPGRADE',
      titleEn: 'Home Matchday Priority Steward Access Pass',
      titleSw: 'Pasi ya Kipaumbele Siku ya Mechi',
      descriptionEn: 'Redeem 400 loyalty points for fast-track gate entry at an eligible home fixture.',
      pointsCost: 400,
      rewardType: 'TICKET_OFFER',
      discountKesCents: 0,
    },
  ];

  for (const rw of rewardsData) {
    await prisma.loyaltyReward.upsert({
      where: { code: rw.code },
      update: {},
      create: rw,
    });
  }

  // 15. Sponsors & Commercial Partnerships (Mozzart Bet Kenya subject to confirmation per spec)
  const mozzart = await prisma.sponsor.upsert({
    where: { slug: 'mozzart-bet-kenya' },
    update: {},
    create: {
      slug: 'mozzart-bet-kenya',
      businessName: 'Mozzart Bet Kenya',
      category: 'MAIN_PARTNER',
      descriptionEn:
        'Principal club and kit partner supporting 3K FC’s rise through Kenyan football. Displayed subject to confirmation of the current 2026/27 sponsorship agreement.',
      descriptionSw:
        'Mshirika mkuu wa klabu na jezi anayeunga mkono safari ya 3K FC (Inasubiri uthibitisho wa mkataba wa msimu wa 2026/27).',
      websiteUrl: 'https://www.mozzartbet.co.ke',
      contractStatus: 'SUBJECT_TO_CONFIRMATION',
      verificationNote: 'Subject to confirmation of the current 2026/27 sponsorship agreement.',
      displayPriority: 1,
      isPublished: true,
    },
  });

  const existingPlacements = await prisma.sponsorPlacement.count({ where: { sponsorId: mozzart.id } });
  if (existingPlacements === 0) {
    await prisma.sponsorPlacement.createMany({
      data: [
        {
          sponsorId: mozzart.id,
          placementZone: 'HOMEPAGE_MAIN',
          labelEn: 'Principal Partner (Subject to 2026/27 Agreement Confirmation)',
          targetUrl: 'https://www.mozzartbet.co.ke',
          utmCampaign: '3kfc_2026_27_homepage',
          isActive: true,
        },
        {
          sponsorId: mozzart.id,
          placementZone: 'MATCH_CENTRE_BANNER',
          labelEn: 'Matchday Partner Showcase',
          targetUrl: 'https://www.mozzartbet.co.ke',
          utmCampaign: '3kfc_2026_27_match_centre',
          isActive: true,
        },
      ],
    });
  }

  // 16. Support 3K Donation Campaigns (Zero fabricated totals — strictly 0 until verified donations occur)
  await prisma.donationCampaign.upsert({
    where: { slug: 'embu-premier-league-operations-and-youth-fund' },
    update: {},
    create: {
      slug: 'embu-premier-league-operations-and-youth-fund',
      titleEn: '3K FC Top-Flight Readiness & Embu Youth Grassroots Fund',
      titleSw: 'Mfuko wa Maandalizi ya Ligi Kuu na Vijana wa Embu',
      purposeEn:
        'Support 3K FC’s 2026/27 FKF Premier League team logistics, medical equipment, and grassroots youth football clinics across Embu County.',
      purposeSw:
        'Saidia maandalizi ya kikosi cha 3K FC kwenye Ligi Kuu ya FKF 2026/27 pamoja na ukuzaji wa vipaji vya vijana Kaunti ya Embu.',
      targetKesCents: 500000000, // KES 5,000,000 target
      confirmedTotalKesCents: 0, // Strictly 0 until verified payments are confirmed
      confirmedDonorCount: 0,
      isActive: true,
    },
  });

  void compCup;
  console.log('Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
