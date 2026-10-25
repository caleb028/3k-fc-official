'use client';

import React, { useState } from 'react';
import {
  ScanLine,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  ShieldCheck,
  RefreshCw,
  Camera,
} from 'lucide-react';
import { GateScanResponse } from '@/lib/tickets/service';

interface FixtureSummary {
  id: string;
  slug: string;
  title: string;
  venueName: string;
}

export function GateScanningClient({
  fixtures,
}: {
  fixtures: FixtureSummary[];
}) {
  const [selectedFixtureId, setSelectedFixtureId] = useState(fixtures[0]?.id || '');
  const [gateName, setGateName] = useState('Main Gate A — Moi Stadium');
  const [tokenInput, setTokenInput] = useState('');
  const [scanning, setScanning] = useState(false);
  const [lastResult, setLastResult] = useState<GateScanResponse | null>(null);
  const [scanHistory, setScanHistory] = useState<GateScanResponse[]>([]);

  const handleScanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;

    setScanning(true);
    try {
      const res = await fetch('/api/tickets/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qrTokenOrTicketCode: tokenInput.trim(),
          assignedFixtureId: selectedFixtureId,
          gateName,
        }),
      });
      const data: GateScanResponse = await res.json();
      setLastResult(data);
      setScanHistory((prev) => [data, ...prev.slice(0, 19)]);
      if (data.result === 'VALID_ACCEPTED') {
        setTokenInput('');
      }
    } catch {
      setLastResult({
        result: 'INVALID_TICKET',
        message: 'Network error communicating with turnstile gate validation server.',
      });
    } finally {
      setScanning(false);
    }
  };

  const getResultBadge = (result: GateScanResponse['result']) => {
    switch (result) {
      case 'VALID_ACCEPTED':
        return {
          bg: 'bg-emerald-500/20 border-emerald-500 text-emerald-300',
          icon: CheckCircle2,
          title: 'VALID — ENTRY ACCEPTED',
        };
      case 'ALREADY_USED':
        return {
          bg: 'bg-amber-500/20 border-amber-500 text-amber-300',
          icon: AlertTriangle,
          title: 'ALREADY USED — REJECTED',
        };
      case 'WRONG_MATCH':
        return {
          bg: 'bg-purple-500/20 border-purple-500 text-purple-300',
          icon: AlertTriangle,
          title: 'WRONG MATCH — TICKET FOR ANOTHER FIXTURE',
        };
      case 'CANCELLED_OR_REFUNDED':
        return {
          bg: 'bg-red-500/20 border-red-500 text-red-300',
          icon: XCircle,
          title: 'CANCELLED OR REFUNDED — REJECTED',
        };
      case 'PAYMENT_NOT_CONFIRMED':
        return {
          bg: 'bg-orange-500/20 border-orange-500 text-orange-300',
          icon: AlertTriangle,
          title: 'UNPAID ORDER — PAYMENT NOT CONFIRMED',
        };
      default:
        return {
          bg: 'bg-red-500/20 border-red-500 text-red-300',
          icon: XCircle,
          title: 'INVALID TICKET TOKEN',
        };
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Configuration Header */}
      <div className="rounded-2xl bg-[#121722] border border-white/10 p-6 space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-club-accent">
          <ScanLine className="w-4 h-4" />
          <span>Section 10 Dedicated Gate Scanning Application</span>
        </div>
        <h1 className="editorial-headline font-black text-2xl md:text-3xl text-white">
          Turnstile Entry &amp; QR Redemption
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">
              Assigned Matchday Fixture
            </label>
            <select
              value={selectedFixtureId}
              onChange={(e) => setSelectedFixtureId(e.target.value)}
              className="w-full rounded-lg bg-black/50 border border-white/15 px-3 py-2 text-xs font-bold text-white"
            >
              {fixtures.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.title} ({f.venueName})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">
              Active Stadium Gate
            </label>
            <input
              type="text"
              value={gateName}
              onChange={(e) => setGateName(e.target.value)}
              className="w-full rounded-lg bg-black/50 border border-white/15 px-3 py-2 text-xs text-white"
            />
          </div>
        </div>
      </div>

      {/* Main Scanner & Manual Lookup Panel */}
      <div className="rounded-2xl bg-[#121722] border border-white/10 p-6 md:p-8 space-y-6">
        <form onSubmit={handleScanSubmit} className="space-y-4">
          <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-300">
            Scan Barcode via Camera OR Enter Cryptographic Token / Ticket Code
          </label>

          <div className="relative">
            <input
              type="text"
              autoFocus
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="Paste signed QR token payload or type 3K-TKT-XXXXXXXX"
              className="w-full rounded-xl bg-black/70 border-2 border-white/20 px-4 py-3.5 text-white font-mono text-sm placeholder-slate-500 focus:border-club-accent"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-[11px] text-slate-400">
              Turnstile scanners with barcode laser or camera pipe directly into this input.
            </span>
            <button
              type="submit"
              disabled={scanning || !tokenInput.trim()}
              className="px-6 py-3 rounded-xl bg-club-primary hover:bg-red-600 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider shadow-lg transition"
            >
              {scanning ? 'Verifying with Atomic Lock...' : 'Execute Turnstile Validation'}
            </button>
          </div>
        </form>

        {/* Immediate Scan Outcome Banner */}
        {lastResult && (
          <div
            className={`rounded-2xl border-2 p-6 space-y-3 ${
              getResultBadge(lastResult.result).bg
            }`}
          >
            <div className="flex items-center gap-3">
              {React.createElement(getResultBadge(lastResult.result).icon, {
                className: 'w-7 h-7 shrink-0',
              })}
              <div>
                <h3 className="font-display font-black text-xl tracking-tight">
                  {getResultBadge(lastResult.result).title}
                </h3>
                <p className="text-xs font-medium mt-0.5">{lastResult.message}</p>
              </div>
            </div>

            {lastResult.ticketCode && (
              <div className="pt-3 border-t border-current/20 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div>
                  <span className="opacity-75 block text-[10px]">Code</span>
                  <strong className="font-mono">{lastResult.ticketCode}</strong>
                </div>
                <div>
                  <span className="opacity-75 block text-[10px]">Holder</span>
                  <strong>{lastResult.holderName || 'N/A'}</strong>
                </div>
                <div>
                  <span className="opacity-75 block text-[10px]">Category</span>
                  <strong>{lastResult.categoryName || 'General'}</strong>
                </div>
                <div>
                  <span className="opacity-75 block text-[10px]">Gate</span>
                  <strong>{lastResult.redeemedGate || gateName}</strong>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Recent Gate Redemptions Log */}
      {scanHistory.length > 0 && (
        <div className="rounded-2xl bg-[#121722] border border-white/10 p-6 space-y-4">
          <h2 className="font-display font-bold text-lg text-white">
            Current Session Scan Audit (Recent 20 Entries)
          </h2>
          <div className="divide-y divide-white/5 text-xs">
            {scanHistory.map((h, i) => (
              <div key={i} className="py-2.5 flex items-center justify-between gap-3">
                <div>
                  <strong className="text-white font-mono">{h.ticketCode || 'UNKNOWN'}</strong>{' '}
                  <span className="text-slate-400">— {h.holderName || 'Visitor'}</span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    h.result === 'VALID_ACCEPTED'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-red-500/20 text-red-300'
                  }`}
                >
                  {h.result}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
