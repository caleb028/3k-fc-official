import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { bootstrapSuperAdmin } from '@/lib/auth';

const setupSchema = z.object({
  bootstrapToken: z.string().min(6),
  email: z.string().email(),
  password: z.string().min(10),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
});

export async function POST(req: NextRequest) {
  try {
    const raw = await req.json();
    const parsed = setupSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid bootstrap setup parameters.', issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const superAdmin = await bootstrapSuperAdmin(parsed.data);

    return NextResponse.json({
      success: true,
      message: 'Super Administrator provisioned successfully. You may now sign in at /admin/login.',
      user: {
        id: superAdmin.id,
        email: superAdmin.email,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Bootstrap failed.' },
      { status: 400 }
    );
  }
}
