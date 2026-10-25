import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdminPermission } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';

const confirmDonationSchema = z.object({
  donationId: z.string().min(1),
  status: z.enum(['CONFIRMED', 'FAILED', 'REFUNDED']),
});

const updateCampaignSchema = z.object({
  campaignId: z.string().min(1),
  targetKesCents: z.number().int().min(0).optional().nullable(),
  isActive: z.boolean(),
});

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdminPermission('donations', 'update');
    const body = await req.json();
    const action = body.action;

    if (action === 'CONFIRM_DONATION') {
      const parsed = confirmDonationSchema.safeParse(body.payload);
      if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid parameters', issues: parsed.error.flatten() }, { status: 400 });
      }

      const donation = await prisma.donation.findUnique({
        where: { id: parsed.data.donationId },
        include: { campaign: true },
      });
      if (!donation) {
        return NextResponse.json({ error: 'Donation not found' }, { status: 404 });
      }

      const updated = await prisma.donation.update({
        where: { id: donation.id },
        data: {
          status: parsed.data.status,
          confirmedAt: parsed.data.status === 'CONFIRMED' ? new Date() : donation.confirmedAt,
        },
      });

      // Update campaign totals if moving into CONFIRMED
      if (parsed.data.status === 'CONFIRMED' && donation.status !== 'CONFIRMED') {
        await prisma.donationCampaign.update({
          where: { id: donation.campaignId },
          data: {
            confirmedTotalKesCents: { increment: donation.amountKesCents },
            confirmedDonorCount: { increment: 1 },
          },
        });
      }

      await recordAuditLog({
        actorId: admin.id,
        actorEmail: admin.email,
        actorRole: admin.roles[0],
        action: 'DONATION_STATUS_UPDATED',
        targetType: 'Donation',
        targetId: donation.id,
        before: donation,
        after: updated,
        reason: `Donation status updated to ${parsed.data.status} by ${admin.email}`,
      });

      return NextResponse.json({ success: true, donation: updated });
    }

    if (action === 'UPDATE_CAMPAIGN') {
      const parsed = updateCampaignSchema.safeParse(body.payload);
      if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid parameters', issues: parsed.error.flatten() }, { status: 400 });
      }

      const updated = await prisma.donationCampaign.update({
        where: { id: parsed.data.campaignId },
        data: {
          targetKesCents: parsed.data.targetKesCents,
          isActive: parsed.data.isActive,
        },
      });

      return NextResponse.json({ success: true, campaign: updated });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to update donation records' },
      { status: 403 }
    );
  }
}
