import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser, checkRateLimit } from '@/lib/auth';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const user = await getAuthenticatedUser('PUBLIC');

    if (!user) {
      return NextResponse.json(
        { error: 'Please sign in to your 3K FC supporter account to vote (1 vote per authenticated account).' },
        { status: 401 }
      );
    }

    if (!checkRateLimit(`poll-vote:${user.id}`, 5, 60_000)) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment and try again.' },
        { status: 429 }
      );
    }

    const body = (await req.json()) as { optionId?: string };
    if (!body.optionId) {
      return NextResponse.json({ error: 'Please select a player option to vote.' }, { status: 400 });
    }

    const fixture = await prisma.fixture.findUnique({
      where: { slug },
      include: { poll: { include: { options: true } } },
    });

    if (!fixture || !fixture.poll) {
      return NextResponse.json({ error: 'Poll not found for this fixture.' }, { status: 404 });
    }

    const poll = fixture.poll;
    if (poll.status !== 'OPEN') {
      return NextResponse.json({ error: 'Voting is currently closed for this match poll.' }, { status: 400 });
    }

    const now = new Date();
    if (poll.opensAt > now || (poll.closesAt && poll.closesAt < now)) {
      return NextResponse.json({ error: 'This poll is outside its active voting window.' }, { status: 400 });
    }

    const validOption = poll.options.find((o) => o.id === body.optionId);
    if (!validOption) {
      return NextResponse.json({ error: 'Selected poll option is invalid.' }, { status: 400 });
    }

    const existingVote = await prisma.matchPollVote.findUnique({
      where: {
        pollId_userId: {
          pollId: poll.id,
          userId: user.id,
        },
      },
    });

    if (existingVote) {
      return NextResponse.json(
        { error: 'You have already cast your vote for this match (1 vote per supporter account).' },
        { status: 409 }
      );
    }

    const ipRaw = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const ipHash = crypto.createHash('sha256').update(ipRaw).digest('hex').slice(0, 16);

    await prisma.$transaction([
      prisma.matchPollVote.create({
        data: {
          pollId: poll.id,
          optionId: validOption.id,
          userId: user.id,
          ipHash,
        },
      }),
      prisma.matchPollOption.update({
        where: { id: validOption.id },
        data: { voteCount: { increment: 1 } },
      }),
    ]);

    const updatedPoll = await prisma.matchPoll.findUnique({
      where: { id: poll.id },
      include: { options: { orderBy: { voteCount: 'desc' } } },
    });

    return NextResponse.json({
      success: true,
      message: 'Your Man of the Match vote has been recorded!',
      poll: updatedPoll,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unable to record vote.' },
      { status: 500 }
    );
  }
}
