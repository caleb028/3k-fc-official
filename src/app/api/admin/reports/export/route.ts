import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminPermission } from '@/lib/auth';
import { centsToWholeKes } from '@/lib/money';

export async function GET(req: NextRequest) {
  try {
    await requireAdminPermission('reports', 'export');

    const reportType = req.nextUrl.searchParams.get('type') || 'payments';
    const format = req.nextUrl.searchParams.get('format') || 'csv';

    let records: Array<Record<string, unknown>> = [];

    if (reportType === 'payments') {
      const txs = await prisma.paymentTransaction.findMany({
        orderBy: { createdAt: 'desc' },
        take: 500,
      });
      records = txs.map((t) => ({
        Reference: t.reference,
        Provider: t.provider,
        Purpose: t.purpose,
        AmountKES: centsToWholeKes(t.amountKesCents),
        ProviderFeeKES: centsToWholeKes(t.providerFeeKesCents),
        NetProceedsKES: centsToWholeKes(t.netProceedsKesCents),
        Status: t.status,
        MpesaReceipt: t.mpesaReceiptNumber || 'N/A',
        ConfirmedAt: t.confirmedAt ? t.confirmedAt.toISOString() : 'N/A',
        CreatedAt: t.createdAt.toISOString(),
      }));
    } else if (reportType === 'tickets') {
      const tickets = await prisma.ticket.findMany({
        orderBy: { issuedAt: 'desc' },
        include: {
          category: true,
          fixture: { include: { homeClub: true, awayClub: true } },
        },
        take: 500,
      });
      records = tickets.map((tk) => ({
        TicketCode: tk.ticketCode,
        Fixture: `${tk.fixture.homeClub.name} vs ${tk.fixture.awayClub.name}`,
        Category: tk.category.nameEn,
        PriceKES: centsToWholeKes(tk.category.priceKesCents),
        Status: tk.status,
        IssuedAt: tk.issuedAt.toISOString(),
        RedeemedAt: tk.redeemedAt ? tk.redeemedAt.toISOString() : 'N/A',
        RedeemedGate: tk.redeemedGate || 'N/A',
      }));
    } else if (reportType === 'donations') {
      const donations = await prisma.donation.findMany({
        orderBy: { createdAt: 'desc' },
        include: { campaign: true, receipt: true },
        take: 500,
      });
      records = donations.map((d) => ({
        DonationId: d.id,
        Campaign: d.campaign.titleEn,
        DonorName: d.isAnonymous ? 'Anonymous' : d.donorName,
        AmountKES: centsToWholeKes(d.amountKesCents),
        Status: d.status,
        ReceiptNumber: d.receipt?.receiptNumber || 'N/A',
        ConfirmedAt: d.confirmedAt ? d.confirmedAt.toISOString() : 'N/A',
      }));
    } else if (reportType === 'merchandise') {
      const orders = await prisma.shopOrder.findMany({
        orderBy: { createdAt: 'desc' },
        include: { deliveryOption: true },
        take: 500,
      });
      records = orders.map((o) => ({
        OrderNumber: o.orderNumber,
        SubtotalKES: centsToWholeKes(o.subtotalKesCents),
        DeliveryFeeKES: centsToWholeKes(o.deliveryFeeKesCents),
        TotalKES: centsToWholeKes(o.totalKesCents),
        DeliveryMethod: o.deliveryOption.nameEn,
        Status: o.status,
        CreatedAt: o.createdAt.toISOString(),
      }));
    }

    if (format === 'json') {
      return NextResponse.json({ reportType, count: records.length, records });
    }

    // Convert records to CSV format
    if (records.length === 0) {
      return new NextResponse('No records found for this period.', {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${reportType}-empty.csv"`,
        },
      });
    }

    const headers = Object.keys(records[0]);
    const csvRows = [
      headers.join(','),
      ...records.map((row) =>
        headers
          .map((h) => {
            const val = String(row[h] ?? '').replace(/"/g, '""');
            return `"${val}"`;
          })
          .join(',')
      ),
    ];

    return new NextResponse(csvRows.join('\r\n'), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="3KFC-${reportType}-${Date.now()}.csv"`,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Report export failed' },
      { status: 403 }
    );
  }
}
