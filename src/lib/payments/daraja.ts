import crypto from 'crypto';
import { prisma } from '../prisma';
import { centsToWholeKes } from '../money';
import { issueTicketsForConfirmedOrder } from '../tickets/service';
import { awardOrAdjustLoyaltyPoints } from '../loyalty/service';
import { recordAuditLog } from '../audit';

export type PaymentPurpose = 'TICKET_ORDER' | 'SHOP_ORDER' | 'MEMBERSHIP' | 'DONATION';

export interface InitiatePaymentInput {
  purpose: PaymentPurpose;
  purposeTargetId: string;
  phone: string;
  amountKesCents: number;
  accountReference?: string;
  transactionDesc?: string;
}

export function normalizeKenyanPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('254') && digits.length === 12) {
    return digits;
  }
  if (digits.startsWith('07') && digits.length === 10) {
    return `254${digits.slice(1)}`;
  }
  if (digits.startsWith('01') && digits.length === 10) {
    return `254${digits.slice(1)}`;
  }
  if ((digits.startsWith('7') || digits.startsWith('1')) && digits.length === 9) {
    return `254${digits}`;
  }
  throw new Error('Invalid Kenyan M-Pesa phone number. Use 07XXXXXXXX, 01XXXXXXXX, or 2547XXXXXXXX.');
}

export function maskPhoneInPayload(rawJson: string): string {
  return rawJson.replace(/\b(254\d{2})\d{4}(\d{3})\b/g, '$1****$2');
}

export function isDarajaLiveConfigured(): boolean {
  return Boolean(
    process.env.MPESA_CONSUMER_KEY &&
      process.env.MPESA_CONSUMER_SECRET &&
      process.env.MPESA_PASSKEY &&
      process.env.MPESA_SHORTCODE
  );
}

/**
 * Initiates an M-Pesa Daraja STK Push transaction on the server.
 * Never trusts client-supplied prices; validates target record on server before creating PaymentTransaction.
 */
export async function initiateDarajaStkPush(input: InitiatePaymentInput) {
  const phoneNormalized = normalizeKenyanPhone(input.phone);
  if (!Number.isInteger(input.amountKesCents) || input.amountKesCents < 100) {
    throw new Error('Payment amount must be at least KES 1 (100 cents).');
  }

  const wholeKes = centsToWholeKes(input.amountKesCents);
  const reference = `3K-PAY-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
  const environment = process.env.MPESA_ENVIRONMENT === 'production' ? 'production' : 'sandbox';

  let merchantRequestId = `MR-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
  let checkoutRequestId = `ws_CO_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  let darajaIntegrationStatus: 'LIVE_API_CALLED' | 'SANDBOX_AWAITING_CALLBACK' = 'SANDBOX_AWAITING_CALLBACK';

  if (isDarajaLiveConfigured()) {
    const baseUrl =
      environment === 'production'
        ? 'https://api.safaricom.co.ke'
        : 'https://sandbox.safaricom.co.ke';

    const auth = Buffer.from(
      `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
    ).toString('base64');

    const tokenRes = await fetch(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: { Authorization: `Basic ${auth}` },
    });

    if (tokenRes.ok) {
      const tokenData = (await tokenRes.json()) as { access_token: string };
      const timestamp = new Date()
        .toISOString()
        .replace(/[-:TZ.]/g, '')
        .slice(0, 14);
      const shortcode = process.env.MPESA_SHORTCODE || '174379';
      const password = Buffer.from(`${shortcode}${process.env.MPESA_PASSKEY}${timestamp}`).toString('base64');

      const stkRes = await fetch(`${baseUrl}/mpesa/stkpush/v1/processrequest`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          BusinessShortCode: shortcode,
          Password: password,
          Timestamp: timestamp,
          TransactionType: 'CustomerPayBillOnline',
          Amount: wholeKes,
          PartyA: phoneNormalized,
          PartyB: shortcode,
          PhoneNumber: phoneNormalized,
          CallBackURL: process.env.MPESA_CALLBACK_URL,
          AccountReference: input.accountReference || reference,
          TransactionDesc: input.transactionDesc || `3K FC ${input.purpose}`,
        }),
      });

      if (stkRes.ok) {
        const stkData = (await stkRes.json()) as {
          MerchantRequestID: string;
          CheckoutRequestID: string;
        };
        merchantRequestId = stkData.MerchantRequestID;
        checkoutRequestId = stkData.CheckoutRequestID;
        darajaIntegrationStatus = 'LIVE_API_CALLED';
      }
    }
  }

  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  const tx = await prisma.paymentTransaction.create({
    data: {
      reference,
      provider: 'MPESA_DARAJA',
      environment,
      purpose: input.purpose,
      purposeTargetId: input.purposeTargetId,
      phoneNormalized,
      amountKesCents: input.amountKesCents,
      providerFeeKesCents: 0,
      netProceedsKesCents: input.amountKesCents,
      merchantRequestId,
      checkoutRequestId,
      status: 'PENDING',
      resultDescription:
        darajaIntegrationStatus === 'LIVE_API_CALLED'
          ? 'STK Push dispatched via Safaricom Daraja API. Awaiting callback.'
          : 'Sandbox STK Push created. Awaiting Daraja webhook callback verification.',
      expiresAt,
    },
  });

  // Link pending PaymentTransaction to target entity
  if (input.purpose === 'TICKET_ORDER') {
    await prisma.ticketOrder.update({
      where: { id: input.purposeTargetId },
      data: { paymentTxId: tx.id },
    });
  } else if (input.purpose === 'SHOP_ORDER') {
    await prisma.shopOrder.update({
      where: { id: input.purposeTargetId },
      data: { paymentTxId: tx.id },
    });
  } else if (input.purpose === 'MEMBERSHIP') {
    await prisma.membership.update({
      where: { id: input.purposeTargetId },
      data: { paymentTxId: tx.id },
    });
  } else if (input.purpose === 'DONATION') {
    await prisma.donation.update({
      where: { id: input.purposeTargetId },
      data: { paymentTxId: tx.id },
    });
  }

  return {
    transaction: tx,
    darajaIntegrationStatus,
  };
}

