import React from 'react';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireAdminPermission } from '@/lib/auth';
import { NotificationsAdminClient } from '@/components/admin/NotificationsAdminClient';

export const dynamic = 'force-dynamic';

export default async function AdminNotificationsPage() {
  try {
    await requireAdminPermission('notifications', 'read');
  } catch {
    redirect('/admin/dashboard');
  }

  const notifications = await prisma.notification.findMany({
    orderBy: { createdAt: 'desc' },
    take: 30,
    include: {
      deliveries: true,
    },
  });

  const formatted = notifications.map((n) => ({
    id: n.id,
    category: n.category,
    titleEn: n.titleEn,
    bodyEn: n.bodyEn,
    actionUrl: n.actionUrl,
    createdAt: n.createdAt.toISOString(),
    deliveries: n.deliveries.map((d) => ({
      channel: d.channel,
      status: d.status,
    })),
  }));

  return (
    <div className="space-y-6">
      <div className="border-b border-white/10 pb-4">
        <h1 className="editorial-headline font-black text-2xl text-white">
          Notifications &amp; Multi-Channel Alerts
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Broadcast matchday reminders, live score alerts, and breaking announcements across Web Push, Email, SMS, and WhatsApp.
        </p>
      </div>

      <NotificationsAdminClient initialNotifications={formatted} />
    </div>
  );
}
