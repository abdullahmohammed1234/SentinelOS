import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Cpu, Activity, Database, Network, Thermometer, 
  Share2, Maximize2, Zap, AlertTriangle, Crosshair,
  TrendingUp, BarChart3, Layers
} from 'lucide-react';
import { useSystemStats } from '../hooks/useSystemStats';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, 
  ResponsiveContainer, ResponsiveContainer as RC 
} from 'recharts';
import * as d3 from 'd3';
import { ProcessNode } from '../types';
import LoadingScreen from '../components/ui/LoadingScreen';
import Skeleton from '../components/ui/Skeleton';

// --- Sub-Components ---

const HUDFrame = ({ children, title, icon: Icon, className = "" }: any) => (
  <div className={`glass-panel p-4 rounded-xl relative border-white/5 group ${className}`}>
    <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-neo-cyan opacity-20 group-hover:opacity-100 transition-opacity" />
    <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-neo-cyan opacity-20 group-hover:opacity-100 transition-opacity" />
    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-neo-cyan opacity-20 group-hover:opacity-100 transition-opacity" />
    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-neo-cyan opacity-20 group-hover:opacity-100 transition-opacity" />
    
    <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded bg-neo-cyan/10">
          <Icon className="w-4 h-4 text-neo-cyan" />
        </div>
        <h3 className="text-xs font-bold text-white uppercase tracking-widest">{title}</h3>
      </div>
      <div className="flex gap-1">
        <div className="w-1 h-1 rounded-full bg-neo-cyan animate-pulse" />
        <div className="w-1 h-1 rounded-full bg-neo-cyan/30" />
      </div>
    </div>
    {children}
  </div>
);

const ThreadVisualizer = ({ threads }: { threads: number[] }) => {
  return (
    <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
      {threads.map((val, i) => (
        <div key={i} className="flex flex-col gap-1 items-center">
          <div className="h-32 w-2 bg-white/5 rounded-full relative overflow-hidden">
            <motion.div 
              className="absolute bottom-0 w-full bg-gradient-to-t from-neo-cyan to-neo-blue"
              initial={{ height: 0 }}
              animate={{ height: `${val}%` }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            />
            <div className="absolute top-0 left-0 w-full h-full opacity-30">
               {[...Array(6)].map((_, j) => (
                 <div key={j} className="h-[1px] w-full bg-white/20 mb-5" />
               ))}
            </div>
          </div>
          <span className="text-[10px] font-mono text-slate-500">T{i}</span>
        </div>
      ))}
    </div>
  );
};

const ThermalMap = ({ mapData }: { mapData: number[][] }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const cellSize = width / 10;

    mapData.forEach((row, y) => {
      row.forEach((temp, x) => {
        // Simple heatmap: blue to red
        const hue = Math.max(0, 240 - (temp - 30) * 8);
        ctx.fillStyle = `hsla(${hue}, 80%, 50%, 0.6)`;
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        
        // Add subtle glow
        ctx.strokeStyle = `hsla(${hue}, 80%, 60%, 0.1)`;
        ctx.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);
      });
    });
  }, [mapData]);

  return (
    <div className="relative w-full aspect-square bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center">
      <canvas ref={canvasRef} width={300} height={300} className="w-full h-full opacity-80 mix-blend-screen" />
      <div className="absolute inset-0 pointer-events-none grid grid-cols-5 grid-rows-5 opacity-20">
        {[...Array(25)].map((_, i) => <div key={i} className="border border-white/40" />)}
      </div>
      <div className="absolute inset-0 bg-gradient-to-tr from-neo-cyan/5 to-transparent pointer-events-none" />
    </div>
  );
};

