import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdminPermission } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';

const sponsorSchema = z.object({
  id: z.string().optional(),
  slug: z.string().min(2),
  businessName: z.string().min(2),
  category: z.enum(['MAIN_PARTNER', 'KIT_PARTNER', 'OFFICIAL_SUPPLIER', 'DIGITAL_PARTNER', 'COMMUNITY_PARTNER']),
  descriptionEn: z.string().min(5),
  descriptionSw: z.string().optional().nullable(),
  websiteUrl: z.string().url(),
  contractStatus: z.enum(['ACTIVE_VERIFIED', 'SUBJECT_TO_CONFIRMATION', 'EXPIRED']),
  verificationNote: z.string().optional().nullable(),
  displayPriority: z.number().int().default(1),
  isPublished: z.boolean().default(true),
});

const updateEnquirySchema = z.object({
  enquiryId: z.string().min(1),
  status: z.enum(['NEW', 'IN_REVIEW', 'CONTACTED', 'ARCHIVED']),
});

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdminPermission('sponsors', 'update');
    const body = await req.json();
    const action = body.action;

    if (action === 'SAVE_SPONSOR') {
      const parsed = sponsorSchema.safeParse(body.payload);
      if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid parameters', issues: parsed.error.flatten() }, { status: 400 });
      }

      const sData = parsed.data;
      if (sData.id) {
        const before = await prisma.sponsor.findUnique({ where: { id: sData.id } });
        const updated = await prisma.sponsor.update({
          where: { id: sData.id },
          data: {
            slug: sData.slug,
            businessName: sData.businessName,
            category: sData.category,
            descriptionEn: sData.descriptionEn,
            descriptionSw: sData.descriptionSw,
            websiteUrl: sData.websiteUrl,
            contractStatus: sData.contractStatus,
            verificationNote: sData.verificationNote,
            displayPriority: sData.displayPriority,
            isPublished: sData.isPublished,
          },
        });

        await recordAuditLog({
          actorId: admin.id,
          actorEmail: admin.email,
          actorRole: admin.roles[0],
          action: 'SPONSOR_UPDATED',
          targetType: 'Sponsor',
          targetId: updated.id,
          before,
          after: updated,
          reason: `Sponsor ${updated.businessName} updated by ${admin.email}`,
        });

        revalidatePath('/', 'layout');
        revalidatePath('/');
        revalidatePath('/partners');
        revalidatePath('/admin/sponsors');

        return NextResponse.json({ success: true, sponsor: updated });
      } else {
        const created = await prisma.sponsor.create({
          data: {
            slug: sData.slug,
            businessName: sData.businessName,
            category: sData.category,
            descriptionEn: sData.descriptionEn,
            descriptionSw: sData.descriptionSw,
            websiteUrl: sData.websiteUrl,
            contractStatus: sData.contractStatus,
            verificationNote: sData.verificationNote,
            displayPriority: sData.displayPriority,
            isPublished: sData.isPublished,
          },
        });

        await recordAuditLog({
          actorId: admin.id,
          actorEmail: admin.email,
          actorRole: admin.roles[0],
          action: 'SPONSOR_CREATED',
          targetType: 'Sponsor',
          targetId: created.id,
          after: created,
          reason: `New sponsor registered: ${created.businessName} (${created.category})`,
        });

        revalidatePath('/', 'layout');
        revalidatePath('/');
        revalidatePath('/partners');
        revalidatePath('/admin/sponsors');

        return NextResponse.json({ success: true, sponsor: created });
      }
    }

    if (action === 'UPDATE_ENQUIRY') {
      const parsed = updateEnquirySchema.safeParse(body.payload);
      if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid parameters', issues: parsed.error.flatten() }, { status: 400 });
      }

      const updated = await prisma.sponsorEnquiry.update({
        where: { id: parsed.data.enquiryId },
        data: { status: parsed.data.status },
      });

      return NextResponse.json({ success: true, enquiry: updated });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to update sponsor' },
      { status: 403 }
    );
  }
}
