'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Ticket,
  CreditCard,
  ShoppingBag,
  Award,
  Bell,
  HeartHandshake,
  LogOut,
  User,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { formatKes } from '@/lib/money';

interface AccountData {
  user: {
    id: string;
    email: string;
    phone: string | null;
    profile: {
      firstName: string;
      lastName: string;
      displayName: string | null;
      county: string | null;
      supporterNumber: string | null;
      preferredLanguage: string;
    } | null;
  };
  tickets: Array<{
    id: string;
    ticketCode: string;
    signedToken: string;
    holderName: string;
    categoryName: string;
    fixtureTitle: string;
    kickoffAt: string;
    status: string;
    qrDataUrl: string;
  }>;
  memberships: Array<{
    id: string;
    membershipNumber: string;
    planName: string;
    status: string;
    expiresAt: string | null;
    card: {
      cardIdentifier: string;
      tierLabel: string;
      validityStatus: string;
    } | null;
  }>;
  shopOrders: Array<{
    id: string;
    orderNumber: string;
    totalKesCents: number;
    status: string;
    createdAt: string;
    deliveryName: string;
    fulfilmentStatus?: string;
  }>;
  loyalty: {
    balancePoints: number;
    lifetimePointsEarned: number;
    ledger: Array<{
      id: string;
      eventType: string;
      pointsDelta: number;
      balanceAfter: number;
      reason: string;
      createdAt: string;
    }>;
  } | null;
  notificationPreferences: Array<{
    channel: string;
    category: string;
    enabled: boolean;
  }>;
  donations: Array<{
    id: string;
    amountKesCents: number;
    status: string;
    receiptNumber?: string | null;
    createdAt: string;
  }>;
}

