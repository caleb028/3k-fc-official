import { describe, it, expect } from 'vitest';
import { prisma } from '@/lib/prisma';
import { syncFacebookTeamNews, OFFICIAL_FACEBOOK_POSTS } from '@/lib/facebook';

describe('Admin Live Photo and Dashboard Accuracy Engine', () => {
  it('preserves admin-uploaded photos during Facebook news sync and never overwrites them', async () => {
    // 1. Run sync to ensure official posts exist
    await syncFacebookTeamNews();

    const targetPost = OFFICIAL_FACEBOOK_POSTS[0];
    expect(targetPost).toBeDefined();

    // 2. Fetch the article in DB
    const existing = await prisma.article.findUnique({
      where: { slug: targetPost.slug },
    });
    expect(existing).toBeDefined();

    // 3. Admin changes the photo from the dashboard to a custom photo
    const customPhotoUrl = '/images/facebook/custom-admin-uploaded-photo-12345.jpg';
    await prisma.article.update({
      where: { id: existing!.id },
      data: {
        featuredImageUrl: customPhotoUrl,
        isPlaceholderImage: false,
      },
    });

    // Verify it updated in DB
    const updatedBeforeSync = await prisma.article.findUnique({
      where: { id: existing!.id },
    });
    expect(updatedBeforeSync?.featuredImageUrl).toBe(customPhotoUrl);
    expect(updatedBeforeSync?.isPlaceholderImage).toBe(false);

    // 4. Run syncFacebookTeamNews again (simulating background sync or page visit)
    await syncFacebookTeamNews();

    // 5. Ensure the custom photo was NOT overwritten!
    const afterSync = await prisma.article.findUnique({
      where: { id: existing!.id },
    });
    expect(afterSync?.featuredImageUrl).toBe(customPhotoUrl);
  });

  it('updates and persists club crest asset URL with verification flag in settings', async () => {
    const testCrestUrl = '/images/facebook/3kfc-facebook-profile-square-1000.jpg';

    const settings = await prisma.clubSettings.upsert({
      where: { id: 'default' },
      update: {
        crestAssetUrl: testCrestUrl,
        crestConfirmed: true,
      },
      create: {
        id: 'default',
        paletteStatus: 'CONFIRMED',
        primaryColor: '#B91C1C',
        secondaryColor: '#0F766E',
        accentColor: '#F59E0B',
        homeStadiumName: 'Moi Stadium, Embu',
        homeStadiumConfirmed: true,
        homeStadiumVerificationNote: 'Ratified home fortress',
        mainSponsorName: 'Mozzart Bet Kenya',
        mainSponsorConfirmed: true,
        mainSponsorVerificationNote: 'Official sponsor',
        crestAssetUrl: testCrestUrl,
        crestConfirmed: true,
      },
    });

    expect(settings.crestAssetUrl).toBe(testCrestUrl);
    expect(settings.crestConfirmed).toBe(true);

    const retrieved = await prisma.clubSettings.findUnique({ where: { id: 'default' } });
    expect(retrieved?.crestAssetUrl).toBe(testCrestUrl);
    expect(retrieved?.crestConfirmed).toBe(true);
  });

  it('allows registering a squad player with verified photo and removing them cleanly', async () => {
    const testSlug = `test-player-${Date.now()}`;
    const testPhoto = '/images/facebook/3kfc-facebook-coach-nicodemus-omasete.jpg';

    const created = await prisma.player.create({
      data: {
        slug: testSlug,
        firstName: 'Test',
        lastName: 'Striker',
        fullName: 'Test Striker',
        shirtNumber: 99,
        position: 'FORWARD',
        specificRole: 'Centre Forward',
        nationality: 'Kenyan',
        biographyEn: 'Prolific young forward.',
        isCaptain: false,
        isSpotlight: true,
        isActive: true,
        photoUrl: testPhoto,
        photoVerified: true,
      },
    });

    expect(created.id).toBeDefined();
    expect(created.photoUrl).toBe(testPhoto);
    expect(created.photoVerified).toBe(true);

    // Clean up
    await prisma.player.delete({ where: { id: created.id } });
    const afterDelete = await prisma.player.findUnique({ where: { id: created.id } });
    expect(afterDelete).toBeNull();
  });
});
