'use client';

import React, { useState } from 'react';
import { History, Search, ShieldCheck, Eye } from 'lucide-react';

interface AuditLogItem {
  id: string;
  actorEmail: string | null;
  actorRole: string | null;
  action: string;
  targetType: string;
  targetId: string;
  beforeJson: string | null;
  afterJson: string | null;
  reason: string | null;
  ipAddress: string | null;
  createdAt: string;
}

export function AuditLogsClient({ logs }: { logs: AuditLogItem[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  const filtered = logs.filter((l) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      l.action.toLowerCase().includes(q) ||
      l.targetType.toLowerCase().includes(q) ||
      (l.actorEmail && l.actorEmail.toLowerCase().includes(q)) ||
      (l.reason && l.reason.toLowerCase().includes(q));
    const matchesAction = actionFilter === 'ALL' || l.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  const uniqueActions = Array.from(new Set(logs.map((l) => l.action)));

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-[#121722] p-4 rounded-2xl border border-white/10 flex flex-col md:flex-row gap-4 justify-between items-center text-xs">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search by action, email, resource, reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 pl-9 text-white placeholder-slate-500"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
        </div>

        <div>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white font-medium"
          >
            <option value="ALL">All Actions ({logs.length})</option>
            {uniqueActions.map((act) => (
              <option key={act} value={act}>
                {act}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Detail Inspection Modal */}
      {selectedLog && (
        <div className="bg-[#121722] p-6 rounded-2xl border border-club-primary/40 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <h2 className="text-base font-bold text-white">
              Audit Event: {selectedLog.action} ({selectedLog.targetType})
            </h2>
            <button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-white text-xs">
              Close
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 bg-black/40 rounded-xl border border-white/5">
              <div>
                <span className="text-slate-400 block mb-0.5">Actor</span>
                <span className="text-white font-bold">{selectedLog.actorEmail || 'System Process'}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Role</span>
                <span className="text-club-accent font-mono">{selectedLog.actorRole || 'SYSTEM'}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">IP Address</span>
                <span className="text-slate-300 font-mono">{selectedLog.ipAddress || 'Internal'}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Timestamp</span>
                <span className="text-slate-300 font-mono">
                  {new Date(selectedLog.createdAt).toLocaleString()}
                </span>
              </div>
            </div>

            {selectedLog.reason && (
              <div className="p-3 bg-black/30 rounded-xl border border-white/5">
                <span className="text-slate-400 block mb-1 font-bold">Audit Justification / Note</span>
                <p className="text-white">{selectedLog.reason}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-slate-400 block mb-1 font-bold">State Before Mutation</span>
                <pre className="p-3 bg-black/60 rounded-xl border border-white/5 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-60">
                  {selectedLog.beforeJson ? JSON.stringify(JSON.parse(selectedLog.beforeJson), null, 2) : 'None'}
                </pre>
              </div>
              <div>
                <span className="text-slate-400 block mb-1 font-bold">State After Mutation</span>
                <pre className="p-3 bg-black/60 rounded-xl border border-white/5 text-[11px] font-mono text-emerald-300 overflow-x-auto max-h-60">
                  {selectedLog.afterJson ? JSON.stringify(JSON.parse(selectedLog.afterJson), null, 2) : 'None'}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Logs Table */}
      <div className="bg-[#121722] rounded-2xl border border-white/10 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-black/30 text-slate-400 uppercase font-mono border-b border-white/5">
              <tr>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-3">Entity</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Audit Reason</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-3 text-center">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {filtered.map((l) => (
                <tr key={l.id} className="hover:bg-white/5">
                  <td className="py-3 px-4 font-mono font-bold text-white">{l.action}</td>
                  <td className="py-3 px-3 text-club-accent font-mono">{l.targetType}</td>
                  <td className="py-3 px-4 text-white">
                    {l.actorEmail || 'System'}
                    {l.actorRole && (
                      <span className="block text-[10px] text-slate-400 font-mono">[{l.actorRole}]</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-300 max-w-xs truncate">{l.reason || '-'}</td>
                  <td className="py-3 px-4 text-slate-400 text-[11px] font-mono">
                    {new Date(l.createdAt).toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <button
                      onClick={() => setSelectedLog(l)}
                      className="p-1.5 bg-white/5 hover:bg-white/10 rounded text-slate-300 hover:text-white transition"
                      title="Inspect full audit record"
                    >
                      <Eye className="w-3.5 h-3.5" />
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
