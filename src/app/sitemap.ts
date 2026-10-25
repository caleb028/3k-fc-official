import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const [articles, players, fixtures, products] = await Promise.all([
    prisma.article.findMany({ where: { status: 'PUBLISHED' }, select: { slug: true, updatedAt: true } }).catch(() => []),
    prisma.player.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }).catch(() => []),
    prisma.fixture.findMany({ select: { slug: true, updatedAt: true } }).catch(() => []),
    prisma.product.findMany({ where: { isAvailable: true }, select: { slug: true, updatedAt: true } }).catch(() => []),
  ]);

  const staticRoutes = [
    '',
    '/news',
    '/fixtures',
    '/results',
    '/table',
    '/team',
    '/tickets',
    '/shop',
    '/supporters',
    '/partners',
    '/support-3k',
    '/videos',
    '/club',
    '/contact',
    '/privacy',
    '/terms',
    '/ticket-terms',
    '/refund-policy',
    '/delivery-policy',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1.0 : 0.8,
  }));

  const dynamicRoutes = [
    ...articles.map((a) => ({
      url: `${baseUrl}/news/${a.slug}`,
      lastModified: a.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
    ...players.map((p) => ({
      url: `${baseUrl}/team/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
    ...fixtures.map((f) => ({
      url: `${baseUrl}/matches/${f.slug}`,
      lastModified: f.updatedAt,
      changeFrequency: 'daily' as const,
      priority: 0.8,
    })),
    ...products.map((pr) => ({
      url: `${baseUrl}/shop/${pr.slug}`,
      lastModified: pr.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
  ];

  return [...staticRoutes, ...dynamicRoutes];
}
