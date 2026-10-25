import { prisma } from '../src/lib/prisma';

export const KPL_TEAMS = [
  { position: 1, name: 'Gor Mahia FC', shortName: 'Gor Mahia', slug: 'gor-mahia-fc', city: 'Nairobi', stadium: 'Nyayo National Stadium', primaryColor: '#15803D' },
  { position: 2, name: 'Mara Sugar FC', shortName: 'Mara Sugar', slug: 'mara-sugar-fc', city: 'Awendo', stadium: 'Awendo Green Stadium', primaryColor: '#EAB308' },
  { position: 3, name: 'AFC Leopards SC', shortName: 'Leopards', slug: 'afc-leopards-sc', city: 'Nairobi', stadium: 'Nyayo National Stadium', primaryColor: '#1D4ED8' },
  { position: 4, name: 'Kakamega Homeboyz FC', shortName: 'Kakamega Homeboyz', slug: 'kakamega-homeboyz-fc', city: 'Kakamega', stadium: 'Bukhungu Stadium', primaryColor: '#F59E0B' },
  { position: 5, name: 'Shabana FC', shortName: 'Shabana', slug: 'shabana-fc', city: 'Kisii', stadium: 'Gusii Stadium', primaryColor: '#DC2626' },
  { position: 6, name: 'KCB FC', shortName: 'KCB', slug: 'kcb-fc', city: 'Nairobi', stadium: 'Police Sacco Stadium', primaryColor: '#16A34A' },
  { position: 7, name: "Murang'a Seal FC", shortName: 'Muranga', slug: 'muranga-seal-fc', city: "Murang'a", stadium: 'SportPesa Arena, Muranga', primaryColor: '#EA580C' },
  { position: 8, name: 'Tusker FC', shortName: 'Tusker', slug: 'tusker-fc', city: 'Nairobi', stadium: 'Ruaraka Grounds', primaryColor: '#FACC15' },
  { position: 9, name: 'Posta Rangers FC', shortName: 'Posta Rangers', slug: 'posta-rangers-fc', city: 'Nairobi', stadium: 'Machakos Stadium', primaryColor: '#EF4444' },
  { position: 10, name: '3K FC', shortName: '3K FC', slug: '3k-fc-embu', city: 'Embu', stadium: 'Moi Stadium, Embu', primaryColor: '#E11D2A', isOurClub: true },
  { position: 11, name: 'Nairobi United FC', shortName: 'Nairobi United', slug: 'nairobi-united-fc', city: 'Nairobi', stadium: 'Camp Toyoyo, Nairobi', primaryColor: '#10B981' },
  { position: 12, name: 'Bandari FC', shortName: 'Bandari', slug: 'bandari-fc', city: 'Mombasa', stadium: 'Mbaraki Sports Club', primaryColor: '#0284C7' },
  { position: 13, name: 'Migori Youth FC', shortName: 'Migori', slug: 'migori-youth-fc', city: 'Migori', stadium: 'Migori Stadium', primaryColor: '#3B82F6' },
  { position: 14, name: 'Kenya Police FC', shortName: 'Police FC', slug: 'kenya-police-fc', city: 'Nairobi', stadium: 'Police Sacco Stadium', primaryColor: '#1E3A8A' },
  { position: 15, name: 'Mathare United FC', shortName: 'Mathare Utd.', slug: 'mathare-united-fc', city: 'Nairobi', stadium: 'Dandora Stadium', primaryColor: '#84CC16' },
  { position: 16, name: 'APS Bomet FC', shortName: 'APS Bomet', slug: 'aps-bomet-fc', city: 'Bomet', stadium: 'Bomet IAAF Stadium', primaryColor: '#6B7280' },
  { position: 17, name: 'Ulinzi Stars FC', shortName: 'Ulinzi Stars', slug: 'ulinzi-stars-fc', city: 'Nakuru', stadium: 'Ulinzi Sports Complex', primaryColor: '#B91C1C' },
  { position: 18, name: 'Mombasa United FC', shortName: 'Mombasa United', slug: 'mombasa-united-fc', city: 'Mombasa', stadium: 'Mbaraki Grounds, Mombasa', primaryColor: '#0EA5E9' },
];

async function seedKplTeams() {
  console.log('Seeding official 18 FKF Premier League (KPL) teams...');

  const compFkfPl = await prisma.competition.findUnique({
    where: { slug: 'fkf-premier-league' }
  });
  if (!compFkfPl) throw new Error('FKF Premier League competition record not found');

  const season2627 = await prisma.season.findUnique({
    where: { name: '2026/27' }
  });
  if (!season2627) throw new Error('2026/27 Season record not found');

  const clubsMap: Record<string, string> = {};

  for (const team of KPL_TEAMS) {
    const club = await prisma.club.upsert({
      where: { slug: team.slug },
      update: {
        name: team.name,
        shortName: team.shortName,
        city: team.city,
        stadiumName: team.stadium,
        primaryColor: team.primaryColor,
        isOurClub: !!team.isOurClub,
      },
      create: {
        name: team.name,
        shortName: team.shortName,
        slug: team.slug,
        city: team.city,
        stadiumName: team.stadium,
        primaryColor: team.primaryColor,
        isOurClub: !!team.isOurClub,
        crestUrl: team.isOurClub ? '/images/3k-fc-crest.png' : null,
      },
    });

    clubsMap[team.slug] = club.id;

    // Check if a standing already exists (preserve points/goals if any have been recorded)
    const existingStanding = await prisma.leagueStanding.findUnique({
      where: {
        competitionId_seasonId_clubId: {
          competitionId: compFkfPl.id,
          seasonId: season2627.id,
          clubId: club.id,
        },
      },
    });

    if (!existingStanding) {
      await prisma.leagueStanding.create({
        data: {
          competitionId: compFkfPl.id,
          seasonId: season2627.id,
          clubId: club.id,
          position: team.position,
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          goalDifference: 0,
          points: 0,
          qualificationNote:
            team.isOurClub
              ? '2026/27 Top Flight Debut Season'
              : team.position <= 2
              ? 'CAF Champions League'
              : team.position === 3
              ? 'CAF Confederation Cup'
              : team.position >= 16
              ? 'Relegation Zone'
              : null,
          dataSource: 'MANUAL_VERIFIED',
          isAvailable: true,
        },
      });
    } else {
      // Update position order if played is 0
      if (existingStanding.played === 0) {
        await prisma.leagueStanding.update({
          where: { id: existingStanding.id },
          data: { position: team.position },
        });
      }
    }
  }

  console.log(`Successfully seeded/updated all ${KPL_TEAMS.length} KPL clubs in database!`);
}

seedKplTeams()
  .catch((e) => {
    console.error('Error seeding KPL teams:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
