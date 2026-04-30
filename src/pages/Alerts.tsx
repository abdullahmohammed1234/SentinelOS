import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Bell, 
  Trash2, 
  Filter, 
  ShieldAlert, 
  AlertTriangle, 
  Info as InfoIcon,
  Clock,
  CheckCircle2,
  Activity
} from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import { AlertSeverity } from '../types';

const AlertsPage: React.FC = () => {
  const { alerts, clearHistory, markAsRead } = useNotifications();
  const [filter, setFilter] = useState<AlertSeverity | 'all'>('all');

  const filteredAlerts = alerts.filter(a => filter === 'all' || a.severity === filter);
  const unreadCount = alerts.filter(a => !a.read).length;

  const severityIcons: Record<AlertSeverity, React.ReactNode> = {
    info: <InfoIcon size={18} className="text-blue-400" />,
    warning: <AlertTriangle size={18} className="text-amber-400" />,
    critical: <ShieldAlert size={18} className="text-rose-400" />,
  };

  const severityColors: Record<AlertSeverity, string> = {
    info: 'border-blue-500/20 bg-blue-500/5',
    warning: 'border-amber-500/20 bg-amber-500/5',
    critical: 'border-rose-500/30 bg-rose-500/10',
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 pb-20"
    >
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white/[0.02] border border-white/5 p-8 rounded-2xl backdrop-blur-sm relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        
        <div className="relative z-10 flex items-center gap-6">
          <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.1)]">
            <Bell size={32} className="text-indigo-400" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white uppercase italic">Security_Alerts</h1>
            <p className="text-sm text-slate-500 font-mono mt-1">Real-time threat monitoring and system audit logs</p>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-4">
          <div className="px-4 py-2 rounded-lg bg-black/40 border border-white/5 flex items-center gap-3">
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-slate-500 font-mono uppercase tracking-tighter">Status</span>
              <span className="text-xs font-bold text-emerald-400">ACTIVE_MONITOR</span>
            </div>
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <button 
            onClick={clearHistory}
            className="flex items-center gap-2 px-6 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 text-xs font-bold uppercase tracking-widest rounded-lg transition-all"
          >
            <Trash2 size={14} />
            Purge History
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Filters & Summary */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white/5 border border-white/5 rounded-2xl p-6 space-y-6">
            <div>
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Filter Severity</h3>
              <div className="flex flex-col gap-2">
                {(['all', 'info', 'warning', 'critical'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setFilter(s)}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all border font-bold text-xs uppercase tracking-wider ${
                      filter === s 
                        ? 'bg-white text-zinc-950 border-white' 
                        : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    {s}
                    {unreadCount > 0 && s === 'all' && (
                      <span className="bg-rose-500 text-white px-1.5 py-0.5 rounded-md text-[9px]">{unreadCount}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-white/5">
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Live Statistics</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-slate-400">Total Recorded</span>
                  <span className="text-sm font-mono text-white">{alerts.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-slate-400">Critical Threats</span>
                  <span className="text-sm font-mono text-rose-400">{alerts.filter(a => a.severity === 'critical').length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-slate-400">Unread Logs</span>
                  <span className="text-sm font-mono text-indigo-400">{unreadCount}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 rounded-2xl p-6 relative overflow-hidden">
             <Activity className="absolute -bottom-4 -right-4 w-24 h-24 text-white/5 rotate-12" />
             <h4 className="text-xs font-black text-white uppercase tracking-widest mb-2 italic">Neural_Audit</h4>
             <p className="text-[10px] text-indigo-200/70 leading-relaxed">
               Sentiment monitoring enabled. System anomalies are being cross-referenced with historical patterns for predictive warning accuracy.
             </p>
          </div>
        </div>

        {/* Alerts Feed */}
        <div className="lg:col-span-3 space-y-4">
          {filteredAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-20 border-2 border-dashed border-white/5 rounded-3xl opacity-20 text-center space-y-4">
              <Clock size={64} strokeWidth={1} />
              <div>
                <p className="text-lg font-bold uppercase tracking-tighter italic">Clean_Record_Found</p>
                <p className="text-sm font-mono uppercase tracking-widest mt-1">No system anomalies currently logged</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAlerts.map((alert, index) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onMouseEnter={() => !alert.read && markAsRead(alert.id)}
                  className={`relative p-6 rounded-2xl border transition-all group overflow-hidden ${
                    alert.read 
                      ? 'bg-white/[0.02] border-white/5 opacity-60' 
                      : `${severityColors[alert.severity]} shadow-[0_0_20px_rgba(99,102,241,0.05)]`
                  }`}
                >
                  <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-20 transition-opacity">
                    <CheckCircle2 size={40} className="text-white" />
                  </div>

                  <div className="flex items-start gap-6">
                    <div className={`p-3 rounded-xl bg-black/40 ${alert.read ? 'text-slate-500' : ''}`}>
                      {severityIcons[alert.severity]}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-4 mb-2">
                        <div className="flex items-center gap-3">
                          <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded border border-white/10 ${
                             alert.read ? 'text-slate-500' : (alert.severity === 'critical' ? 'bg-rose-500 text-white' : 'text-slate-300')
                          }`}>
                            {alert.severity}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">TAG_{alert.type.toUpperCase()} // ID_{alert.id}</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500 uppercase">
                          {new Date(alert.timestamp).toLocaleString()}
                        </span>
                      </div>
                      
                      <p className={`text-lg font-bold leading-tight tracking-tight ${alert.read ? 'text-slate-400' : 'text-white'}`}>
                        {alert.message}
                      </p>

                      <div className="mt-4 flex items-center gap-4 overflow-hidden h-0 group-hover:h-auto transition-all">
                        <button className="text-[10px] font-bold text-indigo-400 hover:text-white uppercase tracking-widest underline decoration-2 underline-offset-4">
                          View_Detailed_Diagnostics
                        </button>
                        <button className="text-[10px] font-bold text-slate-500 hover:text-white uppercase tracking-widest decoration-2 underline-offset-4">
                          Acknowledge_Event
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default AlertsPage;
