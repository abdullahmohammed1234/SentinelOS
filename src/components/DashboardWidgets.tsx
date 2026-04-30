import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { LucideIcon, Zap, Shield, AlertTriangle, CheckCircle, RefreshCcw, Search, Trash2, Power } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { useNotifications } from '../hooks/useNotifications';

interface CircularProgressProps {
  value: number;
  label: string;
  size?: number;
  strokeWidth?: number;
  color?: string;
  className?: string;
}

export const CircularProgress = ({ 
  value, 
  label, 
  size = 120, 
  strokeWidth = 8, 
  color = "var(--color-neo-cyan)",
  className 
}: CircularProgressProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className={cn("relative flex items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="rotate-[-90deg]">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 8px ${color}80)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-white leading-none">{Math.round(value)}%</span>
        <span className="text-[9px] font-mono uppercase tracking-widest text-slate-500 mt-1">{label}</span>
      </div>
    </div>
  );
};

interface HealthScoreProps {
  cpu: number;
  ram: number;
  disk: number;
  battery: number;
  scoreOveride?: number;
}

export const HealthScoreIndicator = ({ cpu, ram, disk, battery, scoreOveride }: HealthScoreProps) => {
  const calculatedScore = 100 - (
    (cpu * 0.4) + 
    (ram * 0.3) + 
    (disk * 0.2) + 
    ((100 - battery) * 0.1)
  );
  
  const score = scoreOveride !== undefined ? scoreOveride : calculatedScore;

  let status: { label: string, color: string, icon: LucideIcon };
  if (score > 85) status = { label: "Excellent", color: "text-neo-cyan", icon: Shield };
  else if (score > 70) status = { label: "Good", color: "text-green-400", icon: CheckCircle };
  else if (score > 50) status = { label: "Warning", color: "text-yellow-400", icon: AlertTriangle };
  else status = { label: "Critical", color: "text-red-500", icon: AlertTriangle };

  const StatusIcon = status.icon;

  return (
    <div className="flex flex-col items-center">
      <div className="relative mb-4">
        <CircularProgress 
          value={score} 
          label="HEALTH" 
          size={140} 
          strokeWidth={10} 
          color={status.color === "text-neo-cyan" ? "var(--color-neo-cyan)" : status.color.includes('green') ? "#4ade80" : status.color.includes('yellow') ? "#fbbf24" : "#ef4444"}
        />
      </div>
      <div className={cn("flex items-center gap-2 font-bold tracking-[0.3em] uppercase text-xs", status.color)}>
        <StatusIcon className="w-4 h-4" />
        {status.label}
      </div>
    </div>
  );
};

export const AnomalyList = ({ anomalies, recommendations }: { anomalies: any[], recommendations: any[] }) => {
  return (
    <div className="space-y-4">
      {anomalies.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-[10px] font-bold text-red-500/80 uppercase tracking-widest flex items-center gap-2">
            <AlertTriangle className="w-3 h-3" />
            Detected Anomalies
          </h4>
          {anomalies.map((a, i) => (
            <div key={i} className="p-3 rounded-xl bg-red-500/5 border border-red-500/10 text-[11px] text-red-200/70 font-mono">
              <span className="text-red-500 font-bold mr-2">[{a.type}]</span>
              {a.message}
            </div>
          ))}
        </div>
      )}
      
      {recommendations.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-[10px] font-bold text-neo-cyan/80 uppercase tracking-widest flex items-center gap-2">
            <Zap className="w-3 h-3" />
            Optimization Guide
          </h4>
          {recommendations.map((r, i) => (
            <div key={i} className="p-3 rounded-xl bg-neo-cyan/5 border border-neo-cyan/10 text-[11px] text-neo-cyan/70 font-mono flex items-start gap-2">
              <div className="mt-1 w-1 h-1 rounded-full bg-neo-cyan" />
              <span>{r}</span>
            </div>
          ))}
        </div>
      )}
      
      {anomalies.length === 0 && recommendations.length === 0 && (
        <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02] text-center">
          <CheckCircle className="w-8 h-8 text-neo-cyan/20 mx-auto mb-2" />
          <p className="text-[10px] text-slate-500 font-mono">ALL SYSTEMS NOMINAL. NO INTERVENTION REQUIRED.</p>
        </div>
      )}
    </div>
  );
};

