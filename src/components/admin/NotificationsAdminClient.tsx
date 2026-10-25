'use client';

import React, { useState } from 'react';
import { Bell, Send, CheckCircle2, AlertCircle, Radio, Mail, MessageSquare, Phone } from 'lucide-react';

interface NotifItem {
  id: string;
  category: string;
  titleEn: string;
  bodyEn: string;
  actionUrl: string | null;
  createdAt: string;
  deliveries: Array<{ channel: string; status: string }>;
}

export function NotificationsAdminClient({ initialNotifications }: { initialNotifications: NotifItem[] }) {
  const [category, setCategory] = useState<string>('CLUB_ANNOUNCEMENT');
  const [titleEn, setTitleEn] = useState<string>('');
  const [titleSw, setTitleSw] = useState<string>('');
  const [bodyEn, setBodyEn] = useState<string>('');
  const [bodySw, setBodySw] = useState<string>('');
  const [actionUrl, setActionUrl] = useState<string>('/news');
  const [channels, setChannels] = useState<string[]>(['WEB_PUSH', 'EMAIL']);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; success: boolean } | null>(null);

  const toggleChannel = (ch: string) => {
    if (channels.includes(ch)) {
      if (channels.length === 1) return; // Keep at least one
      setChannels(channels.filter((c) => c !== ch));
    } else {
      setChannels([...channels, ch]);
    }
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleEn || !bodyEn) return;
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          titleEn,
          titleSw: titleSw || null,
          bodyEn,
          bodySw: bodySw || null,
          actionUrl: actionUrl || null,
          channels,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Broadcast failed.');

      setMessage({ text: 'Broadcast queued successfully across selected fan channels.', success: true });
      setTitleEn('');
      setTitleSw('');
      setBodyEn('');
      setBodySw('');
    } catch (err: any) {
      setMessage({ text: err.message, success: false });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 text-sm font-semibold ${
            message.success
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
          }`}
        >
          {message.success ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Broadcast Form */}
        <div className="bg-[#121722] p-6 rounded-2xl border border-white/10 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-white/10">
            <Bell className="w-5 h-5 text-club-accent animate-bounce" />
            <h2 className="text-base font-bold text-white">Broadcast Fan Announcement</h2>
          </div>

          <form onSubmit={handleBroadcast} className="space-y-4 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Broadcast Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white"
              >
                <option value="CLUB_ANNOUNCEMENT">CLUB_ANNOUNCEMENT</option>
                <option value="FIXTURE_REMINDER">FIXTURE_REMINDER</option>
                <option value="KICKOFF_ALERT">KICKOFF_ALERT</option>
                <option value="GOAL_RESULT">GOAL_RESULT</option>
                <option value="TICKET_CONFIRMATION">TICKET_CONFIRMATION</option>
                <option value="MEMBERSHIP_RENEWAL">MEMBERSHIP_RENEWAL</option>
                <option value="ORDER_STATUS">ORDER_STATUS</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Target Dispatch Channels</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'WEB_PUSH', label: 'Web Push', icon: Radio },
                  { id: 'EMAIL', label: 'Email', icon: Mail },
                  { id: 'SMS', label: 'SMS', icon: Phone },
                  { id: 'WHATSAPP', label: 'WhatsApp', icon: MessageSquare },
                ].map((item) => {
                  const Icon = item.icon;
                  const selected = channels.includes(item.id);
                  return (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => toggleChannel(item.id)}
                      className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition ${
                        selected
                          ? 'bg-club-primary/20 border-club-primary text-white font-bold'
                          : 'bg-black/30 border-white/5 text-slate-400 hover:bg-white/5'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-[11px]">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Title (English)</label>
              <input
                type="text"
                required
                placeholder="e.g. Next Match: 3K FC vs Shabana FC at Moi Stadium"
                value={titleEn}
                onChange={(e) => setTitleEn(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Title (Kiswahili — Optional)</label>
              <input
                type="text"
                placeholder="e.g. Mechi Ijayo: 3K FC dhidi ya Shabana FC Uwanja wa Moi"
                value={titleSw}
                onChange={(e) => setTitleSw(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Message Body (English)</label>
              <textarea
                rows={3}
                required
                placeholder="Enter announcement text for supporters..."
                value={bodyEn}
                onChange={(e) => setBodyEn(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white resize-none"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Action URL</label>
              <input
                type="text"
                placeholder="e.g. /tickets or /news/match-preview"
                value={actionUrl}
                onChange={(e) => setActionUrl(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{loading ? 'Queuing Broadcast...' : 'Queue Multi-Channel Broadcast'}</span>
            </button>
          </form>
        </div>

        {/* History of Dispatches */}
        <div className="bg-[#121722] p-6 rounded-2xl border border-white/10 space-y-4">
          <h2 className="text-base font-bold text-white pb-3 border-b border-white/10">
            Recent Broadcast Dispatches ({initialNotifications.length})
          </h2>

          <div className="space-y-3 max-h-[550px] overflow-y-auto">
            {initialNotifications.map((n) => (
              <div key={n.id} className="p-4 bg-black/30 rounded-xl border border-white/5 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase bg-club-primary/20 text-club-accent px-2 py-0.5 rounded">
                    {n.category}
                  </span>
                  <span className="text-[11px] text-slate-500">{new Date(n.createdAt).toLocaleString()}</span>
                </div>
                <h3 className="font-bold text-white text-sm">{n.titleEn}</h3>
                <p className="text-slate-300">{n.bodyEn}</p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {n.deliveries.map((d, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] bg-white/5 border border-white/10 rounded px-1.5 py-0.5 text-slate-400 font-mono"
                    >
                      {d.channel}: {d.status}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
