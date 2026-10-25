'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Newspaper,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Sparkles,
  Image as ImageIcon,
  Star,
} from 'lucide-react';

interface CategoryOption {
  id: string;
  nameEn: string;
  nameSw: string;
  slug: string;
}

interface ArticleRecord {
  id: string;
  slug: string;
  categoryId: string;
  authorName: string;
  status: string;
  isFeatured: boolean;
  heroOrder: number;
  viewCount: number;
  featuredImageUrl: string | null;
  publishedAt: string | null;
  category: { nameEn: string; slug: string };
  translations: Array<{
    locale: string;
    headline: string;
    summary: string;
  }>;
}

const STOCK_CLUB_PHOTOS = [
  { label: 'Team Celebration', url: '/images/3k-fc-team-celebration.png' },
  { label: 'Competitive Match Action', url: '/images/3k-fc-match-action.jpg' },
  { label: 'Supporters in Stands', url: '/images/3k-fc-fan-celebration.jpg' },
  { label: 'Player on Moi Stadium Pitch', url: '/images/3k-fc-player-pitch.jpg' },
  { label: 'Home Red Jersey', url: '/images/3k-fc-jersey-home-red.png' },
  { label: 'Away Black Jersey', url: '/images/3k-fc-jersey-away-black.png' },
  { label: 'Third Blue Jersey', url: '/images/3k-fc-jersey-third-blue.png' },
];

