'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  Edit,
  Trash2,
  Star,
  Shield,
  ShieldCheck,
  Camera,
  UploadCloud,
  Image as ImageIcon,
  Check,
  User,
} from 'lucide-react';
import { compressImage } from '@/lib/image-compress';

export interface PlayerItem {
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
  photoUrl: string | null;
  photoVerified: boolean;
}

export interface StaffItem {
  id: string;
  slug: string;
  fullName: string;
  roleTitleEn: string;
  roleTitleSw: string | null;
  category: string;
  biographyEn: string;
  sortOrder: number;
  isActive: boolean;
  photoUrl: string | null;
  photoVerified: boolean;
}

const STOCK_PLAYER_PHOTOS = [
  { label: 'Match Action Derby', url: '/images/facebook/3kfc-facebook-derby-match-action.jpg' },
  { label: 'Coach Omasete Headshot', url: '/images/facebook/3kfc-facebook-coach-nicodemus-omasete.jpg' },
  { label: 'TOTW Kariuki & Wanjala', url: '/images/facebook/3kfc-facebook-totw-kariuki-wanjala.jpg' },
  { label: 'Player on Moi Pitch', url: '/images/3k-fc-player-pitch.jpg' },
  { label: 'Team Celebration', url: '/images/3k-fc-team-celebration.png' },
];

