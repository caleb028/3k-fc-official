import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdminPermission } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';

const updateCapacitySchema = z.object({
  categoryId: z.string().min(1),
  totalCapacity: z.number().int().min(1),
  priceKesCents: z.number().int().min(0),
  isActive: z.boolean(),
});

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdminPermission('tickets', 'update');
    const body = await req.json();
    const action = body.action;

    if (action === 'UPDATE_CATEGORY') {
      const parsed = updateCapacitySchema.safeParse(body.payload);
      if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid parameters', issues: parsed.error.flatten() }, { status: 400 });
      }

      const category = await prisma.ticketCategory.findUnique({
        where: { id: parsed.data.categoryId },
        include: { inventory: true, fixture: true },
      });
      if (!category) {
        return NextResponse.json({ error: 'Ticket category not found' }, { status: 404 });
      }

      const updatedCategory = await prisma.ticketCategory.update({
        where: { id: parsed.data.categoryId },
        data: {
          priceKesCents: parsed.data.priceKesCents,
          isActive: parsed.data.isActive,
        },
      });

      let updatedInventory = null;
      if (category.inventory) {
        updatedInventory = await prisma.ticketInventory.update({
          where: { categoryId: category.id },
          data: { totalCapacity: parsed.data.totalCapacity },
        });
      } else {
        updatedInventory = await prisma.ticketInventory.create({
          data: {
            categoryId: category.id,
            totalCapacity: parsed.data.totalCapacity,
          },
        });
      }

      await recordAuditLog({
        actorId: admin.id,
        actorEmail: admin.email,
        actorRole: admin.roles[0],
        action: 'TICKET_CAPACITY_UPDATED',
        targetType: 'TicketCategory',
        targetId: category.id,
        before: category,
        after: { ...updatedCategory, inventory: updatedInventory },
        reason: `Capacity set to ${parsed.data.totalCapacity}, price KES ${parsed.data.priceKesCents / 100} by ${admin.email}`,
      });

      return NextResponse.json({ success: true, category: updatedCategory, inventory: updatedInventory });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to update ticketing' },
      { status: 403 }
    );
  }
}
