import React from 'react';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireAdminPermission } from '@/lib/auth';
import { MerchandiseAdminClient } from '@/components/admin/MerchandiseAdminClient';

export const dynamic = 'force-dynamic';

export default async function AdminMerchandisePage() {
  try {
    await requireAdminPermission('merchandise', 'read');
  } catch {
    redirect('/admin/dashboard');
  }

  const [products, orders] = await Promise.all([
    prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        variants: {
          orderBy: { size: 'asc' },
        },
      },
    }),
    prisma.shopOrder.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        deliveryOption: true,
        fulfilment: true,
        items: true,
      },
    }),
  ]);

  const formattedProducts = products.map((p) => ({
    id: p.id,
    slug: p.slug,
    sku: p.sku,
    nameEn: p.nameEn,
    category: p.category,
    priceKesCents: p.priceKesCents,
    isAvailable: p.isAvailable,
    variants: p.variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      size: v.size,
      color: v.color,
      stockQuantity: v.stockQuantity,
      reservedQuantity: v.reservedQuantity,
    })),
  }));

  const formattedOrders = orders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    customerName: o.customerName,
    customerEmail: o.customerEmail,
    customerPhone: o.customerPhone,
    county: o.county,
    totalKesCents: o.totalKesCents,
    status: o.status,
    createdAt: o.createdAt.toISOString(),
    deliveryOption: {
      nameEn: o.deliveryOption.nameEn,
      code: o.deliveryOption.code,
    },
    fulfilment: o.fulfilment
      ? {
          status: o.fulfilment.status,
          trackingReference: o.fulfilment.trackingReference,
        }
      : null,
    items: o.items.map((i) => ({
      productName: i.productName,
      variantLabel: i.variantLabel,
      quantity: i.quantity,
    })),
  }));

  return (
    <div className="space-y-6">
      <div className="border-b border-white/10 pb-4">
        <h1 className="editorial-headline font-black text-2xl text-white">
          Official Club Merchandise &amp; Inventory
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Monitor product stock counts, manage SKU variant reservations, adjust warehouse inventory levels, and process customer fulfillment.
        </p>
      </div>

      <MerchandiseAdminClient products={formattedProducts} orders={formattedOrders} />
    </div>
  );
}
