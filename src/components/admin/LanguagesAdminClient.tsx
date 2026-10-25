'use client';

import React, { useState } from 'react';
import { Languages, CheckCircle2, AlertCircle, Edit, PlusCircle, Search } from 'lucide-react';

interface TranslationItem {
  id: string;
  namespace: string;
  key: string;
  valueEn: string;
  valueSw: string;
  isVerifiedSw: boolean;
}

export function LanguagesAdminClient({ initialPhrases }: { initialPhrases: TranslationItem[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingItem, setEditingItem] = useState<Partial<TranslationItem> | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; success: boolean } | null>(null);

  const filtered = initialPhrases.filter((p) => {
    const q = searchTerm.toLowerCase();
    return (
      p.key.toLowerCase().includes(q) ||
      p.valueEn.toLowerCase().includes(q) ||
      p.valueSw.toLowerCase().includes(q)
    );
  });

  const openNew = () => {
    setEditingItem({
      namespace: 'common',
      key: '',
      valueEn: '',
      valueSw: '',
      isVerifiedSw: true,
    });
    setMessage(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editingItem.key || !editingItem.valueEn || !editingItem.valueSw) return;
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/languages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingItem),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save translation.');

      setMessage({ text: 'Translation phrase committed to bilingual dictionary.', success: true });
      setEditingItem(null);
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

      {/* Top Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80 text-xs">
          <input
            type="text"
            placeholder="Search translation keys or phrases..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 pl-9 text-white placeholder-slate-500"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
        </div>

        <button
          onClick={openNew}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition self-end sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add Phrase</span>
        </button>
      </div>

      {/* Edit Drawer Modal */}
      {editingItem && (
        <div className="bg-[#121722] p-6 rounded-2xl border border-club-primary/40 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <h2 className="text-base font-bold text-white">
              {editingItem.id ? `Edit Translation: ${editingItem.key}` : 'Add Translation Key'}
            </h2>
            <button onClick={() => setEditingItem(null)} className="text-slate-400 hover:text-white text-xs">
              Close
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-slate-400 block mb-1">Key (Identifier)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. nav.home"
                  value={editingItem.key ?? ''}
                  onChange={(e) => setEditingItem({ ...editingItem, key: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white font-mono"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Namespace</label>
                <input
                  type="text"
                  value={editingItem.namespace ?? 'common'}
                  onChange={(e) => setEditingItem({ ...editingItem, namespace: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-slate-400 block mb-1">English Value</label>
                <input
                  type="text"
                  required
                  value={editingItem.valueEn ?? ''}
                  onChange={(e) => setEditingItem({ ...editingItem, valueEn: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Kiswahili Value</label>
                <input
                  type="text"
                  required
                  value={editingItem.valueSw ?? ''}
                  onChange={(e) => setEditingItem({ ...editingItem, valueSw: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 bg-white/10 text-white rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 bg-club-primary hover:bg-club-dark text-white font-bold rounded-xl text-xs"
              >
                {loading ? 'Saving...' : 'Save Phrase'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Translations Table */}
      <div className="bg-[#121722] rounded-2xl border border-white/10 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-black/30 text-slate-400 uppercase font-mono border-b border-white/5">
              <tr>
                <th className="py-3 px-4">Key</th>
                <th className="py-3 px-4">English Value</th>
                <th className="py-3 px-4">Kiswahili Value</th>
                <th className="py-3 px-3 text-center">Verified</th>
                <th className="py-3 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-white/5">
                  <td className="py-3 px-4 font-mono font-bold text-white">{p.key}</td>
                  <td className="py-3 px-4 text-white font-medium">{p.valueEn}</td>
                  <td className="py-3 px-4 text-club-accent">{p.valueSw}</td>
                  <td className="py-3 px-3 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300">
                      VERIFIED
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <button
                      onClick={() => setEditingItem(p)}
                      className="p-1.5 bg-white/5 hover:bg-white/10 rounded text-slate-300 hover:text-white transition"
                      title="Edit translation"
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
    </div>
  );
}
