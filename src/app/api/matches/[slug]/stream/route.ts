import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

async function getMatchSnapshot(slug: string) {
  return prisma.fixture.findUnique({
    where: { slug },
    include: {
      competition: true,
      season: true,
      homeClub: true,
      awayClub: true,
      events: { orderBy: { minute: 'desc' } },
      liveBlogUpdates: {
        where: { status: 'PUBLISHED' },
        orderBy: [{ isPinned: 'desc' }, { publishedAt: 'desc' }],
      },
      lineups: {
        where: { isConfirmed: true },
        include: { players: { orderBy: { sortOrder: 'asc' } } },
      },
      statistics: true,
      poll: {
        include: {
          options: { orderBy: { voteCount: 'desc' } },
        },
      },
    },
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const mode = req.nextUrl.searchParams.get('mode');

  const initialData = await getMatchSnapshot(slug);
  if (!initialData) {
    return NextResponse.json({ error: 'Match not found' }, { status: 404 });
  }

  // Polling fallback mode
  if (mode === 'poll') {
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      fixture: initialData,
    });
  }

  // Server-Sent Events (SSE) real-time transport
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const sendSnapshot = async () => {
        try {
          const snapshot = await getMatchSnapshot(slug);
          if (snapshot) {
            const payload = JSON.stringify({
              timestamp: new Date().toISOString(),
              fixture: snapshot,
            });
            controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
          }
        } catch {
          // Ignore transient read error
        }
      };

      await sendSnapshot();
      const interval = setInterval(sendSnapshot, 8000);

      req.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
