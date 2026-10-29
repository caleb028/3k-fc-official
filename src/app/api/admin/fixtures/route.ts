import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdminPermission } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';

const createFixtureSchema = z.object({
  slug: z.string().optional(),
  competitionId: z.string().optional(),
  seasonId: z.string().optional(),
  homeClubId: z.string().optional(),
  awayClubId: z.string().optional(),
  opponentName: z.string().optional(),
  isHome: z.boolean().default(true),
  roundName: z.string().optional(),
  matchday: z.number().int().optional(),
  kickoffAt: z.string(),
  kickoffConfirmed: z.boolean().default(true),
  venueName: z.string().optional(),
  venueCity: z.string().optional(),
  venueConfirmed: z.boolean().default(true),
  ticketsAvailable: z.boolean().default(false),
  status: z
    .enum(['SCHEDULED', 'POSTPONED', 'DELAYED', 'LIVE', 'HALF_TIME', 'FULL_TIME', 'CANCELLED'])
    .default('SCHEDULED'),
});

const updateFixtureSchema = z.object({
  id: z.string().min(1),
  status: z
    .enum(['SCHEDULED', 'POSTPONED', 'DELAYED', 'LIVE', 'HALF_TIME', 'FULL_TIME', 'CANCELLED'])
    .optional(),
  venueName: z.string().optional(),
  venueCity: z.string().optional(),
  kickoffAt: z.string().optional(),
  kickoffConfirmed: z.boolean().optional(),
  ticketsAvailable: z.boolean().optional(),
  roundName: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdminPermission('fixtures', 'create');
    const raw = await req.json();
    const parsed = createFixtureSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid fixture parameters.', issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // 1. Get 3K FC Club
    const club3k = await prisma.club.findFirst({
      where: { isOurClub: true },
    });
    if (!club3k) {
      return NextResponse.json({ error: '3K FC Club record not found' }, { status: 500 });
    }

    // 2. Resolve Opponent Club
    let opponentClubId = data.isHome ? data.awayClubId : data.homeClubId;
    let opponentName = data.opponentName;

    if (!opponentClubId && opponentName) {
      const oppSlug = opponentName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      let oppClub = await prisma.club.findUnique({ where: { slug: oppSlug } });
      if (!oppClub) {
        oppClub = await prisma.club.create({
          data: {
            name: opponentName.trim(),
            shortName: opponentName.trim().slice(0, 16),
            slug: oppSlug,
            city: data.isHome ? 'Kenya' : data.venueCity || 'Kenya',
            isOurClub: false,
          },
        });
      }
      opponentClubId = oppClub.id;
    }

    if (!opponentClubId) {
      return NextResponse.json(
        { error: 'Opponent club must be selected or specified.' },
        { status: 400 }
      );
    }

    const homeClubId = data.isHome ? club3k.id : opponentClubId;
    const awayClubId = data.isHome ? opponentClubId : club3k.id;

    // 3. Resolve Competition & Season
    let competitionId = data.competitionId;
    if (!competitionId) {
      const comp = await prisma.competition.findFirst({
        where: { slug: 'fkf-premier-league' },
      });
      competitionId = comp?.id || (await prisma.competition.findFirst())?.id;
    }
    if (!competitionId) {
      return NextResponse.json({ error: 'No competition found in database.' }, { status: 500 });
    }

    let seasonId = data.seasonId;
    if (!seasonId) {
      const season = await prisma.season.findFirst({
        where: { isCurrent: true },
      });
      seasonId = season?.id || (await prisma.season.findFirst())?.id;
    }
    if (!seasonId) {
      return NextResponse.json({ error: 'No active season found in database.' }, { status: 500 });
    }

    // 4. Opponent details for Slug
    const opponentClub = await prisma.club.findUnique({ where: { id: opponentClubId } });
    const oppSlug = opponentClub?.slug || 'opponent';

    const baseSlug = data.slug
      ? data.slug.toLowerCase().trim()
      : data.isHome
      ? `3k-fc-vs-${oppSlug}-${Date.now().toString().slice(-4)}`
      : `${oppSlug}-vs-3k-fc-${Date.now().toString().slice(-4)}`;

    const venueName =
      data.venueName || (data.isHome ? 'Moi Stadium, Embu' : `${opponentClub?.name || 'Away'} Stadium`);
    const venueCity = data.venueCity || (data.isHome ? 'Embu' : opponentClub?.city || 'Kenya');

    // 5. Create Fixture
    const created = await prisma.fixture.create({
      data: {
        slug: baseSlug,
        competitionId,
        seasonId,
        homeClubId,
        awayClubId,
        isHomeMatch: data.isHome,
        roundName: data.roundName || 'FKF Premier League',
        matchday: data.matchday || null,
        kickoffAt: new Date(data.kickoffAt),
        kickoffConfirmed: data.kickoffConfirmed,
        venueName,
        venueCity,
        venueConfirmed: data.venueConfirmed,
        status: data.status,
        ticketsAvailable: data.ticketsAvailable,
      },
      include: {
        competition: true,
        homeClub: true,
        awayClub: true,
      },
    });

    // 6. If tickets available, bootstrap ticket categories for home fixture
    if (data.ticketsAvailable && data.isHome) {
      await prisma.ticketCategory.createMany({
        data: [
          {
            fixtureId: created.id,
            nameEn: 'General Admission (Terraces)',
            nameSw: 'Jukwaa la Kawaida (Terraces)',
            descriptionEn: 'General stadium terraces admission.',
            priceKesCents: 20000, // KES 200
            maxPerOrder: 6,
            isActive: true,
          },
          {
            fixtureId: created.id,
            nameEn: 'VIP / Main Dais Hospitality',
            nameSw: 'Jukwaa Kuu la VIP',
            descriptionEn: 'Covered Main Dais VIP reserved seating.',
            priceKesCents: 50000, // KES 500
            maxPerOrder: 4,
            isActive: true,
          },
        ],
      });
    }

    // 7. Audit Log
    await recordAuditLog({
      actorId: admin.id,
      actorEmail: admin.email,
      actorRole: admin.roles[0],
      action: 'FIXTURE_POSTED',
      targetType: 'Fixture',
      targetId: created.id,
      after: {
        slug: created.slug,
        home: created.homeClub.name,
        away: created.awayClub.name,
        kickoffAt: created.kickoffAt,
        status: created.status,
      },
      reason: `Staff posted upcoming match: ${created.homeClub.name} vs ${created.awayClub.name}`,
    });

    revalidatePath('/', 'layout');
    revalidatePath('/');
    revalidatePath('/fixtures');
    revalidatePath('/results');
    revalidatePath('/match-centre');
    revalidatePath('/admin/fixtures');

    return NextResponse.json({ success: true, fixture: created });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to post upcoming match' },
      { status: 400 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdminPermission('fixtures', 'update');
    const raw = await req.json();
    const parsed = updateFixtureSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid update parameters.', issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { id, ...updates } = parsed.data;
    const existing = await prisma.fixture.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Fixture not found' }, { status: 404 });
    }

    const updated = await prisma.fixture.update({
      where: { id },
      data: {
        ...(updates.status ? { status: updates.status } : {}),
        ...(updates.venueName ? { venueName: updates.venueName } : {}),
        ...(updates.venueCity ? { venueCity: updates.venueCity } : {}),
        ...(updates.kickoffAt ? { kickoffAt: new Date(updates.kickoffAt) } : {}),
        ...(updates.kickoffConfirmed !== undefined
          ? { kickoffConfirmed: updates.kickoffConfirmed }
          : {}),
        ...(updates.ticketsAvailable !== undefined
          ? { ticketsAvailable: updates.ticketsAvailable }
          : {}),
        ...(updates.roundName ? { roundName: updates.roundName } : {}),
      },
      include: {
        competition: true,
        homeClub: true,
        awayClub: true,
      },
    });

    await recordAuditLog({
      actorId: admin.id,
      actorEmail: admin.email,
      actorRole: admin.roles[0],
      action: 'FIXTURE_UPDATED',
      targetType: 'Fixture',
      targetId: updated.id,
      before: existing,
      after: updated,
      reason: `Staff updated match fixture ${updated.slug}`,
    });

    revalidatePath('/', 'layout');
    revalidatePath('/');
    revalidatePath('/fixtures');
    revalidatePath('/results');
    revalidatePath('/match-centre');
    revalidatePath('/admin/fixtures');

    return NextResponse.json({ success: true, fixture: updated });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to update fixture' },
      { status: 400 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const admin = await requireAdminPermission('fixtures', 'delete');
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Fixture ID is required.' }, { status: 400 });
    }

    const existing = await prisma.fixture.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Fixture not found.' }, { status: 404 });
    }

    await prisma.fixture.delete({ where: { id } });

    await recordAuditLog({
      actorId: admin.id,
      actorEmail: admin.email,
      actorRole: admin.roles[0],
      action: 'FIXTURE_DELETED',
      targetType: 'Fixture',
      targetId: id,
      before: existing,
      reason: `Staff deleted fixture: ${existing.slug}`,
    });

    revalidatePath('/', 'layout');
    revalidatePath('/');
    revalidatePath('/fixtures');
    revalidatePath('/results');
    revalidatePath('/match-centre');
    revalidatePath('/admin/fixtures');

    return NextResponse.json({ success: true, message: 'Fixture deleted.' });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to delete fixture' },
      { status: 400 }
    );
  }
}