export function NewsAdminClient({
  initialArticles,
  categories,
}: {
  initialArticles: ArticleRecord[];
  categories: CategoryOption[];
}) {
  const [articles, setArticles] = useState<ArticleRecord[]>(initialArticles);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; success: boolean } | null>(null);

  // Form State
  const [headlineEn, setHeadlineEn] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [authorName, setAuthorName] = useState('3K FC Media Desk');
  const [summaryEn, setSummaryEn] = useState('');
  const [bodyEn, setBodyEn] = useState('');
  const [featuredImageUrl, setFeaturedImageUrl] = useState('/images/3k-fc-team-celebration.png');
  const [isFeatured, setIsFeatured] = useState(true);
  const [status, setStatus] = useState<'PUBLISHED' | 'DRAFT'>('PUBLISHED');

  // Optional Kiswahili
  const [showSwahili, setShowSwahili] = useState(false);
  const [headlineSw, setHeadlineSw] = useState('');
  const [summarySw, setSummarySw] = useState('');
  const [bodySw, setBodySw] = useState('');

  const handleOpenAdd = () => {
    setShowAddModal(true);
    setMessage(null);
  };

  const handleCreateArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          headlineEn,
          categoryId,
          authorName,
          summaryEn,
          bodyEn,
          featuredImageUrl,
          featuredImageAlt: headlineEn,
          isFeatured,
          status,
          ...(showSwahili && headlineSw
            ? {
                headlineSw,
                summarySw: summarySw || summaryEn,
                bodySw: bodySw || bodyEn,
              }
            : {}),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to publish article.');

      setMessage({
        text: 'Team news published successfully! It is now live on the homepage hero and news feed.',
        success: true,
      });
      setShowAddModal(false);

      // Reset form
      setHeadlineEn('');
      setSummaryEn('');
      setBodyEn('');
      setHeadlineSw('');
      setSummarySw('');
      setBodySw('');

      // Update local list
      if (data.article) {
        setArticles([data.article, ...articles]);
      }
    } catch (err: any) {
      setMessage({ text: err.message, success: false });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFeatured = async (id: string, currentFeatured: boolean) => {
    try {
      const res = await fetch('/api/admin/news', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isFeatured: !currentFeatured }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update featured state.');

      setArticles(
        articles.map((art) => (art.id === id ? { ...art, isFeatured: !currentFeatured } : art))
      );
      setMessage({
        text: !currentFeatured ? 'Article promoted to Homepage Hero.' : 'Article removed from Homepage Hero.',
        success: true,
      });
    } catch (err: any) {
      setMessage({ text: err.message, success: false });
    }
  };

  const handleDeleteArticle = async (id: string) => {
    if (!confirm('Are you sure you want to delete this article?')) return;
    try {
      const res = await fetch(`/api/admin/news?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete article.');

      setArticles(articles.filter((art) => art.id !== id));
      setMessage({ text: 'Article deleted.', success: true });
    } catch (err: any) {
      setMessage({ text: err.message, success: false });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
            Editorial Press Desk
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Publish team news, match previews, official interviews, and announcements.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-club-primary hover:bg-red-600 text-white text-xs font-bold uppercase tracking-wider shadow transition"
        >
          <Plus className="w-4 h-4" />
          <span>Publish Team News</span>
        </button>
      </div>

      {/* Alert Banner */}
      {message && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 text-xs font-semibold ${
            message.success
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
          }`}
        >
          {message.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Publish News Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-3xl bg-[#121722] border border-white/15 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-club-accent px-2 py-0.5 rounded bg-club-primary/20">
                  New Editorial Post
                </span>
                <h3 className="editorial-headline text-2xl text-white mt-1">
                  Publish 3K FC Team News
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white text-xl font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateArticle} className="space-y-5 text-xs">
              {/* Category & Author */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">News Category</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full bg-black/50 border border-white/15 rounded-xl p-2.5 text-white"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.nameEn} ({cat.nameSw})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Author / Press Byline</label>
                  <input
                    type="text"
                    required
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    className="w-full bg-black/50 border border-white/15 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              {/* Headline */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">Article Headline (English)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 3K FC Announce Starting XI Ahead of FKF Premier League Matchday 1"
                  value={headlineEn}
                  onChange={(e) => setHeadlineEn(e.target.value)}
                  className="w-full bg-black/50 border border-white/15 rounded-xl p-3 text-white font-bold text-sm"
                />
              </div>

              {/* Summary */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">Summary / Lead Paragraph</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Brief 1-2 sentence overview that appears on news cards and search previews..."
                  value={summaryEn}
                  onChange={(e) => setSummaryEn(e.target.value)}
                  className="w-full bg-black/50 border border-white/15 rounded-xl p-2.5 text-white"
                />
              </div>

              {/* Body */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">Full Article Story</label>
                <textarea
                  required
                  rows={6}
                  placeholder="Full match report, tactical quotes, player statements, or club announcements..."
                  value={bodyEn}
                  onChange={(e) => setBodyEn(e.target.value)}
                  className="w-full bg-black/50 border border-white/15 rounded-xl p-3 text-white leading-relaxed font-sans"
                />
              </div>

              {/* Photography Selector */}
              <div>
                <label className="block text-slate-300 font-bold mb-2">
                  Select Featured Photo (or enter custom image path)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
                  {STOCK_CLUB_PHOTOS.map((photo) => (
                    <button
                      key={photo.url}
                      type="button"
                      onClick={() => setFeaturedImageUrl(photo.url)}
                      className={`p-2 rounded-xl border text-left flex flex-col justify-between transition ${
                        featuredImageUrl === photo.url
                          ? 'border-club-primary bg-club-primary/20 text-white'
                          : 'border-white/10 bg-black/30 text-slate-400 hover:bg-white/5'
                      }`}
                    >
                      <span className="text-[10px] font-bold truncate block">{photo.label}</span>
                      <span className="text-[9px] text-slate-500 font-mono truncate">{photo.url}</span>
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="/images/custom-photo.jpg or https://..."
                  value={featuredImageUrl}
                  onChange={(e) => setFeaturedImageUrl(e.target.value)}
                  className="w-full bg-black/50 border border-white/15 rounded-xl p-2.5 text-white font-mono text-xs"
                />
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-black/40 rounded-xl border border-white/10">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="w-4 h-4 rounded bg-black border-white/20 text-club-primary"
                  />
                  <div>
                    <span className="font-bold text-white block">Feature on Homepage Hero</span>
                    <span className="text-slate-400 text-[11px]">
                      Displays prominently at the very top of the website.
                    </span>
                  </div>
                </label>

                <div className="flex items-center justify-between sm:justify-end gap-3">
                  <span className="font-bold text-slate-300">Publish Immediately:</span>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'PUBLISHED' | 'DRAFT')}
                    className="bg-black border border-white/20 rounded-lg px-3 py-1.5 text-white font-bold"
                  >
                    <option value="PUBLISHED">PUBLISHED (Live)</option>
                    <option value="DRAFT">DRAFT (Saved)</option>
                  </select>
                </div>
              </div>

              {/* Swahili Translation Collapsible */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowSwahili(!showSwahili)}
                  className="text-xs text-club-accent hover:underline font-bold flex items-center gap-1"
                >
                  <span>{showSwahili ? '▼ Hide Kiswahili Translation' : '► Add Optional Kiswahili Translation'}</span>
                </button>

                {showSwahili && (
                  <div className="space-y-3 mt-3 p-4 bg-black/30 rounded-xl border border-white/10">
                    <div>
                      <label className="block text-slate-300 font-bold mb-1">Kichwa cha Habari (Swahili)</label>
                      <input
                        type="text"
                        placeholder="Kichwa cha habari kwa Kiswahili..."
                        value={headlineSw}
                        onChange={(e) => setHeadlineSw(e.target.value)}
                        className="w-full bg-black/50 border border-white/15 rounded-xl p-2.5 text-white font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-bold mb-1">Muhtasari (Swahili)</label>
                      <textarea
                        rows={2}
                        placeholder="Muhtasari mfupi..."
                        value={summarySw}
                        onChange={(e) => setSummarySw(e.target.value)}
                        className="w-full bg-black/50 border border-white/15 rounded-xl p-2.5 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-bold mb-1">Habari Kamili (Swahili)</label>
                      <textarea
                        rows={4}
                        placeholder="Habari kamili kwa Kiswahili..."
                        value={bodySw}
                        onChange={(e) => setBodySw(e.target.value)}
                        className="w-full bg-black/50 border border-white/15 rounded-xl p-2.5 text-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl bg-club-primary hover:bg-red-600 text-white font-bold uppercase tracking-wider transition shadow-lg disabled:opacity-50"
                >
                  {loading ? 'Publishing...' : 'Publish Team News Story'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Articles Table */}
      <div className="rounded-2xl bg-[#121722] border border-white/10 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between text-xs">
          <span className="font-bold uppercase text-white">All Published News ({articles.length})</span>
          <span className="text-emerald-400 font-mono">Bilingual Engine Active</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-black/30 text-slate-400 uppercase font-mono border-b border-white/5">
              <tr>
                <th className="py-3 px-4">Headline</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Featured</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Author</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {articles.map((art) => {
                const enTrans = art.translations.find((t) => t.locale === 'en') || art.translations[0];
                return (
                  <tr key={art.id} className="hover:bg-white/5 transition">
                    <td className="py-3.5 px-4 font-bold text-white max-w-sm">
                      <div className="truncate text-sm">{enTrans?.headline || art.slug}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                        /news/{art.slug}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-club-accent font-semibold">
                      {art.category.nameEn}
                    </td>

                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => handleToggleFeatured(art.id, art.isFeatured)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition ${
                          art.isFeatured
                            ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                            : 'bg-white/5 text-slate-400 hover:bg-white/10'
                        }`}
                        title="Click to toggle Homepage Hero placement"
                      >
                        <Star className={`w-3 h-3 ${art.isFeatured ? 'fill-amber-400' : ''}`} />
                        <span>{art.isFeatured ? 'Hero' : 'Standard'}</span>
                      </button>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                          art.status === 'PUBLISHED'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {art.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-400">{art.authorName}</td>

                    <td className="py-3.5 px-4 text-slate-400 font-mono">
                      {art.publishedAt
                        ? new Date(art.publishedAt).toLocaleDateString('en-KE')
                        : 'Draft'}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/news/${art.slug}`}
                          target="_blank"
                          className="p-1.5 rounded hover:bg-white/10 text-slate-400 hover:text-white transition"
                          title="View Live on Website"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>

                        <button
                          type="button"
                          onClick={() => handleDeleteArticle(art.id)}
                          className="p-1.5 rounded hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition"
                          title="Delete Article"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
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
