import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { verifyPassword, createSession, FAN_SESSION_COOKIE, checkRateLimit } from '@/lib/auth';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    if (!checkRateLimit(`login:${ip}`, 10, 60_000)) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please wait a moment.' },
        { status: 429 }
      );
    }

    const raw = await req.json();
    const parsed = loginSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Please enter a valid email and password.' }, { status: 400 });
    }

    const emailNorm = parsed.data.email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email: emailNorm },
      include: { profile: true },
    });

    if (!user || !verifyPassword(parsed.data.password, user.passwordHash)) {
      return NextResponse.json({ error: 'Invalid email address or password.' }, { status: 401 });
    }

    if (user.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Your account is suspended or pending verification.' }, { status: 403 });
    }

    const userAgent = req.headers.get('user-agent') || undefined;
    const rawToken = await createSession(user.id, 'PUBLIC', ip, userAgent);

    const response = NextResponse.json({
      success: true,
      message: `Welcome back, ${user.profile?.firstName || 'Supporter'}!`,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.profile?.displayName,
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
      { error: err instanceof Error ? err.message : 'Login failed.' },
      { status: 500 }
    );
  }
}