export function SquadAdminClient({
  initialPlayers,
  initialStaff,
}: {
  initialPlayers: PlayerItem[];
  initialStaff: StaffItem[];
}) {
  const router = useRouter();
  const [players, setPlayers] = useState<PlayerItem[]>(initialPlayers);
  const [staff, setStaff] = useState<StaffItem[]>(initialStaff);
  const [activeTab, setActiveTab] = useState<'PLAYERS' | 'STAFF'>('PLAYERS');
  const [editingPlayer, setEditingPlayer] = useState<Partial<PlayerItem> | null>(null);
  const [editingStaff, setEditingStaff] = useState<Partial<StaffItem> | null>(null);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; success: boolean } | null>(null);

  // Photo upload states
  const [isCompressingPhoto, setIsCompressingPhoto] = useState(false);
  const [photoInfo, setPhotoInfo] = useState<{ name: string; sizeKb: number } | null>(null);
  const playerFileInputRef = useRef<HTMLInputElement | null>(null);
  const staffFileInputRef = useRef<HTMLInputElement | null>(null);

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
      biographyEn: 'Talented first-team squad player competing for 3K FC in the FKF Premier League.',
      biographySw: 'Mchezaji wa kikosi cha kwanza cha 3K FC katika Ligi Kuu ya FKF.',
      isCaptain: false,
      isSpotlight: false,
      isActive: true,
      photoUrl: '/images/facebook/3kfc-facebook-derby-match-action.jpg',
      photoVerified: true,
    });
    setPhotoInfo(null);
    setMessage(null);
  };

  const handleDevicePlayerPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingPlayer) return;
    setIsCompressingPhoto(true);
    try {
      const { dataUrl, sizeKb } = await compressImage(file, 600, 600, 0.85);
      setEditingPlayer((prev) => (prev ? { ...prev, photoUrl: dataUrl, photoVerified: true } : null));
      setPhotoInfo({ name: file.name, sizeKb });
    } catch (err) {
      console.error('Player photo upload error:', err);
      alert('Could not read photo from device.');
    } finally {
      setIsCompressingPhoto(false);
    }
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

      const saved: PlayerItem = data.player;
      if (editingPlayer.id) {
        setPlayers((prev) => prev.map((p) => (p.id === saved.id ? saved : p)));
      } else {
        setPlayers((prev) => [...prev, saved]);
      }

      setMessage({ text: `Player ${saved.fullName} saved and published live.`, success: true });
      setEditingPlayer(null);
      router.refresh();
    } catch (err: any) {
      setMessage({ text: err.message, success: false });
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlayer = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove player "${name}"?`)) return;
    setDeletingId(id);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/squad?id=${id}&entityType=PLAYER`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete player');

      setPlayers((prev) => prev.filter((p) => p.id !== id));
      setMessage({ text: `Player "${name}" successfully removed.`, success: true });
      router.refresh();
    } catch (err: any) {
      setMessage({ text: err.message, success: false });
    } finally {
      setDeletingId(null);
    }
  };

  const openNewStaff = () => {
    setEditingStaff({
      slug: '',
      fullName: '',
      roleTitleEn: 'Assistant Coach',
      roleTitleSw: 'Kocha Msaidizi',
      category: 'TECHNICAL_BENCH',
      biographyEn: 'Key technical bench member steering tactical match performance.',
      sortOrder: 10,
      isActive: true,
      photoUrl: '/images/facebook/3kfc-facebook-coach-nicodemus-omasete.jpg',
      photoVerified: true,
    });
    setPhotoInfo(null);
    setMessage(null);
  };

  const handleDeviceStaffPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingStaff) return;
    setIsCompressingPhoto(true);
    try {
      const { dataUrl, sizeKb } = await compressImage(file, 600, 600, 0.85);
      setEditingStaff((prev) => (prev ? { ...prev, photoUrl: dataUrl, photoVerified: true } : null));
      setPhotoInfo({ name: file.name, sizeKb });
    } catch (err) {
      console.error('Staff photo upload error:', err);
      alert('Could not read photo from device.');
    } finally {
      setIsCompressingPhoto(false);
    }
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

      const saved: StaffItem = data.staff;
      if (editingStaff.id) {
        setStaff((prev) => prev.map((s) => (s.id === saved.id ? saved : s)));
      } else {
        setStaff((prev) => [...prev, saved]);
      }

      setMessage({ text: `Staff member ${saved.fullName} saved and published live.`, success: true });
      setEditingStaff(null);
      router.refresh();
    } catch (err: any) {
      setMessage({ text: err.message, success: false });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStaff = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove staff member "${name}"?`)) return;
    setDeletingId(id);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/squad?id=${id}&entityType=STAFF`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete staff member');

      setStaff((prev) => prev.filter((s) => s.id !== id));
      setMessage({ text: `Staff member "${name}" successfully removed.`, success: true });
      router.refresh();
    } catch (err: any) {
      setMessage({ text: err.message, success: false });
    } finally {
      setDeletingId(null);
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
            First Team Squad ({players.length})
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
            Technical Bench &amp; Staff ({staff.length})
          </button>
        </div>

        <div>
          {activeTab === 'PLAYERS' ? (
            <button
              onClick={openNewPlayer}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition shadow"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Player</span>
            </button>
          ) : (
            <button
              onClick={openNewStaff}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition shadow"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Staff</span>
            </button>
          )}
        </div>
      </div>

      {/* Modal / Form Drawer for Player */}
      {editingPlayer && (
        <div className="bg-[#121722] p-6 rounded-2xl border border-club-primary/40 shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <User className="w-4 h-4 text-club-accent" />
              <span>{editingPlayer.id ? `Edit Player: ${editingPlayer.fullName}` : 'Register New Player'}</span>
            </h2>
            <button
              onClick={() => setEditingPlayer(null)}
              className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-white/5"
            >
              Close
            </button>
          </div>

          <form onSubmit={handleSavePlayer} className="space-y-6 text-xs">
            {/* Player Photo Section */}
            <div className="bg-black/30 border border-white/10 rounded-xl p-4 space-y-3">
              <label className="text-white font-bold block">Player Headshot / Action Photo</label>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                {/* Avatar Preview */}
                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-800 border-2 border-white/15 shrink-0 flex items-center justify-center relative">
                  {editingPlayer.photoUrl ? (
                    <img
                      src={editingPlayer.photoUrl}
                      alt={editingPlayer.fullName || 'Player photo'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-slate-500 text-xs font-mono">No Photo</div>
                  )}
                  {editingPlayer.photoVerified && (
                    <span className="absolute bottom-1 right-1 bg-emerald-500 text-white p-0.5 rounded-full" title="Verified Photo">
                      <Check className="w-3 h-3" />
                    </span>
                  )}
                </div>

                {/* Upload & Controls */}
                <div className="space-y-2 flex-1 w-full">
                  <input
                    ref={playerFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleDevicePlayerPhoto}
                    className="hidden"
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={isCompressingPhoto}
                      onClick={() => playerFileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg bg-club-primary hover:bg-red-600 text-white text-xs font-bold flex items-center gap-1.5 transition"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>{isCompressingPhoto ? 'Processing...' : 'Upload from Device'}</span>
                    </button>
                    {photoInfo && (
                      <span className="text-[11px] text-emerald-400">
                        {photoInfo.name} ({photoInfo.sizeKb} KB)
                      </span>
                    )}
                  </div>

                  {/* Stock Quick Select */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {STOCK_PLAYER_PHOTOS.map((stk) => (
                      <button
                        key={stk.url}
                        type="button"
                        onClick={() =>
                          setEditingPlayer((prev) =>
                            prev ? { ...prev, photoUrl: stk.url, photoVerified: true } : null
                          )
                        }
                        className={`px-2 py-1 rounded text-[10px] font-semibold border transition ${
                          editingPlayer.photoUrl === stk.url
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-white/5 text-slate-300 border-white/10 hover:border-white/20'
                        }`}
                      >
                        {stk.label}
                      </button>
                    ))}
                  </div>

                  {/* Direct URL */}
                  <input
                    type="text"
                    placeholder="Or enter direct photo URL..."
                    value={editingPlayer.photoUrl ?? ''}
                    onChange={(e) =>
                      setEditingPlayer((prev) => (prev ? { ...prev, photoUrl: e.target.value } : null))
                    }
                    className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-white font-mono text-[11px]"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={editingPlayer.photoVerified ?? true}
                  onChange={(e) =>
                    setEditingPlayer((prev) => (prev ? { ...prev, photoVerified: e.target.checked } : null))
                  }
                  className="rounded bg-black border-white/20 text-club-primary"
                />
                <span className="text-slate-300 font-medium select-none">
                  Mark Player Headshot as Verified &amp; Authentic
                </span>
              </label>
            </div>

            {/* Profile Fields */}
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
                className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 bg-club-primary hover:bg-red-600 text-white font-bold rounded-xl text-xs shadow transition disabled:opacity-50"
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
            <button
              onClick={() => setEditingStaff(null)}
              className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-white/5"
            >
              Close
            </button>
          </div>

          <form onSubmit={handleSaveStaff} className="space-y-4 text-xs">
            {/* Staff Photo Section */}
            <div className="bg-black/30 border border-white/10 rounded-xl p-4 space-y-3">
              <label className="text-white font-bold block">Staff Headshot Photo</label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-800 border-2 border-white/15 shrink-0 flex items-center justify-center">
                  {editingStaff.photoUrl ? (
                    <img
                      src={editingStaff.photoUrl}
                      alt={editingStaff.fullName || 'Staff'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-6 h-6 text-slate-500" />
                  )}
                </div>

                <div className="space-y-2 flex-1">
                  <input
                    ref={staffFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleDeviceStaffPhoto}
                    className="hidden"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isCompressingPhoto}
                      onClick={() => staffFileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg bg-club-primary hover:bg-red-600 text-white text-xs font-bold flex items-center gap-1.5 transition"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>{isCompressingPhoto ? 'Processing...' : 'Upload Photo'}</span>
                    </button>
                    <input
                      type="text"
                      placeholder="Or enter photo URL..."
                      value={editingStaff.photoUrl ?? ''}
                      onChange={(e) =>
                        setEditingStaff((prev) => (prev ? { ...prev, photoUrl: e.target.value } : null))
                      }
                      className="flex-1 bg-black/50 border border-white/10 rounded-lg p-2 text-white font-mono text-[11px]"
                    />
                  </div>
                </div>
              </div>
            </div>

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
                rows={2}
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
                className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 bg-club-primary hover:bg-red-600 text-white font-bold rounded-xl text-xs shadow transition disabled:opacity-50"
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
                  <th className="py-3 px-3">Photo</th>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-3">Position</th>
                  <th className="py-3 px-3">Role</th>
                  <th className="py-3 px-3">Nationality</th>
                  <th className="py-3 px-3 text-center">Captain</th>
                  <th className="py-3 px-3 text-center">Spotlight</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {players.map((p) => (
                  <tr key={p.id} className="hover:bg-white/5 transition">
                    <td className="py-3 px-3 text-center font-mono font-bold text-white">
                      {p.shirtNumber ?? '-'}
                    </td>
                    <td className="py-3 px-3">
                      <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-800 border border-white/20 flex items-center justify-center relative">
                        {p.photoUrl ? (
                          <img src={p.photoUrl} alt={p.fullName} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[10px] font-mono font-bold text-slate-400">#{p.shirtNumber ?? '3K'}</span>
                        )}
                        {p.photoVerified && (
                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-black" />
                        )}
                      </div>
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
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setEditingPlayer(p);
                            setEditingStaff(null);
                          }}
                          className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition"
                          title="Edit player"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          disabled={deletingId === p.id}
                          onClick={() => handleDeletePlayer(p.id, p.fullName)}
                          className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg text-rose-300 hover:text-rose-200 transition disabled:opacity-50"
                          title="Delete player"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
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
                  <th className="py-3 px-3">Photo</th>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Role Title</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3 text-center">Order</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {staff.map((s) => (
                  <tr key={s.id} className="hover:bg-white/5 transition">
                    <td className="py-3 px-3">
                      <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-800 border border-white/20 flex items-center justify-center">
                        {s.photoUrl ? (
                          <img src={s.photoUrl} alt={s.fullName} className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </td>
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
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setEditingStaff(s);
                            setEditingPlayer(null);
                          }}
                          className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition"
                          title="Edit staff member"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          disabled={deletingId === s.id}
                          onClick={() => handleDeleteStaff(s.id, s.fullName)}
                          className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg text-rose-300 hover:text-rose-200 transition disabled:opacity-50"
                          title="Delete staff member"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
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
