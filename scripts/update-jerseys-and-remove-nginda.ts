import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('1. Removing all lines with Nginda ward from dev.db...');

  // Update ClubSettings
  await prisma.clubSettings.updateMany({
    data: {
      foundingWard: 'Embu County, Kenya',
    },
  });

  // Update Articles & Translations
  const oldArticle = await prisma.article.findUnique({
    where: { slug: 'from-nginda-ward-to-fkf-premier-league-3k-fc-historic-journey' },
  });

  if (oldArticle) {
    await prisma.article.update({
      where: { id: oldArticle.id },
      data: {
        slug: 'rise-of-3k-fc-to-fkf-premier-league-historic-journey',
      },
    });

    await prisma.articleTranslation.updateMany({
      where: { articleId: oldArticle.id, locale: 'en' },
      data: {
        headline: 'From Embu County to the FKF Premier League: The Historic Rise of 3K FC',
        summary:
          'Representing Embu County and Mount Kenya, 3K FC enters the 2026/27 FKF Premier League after an outstanding 77-point NSL campaign.',
        body: `3K Football Club stands as a historic milestone for Embu County and the entire Mount Kenya region. Rising step by step through Kenya's football pyramid with unwavering community support, the club has captured the hearts of football fans across the region.\n\nAfter capturing the FKF Division One Zone A crown at Moi Stadium, Embu to become the county's first representative in the National Super League (NSL), 3K FC delivered a remarkable 2025/26 NSL campaign. Under Head Coach Nicodemus Omasete and club captain Daniel "Dante" Wabwire, the team amassed 77 points to finish second and seal automatic promotion to the 2026/27 FKF Premier League.\n\nThis official digital platform serves as 3K FC's headquarters for verified club news, matchday operations, M-Pesa ticketing, official merchandise, and our growing supporters' community.`,
        seoTitle: 'From Embu County to the FKF Premier League | 3K FC Official',
        seoDescription: '3K FC enters the 2026/27 FKF Premier League after an outstanding 77-point NSL campaign.',
      },
    });

    await prisma.articleTranslation.updateMany({
      where: { articleId: oldArticle.id, locale: 'sw' },
      data: {
        headline: 'Kutoka Kaunti ya Embu hadi Ligi Kuu ya FKF: Safari ya Kihistoria ya 3K FC',
        summary:
          'Ikiwakilisha Kaunti ya Embu, 3K FC inaingia Ligi Kuu ya FKF msimu wa 2026/27 baada ya kujizolea alama 77 kwenye NSL.',
        body: `Klabu ya Soka ya 3K FC ni fahari ya kihistoria kwa Kaunti ya Embu na ukanda mzima wa Mlima Kenya. Baada ya kutwaa ubingwa wa FKF Division One Zone A katika Uwanja wa Moi, Embu, 3K FC ilifanya makubwa kwenye Ligi ya Kitaifa (NSL) msimu wa 2025/26. Chini ya Kocha Mkuu Nicodemus Omasete na nahodha Daniel "Dante" Wabwire, kikosi kilikusanya alama 77 na kumaliza katika nafasi ya pili ili kufuzu moja kwa moja kwenye Ligi Kuu ya FKF msimu wa 2026/27.`,
        seoTitle: 'Safari ya Kihistoria ya 3K FC Embu | 3K FC Rasmi',
        seoDescription: '3K FC inaingia Ligi Kuu ya FKF msimu wa 2026/27 baada ya alama 77 kwenye NSL.',
      },
    });
  }

  // Update History Milestones
  await prisma.historyMilestone.updateMany({
    where: { eraOrSeason: 'Founding Grassroots Era — Nginda Ward' },
    data: {
      eraOrSeason: 'Founding Grassroots Era — Embu County',
      titleEn: 'Birth of the Community Club in Embu',
      titleSw: 'Kuzaliwa kwa Klabu ya Jamii mjini Embu',
      descriptionEn:
        'Founded in Embu County under the banner "God\'s Favourite Club" and "Home of Stars", uniting passionate local footballers and supporters.',
      descriptionSw:
        'Ilianzishwa katika Kaunti ya Embu kwa kauli mbiu ya "God\'s Favourite Club" na "Home of Stars", ikiunganisha wanasoka na mashabiki wa eneo hilo.',
    },
  });

  // Update Membership Plan
  await prisma.membershipPlan.updateMany({
    where: { slug: 'nginda-roots-monthly-supporter' },
    data: {
      slug: 'embu-stars-monthly-supporter',
      nameEn: 'Embu Stars Monthly Supporter',
      nameSw: 'Mwanachama wa Kila Mwezi (Embu Stars)',
    },
  });

  // 2. Configure the 3 official team jerseys: Red (Home), Black (Away), Blue (Third)
  console.log('2. Configuring Red Home, Black Away, and Blue Third jerseys in the store catalog...');

  // Home Jersey (Red)
  const homeJersey = await prisma.product.upsert({
    where: { slug: '3k-fc-2026-27-official-home-replica-jersey' },
    update: {
      nameEn: '3K FC 2026/27 Official Home Replica Jersey (Red)',
      nameSw: 'Jezi Rasmi ya Nyumbani ya 3K FC 2026/27 (Nyekundu)',
      descriptionEn:
        'Official 3K FC Embu 2026/27 FKF Premier League debut season Crimson Red Home replica jersey. Features circular crest badge, yellow collar trim, and Mozzart Bet chest partnership.',
      descriptionSw:
        'Jezi rasmi ya nyumbani ya 3K FC kwa msimu wa 2026/27 (Nyekundu yenye nembo ya klabu na mdhamini Mozzart).',
      priceKesCents: 250000,
      isFeatured: true,
      isAuthenticClubGear: true,
    },
    create: {
      slug: '3k-fc-2026-27-official-home-replica-jersey',
      sku: '3K-JSY-HOME-2627',
      nameEn: '3K FC 2026/27 Official Home Replica Jersey (Red)',
      nameSw: 'Jezi Rasmi ya Nyumbani ya 3K FC 2026/27 (Nyekundu)',
      descriptionEn:
        'Official 3K FC Embu 2026/27 FKF Premier League debut season Crimson Red Home replica jersey. Features circular crest badge, yellow collar trim, and Mozzart Bet chest partnership.',
      descriptionSw:
        'Jezi rasmi ya nyumbani ya 3K FC kwa msimu wa 2026/27 (Nyekundu yenye nembo ya klabu na mdhamini Mozzart).',
      category: 'JERSEYS',
      priceKesCents: 250000,
      isAuthenticClubGear: true,
      isFeatured: true,
      isAvailable: true,
    },
  });

  await prisma.productImage.deleteMany({ where: { productId: homeJersey.id } });
  await prisma.productImage.create({
    data: {
      productId: homeJersey.id,
      url: '/images/3k-fc-jersey-home-red.png',
      altTextEn: 'Official 3K FC 2026/27 Crimson Red Home Replica Jersey',
      isPrimary: true,
      sortOrder: 1,
    },
  });

  // Away Jersey (Black)
  const awayJersey = await prisma.product.upsert({
    where: { slug: '3k-fc-2026-27-official-away-replica-jersey' },
    update: {
      nameEn: '3K FC 2026/27 Official Away Replica Jersey (Black)',
      nameSw: 'Jezi Rasmi ya Ugenini ya 3K FC 2026/27 (Nyeusi)',
      descriptionEn:
        'Official 3K FC 2026/27 Charcoal Black Away strip with gold/yellow collar and sleeve accents, circular crest, and Mozzart Bet chest partnership.',
      descriptionSw:
        'Jezi rasmi ya ugenini ya 3K FC msimu wa 2026/27 (Nyeusi yenye mikanda ya dhahabu na mdhamini Mozzart).',
      priceKesCents: 250000,
      isFeatured: true,
      isAuthenticClubGear: true,
    },
    create: {
      slug: '3k-fc-2026-27-official-away-replica-jersey',
      sku: '3K-JSY-AWAY-2627',
      nameEn: '3K FC 2026/27 Official Away Replica Jersey (Black)',
      nameSw: 'Jezi Rasmi ya Ugenini ya 3K FC 2026/27 (Nyeusi)',
      descriptionEn:
        'Official 3K FC 2026/27 Charcoal Black Away strip with gold/yellow collar and sleeve accents, circular crest, and Mozzart Bet chest partnership.',
      descriptionSw:
        'Jezi rasmi ya ugenini ya 3K FC msimu wa 2026/27 (Nyeusi yenye mikanda ya dhahabu na mdhamini Mozzart).',
      category: 'JERSEYS',
      priceKesCents: 250000,
      isAuthenticClubGear: true,
      isFeatured: true,
      isAvailable: true,
    },
  });

  await prisma.productImage.deleteMany({ where: { productId: awayJersey.id } });
  await prisma.productImage.create({
    data: {
      productId: awayJersey.id,
      url: '/images/3k-fc-jersey-away-black.png',
      altTextEn: 'Official 3K FC 2026/27 Charcoal Black Away Replica Jersey',
      isPrimary: true,
      sortOrder: 1,
    },
  });

  // Third Jersey (Blue)
  const thirdJersey = await prisma.product.upsert({
    where: { slug: '3k-fc-2026-27-official-third-replica-jersey' },
    update: {
      nameEn: '3K FC 2026/27 Official Third Replica Jersey (Blue)',
      nameSw: 'Jezi Rasmi ya Tatu ya 3K FC 2026/27 (Samawati)',
      descriptionEn:
        'Official 3K FC 2026/27 Royal Blue Third replica shirt with brush-textured royal blue body, yellow V-neck collar, circular crest, and Mozzart Bet sponsorship.',
      descriptionSw:
        'Jezi rasmi ya tatu ya 3K FC msimu wa 2026/27 (Samawati / Bluu yenye kola ya njano na mdhamini Mozzart).',
      priceKesCents: 250000,
      isFeatured: true,
      isAuthenticClubGear: true,
    },
    create: {
      slug: '3k-fc-2026-27-official-third-replica-jersey',
      sku: '3K-JSY-THIRD-2627',
      nameEn: '3K FC 2026/27 Official Third Replica Jersey (Blue)',
      nameSw: 'Jezi Rasmi ya Tatu ya 3K FC 2026/27 (Samawati)',
      descriptionEn:
        'Official 3K FC 2026/27 Royal Blue Third replica shirt with brush-textured royal blue body, yellow V-neck collar, circular crest, and Mozzart Bet sponsorship.',
      descriptionSw:
        'Jezi rasmi ya tatu ya 3K FC msimu wa 2026/27 (Samawati / Bluu yenye kola ya njano na mdhamini Mozzart).',
      category: 'JERSEYS',
      priceKesCents: 250000,
      isAuthenticClubGear: true,
      isFeatured: true,
      isAvailable: true,
    },
  });

  await prisma.productImage.deleteMany({ where: { productId: thirdJersey.id } });
  await prisma.productImage.create({
    data: {
      productId: thirdJersey.id,
      url: '/images/3k-fc-jersey-third-blue.png',
      altTextEn: 'Official 3K FC 2026/27 Royal Blue Third Replica Jersey',
      isPrimary: true,
      sortOrder: 1,
    },
  });

  // Ensure Third Jersey has size variants
  const sizes = ['S', 'M', 'L', 'XL', 'XXL'];
  for (const size of sizes) {
    const sku = `3K-JSY-THIRD-2627-${size}`;
    await prisma.productVariant.upsert({
      where: { sku },
      update: {},
      create: {
        productId: thirdJersey.id,
        sku,
        size,
        color: 'Third Royal Blue & Gold',
        stockQuantity: 30,
        reservedQuantity: 0,
      },
    });
  }

  // Update Donation Campaigns
  await prisma.donationCampaign.updateMany({
    data: {
      titleEn: '3K FC Top-Flight Readiness & Embu Youth Grassroots Fund',
      titleSw: 'Mfuko wa Maandalizi ya Ligi Kuu na Vijana wa Embu',
    },
  });

  console.log('Successfully completed: Nginda lines removed & Red Home, Black Away, Blue Third jerseys configured!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
