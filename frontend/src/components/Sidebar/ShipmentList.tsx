import React, { useState } from 'react';
import { Search, Truck, Ship, Package } from 'lucide-react';
import { useStore } from '../../store';
import type { Shipment } from '../../types';
import { format } from 'date-fns';
import clsx from 'clsx';

const STATUS_COLORS: Record<string, string> = {
  in_transit: 'text-teal bg-teal/10 border-teal/30',
  delayed: 'text-sw-red bg-sw-red/10 border-sw-red/30',
  pending: 'text-sw-amber bg-sw-amber/10 border-sw-amber/30',
  delivered: 'text-green-400 bg-green-400/10 border-green-400/30',
  cancelled: 'text-gray-400 bg-gray-400/10 border-gray-400/30',
};

const CARRIER_ICONS: Record<string, React.ReactNode> = {
  'Maersk': <Ship size={14} />,
  'MSC': <Ship size={14} />,
  'FedEx': <Truck size={14} />,
  'UPS': <Truck size={14} />,
  'DHL': <Package size={14} />,
};

const STATUSES = ['All', 'in_transit', 'delayed', 'pending', 'delivered'];

export default function ShipmentList({ shipments }: { shipments: Shipment[] }) {
  const selectedShipmentId = useStore((s) => s.selectedShipmentId);
  const setSelectedShipment = useStore((s) => s.setSelectedShipment);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const filtered = shipments.filter((s) => {
    const matchSearch =
      !search ||
      s.order_id.toLowerCase().includes(search.toLowerCase()) ||
      s.carrier.toLowerCase().includes(search.toLowerCase()) ||
      s.origin.toLowerCase().includes(search.toLowerCase()) ||
      s.destination.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 space-y-2">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search shipments..."
            className="w-full bg-navy-800 border border-navy-700 rounded-lg pl-8 pr-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-teal/50 transition-colors"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={clsx(
                'px-2 py-0.5 rounded-full text-[10px] font-medium border transition-all capitalize',
                statusFilter === s
                  ? 'bg-teal/20 border-teal text-teal'
                  : 'border-navy-700 text-gray-400 hover:border-gray-500'
              )}
            >
              {s === 'All' ? 'All' : s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.map((s) => (
          <button
            key={s.id}
            onClick={() => setSelectedShipment(s.id)}
            className={clsx(
              'w-full text-left p-3 border-b border-navy-800/50 hover:bg-navy-800/40 transition-all',
              selectedShipmentId === s.id && 'bg-teal/5 border-l-2 border-l-teal'
            )}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-mono text-gray-400">{s.order_id}</span>
              <span
                className={clsx(
                  'text-[10px] px-1.5 py-0.5 rounded-full border capitalize',
                  STATUS_COLORS[s.status] || 'text-gray-400'
                )}
              >
                {s.status.replace('_', ' ')}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-white font-medium">
              {CARRIER_ICONS[s.carrier] || <Truck size={14} />}
              <span className="truncate">{s.carrier}</span>
            </div>
            <div className="text-xs text-gray-400 truncate mt-0.5">
              {s.origin} → {s.destination}
            </div>
            {s.eta && (
              <div className="text-[10px] text-gray-500 mt-0.5">
                ETA: {format(new Date(s.eta), 'MMM d, HH:mm')}
              </div>
            )}
          </button>
        ))}
        {filtered.length === 0 && (
          <div className="p-6 text-center text-gray-500 text-sm">
            No shipments found
          </div>
        )}
      </div>
    </div>
  );
}
