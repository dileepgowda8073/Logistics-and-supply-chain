import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Edit2, Clock, DollarSign, Package } from 'lucide-react';
import type { ReplanRec } from '../../types';
import { formatDistanceToNow } from 'date-fns';
import api from '../../api/client';
import { useStore } from '../../store';
import clsx from 'clsx';

const URGENCY_CONFIG: Record<string, string> = {
  critical: 'text-sw-red bg-sw-red/10 border-sw-red/40',
  high: 'text-sw-amber bg-sw-amber/10 border-sw-amber/40',
  medium: 'text-blue-400 bg-blue-400/10 border-blue-400/40',
  low: 'text-teal bg-teal/10 border-teal/40',
};

function ReplanCard({ replan, isNew }: { replan: ReplanRec; isNew: boolean }) {
  const updateReplan = useStore((s) => s.updateReplan);
  const markReplanSeen = useStore((s) => s.markReplanSeen);
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    setLoading(true);
    try {
      await api.post(`/api/replans/${replan.id}/ack`, { action: 'approve' });
      updateReplan(replan.id, { status: 'approved' });
      markReplanSeen(replan.id);
    } catch (err) {
      console.error('Approve failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    try {
      await api.post(`/api/replans/${replan.id}/ack`, { action: 'reject', reason });
      updateReplan(replan.id, { status: 'rejected' });
      markReplanSeen(replan.id);
    } catch (err) {
      console.error('Reject failed:', err);
    } finally {
      setLoading(false);
    }
  };

  if (replan.status !== 'open') return null;

  return (
    <motion.div
      layout
      initial={isNew ? { x: 100, opacity: 0 } : false}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 100, opacity: 0 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      className="bg-navy-800/80 border border-navy-700 rounded-xl p-4 mb-3 backdrop-blur-sm"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Package size={14} className="text-teal" />
            <span className="font-mono text-sm text-teal font-medium">{replan.sku_id}</span>
            <span className={clsx('text-[10px] px-2 py-0.5 rounded-full border capitalize font-medium', URGENCY_CONFIG[replan.urgency])}>
              {replan.urgency}
            </span>
          </div>
          <p className="text-sm text-white font-medium capitalize">{replan.action.replace(/_/g, ' ')}</p>
        </div>
        {replan.expires_at && (
          <div className="flex items-center gap-1 text-[10px] text-gray-500">
            <Clock size={10} />
            <span>Expires {formatDistanceToNow(new Date(replan.expires_at), { addSuffix: true })}</span>
          </div>
        )}
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
        <div className="bg-navy-900/60 rounded-lg p-2.5 border border-navy-700/30">
          <p className="text-gray-500 text-[10px] uppercase tracking-wider">Quantity</p>
          <p className="text-white font-semibold mt-0.5">{replan.qty.toLocaleString()} units</p>
        </div>
        <div className="bg-navy-900/60 rounded-lg p-2.5 border border-navy-700/30">
          <p className="text-gray-500 text-[10px] uppercase tracking-wider">Est. Cost</p>
          <p className="text-white font-semibold flex items-center gap-1 mt-0.5">
            <DollarSign size={10} />{replan.estimated_cost?.toLocaleString()}
          </p>
        </div>
        {replan.supplier_name && (
          <div className="bg-navy-900/60 rounded-lg p-2.5 col-span-2 border border-navy-700/30">
            <p className="text-gray-500 text-[10px] uppercase tracking-wider">Supplier</p>
            <p className="text-white mt-0.5">
              {replan.supplier_name}{' '}
              <span className="text-gray-500">({replan.lead_time_days}d lead time)</span>
            </p>
          </div>
        )}
      </div>

      {/* Reject reason textarea */}
      <AnimatePresence>
        {showReject && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mb-3 overflow-hidden"
          >
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason for rejection..."
              className="w-full bg-navy-900 border border-navy-700 rounded-lg p-2 text-xs text-gray-200 resize-none focus:outline-none focus:border-teal/50 transition-colors"
              rows={2}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleApprove}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-teal/15 border border-teal/40 text-teal rounded-lg text-xs font-medium hover:bg-teal/25 transition-all disabled:opacity-50"
        >
          <Check size={12} /> Approve
        </button>
        {!showReject ? (
          <button
            onClick={() => setShowReject(true)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-sw-red/15 border border-sw-red/40 text-sw-red rounded-lg text-xs font-medium hover:bg-sw-red/25 transition-all"
          >
            <X size={12} /> Reject
          </button>
        ) : (
          <button
            onClick={handleReject}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-sw-red/15 border border-sw-red/40 text-sw-red rounded-lg text-xs font-medium hover:bg-sw-red/25 transition-all disabled:opacity-50"
          >
            <X size={12} /> Confirm
          </button>
        )}
        <button className="p-2 bg-sw-amber/15 border border-sw-amber/40 text-sw-amber rounded-lg hover:bg-sw-amber/25 transition-all" title="Modify">
          <Edit2 size={12} />
        </button>
      </div>
    </motion.div>
  );
}

export default function ReplanList({ replans }: { replans: ReplanRec[] }) {
  const newReplanIds = useStore((s) => s.newReplanIds);
  const open = replans.filter((r) => r.status === 'open');

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-navy-800">
        <h2 className="text-sm font-semibold text-white">Replan Recommendations</h2>
        <p className="text-[10px] text-gray-400 mt-0.5">{open.length} open recommendations awaiting action</p>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <AnimatePresence mode="popLayout">
          {open.map((r) => (
            <ReplanCard key={r.id} replan={r} isNew={newReplanIds.has(r.id)} />
          ))}
          {open.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16 text-gray-500"
            >
              <Package size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No open recommendations</p>
              <p className="text-xs text-gray-600 mt-1">Replanning triggers when delay exceeds threshold</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
