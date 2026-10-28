import { describe, it, expect } from 'vitest';
import { parseFlashscoreFeedText } from '@/lib/flashscore';
import { retireFixturePreMatchNews, processFinishedFixture } from '@/lib/match-completion';
import { syncFacebookMediaAssets } from '@/lib/facebook-media';
import { prisma } from '@/lib/prisma';

describe('Match Completion & Media Pulling Engine', () => {
  it('correctly parses Flashscore feed with AG/AH scores and status 3 (finished)', () => {
    const mockFeed = `cjs.initialFeeds["results"] = { data: \`SA÷1¬~ZA÷KENYA: Premier League¬~AA÷testMatch123¬AD÷1793188800¬AB÷3¬AE÷APS Bomet¬AF÷3K FC¬AG÷3¬AH÷0¬BC÷1¬BD÷0¬\``;
    const fixtures = parseFlashscoreFeedText(mockFeed);

    expect(fixtures).toHaveLength(1);
    const f = fixtures[0];
    expect(f.matchId).toBe('testMatch123');
    expect(f.isFinished).toBe(true);
    expect(f.statusCode).toBe('3');
    expect(f.homeTeam).toBe('APS Bomet');
    expect(f.awayTeam).toBe('3K FC');
    expect(f.homeScore).toBe(3);
    expect(f.awayScore).toBe(0);
    expect(f.halfTimeHomeScore).toBe(1);
    expect(f.halfTimeAwayScore).toBe(0);
  });

  it('retires pre-match preview and squad build-up articles when fixture completes', async () => {
    // 1. Create a dummy preview article
    const category = await prisma.category.findFirst();
    expect(category).toBeDefined();

    const testSlug = `test-fixture-preview-${Date.now()}`;
    const testArticle = await prisma.article.create({
      data: {
        slug: testSlug,
        categoryId: category!.id,
        authorName: '3K FC Media',
        status: 'PUBLISHED',
        isFeatured: true,
        heroOrder: 1,
        translations: {
          create: [
            {
              locale: 'en',
              headline: 'Match Preview: 3K FC Depart for Test Opponent Showdown',
              summary: 'Tactical preview ahead of the match.',
              body: 'Preview body text.',
              isComplete: true,
            },
          ],
        },
      },
    });

    // 2. Run retireFixturePreMatchNews
    const result = await retireFixturePreMatchNews(testSlug, 'Test Opponent', 'test-opponent');
    expect(result.retiredCount).toBeGreaterThanOrEqual(1);

    // 3. Verify article is now ARCHIVED and not featured
    const archived = await prisma.article.findUnique({
      where: { id: testArticle.id },
    });
    expect(archived?.status).toBe('ARCHIVED');
    expect(archived?.isFeatured).toBe(false);

    // Clean up
    await prisma.articleTranslation.deleteMany({ where: { articleId: testArticle.id } });
    await prisma.article.delete({ where: { id: testArticle.id } });
  });

  it('syncFacebookMediaAssets pulls and registers media into prisma.mediaAsset', async () => {
    const result = await syncFacebookMediaAssets();
    expect(result.success).toBe(true);
    expect(result.pulledCount).toBeGreaterThan(0);

    const count = await prisma.mediaAsset.count();
    expect(count).toBeGreaterThan(0);

    const asset = await prisma.mediaAsset.findFirst({
      where: { isAuthenticVerified: true },
    });
    expect(asset).toBeDefined();
    expect(asset?.url).toMatch(/^\/images\/facebook\//);
  });
});
