import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdminPermission } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';

const updatePageSchema = z.object({
  slug: z.string().min(1),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('PUBLISHED'),
  translations: z.array(
    z.object({
      locale: z.enum(['en', 'sw']),
      title: z.string().min(2),
      summary: z.string().optional().nullable(),
      body: z.string().min(5),
      seoTitle: z.string().optional().nullable(),
      seoDescription: z.string().optional().nullable(),
    })
  ),
});

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdminPermission('pages', 'update');
    const raw = await req.json();
    const parsed = updatePageSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid page parameters', issues: parsed.error.flatten() }, { status: 400 });
    }

    const page = await prisma.staticPage.upsert({
      where: { slug: parsed.data.slug },
      update: { status: parsed.data.status },
      create: { slug: parsed.data.slug, status: parsed.data.status },
    });

    for (const tr of parsed.data.translations) {
      await prisma.pageTranslation.upsert({
        where: { pageId_locale: { pageId: page.id, locale: tr.locale } },
        update: {
          title: tr.title,
          summary: tr.summary,
          body: tr.body,
          seoTitle: tr.seoTitle,
          seoDescription: tr.seoDescription,
        },
        create: {
          pageId: page.id,
          locale: tr.locale,
          title: tr.title,
          summary: tr.summary,
          body: tr.body,
          seoTitle: tr.seoTitle,
          seoDescription: tr.seoDescription,
        },
      });
    }

    await recordAuditLog({
      actorId: admin.id,
      actorEmail: admin.email,
      actorRole: admin.roles[0],
      action: 'STATIC_PAGE_UPDATED',
      targetType: 'StaticPage',
      targetId: page.id,
      reason: `Page [${page.slug}] updated by ${admin.email}`,
    });

    return NextResponse.json({ success: true, page });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to update page' },
      { status: 403 }
    );
  }
}
