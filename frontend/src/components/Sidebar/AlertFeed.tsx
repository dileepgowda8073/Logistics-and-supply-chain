import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, AlertOctagon, Info, CheckCircle, Check } from 'lucide-react';
import { useStore } from '../../store';
import type { Alert } from '../../types';
import { formatDistanceToNow } from 'date-fns';
import api from '../../api/client';
import clsx from 'clsx';

const SEVERITY_CONFIG = {
  critical: { icon: AlertOctagon, color: 'text-sw-red', bg: 'bg-sw-red/10', border: 'border-sw-red/30' },
  high: { icon: AlertTriangle, color: 'text-sw-amber', bg: 'bg-sw-amber/10', border: 'border-sw-amber/30' },
  medium: { icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/30' },
  low: { icon: Info, color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/30' },
};

export default function AlertFeed({ alerts }: { alerts: Alert[] }) {
  const ackAlert = useStore((s) => s.ackAlert);
  const unacked = alerts.filter((a) => !a.acked).slice(0, 20);

  const handleAck = async (id: string) => {
    try {
      await api.post(`/api/alerts/${id}/ack`, {});
      ackAlert(id);
    } catch (err) {
      console.error('Failed to ack alert:', err);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-navy-800">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-2">
          Live Alerts
          {unacked.length > 0 && (
            <span className="bg-sw-red/20 text-sw-red text-[10px] px-1.5 py-0.5 rounded-full border border-sw-red/30">
              {unacked.length}
            </span>
          )}
        </h3>
      </div>
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence initial={false}>
          {unacked.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-6 text-center"
            >
              <CheckCircle size={32} className="text-teal mx-auto mb-2 opacity-60" />
              <p className="text-sm text-gray-400">All clear!</p>
            </motion.div>
          )}
          {unacked.map((alert) => {
            const cfg = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.low;
            const Icon = cfg.icon;
            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -20, height: 0 }}
                animate={{ opacity: 1, x: 0, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ type: 'spring', damping: 25 }}
                className={clsx('p-3 border-b border-navy-800/50 border-l-2', cfg.border)}
              >
                <div className="flex items-start gap-2">
                  <Icon size={14} className={clsx('mt-0.5 shrink-0', cfg.color)} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-200 leading-tight">{alert.message}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <button
                    onClick={() => handleAck(alert.id)}
                    className="shrink-0 w-5 h-5 rounded-full bg-navy-700 hover:bg-teal/20 flex items-center justify-center transition-colors"
                    title="Acknowledge"
                  >
                    <Check size={10} className="text-gray-400" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
