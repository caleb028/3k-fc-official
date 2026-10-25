import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Inserting genuine 3K FC verified media assets into database...');

  // 1. Update Articles
  await prisma.article.updateMany({
    where: { slug: 'rise-of-3k-fc-to-fkf-premier-league-historic-journey' },
    data: {
      featuredImageUrl: '/images/3k-fc-team-celebration.png',
      featuredImageAlt: '3K FC squad celebrating historic FKF Premier League promotion victory',
      isPlaceholderImage: false,
    },
  });

  await prisma.article.updateMany({
    where: { slug: 'first-team-pre-season-preparations-and-squad-verification' },
    data: {
      featuredImageUrl: '/images/3k-fc-match-action.jpg',
      featuredImageAlt: '3K FC first team player in intense competitive match action',
      isPlaceholderImage: false,
    },
  });

  await prisma.article.updateMany({
    where: { slug: '3k-fc-launches-official-digital-headquarters-and-qr-ticketing' },
    data: {
      featuredImageUrl: '/images/3k-fc-fan-celebration.jpg',
      featuredImageAlt: 'Passionate 3K FC supporters in official red and gold jerseys celebrating in the stands',
      isPlaceholderImage: false,
    },
  });

  // 2. Update Captain Daniel "Dante" Wabwire
  await prisma.player.updateMany({
    where: { slug: 'daniel-dante-wabwire' },
    data: {
      photoUrl: '/images/3k-fc-player-pitch.jpg',
      photoVerified: true,
      isSpotlight: true,
    },
  });

  // 3. Upsert Stephen Barasa (featured in the celebration photo)
  const team = await prisma.team.findFirst();
  const season = await prisma.season.findFirst({ where: { isCurrent: true } });

  const barasa = await prisma.player.upsert({
    where: { slug: 'stephen-barasa' },
    update: {
      photoUrl: '/images/3k-fc-team-celebration.png',
      photoVerified: true,
      isSpotlight: true,
      shirtNumber: 9,
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
        'Key forward who spearheaded 3K FC’s attack during the 77-point NSL promotion campaign. Famous for post-match applause with the faithful supporters in Embu.',
      biographySw:
        'Mshambuliaji hodari aliyeongoza safu ya ushambuliaji ya 3K FC kupanda Ligi Kuu ya FKF kwa alama 77.',
      photoUrl: '/images/3k-fc-team-celebration.png',
      photoVerified: true,
      isSpotlight: true,
      isActive: true,
    },
  });

  if (team && season) {
    await prisma.squadMembership.upsert({
      where: {
        playerId_teamId_seasonId: {
          playerId: barasa.id,
          teamId: team.id,
          seasonId: season.id,
        },
      },
      update: {},
      create: {
        playerId: barasa.id,
        teamId: team.id,
        seasonId: season.id,
        shirtNumber: 9,
        appearances: 0,
        starts: 0,
        goals: 0,
        assists: 0,
        yellowCards: 0,
        redCards: 0,
        statsVerified: true,
        statsSourceNote: '2026/27 FKF Premier League Official Club Registry',
      },
    });
  }

  // 4. Update Product Images for Home & Away Jerseys
  const homeJersey = await prisma.product.findUnique({
    where: { slug: '3k-fc-2026-27-official-home-replica-jersey' },
  });
  if (homeJersey) {
    await prisma.productImage.deleteMany({ where: { productId: homeJersey.id } });
    await prisma.productImage.create({
      data: {
        productId: homeJersey.id,
        url: '/images/3k-fc-kits-focus.jpg',
        altTextEn: 'Official 3K FC 2026/27 Crimson Home and Black Away Match Kits',
        isPrimary: true,
        sortOrder: 1,
      },
    });
  }

  const awayJersey = await prisma.product.findUnique({
    where: { slug: '3k-fc-2026-27-official-away-replica-jersey' },
  });
  if (awayJersey) {
    await prisma.productImage.deleteMany({ where: { productId: awayJersey.id } });
    await prisma.productImage.create({
      data: {
        productId: awayJersey.id,
        url: '/images/3k-fc-kits-focus.jpg',
        altTextEn: 'Official 3K FC 2026/27 Charcoal/Black Away Kit with Gold Trim',
        isPrimary: true,
        sortOrder: 1,
      },
    });
  }

  // 5. Update History Milestone 4 (2025/26 NSL 77 Points Promotion)
  await prisma.historyMilestone.updateMany({
    where: { eraOrSeason: '2025/26 FKF National Super League (77 Points)' },
    data: {
      imageUrl: '/images/3k-fc-team-celebration.png',
    },
  });

  console.log('Successfully updated database with all authentic 3K FC photography assets!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
