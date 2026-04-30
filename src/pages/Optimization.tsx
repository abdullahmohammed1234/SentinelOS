import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, 
  Trash2, 
  Cpu, 
  Activity, 
  Settings2, 
  CheckCircle2, 
  ArrowRight,
  HardDrive,
  Rocket,
  ShieldCheck,
  ChevronRight,
  BarChart3,
  Clock,
  RefreshCcw,
  Gauge,
  FileSearch as FileSearchIcon
} from 'lucide-react';
import { useOptimization } from '../hooks/useOptimization';
import { cn } from '../lib/utils';

const OptimizationCard = ({ 
  title, 
  description, 
  icon: Icon, 
  status, 
  value, 
  unit 
}: { 
  title: string; 
  description: string; 
  icon: any; 
  status: 'pending' | 'scanning' | 'ready' | 'optimized';
  value?: string | number;
  unit?: string;
}) => (
  <div className="glass-panel p-5 overflow-hidden group">
    <div className="relative z-10">
      <div className="flex items-start justify-between mb-4">
        <div className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center border",
          status === 'optimized' 
            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
            : "bg-neo-cyan/10 border-neo-cyan/30 text-neo-cyan"
        )}>
          <Icon className="w-5 h-5" />
        </div>
        {status === 'optimized' && (
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center"
          >
            <CheckCircle2 className="w-3 h-3 text-white" />
          </motion.div>
        )}
      </div>
      <div>
        <h3 className="text-sm font-bold text-white mb-1 uppercase tracking-tight">{title}</h3>
        <p className="text-[11px] text-slate-500 leading-relaxed mb-3">{description}</p>
      </div>

      <div className="flex items-end gap-1 font-mono">
        <span className={cn(
          "text-lg font-black leading-none",
          status === 'optimized' ? "text-emerald-400" : "text-white"
        )}>
          {value || '--'}
        </span>
        <span className="text-[10px] text-slate-500 uppercase pb-0.5">{unit}</span>
      </div>
    </div>
    <div className="absolute top-0 right-0 p-1 opacity-10 group-hover:opacity-20 transition-opacity">
      <Icon className="w-16 h-16 transform translate-x-4 translate-y--4 rotate-12" />
    </div>
  </div>
);

const ProgressBar = ({ progress, label }: { progress: number, label: string }) => (
  <div className="space-y-2">
    <div className="flex justify-between text-[10px] font-mono uppercase tracking-widest">
      <span className="text-slate-500">{label}</span>
      <span className="text-neo-cyan">{progress}%</span>
    </div>
    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        className="h-full bg-gradient-to-r from-neo-blue to-neo-cyan shadow-[0_0_10px_rgba(0,242,255,0.3)]"
      />
    </div>
  </div>
);

const StatsBadge = ({ label, value, icon: Icon, colorClass }: any) => (
  <div className="glass-panel px-4 py-3 flex items-center gap-4">
    <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", colorClass)}>
      <Icon className="w-4 h-4" />
    </div>
    <div>
      <p className="text-[9px] text-slate-500 font-mono uppercase tracking-[0.15em] mb-0.5">{label}</p>
      <p className="text-sm font-black text-white">{value}</p>
    </div>
  </div>
);

