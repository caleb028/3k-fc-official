import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { addMoneyCents, multiplyMoneyCents } from '@/lib/money';
import { initiateDarajaStkPush } from '@/lib/payments/daraja';
import { getAuthenticatedUser, checkRateLimit } from '@/lib/auth';

const shopCheckoutSchema = z.object({
  customerName: z.string().min(2).max(120),
  customerEmail: z.string().email(),
  customerPhone: z.string().min(9).max(16),
  deliveryOptionCode: z.string().min(1),
  shippingAddress: z.string().optional(),
  county: z.string().default('Embu'),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        variantId: z.string().min(1),
        quantity: z.number().int().min(1).max(10),
      })
    )
    .min(1),
});

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    if (!checkRateLimit(`shop-checkout:${ip}`, 10, 60_000)) {
      return NextResponse.json(
        { error: 'Too many checkout requests. Please wait a minute.' },
        { status: 429 }
      );
    }

    const raw = await req.json();
    const parsed = shopCheckoutSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid checkout details.', issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const user = await getAuthenticatedUser('PUBLIC');

    const order = await prisma.$transaction(async (tx) => {
      const deliveryOption = await tx.deliveryOption.findUnique({
        where: { code: parsed.data.deliveryOptionCode },
      });

      if (!deliveryOption || !deliveryOption.isActive) {
        throw new Error('Selected delivery option is invalid.');
      }

      let subtotalCents = 0;
      const preparedItems: Array<{
        productId: string;
        variantId: string;
        productName: string;
        variantLabel: string;
        quantity: number;
        unitPriceKesCents: number;
        subtotalKesCents: number;
      }> = [];

      for (const reqItem of parsed.data.items) {
        const variant = await tx.productVariant.findUnique({
          where: { id: reqItem.variantId },
          include: { product: true },
        });

        if (!variant || variant.productId !== reqItem.productId || !variant.product.isAvailable) {
          throw new Error('Selected merchandise variant is unavailable.');
        }

        const availableStock = variant.stockQuantity - variant.reservedQuantity;
        if (availableStock < reqItem.quantity) {
          throw new Error(
            `INSUFFICIENT_STOCK: Only ${Math.max(0, availableStock)} units remaining for ${variant.product.nameEn} (${variant.size}).`
          );
        }

        // Reserve stock for pending payment to prevent overselling
        await tx.productVariant.update({
          where: { id: variant.id },
          data: {
            reservedQuantity: { increment: reqItem.quantity },
          },
        });

        const unitPrice = addMoneyCents(
          variant.product.priceKesCents,
          variant.priceAdjustmentCents
        );
        const lineSubtotal = multiplyMoneyCents(unitPrice, reqItem.quantity);
        subtotalCents = addMoneyCents(subtotalCents, lineSubtotal);

        preparedItems.push({
          productId: variant.product.id,
          variantId: variant.id,
          productName: variant.product.nameEn,
          variantLabel: `${variant.size} • ${variant.color}`,
          quantity: reqItem.quantity,
          unitPriceKesCents: unitPrice,
          subtotalKesCents: lineSubtotal,
        });
      }

      // Server-side delivery fee calculation
      const deliveryFeeKesCents = deliveryOption.feeKesCents;
      const totalKesCents = addMoneyCents(subtotalCents, deliveryFeeKesCents);
      const orderNumber = `3K-SHOP-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

      return tx.shopOrder.create({
        data: {
          orderNumber,
          userId: user?.id ?? null,
          customerName: parsed.data.customerName.trim(),
          customerEmail: parsed.data.customerEmail.toLowerCase().trim(),
          customerPhone: parsed.data.customerPhone.trim(),
          deliveryOptionId: deliveryOption.id,
          shippingAddress: parsed.data.shippingAddress?.trim() || 'Embu Club Desk Collection',
          county: parsed.data.county,
          subtotalKesCents: subtotalCents,
          deliveryFeeKesCents,
          totalKesCents,
          status: 'PENDING_PAYMENT',
          items: {
            create: preparedItems,
          },
        },
      });
    });

    const stk = await initiateDarajaStkPush({
      purpose: 'SHOP_ORDER',
      purposeTargetId: order.id,
      phone: parsed.data.customerPhone,
      amountKesCents: order.totalKesCents,
      accountReference: order.orderNumber,
      transactionDesc: `3K FC Store Order ${order.orderNumber}`,
    });

    return NextResponse.json({
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        subtotalKesCents: order.subtotalKesCents,
        deliveryFeeKesCents: order.deliveryFeeKesCents,
        totalKesCents: order.totalKesCents,
        status: order.status,
      },
      payment: {
        id: stk.transaction.id,
        reference: stk.transaction.reference,
        checkoutRequestId: stk.transaction.checkoutRequestId,
        environment: stk.transaction.environment,
        status: stk.transaction.status,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unable to process shop order.' },
      { status: 400 }
    );
  }
}
