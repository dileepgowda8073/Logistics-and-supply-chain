import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useStore } from '../../store';
import type { Shipment } from '../../types';

function getRiskColor(status: string): string {
  if (status === 'delayed') return '#EF4444'; // red
  if (status === 'in_transit') return '#00E5C3'; // teal
  return '#F59E0B'; // amber
}

// Custom DivIcon for Leaflet
const createCustomIcon = (status: string, isPulsing: boolean) => {
  const color = getRiskColor(status);
  const pulseStyle = isPulsing 
    ? `box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); animation: pulse-ring 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;` 
    : `box-shadow: 0 0 8px ${color}60;`;

  const truckSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M10 17h4V5H2v12h3"/>
      <path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5"/>
      <path d="M14 17h1"/>
      <circle cx="7.5" cy="17.5" r="2.5"/>
      <circle cx="17.5" cy="17.5" r="2.5"/>
    </svg>
  `;

  return L.divIcon({
    className: 'custom-leaflet-icon',
    html: `<div style="
      width: 22px; 
      height: 22px; 
      border-radius: 4px; 
      background: ${color}; 
      border: 1px solid rgba(255,255,255,0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      ${pulseStyle}
    ">${truckSvg}</div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11]
  });
};

const createEndpointIcon = (type: 'origin' | 'destination') => {
  const color = type === 'origin' ? '#3b82f6' : '#8b5cf6'; // blue for origin, purple for dest
  return L.divIcon({
    className: 'custom-endpoint-icon',
    html: `<div style="
      width: 10px; 
      height: 10px; 
      border-radius: 2px; 
      background: ${color}; 
      border: 1px solid rgba(255,255,255,0.8);
      box-shadow: 0 0 4px ${color}60;
    "></div>`,
    iconSize: [10, 10],
    iconAnchor: [5, 5]
  });
};

function LiveMapContent({ shipments }: { shipments: Shipment[] }) {
  const livePositions = useStore((s) => s.livePositions);
  const pulsingIds = useStore((s) => s.pulsingIds);
  const setSelectedShipment = useStore((s) => s.setSelectedShipment);
  const map = useMap();

  const activeShipments = useMemo(() => {
    return shipments.filter(
      (s) => s.current_lat && s.current_lng && ['in_transit', 'delayed', 'pending'].includes(s.status)
    );
  }, [shipments]);

  // Handle auto-fit bounds on initial load if we have shipments
  const [hasFitBounds, setHasFitBounds] = useState(false);
  useEffect(() => {
    if (!hasFitBounds && activeShipments.length > 0) {
      const bounds = L.latLngBounds(activeShipments.map(s => [s.current_lat, s.current_lng]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 5 });
      setHasFitBounds(true);
    }
  }, [activeShipments, map, hasFitBounds]);

  return (
    <>
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
      />
      
      {/* Route Lines & Endpoints */}
      {activeShipments.map(s => {
        if (s.origin_lat && s.origin_lng && s.dest_lat && s.dest_lng) {
          return (
            <React.Fragment key={`route-group-${s.id}`}>
              <Polyline
                positions={[
                  [s.origin_lat, s.origin_lng],
                  [s.dest_lat, s.dest_lng]
                ]}
                pathOptions={{
                  color: getRiskColor(s.status),
                  weight: 2,
                  opacity: 0.4,
                  dashArray: '4, 4'
                }}
              />
              <Marker 
                position={[s.origin_lat, s.origin_lng]} 
                icon={createEndpointIcon('origin')}
              >
                <Popup className="sw-popup"><div className="font-sans text-xs"><b>Origin:</b> {s.origin}</div></Popup>
              </Marker>
              <Marker 
                position={[s.dest_lat, s.dest_lng]} 
                icon={createEndpointIcon('destination')}
              >
                <Popup className="sw-popup"><div className="font-sans text-xs"><b>Destination:</b> {s.destination}</div></Popup>
              </Marker>
            </React.Fragment>
          );
        }
        return null;
      })}

      {/* Shipment Markers */}
      {activeShipments.map((s) => {
        // Use live position if available, fallback to initial state
        const livePos = livePositions[s.id];
        const lat = livePos?.lat ?? s.current_lat;
        const lng = livePos?.lng ?? s.current_lng;
        
        return (
          <Marker
            key={s.id}
            position={[lat, lng]}
            icon={createCustomIcon(s.status, pulsingIds.has(s.id))}
            eventHandlers={{
              click: () => setSelectedShipment(s.id),
            }}
          >
            <Popup className="sw-popup">
              <div className="font-sans">
                <p className="font-semibold text-gray-800 m-0 pb-1">{s.order_id}</p>
                <p className="text-gray-600 text-xs m-0">{s.carrier}</p>
                <p className="text-gray-600 text-xs mt-1">{s.origin} &rarr; {s.destination}</p>
                <span style={{ color: getRiskColor(s.status) }} className="text-xs font-medium uppercase mt-1 block">
                  {s.status.replace('_', ' ')}
                </span>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}

export default function LiveMap({ shipments }: { shipments: Shipment[] }) {
  // Inject the pulse animation into the document head
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes pulse-ring {
        0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
        70% { transform: scale(1.5); box-shadow: 0 0 0 15px rgba(239, 68, 68, 0); }
        100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
      }
      .sw-popup .leaflet-popup-content-wrapper {
        background: #f8fafc;
        border-radius: 8px;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
      }
      .sw-popup .leaflet-popup-tip {
        background: #f8fafc;
      }
      .leaflet-container {
        background: #0b1120;
      }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  return (
    <div className="h-full w-full rounded-xl overflow-hidden relative z-0">
      <MapContainer
        center={[20, 0]}
        zoom={2}
        style={{ height: '100%', width: '100%', zIndex: 0 }}
        zoomControl={false}
      >
        <LiveMapContent shipments={shipments} />
      </MapContainer>
    </div>
  );
}
