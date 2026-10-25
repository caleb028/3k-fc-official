'use client';

import React, { useState } from 'react';
import { Table, CheckCircle2, AlertCircle, RefreshCw, Edit3 } from 'lucide-react';

interface StandingItem {
  id: string;
  position: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form: string | null;
  qualificationNote: string | null;
  isAvailable: boolean;
  dataSource: string;
  lastUpdatedAt: string;
  club: { name: string; shortName: string; isOurClub: boolean };
  competition: { name: string; shortName: string };
  season: { name: string };
}

export function TableAdminClient({ standings }: { standings: StandingItem[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<StandingItem>>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; success: boolean } | null>(null);

  const startEdit = (item: StandingItem) => {
    setEditingId(item.id);
    setEditForm({
      position: item.position,
      played: item.played,
      won: item.won,
      drawn: item.drawn,
      lost: item.lost,
      goalsFor: item.goalsFor,
      goalsAgainst: item.goalsAgainst,
      goalDifference: item.goalDifference,
      points: item.points,
      form: item.form ?? '',
      qualificationNote: item.qualificationNote ?? '',
      isAvailable: item.isAvailable,
      dataSource: item.dataSource,
    });
    setMessage(null);
  };

  const handleSave = async (id: string) => {
    setLoading(true);
    setMessage(null);

    try {
      const gf = Number(editForm.goalsFor ?? 0);
      const ga = Number(editForm.goalsAgainst ?? 0);
      const gd = gf - ga;

      const res = await fetch('/api/admin/table', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          position: Number(editForm.position ?? 1),
          played: Number(editForm.played ?? 0),
          won: Number(editForm.won ?? 0),
          drawn: Number(editForm.drawn ?? 0),
          lost: Number(editForm.lost ?? 0),
          goalsFor: gf,
          goalsAgainst: ga,
          goalDifference: gd,
          points: Number(editForm.points ?? 0),
          form: editForm.form || null,
          qualificationNote: editForm.qualificationNote || null,
          isAvailable: editForm.isAvailable ?? true,
          dataSource: editForm.dataSource ?? 'MANUAL_VERIFIED',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update standing.');

      setMessage({ text: 'Standing row updated successfully and verified.', success: true });
      setEditingId(null);
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

      <div className="bg-[#121722] rounded-2xl border border-white/10 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Table className="w-4 h-4 text-club-accent" />
            <span className="font-bold uppercase text-white">
              Official League Standings ({standings.length} Teams)
            </span>
          </div>
          <span className="text-slate-400 font-mono text-[11px]">Source: Verified FKF Records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-black/30 text-slate-400 uppercase font-mono border-b border-white/5">
              <tr>
                <th className="py-3 px-3 text-center">Pos</th>
                <th className="py-3 px-4">Club</th>
                <th className="py-3 px-2 text-center">P</th>
                <th className="py-3 px-2 text-center">W</th>
                <th className="py-3 px-2 text-center">D</th>
                <th className="py-3 px-2 text-center">L</th>
                <th className="py-3 px-2 text-center">GF</th>
                <th className="py-3 px-2 text-center">GA</th>
                <th className="py-3 px-2 text-center">GD</th>
                <th className="py-3 px-2 text-center font-bold text-white">Pts</th>
                <th className="py-3 px-3 text-center">Form</th>
                <th className="py-3 px-4">Qualification / Note</th>
                <th className="py-3 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300 font-mono">
              {standings.map((st) => {
                const isEditing = editingId === st.id;
                const isOur = st.club.isOurClub;

                if (isEditing) {
                  return (
                    <tr key={st.id} className="bg-club-primary/10">
                      <td className="py-3 px-2 text-center">
                        <input
                          type="number"
                          value={editForm.position}
                          onChange={(e) => setEditForm({ ...editForm, position: parseInt(e.target.value) })}
                          className="w-12 bg-black border border-white/20 text-center rounded p-1 text-white"
                        />
                      </td>
                      <td className="py-3 px-4 font-bold text-white font-sans">{st.club.name}</td>
                      <td className="py-3 px-2 text-center">
                        <input
                          type="number"
                          value={editForm.played}
                          onChange={(e) => setEditForm({ ...editForm, played: parseInt(e.target.value) })}
                          className="w-10 bg-black border border-white/20 text-center rounded p-1 text-white"
                        />
                      </td>
                      <td className="py-3 px-2 text-center">
                        <input
                          type="number"
                          value={editForm.won}
                          onChange={(e) => setEditForm({ ...editForm, won: parseInt(e.target.value) })}
                          className="w-10 bg-black border border-white/20 text-center rounded p-1 text-white"
                        />
                      </td>
                      <td className="py-3 px-2 text-center">
                        <input
                          type="number"
                          value={editForm.drawn}
                          onChange={(e) => setEditForm({ ...editForm, drawn: parseInt(e.target.value) })}
                          className="w-10 bg-black border border-white/20 text-center rounded p-1 text-white"
                        />
                      </td>
                      <td className="py-3 px-2 text-center">
                        <input
                          type="number"
                          value={editForm.lost}
                          onChange={(e) => setEditForm({ ...editForm, lost: parseInt(e.target.value) })}
                          className="w-10 bg-black border border-white/20 text-center rounded p-1 text-white"
                        />
                      </td>
                      <td className="py-3 px-2 text-center">
                        <input
                          type="number"
                          value={editForm.goalsFor}
                          onChange={(e) => setEditForm({ ...editForm, goalsFor: parseInt(e.target.value) })}
                          className="w-10 bg-black border border-white/20 text-center rounded p-1 text-white"
                        />
                      </td>
                      <td className="py-3 px-2 text-center">
                        <input
                          type="number"
                          value={editForm.goalsAgainst}
                          onChange={(e) => setEditForm({ ...editForm, goalsAgainst: parseInt(e.target.value) })}
                          className="w-10 bg-black border border-white/20 text-center rounded p-1 text-white"
                        />
                      </td>
                      <td className="py-3 px-2 text-center text-slate-400">
                        {(editForm.goalsFor ?? 0) - (editForm.goalsAgainst ?? 0)}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <input
                          type="number"
                          value={editForm.points}
                          onChange={(e) => setEditForm({ ...editForm, points: parseInt(e.target.value) })}
                          className="w-12 bg-black border border-white/20 text-center rounded p-1 font-bold text-club-accent"
                        />
                      </td>
                      <td className="py-3 px-3 text-center">
                        <input
                          type="text"
                          value={editForm.form ?? ''}
                          placeholder="W,D,L"
                          onChange={(e) => setEditForm({ ...editForm, form: e.target.value })}
                          className="w-20 bg-black border border-white/20 text-center rounded p-1 text-white uppercase"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          value={editForm.qualificationNote ?? ''}
                          placeholder="Note e.g. Promotion"
                          onChange={(e) => setEditForm({ ...editForm, qualificationNote: e.target.value })}
                          className="w-full bg-black border border-white/20 rounded p-1 text-white text-[11px]"
                        />
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleSave(st.id)}
                          disabled={loading}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-2.5 py-1 rounded text-[11px] mr-1"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="bg-white/10 hover:bg-white/20 text-white px-2 py-1 rounded text-[11px]"
                        >
                          Cancel
                        </button>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr
                    key={st.id}
                    className={`hover:bg-white/5 ${
                      isOur ? 'bg-club-primary/10 font-bold border-l-4 border-l-club-primary' : ''
                    }`}
                  >
                    <td className="py-3 px-3 text-center text-white">{st.position}</td>
                    <td className="py-3 px-4 font-bold text-white font-sans flex items-center gap-2">
                      <span>{st.club.name}</span>
                      {isOur && (
                        <span className="text-[10px] bg-club-primary text-white px-1.5 py-0.5 rounded font-mono">
                          OUR CLUB
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-2 text-center">{st.played}</td>
                    <td className="py-3 px-2 text-center text-emerald-400">{st.won}</td>
                    <td className="py-3 px-2 text-center text-slate-400">{st.drawn}</td>
                    <td className="py-3 px-2 text-center text-rose-400">{st.lost}</td>
                    <td className="py-3 px-2 text-center">{st.goalsFor}</td>
                    <td className="py-3 px-2 text-center">{st.goalsAgainst}</td>
                    <td className="py-3 px-2 text-center">
                      {st.goalDifference > 0 ? `+${st.goalDifference}` : st.goalDifference}
                    </td>
                    <td className="py-3 px-2 text-center font-bold text-white text-sm">{st.points}</td>
                    <td className="py-3 px-3 text-center text-[10px] tracking-widest">{st.form || '-'}</td>
                    <td className="py-3 px-4 text-slate-400 text-[11px] font-sans">
                      {st.qualificationNote || '-'}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => startEdit(st)}
                        className="p-1.5 bg-white/5 hover:bg-white/10 rounded text-slate-300 hover:text-white transition"
                        title="Edit standings row"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
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
