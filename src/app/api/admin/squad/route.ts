import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdminPermission } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';

const playerSchema = z.object({
  id: z.string().optional(),
  slug: z.string().min(2),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  fullName: z.string().min(2),
  nickname: z.string().optional().nullable(),
  shirtNumber: z.number().int().min(1).max(99).optional().nullable(),
  position: z.enum(['GOALKEEPER', 'DEFENDER', 'MIDFIELDER', 'FORWARD']),
  specificRole: z.string().optional().nullable(),
  nationality: z.string().default('Kenyan'),
  biographyEn: z.string().min(5),
  biographySw: z.string().optional().nullable(),
  isCaptain: z.boolean().default(false),
  isSpotlight: z.boolean().default(false),
  isActive: z.boolean().default(true),
  photoUrl: z.string().optional().nullable(),
  photoVerified: z.boolean().default(false),
});

const staffSchema = z.object({
  id: z.string().optional(),
  slug: z.string().min(2),
  fullName: z.string().min(2),
  roleTitleEn: z.string().min(2),
  roleTitleSw: z.string().optional().nullable(),
  category: z.enum(['TECHNICAL_BENCH', 'LEADERSHIP', 'MEDICAL']).default('TECHNICAL_BENCH'),
  biographyEn: z.string().min(5),
  biographySw: z.string().optional().nullable(),
  sortOrder: z.number().int().default(10),
  isActive: z.boolean().default(true),
});

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdminPermission('squad', 'update');
    const body = await req.json();
    const entityType = body.entityType; // "PLAYER" | "STAFF"

    if (entityType === 'PLAYER') {
      const parsed = playerSchema.safeParse(body.payload);
      if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid player data', issues: parsed.error.flatten() }, { status: 400 });
      }

      const pData = parsed.data;
      if (pData.id) {
        const before = await prisma.player.findUnique({ where: { id: pData.id } });
        const updated = await prisma.player.update({
          where: { id: pData.id },
          data: {
            slug: pData.slug,
            firstName: pData.firstName,
            lastName: pData.lastName,
            fullName: pData.fullName,
            nickname: pData.nickname,
            shirtNumber: pData.shirtNumber,
            position: pData.position,
            specificRole: pData.specificRole,
            nationality: pData.nationality,
            biographyEn: pData.biographyEn,
            biographySw: pData.biographySw,
            isCaptain: pData.isCaptain,
            isSpotlight: pData.isSpotlight,
            isActive: pData.isActive,
            photoUrl: pData.photoUrl,
            photoVerified: pData.photoVerified,
          },
        });

        await recordAuditLog({
          actorId: admin.id,
          actorEmail: admin.email,
          actorRole: admin.roles[0],
          action: 'PLAYER_UPDATED',
          targetType: 'Player',
          targetId: updated.id,
          before,
          after: updated,
          reason: `Player profile updated for ${updated.fullName} by ${admin.email}`,
        });

        return NextResponse.json({ success: true, player: updated });
      } else {
        const created = await prisma.player.create({
          data: {
            slug: pData.slug,
            firstName: pData.firstName,
            lastName: pData.lastName,
            fullName: pData.fullName,
            nickname: pData.nickname,
            shirtNumber: pData.shirtNumber,
            position: pData.position,
            specificRole: pData.specificRole,
            nationality: pData.nationality,
            biographyEn: pData.biographyEn,
            biographySw: pData.biographySw,
            isCaptain: pData.isCaptain,
            isSpotlight: pData.isSpotlight,
            isActive: pData.isActive,
            photoUrl: pData.photoUrl,
            photoVerified: pData.photoVerified,
          },
        });

        await recordAuditLog({
          actorId: admin.id,
          actorEmail: admin.email,
          actorRole: admin.roles[0],
          action: 'PLAYER_CREATED',
          targetType: 'Player',
          targetId: created.id,
          after: created,
          reason: `New squad player registered: ${created.fullName} (#${created.shirtNumber ?? 'N/A'})`,
        });

        return NextResponse.json({ success: true, player: created });
      }
    }

    if (entityType === 'STAFF') {
      const parsed = staffSchema.safeParse(body.payload);
      if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid staff data', issues: parsed.error.flatten() }, { status: 400 });
      }

      const sData = parsed.data;
      if (sData.id) {
        const before = await prisma.staffMember.findUnique({ where: { id: sData.id } });
        const updated = await prisma.staffMember.update({
          where: { id: sData.id },
          data: {
            slug: sData.slug,
            fullName: sData.fullName,
            roleTitleEn: sData.roleTitleEn,
            roleTitleSw: sData.roleTitleSw,
            category: sData.category,
            biographyEn: sData.biographyEn,
            biographySw: sData.biographySw,
            sortOrder: sData.sortOrder,
            isActive: sData.isActive,
          },
        });

        await recordAuditLog({
          actorId: admin.id,
          actorEmail: admin.email,
          actorRole: admin.roles[0],
          action: 'STAFF_MEMBER_UPDATED',
          targetType: 'StaffMember',
          targetId: updated.id,
          before,
          after: updated,
          reason: `Technical staff member updated: ${updated.fullName} (${updated.roleTitleEn})`,
        });

        return NextResponse.json({ success: true, staff: updated });
      } else {
        const created = await prisma.staffMember.create({
          data: {
            slug: sData.slug,
            fullName: sData.fullName,
            roleTitleEn: sData.roleTitleEn,
            roleTitleSw: sData.roleTitleSw,
            category: sData.category,
            biographyEn: sData.biographyEn,
            biographySw: sData.biographySw,
            sortOrder: sData.sortOrder,
            isActive: sData.isActive,
          },
        });

        await recordAuditLog({
          actorId: admin.id,
          actorEmail: admin.email,
          actorRole: admin.roles[0],
          action: 'STAFF_MEMBER_CREATED',
          targetType: 'StaffMember',
          targetId: created.id,
          after: created,
          reason: `New staff member registered: ${created.fullName} (${created.roleTitleEn})`,
        });

        return NextResponse.json({ success: true, staff: created });
      }
    }

    return NextResponse.json({ error: 'Unknown entityType' }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to save squad entity' },
      { status: 403 }
    );
  }
}