export default function Optimization() {
  const { 
    isScanning, 
    isOptimizing, 
    metrics, 
    results, 
    scanProgress, 
    optimizeProgress, 
    scan, 
    optimize 
  } = useOptimization();

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const performanceScore = useMemo(() => {
    if (results) return 98;
    if (metrics) return 72;
    return 84;
  }, [metrics, results]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-6xl mx-auto space-y-8"
    >
      {/* Hero Header */}
      <div className="flex flex-col md:flex-row gap-8 items-center justify-between bg-neo-cyan/5 border border-neo-cyan/20 rounded-2xl p-10 relative overflow-hidden">
        <div className="scanline-effect opacity-30" />
        <div className="relative z-10 flex-1">
          <div className="flex items-center gap-3 mb-4">
            <div className="px-2 py-1 bg-neo-cyan/20 border border-neo-cyan/50 rounded text-[10px] font-mono text-neo-cyan uppercase tracking-widest animate-pulse">
              System Health: Optimized
            </div>
          </div>
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter mb-4 leading-none">
            Optimization <span className="text-neo-cyan">Core</span>
          </h1>
          <p className="text-slate-400 max-w-md text-sm leading-relaxed mb-8">
            Advanced heuristic analysis and system cleanup engine. Deploy Sentinel deep-scan to identify and reclaim performance overhead.
          </p>
          
          <div className="flex flex-wrap gap-4">
            {!metrics && !results && !isScanning && (
              <button 
                id="btn-scan"
                onClick={scan}
                className="px-8 py-3 bg-neo-cyan text-black font-bold uppercase tracking-wider text-xs rounded hover:bg-white transition-all shadow-[0_0_20px_rgba(0,242,255,0.4)] flex items-center gap-2"
              >
                <FileSearchIcon className="w-4 h-4" />
                Initialize Deep Scan
              </button>
            )}
            
            {metrics && !isOptimizing && (
              <button 
                id="btn-optimize"
                onClick={optimize}
                className="px-10 py-4 bg-emerald-500 text-black font-black uppercase tracking-[0.1em] text-sm rounded hover:bg-white transition-all shadow-[0_0_30px_rgba(16,185,129,0.5)] flex items-center gap-3 group"
              >
                <Zap className="w-5 h-5 fill-current group-hover:animate-bounce" />
                Deploy Optimization
              </button>
            )}

            {(isScanning || isOptimizing) && (
              <div className="flex items-center gap-6 w-full max-w-sm">
                <div className="flex-1">
                  <ProgressBar 
                    progress={isScanning ? scanProgress : optimizeProgress} 
                    label={isScanning ? "Scanning File System..." : "Optimizing Architecture..."}
                  />
                </div>
                <div className="flex flex-col items-center">
                  <RefreshCcw className="w-5 h-5 text-neo-cyan animate-spin" />
                </div>
              </div>
            )}

            {results && (
              <button 
                id="btn-reset"
                onClick={scan}
                className="px-6 py-3 border border-white/20 text-white font-bold uppercase tracking-wider text-xs rounded hover:bg-white/10 transition-all flex items-center gap-2"
              >
                <RefreshCcw className="w-4 h-4" />
                New Analysis
              </button>
            )}
          </div>
        </div>

        {/* Score Visual */}
        <div className="relative w-48 h-48 flex items-center justify-center flex-shrink-0">
          <svg className="w-full h-full -rotate-90">
            <circle
              cx="96"
              cy="96"
              r="80"
              className="stroke-white/5 fill-none"
              strokeWidth="10"
            />
            <motion.circle
              cx="96"
              cy="96"
              r="80"
              className={cn(
                "stroke-neo-cyan fill-none",
                results ? "stroke-emerald-400" : ""
              )}
              strokeWidth="10"
              strokeDasharray={2 * Math.PI * 80}
              initial={{ strokeDashoffset: 2 * Math.PI * 80 }}
              animate={{ 
                strokeDashoffset: 2 * Math.PI * 80 * (1 - performanceScore/100) 
              }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">Health</p>
            <motion.p 
              key={performanceScore}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={cn(
                "text-5xl font-black leading-none",
                results ? "text-emerald-400" : "text-white"
              )}
            >
              {performanceScore}
            </motion.p>
            <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase mt-1">Score</p>
          </div>
        </div>
      </div>

      {/* Statistics Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsBadge 
          label="Recoverable Storage"
          value={metrics ? formatSize(metrics.storageRecoverable) : results ? formatSize(results.storageRecovered) : '0 GB'}
          icon={HardDrive}
          colorClass="bg-neo-blue/20 text-neo-blue border border-neo-blue/30"
        />
        <StatsBadge 
          label="Memory Overhead"
          value={metrics ? formatSize(metrics.ramFreeable) : results ? formatSize(results.ramFreed) : '0 MB'}
          icon={Activity}
          colorClass="bg-neo-purple/20 text-neo-purple border border-neo-purple/30"
        />
        <StatsBadge 
          label="Performance Gain"
          value={metrics ? `${metrics.cpuOptimizationPotential}%` : results ? `+${results.cpuImprovement}%` : '0%'}
          icon={Gauge}
          colorClass="bg-neo-cyan/20 text-neo-cyan border border-neo-cyan/30"
        />
      </div>

      {/* Modules Grid */}
      <h2 className="text-xs font-mono text-slate-500 uppercase tracking-[0.3em] pl-1">Optimization Matrix</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <OptimizationCard 
          title="Temp File Cleanup"
          description="Detection of redundant cache, logs, and temporary directory bloat."
          icon={Trash2}
          status={results ? 'optimized' : metrics ? 'ready' : 'pending'}
          value={results ? results.tempFilesDeleted : metrics?.tempFilesCount}
          unit="Files"
        />
        <OptimizationCard 
          title="Memory Optimization"
          description="Analyze RAM allocation and reclaim leaked or idle memory buffers."
          icon={Cpu}
          status={results ? 'optimized' : metrics ? 'ready' : 'pending'}
          value={results ? formatSize(results.ramFreed).split(' ')[0] : metrics ? formatSize(metrics.ramFreeable).split(' ')[0] : undefined}
          unit={results ? formatSize(results.ramFreed).split(' ')[1] : metrics ? formatSize(metrics.ramFreeable).split(' ')[1] : 'MB'}
        />
        <OptimizationCard 
          title="Background Analysis"
          description="Heuristic monitoring of hidden processes draining system resources."
          icon={BarChart3}
          status={results ? 'optimized' : metrics ? 'ready' : 'pending'}
          value={results ? results.tasksTerminated : metrics?.backgroundProcessCount}
          unit="Active"
        />
        <OptimizationCard 
          title="Startup Management"
          description="Identify non-critical applications delaying system initialization."
          icon={Rocket}
          status={results ? 'optimized' : metrics ? 'ready' : 'pending'}
          value={metrics?.startupItemsCount}
          unit="Items"
        />
        <OptimizationCard 
          title="Disk Defragmentation"
          description="Intelligent file alignment for SSD throughput improvement."
          icon={HardDrive}
          status={results ? 'optimized' : metrics ? 'ready' : 'pending'}
          value={results ? '100' : metrics ? '67' : undefined}
          unit="Health"
        />
        <OptimizationCard 
          title="Security Hardening"
          description="Automatic patching of common vulnerabilities and port shielding."
          icon={ShieldCheck}
          status={results ? 'optimized' : metrics ? 'ready' : 'pending'}
          value={results ? 'Active' : metrics ? 'Protected' : undefined}
          unit="Status"
        />
      </div>

      {/* Detailed Insights */}
      {results && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-panel p-8 border-emerald-500/20"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/40">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white uppercase tracking-tight">Optimization Report</h3>
              <p className="text-xs text-slate-500 font-mono">ID: SNTL-OPT-{Math.random().toString(36).substr(2, 6).toUpperCase()}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-1">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest">Total Freed</p>
              <p className="text-2xl font-black text-emerald-400">{formatSize(results.storageRecovered + results.ramFreed)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest">CPU Gain</p>
              <p className="text-2xl font-black text-emerald-400">+{results.cpuImprovement}%</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest">Processes Cut</p>
              <p className="text-2xl font-black text-white">{results.tasksTerminated}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest">Est. Battery Life</p>
              <p className="text-2xl font-black text-emerald-400">+45m</p>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

const FileSearch = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <circle cx="11.5" cy="15.5" r="2.5" />
    <path d="M13.3 17.3l1.7 1.7" />
  </svg>
);
