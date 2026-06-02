import React, { useState } from 'react';
import { DollarSign, TrendingUp, TrendingDown, MapPin, Truck } from 'lucide-react';
import type { Shipment } from '../../types';
import clsx from 'clsx';

// Regional base cost rates per km (in INR)
const REGION_RATES: Record<string, { ratePerKm: number; currency: string; color: string; flag: string }> = {
  'India':         { ratePerKm: 65,   currency: 'INR', color: 'text-orange-400',  flag: '🇮🇳' },
  'China':         { ratePerKm: 90,   currency: 'INR', color: 'text-red-400',     flag: '🇨🇳' },
  'USA':           { ratePerKm: 210,  currency: 'INR', color: 'text-blue-400',    flag: '🇺🇸' },
  'Europe':        { ratePerKm: 185,  currency: 'INR', color: 'text-yellow-400',  flag: '🇪🇺' },
  'Middle East':   { ratePerKm: 130,  currency: 'INR', color: 'text-amber-400',   flag: '🌍' },
  'Southeast Asia':{ ratePerKm: 82,   currency: 'INR', color: 'text-green-400',   flag: '🌏' },
  'Africa':        { ratePerKm: 108,  currency: 'INR', color: 'text-lime-400',    flag: '🌍' },
  'Default':       { ratePerKm: 125,  currency: 'INR', color: 'text-gray-400',    flag: '🌐' },
};

const STATUS_MULTIPLIER: Record<string, number> = {
  delayed:    1.35,  // 35% surcharge for delays
  in_transit: 1.0,
  pending:    0.9,   // discount for pending (not dispatched yet)
  delivered:  1.0,
};

function getRegion(location: string): string {
  const l = location.toLowerCase();
  if (l.includes('mumbai') || l.includes('delhi') || l.includes('chennai') || l.includes('bengaluru') || l.includes('india')) return 'India';
  if (l.includes('china') || l.includes('beijing') || l.includes('shanghai') || l.includes('shenzhen')) return 'China';
  if (l.includes('usa') || l.includes('new york') || l.includes('los angeles') || l.includes('chicago')) return 'USA';
  if (l.includes('germany') || l.includes('france') || l.includes('london') || l.includes('europe') || l.includes('uk')) return 'Europe';
  if (l.includes('dubai') || l.includes('saudi') || l.includes('gulf') || l.includes('middle east')) return 'Middle East';
  if (l.includes('singapore') || l.includes('bangkok') || l.includes('jakarta') || l.includes('vietnam')) return 'Southeast Asia';
  if (l.includes('africa') || l.includes('nigeria') || l.includes('kenya') || l.includes('egypt')) return 'Africa';
  return 'Default';
}

// Approximate straight-line distance (in km) based on known city pairs
function estimateDistanceKm(origin: string, dest: string): number {
  const key = `${origin.toLowerCase()}-${dest.toLowerCase()}`;
  const known: Record<string, number> = {
    'mumbai-delhi': 1150, 'delhi-mumbai': 1150,
    'chennai-bengaluru': 345, 'bengaluru-chennai': 345,
    'mumbai-chennai': 1338, 'chennai-mumbai': 1338,
  };
  if (known[key]) return known[key];
  // fallback: random deterministic distance from shipment string
  let hash = 0;
  for (const c of (origin + dest)) hash = ((hash << 5) - hash) + c.charCodeAt(0);
  return 300 + (Math.abs(hash) % 4700); // 300–5000 km
}

function calcCost(s: Shipment) {
  const region = getRegion(s.origin);
  const rate = REGION_RATES[region] || REGION_RATES['Default'];
  const distKm = estimateDistanceKm(s.origin, s.destination);
  const multiplier = STATUS_MULTIPLIER[s.status] ?? 1.0;
  const baseCost = distKm * rate.ratePerKm;
  const total = baseCost * multiplier;
  return { region, rate, distKm, baseCost, total, multiplier };
}

const SORT_KEYS = ['cost', 'distance', 'region'] as const;
type SortKey = typeof SORT_KEYS[number];

