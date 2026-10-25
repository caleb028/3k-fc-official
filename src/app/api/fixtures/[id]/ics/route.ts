import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function formatIcsDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const fixture = await prisma.fixture.findUnique({
    where: { id },
    include: {
      homeClub: true,
      awayClub: true,
      competition: true,
      season: true,
    },
  });

  if (!fixture) {
    return NextResponse.json({ error: 'Fixture not found' }, { status: 404 });
  }

  const start = new Date(fixture.kickoffAt);
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  const summary = `${fixture.homeClub.name} vs ${fixture.awayClub.name} (${fixture.competition.name})`;
  const description = [
    `Competition: ${fixture.competition.name} (${fixture.season.name})`,
    `Status: ${fixture.status}`,
    `Kick-off Confirmation: ${fixture.kickoffConfirmed ? 'Confirmed' : 'Provisional — Subject to FKF Confirmation'}`,
    `Match Centre: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/matches/${fixture.slug}`,
  ].join('\\n');

  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//3K FC Official Platform//Embu Kenya//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:fixture-${fixture.id}@3kfc.co.ke`,
    `DTSTAMP:${formatIcsDate(new Date())}`,
    `DTSTART:${formatIcsDate(start)}`,
    `DTEND:${formatIcsDate(end)}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${fixture.venueName}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  return new NextResponse(icsLines.join('\r\n'), {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${fixture.slug}.ics"`,
    },
  });
}
