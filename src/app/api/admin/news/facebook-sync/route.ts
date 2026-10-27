import { NextRequest, NextResponse } from 'next/server';
import { requireAdminPermission } from '@/lib/auth';
import { syncFacebookTeamNews, FACEBOOK_PAGE_URL } from '@/lib/facebook';
import { recordAuditLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdminPermission('articles', 'create');

    const result = await syncFacebookTeamNews();

    await recordAuditLog({
      actorId: admin.id,
      actorEmail: admin.email,
      actorRole: admin.roles[0],
      action: 'FACEBOOK_NEWS_SYNCED',
      targetType: 'Article',
      targetId: 'batch-facebook-sync',
      after: {
        syncedCount: result.syncedCount,
        source: result.source,
        facebookUrl: FACEBOOK_PAGE_URL,
      },
      reason: 'Manual or automated Facebook team news synchronization triggered from admin dashboard',
    });

    return NextResponse.json({
      message: `Successfully synchronized ${result.syncedCount} team news stories from official Facebook page (${FACEBOOK_PAGE_URL}).`,
      ...result,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Facebook sync failed' },
      { status: 400 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const result = await syncFacebookTeamNews();
    return NextResponse.json({
      message: `Facebook news feed synced (${result.syncedCount} stories).`,
      ...result,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Facebook sync failed' },
      { status: 400 }
    );
  }
}
