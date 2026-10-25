import React from 'react';
import { prisma } from '@/lib/prisma';
import { ShopStoreClient } from '@/components/shop/ShopStoreClient';

export const dynamic = 'force-dynamic';

export default async function ShopPage() {
  const [products, deliveryOptions] = await Promise.all([
    prisma.product.findMany({
      where: { isAvailable: true },
      orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
      include: { variants: true, images: true },
    }),
    prisma.deliveryOption.findMany({
      where: { isActive: true },
      orderBy: { feeKesCents: 'asc' },
    }),
  ]);

  const formattedProducts = products.map((p) => ({
    id: p.id,
    slug: p.slug,
    sku: p.sku,
    nameEn: p.nameEn,
    nameSw: p.nameSw,
    descriptionEn: p.descriptionEn,
    category: p.category,
    priceKesCents: p.priceKesCents,
    isAuthenticClubGear: p.isAuthenticClubGear,
    imageUrl: p.images[0]?.url || null,
    variants: p.variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      size: v.size,
      color: v.color,
      availableStock: Math.max(0, v.stockQuantity - v.reservedQuantity),
      priceAdjustmentCents: v.priceAdjustmentCents,
    })),
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 md:py-14">
      <div className="border-b-2 border-slate-900 pb-6 mb-8">
        <p className="athletic-label text-xs text-club-primary">
          Official Club E-Commerce • Embu Collection &amp; Nationwide Delivery
        </p>
        <h1 className="editorial-headline text-4xl md:text-5xl text-slate-900 mt-1">
          Official 3K FC Online Store
        </h1>
        <p className="text-sm text-slate-600 mt-2 max-w-2xl leading-relaxed">
          Authentic 2026/27 FKF Premier League home and away replica jerseys, technical training wear, and matchday scarves. All prices in Kenyan Shillings (KES) with M-Pesa Daraja instant checkout.
        </p>
      </div>

      <ShopStoreClient
        products={formattedProducts}
        deliveryOptions={deliveryOptions.map((d) => ({
          code: d.code,
          nameEn: d.nameEn,
          feeKesCents: d.feeKesCents,
          estimatedDays: d.estimatedDays,
        }))}
      />
    </div>
  );
}
