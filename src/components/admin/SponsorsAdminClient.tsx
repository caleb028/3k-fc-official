'use client';

import React, { useState } from 'react';
import { Briefcase, CheckCircle2, AlertCircle, Edit, PlusCircle, ExternalLink, Mail } from 'lucide-react';

interface SponsorItem {
  id: string;
  slug: string;
  businessName: string;
  category: string;
  descriptionEn: string;
  websiteUrl: string;
  contractStatus: string;
  verificationNote: string | null;
  displayPriority: number;
  isPublished: boolean;
}

interface EnquiryItem {
  id: string;
  organisation: string;
  contactPerson: string;
  businessEmail: string;
  phone: string;
  partnershipInterest: string;
  budgetRange: string | null;
  message: string;
  status: string;
  createdAt: string;
}

export function SponsorsAdminClient({
  sponsors,
  enquiries,
}: {
  sponsors: SponsorItem[];
  enquiries: EnquiryItem[];
}) {
  const [activeTab, setActiveTab] = useState<'SPONSORS' | 'ENQUIRIES'>('SPONSORS');
  const [editingSponsor, setEditingSponsor] = useState<Partial<SponsorItem> | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; success: boolean } | null>(null);

  const openNewSponsor = () => {
    setEditingSponsor({
      slug: '',
      businessName: '',
      category: 'MAIN_PARTNER',
      descriptionEn: '',
      websiteUrl: 'https://',
      contractStatus: 'SUBJECT_TO_CONFIRMATION',
      verificationNote: 'Subject to confirmation of the current sponsorship agreement.',
      displayPriority: 1,
      isPublished: true,
    });
    setMessage(null);
  };

  const handleSaveSponsor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSponsor) return;
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/sponsors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SAVE_SPONSOR',
          payload: {
            ...editingSponsor,
            displayPriority: Number(editingSponsor.displayPriority || 1),
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save sponsor.');

      setMessage({ text: 'Sponsor saved successfully.', success: true });
      setEditingSponsor(null);
    } catch (err: any) {
      setMessage({ text: err.message, success: false });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEnquiry = async (enquiryId: string, status: string) => {
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/sponsors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_ENQUIRY',
          payload: { enquiryId, status },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update enquiry.');

      setMessage({ text: 'Partnership enquiry status updated.', success: true });
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

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('SPONSORS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'SPONSORS'
                ? 'bg-club-primary text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Active Partners ({sponsors.length})
          </button>
          <button
            onClick={() => setActiveTab('ENQUIRIES')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'ENQUIRIES'
                ? 'bg-club-primary text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Inbound Enquiries ({enquiries.length})
          </button>
        </div>

        {activeTab === 'SPONSORS' && (
          <button
            onClick={openNewSponsor}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Partner</span>
          </button>
        )}
      </div>

      {/* Sponsor Modal */}
      {editingSponsor && (
        <div className="bg-[#121722] p-6 rounded-2xl border border-club-primary/40 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <h2 className="text-base font-bold text-white">
              {editingSponsor.id ? `Edit Sponsor: ${editingSponsor.businessName}` : 'Add Commercial Sponsor'}
            </h2>
            <button onClick={() => setEditingSponsor(null)} className="text-slate-400 hover:text-white text-xs">
              Close
            </button>
          </div>

          <form onSubmit={handleSaveSponsor} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-slate-400 block mb-1">Business Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mozzart Bet Kenya"
                  value={editingSponsor.businessName ?? ''}
                  onChange={(e) => setEditingSponsor({ ...editingSponsor, businessName: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">URL Slug</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. mozzart-bet-kenya"
                  value={editingSponsor.slug ?? ''}
                  onChange={(e) => setEditingSponsor({ ...editingSponsor, slug: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white font-mono"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Partnership Category</label>
                <select
                  value={editingSponsor.category ?? 'MAIN_PARTNER'}
                  onChange={(e) => setEditingSponsor({ ...editingSponsor, category: e.target.value as any })}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white"
                >
                  <option value="MAIN_PARTNER">MAIN_PARTNER</option>
                  <option value="KIT_PARTNER">KIT_PARTNER</option>
                  <option value="OFFICIAL_SUPPLIER">OFFICIAL_SUPPLIER</option>
                  <option value="DIGITAL_PARTNER">DIGITAL_PARTNER</option>
                  <option value="COMMUNITY_PARTNER">COMMUNITY_PARTNER</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-slate-400 block mb-1">Official Website URL</label>
                <input
                  type="url"
                  required
                  value={editingSponsor.websiteUrl ?? 'https://'}
                  onChange={(e) => setEditingSponsor({ ...editingSponsor, websiteUrl: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Contract Status</label>
                <select
                  value={editingSponsor.contractStatus ?? 'SUBJECT_TO_CONFIRMATION'}
                  onChange={(e) => setEditingSponsor({ ...editingSponsor, contractStatus: e.target.value as any })}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white"
                >
                  <option value="ACTIVE_VERIFIED">ACTIVE_VERIFIED</option>
                  <option value="SUBJECT_TO_CONFIRMATION">SUBJECT_TO_CONFIRMATION</option>
                  <option value="EXPIRED">EXPIRED</option>
                </select>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Display Priority (1 = Highest)</label>
                <input
                  type="number"
                  min="1"
                  value={editingSponsor.displayPriority ?? 1}
                  onChange={(e) => setEditingSponsor({ ...editingSponsor, displayPriority: parseInt(e.target.value) })}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Description (English)</label>
              <textarea
                rows={3}
                required
                value={editingSponsor.descriptionEn ?? ''}
                onChange={(e) => setEditingSponsor({ ...editingSponsor, descriptionEn: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white resize-none"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Verification Note</label>
              <input
                type="text"
                placeholder="e.g. Subject to confirmation of the current sponsorship agreement."
                value={editingSponsor.verificationNote ?? ''}
                onChange={(e) => setEditingSponsor({ ...editingSponsor, verificationNote: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="pubSponsor"
                checked={editingSponsor.isPublished ?? true}
                onChange={(e) => setEditingSponsor({ ...editingSponsor, isPublished: e.target.checked })}
                className="rounded bg-black border-white/20 text-club-primary"
              />
              <label htmlFor="pubSponsor" className="text-white font-medium select-none">
                Published on Website
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingSponsor(null)}
                className="px-4 py-2 bg-white/10 text-white rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 bg-club-primary hover:bg-club-dark text-white font-bold rounded-xl text-xs"
              >
                {loading ? 'Saving...' : 'Save Partner Profile'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Sponsors Table */}
      {activeTab === 'SPONSORS' && (
        <div className="bg-[#121722] rounded-2xl border border-white/10 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-black/30 text-slate-400 uppercase font-mono border-b border-white/5">
                <tr>
                  <th className="py-3 px-4">Partner</th>
                  <th className="py-3 px-3">Tier</th>
                  <th className="py-3 px-4">Website</th>
                  <th className="py-3 px-3 text-center">Priority</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {sponsors.map((s) => (
                  <tr key={s.id} className="hover:bg-white/5">
                    <td className="py-3 px-4 font-bold text-white">
                      {s.businessName}
                      {s.verificationNote && (
                        <span className="block text-[10px] text-amber-400 font-normal">
                          {s.verificationNote}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-semibold text-club-accent">{s.category}</td>
                    <td className="py-3 px-4">
                      <a
                        href={s.websiteUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-slate-400 hover:text-white flex items-center gap-1 font-mono text-[11px]"
                      >
                        <span className="truncate max-w-xs">{s.websiteUrl}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    </td>
                    <td className="py-3 px-3 text-center font-mono">{s.displayPriority}</td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          s.contractStatus === 'ACTIVE_VERIFIED'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {s.contractStatus}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => setEditingSponsor(s)}
                        className="p-1.5 bg-white/5 hover:bg-white/10 rounded text-slate-300 hover:text-white transition"
                        title="Edit sponsor"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Enquiries Table */}
      {activeTab === 'ENQUIRIES' && (
        <div className="bg-[#121722] rounded-2xl border border-white/10 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-black/30 text-slate-400 uppercase font-mono border-b border-white/5">
                <tr>
                  <th className="py-3 px-4">Organisation</th>
                  <th className="py-3 px-4">Contact Person</th>
                  <th className="py-3 px-3">Interest</th>
                  <th className="py-3 px-3">Budget</th>
                  <th className="py-3 px-4">Message</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {enquiries.map((e) => (
                  <tr key={e.id} className="hover:bg-white/5">
                    <td className="py-3 px-4 font-bold text-white">{e.organisation}</td>
                    <td className="py-3 px-4 text-white">
                      {e.contactPerson}
                      <span className="block text-[10px] text-slate-400 font-mono">{e.businessEmail}</span>
                    </td>
                    <td className="py-3 px-3 text-club-accent font-medium">{e.partnershipInterest}</td>
                    <td className="py-3 px-3 font-mono text-emerald-400">{e.budgetRange || 'Open'}</td>
                    <td className="py-3 px-4 text-slate-300 max-w-xs truncate">{e.message}</td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          e.status === 'NEW'
                            ? 'bg-amber-500/20 text-amber-300'
                            : e.status === 'CONTACTED'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-slate-500/20 text-slate-400'
                        }`}
                      >
                        {e.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <select
                        value={e.status}
                        onChange={(evt) => handleUpdateEnquiry(e.id, evt.target.value)}
                        className="bg-black/40 border border-white/10 rounded px-2 py-1 text-[11px] text-white"
                      >
                        <option value="NEW">NEW</option>
                        <option value="IN_REVIEW">IN_REVIEW</option>
                        <option value="CONTACTED">CONTACTED</option>
                        <option value="ARCHIVED">ARCHIVED</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
