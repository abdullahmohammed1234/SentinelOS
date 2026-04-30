import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Folder, File, ChevronRight, Search, 
  Download, Trash, Info, Sparkles,
  HardDrive, Database, Globe, RefreshCcw,
  AlertTriangle, Gauge, Layers, PieChart as PieChartIcon,
  Zap, ArrowRight, ShieldCheck, CheckCircle2,
  Filter, SortAsc, LayoutGrid, List
} from 'lucide-react';
import { Treemap, ResponsiveContainer, Tooltip as RechartsTooltip, Cell, PieChart, Pie, Sector } from 'recharts';
import { GoogleGenAI } from "@google/genai";
import { cn } from '../lib/utils';
import { FileNode, FileIntelligenceData } from '../types';
import LoadingScreen from '../components/ui/LoadingScreen';
import Skeleton from '../components/ui/Skeleton';

export default function FileIntelligence() {
  const [files, setFiles] = useState<FileNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [intelData, setIntelData] = useState<FileIntelligenceData | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [cleaning, setCleaning] = useState(false);
  const [viewMode, setViewMode] = useState<'dashboard' | 'explorer'>('dashboard');
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loadingAI, setLoadingAI] = useState(false);

  const fetchFiles = async () => {
    const res = await fetch('/api/files');
    const data = await res.json();
    setFiles(data);
  };

  const generateAiRecommendations = async (stats: any) => {
    if (!process.env.GEMINI_API_KEY) {
      setRecommendations([
        { title: "Optimize Buffers", description: "Node.js cache files detected. Pruning recommended for peak performance.", action: "Optimize" },
        { title: "Duplicate Cleanup", description: "Found multiple system asset clones. De-duplication can reclaim 4% storage.", action: "De-duplicate" },
        { title: "Large File Warning", description: "Kernel resources are reaching threshold limits. Compression suggested.", action: "Compress" }
      ]);
      return;
    }

    setLoadingAI(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyze these storage stats: ${JSON.stringify(stats)}. Return 3-4 smart, futuristic optimization recommendations as a JSON array of objects with 'title', 'description', and 'action' fields. Tonality: technical, AI-driven, systemic.`,
        config: { responseMimeType: "application/json" }
      });
      
      const data = JSON.parse(response.text);
      setRecommendations(data);
    } catch (err) {
      console.error("AI Recommendations failed", err);
    } finally {
      setLoadingAI(false);
    }
  };

  const startScan = async () => {
    setIsScanning(true);
    setScanProgress(0);
    
    // Simulate progress
    const interval = setInterval(() => {
      setScanProgress(prev => Math.min(prev + Math.random() * 15, 95));
    }, 300);

    try {
      const res = await fetch('/api/intelligence/scan');
      const data = await res.json();
      setIntelData(data);
      if (data.stats) {
        generateAiRecommendations(data.stats);
      }
    } catch (err) {
      console.error("Scan failed", err);
    } finally {
      clearInterval(interval);
      setScanProgress(100);
      setTimeout(() => {
        setIsScanning(false);
      }, 500);
    }
  };

  const handleCleanup = async () => {
    setCleaning(true);
    await fetch('/api/intelligence/cleanup', { method: 'POST' });
    setTimeout(() => {
      setCleaning(false);
      startScan(); // Refresh data
    }, 1500);
  };

  useEffect(() => {
    fetchFiles();
    startScan();
    setLoading(false);
  }, []);

  const categoryData = useMemo(() => {
    if (!intelData) return [];
    return Object.entries(intelData.stats.categories).map(([name, value]) => ({
      name,
      value: value as number,
      color: name === 'Code' ? '#00f2ff' :
             name === 'Media' ? '#ff00ea' :
             name === 'System' ? '#ffb800' :
             name === 'Config' ? '#7000ff' : '#64748b'
    })).filter(d => (d.value as number) > 0);
  }, [intelData]);

  const treemapData = useMemo(() => {
    if (!intelData) return [];
    return intelData.stats.largeFiles.map(f => ({
      name: f.name,
      size: f.size,
      sizeFormatted: f.sizeFormatted
    }));
  }, [intelData]);

  if (loading) return (
    <LoadingScreen message="Scanning storage intelligence" />
  );

  return (
    <div className="space-y-6 h-full pb-10">
      {/* Top Header & Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-neo-cyan/10 text-neo-cyan">
             <Database className="w-6 h-6" />
          </div>
          <div>
             <h1 className="text-2xl font-bold text-white tracking-tight">File Intelligence</h1>
             <p className="text-xs text-slate-500 font-mono uppercase tracking-widest">System level storage optimization</p>
          </div>
        </div>

        <div className="flex bg-black/20 p-1 rounded-xl border border-white/5 self-start md:self-center">
           <button 
              onClick={() => setViewMode('dashboard')}
              className={cn(
                "px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2",
                viewMode === 'dashboard' ? "bg-neo-cyan text-black" : "text-slate-400 hover:text-white"
              )}
           >
              <LayoutGrid className="w-3.5 h-3.5" /> Dashboard
           </button>
           <button 
              onClick={() => setViewMode('explorer')}
              className={cn(
                "px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2",
                viewMode === 'explorer' ? "bg-neo-cyan text-black" : "text-slate-400 hover:text-white"
              )}
           >
              <List className="w-3.5 h-3.5" /> Hierarchy
           </button>
        </div>
      </div>

      {/* Stats row can stay same or slightly adjusted labels */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          label="Total Storage Indexed" 
          value={intelData ? formatBytes(intelData.stats.totalSize) : 'Analyzing...'} 
          icon={<HardDrive className="w-4 h-4" />}
          color="neo-cyan"
        />
        <StatCard 
          label="Intelligence Score" 
          value={intelData ? "8.4/10" : '--'} 
          icon={<Gauge className="w-4 h-4" />}
          color="neo-magenta"
        />
        <StatCard 
          label="Optimization Potential" 
          value={intelData ? formatBytes(intelData.stats.tempFiles.length * 1024 * 500) : '--'} 
          icon={<Zap className="w-4 h-4" />}
          color="neo-yellow"
        />
        <StatCard 
          label="Detected Anomalies" 
          value={intelData ? String(intelData.stats.duplicates.length) : '0'} 
          icon={<AlertTriangle className="w-4 h-4" />}
          color="status-danger"
        />
      </div>

      {!intelData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton height={124} className="rounded-2xl" />
          <Skeleton height={124} className="rounded-2xl" />
          <Skeleton height={124} className="rounded-2xl" />
        </div>
      )}

      <AnimatePresence mode="wait">
        {viewMode === 'dashboard' ? (
          <motion.div 
            key="dashboard"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-auto"
          >
            {/* Left Section: Visual Intelligence */}
            <div className="lg:col-span-8 space-y-6">
              <div className="glass-panel overflow-hidden relative">
                <AnimatePresence>
                  {isScanning && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center space-y-4"
                    >
                      <div className="relative w-32 h-32">
                        <motion.div 
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          className="absolute inset-0 border-t-2 border-neo-cyan rounded-full"
                        />
                        <div className="absolute inset-4 flex items-center justify-center font-mono text-neo-cyan">
                          {Math.round(scanProgress)}%
                        </div>
                      </div>
                      <p className="text-sm font-bold font-mono tracking-widest text-neo-cyan uppercase animate-pulse">Recursive Scantree Active</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <div className="p-2 rounded-lg bg-neo-cyan/10 text-neo-cyan">
                        <Layers className="w-5 h-5" />
                     </div>
                     <div>
                        <h2 className="text-lg font-bold text-white leading-tight">Storage Distribution</h2>
                        <p className="text-xs text-slate-500 font-mono tracking-tight uppercase">Interactive volume treemap</p>
                     </div>
                  </div>
                  <button 
                    onClick={startScan}
                    className="px-4 py-2 rounded-lg border border-white/10 hover:bg-white/5 text-xs font-bold text-white transition-all flex items-center gap-2"
                  >
                    <RefreshCcw className="w-3.5 h-3.5" />
                    Rescan
                  </button>
                </div>

                <div className="p-6 h-[400px]">
                  {treemapData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <Treemap
                        data={treemapData}
                        dataKey="size"
                        aspectRatio={4 / 3}
                        stroke="#000"
                        fill="#111"
                      >
                        <RechartsTooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="glass-panel p-3 border-neo-cyan/30 text-xs">
                                  <p className="font-bold text-white mb-1">{data.name}</p>
                                  <p className="text-neo-cyan font-mono">{data.sizeFormatted}</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Cell fill="#00f2ff" />
                      </Treemap>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-500 italic text-sm">
                      Initialize scan to generate volume map.
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="glass-panel p-6">
                    <div className="flex items-center gap-2 mb-6">
                       <Filter className="w-4 h-4 text-neo-cyan" />
                       <h3 className="text-sm font-bold uppercase tracking-wider">File Categorization</h3>
                    </div>
                    <div className="space-y-4">
                       {categoryData.sort((a, b) => b.value - a.value).map((cat) => (
                          <div key={cat.name} className="space-y-1.5">
                             <div className="flex justify-between text-[10px] font-mono">
                                <span className="text-slate-400 capitalize">{cat.name}</span>
                                <span className="text-white font-bold">{formatBytes(cat.value)}</span>
                             </div>
                             <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${(cat.value / (intelData?.stats.totalSize || 1)) * 100}%` }}
                                  style={{ backgroundColor: cat.color }}
                                  className="h-full shadow-[0_0_8px_rgba(0,0,0,0.5)]"
                                />
                             </div>
                          </div>
                       ))}
                    </div>
                 </div>

                 <div className="glass-panel p-6">
                    <div className="flex items-center gap-2 mb-6 text-status-danger">
                       <AlertTriangle className="w-4 h-4" />
                       <h3 className="text-sm font-bold uppercase tracking-wider">Duplicate Entities</h3>
                    </div>
                    <div className="space-y-3 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                       {intelData?.stats.duplicates.length && intelData.stats.duplicates.length > 0 ? (
                          intelData.stats.duplicates.map((dup, i) => (
                             <div key={i} className="p-3 rounded-lg border border-white/5 bg-black/20 flex items-center justify-between">
                                <div className="min-w-0">
                                   <p className="text-xs font-bold text-white truncate">{dup[0].name}</p>
                                   <p className="text-[10px] text-slate-500 font-mono italic">{dup.length} instances found</p>
                                </div>
                                <button className="p-1.5 rounded-md hover:bg-status-danger/20 text-status-danger transition-colors">
                                   <Trash className="w-3.5 h-3.5" />
                                </button>
                             </div>
                          ))
                       ) : (
                          <div className="flex flex-col items-center justify-center h-full opacity-30 text-center py-4">
                             <CheckCircle2 className="w-8 h-8 mb-2" />
                             <p className="text-xs">No duplicates detected.</p>
                          </div>
                       )}
                    </div>
                 </div>
              </div>
            </div>

            {/* Right Section: Smart Actions & Recommendations */}
            <div className="lg:col-span-4 space-y-6">
              <div className="glass-panel p-6 bg-gradient-to-br from-neo-cyan/5 to-transparent border-neo-cyan/10">
                 <div className="flex items-center gap-2 text-neo-cyan mb-6">
                    <Sparkles className="w-5 h-5 animate-pulse" />
                    <h3 className="text-sm font-bold uppercase tracking-wider">AI RECOMMENDATIONS</h3>
                 </div>
                 
                 <div className="space-y-4">
                    {recommendations.length > 0 ? recommendations.map((rec, idx) => (
                      <RecommendationItem 
                         key={idx}
                         icon={<Zap className="w-4 h-4" />}
                         title={rec.title}
                         description={rec.description}
                         action={rec.action}
                         onAction={rec.title.includes('Clear') ? handleCleanup : undefined}
                         loading={rec.title.includes('Clear') && cleaning}
                      />
                    )) : (
                      <div className="text-center py-8 opacity-20 italic text-xs">Waiting for AI assessment...</div>
                    )}
                    {loadingAI && <p className="text-[10px] text-neo-cyan text-center animate-pulse">Analyzing neural storage patterns...</p>}
                 </div>
              </div>

              <div className="glass-panel p-6 border-white/5">
                 <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                       <SortAsc className="w-4 h-4 text-slate-500" />
                       <h3 className="text-sm font-bold uppercase tracking-wider">Large Files</h3>
                    </div>
                 </div>
                 <div className="space-y-2">
                    {intelData?.stats.largeFiles.map((file) => (
                       <div key={file.id} className="group p-3 rounded-xl border border-white/5 bg-black/20 hover:border-neo-cyan/30 transition-all cursor-pointer">
                          <div className="flex items-center gap-3">
                             <div className="p-2 rounded-lg bg-white/5 group-hover:bg-neo-cyan/10 transition-colors">
                                <File className="w-4 h-4 text-slate-400 group-hover:text-neo-cyan" />
                             </div>
                             <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-white truncate leading-none mb-1">{file.name}</p>
                                <p className="text-[10px] font-mono text-slate-600 truncate">{file.path}</p>
                             </div>
                             <div className="text-[10px] font-mono font-bold text-neo-magenta">
                                {file.sizeFormatted}
                             </div>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>

              <div 
                 className="glass-panel h-40 border-dashed border-white/10 flex flex-col items-center justify-center text-center p-6 group hover:border-neo-cyan/50 transition-all cursor-pointer"
                 onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                 onDrop={(e) => { e.preventDefault(); e.stopPropagation(); startScan(); }}
              >
                 <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3 group-hover:bg-neo-cyan/10 group-hover:text-neo-cyan transition-colors">
                    <RefreshCcw className="w-6 h-6 opacity-30 group-hover:opacity-100" />
                 </div>
                 <p className="text-xs font-bold text-slate-400">Drag folder here to scan</p>
                 <p className="text-[10px] text-slate-600 mt-1 uppercase tracking-widest">or click to browse paths</p>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="explorer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-4 gap-6"
          >
             {/* File Browser Hierarchy */}
             <div className="lg:col-span-3 glass-panel rounded-2xl flex flex-col overflow-hidden h-[600px]">
                <div className="p-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                   <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neo-cyan/10 border border-neo-cyan/20 text-neo-cyan">
                         <HardDrive className="w-4 h-4" />
                         <span className="text-xs font-bold font-mono">LOCAL_FS</span>
                      </div>
                   </div>
                   <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input 
                        type="text" 
                        placeholder="Recursive search..."
                        className="pl-10 pr-4 py-2 bg-black/20 border border-white/5 rounded-lg text-sm text-white w-64"
                      />
                   </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                   <div className="space-y-1">
                      {files.map((node) => (
                        <FileItem 
                          key={node.id} 
                          node={node} 
                          level={0} 
                          onSelect={setSelectedFile} 
                          selectedId={selectedFile?.id}
                        />
                      ))}
                   </div>
                </div>
             </div>

             {/* Inspector Sidepanel */}
             <div className="lg:col-span-1 space-y-6">
                <div className={cn(
                  "glass-panel rounded-2xl p-6 transition-all duration-500",
                  selectedFile ? "opacity-100 translate-y-0" : "opacity-30 pointer-events-none"
                )}>
                  <div className="flex items-center gap-2 text-neo-cyan mb-6">
                    <Info className="w-5 h-5" />
                    <h3 className="text-sm font-bold uppercase tracking-wider">Node Inspector</h3>
                  </div>

                  {selectedFile ? (
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-lg font-bold text-white mb-1 truncate">{selectedFile.name}</h4>
                        <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                          ID: {selectedFile.id.substring(0, 12)}...
                        </p>
                      </div>

                      <div className="p-4 rounded-xl bg-neo-cyan/5 border border-neo-cyan/10">
                        <p className="text-xs text-slate-300 leading-relaxed italic">
                          "{selectedFile.intel || "Diagnostic: Standard file system entry. Entropy levels normal."}"
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                         <div className="p-3 rounded-lg border border-white/5 bg-black/20">
                            <p className="text-[8px] font-mono text-slate-500 uppercase mb-1">Payload</p>
                            <p className="text-xs font-bold text-white tracking-widest">{selectedFile.sizeFormatted || '--'}</p>
                         </div>
                         <div className="p-3 rounded-lg border border-white/5 bg-black/20">
                            <p className="text-[8px] font-mono text-slate-500 uppercase mb-1">Accessed</p>
                            <p className="text-xs font-bold text-white tracking-widest">{selectedFile.modified.split('T')[0].replace(/-/g, '.')}</p>
                         </div>
                      </div>

                      <div className="pt-6 border-t border-white/5 flex gap-2">
                         <button className="flex-1 py-2 rounded-lg bg-neo-cyan text-black text-[10px] font-bold uppercase tracking-widest hover:brightness-110 transition-all">
                            Analyze
                         </button>
                         <button className="p-2 rounded-lg border border-white/10 hover:bg-white/5 transition-colors">
                            <Download className="w-4 h-4" />
                         </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                      <p className="text-xs text-slate-500">Pick a sector to reveal metadata</p>
                    </div>
                  )}
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail Modal Overlay would go here */}
    </div>
  );
}

