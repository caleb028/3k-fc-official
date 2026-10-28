import { NextRequest, NextResponse } from 'next/server';
import { syncFacebookTeamNews } from '@/lib/facebook';
import { syncFacebookMediaAssets } from '@/lib/facebook-media';
import { checkAndCompletePastFixtures } from '@/lib/match-completion';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const [mediaResult, newsResult, fixtureResult] = await Promise.all([
      syncFacebookMediaAssets(),
      syncFacebookTeamNews(),
      checkAndCompletePastFixtures(),
    ]);

    return NextResponse.json({
      success: true,
      media: mediaResult,
      news: newsResult,
      fixtureCompletion: fixtureResult,
      source: 'https://www.facebook.com/3kfootballclub',
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Facebook media & news synchronization failed' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
