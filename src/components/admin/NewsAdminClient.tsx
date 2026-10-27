'use client';

import React, { useState, useRef } from 'react';
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
  UploadCloud,
  Camera,
  X,
  FileText,
  Check,
  RefreshCw,
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

/**
 * Client-side high-quality image compressor using HTML5 canvas.
 * Downscales smartphone/camera photos (e.g. 10MB+) to optimal 1200px web editorial dimensions
 * and creates an ultra-fast base64 Data URL (~100-200KB).
 */
function compressImage(
  file: File,
  maxWidth = 1200,
  maxHeight = 800,
  quality = 0.82
): Promise<{ dataUrl: string; sizeKb: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve({
            dataUrl: e.target?.result as string,
            sizeKb: Math.round(file.size / 1024),
          });
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        const sizeKb = Math.round((dataUrl.length * 3) / 4 / 1024);
        resolve({ dataUrl, sizeKb });
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

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

  // Device Photo Upload State (for Create Modal)
  const [photoSource, setPhotoSource] = useState<'upload' | 'stock' | 'url'>('upload');
  const [uploadedPhotoInfo, setUploadedPhotoInfo] = useState<{
    name: string;
    originalKb: number;
    compressedKb: number;
  } | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Existing Article Photo Edit State
  const [photoEditModalArticle, setPhotoEditModalArticle] = useState<ArticleRecord | null>(null);
  const [photoEditDataUrl, setPhotoEditDataUrl] = useState<string | null>(null);
  const [photoEditInfo, setPhotoEditInfo] = useState<{
    name: string;
    originalKb: number;
    compressedKb: number;
  } | null>(null);
  const [photoEditCompressing, setPhotoEditCompressing] = useState(false);
  const [photoEditSaving, setPhotoEditSaving] = useState(false);
  const editFileInputRef = useRef<HTMLInputElement | null>(null);

  // Optional Kiswahili
  const [showSwahili, setShowSwahili] = useState(false);
  const [headlineSw, setHeadlineSw] = useState('');
  const [summarySw, setSummarySw] = useState('');
  const [bodySw, setBodySw] = useState('');

  const handleOpenAdd = () => {
    setShowAddModal(true);
    setMessage(null);
  };

  const handleDevicePhotoSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsCompressing(true);
    try {
      const originalKb = Math.round(file.size / 1024);
      const { dataUrl, sizeKb } = await compressImage(file);
      setUploadedPhotoInfo({
        name: file.name,
        originalKb,
        compressedKb: sizeKb,
      });
      setFeaturedImageUrl(dataUrl);
    } catch (err) {
      console.error('Image processing failed:', err);
      alert('Could not read image file from device. Please try another image.');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleClearUploadedPhoto = () => {
    setUploadedPhotoInfo(null);
    setFeaturedImageUrl('/images/3k-fc-team-celebration.png');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleOpenPhotoEdit = (art: ArticleRecord) => {
    setPhotoEditModalArticle(art);
    setPhotoEditDataUrl(art.featuredImageUrl);
    setPhotoEditInfo(null);
  };

  const handleEditDevicePhotoSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoEditCompressing(true);
    try {
      const originalKb = Math.round(file.size / 1024);
      const { dataUrl, sizeKb } = await compressImage(file);
      setPhotoEditInfo({
        name: file.name,
        originalKb,
        compressedKb: sizeKb,
      });
      setPhotoEditDataUrl(dataUrl);
    } catch (err) {
      console.error('Image upload failed:', err);
      alert('Could not process image file from device.');
    } finally {
      setPhotoEditCompressing(false);
    }
  };

  const handleSaveEditedPhoto = async () => {
    if (!photoEditModalArticle || !photoEditDataUrl) return;
    setPhotoEditSaving(true);
    try {
      const res = await fetch('/api/admin/news', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: photoEditModalArticle.id,
          featuredImageUrl: photoEditDataUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update article photo.');

      setArticles(
        articles.map((art) =>
          art.id === photoEditModalArticle.id
            ? { ...art, featuredImageUrl: photoEditDataUrl }
            : art
        )
      );
      setMessage({
        text: `Photo updated successfully from device for "${photoEditModalArticle.slug}"!`,
        success: true,
      });
      setPhotoEditModalArticle(null);
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to update photo', success: false });
    } finally {
      setPhotoEditSaving(false);
    }
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
      setUploadedPhotoInfo(null);
      setFeaturedImageUrl('/images/3k-fc-team-celebration.png');

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
            Publish team news, upload photos from device, write match previews, and manage official articles.
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

              {/* Photography Selector: Device Upload or Stock */}
              <div className="space-y-3 p-4 bg-black/40 rounded-2xl border border-white/10">
                <div className="flex items-center justify-between">
                  <label className="block text-slate-200 font-bold">
                    Featured Photography
                  </label>
                  <div className="flex items-center gap-1 bg-black/60 p-1 rounded-lg border border-white/10">
                    <button
                      type="button"
                      onClick={() => setPhotoSource('upload')}
                      className={`px-2.5 py-1 rounded text-[11px] font-bold transition flex items-center gap-1 ${
                        photoSource === 'upload'
                          ? 'bg-club-primary text-white shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Upload from Device</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhotoSource('stock')}
                      className={`px-2.5 py-1 rounded text-[11px] font-bold transition flex items-center gap-1 ${
                        photoSource === 'stock'
                          ? 'bg-club-primary text-white shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>Stock Presets</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhotoSource('url')}
                      className={`px-2.5 py-1 rounded text-[11px] font-bold transition ${
                        photoSource === 'url'
                          ? 'bg-club-primary text-white shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Custom URL
                    </button>
                  </div>
                </div>

                {/* Device Upload Mode */}
                {photoSource === 'upload' && (
                  <div className="space-y-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleDevicePhotoSelected}
                      className="hidden"
                      id="news-photo-file-input"
                    />

                    {uploadedPhotoInfo ? (
                      <div className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/15">
                        <img
                          src={featuredImageUrl}
                          alt="Uploaded Preview"
                          className="w-20 h-14 object-cover rounded-lg border border-white/20 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-white truncate text-xs">
                            {uploadedPhotoInfo.name}
                          </p>
                          <p className="text-[10px] text-emerald-400 font-mono mt-0.5">
                            Optimized: {uploadedPhotoInfo.compressedKb} KB (Original: {uploadedPhotoInfo.originalKb} KB)
                          </p>
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-300 font-semibold mt-1">
                            <Check className="w-3 h-3" /> Ready for publishing
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold"
                          >
                            Replace
                          </button>
                          <button
                            type="button"
                            onClick={handleClearUploadedPhoto}
                            className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300"
                            title="Remove Photo"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label
                        htmlFor="news-photo-file-input"
                        className="cursor-pointer border-2 border-dashed border-white/20 hover:border-club-primary hover:bg-club-primary/5 transition rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-2"
                      >
                        <div className="w-12 h-12 rounded-full bg-club-primary/10 flex items-center justify-center text-club-primary">
                          {isCompressing ? (
                            <RefreshCw className="w-6 h-6 animate-spin text-club-primary" />
                          ) : (
                            <UploadCloud className="w-6 h-6" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-white text-xs">
                            {isCompressing ? 'Optimizing photo from device...' : 'Click or tap to upload photo from your device'}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Supports JPG, PNG, WEBP, and camera photos. Auto-compressed for instant loading.
                          </p>
                        </div>
                      </label>
                    )}
                  </div>
                )}

                {/* Stock Presets Mode */}
                {photoSource === 'stock' && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {STOCK_CLUB_PHOTOS.map((photo) => (
                      <button
                        key={photo.url}
                        type="button"
                        onClick={() => {
                          setFeaturedImageUrl(photo.url);
                          setUploadedPhotoInfo(null);
                        }}
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
                )}

                {/* Custom URL Mode */}
                {photoSource === 'url' && (
                  <input
                    type="text"
                    placeholder="/images/custom-photo.jpg or https://..."
                    value={featuredImageUrl}
                    onChange={(e) => {
                      setFeaturedImageUrl(e.target.value);
                      setUploadedPhotoInfo(null);
                    }}
                    className="w-full bg-black/50 border border-white/15 rounded-xl p-2.5 text-white font-mono text-xs"
                  />
                )}
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

      {/* Edit Photo Modal for Existing Articles */}
      {photoEditModalArticle && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#121722] border border-white/15 rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-club-accent px-2 py-0.5 rounded bg-club-primary/20">
                  Update Photography
                </span>
                <h3 className="editorial-headline text-xl text-white mt-1">
                  Upload Photo for Article
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPhotoEditModalArticle(null)}
                className="text-slate-400 hover:text-white text-xl font-bold p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Article: <span className="text-white font-bold">{photoEditModalArticle.slug}</span>
            </p>

            <div className="space-y-4">
              <input
                ref={editFileInputRef}
                type="file"
                accept="image/*"
                onChange={handleEditDevicePhotoSelected}
                className="hidden"
                id="edit-news-photo-file-input"
              />

              {photoEditDataUrl && (
                <div className="rounded-2xl overflow-hidden border border-white/15 bg-black/50 aspect-video relative">
                  <img
                    src={photoEditDataUrl}
                    alt="Current or Selected Preview"
                    className="w-full h-full object-cover"
                  />
                  {photoEditInfo && (
                    <div className="absolute bottom-2 left-2 right-2 bg-black/80 backdrop-blur-md rounded-lg p-2 text-[10px] text-emerald-400 flex items-center justify-between">
                      <span>{photoEditInfo.name}</span>
                      <span>Optimized: {photoEditInfo.compressedKb} KB</span>
                    </div>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={() => editFileInputRef.current?.click()}
                disabled={photoEditCompressing}
                className="w-full py-3 px-4 rounded-xl border-2 border-dashed border-white/20 hover:border-club-primary hover:bg-club-primary/5 transition flex items-center justify-center gap-2 text-xs font-bold text-white"
              >
                {photoEditCompressing ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-club-primary" />
                ) : (
                  <UploadCloud className="w-4 h-4 text-club-primary" />
                )}
                <span>
                  {photoEditCompressing ? 'Compressing Image...' : 'Select New Photo from Device'}
                </span>
              </button>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => setPhotoEditModalArticle(null)}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEditedPhoto}
                disabled={photoEditSaving || !photoEditDataUrl}
                className="px-6 py-2.5 rounded-xl bg-club-primary hover:bg-red-600 text-white font-bold uppercase tracking-wider transition shadow-lg disabled:opacity-50 text-xs"
              >
                {photoEditSaving ? 'Saving Photo...' : 'Save Updated Photo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Articles Table with Photo Thumbnails & Inline Upload Action */}
      <div className="rounded-2xl bg-[#121722] border border-white/10 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between text-xs">
          <span className="font-bold uppercase text-white">All Published News ({articles.length})</span>
          <span className="text-emerald-400 font-mono">Device Photo Upload Enabled</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-black/30 text-slate-400 uppercase font-mono border-b border-white/5">
              <tr>
                <th className="py-3 px-4">Photo &amp; Headline</th>
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
                      <div className="flex items-center gap-3">
                        {/* Photo Thumbnail with Quick Change button */}
                        <div className="relative group shrink-0">
                          {art.featuredImageUrl ? (
                            <img
                              src={art.featuredImageUrl}
                              alt=""
                              className="w-12 h-10 rounded-lg object-cover border border-white/15"
                            />
                          ) : (
                            <div className="w-12 h-10 rounded-lg bg-black/50 border border-white/15 flex items-center justify-center text-slate-500">
                              <Camera className="w-4 h-4" />
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => handleOpenPhotoEdit(art)}
                            className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition rounded-lg flex items-center justify-center text-white"
                            title="Upload/Replace photo from device"
                          >
                            <Camera className="w-3.5 h-3.5 text-club-accent" />
                          </button>
                        </div>

                        <div className="min-w-0">
                          <div className="truncate text-sm">{enTrans?.headline || art.slug}</div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                            /news/{art.slug}
                          </div>
                        </div>
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
                        <button
                          type="button"
                          onClick={() => handleOpenPhotoEdit(art)}
                          className="p-1.5 rounded hover:bg-white/10 text-slate-400 hover:text-club-accent transition"
                          title="Upload new photo from device"
                        >
                          <Camera className="w-3.5 h-3.5" />
                        </button>

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
