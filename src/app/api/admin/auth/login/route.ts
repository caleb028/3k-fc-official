import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { verifyPassword, createSession, ADMIN_SESSION_COOKIE, checkRateLimit } from '@/lib/auth';

const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    if (!checkRateLimit(`admin-login:${ip}`, 5, 60_000)) {
      return NextResponse.json(
        { error: 'Too many administration sign-in attempts. Please wait a minute.' },
        { status: 429 }
      );
    }

    const raw = await req.json();
    const parsed = adminLoginSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Please enter valid staff credentials.' }, { status: 400 });
    }

    const emailNorm = parsed.data.email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email: emailNorm },
      include: {
        profile: true,
        userRoles: { include: { role: true } },
      },
    });

    if (!user || !user.isStaff || !verifyPassword(parsed.data.password, user.passwordHash)) {
      return NextResponse.json({ error: 'Invalid staff email or password.' }, { status: 401 });
    }

    if (user.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Your staff account is suspended.' }, { status: 403 });
    }

    const userAgent = req.headers.get('user-agent') || undefined;
    const rawToken = await createSession(user.id, 'ADMIN', ip, userAgent);

    const response = NextResponse.json({
      success: true,
      message: `Welcome, ${user.profile?.displayName || user.email}!`,
      roles: user.userRoles.map((ur) => ur.role.slug),
    });

    response.cookies.set(ADMIN_SESSION_COOKIE, rawToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 12 * 3600, // 12-hour session lifetime for back-office staff
    });

    return response;
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Staff login error.' },
      { status: 500 }
    );
  }
}
