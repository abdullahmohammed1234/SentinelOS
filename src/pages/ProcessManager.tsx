import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useSystemStats } from '../hooks/useSystemStats';
import { 
  Search, 
  Filter, 
  MoreVertical, 
  Play, 
  Pause, 
  Trash2, 
  RefreshCcw, 
  AlertTriangle, 
  ShieldAlert, 
  Activity,
  ChevronDown,
  ChevronUp,
  Cpu,
  MemoryStick as Memory,
  Clock,
  User,
  Zap,
  Info
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Task } from '../types';
import { LineChart, Line, ResponsiveContainer, YAxis, Tooltip } from 'recharts';
import LoadingScreen from '../components/ui/LoadingScreen';
import Skeleton from '../components/ui/Skeleton';
import { useDebouncedValue } from '../hooks/useDebouncedValue';

type SortConfig = {
  key: keyof Task;
  direction: 'asc' | 'desc';
};

export default function ProcessManager() {
  const { stats, loading } = useSystemStats();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'cpu', direction: 'desc' });
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [cpuFilter, setCpuFilter] = useState<number>(0);
  const [memoryFilter, setMemoryFilter] = useState<number>(0);
  const [notifications, setNotifications] = useState<{ id: string; message: string; type: 'warning' | 'danger' }[]>([]);
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 150);

  // Action handlers
  const handleAction = async (taskId: string, action: 'terminate' | 'suspend' | 'resume') => {
    try {
      const response = await fetch(`/api/processes/${taskId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      if (!response.ok) throw new Error('Action failed');
      
      // Add success notification
      const id = Math.random().toString(36).substr(2, 9);
      setNotifications(prev => [...prev, { id, message: `Process ${taskId} ${action}d successfully`, type: 'warning' }]);
      setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 5000);
    } catch (err) {
      console.error(err);
    }
  };

  // Suspicious process detection
  const getRiskScore = (task: Task) => {
    let score = 0;
    if (task.cpu > 40) score += 40;
    if (task.memory > 2000) score += 30;
    if (task.user === 'unknown') score += 20;
    if (task.isBackground && task.cpu > 15) score += 10;
    return Math.min(score, 100);
  };

  const filteredTasks = useMemo(() => {
    if (!stats?.tasks) return [];
    
    return stats.tasks
      .filter(task => {
        const matchesSearch = task.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) || 
                 task.id.includes(debouncedSearchQuery) ||
                 task.pid.toString().includes(debouncedSearchQuery);
        const matchesCpu = task.cpu >= cpuFilter;
        const matchesMem = task.memory >= memoryFilter;
        return matchesSearch && matchesCpu && matchesMem;
      })
      .sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
  }, [stats?.tasks, debouncedSearchQuery, sortConfig, cpuFilter, memoryFilter]);

  const toggleSort = (key: keyof Task) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const selectedTask = stats?.tasks.find(t => t.id === selectedTaskId);

  if (loading && !stats) {
    return (
      <div className="space-y-6">
        <LoadingScreen message="Loading process telemetry" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6">
          <Skeleton height={120} className="rounded-2xl" />
          <Skeleton height={120} className="rounded-2xl" />
          <Skeleton height={120} className="rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-6 relative"
    >
      {/* Notifications overlay */}
      <div className="fixed top-24 right-8 z-[100] space-y-3 pointer-events-none">
        <AnimatePresence>
          {notifications.map(n => (
            <motion.div
              key={n.id}
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 100, opacity: 0 }}
              className={cn(
                "px-4 py-3 rounded-lg border backdrop-blur-xl flex items-center gap-3 shadow-2xl pointer-events-auto",
                n.type === 'danger' ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-neo-cyan/10 border-neo-cyan/20 text-neo-cyan"
              )}
            >
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium">{n.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-neo-cyan" />
            Process Manager
          </h2>
          <p className="text-sm text-slate-500 mt-1">SentinelOS Cybersecurity-Grade Task Inspector</p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono">
            <div className="w-2 h-2 rounded-full bg-neo-cyan animate-pulse" />
            <span className="text-slate-400">THREATS:</span>
            <span className={cn(
              "font-bold",
              stats?.tasks.some(t => getRiskScore(t) > 60) ? "text-red-400" : "text-neo-cyan"
            )}>
              {stats?.tasks.filter(t => getRiskScore(t) > 60).length || 0} ACTIVE
            </span>
          </div>
          <button className="p-2 glass-panel rounded-lg hover:bg-white/5 transition-colors">
            <RefreshCcw className="w-4 h-4 text-neo-cyan" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-panel rounded-xl overflow-hidden backdrop-blur-3xl border-white/10">
            <div className="p-4 border-b border-white/5 flex flex-wrap items-center gap-4 bg-white/[0.02]">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Scan processes (NAME, PID, USER)..."
                  className="w-full pl-10 pr-4 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-neo-cyan/50 transition-colors"
                />
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-2 bg-black/20 border border-white/10 rounded-lg">
                  <Cpu className="w-3.5 h-3.5 text-slate-500" />
                  <input 
                    type="range" min="0" max="100" value={cpuFilter} onChange={(e) => setCpuFilter(Number(e.target.value))}
                    className="w-16 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-neo-cyan"
                  />
                  <span className="text-[10px] font-mono text-slate-400">{cpuFilter}%+</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-black/20 border border-white/10 rounded-lg">
                  <Memory className="w-3.5 h-3.5 text-slate-500" />
                  <input 
                    type="range" min="0" max="8000" step="500" value={memoryFilter} onChange={(e) => setMemoryFilter(Number(e.target.value))}
                    className="w-16 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-neo-purple"
                  />
                  <span className="text-[10px] font-mono text-slate-400">{(memoryFilter/1024).toFixed(1)}GB+</span>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-black/40 text-[10px] font-bold text-[#64748b] uppercase tracking-widest border-b border-white/5">
                    <th className="px-6 py-4 cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort('name')}>
                      Process {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? <ChevronUp className="inline w-3 h-3 ml-1" /> : <ChevronDown className="inline w-3 h-3 ml-1" />)}
                    </th>
                    <th className="px-4 py-4 text-center cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort('pid')}>
                      PID {sortConfig.key === 'pid' && (sortConfig.direction === 'asc' ? <ChevronUp className="inline w-3 h-3 ml-1" /> : <ChevronDown className="inline w-3 h-3 ml-1" />)}
                    </th>
                    <th className="px-4 py-4 text-right cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort('cpu')}>
                      CPU % {sortConfig.key === 'cpu' && (sortConfig.direction === 'asc' ? <ChevronUp className="inline w-3 h-3 ml-1" /> : <ChevronDown className="inline w-3 h-3 ml-1" />)}
                    </th>
                    <th className="px-4 py-4 text-right cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort('memory')}>
                      Memory {sortConfig.key === 'memory' && (sortConfig.direction === 'asc' ? <ChevronUp className="inline w-3 h-3 ml-1" /> : <ChevronDown className="inline w-3 h-3 ml-1" />)}
                    </th>
                    <th className="px-4 py-4 text-center">Security</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {filteredTasks.map((task) => {
                    const risk = getRiskScore(task);
                    const isSuspicious = risk > 50;
                    
                    return (
                      <motion.tr 
                        layout
                        key={task.id} 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={cn(
                          "group transition-all cursor-pointer text-[12px] relative overflow-hidden",
                          selectedTaskId === task.id ? "bg-white/[0.05]" : "hover:bg-white/[0.02]",
                          isSuspicious && "bg-red-500/5"
                        )}
                        onClick={() => setSelectedTaskId(task.id)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-[#e2e8f0] font-medium flex items-center gap-2">
                              {task.name}
                              {task.status === 'suspended' && <Pause className="w-3 h-3 text-yellow-400" />}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono lowercase">@{task.user}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center text-slate-400 font-mono">
                          {task.pid}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex flex-col items-end">
                            <span className={cn(
                              "font-mono font-bold",
                              task.cpu > 50 ? "text-red-400" : task.cpu > 20 ? "text-yellow-400" : "text-neo-cyan"
                            )}>
                              {task.cpu.toFixed(1)}%
                            </span>
                            <div className="w-12 h-1 bg-white/10 rounded-full mt-1 overflow-hidden">
                              <motion.div 
                                className={cn("h-full", task.cpu > 50 ? "bg-red-400" : "bg-neo-cyan")}
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(task.cpu, 100)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right text-neo-purple font-mono">
                          {task.memory >= 1024 ? `${(task.memory/1024).toFixed(1)}GB` : `${task.memory}MB`}
                        </td>
                        <td className="px-4 py-4 text-center">
                          {isSuspicious ? (
                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/30 text-[9px] text-red-300 font-bold uppercase tracking-wider">
                              <Zap className="w-2.5 h-2.5" />
                              RISK: {risk}
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-neo-cyan/10 border border-neo-cyan/20 text-[9px] text-neo-cyan font-bold uppercase tracking-wider">
                              SAFE
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {task.status === 'suspended' ? (
                              <button onClick={(e) => { e.stopPropagation(); handleAction(task.id, 'resume'); }} className="p-1.5 rounded-lg hover:bg-green-500/20 text-green-400" title="Resume">
                                <Play className="w-4 h-4" />
                              </button>
                            ) : (
                              <button onClick={(e) => { e.stopPropagation(); handleAction(task.id, 'suspend'); }} className="p-1.5 rounded-lg hover:bg-yellow-500/20 text-yellow-400" title="Suspend">
                                <Pause className="w-4 h-4" />
                              </button>
                            )}
                            <button onClick={(e) => { e.stopPropagation(); handleAction(task.id, 'terminate'); }} className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400" title="Terminate">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Details Sidebar */}
        <div className="space-y-6">
          <AnimatePresence mode="wait">
            {selectedTask ? (
              <motion.div 
                key={selectedTask.id}
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 20, opacity: 0 }}
                className="glass-panel rounded-2xl p-6 border-white/10 backdrop-blur-3xl sticky top-24"
              >
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">{selectedTask.name}</h3>
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] font-mono text-slate-500">PID: {selectedTask.pid}</span>
                       <span className={cn(
                        "text-[9px] px-1.5 rounded bg-white/5 border border-white/10 uppercase",
                        selectedTask.status === 'running' ? "text-neo-cyan" : "text-yellow-400"
                       )}>{selectedTask.status}</span>
                    </div>
                  </div>
                  <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                    <Activity className="w-5 h-5 text-neo-cyan" />
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-black/40 rounded-xl border border-white/5">
                      <div className="text-[10px] text-slate-500 uppercase flex items-center gap-1.5 mb-1">
                        <Cpu className="w-3 h-3" /> CPU Load
                      </div>
                      <div className="text-xl font-mono font-bold text-neo-cyan">{selectedTask.cpu.toFixed(1)}%</div>
                    </div>
                    <div className="p-4 bg-black/40 rounded-xl border border-white/5">
                      <div className="text-[10px] text-slate-500 uppercase flex items-center gap-1.5 mb-1">
                        <Memory className="w-3 h-3" /> Memory
                      </div>
                      <div className="text-xl font-mono font-bold text-neo-purple">{selectedTask.memory}MB</div>
                    </div>
                  </div>

                  <div className="p-4 bg-black/40 rounded-xl border border-white/5">
                    <div className="text-[10px] text-slate-500 uppercase flex items-center gap-1.5 mb-1">
                      <Clock className="w-3 h-3" /> Runtime
                    </div>
                    <div className="text-sm font-mono font-bold text-white">{selectedTask.runtime}</div>
                  </div>

                  <div className="p-4 bg-black/40 rounded-xl border border-white/5">
                    <div className="text-[10px] text-slate-500 uppercase flex items-center gap-1.5 mb-1">
                      <User className="w-3 h-3" /> Owner
                    </div>
                    <div className="text-sm font-mono font-bold text-white uppercase tracking-wider">{selectedTask.user}</div>
                  </div>
                </div>

                {/* Live Activity Graph */}
                <div className="mb-8">
                   <div className="flex items-center justify-between mb-3 px-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live Activity Log</span>
                      <span className="text-[9px] text-neo-cyan font-mono">RE-AL_TIME</span>
                   </div>
                   <div className="h-24 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                         <LineChart data={selectedTask.history.map((val, i) => ({ val, i }))}>
                            <Line 
                              type="monotone" 
                              dataKey="val" 
                              stroke="#00f2ff" 
                              strokeWidth={2} 
                              dot={false}
                              isAnimationActive={false} 
                            />
                            <YAxis hide domain={[0, 100]} />
                            <Tooltip 
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  return (
                                    <div className="bg-black/80 border border-white/10 px-2 py-1 rounded text-[10px] text-neo-cyan font-mono">
                                      {payload[0].value?.toString().slice(0, 4)}%
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                         </LineChart>
                      </ResponsiveContainer>
                   </div>
                </div>

                {/* Risk Alert */}
                {getRiskScore(selectedTask) > 50 && (
                  <div className="mb-8 p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                    <div className="flex items-center gap-2 mb-2">
                       <AlertTriangle className="w-4 h-4 text-red-400" />
                       <span className="text-xs font-bold text-red-400 uppercase tracking-wide">Threat Detected</span>
                    </div>
                    <p className="text-[11px] text-red-300/80 leading-relaxed">
                       This process is exhibiting unusual behavior. CPU consumption exceeds Sentinel standards for this user profile.
                    </p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button 
                    onClick={() => handleAction(selectedTask.id, selectedTask.status === 'suspended' ? 'resume' : 'suspend')}
                    className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
                  >
                    {selectedTask.status === 'suspended' ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                    {selectedTask.status === 'suspended' ? 'Resume' : 'Suspend'}
                  </button>
                  <button 
                    onClick={() => handleAction(selectedTask.id, 'terminate')}
                    className="flex-1 py-3 rounded-xl bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-bold uppercase tracking-widest hover:bg-red-500/30 transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-3 h-3" />
                    Terminate
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="glass-panel rounded-2xl p-12 border-dashed border-white/10 flex flex-col items-center justify-center text-center">
                 <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                    <Info className="w-8 h-8 text-slate-500" />
                 </div>
                 <h4 className="text-white font-medium mb-1">Select a Process</h4>
                 <p className="text-xs text-slate-500">Click any task to view deep intelligence and resource allocation logs.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
