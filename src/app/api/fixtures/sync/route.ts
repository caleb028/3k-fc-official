import { NextRequest, NextResponse } from 'next/server';
import { syncFlashscoreMatchweekFixture, syncFlashscoreStandings } from '@/lib/flashscore';
import { syncFacebookTeamNews } from '@/lib/facebook';
import { syncFacebookMediaAssets } from '@/lib/facebook-media';
import { checkAndCompletePastFixtures } from '@/lib/match-completion';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [fixtureResult, standingsResult, fbNewsResult, fbMediaResult, completionResult] =
      await Promise.all([
        syncFlashscoreMatchweekFixture(true),
        syncFlashscoreStandings(true),
        syncFacebookTeamNews().catch(() => null),
        syncFacebookMediaAssets().catch(() => null),
        checkAndCompletePastFixtures().catch(() => null),
      ]);

    return NextResponse.json({
      success: true,
      sources: {
        fixtures: 'https://www.flashscore.com/team/3k-fc/8reiOTYF/fixtures/',
        results: 'https://www.flashscore.com/team/3k-fc/8reiOTYF/results/',
        standings: 'https://www.flashscore.co.ke/football/kenya/kpl/standings/jN7arfI0/standings/overall/',
        facebook: 'https://www.facebook.com/3kfootballclub',
      },
      fixture: fixtureResult,
      standings: standingsResult,
      facebookNews: fbNewsResult,
      facebookMedia: fbMediaResult,
      matchCompletion: completionResult,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to sync matchday and media data' },
      { status: 500 }
    );
  }
}

export async function POST() {
  return GET();
}
