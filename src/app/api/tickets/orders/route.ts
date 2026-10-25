import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createPendingTicketOrder } from '@/lib/tickets/service';
import { initiateDarajaStkPush } from '@/lib/payments/daraja';
import { getAuthenticatedUser, checkRateLimit } from '@/lib/auth';

const createOrderSchema = z.object({
  fixtureId: z.string().min(1),
  buyerName: z.string().min(2).max(120),
  buyerEmail: z.string().email(),
  buyerPhone: z.string().min(9).max(16),
  items: z
    .array(
      z.object({
        categoryId: z.string().min(1),
        quantity: z.number().int().min(1).max(10),
      })
    )
    .min(1),
});

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    if (!checkRateLimit(`ticket-order:${ip}`, 10, 60_000)) {
      return NextResponse.json(
        { error: 'Too many ticket order requests. Please wait a minute and try again.' },
        { status: 429 }
      );
    }

    const raw = await req.json();
    const parsed = createOrderSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid ticket order details.', issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const user = await getAuthenticatedUser('PUBLIC');

    // Step 4-6: Validate capacity/pricing on server and create time-limited pending order
    const order = await createPendingTicketOrder({
      fixtureId: parsed.data.fixtureId,
      userId: user?.id ?? null,
      buyerName: parsed.data.buyerName,
      buyerEmail: parsed.data.buyerEmail,
      buyerPhone: parsed.data.buyerPhone,
      items: parsed.data.items,
      holdMinutes: 15,
    });

    // Step 7: Initiate M-Pesa Daraja STK Push on server
    const stkResult = await initiateDarajaStkPush({
      purpose: 'TICKET_ORDER',
      purposeTargetId: order.id,
      phone: parsed.data.buyerPhone,
      amountKesCents: order.totalKesCents,
      accountReference: order.orderNumber,
      transactionDesc: `3K FC Match Tickets (${order.orderNumber})`,
    });

    return NextResponse.json({
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        totalKesCents: order.totalKesCents,
        status: order.status,
        expiresAt: order.expiresAt,
      },
      payment: {
        id: stkResult.transaction.id,
        reference: stkResult.transaction.reference,
        checkoutRequestId: stkResult.transaction.checkoutRequestId,
        status: stkResult.transaction.status,
        environment: stkResult.transaction.environment,
        darajaIntegrationStatus: stkResult.darajaIntegrationStatus,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unable to create ticket order.' },
      { status: 400 }
    );
  }
}
