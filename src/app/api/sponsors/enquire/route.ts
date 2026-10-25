import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/auth';

const enquirySchema = z.object({
  organisation: z.string().min(2).max(120),
  contactPerson: z.string().min(2).max(120),
  businessEmail: z.string().email(),
  phone: z.string().min(7).max(20),
  partnershipInterest: z.string().min(2),
  budgetRange: z.string().optional(),
  message: z.string().min(10).max(2000),
  consentGranted: z.boolean().refine((v) => v === true, {
    message: 'Consent is required to submit a partnership enquiry.',
  }),
});

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    if (!checkRateLimit(`sponsor-enquiry:${ip}`, 5, 60_000)) {
      return NextResponse.json(
        { error: 'Too many partnership enquiries submitted. Please wait a minute.' },
        { status: 429 }
      );
    }

    const raw = await req.json();
    const parsed = enquirySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Please complete all required partnership enquiry fields and consent.' },
        { status: 400 }
      );
    }

    const created = await prisma.sponsorEnquiry.create({
      data: {
        organisation: parsed.data.organisation.trim(),
        contactPerson: parsed.data.contactPerson.trim(),
        businessEmail: parsed.data.businessEmail.toLowerCase().trim(),
        phone: parsed.data.phone.trim(),
        partnershipInterest: parsed.data.partnershipInterest,
        budgetRange: parsed.data.budgetRange?.trim() || null,
        message: parsed.data.message.trim(),
        consentGranted: true,
        status: 'NEW',
      },
    });

    return NextResponse.json({
      success: true,
      message:
        'Thank you. Your partnership enquiry has been recorded for the 3K FC Commercial Directorate in Embu.',
      enquiryId: created.id,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unable to submit enquiry.' },
      { status: 400 }
    );
  }
}
