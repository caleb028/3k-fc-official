import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Updating 3K FC official crest asset and brand color palette...');

  await prisma.clubSettings.upsert({
    where: { id: 'default' },
    update: {
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
      motto: "Home of Stars • God's Favourite Club (Est. 2013)",
    },
    create: {
      id: 'default',
      clubName: '3K FC',
      officialFullName: '3K Football Club — Embu',
      motto: "Home of Stars • God's Favourite Club (Est. 2013)",
      location: 'Embu County, Kenya',
      foundingWard: 'Embu County, Kenya',
      currentCompetition: 'FKF Premier League',
      currentSeason: '2026/27',
      homeStadiumName: 'Moi Stadium, Embu',
      homeStadiumConfirmed: false,
      homeStadiumVerificationNote: "Subject to confirmation of the club's official match venue for 2026/27 FKF Premier League fixtures.",
      mainSponsorName: 'Mozzart Bet Kenya',
      mainSponsorConfirmed: false,
      mainSponsorVerificationNote: 'Subject to confirmation of the current 2026/27 sponsorship agreement.',
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

  await prisma.club.updateMany({
    where: { isOurClub: true },
    data: {
      crestUrl: '/images/3k-fc-crest.png',
      primaryColor: '#E11D2A',
    },
  });

  console.log('✓ Successfully confirmed 3K FC official crest & colors in database!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