function StatCard({ label, value, icon, color }: any) {
  return (
    <div className="glass-panel p-5 relative overflow-hidden group">
      <div className={cn("absolute top-0 left-0 w-1 h-full bg-", color)} />
      <div className="flex items-center justify-between mb-3">
         <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{label}</span>
         <div className={cn("text-", color, "opacity-50 group-hover:opacity-100 transition-opacity")}>
            {icon}
         </div>
      </div>
      <div className="flex items-baseline gap-1">
         <span className="text-2xl font-bold text-white font-mono tracking-tight">{value}</span>
      </div>
    </div>
  );
}

function RecommendationItem({ icon, title, description, action, onAction, loading }: any) {
  return (
    <div className="p-4 rounded-xl border border-white/5 bg-black/20 hover:bg-white/[0.02] transition-colors">
       <div className="flex gap-4">
          <div className="mt-1 p-2 rounded-lg bg-white/5 text-slate-400">
             {icon}
          </div>
          <div className="space-y-1 flex-1">
             <h4 className="text-xs font-bold text-white">{title}</h4>
             <p className="text-[10px] text-slate-500 leading-relaxed italic line-clamp-2">
                {description}
             </p>
             <button 
                onClick={onAction}
                disabled={loading}
                className="mt-2 text-[10px] font-bold text-neo-cyan uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all disabled:opacity-50"
             >
                {loading ? 'Processing...' : <>{action} <ArrowRight className="w-3 h-3" /></>}
             </button>
          </div>
       </div>
    </div>
  );
}

