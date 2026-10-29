import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdminPermission } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';

const articleSchema = z.object({
  slug: z.string().optional(),
  categoryId: z.string().min(1),
  authorName: z.string().default('3K FC Media Desk'),
  headlineEn: z.string().min(5),
  summaryEn: z.string().min(10),
  bodyEn: z.string().min(20),
  headlineSw: z.string().optional(),
  summarySw: z.string().optional(),
  bodySw: z.string().optional(),
  featuredImageUrl: z.string().optional().nullable(),
  featuredImageAlt: z.string().optional().nullable(),
  isFeatured: z.boolean().default(false),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('PUBLISHED'),
});

const updateArticleSchema = z.object({
  id: z.string().min(1),
  categoryId: z.string().optional(),
  authorName: z.string().optional(),
  headlineEn: z.string().optional(),
  summaryEn: z.string().optional(),
  bodyEn: z.string().optional(),
  featuredImageUrl: z.string().optional().nullable(),
  isFeatured: z.boolean().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdminPermission('articles', 'create');
    const raw = await req.json();
    const parsed = articleSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid article data.', issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Generate slug from headline if not provided
    const baseSlug = data.slug
      ? data.slug.toLowerCase().trim()
      : data.headlineEn
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
          .slice(0, 60) + `-${Date.now().toString().slice(-4)}`;

    // If featured, adjust other hero orders so this becomes hero #1
    if (data.isFeatured) {
      await prisma.article.updateMany({
        where: { isFeatured: true },
        data: { heroOrder: 2 },
      });
    }

    const created = await prisma.article.create({
      data: {
        slug: baseSlug,
        categoryId: data.categoryId,
        authorName: data.authorName.trim(),
        featuredImageUrl: data.featuredImageUrl || '/images/3k-fc-team-celebration.png',
        featuredImageAlt: data.featuredImageAlt || data.headlineEn,
        isPlaceholderImage: false,
        isFeatured: data.isFeatured,
        heroOrder: data.isFeatured ? 1 : 99,
        status: data.status,
        publishedAt: data.status === 'PUBLISHED' ? new Date() : null,
        translations: {
          create: [
            {
              locale: 'en',
              headline: data.headlineEn.trim(),
              summary: data.summaryEn.trim(),
              body: data.bodyEn.trim(),
              isComplete: true,
            },
            ...(data.headlineSw && data.bodySw
              ? [
                  {
                    locale: 'sw',
                    headline: data.headlineSw.trim(),
                    summary: data.summarySw?.trim() || data.summaryEn.trim(),
                    body: data.bodySw.trim(),
                    isComplete: true,
                  },
                ]
              : [
                  {
                    locale: 'sw',
                    headline: data.headlineEn.trim(),
                    summary: data.summaryEn.trim(),
                    body: data.bodyEn.trim(),
                    isComplete: false,
                  },
                ]),
          ],
        },
      },
      include: {
        category: true,
        translations: true,
      },
    });

    await recordAuditLog({
      actorId: admin.id,
      actorEmail: admin.email,
      actorRole: admin.roles[0],
      action: 'ARTICLE_CREATED',
      targetType: 'Article',
      targetId: created.id,
      after: { slug: created.slug, headline: data.headlineEn, isFeatured: created.isFeatured },
      reason: 'Editorial story published via admin dashboard',
    });

    revalidatePath('/', 'layout');
    revalidatePath('/');
    revalidatePath('/news');
    revalidatePath(`/news/${created.slug}`);
    revalidatePath('/admin/news');

    return NextResponse.json({ success: true, article: created });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Article creation failed' },
      { status: 400 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdminPermission('articles', 'update');
    const raw = await req.json();
    const parsed = updateArticleSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid update parameters.', issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { id, ...updates } = parsed.data;
    const existing = await prisma.article.findUnique({
      where: { id },
      include: { translations: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Article not found.' }, { status: 404 });
    }

    const updated = await prisma.article.update({
      where: { id },
      data: {
        ...(updates.categoryId ? { categoryId: updates.categoryId } : {}),
        ...(updates.authorName ? { authorName: updates.authorName } : {}),
        ...(updates.featuredImageUrl !== undefined ? { featuredImageUrl: updates.featuredImageUrl, isPlaceholderImage: false } : {}),
        ...(updates.isFeatured !== undefined ? { isFeatured: updates.isFeatured } : {}),
        ...(updates.status ? { status: updates.status } : {}),
      },
      include: {
        category: true,
        translations: true,
      },
    });

    // Update translations if provided
    if (updates.headlineEn || updates.summaryEn || updates.bodyEn) {
      const enTrans = existing.translations.find((t) => t.locale === 'en');
      if (enTrans) {
        await prisma.articleTranslation.update({
          where: { id: enTrans.id },
          data: {
            ...(updates.headlineEn ? { headline: updates.headlineEn } : {}),
            ...(updates.summaryEn ? { summary: updates.summaryEn } : {}),
            ...(updates.bodyEn ? { body: updates.bodyEn } : {}),
          },
        });
      }
    }

    await recordAuditLog({
      actorId: admin.id,
      actorEmail: admin.email,
      actorRole: admin.roles[0],
      action: 'ARTICLE_UPDATED',
      targetType: 'Article',
      targetId: updated.id,
      before: existing,
      after: updated,
      reason: `Staff updated article ${updated.slug}`,
    });

    revalidatePath('/', 'layout');
    revalidatePath('/');
    revalidatePath('/news');
    revalidatePath(`/news/${updated.slug}`);
    revalidatePath('/admin/news');

    return NextResponse.json({ success: true, article: updated });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to update article' },
      { status: 400 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const admin = await requireAdminPermission('articles', 'delete');
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Article ID is required.' }, { status: 400 });
    }

    const existing = await prisma.article.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Article not found.' }, { status: 404 });
    }

    // Delete translations first
    await prisma.articleTranslation.deleteMany({ where: { articleId: id } });
    await prisma.article.delete({ where: { id } });

    await recordAuditLog({
      actorId: admin.id,
      actorEmail: admin.email,
      actorRole: admin.roles[0],
      action: 'ARTICLE_DELETED',
      targetType: 'Article',
      targetId: id,
      before: existing,
      reason: `Staff deleted article ${existing.slug}`,
    });

    revalidatePath('/', 'layout');
    revalidatePath('/');
    revalidatePath('/news');
    revalidatePath(`/news/${existing.slug}`);
    revalidatePath('/admin/news');

    return NextResponse.json({ success: true, message: 'Article deleted.' });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to delete article' },
      { status: 400 }
    );
  }
}
