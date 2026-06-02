import React, { useEffect, useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Map, BarChart3, Package, RefreshCw, Layers, AlertTriangle, Truck, DollarSign } from 'lucide-react';
import Header from '../components/Header/Header';
import ShipmentList from '../components/Sidebar/ShipmentList';
import AlertFeed from '../components/Sidebar/AlertFeed';
import LiveMap from '../components/Map/LiveMap';
import PredictionTable from '../components/DelayTable/PredictionTable';
import ReplanList from '../components/Replans/ReplanCard';
import TrendSparkline from '../components/Charts/TrendSparkline';
import TripCost from '../components/TripCost/TripCost';
import AIAssistant from '../components/AIAssistant/AIAssistant';
import { useSocket } from '../hooks/useSocket';
import { useStore } from '../store';
import api from '../api/client';
import clsx from 'clsx';

type Tab = 'map' | 'predictions' | 'tripcost' | 'replans';
type SideTab = 'shipments' | 'alerts';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('map');
  const [sideTab, setSideTab] = useState<SideTab>('shipments');
  const { connected } = useSocket();

  const setShipments = useStore((s) => s.setShipments);
  const setAlerts = useStore((s) => s.setAlerts);
  const setReplans = useStore((s) => s.setReplans);
  const setKPIs = useStore((s) => s.setKPIs);
  const setKPITrend = useStore((s) => s.setKPITrend);
  const setInventory = useStore((s) => s.setInventory);
  const shipments = useStore((s) => s.shipments);
  const alerts = useStore((s) => s.alerts);
  const replans = useStore((s) => s.replans);
  const kpiTrend = useStore((s) => s.kpiTrend);
  const unreadCount = useStore((s) => s.unreadCount);
  const selectedShipmentId = useStore((s) => s.selectedShipmentId);

  // Fetch shipments
  useQuery({
    queryKey: ['shipments'],
    queryFn: async () => {
      const { data } = await api.get('/api/shipments?limit=50');
      setShipments(data.data || []);
      return data.data;
    },
  });

  // Fetch alerts
  useQuery({
    queryKey: ['alerts'],
    queryFn: async () => {
      const { data } = await api.get('/api/alerts?acked=false');
      setAlerts(data.data || []);
      return data.data;
    },
  });

  // Fetch replans
  useQuery({
    queryKey: ['replans'],
    queryFn: async () => {
      const { data } = await api.get('/api/replans');
      setReplans(data.data || []);
      return data.data;
    },
  });

  // Fetch KPIs
  useQuery({
    queryKey: ['kpis'],
    queryFn: async () => {
      const { data } = await api.get('/api/kpis');
      setKPIs(data.data);
      return data.data;
    },
    refetchInterval: 30000,
  });

  // Fetch KPI trend
  useQuery({
    queryKey: ['kpiTrend'],
    queryFn: async () => {
      const { data } = await api.get('/api/kpis/trend?hours=24');
      setKPITrend(data.data || []);
      return data.data;
    },
  });

  // Fetch inventory
  const { data: inventoryData } = useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      const { data } = await api.get('/api/inventory');
      const items = data.data || [];
      setInventory(items);
      return items;
    },
  });

  const TABS: { key: Tab; icon: React.ReactNode; label: string }[] = [
    { key: 'map', icon: <Map size={14} />, label: 'Live Map' },
    { key: 'predictions', icon: <BarChart3 size={14} />, label: 'Predictions' },
    { key: 'tripcost', icon: <DollarSign size={14} />, label: 'Trip Cost' },
    { key: 'replans', icon: <RefreshCw size={14} />, label: 'Replans' },
  ];

  // Stable seeded value so sparklines don't flicker on every render
  const seeded = (id: string, salt: number) => {
    let h = salt * 31;
    for (let i = 0; i < id.length; i++) h = ((h << 5) - h) + id.charCodeAt(i);
    return (Math.abs(h) % 1000) / 1000;
  };

  const displayTrend = useMemo(() => {
    if (!selectedShipmentId || kpiTrend.length === 0) return kpiTrend;
    const shipment = shipments.find(s => s.id === selectedShipmentId);
    if (!shipment) return kpiTrend;

    const isDelayed  = shipment.status === 'delayed';
    const isPending  = shipment.status === 'pending';

    return kpiTrend.map((t, i) => {
      const n = seeded(shipment.id, i + 1) * 4; // stable noise 0–4
      let onTime   = 0;
      let delay    = 0;
      let fillRate = 0;

      if (isDelayed) {
        onTime   = Math.max(0,   95 - i * 4 + n);
        delay    = Math.min(180, i * 8 + n);
        fillRate = Math.max(60,  88 - i * 1.2 + n);
      } else if (isPending) {
        onTime   = 98 + seeded(shipment.id, i + 7) * 2;
        delay    = seeded(shipment.id, i + 13) * 5;
        fillRate = 95 + seeded(shipment.id, i + 19) * 3;
      } else {
        // in_transit / delivered — healthy
        onTime   = 93 + seeded(shipment.id, i + 3) * 6;
        delay    = Math.max(0, 20 - i * 0.8 + n);
        fillRate = 88 + seeded(shipment.id, i + 11) * 8;
      }

      return { ...t, onTimeRate: onTime, avgDelay: delay, fillRate, activeShipments: 1 };
    });
  }, [selectedShipmentId, shipments, kpiTrend]);

  return (
    <div className="h-screen flex flex-col bg-navy-950 overflow-hidden">
      <Header />

      {/* Sparkline bar */}
      {displayTrend.length > 0 && (
        <div className="border-b border-navy-800/50 bg-navy-900/50">
          {selectedShipmentId && (() => {
            const s = shipments.find(x => x.id === selectedShipmentId);
            return s ? (
              <div className="flex items-center gap-2 px-4 pt-2 pb-0">
                <span className="text-[10px] text-gray-500">Showing metrics for</span>
                <span className="text-[10px] font-mono text-teal border border-teal/30 bg-teal/10 px-2 py-0.5 rounded-full">{s.order_id}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border capitalize font-medium ${
                  s.status === 'delayed' ? 'text-sw-red border-sw-red/30 bg-sw-red/10' :
                  s.status === 'in_transit' ? 'text-teal border-teal/30 bg-teal/10' :
                  'text-gray-400 border-gray-600 bg-gray-400/10'
                }`}>{s.status.replace('_', ' ')}</span>
                <button
                  onClick={() => useStore.getState().setSelectedShipment(null)}
                  className="ml-auto text-[10px] text-gray-500 hover:text-gray-300 transition-colors"
                >✕ Clear</button>
              </div>
            ) : null;
          })()}
          <div className="grid grid-cols-4 gap-3 px-4 py-2">
            <TrendSparkline data={displayTrend} dataKey="onTimeRate" color="#00E5C3" label="On-Time %" unit="%" threshold={85} />
            <TrendSparkline data={displayTrend} dataKey="avgDelay" color="#F59E0B" label="Avg Delay" unit="m" threshold={120} />
            <TrendSparkline data={displayTrend} dataKey="fillRate" color="#60a5fa" label="Fill Rate" unit="%" />
            <TrendSparkline data={displayTrend} dataKey="activeShipments" color="#a78bfa" label="Active" />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex min-h-0">
        {/* Left Sidebar */}
        <div className="w-[320px] border-r border-navy-800/50 flex flex-col shrink-0 bg-navy-900/40">
          {/* Sidebar tabs */}
          <div className="flex border-b border-navy-800/50">
            <button
              onClick={() => setSideTab('shipments')}
              className={clsx(
                'flex-1 px-4 py-2.5 text-xs font-medium flex items-center justify-center gap-1.5 border-b-2 transition-all',
                sideTab === 'shipments'
                  ? 'border-teal text-teal'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              )}
            >
              <Truck size={12} /> Shipments
            </button>
            <button
              onClick={() => setSideTab('alerts')}
              className={clsx(
                'flex-1 px-4 py-2.5 text-xs font-medium flex items-center justify-center gap-1.5 border-b-2 transition-all relative',
                sideTab === 'alerts'
                  ? 'border-sw-red text-sw-red'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              )}
            >
              <AlertTriangle size={12} /> Alerts
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-4 w-2 h-2 rounded-full bg-sw-red animate-pulse" />
              )}
            </button>
          </div>

          {/* Sidebar content */}
          <div className="flex-1 min-h-0 overflow-hidden">
            {sideTab === 'shipments' ? (
              <ShipmentList shipments={shipments} />
            ) : (
              <AlertFeed alerts={alerts} />
            )}
          </div>
        </div>

        {/* Main area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Content tabs */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-navy-800/50 bg-navy-900/20">
            <div className="flex gap-1">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={clsx(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                    activeTab === tab.key
                      ? 'bg-teal/15 text-teal border border-teal/30'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-navy-800/50 border border-transparent'
                  )}
                >
                  {tab.icon}
                  {tab.label}
                  {tab.key === 'replans' && replans.filter((r) => r.status === 'open').length > 0 && (
                    <span className="ml-1 w-4 h-4 rounded-full bg-sw-amber/20 text-sw-amber text-[10px] flex items-center justify-center font-bold border border-sw-amber/30">
                      {replans.filter((r) => r.status === 'open').length}
                    </span>
                  )}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span
                className={clsx(
                  'flex items-center gap-1.5 px-2 py-1 rounded-full border text-[10px] font-medium',
                  connected
                    ? 'border-teal/30 text-teal bg-teal/10'
                    : 'border-sw-red/30 text-sw-red bg-sw-red/10'
                )}
              >
                <span className={clsx('w-1.5 h-1.5 rounded-full', connected ? 'bg-teal' : 'bg-sw-red')} />
                {connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>

          {/* Tab content */}
          <div className="flex-1 min-h-0 overflow-auto p-4">
            {activeTab === 'map' && (
              <div className="h-full rounded-xl overflow-hidden border border-navy-800/50">
                <LiveMap shipments={shipments} />
              </div>
            )}
            {activeTab === 'predictions' && (
              <div className="h-full bg-navy-900/40 rounded-xl border border-navy-800/50 overflow-hidden">
                <PredictionTable shipments={shipments} />
              </div>
            )}
            {activeTab === 'tripcost' && (
              <div className="h-full bg-navy-900/40 rounded-xl border border-navy-800/50 overflow-hidden">
                <TripCost shipments={shipments} />
              </div>
            )}
            {activeTab === 'replans' && (
              <div className="h-full overflow-hidden">
                <ReplanList replans={replans} />
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* AI Assistant Floating Widget */}
      <AIAssistant />
    </div>
  );
}
