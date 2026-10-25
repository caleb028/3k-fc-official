import crypto from 'crypto';
import { prisma } from '../prisma';
import { generateTicketCode, signTicketPayload, verifyTicketToken } from './qr-crypto';
import { multiplyMoneyCents, addMoneyCents } from '../money';
import { recordAuditLog } from '../audit';
import { awardOrAdjustLoyaltyPoints } from '../loyalty/service';

export type GateScanResultCode =
  | 'VALID_ACCEPTED'
  | 'ALREADY_USED'
  | 'INVALID_TICKET'
  | 'WRONG_MATCH'
  | 'CANCELLED_OR_REFUNDED'
  | 'PAYMENT_NOT_CONFIRMED';

export interface GateScanResponse {
  result: GateScanResultCode;
  message: string;
  ticketCode?: string;
  holderName?: string;
  categoryName?: string;
  fixtureTitle?: string;
  redeemedAt?: string;
  redeemedGate?: string;
}

/**
 * Releases expired pending ticket orders and restores reserved capacity.
 */
export async function releaseExpiredTicketHolds() {
  const now = new Date();
  const expiredOrders = await prisma.ticketOrder.findMany({
    where: {
      status: 'PENDING_PAYMENT',
      expiresAt: { lt: now },
    },
    include: { items: true },
  });

  for (const order of expiredOrders) {
    await prisma.$transaction(async (tx) => {
      const current = await tx.ticketOrder.findUnique({ where: { id: order.id } });
      if (!current || current.status !== 'PENDING_PAYMENT') return;

      for (const item of order.items) {
        const inv = await tx.ticketInventory.findUnique({ where: { categoryId: item.categoryId } });
        if (inv) {
          await tx.ticketInventory.update({
            where: { categoryId: item.categoryId },
            data: {
              reservedCount: Math.max(0, inv.reservedCount - item.quantity),
            },
          });
        }
      }

      await tx.ticketOrder.update({
        where: { id: order.id },
        data: { status: 'EXPIRED' },
      });
    });
  }

  return expiredOrders.length;
}

/**
 * Creates a time-limited pending ticket order with transactional capacity reservation.
 */
