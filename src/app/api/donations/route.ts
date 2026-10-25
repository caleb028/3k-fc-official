import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { kesToCents } from '@/lib/money';
import { initiateDarajaStkPush } from '@/lib/payments/daraja';
import { getAuthenticatedUser, checkRateLimit } from '@/lib/auth';

const donationSchema = z.object({
  campaignId: z.string().min(1),
  donorName: z.string().min(2).max(120),
  donorEmail: z.string().email().optional().or(z.literal('')),
  donorPhone: z.string().min(9).max(16),
  country: z.string().default('Kenya'),
  amountWholeKes: z.number().int().min(50).max(5_000_000),
  paymentMethod: z.enum(['MPESA_DARAJA', 'INTERNATIONAL_ADAPTER']).default('MPESA_DARAJA'),
  isAnonymous: z.boolean().default(false),
  publicRecognitionConsent: z.boolean().default(false),
  supporterMessage: z.string().max(400).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    if (!checkRateLimit(`donation:${ip}`, 8, 60_000)) {
      return NextResponse.json(
        { error: 'Too many donation attempts. Please try again in a minute.' },
        { status: 429 }
      );
    }

    const raw = await req.json();
    const parsed = donationSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid donation amount or details (minimum KES 50).' },
        { status: 400 }
      );
    }

    const campaign = await prisma.donationCampaign.findUnique({
      where: { id: parsed.data.campaignId },
    });
    if (!campaign || !campaign.isActive) {
      return NextResponse.json({ error: 'Selected fundraising campaign is not active.' }, { status: 404 });
    }

    const user = await getAuthenticatedUser('PUBLIC');
    const amountKesCents = kesToCents(parsed.data.amountWholeKes);

    const donation = await prisma.donation.create({
      data: {
        campaignId: campaign.id,
        userId: user?.id ?? null,
        donorName: parsed.data.isAnonymous ? 'Anonymous Supporter' : parsed.data.donorName.trim(),
        donorEmail: parsed.data.donorEmail ? parsed.data.donorEmail.toLowerCase().trim() : null,
        donorPhone: parsed.data.donorPhone.trim(),
        country: parsed.data.country,
        amountKesCents,
        paymentMethod: parsed.data.paymentMethod,
        status: 'PENDING',
        isAnonymous: parsed.data.isAnonymous,
        publicRecognitionConsent: parsed.data.isAnonymous
          ? false
          : parsed.data.publicRecognitionConsent,
        supporterMessage: parsed.data.supporterMessage?.trim() || null,
      },
    });

    const stk = await initiateDarajaStkPush({
      purpose: 'DONATION',
      purposeTargetId: donation.id,
      phone: parsed.data.donorPhone,
      amountKesCents,
      accountReference: `3K-DON-${donation.id.slice(-6).toUpperCase()}`,
      transactionDesc: `Support 3K FC Donation`,
    });

    return NextResponse.json({
      donation: {
        id: donation.id,
        status: donation.status,
        amountKesCents: donation.amountKesCents,
      },
      payment: {
        id: stk.transaction.id,
        reference: stk.transaction.reference,
        checkoutRequestId: stk.transaction.checkoutRequestId,
        environment: stk.transaction.environment,
        status: stk.transaction.status,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unable to initiate donation.' },
      { status: 400 }
    );
  }
}
