import { create } from 'zustand';
import type { Shipment, ShipmentPosition, Alert, ReplanRec, KPISnapshot, KPITrend, InventoryItem } from '../types';

interface AppState {
  // Shipments
  shipments: Shipment[];
  selectedShipmentId: string | null;
  livePositions: Record<string, ShipmentPosition>;
  shipmentFilter: { status?: string; carrier?: string; search?: string };
  pulsingIds: Set<string>;
  setShipments: (s: Shipment[]) => void;
  setSelectedShipment: (id: string | null) => void;
  updatePosition: (pos: ShipmentPosition) => void;
  setShipmentFilter: (f: Partial<AppState['shipmentFilter']>) => void;
  addPulse: (id: string) => void;
  removePulse: (id: string) => void;

  // Alerts
  alerts: Alert[];
  unreadCount: number;
  setAlerts: (a: Alert[]) => void;
  addAlert: (a: Alert) => void;
  ackAlert: (id: string) => void;
  incrementUnread: () => void;
  resetUnread: () => void;

  // Replans
  replans: ReplanRec[];
  newReplanIds: Set<string>;
  setReplans: (r: ReplanRec[]) => void;
  addReplan: (r: ReplanRec) => void;
  updateReplan: (id: string, updates: Partial<ReplanRec>) => void;
  markReplanSeen: (id: string) => void;

  // KPIs
  kpis: KPISnapshot | null;
  kpiTrend: KPITrend[];
  setKPIs: (k: KPISnapshot) => void;
  setKPITrend: (t: KPITrend[]) => void;

  // Inventory
  inventory: InventoryItem[];
  setInventory: (items: InventoryItem[]) => void;

  // Auth
  user: { id: string; email: string; role: string; name: string } | null;
  token: string | null;
  setAuth: (user: AppState['user'], token: string) => void;
  logout: () => void;

  // Regions & Routes
  generateRegion: (country: string) => Promise<void>;
  generateCustomRoute: (origin: string, dest: string) => Promise<void>;
}

export const useStore = create<AppState>((set) => ({
  // Shipments
  shipments: [],
  selectedShipmentId: null,
  livePositions: {},
  shipmentFilter: {},
  pulsingIds: new Set(),
  setShipments: (shipments) => set({ shipments }),
  setSelectedShipment: (id) => set({ selectedShipmentId: id }),
  updatePosition: (pos) =>
    set((state) => ({
      livePositions: { ...state.livePositions, [pos.shipmentId]: pos },
    })),
  setShipmentFilter: (f) =>
    set((state) => ({
      shipmentFilter: { ...state.shipmentFilter, ...f },
    })),
  addPulse: (id) =>
    set((state) => {
      const s = new Set(state.pulsingIds);
      s.add(id);
      return { pulsingIds: s };
    }),
  removePulse: (id) =>
    set((state) => {
      const s = new Set(state.pulsingIds);
      s.delete(id);
      return { pulsingIds: s };
    }),

  // Alerts
  alerts: [],
  unreadCount: 0,
  setAlerts: (alerts) => set({ alerts }),
  addAlert: (alert) =>
    set((state) => ({
      alerts: [alert, ...state.alerts].slice(0, 100),
      unreadCount: state.unreadCount + 1,
    })),
  ackAlert: (id) =>
    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.id === id ? { ...a, acked: true } : a
      ),
    })),
  incrementUnread: () =>
    set((state) => ({ unreadCount: state.unreadCount + 1 })),
  resetUnread: () => set({ unreadCount: 0 }),

  // Replans
  replans: [],
  newReplanIds: new Set(),
  setReplans: (replans) => set({ replans }),
  addReplan: (replan) =>
    set((state) => {
      const s = new Set(state.newReplanIds);
      s.add(replan.id);
      return { replans: [replan, ...state.replans], newReplanIds: s };
    }),
  updateReplan: (id, updates) =>
    set((state) => ({
      replans: state.replans.map((r) =>
        r.id === id ? { ...r, ...updates } : r
      ),
    })),
  markReplanSeen: (id) =>
    set((state) => {
      const s = new Set(state.newReplanIds);
      s.delete(id);
      return { newReplanIds: s };
    }),

  // KPIs
  kpis: null,
  kpiTrend: [],
  setKPIs: (kpis) => set({ kpis }),
  setKPITrend: (kpiTrend) => set({ kpiTrend }),

  // Inventory
  inventory: [],
  setInventory: (inventory) => set({ inventory }),

  // Auth
  user: (() => {
    try {
      const stored = localStorage.getItem('sw_user');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  })(),
  token: localStorage.getItem('sw_token'),
  setAuth: (user, token) => {
    // Always wipe old session first so stale name/role never persists
    localStorage.removeItem('sw_user');
    localStorage.removeItem('sw_token');
    localStorage.setItem('sw_token', token);
    localStorage.setItem('sw_user', JSON.stringify(user));
    set({
  user: {
    id: user?.id || "",
    email: user?.email || "",
    role: user?.role || "",
    name: user?.name || "",
  },
  token,
});
  },
  logout: () => {
    localStorage.removeItem('sw_token');
    localStorage.removeItem('sw_user');
    set({ user: null, token: null });
  },

  // Regions & Routes
  generateRegion: async (country) => {
    const { token } = useStore.getState();
    const res = await fetch('http://localhost:3001/api/regions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
      body: JSON.stringify({ country })
    });
    if (!res.ok) throw new Error('Failed to generate region');
    
    // Refresh shipments and alerts
    const [shipRes, alertRes] = await Promise.all([
      fetch('http://localhost:3001/api/shipments'),
      fetch('http://localhost:3001/api/alerts')
    ]);
    const shipData = await shipRes.json();
    const alertData = await alertRes.json();
    set({ shipments: shipData.data, alerts: alertData.data });
  },

  generateCustomRoute: async (origin, dest) => {
    const { token } = useStore.getState();
    const res = await fetch('http://localhost:3001/api/custom-route', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
      body: JSON.stringify({ origin, destination: dest })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to generate custom route');
    
    // Refresh shipments
    const shipRes = await fetch('http://localhost:3001/api/shipments');
    const shipData = await shipRes.json();
    set({ shipments: shipData.data });
  },
}));
