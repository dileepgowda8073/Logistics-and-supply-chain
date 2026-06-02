import React, { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import type { Shipment } from '../../types';
import clsx from 'clsx';

const RISK_CONFIG: Record<string, string> = {
  critical: 'text-sw-red bg-sw-red/10 border-sw-red/30',
  high: 'text-sw-amber bg-sw-amber/10 border-sw-amber/30',
  medium: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
  low: 'text-teal bg-teal/10 border-teal/30',
};

function getRisk(delayMins: number): 'critical' | 'high' | 'medium' | 'low' {
  if (delayMins > 480) return 'critical';
  if (delayMins > 240) return 'high';
  if (delayMins > 120) return 'medium';
  return 'low';
}

interface Row {
  shipment: Shipment;
  delayMins: number;
  confidence: number;
  causes: string[];
}

// Deterministic seeded random based on shipment ID
function seededRandom(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    const char = id.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash % 1000) / 1000;
}

const CAUSE_OPTIONS = [
  'Weather disruption', 'Port congestion', 'Customs delay',
  'Carrier issue', 'Peak season', 'Route deviation',
  'Documentation hold', 'Equipment shortage',
];

export default function PredictionTable({ shipments }: { shipments: Shipment[] }) {
  const [sortKey, setSortKey] = useState<'delay' | 'confidence'>('delay');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [riskFilter, setRiskFilter] = useState<string>('all');

  const rows: Row[] = shipments.map((s) => {
    const rand = seededRandom(s.id);
    const isDelayed = s.status === 'delayed';
    const delayMins = isDelayed
      ? Math.round(120 + rand * 400)
      : Math.round(rand * 110);
    return {
      shipment: s,
      delayMins,
      confidence: Math.round((0.6 + rand * 0.35) * 100) / 100,
      causes: CAUSE_OPTIONS.filter((_, i) => seededRandom(s.id + i) > 0.6).slice(0, 3),
    };
  });

  const filtered = rows
    .filter((r) => riskFilter === 'all' || getRisk(r.delayMins) === riskFilter)
    .sort((a, b) => {
      const va = sortKey === 'delay' ? a.delayMins : a.confidence;
      const vb = sortKey === 'delay' ? b.delayMins : b.confidence;
      return sortDir === 'desc' ? vb - va : va - vb;
    });

  const toggleSort = (k: typeof sortKey) => {
    if (sortKey === k) setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    else { setSortKey(k); setSortDir('desc'); }
  };

  const SortIcon = ({ k }: { k: typeof sortKey }) =>
    sortKey === k ? (
      sortDir === 'desc' ? <ChevronDown size={12} /> : <ChevronUp size={12} />
    ) : null;

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-navy-800 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">Delay Predictions</h2>
        <div className="flex gap-1.5">
          {['all', 'critical', 'high', 'medium', 'low'].map((r) => (
            <button
              key={r}
              onClick={() => setRiskFilter(r)}
              className={clsx(
                'text-[10px] px-2 py-1 rounded-full border transition-all capitalize',
                riskFilter === r
                  ? 'bg-teal/20 border-teal text-teal'
                  : 'border-navy-700 text-gray-400 hover:border-gray-500'
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-navy-900/95 backdrop-blur-sm border-b border-navy-800 z-10">
            <tr className="text-[10px] text-gray-400 uppercase tracking-wider">
              <th className="text-left px-4 py-3">Shipment</th>
              <th className="text-left px-4 py-3">Route</th>
              <th className="text-left px-4 py-3">
                <button onClick={() => toggleSort('delay')} className="flex items-center gap-1 hover:text-teal transition-colors">
                  Predicted Delay <SortIcon k="delay" />
                </button>
              </th>
              <th className="text-left px-4 py-3">
                <button onClick={() => toggleSort('confidence')} className="flex items-center gap-1 hover:text-teal transition-colors">
                  Confidence <SortIcon k="confidence" />
                </button>
              </th>
              <th className="text-left px-4 py-3">Top Causes</th>
              <th className="text-left px-4 py-3">Risk</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(({ shipment: s, delayMins, confidence, causes }) => {
              const risk = getRisk(delayMins);
              return (
                <tr key={s.id} className="border-b border-navy-800/50 hover:bg-navy-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-mono text-xs text-teal">{s.order_id}</p>
                    <p className="text-[10px] text-gray-400">{s.carrier}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-300 max-w-[180px] truncate">
                    {s.origin} → {s.destination}
                  </td>
                  <td className="px-4 py-3">
                    <span className={clsx(
                      'font-bold text-sm',
                      delayMins > 240 ? 'text-sw-red' : delayMins > 120 ? 'text-sw-amber' : 'text-teal'
                    )}>
                      {delayMins} min
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-navy-800 rounded-full h-1.5 w-20">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-teal to-blue-400 transition-all"
                          style={{ width: `${confidence * 100}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-gray-400 w-8">{Math.round(confidence * 100)}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {causes.map((c) => (
                        <span key={c} className="text-[10px] bg-navy-800 text-gray-300 px-1.5 py-0.5 rounded border border-navy-700/50">
                          {c}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={clsx('text-[10px] px-2 py-0.5 rounded-full border capitalize font-medium', RISK_CONFIG[risk])}>
                      {risk}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="p-12 text-center text-gray-500 text-sm">No predictions match the filter</div>
        )}
      </div>
    </div>
  );
}
