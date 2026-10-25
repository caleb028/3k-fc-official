'use client';

import React, { useState } from 'react';
import { Users, UserPlus, CheckCircle2, AlertCircle, Edit, Star, Shield, ShieldCheck } from 'lucide-react';

interface PlayerItem {
  id: string;
  slug: string;
  firstName: string;
  lastName: string;
  fullName: string;
  nickname: string | null;
  shirtNumber: number | null;
  position: string;
  specificRole: string | null;
  nationality: string;
  biographyEn: string;
  biographySw: string | null;
  isCaptain: boolean;
  isSpotlight: boolean;
  isActive: boolean;
  photoVerified: boolean;
}

interface StaffItem {
  id: string;
  slug: string;
  fullName: string;
  roleTitleEn: string;
  roleTitleSw: string | null;
  category: string;
  biographyEn: string;
  sortOrder: number;
  isActive: boolean;
}

export function SquadAdminClient({
  initialPlayers,
  initialStaff,
}: {
  initialPlayers: PlayerItem[];
  initialStaff: StaffItem[];
}) {
  const [activeTab, setActiveTab] = useState<'PLAYERS' | 'STAFF'>('PLAYERS');
  const [editingPlayer, setEditingPlayer] = useState<Partial<PlayerItem> | null>(null);
  const [editingStaff, setEditingStaff] = useState<Partial<StaffItem> | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; success: boolean } | null>(null);

  const openNewPlayer = () => {
    setEditingPlayer({
      slug: '',
      firstName: '',
      lastName: '',
      fullName: '',
      nickname: '',
      shirtNumber: 10,
      position: 'MIDFIELDER',
      specificRole: 'Attacking Midfielder',
      nationality: 'Kenyan',
      biographyEn: '',
      biographySw: '',
      isCaptain: false,
      isSpotlight: false,
      isActive: true,
      photoVerified: false,
    });
    setMessage(null);
  };

  const handleSavePlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlayer) return;
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/squad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType: 'PLAYER',
          payload: {
            ...editingPlayer,
            shirtNumber: editingPlayer.shirtNumber ? Number(editingPlayer.shirtNumber) : null,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save player');

      setMessage({ text: 'Player profile saved and verified.', success: true });
      setEditingPlayer(null);
    } catch (err: any) {
      setMessage({ text: err.message, success: false });
    } finally {
      setLoading(false);
    }
  };

  const openNewStaff = () => {
    setEditingStaff({
      slug: '',
      fullName: '',
      roleTitleEn: 'Assistant Coach',
      roleTitleSw: '',
      category: 'TECHNICAL_BENCH',
      biographyEn: '',
      sortOrder: 10,
      isActive: true,
    });
    setMessage(null);
  };

  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/squad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType: 'STAFF',
          payload: {
            ...editingStaff,
            sortOrder: editingStaff.sortOrder ? Number(editingStaff.sortOrder) : 10,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save staff member');

      setMessage({ text: 'Staff member profile saved.', success: true });
      setEditingStaff(null);
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
            onClick={() => {
              setActiveTab('PLAYERS');
              setEditingPlayer(null);
              setEditingStaff(null);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'PLAYERS'
                ? 'bg-club-primary text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            First Team Squad ({initialPlayers.length})
          </button>
          <button
            onClick={() => {
              setActiveTab('STAFF');
              setEditingPlayer(null);
              setEditingStaff(null);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'STAFF'
                ? 'bg-club-primary text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Technical Bench &amp; Staff ({initialStaff.length})
          </button>
        </div>

        <div>
          {activeTab === 'PLAYERS' ? (
            <button
              onClick={openNewPlayer}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition"
            >
              <UserPlus className="w-4 h-4" />
              <span>Register Player</span>
            </button>
          ) : (
            <button
              onClick={openNewStaff}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Staff Member</span>
            </button>
          )}
        </div>
      </div>

      {/* Modal / Form Drawer for Player */}
      {editingPlayer && (
        <div className="bg-[#121722] p-6 rounded-2xl border border-club-primary/40 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <h2 className="text-base font-bold text-white">
              {editingPlayer.id ? `Edit Player: ${editingPlayer.fullName}` : 'Register New Player'}
            </h2>
            <button onClick={() => setEditingPlayer(null)} className="text-slate-400 hover:text-white text-xs">
              Close
            </button>
          </div>

          <form onSubmit={handleSavePlayer} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-slate-400 block mb-1">First Name</label>
                <input
                  type="text"
                  required
                  value={editingPlayer.firstName ?? ''}
                  onChange={(e) =>
                    setEditingPlayer({
                      ...editingPlayer,
                      firstName: e.target.value,
                      fullName: `${e.target.value} ${editingPlayer.lastName ?? ''}`.trim(),
                    })
                  }
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Last Name</label>
                <input
                  type="text"
                  required
                  value={editingPlayer.lastName ?? ''}
                  onChange={(e) =>
                    setEditingPlayer({
                      ...editingPlayer,
                      lastName: e.target.value,
                      fullName: `${editingPlayer.firstName ?? ''} ${e.target.value}`.trim(),
                    })
                  }
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">URL Slug</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. daniel-wabwire"
                  value={editingPlayer.slug ?? ''}
                  onChange={(e) => setEditingPlayer({ ...editingPlayer, slug: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-slate-400 block mb-1">Shirt Number</label>
                <input
                  type="number"
                  min="1"
                  max="99"
                  value={editingPlayer.shirtNumber ?? ''}
                  onChange={(e) => setEditingPlayer({ ...editingPlayer, shirtNumber: parseInt(e.target.value) })}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white font-mono"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Position</label>
                <select
                  value={editingPlayer.position ?? 'MIDFIELDER'}
                  onChange={(e) => setEditingPlayer({ ...editingPlayer, position: e.target.value as any })}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white"
                >
                  <option value="GOALKEEPER">GOALKEEPER</option>
                  <option value="DEFENDER">DEFENDER</option>
                  <option value="MIDFIELDER">MIDFIELDER</option>
                  <option value="FORWARD">FORWARD</option>
                </select>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Specific Role</label>
                <input
                  type="text"
                  placeholder="e.g. Center Forward"
                  value={editingPlayer.specificRole ?? ''}
                  onChange={(e) => setEditingPlayer({ ...editingPlayer, specificRole: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Nationality</label>
                <input
                  type="text"
                  value={editingPlayer.nationality ?? 'Kenyan'}
                  onChange={(e) => setEditingPlayer({ ...editingPlayer, nationality: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Biography (English)</label>
              <textarea
                rows={3}
                required
                value={editingPlayer.biographyEn ?? ''}
                onChange={(e) => setEditingPlayer({ ...editingPlayer, biographyEn: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white resize-none"
              />
            </div>

            <div className="flex flex-wrap gap-6 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingPlayer.isCaptain ?? false}
                  onChange={(e) => setEditingPlayer({ ...editingPlayer, isCaptain: e.target.checked })}
                  className="rounded bg-black border-white/20 text-club-primary"
                />
                <span className="text-white font-medium select-none">Club Captain</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingPlayer.isSpotlight ?? false}
                  onChange={(e) => setEditingPlayer({ ...editingPlayer, isSpotlight: e.target.checked })}
                  className="rounded bg-black border-white/20 text-club-primary"
                />
                <span className="text-white font-medium select-none">Featured Spotlight Player</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingPlayer.isActive ?? true}
                  onChange={(e) => setEditingPlayer({ ...editingPlayer, isActive: e.target.checked })}
                  className="rounded bg-black border-white/20 text-club-primary"
                />
                <span className="text-white font-medium select-none">Active in Squad</span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingPlayer(null)}
                className="px-4 py-2 bg-white/10 text-white rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 bg-club-primary hover:bg-club-dark text-white font-bold rounded-xl text-xs"
              >
                {loading ? 'Saving...' : 'Save Player Profile'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal / Form Drawer for Staff */}
      {editingStaff && (
        <div className="bg-[#121722] p-6 rounded-2xl border border-club-primary/40 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <h2 className="text-base font-bold text-white">
              {editingStaff.id ? `Edit Staff: ${editingStaff.fullName}` : 'Add Staff Member'}
            </h2>
            <button onClick={() => setEditingStaff(null)} className="text-slate-400 hover:text-white text-xs">
              Close
            </button>
          </div>

          <form onSubmit={handleSaveStaff} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-slate-400 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editingStaff.fullName ?? ''}
                  onChange={(e) => setEditingStaff({ ...editingStaff, fullName: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">URL Slug</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. nicodemus-omasete"
                  value={editingStaff.slug ?? ''}
                  onChange={(e) => setEditingStaff({ ...editingStaff, slug: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white font-mono"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Category</label>
                <select
                  value={editingStaff.category ?? 'TECHNICAL_BENCH'}
                  onChange={(e) => setEditingStaff({ ...editingStaff, category: e.target.value as any })}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white"
                >
                  <option value="TECHNICAL_BENCH">TECHNICAL_BENCH</option>
                  <option value="LEADERSHIP">LEADERSHIP</option>
                  <option value="MEDICAL">MEDICAL</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-slate-400 block mb-1">Role Title (English)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Head Coach"
                  value={editingStaff.roleTitleEn ?? ''}
                  onChange={(e) => setEditingStaff({ ...editingStaff, roleTitleEn: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Role Title (Kiswahili)</label>
                <input
                  type="text"
                  placeholder="e.g. Kocha Mkuu"
                  value={editingStaff.roleTitleSw ?? ''}
                  onChange={(e) => setEditingStaff({ ...editingStaff, roleTitleSw: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Biography (English)</label>
              <textarea
                rows={3}
                required
                value={editingStaff.biographyEn ?? ''}
                onChange={(e) => setEditingStaff({ ...editingStaff, biographyEn: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingStaff(null)}
                className="px-4 py-2 bg-white/10 text-white rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 bg-club-primary hover:bg-club-dark text-white font-bold rounded-xl text-xs"
              >
                {loading ? 'Saving...' : 'Save Staff Profile'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Players Table */}
      {activeTab === 'PLAYERS' && (
        <div className="bg-[#121722] rounded-2xl border border-white/10 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-black/30 text-slate-400 uppercase font-mono border-b border-white/5">
                <tr>
                  <th className="py-3 px-3 text-center">#</th>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-3">Position</th>
                  <th className="py-3 px-3">Role</th>
                  <th className="py-3 px-3">Nationality</th>
                  <th className="py-3 px-3 text-center">Captain</th>
                  <th className="py-3 px-3 text-center">Spotlight</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {initialPlayers.map((p) => (
                  <tr key={p.id} className="hover:bg-white/5">
                    <td className="py-3 px-3 text-center font-mono font-bold text-white">
                      {p.shirtNumber ?? '-'}
                    </td>
                    <td className="py-3 px-4 font-bold text-white flex items-center gap-2">
                      <span>{p.fullName}</span>
                      {p.nickname && <span className="text-[11px] text-club-accent font-normal">&quot;{p.nickname}&quot;</span>}
                    </td>
                    <td className="py-3 px-3 text-club-accent font-mono text-[11px]">{p.position}</td>
                    <td className="py-3 px-3 text-slate-400">{p.specificRole || '-'}</td>
                    <td className="py-3 px-3">{p.nationality}</td>
                    <td className="py-3 px-3 text-center">
                      {p.isCaptain && <Shield className="w-4 h-4 text-amber-400 mx-auto" />}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {p.isSpotlight && <Star className="w-4 h-4 text-emerald-400 mx-auto" />}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          p.isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-500/20 text-slate-400'
                        }`}
                      >
                        {p.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => {
                          setEditingPlayer(p);
                          setEditingStaff(null);
                        }}
                        className="p-1.5 bg-white/5 hover:bg-white/10 rounded text-slate-300 hover:text-white transition"
                        title="Edit player"
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

      {/* Staff Table */}
      {activeTab === 'STAFF' && (
        <div className="bg-[#121722] rounded-2xl border border-white/10 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-black/30 text-slate-400 uppercase font-mono border-b border-white/5">
                <tr>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Role Title</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3 text-center">Order</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {initialStaff.map((s) => (
                  <tr key={s.id} className="hover:bg-white/5">
                    <td className="py-3 px-4 font-bold text-white">{s.fullName}</td>
                    <td className="py-3 px-4 text-club-accent font-medium">{s.roleTitleEn}</td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-400">{s.category}</td>
                    <td className="py-3 px-3 text-center font-mono">{s.sortOrder}</td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          s.isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-500/20 text-slate-400'
                        }`}
                      >
                        {s.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => {
                          setEditingStaff(s);
                          setEditingPlayer(null);
                        }}
                        className="p-1.5 bg-white/5 hover:bg-white/10 rounded text-slate-300 hover:text-white transition"
                        title="Edit staff member"
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
    </div>
  );
}
