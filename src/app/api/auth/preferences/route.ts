import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser('PUBLIC');
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await req.json()) as {
      channel: string;
      category: string;
      enabled: boolean;
    };

    const updated = await prisma.notificationPreference.upsert({
      where: {
        userId_channel_category: {
          userId: user.id,
          channel: body.channel,
          category: body.category,
        },
      },
      update: { enabled: body.enabled },
      create: {
        userId: user.id,
        channel: body.channel,
        category: body.category,
        enabled: body.enabled,
      },
    });

    return NextResponse.json({ success: true, preference: updated });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Could not update preferences' },
      { status: 400 }
    );
  }
}
