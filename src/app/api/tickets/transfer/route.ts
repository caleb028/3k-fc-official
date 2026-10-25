import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { transferTicketCredential } from '@/lib/tickets/service';
import { checkRateLimit } from '@/lib/auth';

const transferSchema = z.object({
  ticketCode: z.string().min(6),
  currentOwnerEmail: z.string().email(),
  recipientName: z.string().min(2).max(120),
  recipientEmail: z.string().email(),
  recipientPhone: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    if (!checkRateLimit(`ticket-transfer:${ip}`, 6, 60_000)) {
      return NextResponse.json(
        { error: 'Too many transfer attempts. Please try again shortly.' },
        { status: 429 }
      );
    }

    const raw = await req.json();
    const parsed = transferSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid transfer details.' }, { status: 400 });
    }

    const result = await transferTicketCredential(parsed.data);

    return NextResponse.json({
      success: true,
      message: 'Ticket transferred successfully. Previous QR credential has been invalidated and rotated.',
      newTicketCode: result.updatedTicket.ticketCode,
      newSignedToken: result.updatedTicket.signedToken,
      holderName: result.updatedTicket.holderName,
      transferRecord: result.transferRecord,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Ticket transfer failed.' },
      { status: 400 }
    );
  }
}
