export interface Shipment {
  id: string;
  order_id: string;
  carrier: string;
  origin: string;
  destination: string;
  origin_lat?: number;
  origin_lng?: number;
  dest_lat?: number;
  dest_lng?: number;
  origin_port: string;
  dest_port: string;
  status: 'pending' | 'in_transit' | 'delayed' | 'delivered' | 'cancelled';
  current_lat: number;
  current_lng: number;
  eta: string;
  distance_km: number;
  weather_score: number;
  customs_risk: number;
  congestion_index: number;
  created_at: string;
  updated_at: string;
}

export interface ShipmentPosition {
  shipmentId: string;
  lat: number;
  lng: number;
  speed: number;
  eta: string;
  status: string;
}

export interface ShipmentEvent {
  id: string;
  shipment_id: string;
  event_type: string;
  lat: number;
  lng: number;
  notes: string;
  ts: string;
}

export interface Prediction {
  id: string;
  shipment_id: string;
  predicted_delay_mins: number;
  confidence: number;
  top_causes: string[];
  model_version: string;
  created_at: string;
}

export interface Alert {
  id: string;
  shipment_id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  acked: boolean;
  created_at: string;
}

export interface ReplanRec {
  id: string;
  sku_id: string;
  action: string;
  qty: number;
  supplier_id: string;
  supplier_name?: string;
  lead_time_days?: number;
  supplier_country?: string;
  estimated_cost: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'approved' | 'rejected' | 'expired';
  reason?: string;
  expires_at: string;
  created_at: string;
  resolved_at?: string;
}

export interface InventoryItem {
  id: string;
  sku_id: string;
  warehouse_id: string;
  warehouse_name: string;
  warehouse_location?: string;
  quantity: number;
  safety_stock: number;
  daily_demand: number;
  reorder_point: number;
  last_replenished_at: string;
}

export interface KPISnapshot {
  onTimeRate: number;
  avgDelay: number;
  fillRate: number;
  openAlerts: number;
  criticalAlerts: number;
  activeShipments: number;
}

export interface KPITrend {
  timestamp: string;
  onTimeRate: number;
  avgDelay: number;
  fillRate: number;
  activeShipments: number;
}

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'planner' | 'viewer';
  name: string;
}

export interface SocketEvents {
  'shipment:position': ShipmentPosition;
  'delay:alert': {
    shipmentId: string;
    predictedDelayMins: number;
    confidence: number;
    cause: string;
  };
  'inventory:update': {
    skuId: string;
    warehouseId: string;
    currentStock: number;
    reorderPoint: number;
  };
  'kpi:refresh': KPISnapshot;
  'replan:suggestion': ReplanRec;
}