const ProcessTree = ({ data }: { data: ProcessNode }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 600;
    const height = 400;
    const g = svg.append('g').attr('transform', 'translate(80, 40)');

    const tree = d3.tree<ProcessNode>().size([height - 80, width - 200]);
    const root = d3.hierarchy(data);
    tree(root);

    const linkGenerator = d3.linkHorizontal<any, any>()
      .x((d: any) => d.y)
      .y((d: any) => d.x);

    g.selectAll('.link')
      .data(root.links())
      .join('path')
      .attr('class', 'link')
      .attr('d', linkGenerator as any)
      .attr('fill', 'none')
      .attr('stroke', 'rgba(0,242,255,0.18)')
      .attr('stroke-width', 1.2);

    const node = g.selectAll('.node')
      .data(root.descendants())
      .join('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${d.y},${d.x})`);

    node.append('circle')
      .attr('r', 5)
      .attr('fill', '#050608')
      .attr('stroke', '#00f2ff')
      .attr('stroke-width', 2);

    node.append('text')
      .attr('dy', '0.31em')
      .attr('x', d => (d.children ? -8 : 8))
      .attr('text-anchor', d => (d.children ? 'end' : 'start'))
      .attr('fill', '#fff')
      .attr('font-size', '10px')
      .attr('font-family', 'JetBrains Mono')
      .text(d => d.data.name);

    node.filter(d => (d.data as any).cpu > 5)
      .append('circle')
      .attr('r', 5)
      .attr('fill', 'none')
      .attr('stroke', '#00f2ff')
      .append('animate')
      .attr('attributeName', 'r')
      .attr('from', '5')
      .attr('to', '15')
      .attr('dur', '1.5s')
      .attr('begin', '0s')
      .attr('repeatCount', 'indefinite');

  }, [data]);

  return (
    <div className="w-full h-[400px] bg-black/40 rounded-lg overflow-hidden border border-white/5">
      <svg ref={svgRef} viewBox="0 0 600 400" className="w-full h-full" />
    </div>
  );
};

