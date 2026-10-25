'use client';

import React, { useState } from 'react';
import {
  Palette,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Building,
  Briefcase,
  Save,
} from 'lucide-react';

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

export function AdminSettingsClient({
  initialSettings,
}: {
  initialSettings: SettingsData;
}) {
  const [formData, setFormData] = useState<SettingsData>(initialSettings);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

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
        setFeedback({ type: 'success', text: data.message });
        setFormData(data.settings);
      }
    } catch {
      setFeedback({ type: 'error', text: 'Network error while updating settings.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="max-w-4xl space-y-8">
      {/* Brand Palette Section (Section 3 Requirement) */}
      <div className="rounded-2xl bg-[#121722] border border-white/10 p-6 md:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-club-accent">
            <Palette className="w-4 h-4" />
            <span>Section 3 Brand Palette Confirmation Workflow</span>
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

        <div>
          <h2 className="editorial-headline font-bold text-2xl text-white">
            Club Palette &amp; Design Tokens
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Section 3 Rule: Do not invent a final brand palette without inspecting the official crest. Administrators must confirm the palette before final public release.
          </p>
        </div>

        {/* Color Presets */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase text-slate-300">
            Select Configurable Provisional Theme Preset
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {presets.map((pr) => (
              <button
                key={pr.name}
                type="button"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    primaryColor: pr.primary,
                    secondaryColor: pr.secondary,
                    accentColor: pr.accent,
                  }))
                }
                className="p-3.5 rounded-xl bg-black/40 border border-white/10 hover:border-club-accent text-left transition"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-4 h-4 rounded-full border border-white/20"
                    style={{ backgroundColor: pr.primary }}
                  />
                  <div
                    className="w-4 h-4 rounded-full border border-white/20"
                    style={{ backgroundColor: pr.secondary }}
                  />
                  <div
                    className="w-4 h-4 rounded-full border border-white/20"
                    style={{ backgroundColor: pr.accent }}
                  />
                </div>
                <strong className="text-xs text-white block">{pr.name}</strong>
              </button>
            ))}
          </div>
        </div>

        {/* Hex Pickers */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Primary Club Colour
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
              Secondary Club Colour
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

      {/* Official Crest & Stadium Venue Section */}
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
              className="w-4 h-4 text-club-primary"
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
              className="w-4 h-4 text-club-primary"
            />
            <span>
              2026/27 Sponsorship agreement has been signed and confirmed by club leadership.
            </span>
          </label>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs font-bold ${
            feedback.type === 'success'
              ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/40'
              : 'bg-red-500/20 text-red-200 border border-red-500/40'
          }`}
        >
          {feedback.text}
        </div>
      )}

      <button
        type="submit"
        disabled={saving}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-club-primary hover:bg-red-600 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider shadow-lg transition"
      >
        <Save className="w-4 h-4" />
        <span>{saving ? 'Saving & Auditing...' : 'Save Settings & Record Audit Log'}</span>
      </button>
    </form>
  );
}
