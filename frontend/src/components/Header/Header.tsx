import React, { useState } from 'react';
import { Ship, Bell, LogOut, ChevronDown, Globe, Route } from 'lucide-react';
import { useStore } from '../../store';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import AddRegionModal from '../AddRegionModal';
import AddRouteModal from '../AddRouteModal';

const KPIBadge = ({ label, value, unit, color }: { label: string; value: number; unit?: string; color: string }) => (
  <div className="flex flex-col items-center px-4 border-r border-navy-800 last:border-0">
    <span className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">{label}</span>
    <motion.span
      key={value}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`text-lg font-bold ${color}`}
    >
      {value}{unit}
    </motion.span>
  </div>
);

export default function Header() {
  const kpis = useStore((s) => s.kpis);
  const user = useStore((s) => s.user);
  const logout = useStore((s) => s.logout);
  const unreadCount = useStore((s) => s.unreadCount);
  const resetUnread = useStore((s) => s.resetUnread);
  const navigate = useNavigate();
  const [showRegionModal, setShowRegionModal] = useState(false);
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="flex items-center justify-between px-6 py-3 bg-navy-900/95 border-b border-navy-800/80 shrink-0 z-50 backdrop-blur-sm" style={{ height: 64 }}>
      {/* Logo */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-teal to-teal-dark flex items-center justify-center shadow-lg shadow-teal/20">
          <Ship size={20} className="text-navy-950" />
        </div>
        <div>
          <span className="font-bold text-lg text-gradient">SupplyWatch</span>
        </div>
      </div>

      {/* KPI Ticker */}
      {kpis && (
        <div className="hidden md:flex items-center gap-0 bg-navy-800/60 rounded-xl px-2 py-1.5 border border-navy-700/50">
          <KPIBadge
            label="On-Time"
            value={kpis.onTimeRate}
            unit="%"
            color={kpis.onTimeRate > 90 ? 'text-teal' : kpis.onTimeRate > 75 ? 'text-sw-amber' : 'text-sw-red'}
          />
          <KPIBadge
            label="Avg Delay"
            value={kpis.avgDelay}
            unit="m"
            color={kpis.avgDelay < 60 ? 'text-teal' : kpis.avgDelay < 120 ? 'text-sw-amber' : 'text-sw-red'}
          />
          <KPIBadge
            label="Fill Rate"
            value={kpis.fillRate}
            unit="%"
            color={kpis.fillRate > 90 ? 'text-teal' : 'text-sw-amber'}
          />
          <KPIBadge
            label="Alerts"
            value={kpis.openAlerts}
            color={kpis.openAlerts > 5 ? 'text-sw-red' : 'text-sw-amber'}
          />
          <KPIBadge
            label="Active"
            value={kpis.activeShipments}
            color="text-blue-400"
          />
        </div>
      )}

      {/* Right side controls */}
      <div className="flex items-center gap-3">
        {/* Add Route Button */}
        <button
          onClick={() => setShowRouteModal(true)}
          className="hidden md:flex items-center gap-2 bg-navy-800 hover:bg-navy-700 border border-navy-600 text-purple-400 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
        >
          <Route size={16} />
          <span>+ Add Route</span>
        </button>

        {/* Add Region Button */}
        <button
          onClick={() => setShowRegionModal(true)}
          className="hidden md:flex items-center gap-2 bg-navy-800 hover:bg-navy-700 border border-navy-600 text-teal-400 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors mr-2"
        >
          <Globe size={16} />
          <span>+ Add Region</span>
        </button>
        {/* Live status */}
        <div className="flex items-center gap-2">
          <span className="live-dot" />
          <span className="text-teal text-xs font-semibold tracking-wide">LIVE</span>
        </div>

        {/* Bell */}
        <button
          onClick={() => resetUnread()}
          className="relative p-2 rounded-lg hover:bg-navy-800 transition-colors"
        >
          <Bell size={18} className="text-gray-400" />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span
                key={unreadCount}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-sw-red rounded-full text-white text-[10px] flex items-center justify-center font-bold px-0.5"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {/* User Menu */}
        <div className="relative">
          <div 
            className="flex items-center gap-2 cursor-pointer hover:bg-navy-800 px-3 py-1.5 rounded-lg transition-colors"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal to-blue-500 flex items-center justify-center text-navy-950 font-bold text-xs">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-medium text-white leading-tight">{user?.name || 'User'}</p>
              <p className="text-[10px] text-gray-500 capitalize">{user?.role}</p>
            </div>
            <ChevronDown size={14} className={`text-gray-500 transition-transform duration-200 ${showProfileMenu ? 'rotate-180' : ''}`} />
          </div>

          <AnimatePresence>
            {showProfileMenu && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-48 bg-navy-900 border border-navy-700 rounded-lg shadow-xl overflow-hidden z-50"
              >
                <div className="px-4 py-3 border-b border-navy-800">
                  <p className="text-xs text-gray-400">Signed in as</p>
                  <p className="text-sm text-white font-medium truncate">{user?.email || 'admin@supplywatch.ai'}</p>
                </div>
                <div className="py-1">
                  <button 
                    onClick={() => {
                      setShowProfileMenu(false);
                      handleLogout();
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-sw-red hover:bg-navy-800/80 flex items-center gap-2 transition-colors"
                  >
                    <LogOut size={14} />
                    <span>Sign out</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      <AddRegionModal isOpen={showRegionModal} onClose={() => setShowRegionModal(false)} />
      <AddRouteModal isOpen={showRouteModal} onClose={() => setShowRouteModal(false)} />
    </header>
  );
}