function FileItem({ node, level, onSelect, selectedId }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const isSelected = selectedId === node.id;

  return (
    <div>
      <div 
        onClick={() => {
          if (node.type === 'directory') setIsOpen(!isOpen);
          onSelect(node);
        }}
        className={cn(
          "flex items-center gap-2 py-2 px-3 rounded-lg cursor-pointer transition-colors group",
          isSelected ? "bg-neo-cyan/10 border border-neo-cyan/20" : "hover:bg-white/[0.02] border border-transparent",
          level > 0 && "ml-4 border-l border-white/5 rounded-none rounded-r-lg"
        )}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {node.type === 'directory' ? (
            <div className="flex items-center gap-1.5">
               <ChevronRight className={cn("w-3 h-3 text-slate-600 transition-transform", isOpen && "rotate-90")} />
               <Folder className="w-4 h-4 text-neo-cyan/60" />
            </div>
          ) : (
            <File className="w-4 h-4 text-slate-500 ml-4.5" />
          )}
          <span className={cn(
            "text-sm font-medium transition-colors",
            isSelected ? "text-neo-cyan" : "text-slate-300 group-hover:text-white"
          )}>
            {node.name}
          </span>
        </div>
        {node.sizeFormatted && <span className="text-[10px] font-mono text-slate-600">{node.sizeFormatted}</span>}
      </div>
      
      <AnimatePresence>
        {isOpen && node.children && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            {node.children.map((child: any) => (
              <FileItem 
                key={child.id} 
                node={child} 
                level={level + 1} 
                onSelect={onSelect} 
                selectedId={selectedId}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
