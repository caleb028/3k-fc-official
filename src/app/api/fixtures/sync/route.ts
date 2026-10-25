import { NextRequest, NextResponse } from 'next/server';
import { syncFlashscoreMatchweekFixture, syncFlashscoreStandings } from '@/lib/flashscore';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [fixtureResult, standingsResult] = await Promise.all([
      syncFlashscoreMatchweekFixture(true),
      syncFlashscoreStandings(true),
    ]);
    return NextResponse.json({
      success: true,
      sources: {
        fixtures: 'https://www.flashscore.com/team/3k-fc/8reiOTYF/fixtures/',
        standings: 'https://www.flashscore.co.ke/football/kenya/kpl/standings/jN7arfI0/standings/overall/',
      },
      fixture: fixtureResult,
      standings: standingsResult,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to sync Flashscore data' },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const [fixtureResult, standingsResult] = await Promise.all([
      syncFlashscoreMatchweekFixture(true),
      syncFlashscoreStandings(true),
    ]);
    return NextResponse.json({
      success: true,
      sources: {
        fixtures: 'https://www.flashscore.com/team/3k-fc/8reiOTYF/fixtures/',
        standings: 'https://www.flashscore.co.ke/football/kenya/kpl/standings/jN7arfI0/standings/overall/',
      },
      fixture: fixtureResult,
      standings: standingsResult,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to sync Flashscore data' },
      { status: 500 }
    );
  }
}
