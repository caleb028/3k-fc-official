import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdminPermission } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';
import { processFinishedFixture } from '@/lib/match-completion';

const updateScoreStatusSchema = z.object({
  fixtureId: z.string().min(1),
  status: z.enum(['SCHEDULED', 'POSTPONED', 'DELAYED', 'LIVE', 'HALF_TIME', 'FULL_TIME', 'CANCELLED']),
  liveMinute: z.number().int().min(0).max(130).optional().nullable(),
  homeScore: z.number().int().min(0).optional().nullable(),
  awayScore: z.number().int().min(0).optional().nullable(),
  halfTimeHomeScore: z.number().int().min(0).optional().nullable(),
  halfTimeAwayScore: z.number().int().min(0).optional().nullable(),
});

const addBlogUpdateSchema = z.object({
  fixtureId: z.string().min(1),
  minute: z.number().int().min(0).max(130).optional().nullable(),
  eventType: z.string().default('COMMENTARY'),
  headlineEn: z.string().optional().nullable(),
  bodyEn: z.string().min(2),
  bodySw: z.string().optional().nullable(),
  isPinned: z.boolean().default(false),
  authorName: z.string().default('3K FC Matchday Media'),
});

const addEventSchema = z.object({
  fixtureId: z.string().min(1),
  minute: z.number().int().min(0).max(130),
  addedTime: z.number().int().min(0).optional().nullable(),
  type: z.enum(['KICK_OFF', 'GOAL', 'PENALTY_GOAL', 'OWN_GOAL', 'YELLOW_CARD', 'RED_CARD', 'SUBSTITUTION', 'HALF_TIME', 'FULL_TIME']),
  clubSide: z.enum(['HOME', 'AWAY']),
  playerId: z.string().optional().nullable(),
  playerName: z.string().optional().nullable(),
  secondaryPlayerName: z.string().optional().nullable(),
  descriptionEn: z.string().min(2),
  descriptionSw: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdminPermission('match_centre', 'update');
    const body = await req.json();
    const action = body.action;

    if (action === 'UPDATE_SCORE_STATUS') {
      const parsed = updateScoreStatusSchema.safeParse(body.payload);
      if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid score/status payload', issues: parsed.error.flatten() }, { status: 400 });
      }

      const before = await prisma.fixture.findUnique({ where: { id: parsed.data.fixtureId } });
      if (!before) {
        return NextResponse.json({ error: 'Fixture not found' }, { status: 404 });
      }

      const updated = await prisma.fixture.update({
        where: { id: parsed.data.fixtureId },
        data: {
          status: parsed.data.status,
          liveMinute: parsed.data.liveMinute,
          homeScore: parsed.data.homeScore,
          awayScore: parsed.data.awayScore,
          halfTimeHomeScore: parsed.data.halfTimeHomeScore,
          halfTimeAwayScore: parsed.data.halfTimeAwayScore,
          resultUpdatedById: admin.id,
          resultUpdatedAt: new Date(),
        },
      });

      if (parsed.data.status === 'FULL_TIME') {
        await processFinishedFixture({
          fixtureId: updated.id,
          homeScore: parsed.data.homeScore ?? 0,
          awayScore: parsed.data.awayScore ?? 0,
          halfTimeHomeScore: parsed.data.halfTimeHomeScore,
          halfTimeAwayScore: parsed.data.halfTimeAwayScore,
          source: 'ADMIN_VERIFIED',
        }).catch((err) => console.error('Error auto-processing finished match:', err));
      }

      await recordAuditLog({
        actorId: admin.id,
        actorEmail: admin.email,
        actorRole: admin.roles[0],
        action: 'MATCH_SCORE_STATUS_UPDATED',
        targetType: 'Fixture',
        targetId: updated.id,
        before,
        after: updated,
        reason: `Live match update by ${admin.email}: status ${updated.status}, score ${updated.homeScore ?? 0}-${updated.awayScore ?? 0}`,
      });

      return NextResponse.json({ success: true, fixture: updated });
    }

    if (action === 'ADD_BLOG_UPDATE') {
      const parsed = addBlogUpdateSchema.safeParse(body.payload);
      if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid commentary payload', issues: parsed.error.flatten() }, { status: 400 });
      }

      const update = await prisma.liveBlogUpdate.create({
        data: {
          fixtureId: parsed.data.fixtureId,
          minute: parsed.data.minute,
          eventType: parsed.data.eventType,
          headlineEn: parsed.data.headlineEn,
          bodyEn: parsed.data.bodyEn,
          bodySw: parsed.data.bodySw,
          isPinned: parsed.data.isPinned,
          authorName: parsed.data.authorName || '3K FC Matchday Media',
          status: 'PUBLISHED',
        },
      });

      await recordAuditLog({
        actorId: admin.id,
        actorEmail: admin.email,
        actorRole: admin.roles[0],
        action: 'MATCH_BLOG_PUBLISHED',
        targetType: 'LiveBlogUpdate',
        targetId: update.id,
        after: update,
        reason: `Touchline commentary added at min ${update.minute ?? 0}`,
      });

      return NextResponse.json({ success: true, update });
    }

    if (action === 'ADD_MATCH_EVENT') {
      const parsed = addEventSchema.safeParse(body.payload);
      if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid event payload', issues: parsed.error.flatten() }, { status: 400 });
      }

      const event = await prisma.matchEvent.create({
        data: {
          fixtureId: parsed.data.fixtureId,
          minute: parsed.data.minute,
          addedTime: parsed.data.addedTime,
          type: parsed.data.type,
          clubSide: parsed.data.clubSide,
          playerId: parsed.data.playerId,
          playerName: parsed.data.playerName,
          secondaryPlayerName: parsed.data.secondaryPlayerName,
          descriptionEn: parsed.data.descriptionEn,
          descriptionSw: parsed.data.descriptionSw,
        },
      });

      await recordAuditLog({
        actorId: admin.id,
        actorEmail: admin.email,
        actorRole: admin.roles[0],
        action: 'MATCH_EVENT_LOGGED',
        targetType: 'MatchEvent',
        targetId: event.id,
        after: event,
        reason: `${event.type} recorded at min ${event.minute}`,
      });

      return NextResponse.json({ success: true, event });
    }

    return NextResponse.json({ error: 'Unknown action specified' }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 403 }
    );
  }
}
