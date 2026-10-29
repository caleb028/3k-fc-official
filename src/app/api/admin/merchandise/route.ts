import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdminPermission } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';

const adjustStockSchema = z.object({
  variantId: z.string().min(1),
  delta: z.number().int(),
  reason: z.string().min(2),
});

const updateOrderStatusSchema = z.object({
  orderId: z.string().min(1),
  status: z.enum(['PENDING_PAYMENT', 'PAID', 'PROCESSING', 'READY_FOR_COLLECTION', 'DISPATCHED', 'DELIVERED', 'CANCELLED', 'REFUNDED']),
  trackingReference: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdminPermission('merchandise', 'update');
    const body = await req.json();
    const action = body.action;

    if (action === 'ADJUST_STOCK') {
      const parsed = adjustStockSchema.safeParse(body.payload);
      if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid parameters', issues: parsed.error.flatten() }, { status: 400 });
      }

      const variant = await prisma.productVariant.findUnique({
        where: { id: parsed.data.variantId },
        include: { product: true },
      });
      if (!variant) {
        return NextResponse.json({ error: 'Product variant not found' }, { status: 404 });
      }

      const updatedVariant = await prisma.productVariant.update({
        where: { id: variant.id },
        data: {
          stockQuantity: { increment: parsed.data.delta },
        },
      });

      await prisma.inventoryMovement.create({
        data: {
          variantId: variant.id,
          delta: parsed.data.delta,
          reason: 'MANUAL_ADJUSTMENT',
          referenceId: admin.id,
          recordedBy: admin.email,
        },
      });

      await recordAuditLog({
        actorId: admin.id,
        actorEmail: admin.email,
        actorRole: admin.roles[0],
        action: 'INVENTORY_STOCK_ADJUSTED',
        targetType: 'ProductVariant',
        targetId: variant.id,
        before: variant,
        after: updatedVariant,
        reason: `${parsed.data.reason} (Delta: ${parsed.data.delta > 0 ? `+${parsed.data.delta}` : parsed.data.delta}) by ${admin.email}`,
      });

      revalidatePath('/', 'layout');
      revalidatePath('/');
      revalidatePath('/shop');
      revalidatePath('/admin/merchandise');

      return NextResponse.json({ success: true, variant: updatedVariant });
    }

    if (action === 'UPDATE_ORDER_STATUS') {
      const parsed = updateOrderStatusSchema.safeParse(body.payload);
      if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid parameters', issues: parsed.error.flatten() }, { status: 400 });
      }

      const order = await prisma.shopOrder.findUnique({
        where: { id: parsed.data.orderId },
        include: { fulfilment: true },
      });
      if (!order) {
        return NextResponse.json({ error: 'Shop order not found' }, { status: 404 });
      }

      const updatedOrder = await prisma.shopOrder.update({
        where: { id: order.id },
        data: { status: parsed.data.status },
      });

      if (order.fulfilment) {
        await prisma.fulfilmentRecord.update({
          where: { orderId: order.id },
          data: {
            status: parsed.data.status === 'DELIVERED' ? 'DELIVERED' : parsed.data.status === 'DISPATCHED' ? 'DISPATCHED' : 'PENDING',
            trackingReference: parsed.data.trackingReference || order.fulfilment.trackingReference,
            notes: parsed.data.notes || order.fulfilment.notes,
            handledByStaff: admin.email,
            completedAt: parsed.data.status === 'DELIVERED' ? new Date() : null,
          },
        });
      }

      await recordAuditLog({
        actorId: admin.id,
        actorEmail: admin.email,
        actorRole: admin.roles[0],
        action: 'SHOP_ORDER_STATUS_UPDATED',
        targetType: 'ShopOrder',
        targetId: order.id,
        before: order,
        after: updatedOrder,
        reason: `Status changed to ${parsed.data.status} by ${admin.email}`,
      });

      return NextResponse.json({ success: true, order: updatedOrder });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to execute merchandise action' },
      { status: 403 }
    );
  }
}
