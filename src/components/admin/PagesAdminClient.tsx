'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { FileText, CheckCircle2, AlertCircle, Edit, ExternalLink } from 'lucide-react';

interface PageItem {
  id: string;
  slug: string;
  status: string;
  updatedAt: string;
  translations: Array<{
    locale: string;
    title: string;
    summary: string | null;
    body: string;
    seoTitle: string | null;
    seoDescription: string | null;
  }>;
}

export function PagesAdminClient({ initialPages }: { initialPages: PageItem[] }) {
  const [selectedPage, setSelectedPage] = useState<PageItem | null>(null);
  const [titleEn, setTitleEn] = useState('');
  const [titleSw, setTitleSw] = useState('');
  const [bodyEn, setBodyEn] = useState('');
  const [bodySw, setBodySw] = useState('');
  const [status, setStatus] = useState('PUBLISHED');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; success: boolean } | null>(null);

  const startEdit = (p: PageItem) => {
    setSelectedPage(p);
    const en = p.translations.find((t) => t.locale === 'en');
    const sw = p.translations.find((t) => t.locale === 'sw');
    setTitleEn(en?.title || p.slug);
    setTitleSw(sw?.title || '');
    setBodyEn(en?.body || '');
    setBodySw(sw?.body || '');
    setStatus(p.status);
    setMessage(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPage) return;
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: selectedPage.slug,
          status,
          translations: [
            {
              locale: 'en',
              title: titleEn,
              body: bodyEn,
            },
            {
              locale: 'sw',
              title: titleSw || titleEn,
              body: bodySw || bodyEn,
            },
          ],
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save page.');

      setMessage({ text: 'Page updated successfully.', success: true });
      setSelectedPage(null);
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

      {selectedPage && (
        <div className="bg-[#121722] p-6 rounded-2xl border border-club-primary/40 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <h2 className="text-base font-bold text-white">Edit Page: /{selectedPage.slug}</h2>
            <button onClick={() => setSelectedPage(null)} className="text-slate-400 hover:text-white text-xs">
              Close
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-slate-400 block mb-1">Title (English)</label>
                <input
                  type="text"
                  required
                  value={titleEn}
                  onChange={(e) => setTitleEn(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Title (Kiswahili)</label>
                <input
                  type="text"
                  value={titleSw}
                  onChange={(e) => setTitleSw(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-slate-400 block mb-1">Content Body (English Markdown)</label>
                <textarea
                  rows={8}
                  required
                  value={bodyEn}
                  onChange={(e) => setBodyEn(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white font-mono resize-none"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Content Body (Kiswahili Markdown)</label>
                <textarea
                  rows={8}
                  value={bodySw}
                  onChange={(e) => setBodySw(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white font-mono resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedPage(null)}
                className="px-4 py-2 bg-white/10 text-white rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 bg-club-primary hover:bg-club-dark text-white font-bold rounded-xl text-xs"
              >
                {loading ? 'Saving...' : 'Save Page Content'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Pages Table */}
      <div className="bg-[#121722] rounded-2xl border border-white/10 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-black/30 text-slate-400 uppercase font-mono border-b border-white/5">
              <tr>
                <th className="py-3 px-4">Page Route</th>
                <th className="py-3 px-4">Title</th>
                <th className="py-3 px-3 text-center">Locales</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4">Last Updated</th>
                <th className="py-3 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {initialPages.map((p) => {
                const en = p.translations.find((t) => t.locale === 'en');
                return (
                  <tr key={p.id} className="hover:bg-white/5">
                    <td className="py-3 px-4 font-mono font-bold text-white">/{p.slug}</td>
                    <td className="py-3 px-4 text-white font-medium">{en?.title || p.slug}</td>
                    <td className="py-3 px-3 text-center font-mono text-club-accent">
                      {p.translations.map((t) => t.locale.toUpperCase()).join(', ')}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300">
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      {new Date(p.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => startEdit(p)}
                        className="p-1.5 bg-white/5 hover:bg-white/10 rounded text-slate-300 hover:text-white transition"
                        title="Edit page content"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
