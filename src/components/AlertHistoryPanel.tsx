import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, 
  Search, 
  Trash2, 
  Filter, 
  CheckCircle2, 
  Clock,
  ShieldAlert,
  AlertTriangle,
  Info as InfoIcon,
  X
} from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import { AlertSeverity } from '../types';

export const AlertHistoryPanel: React.FC = () => {
  const { alerts, clearHistory, markAsRead } = useNotifications();
  const [filter, setFilter] = useState<AlertSeverity | 'all'>('all');
  const [isOpen, setIsOpen] = useState(false);

  const filteredAlerts = alerts.filter(a => filter === 'all' || a.severity === filter);
  const unreadCount = alerts.filter(a => !a.read).length;

  const severityIcons: Record<AlertSeverity, React.ReactNode> = {
    info: <InfoIcon size={14} className="text-blue-400" />,
    warning: <AlertTriangle size={14} className="text-amber-400" />,
    critical: <ShieldAlert size={14} className="text-rose-400" />,
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        id="alert-history-trigger"
        onClick={() => setIsOpen(true)}
        className="relative p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group"
      >
        <Bell size={20} className="text-white/70 group-hover:text-white transition-colors" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500 text-[10px] font-bold items-center justify-center text-white">
              {unreadCount}
            </span>
          </span>
        )}
      </button>

      {/* Slide-over Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            />
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-[#050608]/98 border-l border-white/10 z-[70] shadow-2xl flex flex-col"
              >
                {/* Background Pattern */}
                <div className="absolute inset-0 pointer-events-none opacity-[0.03] overflow-hidden">
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(0,242,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,242,255,0.1)_1px,transparent_1px)] bg-[size:40px_40px]" />
                </div>

                {/* Header */}
                <div className="relative p-6 border-b border-white/10 flex items-center justify-between bg-black/40 backdrop-blur-xl shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                    <Bell size={18} className="text-indigo-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold tracking-tight text-white">Alert History</h2>
                    <p className="text-xs text-zinc-500 font-mono uppercase tracking-widest">
                      System Logs: Record_{alerts.length ? alerts[0].id : 'NULL'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/5 rounded-full transition-colors"
                >
                  <X size={20} className="text-zinc-400" />
                </button>
              </div>

              {/* Toolbar */}
              <div className="relative p-4 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-black/20 shrink-0">
                <div className="flex gap-1">
                  {(['all', 'info', 'warning', 'critical'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setFilter(s)}
                      className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
                        filter === s 
                          ? 'bg-white text-zinc-900' 
                          : 'bg-white/5 text-zinc-400 hover:bg-white/10'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <button
                  onClick={clearHistory}
                  className="flex items-center gap-2 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-rose-400 hover:bg-rose-400/10 rounded-full transition-all"
                >
                  <Trash2 size={12} />
                  Clear All
                </button>
              </div>

              {/* List */}
              <div className="relative flex-1 overflow-y-auto p-4 custom-scrollbar bg-black/10">
                {filteredAlerts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full opacity-30 gap-4">
                    <Clock size={48} strokeWidth={1} />
                    <p className="font-mono text-sm uppercase tracking-widest">No entries found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredAlerts.map((alert) => (
                      <motion.div
                        key={alert.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        onMouseEnter={() => !alert.read && markAsRead(alert.id)}
                        className={`p-4 rounded-xl border transition-all ${
                          alert.read 
                            ? 'bg-white/5 border-white/5 opacity-70' 
                            : 'bg-indigo-500/[0.08] border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.05)]'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`mt-1`}>
                            {severityIcons[alert.severity]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="text-[10px] font-mono text-zinc-500">
                                {new Date(alert.timestamp).toLocaleTimeString()}
                              </span>
                              {!alert.read && (
                                <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]" />
                              )}
                            </div>
                            <p className="text-sm font-medium text-zinc-200 leading-relaxed">
                              {alert.message}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Status Bar */}
              <div className="relative p-4 border-t border-white/10 bg-[#050608] flex items-center justify-between text-[10px] font-mono text-zinc-500 uppercase tracking-widest shrink-0">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  Live Monitoring Active
                </div>
                <div>{filteredAlerts.length} Logs</div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
