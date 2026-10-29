'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Palette,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Building,
  Briefcase,
  Save,
  Camera,
  UploadCloud,
  Image as ImageIcon,
  Check,
  Sparkles,
} from 'lucide-react';
import { ClubCrest } from '@/components/ui/ClubCrest';
import { compressImage } from '@/lib/image-compress';

interface SettingsData {
  paletteStatus: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  homeStadiumName: string;
  homeStadiumConfirmed: boolean;
  homeStadiumVerificationNote: string;
  mainSponsorName: string;
  mainSponsorConfirmed: boolean;
  mainSponsorVerificationNote: string;
  crestAssetUrl: string | null;
  crestConfirmed: boolean;
}

const STOCK_CRESTS = [
  { label: 'Official 3K FC Crest (SVG/Vector)', url: '/images/3k-fc-crest.png' },
  { label: 'Authentic Facebook Profile (1000px)', url: '/images/facebook/3kfc-facebook-profile-square-1000.jpg' },
  { label: 'Embu Matchday Facebook Crest (500px)', url: '/images/facebook/3kfc-crest-official-facebook-500.jpg' },
];

export function AdminSettingsClient({
  initialSettings,
}: {
  initialSettings: SettingsData;
}) {
  const router = useRouter();
  const [formData, setFormData] = useState<SettingsData>(initialSettings);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  // File upload state for crest photo
  const [uploadingCrest, setUploadingCrest] = useState(false);
  const [uploadedCrestInfo, setUploadedCrestInfo] = useState<{ name: string; sizeKb: number } | null>(null);
  const crestFileInputRef = useRef<HTMLInputElement | null>(null);

  const presets = [
    {
      name: 'Default Embu Championship Crimson & Gold',
      primary: '#B91C1C',
      secondary: '#0F766E',
      accent: '#F59E0B',
    },
    {
      name: 'Embu High-Country Emerald & Royal Gold',
      primary: '#047857',
      secondary: '#1E3A8A',
      accent: '#FBBF24',
    },
    {
      name: 'Mount Kenya Royal Blue & Crimson',
      primary: '#1D4ED8',
      secondary: '#B91C1C',
      accent: '#F59E0B',
    },
  ];

  const handleDeviceCrestSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCrest(true);
    try {
      const { dataUrl, sizeKb } = await compressImage(file, 800, 800, 0.9);
      setFormData((prev) => ({
        ...prev,
        crestAssetUrl: dataUrl,
        crestConfirmed: true,
      }));
      setUploadedCrestInfo({
        name: file.name,
        sizeKb,
      });
    } catch (err) {
      console.error('Failed to compress crest image:', err);
      alert('Could not read image file. Please try another file.');
    } finally {
      setUploadingCrest(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: 'error', text: data.error || 'Failed to update settings.' });
      } else {
        setFeedback({
          type: 'success',
          text: 'Settings & Crest updated instantly across the website and logged in audit records.',
        });
        setFormData(data.settings);
        // Refresh Next.js server components so public layouts receive fresh brand tokens
        router.refresh();
      }
    } catch {
      setFeedback({ type: 'error', text: 'Network error while updating settings.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="max-w-4xl space-y-8">
      {/* Official Club Crest & Brand Logo Section */}
      <div className="rounded-2xl bg-[#121722] border border-white/10 p-6 md:p-8 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-club-accent">
              <ShieldCheck className="w-4 h-4" />
              <span>Official Club Crest &amp; Brand Logo</span>
            </div>
            <h2 className="editorial-headline font-bold text-xl text-white mt-1">
              Live Club Crest &amp; Visual Identity
            </h2>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold uppercase flex items-center gap-1.5 ${
              formData.crestConfirmed
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
            }`}
          >
            {formData.crestConfirmed ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Verified Crest</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Provisional Crest</span>
              </>
            )}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Crest Live Preview Card */}
          <div className="bg-black/40 border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-3">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
              Live Website Preview
            </span>
            <div className="p-3 bg-white/5 rounded-2xl border border-white/10 shadow-inner">
              <ClubCrest
                size="2xl"
                crestUrl={formData.crestAssetUrl || '/images/3k-fc-crest.png'}
                crestConfirmed={formData.crestConfirmed}
                showWordmark={false}
              />
            </div>
            <span className="text-xs font-bold text-white">
              3K Football Club
            </span>
            <span className="text-[10px] text-slate-400 font-mono break-all line-clamp-1 max-w-[200px]">
              {formData.crestAssetUrl || '/images/3k-fc-crest.png'}
            </span>
          </div>

          {/* Crest Controls: Upload & Presets */}
          <div className="md:col-span-2 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Upload New Crest from Device (Phone / PC)
              </label>
              <input
                ref={crestFileInputRef}
                type="file"
                accept="image/*"
                onChange={handleDeviceCrestSelected}
                className="hidden"
              />
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={uploadingCrest}
                  onClick={() => crestFileInputRef.current?.click()}
                  className="px-4 py-2.5 rounded-xl bg-club-primary hover:bg-red-600 text-white text-xs font-bold flex items-center gap-2 shadow-md transition disabled:opacity-50"
                >
                  <Camera className="w-4 h-4" />
                  <span>{uploadingCrest ? 'Compressing...' : 'Choose Device Photo'}</span>
                </button>
                {uploadedCrestInfo && (
                  <span className="text-xs text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Loaded {uploadedCrestInfo.name} ({uploadedCrestInfo.sizeKb} KB)</span>
                  </span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Quick Select Authentic Crest Presets
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {STOCK_CRESTS.map((stk) => {
                  const isSelected = formData.crestAssetUrl === stk.url;
                  return (
                    <button
                      key={stk.url}
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          crestAssetUrl: stk.url,
                          crestConfirmed: true,
                        }));
                        setUploadedCrestInfo(null);
                      }}
                      className={`p-2.5 rounded-xl border text-left text-xs transition flex flex-col justify-between gap-1.5 ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-500/10 text-white'
                          : 'border-white/10 bg-black/40 text-slate-300 hover:border-white/30'
                      }`}
                    >
                      <span className="font-semibold text-[11px] line-clamp-1">{stk.label}</span>
                      <span className="text-[10px] text-club-accent font-mono flex items-center gap-1">
                        {isSelected ? '✓ Active' : 'Select'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Direct Crest Image URL / Asset Path
              </label>
              <input
                type="text"
                placeholder="/images/3k-fc-crest.png"
                value={formData.crestAssetUrl || ''}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, crestAssetUrl: e.target.value }))
                }
                className="w-full rounded-lg bg-black/50 border border-white/15 px-3 py-2 text-xs text-white font-mono"
              />
            </div>

            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={formData.crestConfirmed}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, crestConfirmed: e.target.checked }))
                }
                className="w-4 h-4 text-club-primary rounded bg-black border-white/20"
              />
              <span className="font-semibold text-white">
                Mark Club Crest as Officially Ratified by 3K FC Leadership
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Brand Palette Section */}
      <div className="rounded-2xl bg-[#121722] border border-white/10 p-6 md:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-club-accent">
            <Palette className="w-4 h-4" />
            <span>Design System Brand Palette Confirmation</span>
          </div>
          <span
            className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase ${
              formData.paletteStatus === 'CONFIRMED'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
            }`}
          >
            {formData.paletteStatus}
          </span>
        </div>

        <p className="text-xs text-slate-400">
          Color tokens apply immediately across all public layouts, navigation headers, match banners, and ticketing interfaces.
        </p>

        {/* Preset Schemes */}
        <div>
          <label className="block text-xs font-bold text-slate-300 mb-2">
            Recommended Verified Palette Schemes
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {presets.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    primaryColor: preset.primary,
                    secondaryColor: preset.secondary,
                    accentColor: preset.accent,
                  }))
                }
                className="text-left p-3 rounded-xl bg-black/40 border border-white/10 hover:border-white/30 transition space-y-2 group"
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-5 h-5 rounded-full border border-white/20"
                    style={{ backgroundColor: preset.primary }}
                  />
                  <span
                    className="w-5 h-5 rounded-full border border-white/20"
                    style={{ backgroundColor: preset.secondary }}
                  />
                  <span
                    className="w-5 h-5 rounded-full border border-white/20"
                    style={{ backgroundColor: preset.accent }}
                  />
                </div>
                <div className="text-[11px] font-bold text-white group-hover:text-club-accent transition line-clamp-1">
                  {preset.name}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Color Pickers */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Primary Crimson / Red
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={formData.primaryColor}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, primaryColor: e.target.value }))
                }
                className="w-10 h-10 rounded cursor-pointer bg-transparent border-0"
              />
              <input
                type="text"
                value={formData.primaryColor}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, primaryColor: e.target.value }))
                }
                className="flex-1 rounded-lg bg-black/50 border border-white/15 px-3 py-2 text-xs font-mono text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Secondary Forest Green / Emerald
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={formData.secondaryColor}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, secondaryColor: e.target.value }))
                }
                className="w-10 h-10 rounded cursor-pointer bg-transparent border-0"
              />
              <input
                type="text"
                value={formData.secondaryColor}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, secondaryColor: e.target.value }))
                }
                className="flex-1 rounded-lg bg-black/50 border border-white/15 px-3 py-2 text-xs font-mono text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Accent Gold / Amber
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={formData.accentColor}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, accentColor: e.target.value }))
                }
                className="w-10 h-10 rounded cursor-pointer bg-transparent border-0"
              />
              <input
                type="text"
                value={formData.accentColor}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, accentColor: e.target.value }))
                }
                className="flex-1 rounded-lg bg-black/50 border border-white/15 px-3 py-2 text-xs font-mono text-white"
              />
            </div>
          </div>
        </div>

        {/* Confirmation Status Toggle */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-between">
          <div>
            <strong className="text-white text-xs block">
              Mark Brand Palette as Officially Confirmed
            </strong>
            <span className="text-[11px] text-slate-400">
              Switches palette state from PROVISIONAL to CONFIRMED, removing warning banners on the public website.
            </span>
          </div>
          <button
            type="button"
            onClick={() =>
              setFormData((prev) => ({
                ...prev,
                paletteStatus: prev.paletteStatus === 'CONFIRMED' ? 'PROVISIONAL' : 'CONFIRMED',
              }))
            }
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition ${
              formData.paletteStatus === 'CONFIRMED'
                ? 'bg-emerald-600 text-white'
                : 'bg-amber-600 text-black'
            }`}
          >
            Status: {formData.paletteStatus}
          </button>
        </div>
      </div>

      {/* Official Stadium Venue & Sponsorship Section */}
      <div className="rounded-2xl bg-[#121722] border border-white/10 p-6 md:p-8 space-y-6">
        <h2 className="editorial-headline font-bold text-2xl text-white">
          Venue &amp; Sponsorship Verification
        </h2>

        {/* Stadium Venue */}
        <div className="space-y-3 pb-6 border-b border-white/10">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-club-accent">
            <Building className="w-4 h-4" />
            <span>Home Stadium Venue</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Stadium Name</label>
              <input
                type="text"
                value={formData.homeStadiumName}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, homeStadiumName: e.target.value }))
                }
                className="w-full rounded-lg bg-black/50 border border-white/15 px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Verification Disclaimer
              </label>
              <input
                type="text"
                value={formData.homeStadiumVerificationNote}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    homeStadiumVerificationNote: e.target.value,
                  }))
                }
                className="w-full rounded-lg bg-black/50 border border-white/15 px-3 py-2 text-xs text-white"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={formData.homeStadiumConfirmed}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, homeStadiumConfirmed: e.target.checked }))
              }
              className="w-4 h-4 text-club-primary rounded bg-black border-white/20"
            />
            <span>
              Official Match Venue is formally ratified by FKF for Season 2026/27.
            </span>
          </label>
        </div>

        {/* Main Sponsor */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-club-accent">
            <Briefcase className="w-4 h-4" />
            <span>Principal Club Sponsor (Mozzart Bet Kenya)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Sponsor Name</label>
              <input
                type="text"
                value={formData.mainSponsorName}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, mainSponsorName: e.target.value }))
                }
                className="w-full rounded-lg bg-black/50 border border-white/15 px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Sponsorship Verification Notice
              </label>
              <input
                type="text"
                value={formData.mainSponsorVerificationNote}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    mainSponsorVerificationNote: e.target.value,
                  }))
                }
                className="w-full rounded-lg bg-black/50 border border-white/15 px-3 py-2 text-xs text-white"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={formData.mainSponsorConfirmed}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, mainSponsorConfirmed: e.target.checked }))
              }
              className="w-4 h-4 text-club-primary rounded bg-black border-white/20"
            />
            <span>
              2026/27 Sponsorship agreement has been signed and confirmed by club leadership.
            </span>
          </label>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs font-bold flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/40'
              : 'bg-red-500/20 text-red-200 border border-red-500/40'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={saving}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-club-primary hover:bg-red-600 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider shadow-lg transition"
      >
        <Save className="w-4 h-4" />
        <span>{saving ? 'Saving Live Changes...' : 'Save Settings & Update Live Website'}</span>
      </button>
    </form>
  );
}
