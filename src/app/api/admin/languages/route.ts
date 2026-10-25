import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdminPermission } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';

const phraseSchema = z.object({
  id: z.string().optional(),
  namespace: z.string().default('common'),
  key: z.string().min(2),
  valueEn: z.string().min(1),
  valueSw: z.string().min(1),
  isVerifiedSw: z.boolean().default(true),
});

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdminPermission('languages', 'update');
    const raw = await req.json();
    const parsed = phraseSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid parameters', issues: parsed.error.flatten() }, { status: 400 });
    }

    const updated = await prisma.translationKey.upsert({
      where: { key: parsed.data.key },
      update: {
        valueEn: parsed.data.valueEn,
        valueSw: parsed.data.valueSw,
        isVerifiedSw: parsed.data.isVerifiedSw,
      },
      create: {
        namespace: parsed.data.namespace,
        key: parsed.data.key,
        valueEn: parsed.data.valueEn,
        valueSw: parsed.data.valueSw,
        isVerifiedSw: parsed.data.isVerifiedSw,
      },
    });

    await recordAuditLog({
      actorId: admin.id,
      actorEmail: admin.email,
      actorRole: admin.roles[0],
      action: 'TRANSLATION_KEY_UPDATED',
      targetType: 'TranslationKey',
      targetId: updated.id,
      after: updated,
      reason: `Translation phrase [${updated.key}] updated by ${admin.email}`,
    });

    return NextResponse.json({ success: true, translation: updated });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to save translation' },
      { status: 403 }
    );
  }
}