export async function createPendingTicketOrder(params: {
  fixtureId: string;
  userId?: string | null;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  items: Array<{ categoryId: string; quantity: number }>;
  holdMinutes?: number;
}) {
  await releaseExpiredTicketHolds();

  if (!params.items || params.items.length === 0) {
    throw new Error('At least one ticket category and quantity must be selected.');
  }

  const holdMinutes = params.holdMinutes ?? 15;

  return prisma.$transaction(async (tx) => {
    const fixture = await tx.fixture.findUnique({ where: { id: params.fixtureId } });
    if (!fixture) {
      throw new Error('Selected fixture does not exist.');
    }
    if (!fixture.ticketsAvailable || fixture.status === 'CANCELLED' || fixture.status === 'FULL_TIME') {
      throw new Error('Tickets are not currently available for sale for this fixture.');
    }

    let orderTotalCents = 0;
    const preparedItems: Array<{
      categoryId: string;
      quantity: number;
      unitPriceKesCents: number;
      subtotalKesCents: number;
    }> = [];

    for (const reqItem of params.items) {
      if (!Number.isInteger(reqItem.quantity) || reqItem.quantity <= 0) {
        throw new Error('Ticket quantity must be a positive integer.');
      }

      const category = await tx.ticketCategory.findUnique({
        where: { id: reqItem.categoryId },
        include: { inventory: true },
      });

      if (!category || category.fixtureId !== params.fixtureId || !category.isActive) {
        throw new Error('Invalid or inactive ticket category for this fixture.');
      }

      if (reqItem.quantity > category.maxPerOrder) {
        throw new Error(`Maximum ${category.maxPerOrder} tickets allowed per order for ${category.nameEn}.`);
      }

      const now = new Date();
      if (category.saleOpensAt > now) {
        throw new Error(`Ticket sales for ${category.nameEn} have not opened yet.`);
      }
      if (category.saleClosesAt && category.saleClosesAt < now) {
        throw new Error(`Ticket sales for ${category.nameEn} have closed.`);
      }

      const inventory = category.inventory;
      if (!inventory) {
        throw new Error(`Inventory not configured for category ${category.nameEn}.`);
      }

      const available = inventory.totalCapacity - inventory.soldCount - inventory.reservedCount;
      if (available < reqItem.quantity) {
        throw new Error(`CAPACITY_EXCEEDED: Only ${Math.max(0, available)} tickets remaining for ${category.nameEn}.`);
      }

      // Reserve capacity atomically inside transaction
      await tx.ticketInventory.update({
        where: { id: inventory.id },
        data: {
          reservedCount: { increment: reqItem.quantity },
        },
      });

      const subtotalCents = multiplyMoneyCents(category.priceKesCents, reqItem.quantity);
      orderTotalCents = addMoneyCents(orderTotalCents, subtotalCents);

      preparedItems.push({
        categoryId: category.id,
        quantity: reqItem.quantity,
        unitPriceKesCents: category.priceKesCents,
        subtotalKesCents: subtotalCents,
      });
    }

    const orderNumber = `3K-ORD-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    const expiresAt = new Date(Date.now() + holdMinutes * 60 * 1000);

    const order = await tx.ticketOrder.create({
      data: {
        orderNumber,
        fixtureId: params.fixtureId,
        userId: params.userId ?? null,
        buyerName: params.buyerName.trim(),
        buyerEmail: params.buyerEmail.toLowerCase().trim(),
        buyerPhone: params.buyerPhone.trim(),
        totalKesCents: orderTotalCents,
        status: 'PENDING_PAYMENT',
        expiresAt,
        items: {
          create: preparedItems,
        },
      },
      include: {
        items: { include: { category: true } },
        fixture: { include: { homeClub: true, awayClub: true } },
      },
    });

    return order;
  });
}

/**
 * Issues signed QR tickets only after server-verified payment confirmation.
 * Idempotent: if order is already PAID and tickets exist, returns existing tickets.
 */
export async function issueTicketsForConfirmedOrder(orderId: string, paymentTxId: string) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.ticketOrder.findUnique({
      where: { id: orderId },
      include: { items: true, tickets: true },
    });

    if (!order) {
      throw new Error(`TicketOrder not found: ${orderId}`);
    }

    if (order.status === 'PAID' && order.tickets.length > 0) {
      return order.tickets;
    }

    for (const item of order.items) {
      const inv = await tx.ticketInventory.findUnique({ where: { categoryId: item.categoryId } });
      if (inv) {
        await tx.ticketInventory.update({
          where: { id: inv.id },
          data: {
            reservedCount: Math.max(0, inv.reservedCount - item.quantity),
            soldCount: { increment: item.quantity },
          },
        });
      }
    }

    await tx.ticketOrder.update({
      where: { id: order.id },
      data: {
        status: 'PAID',
        paidAt: new Date(),
        paymentTxId,
      },
    });

    const issuedTickets = [];
    for (const item of order.items) {
      for (let i = 0; i < item.quantity; i++) {
        const ticketCode = generateTicketCode();
        const nonce = crypto.randomBytes(8).toString('hex');
        const issuedUnix = Math.floor(Date.now() / 1000);
        const signedToken = signTicketPayload({
          v: 1,
          tkt: ticketCode,
          ord: order.id,
          fix: order.fixtureId,
          cat: item.categoryId,
          iat: issuedUnix,
          nce: nonce,
        });

        const ticket = await tx.ticket.create({
          data: {
            ticketCode,
            signedToken,
            orderId: order.id,
            fixtureId: order.fixtureId,
            categoryId: item.categoryId,
            ownerUserId: order.userId,
            holderName: order.buyerName,
            status: 'VALID',
          },
        });
        issuedTickets.push(ticket);
      }
    }

    return issuedTickets;
  });
}

/**
 * Atomic Gate-Scanning Ticket Redemption
 * Section 10:
 * - Prevent two gate devices from redeeming the same ticket simultaneously by using an atomic server-side redemption operation.
 * - Display clear results: Valid — entry accepted, Already used, Invalid ticket, Wrong match, Cancelled or refunded, Payment not confirmed.
 */
export async function validateAndRedeemTicketAtGate(params: {
  qrTokenOrTicketCode: string;
  assignedFixtureId: string;
  gateName: string;
  staffUserId?: string;
  staffName: string;
  wasOfflineSync?: boolean;
}): Promise<GateScanResponse> {
  const input = params.qrTokenOrTicketCode.trim();

  let targetTicketCode: string | null = null;

  if (input.includes('.')) {
    const verification = verifyTicketToken(input);
    if (!verification.validSignature || !verification.payload) {
      return {
        result: 'INVALID_TICKET' as const,
        message: 'Invalid ticket — cryptographic QR signature verification failed.',
      };
    }
    targetTicketCode = verification.payload.tkt;
  } else if (input.startsWith('3K-TKT-')) {
    targetTicketCode = input.toUpperCase();
  } else {
    return {
      result: 'INVALID_TICKET' as const,
      message: 'Invalid ticket — unrecognized QR token or ticket reference format.',
    };
  }

  return prisma.$transaction(async (tx): Promise<GateScanResponse> => {
    const ticket = await tx.ticket.findUnique({
      where: { ticketCode: targetTicketCode! },
      include: {
        order: true,
        category: true,
        fixture: { include: { homeClub: true, awayClub: true } },
      },
    });

    if (!ticket) {
      return {
        result: 'INVALID_TICKET' as const,
        message: 'Invalid ticket — ticket code does not exist in 3K FC records.',
      };
    }

    // If scanned via signed QR token, verify token matches current active rotated token on ticket
    if (input.includes('.') && ticket.signedToken !== input) {
      await tx.ticketRedemption.create({
        data: {
          ticketId: ticket.id,
          fixtureId: params.assignedFixtureId,
          gateName: params.gateName,
          staffUserId: params.staffUserId ?? null,
          staffName: params.staffName,
          scanOutcome: 'INVALID_TOKEN',
          wasOfflineSync: Boolean(params.wasOfflineSync),
        },
      });
      return {
        result: 'INVALID_TICKET',
        message: 'Invalid ticket — QR credential was rotated or superseded by a ticket transfer.',
        ticketCode: ticket.ticketCode,
      };
    }

    const fixtureTitle = `${ticket.fixture.homeClub.shortName} vs ${ticket.fixture.awayClub.shortName}`;

    if (ticket.fixtureId !== params.assignedFixtureId) {
      await tx.ticketRedemption.create({
        data: {
          ticketId: ticket.id,
          fixtureId: params.assignedFixtureId,
          gateName: params.gateName,
          staffUserId: params.staffUserId ?? null,
          staffName: params.staffName,
          scanOutcome: 'WRONG_MATCH',
          wasOfflineSync: Boolean(params.wasOfflineSync),
        },
      });
      return {
        result: 'WRONG_MATCH',
        message: `Wrong match — ticket belongs to ${fixtureTitle}.`,
        ticketCode: ticket.ticketCode,
        holderName: ticket.holderName,
        categoryName: ticket.category.nameEn,
        fixtureTitle,
      };
    }

    if (ticket.order.status !== 'PAID') {
      await tx.ticketRedemption.create({
        data: {
          ticketId: ticket.id,
          fixtureId: params.assignedFixtureId,
          gateName: params.gateName,
          staffUserId: params.staffUserId ?? null,
          staffName: params.staffName,
          scanOutcome: 'UNPAID',
          wasOfflineSync: Boolean(params.wasOfflineSync),
        },
      });
      return {
        result: 'PAYMENT_NOT_CONFIRMED',
        message: 'Payment not confirmed — order has not been settled.',
        ticketCode: ticket.ticketCode,
        holderName: ticket.holderName,
      };
    }

    if (ticket.status === 'CANCELLED' || ticket.status === 'REFUNDED' || ticket.status === 'TRANSFERRED_INVALIDATED') {
      await tx.ticketRedemption.create({
        data: {
          ticketId: ticket.id,
          fixtureId: params.assignedFixtureId,
          gateName: params.gateName,
          staffUserId: params.staffUserId ?? null,
          staffName: params.staffName,
          scanOutcome: 'CANCELLED_OR_REFUNDED',
          wasOfflineSync: Boolean(params.wasOfflineSync),
        },
      });
      return {
        result: 'CANCELLED_OR_REFUNDED',
        message: `Cancelled or refunded — ticket status is ${ticket.status}.`,
        ticketCode: ticket.ticketCode,
        holderName: ticket.holderName,
      };
    }

    if (ticket.status === 'REDEEMED') {
      await tx.ticketRedemption.create({
        data: {
          ticketId: ticket.id,
          fixtureId: params.assignedFixtureId,
          gateName: params.gateName,
          staffUserId: params.staffUserId ?? null,
          staffName: params.staffName,
          scanOutcome: 'ALREADY_USED',
          wasOfflineSync: Boolean(params.wasOfflineSync),
        },
      });
      return {
        result: 'ALREADY_USED',
        message: `Already used — redeemed at ${ticket.redeemedGate ?? 'Gate'} on ${ticket.redeemedAt?.toISOString() ?? 'earlier scan'}.`,
        ticketCode: ticket.ticketCode,
        holderName: ticket.holderName,
        categoryName: ticket.category.nameEn,
        redeemedAt: ticket.redeemedAt?.toISOString(),
        redeemedGate: ticket.redeemedGate ?? undefined,
      };
    }

    // Atomic conditional update: ONLY transition if status is currently 'VALID'
    const now = new Date();
    const atomicUpdate = await tx.ticket.updateMany({
      where: {
        id: ticket.id,
        status: 'VALID',
      },
      data: {
        status: 'REDEEMED',
        redeemedAt: now,
        redeemedGate: params.gateName,
        redeemedByStaffId: params.staffUserId ?? null,
      },
    });

    if (atomicUpdate.count === 0) {
      // Another concurrent scanner just redeemed this ticket milliseconds ago!
      await tx.ticketRedemption.create({
        data: {
          ticketId: ticket.id,
          fixtureId: params.assignedFixtureId,
          gateName: params.gateName,
          staffUserId: params.staffUserId ?? null,
          staffName: params.staffName,
          scanOutcome: 'ALREADY_USED',
          wasOfflineSync: Boolean(params.wasOfflineSync),
        },
      });
      return {
        result: 'ALREADY_USED',
        message: 'Already used — concurrent scan detected and rejected.',
        ticketCode: ticket.ticketCode,
        holderName: ticket.holderName,
        categoryName: ticket.category.nameEn,
      };
    }

    await tx.ticketRedemption.create({
      data: {
        ticketId: ticket.id,
        fixtureId: params.assignedFixtureId,
        gateName: params.gateName,
        staffUserId: params.staffUserId ?? null,
        staffName: params.staffName,
        scanOutcome: 'VALID_ACCEPTED',
        wasOfflineSync: Boolean(params.wasOfflineSync),
      },
    });

    return {
      result: 'VALID_ACCEPTED',
      message: 'Valid — entry accepted',
      ticketCode: ticket.ticketCode,
      holderName: ticket.holderName,
      categoryName: ticket.category.nameEn,
      fixtureTitle,
      redeemedAt: now.toISOString(),
      redeemedGate: params.gateName,
    };
  }).then(async (res) => {
    // Award verified match attendance loyalty points if ticket had an ownerUserId and was accepted
    if (res.result === 'VALID_ACCEPTED' && res.ticketCode) {
      const tkt = await prisma.ticket.findUnique({ where: { ticketCode: res.ticketCode } });
      if (tkt?.ownerUserId) {
        await awardOrAdjustLoyaltyPoints({
          userId: tkt.ownerUserId,
          idempotencyKey: `attendance-${tkt.id}`,
          eventType: 'MATCH_ATTENDANCE_VERIFIED',
          pointsDelta: 50,
          reason: `Confirmed match attendance at gate (${res.ticketCode})`,
          sourceReferenceId: tkt.id,
        }).catch(() => null);
      }
    }
    return res;
  });
}

/**
 * Ticket Transfer Workflow
 * Rotates ticket code & cryptographic QR token so the previous screenshot/QR is immediately invalidated.
 */
export async function transferTicketCredential(params: {
  ticketCode: string;
  currentOwnerEmail: string;
  recipientName: string;
  recipientEmail: string;
  recipientPhone?: string;
}) {
  return prisma.$transaction(async (tx) => {
    const ticket = await tx.ticket.findUnique({
      where: { ticketCode: params.ticketCode },
      include: { order: true },
    });

    if (!ticket) {
      throw new Error('Ticket not found.');
    }
    if (ticket.status !== 'VALID') {
      throw new Error(`Only unused VALID tickets can be transferred (current status: ${ticket.status}).`);
    }
    if (ticket.order.buyerEmail.toLowerCase() !== params.currentOwnerEmail.toLowerCase().trim()) {
      throw new Error('Verification failed: current holder email does not match ticket order record.');
    }

    const previousCode = ticket.ticketCode;
    const newCode = generateTicketCode();
    const newNonce = crypto.randomBytes(8).toString('hex');
    const newSignedToken = signTicketPayload({
      v: 1,
      tkt: newCode,
      ord: ticket.orderId,
      fix: ticket.fixtureId,
      cat: ticket.categoryId,
      iat: Math.floor(Date.now() / 1000),
      nce: newNonce,
    });

    const recipientUser = await tx.user.findUnique({
      where: { email: params.recipientEmail.toLowerCase().trim() },
    });

    const updatedTicket = await tx.ticket.update({
      where: { id: ticket.id },
      data: {
        ticketCode: newCode,
        signedToken: newSignedToken,
        holderName: params.recipientName.trim(),
        ownerUserId: recipientUser?.id ?? null,
      },
    });

    const transferRecord = await tx.ticketTransfer.create({
      data: {
        ticketId: ticket.id,
        fromName: ticket.holderName,
        fromEmail: params.currentOwnerEmail.toLowerCase().trim(),
        toName: params.recipientName.trim(),
        toEmail: params.recipientEmail.toLowerCase().trim(),
        toPhone: params.recipientPhone?.trim() ?? null,
        previousTicketCode: previousCode,
        newTicketCode: newCode,
      },
    });

    await recordAuditLog({
      actorEmail: params.currentOwnerEmail,
      action: 'TICKET_TRANSFERRED_AND_ROTATED',
      targetType: 'Ticket',
      targetId: ticket.id,
      before: { ticketCode: previousCode, holderName: ticket.holderName },
      after: { ticketCode: newCode, holderName: params.recipientName.trim() },
      reason: 'Verified supporter ticket transfer',
    });

    return { updatedTicket, transferRecord };
  });
}
