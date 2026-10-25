'use client';

import React, { useState } from 'react';
import { UserCog, UserPlus, CheckCircle2, AlertCircle, Shield, Key } from 'lucide-react';

interface StaffUserItem {
  id: string;
  email: string;
  phone: string | null;
  status: string;
  isStaff: boolean;
  createdAt: string;
  profile: { firstName: string; lastName: string } | null;
  roles: Array<{ slug: string; name: string }>;
}

export function UsersAdminClient({
  users,
  availableRoles,
}: {
  users: StaffUserItem[];
  availableRoles: Array<{ slug: string; name: string }>;
}) {
  const [isCreating, setIsCreating] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [roleSlug, setRoleSlug] = useState('MEDIA_MANAGER');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; success: boolean } | null>(null);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !firstName || !lastName) return;
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CREATE_STAFF',
          payload: {
            email,
            password,
            firstName,
            lastName,
            phone: phone || null,
            roleSlug,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create user.');

      setMessage({ text: 'Staff account successfully provisioned with assigned RBAC role.', success: true });
      setIsCreating(false);
      setEmail('');
      setPassword('');
      setFirstName('');
      setLastName('');
      setPhone('');
    } catch (err: any) {
      setMessage({ text: err.message, success: false });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (user: StaffUserItem) => {
    const newStatus = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_STATUS',
          payload: {
            userId: user.id,
            status: newStatus,
            reason: `Status changed to ${newStatus} by authorized administrator`,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update user status.');

      setMessage({ text: `Account status for ${user.email} changed to ${newStatus}.`, success: true });
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

      {/* Action Bar */}
      <div className="flex justify-between items-center border-b border-white/10 pb-4">
        <div>
          <span className="text-xs text-slate-400 font-mono">
            {users.length} Authorized Staff Accounts &amp; RBAC Roles
          </span>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition"
        >
          <UserPlus className="w-4 h-4" />
          <span>Provision Staff Account</span>
        </button>
      </div>

      {/* Create Modal Drawer */}
      {isCreating && (
        <div className="bg-[#121722] p-6 rounded-2xl border border-club-primary/40 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <h2 className="text-base font-bold text-white">Provision New Club Staff Account</h2>
            <button onClick={() => setIsCreating(false)} className="text-slate-400 hover:text-white text-xs">
              Close
            </button>
          </div>

          <form onSubmit={handleCreateStaff} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-slate-400 block mb-1">First Name</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Last Name</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-slate-400 block mb-1">Corporate Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="name@3kfc.co.ke"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Temporary Password (Min 8 characters)</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white font-mono"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Phone Number (Optional)</label>
                <input
                  type="tel"
                  placeholder="+254 7..."
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Assigned Back-Office Role</label>
              <select
                value={roleSlug}
                onChange={(e) => setRoleSlug(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white"
              >
                {availableRoles.map((r) => (
                  <option key={r.slug} value={r.slug}>
                    {r.name} ({r.slug})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 bg-white/10 text-white rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 bg-club-primary hover:bg-club-dark text-white font-bold rounded-xl text-xs"
              >
                {loading ? 'Provisioning...' : 'Provision Staff Account'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Staff Table */}
      <div className="bg-[#121722] rounded-2xl border border-white/10 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-black/30 text-slate-400 uppercase font-mono border-b border-white/5">
              <tr>
                <th className="py-3 px-4">Staff Member</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-3">Assigned Role</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-white/5">
                  <td className="py-3 px-4 text-white font-bold">
                    {u.profile ? `${u.profile.firstName} ${u.profile.lastName}` : 'System Administrator'}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-300">{u.email}</td>
                  <td className="py-3 px-3">
                    <span className="font-semibold text-club-accent font-mono text-[11px]">
                      {u.roles.map((r) => r.slug).join(', ') || 'STAFF'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        u.status === 'ACTIVE'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-rose-500/20 text-rose-300'
                      }`}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-[11px]">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <button
                      onClick={() => handleToggleStatus(u)}
                      disabled={loading}
                      className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-[11px] text-slate-300 hover:text-white transition"
                    >
                      {u.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
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