export const QuickActions = () => {
  const { addAlert } = useNotifications();
  const [loadingAction, setLoadingAction] = React.useState<string | null>(null);

  const actions = [
    { id: 'refresh', label: "Refresh", icon: RefreshCcw, color: "text-neo-cyan" },
    { id: 'scan', label: "Deep Scan", icon: Search, color: "text-neo-purple" },
    { id: 'clear', label: "Clean Logs", icon: Trash2, color: "text-red-400" },
    { id: 'reboot', label: "Reboot", icon: Power, color: "text-orange-400" },
  ];

  const handleAction = async (id: string, label: string) => {
    if (loadingAction) return;
    setLoadingAction(id);

    try {
      if (id === 'refresh') {
        // Simple UI refresh simulation
        addAlert({
          title: "System Refresh",
          message: "Updating telemetry feeds and stabilizing UI components...",
          severity: "info",
        });
        window.dispatchEvent(new CustomEvent('sentinel-refresh-stats'));
        setTimeout(() => setLoadingAction(null), 800);
        return;
      }

      const endpointMap: Record<string, string> = {
        scan: '/api/operations/deep-scan',
        clear: '/api/operations/clear-logs',
        reboot: '/api/operations/reboot',
      };

      const response = await fetch(endpointMap[id], { method: 'POST' });
      const data = await response.json();

      if (data.success) {
        addAlert({
          title: `${label} Successful`,
          message: data.message,
          severity: id === 'scan' ? 'info' : id === 'clear' ? 'info' : 'warning',
        });
        
        if (id === 'reboot') {
          window.dispatchEvent(new CustomEvent('sentinel-reboot'));
          // Trigger a fresh telemetry pull when reboot animation completes.
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('sentinel-refresh-stats'));
            setLoadingAction(null);
          }, 4200);
        }
      } else {
        throw new Error(data.error || "Action failed");
      }
    } catch (error) {
      addAlert({
        title: `${label} Failed`,
        message: error instanceof Error ? error.message : "Security protocol intervention detected.",
        severity: "critical",
      });
    } finally {
      if (id !== 'refresh' && id !== 'reboot') {
        setLoadingAction(null);
      }
    }
  };

  return (
    <div className="grid grid-cols-2 gap-2">
      {actions.map((action) => {
        const Icon = action.icon;
        const isLoading = loadingAction === action.id;
        
        return (
          <motion.button
            key={action.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={!!loadingAction}
            onClick={() => handleAction(action.id, action.label)}
            className={cn(
              "flex flex-col items-center justify-center p-3 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.08] transition-colors group relative overflow-hidden",
              loadingAction && loadingAction !== action.id && "opacity-50 grayscale cursor-not-allowed",
              isLoading && "bg-white/[0.1] border-white/20"
            )}
          >
            <Icon className={cn(
              "w-4 h-4 mb-2 group-hover:scale-110 transition-transform", 
              action.color,
              isLoading && "animate-spin"
            )} />
            <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400">
              {isLoading ? "Processing..." : action.label}
            </span>
            {isLoading && (
              <motion.div 
                className="absolute bottom-0 left-0 h-[2px] bg-neo-cyan"
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: action.id === 'scan' ? 2 : 0.8 }}
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
};

export const MiniActivityGraph = ({ data, color }: { data: any[], color: string }) => (
  <div className="h-full w-full opacity-50">
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <Area 
          type="monotone" 
          dataKey="val" 
          stroke={color} 
          fill={color} 
          fillOpacity={0.1} 
          strokeWidth={1}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  </div>
);