export default function SystemVisualization() {
  const { stats, loading } = useSystemStats();
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    if (stats) {
      setHistory(prev => {
        const next = [...prev, {
          time: new Date().toLocaleTimeString([], { hour12: false, second: '2-digit' }),
          load: stats.cpu,
          net: stats.network.download,
          disk: stats.disk.readSpeed + stats.disk.writeSpeed
        }].slice(-30);
        return next;
      });
    }
  }, [stats]);

  if (loading || !stats) {
    return (
      <div className="space-y-6">
        <LoadingScreen message="Rendering system visualization" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-6">
          <Skeleton height={180} className="rounded-2xl lg:col-span-2" />
          <Skeleton height={180} className="rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Top HUD Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border-neo-cyan/20 bg-neo-cyan/5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <motion.div 
              animate={{ opacity: [1, 0.4, 1] }} 
              transition={{ duration: 0.1, repeat: Infinity }}
              className="w-2 h-2 rounded-full bg-red-500" 
            />
            <h2 className="text-2xl font-bold text-white tracking-tighter uppercase font-mono">
              System<span className="text-neo-cyan">_Intelligence</span>_Visualizer
            </h2>
          </div>
          <div className="flex gap-4 text-[10px] font-mono text-slate-400">
             <span>SEC_LAYER: V4_ALPHA</span>
             <span>UPLINK: ACTIVE</span>
             <span>ENCRYPTION: 256_AES</span>
          </div>
        </div>
        <div className="flex gap-6">
           <div className="text-right">
              <span className="text-[10px] text-slate-500 uppercase block">Global Latency</span>
              <span className="text-xl font-mono text-neo-cyan leading-none">{stats.network.latency.toFixed(2)}ms</span>
           </div>
           <div className="text-right border-l border-white/10 pl-6">
              <span className="text-[10px] text-slate-500 uppercase block">Uptime Vector</span>
              <span className="text-xl font-mono text-white leading-none">{Math.floor(stats.uptime / 3600)}h {Math.floor((stats.uptime % 3600) / 60)}m</span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Col: Core Logic */}
        <div className="xl:col-span-2 space-y-6">
           {/* Process Tree */}
           <HUDFrame title="Logical Process Topology" icon={Share2}>
              <ProcessTree data={stats.processTree} />
              <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-4">
                 {[
                   { label: 'Active Handles', val: stats.processCount },
                   { label: 'Zombie States', val: 0 },
                   { label: 'Suspended Threads', val: stats.tasks.filter(t => t.status === 'suspended').length },
                   { label: 'System Root', val: '0x00FF' }
                 ].map((item, i) => (
                   <div key={i} className="bg-white/5 p-2 rounded border border-white/5">
                      <span className="text-[9px] text-slate-500 uppercase block">{item.label}</span>
                      <span className="text-sm font-mono text-white">{item.val}</span>
                   </div>
                 ))}
              </div>
           </HUDFrame>

           {/* Activity Timeline */}
           <HUDFrame title="Activity Temporal Wave" icon={TrendingUp}>
              <div className="h-64 w-full mt-2">
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={history}>
                       <defs>
                          <linearGradient id="colorLoad" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="#00f2ff" stopOpacity={0.3}/>
                             <stop offset="95%" stopColor="#00f2ff" stopOpacity={0}/>
                          </linearGradient>
                       </defs>
                       <Area 
                          type="monotone" 
                          dataKey="load" 
                          stroke="#00f2ff" 
                          fillOpacity={1} 
                          fill="url(#colorLoad)" 
                          isAnimationActive={false}
                        />
                       <Area 
                          type="monotone" 
                          dataKey="net" 
                          stroke="#bc13fe" 
                          fill="transparent"
                          isAnimationActive={false}
                        />
                       <Tooltip 
                          contentStyle={{ background: '#0a0f14', border: '1px solid rgba(0, 242, 255, 0.2)', fontSize: '10px' }}
                          labelStyle={{ color: '#64748b' }}
                        />
                    </AreaChart>
                 </ResponsiveContainer>
              </div>
           </HUDFrame>
        </div>

        {/* Right Col: Physical Diagnostics */}
        <div className="space-y-6">
           {/* CPU Threads */}
           <HUDFrame title="Processor Core Grid" icon={Cpu}>
              <ThreadVisualizer threads={stats.cpuThreads} />
              <div className="mt-4 flex justify-between items-center bg-neo-cyan/5 p-3 rounded">
                 <div>
                    <span className="text-[10px] text-slate-500 uppercase">Load Avg (1m)</span>
                    <div className="text-lg font-mono text-neo-cyan leading-none">
                      {(stats.loadAverage[0]).toFixed(2)}
                    </div>
                 </div>
                 <BarChart3 className="w-8 h-8 text-neo-cyan opacity-20" />
              </div>
           </HUDFrame>

           {/* Thermal Grid */}
           <HUDFrame title="Thermal Gradient Mapping" icon={Thermometer}>
              <ThermalMap mapData={stats.thermal.map} />
              <div className="mt-4 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                     <span className="text-slate-400">GPU Temp</span>
                     <span className="text-red-400 font-mono">{stats.thermal.gpu.toFixed(1)}°C</span>
                  </div>
                  <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                     <motion.div 
                        className="h-full bg-red-500" 
                        animate={{ width: `${(stats.thermal.gpu / 100) * 100}%` }}
                      />
                  </div>
              </div>
           </HUDFrame>

           {/* Bottleneck Warning */}
           <AnimatePresence>
              {stats.cpu > 80 && (
                <motion.div 
                  initial={{ x: 50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 50, opacity: 0 }}
                  className="bg-red-500/10 border border-red-500/50 p-4 rounded-xl flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center animate-pulse">
                     <AlertTriangle className="w-6 h-6 text-red-500" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-red-500 uppercase italic">Bottleneck Detected</h4>
                    <p className="text-[10px] text-red-500/80">CPU saturation exceeding 80% threshold</p>
                  </div>
                </motion.div>
              )}
           </AnimatePresence>
        </div>

      </div>

      {/* Decorative Particle Background Overlay (Abstracted) */}
      <div className="fixed inset-0 pointer-events-none z-[-1] opacity-40">
         <div className="absolute top-1/4 left-1/4 w-px h-px bg-neo-cyan shadow-[0_0_200px_100px_rgba(0,242,255,0.05)]" />
         <div className="absolute top-3/4 left-2/3 w-px h-px bg-neo-purple shadow-[0_0_200px_100px_rgba(188,19,254,0.05)]" />
         <div className="scanline-effect" />
      </div>

    </motion.div>
  );
}
