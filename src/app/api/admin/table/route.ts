import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdminPermission } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';

const updateStandingSchema = z.object({
  id: z.string().min(1),
  position: z.number().int().min(1),
  played: z.number().int().min(0),
  won: z.number().int().min(0),
  drawn: z.number().int().min(0),
  lost: z.number().int().min(0),
  goalsFor: z.number().int().min(0),
  goalsAgainst: z.number().int().min(0),
  goalDifference: z.number().int(),
  points: z.number().int().min(0),
  form: z.string().optional().nullable(),
  qualificationNote: z.string().optional().nullable(),
  isAvailable: z.boolean().default(true),
  dataSource: z.enum(['MANUAL_VERIFIED', 'FKF_OFFICIAL']).default('MANUAL_VERIFIED'),
});

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdminPermission('table', 'update');
    const raw = await req.json();
    const parsed = updateStandingSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid standings parameters.', issues: parsed.error.flatten() }, { status: 400 });
    }

    const before = await prisma.leagueStanding.findUnique({
      where: { id: parsed.data.id },
      include: { club: true, competition: true },
    });
    if (!before) {
      return NextResponse.json({ error: 'Standing record not found' }, { status: 404 });
    }

    const updated = await prisma.leagueStanding.update({
      where: { id: parsed.data.id },
      data: {
        position: parsed.data.position,
        played: parsed.data.played,
        won: parsed.data.won,
        drawn: parsed.data.drawn,
        lost: parsed.data.lost,
        goalsFor: parsed.data.goalsFor,
        goalsAgainst: parsed.data.goalsAgainst,
        goalDifference: parsed.data.goalDifference,
        points: parsed.data.points,
        form: parsed.data.form,
        qualificationNote: parsed.data.qualificationNote,
        isAvailable: parsed.data.isAvailable,
        dataSource: parsed.data.dataSource,
        lastUpdatedAt: new Date(),
      },
    });

    await recordAuditLog({
      actorId: admin.id,
      actorEmail: admin.email,
      actorRole: admin.roles[0],
      action: 'LEAGUE_STANDING_UPDATED',
      targetType: 'LeagueStanding',
      targetId: updated.id,
      before,
      after: updated,
      reason: `Standing updated for ${before.club.name} in ${before.competition.name} by ${admin.email}`,
    });

    return NextResponse.json({ success: true, standing: updated });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to update league standing' },
      { status: 403 }
    );
  }
}
