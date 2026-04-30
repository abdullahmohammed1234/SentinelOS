import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useSystemStats } from '../hooks/useSystemStats';
import { 
  Cpu, HardDrive, Zap, Activity, Info, Battery, Wifi, 
  Terminal, Globe, Layers, BarChart3, Clock, ArrowUp, ArrowDown, Shield
} from 'lucide-react';
import { cn } from '../lib/utils';
import { HealthScoreIndicator, QuickActions, MiniActivityGraph } from '../components/DashboardWidgets';
import Card from '../components/ui/Card';
import GlowingChart from '../components/ui/GlowingChart';
import LoadingScreen from '../components/ui/LoadingScreen';

const HUDCard = ({ title, icon: Icon, children, className, action }: any) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className={cn("glass-panel p-5 rounded-2xl relative overflow-hidden flex flex-col h-full", className)}
  >
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-neo-cyan">
          <Icon className="w-4 h-4" />
        </div>
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{title}</h3>
      </div>
      {action && action}
    </div>
    <div className="flex-1">
      {children}
    </div>
    {/* HUD Scanline Effect */}
    <div className="absolute inset-0 pointer-events-none opacity-[0.02] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
  </motion.div>
);

export default function Dashboard() {
  const { stats, loading } = useSystemStats();
  const [history, setHistory] = useState<any[]>([]);

  // Update history for charts
  useEffect(() => {
    if (stats) {
      setHistory(prev => {
        const newData = [...prev, {
          time: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          cpu: stats.cpu,
          mem: stats.memory.percentage,
          net: stats.network.download
        }].slice(-30); // Keep last 30 seconds
        return newData;
      });
    }
  }, [stats]);

  if (loading && !stats) {
    return <LoadingScreen message="SentinelOS Kernel Booting" />;
  }

  // Format uptime
  const uptimeHours = Math.floor((stats?.uptime || 0) / 3600);
  const uptimeMins = Math.floor(((stats?.uptime || 0) % 3600) / 60);
  const uptimeSecs = Math.floor((stats?.uptime || 0) % 60);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 space-y-6 max-h-screen overflow-y-auto relative"
    >
      <div className="scanline-effect" />
      {/* Header Info Rail */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.05] pb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-neo-cyan/10 border border-neo-cyan/20 rounded-xl flex items-center justify-center">
            <Layers className="w-6 h-6 text-neo-cyan" />
          </div>
          <div>
            <h1 className="text-2xl font-light tracking-tight text-white">SENTINEL<span className="font-bold">OS</span> <span className="text-neo-cyan text-xs font-mono ml-2 opacity-50">v2.4.0_REV7</span></h1>
            <p className="text-[10px] text-slate-500 font-mono flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-neo-cyan animate-pulse" />
              SYSTEM_CORE: OPERATIONAL // KERNEL_HASH: 0x7E2...
            </p>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="flex flex-col items-end">
            <span className="text-[9px] uppercase tracking-widest text-slate-500 font-bold mb-1">Session Uptime</span>
            <div className="text-xl font-mono text-white flex items-center gap-1">
              <Clock className="w-3 h-3 text-neo-cyan mr-1" />
              <span>{String(uptimeHours).padStart(2, '0')}</span>
              <span className="text-neo-cyan opacity-50">:</span>
              <span>{String(uptimeMins).padStart(2, '0')}</span>
              <span className="text-neo-cyan opacity-50">:</span>
              <span className="text-neo-cyan">{String(uptimeSecs).padStart(2, '0')}</span>
            </div>
          </div>
          <div className="h-10 w-[1px] bg-white/10 hidden md:block" />
          <div className="hidden lg:flex items-center gap-4">
            <div className="text-right">
              <span className="text-[9px] uppercase tracking-widest text-slate-500 font-bold block mb-0.5">Network Status</span>
              <div className="flex items-center gap-2 text-white font-mono text-sm">
                <Wifi className="w-3 h-3 text-neo-blue" />
                <span>LINK_ESTABLISHED</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Primary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* CPU Stats */}
        <HUDCard title="Core Processing" icon={Cpu}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl font-bold text-white leading-none">{Math.round(stats?.cpu || 0)}%</span>
            <div className="w-1/2 h-8">
              <MiniActivityGraph data={history.map(h => ({ val: h.cpu }))} color="var(--color-neo-cyan)" />
            </div>
          </div>
          <div className="space-y-3">
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
               <motion.div 
                 animate={{ width: `${stats?.cpu}%` }}
                 className="h-full bg-neo-cyan shadow-[0_0_10px_rgba(0,242,255,0.5)]"
               />
            </div>
            <div className="grid grid-cols-2 gap-2">
               <div className="bg-white/[0.02] border border-white/[0.05] p-2 rounded-lg">
                  <span className="text-[8px] text-slate-500 font-bold block uppercase mb-1">Load Avg</span>
                  <span className="text-[10px] font-mono text-white">[{stats?.loadAverage[0].toFixed(2)}, {stats?.loadAverage[1].toFixed(2)}]</span>
               </div>
               <div className="bg-white/[0.02] border border-white/[0.05] p-2 rounded-lg">
                  <span className="text-[8px] text-slate-500 font-bold block uppercase mb-1">Interrupts</span>
                  <span className="text-[10px] font-mono text-neo-cyan">LOW_LATENCY</span>
               </div>
            </div>
          </div>
        </HUDCard>

        {/* Memory Stats */}
        <HUDCard title="Memory Hub" icon={Zap}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-white">{stats?.memory.used}</span>
              <span className="text-[10px] text-slate-500 font-mono">MB</span>
            </div>
            <div className="w-1/2 h-8">
              <MiniActivityGraph data={history.map(h => ({ val: h.mem }))} color="var(--color-neo-purple)" />
            </div>
          </div>
          <div className="space-y-3">
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
               <motion.div 
                 animate={{ width: `${stats?.memory.percentage}%` }}
                 className="h-full bg-neo-purple shadow-[0_0_10px_rgba(188,19,254,0.5)]"
               />
            </div>
            <div className="flex justify-between items-center text-[10px] font-mono">
              <span className="text-slate-500">UTLIZ: {stats?.memory.percentage}%</span>
              <span className="text-neo-purple">{stats?.memory.total}MB TOTAL</span>
            </div>
          </div>
        </HUDCard>

        {/* Disk Stats */}
        <HUDCard title="Storage Array" icon={HardDrive}>
          <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-4">
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 uppercase font-mono tracking-tighter">NVMe_SSD_0</span>
                <span className="text-sm font-bold text-white">{Math.round(stats?.disk.used || 0)} GB USE</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 uppercase font-mono tracking-tighter">VOL_INTEGRITY</span>
                <span className="text-[10px] block text-green-400 font-bold tracking-widest">NOMINAL</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-auto">
               <div className="flex flex-col gap-1">
                  <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full w-[45%] bg-neo-blue" />
                  </div>
                  <span className="text-[8px] text-slate-600 font-mono">SYS_ROOT</span>
               </div>
               <div className="flex flex-col gap-1">
                  <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full w-[12%] bg-neo-cyan" />
                  </div>
                  <span className="text-[8px] text-slate-600 font-mono">USER_DATA</span>
               </div>
            </div>
          </div>
        </HUDCard>

        {/* Network Stats */}
        <HUDCard title="Network Activity" icon={Globe}>
           <div className="flex flex-col gap-4">
             <div className="flex justify-between items-center">
               <div className="flex items-center gap-2">
                 <ArrowDown className="w-3 h-3 text-neo-cyan" />
                 <span className="text-sm font-bold text-white">{stats?.network.download.toFixed(1)} <span className="text-[10px] font-normal text-slate-500">MB/S</span></span>
               </div>
               <div className="flex items-center gap-2">
                 <ArrowUp className="w-3 h-3 text-neo-purple" />
                 <span className="text-sm font-bold text-white">{stats?.network.upload.toFixed(1)} <span className="text-[10px] font-normal text-slate-500">MB/S</span></span>
               </div>
             </div>
             <div className="h-14 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={history}>
                    <Area type="step" dataKey="net" stroke="#00f2ff" fill="#3b82f6" fillOpacity={0.05} />
                  </AreaChart>
                </ResponsiveContainer>
             </div>
           </div>
        </HUDCard>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Graph */}
        <HUDCard title="System Performance Telemetry" icon={BarChart3} className="lg:col-span-2">
           <div className="h-[280px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history}>
                <defs>
                  <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00f2ff" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#00f2ff" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="memGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#bc13fe" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#bc13fe" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis 
                  dataKey="time" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 9, fill: '#475569' }}
                  hide
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 9, fill: '#475569' }} 
                  width={25}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    fontSize: '11px',
                    color: '#fff'
                  }} 
                  itemStyle={{ padding: '0 4px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="cpu" 
                  stroke="#00f2ff" 
                  strokeWidth={2}
                  fill="url(#cpuGradient)" 
                  animationDuration={500}
                />
                <Area 
                  type="monotone" 
                  dataKey="mem" 
                  stroke="#bc13fe" 
                  strokeWidth={2}
                  fill="url(#memGradient)"
                  animationDuration={500}
                />
              </AreaChart>
            </ResponsiveContainer>
           </div>
           <div className="flex gap-6 mt-4">
             <div className="flex items-center gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-neo-cyan" />
               <span className="text-[10px] font-mono text-slate-500 uppercase">CPU_USAGE</span>
             </div>
             <div className="flex items-center gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-neo-purple" />
               <span className="text-[10px] font-mono text-slate-500 uppercase">MEM_USAGE</span>
             </div>
           </div>
        </HUDCard>

        {/* Right Info Column */}
        <div className="space-y-6">
          {/* Health Score Component */}
          <HUDCard title="System Integrity" icon={Shield}>
             <div className="flex flex-col items-center justify-center pt-2">
               {stats && (
                 <HealthScoreIndicator 
                   cpu={stats.cpu} 
                   ram={stats.memory.percentage} 
                   disk={stats.disk.percentage} 
                   battery={stats.battery.level} 
                   scoreOveride={stats.analysis?.health_score}
                 />
               )}
               
               <div className="mt-8 w-full border-t border-white/[0.05] pt-6 flex justify-between items-center px-4">
                  <div className="flex flex-col items-center">
                    <Battery className={cn("w-4 h-4 mb-1", stats?.battery.level! < 20 ? "text-red-500" : "text-neo-cyan")} />
                    <span className="text-[10px] font-mono text-white">{Math.round(stats?.battery.level || 0)}%</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <Terminal className="w-4 h-4 mb-1 text-slate-500" />
                    <span className="text-[10px] font-mono text-white">{stats?.processCount}</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <Info className="w-4 h-4 mb-1 text-neo-purple" />
                    <span className="text-[10px] font-mono text-white">v2.4</span>
                  </div>
               </div>
             </div>
          </HUDCard>

          
          
        </div>
      </div>

      {/* Footer Status Bar */}
      <footer className="flex items-center justify-between text-[9px] font-mono text-slate-600 uppercase tracking-[0.2em] pt-4 border-t border-white/[0.03]">
        <div className="flex items-center gap-6">
          <span>HOST: SENTINEL-NODE-01</span>
          <span>ZONE: US-WEST-SECURE</span>
          <span className="text-neo-cyan animate-pulse">● LIVE_FEED_ENCRYPTED</span>
        </div>
        <div className="flex items-center gap-4">
          <span>{new Date().toISOString()}</span>
        </div>
      </footer>
    </motion.div>
  );
}
