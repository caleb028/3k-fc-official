import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { hashPassword, createSession, FAN_SESSION_COOKIE, checkRateLimit } from '@/lib/auth';

const registerSchema = z.object({
  firstName: z.string().min(2).max(60),
  lastName: z.string().min(2).max(60),
  email: z.string().email(),
  phone: z.string().min(9).max(16),
  password: z.string().min(8),
  county: z.string().default('Embu'),
});

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    if (!checkRateLimit(`register:${ip}`, 5, 60_000)) {
      return NextResponse.json(
        { error: 'Too many registration requests. Please wait a minute.' },
        { status: 429 }
      );
    }

    const raw = await req.json();
    const parsed = registerSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Please provide valid registration details (minimum 8 characters password).' },
        { status: 400 }
      );
    }

    const emailNorm = parsed.data.email.toLowerCase().trim();
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email: emailNorm }, { phone: parsed.data.phone.trim() }],
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email or phone number already exists.' },
        { status: 409 }
      );
    }

    const supporterRole = await prisma.role.findUnique({ where: { slug: 'SUPPORTER' } });

    const supporterNumber = `3K-SUP-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const passwordHash = hashPassword(parsed.data.password);

    const user = await prisma.user.create({
      data: {
        email: emailNorm,
        phone: parsed.data.phone.trim(),
        passwordHash,
        status: 'ACTIVE',
        isStaff: false,
        profile: {
          create: {
            firstName: parsed.data.firstName.trim(),
            lastName: parsed.data.lastName.trim(),
            displayName: `${parsed.data.firstName.trim()} ${parsed.data.lastName.trim()}`,
            county: parsed.data.county,
            supporterNumber,
          },
        },
        ...(supporterRole
          ? {
              userRoles: {
                create: { roleId: supporterRole.id },
              },
            }
          : {}),
      },
      include: { profile: true },
    });

    const userAgent = req.headers.get('user-agent') || undefined;
    const rawToken = await createSession(user.id, 'PUBLIC', ip, userAgent);

    const response = NextResponse.json({
      success: true,
      message: 'Supporter account created successfully!',
      user: {
        id: user.id,
        email: user.email,
        supporterNumber,
      },
    });

    response.cookies.set(FAN_SESSION_COOKIE, rawToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 14 * 24 * 3600,
    });

    return response;
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unable to create account.' },
      { status: 500 }
    );
  }
}
