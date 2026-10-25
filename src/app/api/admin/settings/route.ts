import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdminPermission } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';

const settingsSchema = z.object({
  paletteStatus: z.enum(['PROVISIONAL', 'CONFIRMED']),
  primaryColor: z.string().min(4),
  secondaryColor: z.string().min(4),
  accentColor: z.string().min(4),
  homeStadiumName: z.string().min(2),
  homeStadiumConfirmed: z.boolean(),
  homeStadiumVerificationNote: z.string(),
  mainSponsorName: z.string().min(2),
  mainSponsorConfirmed: z.boolean(),
  mainSponsorVerificationNote: z.string(),
  crestAssetUrl: z.string().nullable().optional(),
  crestConfirmed: z.boolean(),
});

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdminPermission('settings', 'update');

    const raw = await req.json();
    const parsed = settingsSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid settings format.', issues: parsed.error.flatten() }, { status: 400 });
    }

    const previous = await prisma.clubSettings.findUnique({ where: { id: 'default' } });

    const updated = await prisma.clubSettings.upsert({
      where: { id: 'default' },
      update: parsed.data,
      create: {
        id: 'default',
        ...parsed.data,
      },
    });

    await recordAuditLog({
      actorId: admin.id,
      actorEmail: admin.email,
      actorRole: admin.roles[0],
      action: parsed.data.paletteStatus === 'CONFIRMED' ? 'PALETTE_CONFIRMED' : 'SETTINGS_UPDATED',
      targetType: 'ClubSettings',
      targetId: 'default',
      before: previous,
      after: updated,
      reason: 'Administrator updated club identity & verification settings',
    });

    return NextResponse.json({
      success: true,
      message: 'Club settings and brand tokens successfully updated and recorded in audit log.',
      settings: updated,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Settings update failed.' },
      { status: 403 }
    );
  }
}