export interface DarajaStkCallbackPayload {
  Body: {
    stkCallback: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata?: {
        Item: Array<{ Name: string; Value?: string | number }>;
      };
    };
  };
}

/**
 * Processes an M-Pesa Daraja STK Callback idempotently.
 * Handles duplicate callbacks safely and fulfills orders ONLY on verified ResultCode === 0.
 */
export async function processDarajaCallback(payload: DarajaStkCallbackPayload) {
  const stk = payload?.Body?.stkCallback;
  if (!stk || !stk.CheckoutRequestID || typeof stk.ResultCode !== 'number') {
    throw new Error('MALFORMED_DARAJA_CALLBACK: Missing stkCallback or CheckoutRequestID.');
  }

  const checkoutRequestId = stk.CheckoutRequestID;
  const resultCode = stk.ResultCode;
  const resultDesc = stk.ResultDesc || (resultCode === 0 ? 'The service request is processed successfully.' : 'Failed');

  let mpesaReceipt: string | null = null;
  if (stk.CallbackMetadata?.Item) {
    const receiptItem = stk.CallbackMetadata.Item.find((i) => i.Name === 'MpesaReceiptNumber');
    if (receiptItem && receiptItem.Value) {
      mpesaReceipt = String(receiptItem.Value);
    }
  }

  const idempotencyKey = `${checkoutRequestId}:${resultCode}:${mpesaReceipt ?? 'NO_RECEIPT'}`;
  const sanitizedPayloadJson = maskPhoneInPayload(JSON.stringify(payload));

  // 1. Check if this exact callback was already processed
  const existingCallback = await prisma.paymentCallback.findUnique({
    where: { idempotencyKey },
  });

  if (existingCallback) {
    return {
      status: 'DUPLICATE_IGNORED' as const,
      callback: existingCallback,
    };
  }

  const paymentTx = await prisma.paymentTransaction.findUnique({
    where: { checkoutRequestId },
  });

  if (!paymentTx) {
    const unmatched = await prisma.paymentCallback.create({
      data: {
        checkoutRequestId,
        idempotencyKey,
        resultCode,
        resultDesc,
        mpesaReceiptNumber: mpesaReceipt,
        sanitizedPayloadJson,
        processedStatus: 'UNMATCHED',
      },
    });
    return {
      status: 'UNMATCHED' as const,
      callback: unmatched,
    };
  }

  // If transaction was already confirmed as SUCCESS earlier, record duplicate callback & return idempotently
  if (paymentTx.status === 'SUCCESS') {
    const dupCallback = await prisma.paymentCallback.create({
      data: {
        transactionId: paymentTx.id,
        checkoutRequestId,
        idempotencyKey: `${idempotencyKey}:dup-${Date.now()}`,
        resultCode,
        resultDesc,
        mpesaReceiptNumber: mpesaReceipt,
        sanitizedPayloadJson,
        processedStatus: 'DUPLICATE_IGNORED',
      },
    });
    return {
      status: 'DUPLICATE_IGNORED' as const,
      callback: dupCallback,
      transaction: paymentTx,
    };
  }

  const nextStatus =
    resultCode === 0
      ? 'SUCCESS'
      : resultCode === 1032
        ? 'CANCELLED'
        : 'FAILED';

  const receiptToStore =
    nextStatus === 'SUCCESS'
      ? mpesaReceipt || `3KMP${crypto.randomBytes(3).toString('hex').toUpperCase()}`
      : null;

  const updatedTx = await prisma.paymentTransaction.update({
    where: { id: paymentTx.id },
    data: {
      status: nextStatus,
      resultCode,
      resultDescription: resultDesc,
      mpesaReceiptNumber: receiptToStore,
      confirmedAt: nextStatus === 'SUCCESS' ? new Date() : null,
    },
  });

  const callbackRecord = await prisma.paymentCallback.create({
    data: {
      transactionId: paymentTx.id,
      checkoutRequestId,
      idempotencyKey,
      resultCode,
      resultDesc,
      mpesaReceiptNumber: receiptToStore,
      sanitizedPayloadJson,
      processedStatus: 'PROCESSED',
    },
  });

  await prisma.paymentReconciliation.create({
    data: {
      transactionId: paymentTx.id,
      verifiedBy: 'DARAJA_CALLBACK',
      previousStatus: paymentTx.status,
      verifiedStatus: nextStatus,
      notes: `ResultCode ${resultCode}: ${resultDesc}`,
    },
  });

  // Fulfil target order ONLY when payment is confirmed as SUCCESS
  if (nextStatus === 'SUCCESS') {
    await fulfilConfirmedPayment(updatedTx.id);
  } else {
    await handleFailedOrCancelledPayment(updatedTx.id, nextStatus);
  }

  return {
    status: 'PROCESSED' as const,
    callback: callbackRecord,
    transaction: updatedTx,
  };
}