export default function TripCost({ shipments }: { shipments: Shipment[] }) {
  const [sortKey, setSortKey] = useState<SortKey>('cost');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const rows = shipments.map(s => ({ s, ...calcCost(s) }));

  const sorted = [...rows].sort((a, b) => {
    let va = 0, vb = 0;
    if (sortKey === 'cost')     { va = a.total;   vb = b.total; }
    if (sortKey === 'distance') { va = a.distKm;  vb = b.distKm; }
    if (sortKey === 'region')   { va = a.region.charCodeAt(0); vb = b.region.charCodeAt(0); }
    return sortDir === 'desc' ? vb - va : va - vb;
  });

  const totalCost = rows.reduce((sum, r) => sum + r.total, 0);
  const avgCost   = rows.length ? totalCost / rows.length : 0;
  const maxRow    = rows.reduce((m, r) => r.total > m.total ? r : m, rows[0]);
  const minRow    = rows.reduce((m, r) => r.total < m.total ? r : m, rows[0]);

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortKey(k); setSortDir('desc'); }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-navy-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <DollarSign size={16} className="text-teal" />
          <h2 className="text-sm font-semibold text-white">Trip Cost by Region</h2>
        </div>
        <span className="text-[10px] text-gray-500">{shipments.length} shipments</span>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 p-4 shrink-0">
        <div className="bg-navy-800/60 border border-navy-700/50 rounded-xl p-3">
          <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Total Fleet Cost</p>
          <p className="text-lg font-bold text-teal">₹{totalCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
        </div>
        <div className="bg-navy-800/60 border border-navy-700/50 rounded-xl p-3">
          <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Avg Per Trip</p>
          <p className="text-lg font-bold text-blue-400">₹{avgCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
        </div>
        <div className="bg-navy-800/60 border border-navy-700/50 rounded-xl p-3">
          <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Highest Cost</p>
          <p className="text-lg font-bold text-sw-amber">
            {maxRow ? `₹${maxRow.total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : '—'}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-navy-900/95 backdrop-blur-sm border-b border-navy-800 z-10">
            <tr className="text-[10px] text-gray-400 uppercase tracking-wider">
              <th className="text-left px-4 py-3">Shipment</th>
              <th
                className="text-left px-4 py-3 cursor-pointer hover:text-teal transition-colors"
                onClick={() => toggleSort('region')}
              >
                Region {sortKey === 'region' ? (sortDir === 'desc' ? '↓' : '↑') : ''}
              </th>
              <th
                className="text-left px-4 py-3 cursor-pointer hover:text-teal transition-colors"
                onClick={() => toggleSort('distance')}
              >
                Distance {sortKey === 'distance' ? (sortDir === 'desc' ? '↓' : '↑') : ''}
              </th>
              <th className="text-left px-4 py-3">Status</th>
              <th
                className="text-left px-4 py-3 cursor-pointer hover:text-teal transition-colors"
                onClick={() => toggleSort('cost')}
              >
                Trip Cost {sortKey === 'cost' ? (sortDir === 'desc' ? '↓' : '↑') : ''}
              </th>
              <th className="text-left px-4 py-3">Cost Bar</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(({ s, region, rate, distKm, total, multiplier }) => {
              const isHighest = maxRow && s.id === maxRow.s.id;
              const isLowest  = minRow && s.id === minRow.s.id;
              const barPct = maxRow ? (total / maxRow.total) * 100 : 0;
              return (
                <tr key={s.id} className="border-b border-navy-800/50 hover:bg-navy-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Truck size={12} className="text-teal shrink-0" />
                      <div>
                        <p className="font-mono text-xs text-teal">{s.order_id}</p>
                        <p className="text-[10px] text-gray-500">{s.carrier}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-base">{rate.flag}</span>
                      <span className={clsx('text-xs font-medium', rate.color)}>{region}</span>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-0.5 flex items-center gap-1">
                      <MapPin size={9} /> {s.origin} → {s.destination}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-300">
                    {distKm.toLocaleString()} km
                  </td>
                  <td className="px-4 py-3">
                    <span className={clsx(
                      'text-[10px] px-2 py-0.5 rounded-full border font-medium capitalize',
                      s.status === 'delayed'    ? 'text-sw-red bg-sw-red/10 border-sw-red/30' :
                      s.status === 'in_transit' ? 'text-teal bg-teal/10 border-teal/30' :
                                                   'text-gray-400 bg-gray-400/10 border-gray-600'
                    )}>
                      {s.status.replace('_', ' ')}
                    </span>
                    {multiplier > 1 && (
                      <p className="text-[9px] text-sw-red mt-0.5 flex items-center gap-0.5">
                        <TrendingUp size={9} /> +{Math.round((multiplier - 1) * 100)}% surcharge
                      </p>
                    )}
                    {multiplier < 1 && (
                      <p className="text-[9px] text-teal mt-0.5 flex items-center gap-0.5">
                        <TrendingDown size={9} /> {Math.round((1 - multiplier) * 100)}% discount
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className={clsx(
                        'text-sm font-bold',
                        isHighest ? 'text-sw-red' : isLowest ? 'text-teal' : 'text-white'
                      )}>
                        ₹{total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </span>
                      {isHighest && <span className="text-[9px] text-sw-red font-medium">HIGHEST</span>}
                      {isLowest  && <span className="text-[9px] text-teal font-medium">LOWEST</span>}
                    </div>
                    <p className="text-[10px] text-gray-500">₹{rate.ratePerKm}/km</p>
                  </td>
                  <td className="px-4 py-3 w-32">
                    <div className="h-2 bg-navy-800 rounded-full overflow-hidden w-28">
                      <div
                        className={clsx('h-full rounded-full transition-all', isHighest ? 'bg-sw-red' : 'bg-gradient-to-r from-teal to-blue-400')}
                        style={{ width: `${barPct}%` }}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {sorted.length === 0 && (
          <div className="p-12 text-center text-gray-500 text-sm">No shipments found</div>
        )}
      </div>
    </div>
  );
}
