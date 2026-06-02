import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useStore } from '../store';
import type { Alert, ReplanRec } from '../types';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const token = useStore((s) => s.token);
  const updatePosition = useStore((s) => s.updatePosition);
  const addAlert = useStore((s) => s.addAlert);
  const incrementUnread = useStore((s) => s.incrementUnread);
  const setKPIs = useStore((s) => s.setKPIs);
  const addReplan = useStore((s) => s.addReplan);
  const addPulse = useStore((s) => s.addPulse);
  const removePulse = useStore((s) => s.removePulse);

  useEffect(() => {
    if (!token) return;

    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

    const socket = io(`${baseUrl}/live`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      console.log('[Socket] Connected to /live');
    });

    socket.on('disconnect', () => {
      setConnected(false);
      console.log('[Socket] Disconnected');
    });

    socket.on('connect_error', (err) => {
      console.warn('[Socket] Connection error:', err.message);
    });

    socket.on('shipment:position', (data) => {
      updatePosition(data);
      if (data.status === 'delayed') {
        addPulse(data.shipmentId);
        setTimeout(() => removePulse(data.shipmentId), 5000);
      }
    });

    socket.on('delay:alert', (data) => {
      const alert: Alert = {
        id: `alert-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        shipment_id: data.shipmentId,
        type: 'delay_prediction',
        severity:
          data.predictedDelayMins > 360 ? 'critical' :
          data.predictedDelayMins > 240 ? 'high' :
          data.predictedDelayMins > 120 ? 'medium' : 'low',
        message: data.cause || `Predicted delay: ${data.predictedDelayMins} min`,
        acked: false,
        created_at: new Date().toISOString(),
      };
      addAlert(alert);
      incrementUnread();
      addPulse(data.shipmentId);
      setTimeout(() => removePulse(data.shipmentId), 5000);
    });

    socket.on('kpi:refresh', (data) => {
      setKPIs(data);
    });

    socket.on('replan:suggestion', (data: ReplanRec) => {
      addReplan(data);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token]);

  return { connected, socket: socketRef.current };
}