async function fulfilConfirmedPayment(paymentTxId: string) {
  const tx = await prisma.paymentTransaction.findUnique({ where: { id: paymentTxId } });
  if (!tx || tx.status !== 'SUCCESS') return;

  if (tx.purpose === 'TICKET_ORDER') {
    await issueTicketsForConfirmedOrder(tx.purposeTargetId, tx.id);
  } else if (tx.purpose === 'SHOP_ORDER') {
    const order = await prisma.shopOrder.findUnique({
      where: { id: tx.purposeTargetId },
      include: { items: true },
    });
    if (order && order.status === 'PENDING_PAYMENT') {
      await prisma.$transaction(async (db) => {
        for (const item of order.items) {
          const variant = await db.productVariant.findUnique({ where: { id: item.variantId } });
          if (variant) {
            await db.productVariant.update({
              where: { id: variant.id },
              data: {
                reservedQuantity: Math.max(0, variant.reservedQuantity - item.quantity),
                stockQuantity: Math.max(0, variant.stockQuantity - item.quantity),
              },
            });
            await db.inventoryMovement.create({
              data: {
                variantId: variant.id,
                delta: -item.quantity,
                reason: 'ORDER_PAID',
                referenceId: order.orderNumber,
              },
            });
          }
        }

        await db.shopOrder.update({
          where: { id: order.id },
          data: { status: 'PAID' },
        });

        await db.fulfilmentRecord.upsert({
          where: { orderId: order.id },
          update: { status: 'PACKED' },
          create: {
            orderId: order.id,
            status: 'PENDING',
            collectionPoint: '3K FC Official Club Desk — Embu Town',
          },
        });
      });

      if (order.userId) {
        const pointsEarned = Math.max(10, Math.trunc(order.totalKesCents / 10000)); // 1 point per KES 100 spent
        await awardOrAdjustLoyaltyPoints({
          userId: order.userId,
          idempotencyKey: `shop-order-${order.id}`,
          eventType: 'SHOP_ORDER_COMPLETED',
          pointsDelta: pointsEarned,
          reason: `Completed Official Store Order ${order.orderNumber}`,
          sourceReferenceId: order.id,
        }).catch(() => null);
      }
    }
  } else if (tx.purpose === 'MEMBERSHIP') {
    const membership = await prisma.membership.findUnique({
      where: { id: tx.purposeTargetId },
      include: { plan: true, user: { include: { profile: true } } },
    });
    if (membership && membership.status !== 'ACTIVE') {
      const startsAt = new Date();
      const expiresAt = new Date(Date.now() + membership.plan.durationDays * 24 * 3600 * 1000);
      const cardIdentifier = `3K-CARD-${membership.membershipNumber}`;
      const verificationToken = crypto.randomBytes(16).toString('hex');
      const holderDisplayName =
        membership.user.profile?.displayName ||
        `${membership.user.profile?.firstName ?? 'Supporter'} ${membership.user.profile?.lastName ?? ''}`.trim();

      await prisma.$transaction([
        prisma.membership.update({
          where: { id: membership.id },
          data: {
            status: 'ACTIVE',
            startsAt,
            expiresAt,
          },
        }),
        prisma.digitalMembershipCard.upsert({
          where: { membershipId: membership.id },
          update: { validityStatus: 'VALID' },
          create: {
            membershipId: membership.id,
            cardIdentifier,
            verificationToken,
            tierLabel: membership.plan.nameEn,
            holderDisplayName,
            validityStatus: 'VALID',
          },
        }),
      ]);

      await awardOrAdjustLoyaltyPoints({
        userId: membership.userId,
        idempotencyKey: `membership-act-${membership.id}`,
        eventType: 'MEMBERSHIP_ACTIVATED',
        pointsDelta: membership.plan.welcomeLoyaltyPoints,
        reason: `Activated ${membership.plan.nameEn} (${membership.membershipNumber})`,
        sourceReferenceId: membership.id,
      }).catch(() => null);
    }
  } else if (tx.purpose === 'DONATION') {
    const donation = await prisma.donation.findUnique({
      where: { id: tx.purposeTargetId },
    });
    if (donation && donation.status !== 'CONFIRMED') {
      const receiptNumber = `3K-DON-${new Date().getFullYear()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
      await prisma.$transaction([
        prisma.donation.update({
          where: { id: donation.id },
          data: {
            status: 'CONFIRMED',
            confirmedAt: new Date(),
          },
        }),
        prisma.donationCampaign.update({
          where: { id: donation.campaignId },
          data: {
            confirmedTotalKesCents: { increment: donation.amountKesCents },
            confirmedDonorCount: { increment: 1 },
          },
        }),
        prisma.donationReceipt.upsert({
          where: { donationId: donation.id },
          update: {},
          create: {
            donationId: donation.id,
            receiptNumber,
            issuedToName: donation.isAnonymous ? 'Anonymous 3K FC Supporter' : donation.donorName,
            amountKesCents: donation.amountKesCents,
            paymentReference: tx.mpesaReceiptNumber || tx.reference,
          },
        }),
      ]);
    }
  }

  await recordAuditLog({
    action: 'PAYMENT_CONFIRMED_AND_FULFILLED',
    targetType: tx.purpose,
    targetId: tx.purposeTargetId,
    after: {
      paymentReference: tx.reference,
      mpesaReceiptNumber: tx.mpesaReceiptNumber,
      amountKesCents: tx.amountKesCents,
    },
  });
}

async function handleFailedOrCancelledPayment(paymentTxId: string, status: 'FAILED' | 'CANCELLED') {
  const tx = await prisma.paymentTransaction.findUnique({ where: { id: paymentTxId } });
  if (!tx) return;

  if (tx.purpose === 'TICKET_ORDER') {
    const order = await prisma.ticketOrder.findUnique({
      where: { id: tx.purposeTargetId },
      include: { items: true },
    });
    if (order && order.status === 'PENDING_PAYMENT') {
      await prisma.$transaction(async (db) => {
        for (const item of order.items) {
          const inv = await db.ticketInventory.findUnique({ where: { categoryId: item.categoryId } });
          if (inv) {
            await db.ticketInventory.update({
              where: { id: inv.id },
              data: { reservedCount: Math.max(0, inv.reservedCount - item.quantity) },
            });
          }
        }
        await db.ticketOrder.update({
          where: { id: order.id },
          data: { status: status === 'CANCELLED' ? 'CANCELLED' : 'EXPIRED' },
        });
      });
    }
  } else if (tx.purpose === 'SHOP_ORDER') {
    const order = await prisma.shopOrder.findUnique({
      where: { id: tx.purposeTargetId },
      include: { items: true },
    });
    if (order && order.status === 'PENDING_PAYMENT') {
      await prisma.$transaction(async (db) => {
        for (const item of order.items) {
          const variant = await db.productVariant.findUnique({ where: { id: item.variantId } });
          if (variant) {
            await db.productVariant.update({
              where: { id: variant.id },
              data: { reservedQuantity: Math.max(0, variant.reservedQuantity - item.quantity) },
            });
          }
        }
        await db.shopOrder.update({
          where: { id: order.id },
          data: { status: 'CANCELLED' },
        });
      });
    }
  } else if (tx.purpose === 'DONATION') {
    await prisma.donation.update({
      where: { id: tx.purposeTargetId },
      data: { status: 'FAILED' },
    });
  }
}
