import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, Bell, Info, ShieldAlert, X } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import { AlertSeverity } from '../types';

const severityConfig: Record<AlertSeverity, { icon: any, color: string, bg: string, border: string }> = {
  info: {
    icon: Info,
    color: 'text-blue-400',
    bg: 'bg-[#0a0f1a]/95',
    border: 'border-blue-500/30',
  },
  warning: {
    icon: AlertCircle,
    color: 'text-amber-400',
    bg: 'bg-[#1a160a]/95',
    border: 'border-amber-500/30',
  },
  critical: {
    icon: ShieldAlert,
    color: 'text-rose-400',
    bg: 'bg-[#1a0a0a]/95',
    border: 'border-rose-500/40',
  }
};

export const NotificationManager: React.FC = () => {
  const { activeNotifications, dismissAlert } = useNotifications();

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 w-full max-w-md">
      <AnimatePresence mode="popLayout">
        {activeNotifications.map((alert) => {
          const config = severityConfig[alert.severity];
          const Icon = config.icon;

          return (
            <motion.div
              key={alert.id}
              layout
              initial={{ opacity: 0, x: 100, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className={`relative overflow-hidden ${config.bg} ${config.border} border backdrop-blur-xl rounded-lg p-4 shadow-2xl flex items-start gap-4 group hover:ring-1 hover:ring-white/20 transition-all`}
            >
              {/* Scanline Effect */}
              <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[length:100%_2px,3px_100%]" />
              
              {/* Animated Progress Bar */}
              <motion.div
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: 5, ease: 'linear' }}
                className={`absolute bottom-0 left-0 h-0.5 ${config.color.replace('text', 'bg')}`}
              />

              <div className={`p-2 rounded-md bg-black/40 ${config.color}`}>
                <Icon size={20} className="animate-pulse" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className={`text-xs font-bold uppercase tracking-widest ${config.color}`}>
                    {alert.severity} ALERT
                  </span>
                  <span className="text-[10px] opacity-30 font-mono">
                    {new Date(alert.timestamp).toLocaleTimeString([], { hour12: false })}
                  </span>
                </div>
                <p className="text-sm font-medium text-white/90 leading-snug">
                  {alert.message}
                </p>
              </div>

              <button
                id={`dismiss-alert-${alert.id}`}
                onClick={() => dismissAlert(alert.id)}
                className="p-1 hover:bg-white/10 rounded-md transition-colors opacity-0 group-hover:opacity-100"
              >
                <X size={16} className="text-white/50" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
