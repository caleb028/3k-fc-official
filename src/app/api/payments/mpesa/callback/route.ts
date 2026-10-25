import { NextRequest, NextResponse } from 'next/server';
import { processDarajaCallback, DarajaStkCallbackPayload } from '@/lib/payments/daraja';

/**
 * Safaricom M-Pesa Daraja STK Callback Webhook Endpoint
 * Section 11:
 * - Receive payment callbacks through an HTTPS endpoint.
 * - Validate callback structure and correlate it to the pending transaction.
 * - Ensure callback processing is idempotent.
 * - Fulfil orders only after confirmed payment.
 */
export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as DarajaStkCallbackPayload;
    const outcome = await processDarajaCallback(payload);

    return NextResponse.json({
      ResultCode: 0,
      ResultDesc: 'Accepted',
      processingStatus: outcome.status,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ResultCode: 1,
        ResultDesc: err instanceof Error ? err.message : 'Invalid callback payload',
      },
      { status: 400 }
    );
  }
}
