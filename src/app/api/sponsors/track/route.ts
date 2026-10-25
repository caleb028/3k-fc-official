import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const sponsorId = req.nextUrl.searchParams.get('sponsorId');
  const zone = req.nextUrl.searchParams.get('zone') || 'HOMEPAGE_MAIN';
  const target = req.nextUrl.searchParams.get('target') || 'https://www.mozzartbet.co.ke';

  if (sponsorId) {
    const placement = await prisma.sponsorPlacement
      .findFirst({
        where: { sponsorId, placementZone: zone },
      })
      .catch(() => null);

    await prisma.sponsorEvent
      .create({
        data: {
          placementId: placement?.id ?? null,
          eventType: 'CLICK',
          pagePath: zone,
          consentVerified: true,
        },
      })
      .catch(() => null);
  }

  return NextResponse.redirect(target);
}
