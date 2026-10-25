import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const tx = await prisma.paymentTransaction.findUnique({
    where: { id },
    include: {
      ticketOrder: {
        include: {
          fixture: { include: { homeClub: true, awayClub: true } },
          tickets: {
            include: { category: true },
          },
        },
      },
      shopOrder: {
        include: {
          deliveryOption: true,
          fulfilment: true,
        },
      },
      membership: {
        include: {
          plan: true,
          card: true,
        },
      },
      donation: {
        include: {
          receipt: true,
        },
      },
    },
  });

  if (!tx) {
    return NextResponse.json({ error: 'Payment transaction not found.' }, { status: 404 });
  }

  // Generate QR code Data URLs for issued tickets if payment is confirmed
  const issuedTicketsWithQr = [];
  if (tx.status === 'SUCCESS' && tx.ticketOrder?.tickets) {
    for (const tkt of tx.ticketOrder.tickets) {
      const qrDataUrl = await QRCode.toDataURL(tkt.signedToken, {
        width: 240,
        margin: 1,
      });
      issuedTicketsWithQr.push({
        id: tkt.id,
        ticketCode: tkt.ticketCode,
        signedToken: tkt.signedToken,
        holderName: tkt.holderName,
        categoryName: tkt.category.nameEn,
        status: tkt.status,
        issuedAt: tkt.issuedAt,
        qrDataUrl,
      });
    }
  }

  return NextResponse.json({
    transaction: {
      id: tx.id,
      reference: tx.reference,
      purpose: tx.purpose,
      status: tx.status,
      environment: tx.environment,
      amountKesCents: tx.amountKesCents,
      mpesaReceiptNumber: tx.mpesaReceiptNumber,
      checkoutRequestId: tx.checkoutRequestId,
      merchantRequestId: tx.merchantRequestId,
      resultDescription: tx.resultDescription,
      confirmedAt: tx.confirmedAt,
    },
    issuedTickets: issuedTicketsWithQr,
    shopOrder: tx.shopOrder
      ? {
          orderNumber: tx.shopOrder.orderNumber,
          status: tx.shopOrder.status,
          deliveryName: tx.shopOrder.deliveryOption.nameEn,
          fulfilmentStatus: tx.shopOrder.fulfilment?.status,
        }
      : null,
    membership: tx.membership
      ? {
          membershipNumber: tx.membership.membershipNumber,
          status: tx.membership.status,
          planName: tx.membership.plan.nameEn,
          expiresAt: tx.membership.expiresAt,
          card: tx.membership.card,
        }
      : null,
    donationReceipt: tx.donation?.receipt ?? null,
  });
}