export function FanAccountClient({ data }: { data: AccountData }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    'tickets' | 'memberships' | 'orders' | 'loyalty' | 'notifications' | 'donations'
  >('tickets');

  const [prefs, setPrefs] = useState(data.notificationPreferences);
  const [prefLoading, setPrefLoading] = useState(false);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  const togglePref = async (channel: string, category: string, current: boolean) => {
    setPrefLoading(true);
    try {
      const res = await fetch('/api/auth/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel, category, enabled: !current }),
      });
      if (res.ok) {
        setPrefs((prev) =>
          prev.map((p) =>
            p.channel === channel && p.category === category
              ? { ...p, enabled: !current }
              : p
          )
        );
      }
    } catch {
      // ignore
    } finally {
      setPrefLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Profile Overview Card */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-[#18111D] to-club-primaryDark text-white p-6 md:p-8 border border-white/10 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-club-primary flex items-center justify-center font-display font-black text-2xl text-white border-2 border-club-accent shadow">
            {data.user.profile?.firstName?.[0] || '3K'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="editorial-headline font-black text-2xl text-white">
                {data.user.profile?.displayName || 'Supporter Profile'}
              </h1>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-club-accent/20 text-club-accent border border-club-accent/40 font-mono">
                {data.user.profile?.supporterNumber || '3K-SUP'}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              {data.user.email} • {data.user.phone || 'Phone not set'} • County: {data.user.profile?.county || 'Embu'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-black/40 rounded-xl px-4 py-2 border border-white/10 text-right">
            <span className="text-[10px] uppercase text-slate-400 block font-bold">
              Loyalty Points
            </span>
            <span className="font-mono font-black text-xl text-club-accent">
              {data.loyalty?.balancePoints ?? 0} PTS
            </span>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold uppercase tracking-wider text-white transition border border-white/15"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-300 pb-3">
        {[
          { id: 'tickets', label: 'Match Tickets', icon: Ticket, count: data.tickets.length },
          { id: 'memberships', label: 'Digital Card', icon: CreditCard, count: data.memberships.length },
          { id: 'orders', label: 'Store Orders', icon: ShoppingBag, count: data.shopOrders.length },
          { id: 'loyalty', label: 'Points Ledger', icon: Award, count: data.loyalty?.ledger.length },
          { id: 'notifications', label: 'Notifications', icon: Bell },
          { id: 'donations', label: 'Donation Receipts', icon: HeartHandshake, count: data.donations.length },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
                active
                  ? 'bg-club-primary text-white shadow'
                  : 'bg-white text-slate-700 border border-slate-300 hover:border-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    active ? 'bg-black/30 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: MATCH TICKETS */}
      {activeTab === 'tickets' && (
        <div className="space-y-6">
          {data.tickets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.tickets.map((tkt) => (
                <div
                  key={tkt.id}
                  className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm flex flex-col justify-between space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-club-primary">
                        {tkt.categoryName}
                      </span>
                      <h3 className="font-display font-bold text-base text-slate-900 mt-0.5">
                        {tkt.fixtureTitle}
                      </h3>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-extrabold font-mono uppercase ${
                        tkt.status === 'VALID'
                          ? 'bg-emerald-100 text-emerald-800'
                          : tkt.status === 'REDEEMED'
                            ? 'bg-slate-100 text-slate-700'
                            : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {tkt.status}
                    </span>
                  </div>

                  <div className="flex flex-col items-center justify-center py-2 bg-slate-50 rounded-xl border border-slate-200">
                    {tkt.qrDataUrl ? (
                      <img
                        src={tkt.qrDataUrl}
                        alt={`QR Code ${tkt.ticketCode}`}
                        className="w-44 h-44 border border-slate-300 rounded-lg p-1 bg-white"
                      />
                    ) : (
                      <div className="w-44 h-44 bg-slate-200 flex items-center justify-center text-xs text-slate-500">
                        Generating QR...
                      </div>
                    )}
                    <span className="font-mono font-black text-sm text-slate-900 mt-2">
                      {tkt.ticketCode}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Holder: {tkt.holderName}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500 flex items-center justify-between pt-2 border-t border-slate-100">
                    <span>Kick-off: {new Date(tkt.kickoffAt).toLocaleDateString('en-KE')}</span>
                    <Link
                      href="/tickets"
                      className="font-bold text-club-primary hover:underline"
                    >
                      Transfer Ticket →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl bg-white border border-slate-200 p-12 text-center text-slate-600">
              <Ticket className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <h3 className="font-display font-bold text-lg text-slate-900">
                No tickets purchased yet
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Your purchased 3K FC matchday QR tickets will appear here with scannable gate passes.
              </p>
              <Link
                href="/tickets"
                className="mt-4 inline-block px-5 py-2.5 rounded-lg bg-club-primary text-white text-xs font-bold uppercase tracking-wider"
              >
                Buy Match Tickets
              </Link>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DIGITAL MEMBERSHIP CARD */}
      {activeTab === 'memberships' && (
        <div className="space-y-6 max-w-2xl">
          {data.memberships.length > 0 ? (
            data.memberships.map((m) => (
              <div
                key={m.id}
                className="rounded-2xl bg-gradient-to-br from-club-primary via-club-primaryDark to-black text-white p-8 border-2 border-club-accent shadow-2xl space-y-6"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold uppercase tracking-widest text-club-accent">
                    3K FC Official Digital Membership Card
                  </span>
                  <span className="px-3 py-1 rounded bg-emerald-500 text-black font-extrabold text-xs">
                    {m.status}
                  </span>
                </div>

                <div>
                  <div className="text-xs text-slate-300">{m.planName}</div>
                  <h2 className="font-display font-black text-3xl text-white mt-1">
                    {data.user.profile?.displayName || 'Supporter'}
                  </h2>
                </div>

                <div className="pt-4 border-t border-white/20 flex flex-wrap items-center justify-between text-xs font-mono text-amber-300 gap-2">
                  <span>Number: {m.membershipNumber}</span>
                  <span>
                    Valid Until:{' '}
                    {m.expiresAt ? new Date(m.expiresAt).toLocaleDateString('en-KE') : 'Seasonal'}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl bg-white border border-slate-200 p-12 text-center text-slate-600">
              <CreditCard className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <h3 className="font-display font-bold text-lg text-slate-900">
                No active membership plan
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Activate your membership to receive an official digital card and store discounts.
              </p>
              <Link
                href="/supporters"
                className="mt-4 inline-block px-5 py-2.5 rounded-lg bg-club-primary text-white text-xs font-bold uppercase tracking-wider"
              >
                Explore Membership Plans
              </Link>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: STORE ORDERS */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {data.shopOrders.length > 0 ? (
            data.shopOrders.map((ord) => (
              <div
                key={ord.id}
                className="rounded-xl bg-white border border-slate-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      {ord.orderNumber}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-xs font-bold uppercase">
                      {ord.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Ordered: {new Date(ord.createdAt).toLocaleDateString('en-KE')} • {ord.deliveryName}
                  </p>
                  {ord.fulfilmentStatus && (
                    <p className="text-xs text-emerald-700 font-semibold mt-0.5">
                      Fulfilment: {ord.fulfilmentStatus}
                    </p>
                  )}
                </div>

                <div className="text-right">
                  <span className="font-mono font-black text-lg text-club-primary">
                    {formatKes(ord.totalKesCents)}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl bg-white border border-slate-200 p-12 text-center text-slate-600">
              <ShoppingBag className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-800">No store orders placed yet.</p>
              <Link
                href="/shop"
                className="mt-4 inline-block px-5 py-2.5 rounded-lg bg-club-primary text-white text-xs font-bold uppercase tracking-wider"
              >
                Shop 3K FC Merchandise
              </Link>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: LOYALTY LEDGER */}
      {activeTab === 'loyalty' && (
        <div className="space-y-6">
          <div className="rounded-xl bg-slate-900 text-white p-6 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 uppercase font-bold">Current Point Balance</span>
              <div className="font-mono font-black text-3xl text-club-accent mt-1">
                {data.loyalty?.balancePoints ?? 0} Points
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 uppercase font-bold">Lifetime Earned</span>
              <div className="font-mono font-bold text-xl text-white mt-1">
                {data.loyalty?.lifetimePointsEarned ?? 0} PTS
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-700">
              Immutable Points Ledger
            </div>
            {data.loyalty?.ledger && data.loyalty.ledger.length > 0 ? (
              <ul className="divide-y divide-slate-100 text-xs">
                {data.loyalty.ledger.map((entry) => (
                  <li key={entry.id} className="p-4 flex items-center justify-between">
                    <div>
                      <strong className="text-slate-900 text-sm block">{entry.reason}</strong>
                      <span className="text-slate-500">
                        {new Date(entry.createdAt).toLocaleString('en-KE')} • {entry.eventType}
                      </span>
                    </div>
                    <div className="text-right">
                      <span
                        className={`font-mono font-extrabold text-sm ${
                          entry.pointsDelta > 0 ? 'text-emerald-600' : 'text-red-600'
                        }`}
                      >
                        {entry.pointsDelta > 0 ? `+${entry.pointsDelta}` : entry.pointsDelta}
                      </span>
                      <span className="block text-slate-400 font-mono text-[11px]">
                        Bal: {entry.balanceAfter}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="p-8 text-center text-xs text-slate-500">
                No ledger transactions recorded yet. Earn points on match attendance and store orders!
              </p>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: NOTIFICATIONS */}
      {activeTab === 'notifications' && (
        <div className="rounded-2xl bg-white border border-slate-200 p-6 md:p-8 space-y-6">
          <div>
            <h3 className="editorial-headline font-bold text-xl text-slate-900">
              Notification Channels &amp; Consent Preferences
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              Choose which channels (Web Push, Email, SMS, WhatsApp) you prefer for match alerts and official club announcements.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { channel: 'WEB_PUSH', category: 'MATCH_UPDATES', label: 'Web Push — Kick-off & Goal Alerts' },
              { channel: 'EMAIL', category: 'TICKETS_AND_ORDERS', label: 'Email — Ticket Receipts & Order Tracking' },
              { channel: 'SMS', category: 'MATCH_UPDATES', label: 'SMS — Matchday Reminders (Kenya Safaricom)' },
              { channel: 'WHATSAPP', category: 'CLUB_NEWS', label: 'WhatsApp — Official Announcements' },
            ].map((item) => {
              const current =
                prefs.find((p) => p.channel === item.channel && p.category === item.category)
                  ?.enabled ?? true;
              return (
                <div
                  key={`${item.channel}-${item.category}`}
                  className="p-4 rounded-xl border border-slate-200 flex items-center justify-between"
                >
                  <div>
                    <span className="font-bold text-sm text-slate-900 block">{item.label}</span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      Channel: {item.channel} • Category: {item.category}
                    </span>
                  </div>
                  <button
                    type="button"
                    disabled={prefLoading}
                    onClick={() => togglePref(item.channel, item.category, current)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition ${
                      current ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {current ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 6: DONATION RECEIPTS */}
      {activeTab === 'donations' && (
        <div className="space-y-4">
          {data.donations.length > 0 ? (
            data.donations.map((don) => (
              <div
                key={don.id}
                className="rounded-xl bg-white border border-slate-200 p-5 flex items-center justify-between"
              >
                <div>
                  <span className="text-xs text-slate-500 block">
                    {new Date(don.createdAt).toLocaleDateString('en-KE')}
                  </span>
                  <span className="font-mono font-bold text-slate-900">
                    Receipt: {don.receiptNumber || 'Pending Confirmation'}
                  </span>
                </div>
                <span className="font-mono font-black text-emerald-700 text-base">
                  {formatKes(don.amountKesCents)}
                </span>
              </div>
            ))
          ) : (
            <div className="rounded-2xl bg-white border border-slate-200 p-12 text-center text-slate-600">
              <HeartHandshake className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-800">No donation receipts found.</p>
              <Link
                href="/support-3k"
                className="mt-4 inline-block px-5 py-2.5 rounded-lg bg-club-primary text-white text-xs font-bold uppercase tracking-wider"
              >
                Support 3K FC
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
