import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { initiateDarajaStkPush } from '@/lib/payments/daraja';
import { getAuthenticatedUser, hashPassword, checkRateLimit } from '@/lib/auth';

const subscribeSchema = z.object({
  planId: z.string().min(1),
  firstName: z.string().min(2).max(80),
  lastName: z.string().min(2).max(80),
  email: z.string().email(),
  phone: z.string().min(9).max(16),
});

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    if (!checkRateLimit(`membership-sub:${ip}`, 8, 60_000)) {
      return NextResponse.json(
        { error: 'Too many membership requests. Please try again shortly.' },
        { status: 429 }
      );
    }

    const raw = await req.json();
    const parsed = subscribeSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid membership application details.' }, { status: 400 });
    }

    const plan = await prisma.membershipPlan.findUnique({
      where: { id: parsed.data.planId },
    });

    if (!plan || !plan.isActive) {
      return NextResponse.json({ error: 'Selected membership plan is unavailable.' }, { status: 404 });
    }

    let user = await getAuthenticatedUser('PUBLIC');
    if (!user) {
      const emailNorm = parsed.data.email.toLowerCase().trim();
      let dbUser = await prisma.user.findUnique({
        where: { email: emailNorm },
        include: { profile: true },
      });

      if (!dbUser) {
        const tempPass = crypto.randomBytes(12).toString('hex');
        dbUser = await prisma.user.create({
          data: {
            email: emailNorm,
            passwordHash: hashPassword(tempPass),
            isStaff: false,
            status: 'ACTIVE',
            profile: {
              create: {
                firstName: parsed.data.firstName.trim(),
                lastName: parsed.data.lastName.trim(),
                displayName: `${parsed.data.firstName.trim()} ${parsed.data.lastName.trim()}`,
                supporterNumber: `3K-SUP-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
              },
            },
          },
          include: { profile: true },
        });
      }
      user = {
        id: dbUser.id,
        email: dbUser.email,
        phone: dbUser.phone,
        isStaff: dbUser.isStaff,
        profile: dbUser.profile,
        roles: ['SUPPORTER'],
      };
    }

    const membershipNumber = `3K-MEM-${new Date().getFullYear()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    const membership = await prisma.membership.create({
      data: {
        userId: user.id,
        planId: plan.id,
        membershipNumber,
        status: 'PENDING_PAYMENT',
      },
    });

    const stk = await initiateDarajaStkPush({
      purpose: 'MEMBERSHIP',
      purposeTargetId: membership.id,
      phone: parsed.data.phone,
      amountKesCents: plan.priceKesCents,
      accountReference: membershipNumber,
      transactionDesc: `3K FC Membership ${plan.nameEn}`,
    });

    return NextResponse.json({
      membership: {
        id: membership.id,
        membershipNumber,
        status: membership.status,
        planName: plan.nameEn,
      },
      payment: {
        id: stk.transaction.id,
        reference: stk.transaction.reference,
        checkoutRequestId: stk.transaction.checkoutRequestId,
        environment: stk.transaction.environment,
        status: stk.transaction.status,
        amountKesCents: stk.transaction.amountKesCents,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Could not initiate membership.' },
      { status: 400 }
    );
  }
}
