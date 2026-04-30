import { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  Cpu, 
  Terminal, 
  FileSearch, 
  Settings, 
  ChevronRight,
  Shield,
  Activity,
  Box,
  Layers,
  Zap,
  Bell,
  Power
} from 'lucide-react';
import { cn } from './lib/utils';
import { QuickActions } from './components/DashboardWidgets';

// Context & Manager
import { NotificationProvider, useNotifications } from './hooks/useNotifications';
import { NotificationManager } from './components/NotificationManager';
import { AlertHistoryPanel } from './components/AlertHistoryPanel';
import { useAlertEngine } from './hooks/useAlertEngine';
import './styles/futuristic.css';
import ParticleBackground from './components/ui/ParticleBackground';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const ProcessManager = lazy(() => import('./pages/ProcessManager'));
const GhostShell = lazy(() => import('./pages/GhostShell'));
const FileIntelligence = lazy(() => import('./pages/FileIntelligence'));
const SystemVisualization = lazy(() => import('./pages/SystemVisualization'));
const SettingsPage = lazy(() => import('./pages/Settings'));
const Optimization = lazy(() => import('./pages/Optimization'));
const AlertsPage = lazy(() => import('./pages/Alerts'));
const INITIAL_BOOT_DURATION_MS = 3200;

function InitialBootScreen() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      className="fixed inset-0 z-[120] flex items-center justify-center bg-[#04070a]"
    >
      <ParticleBackground />
      <div className="relative z-10 w-full max-w-xl px-8">
        <div className="rounded-2xl border border-neo-cyan/20 bg-black/50 p-8 backdrop-blur-md">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-black tracking-tighter text-white neon-text-cyan uppercase leading-none">
              Sentinel<span className="text-neo-purple">OS</span>
            </h1>
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-400">Boot v4.0.2</span>
          </div>

          <div className="mb-8 space-y-2 text-[10px] font-mono uppercase tracking-widest text-slate-400">
            <p>Kernel Integrity Check .......... Pass</p>
            <p>Threat Signature Database ........ Synced</p>
            <p>Telemetry Pipelines .............. Online</p>
            <p className="text-neo-cyan animate-pulse">Initializing secure runtime...</p>
          </div>

          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 2.8, ease: 'easeInOut' }}
              className="h-full bg-neo-cyan shadow-[0_0_12px_rgba(0,242,255,0.6)]"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

const NavItem = ({ to, icon: Icon, label, badge }: { to: string, icon: any, label: string, badge?: number }) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => cn(
        "flex items-center justify-between gap-3 px-8 py-3.5 transition-all duration-200 group text-[13px] font-medium tracking-wide",
        isActive 
          ? "bg-neo-cyan/5 text-neo-cyan border-r-[3px] border-neo-cyan" 
          : "text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-white/[0.02]"
      )}
    >
      <div className="flex items-center gap-3">
        <Icon className={cn("w-4 h-4", "transition-transform duration-300")} />
        <span>{label}</span>
      </div>
      {badge !== undefined && badge > 0 && (
        <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.4)]">
          {badge}
        </span>
      )}
    </NavLink>
  );
};

function AlertSystemInitializer() {
  useAlertEngine();
  return null;
}

function AppContent() {
  const location = useLocation();
  const { alerts } = useNotifications();
  const unreadAlerts = alerts.filter(a => !a.read).length;
  const [isRebooting, setIsRebooting] = useState(false);

  useEffect(() => {
    // Listen for custom reboot event
    const handleReboot = () => {
      setIsRebooting(true);
      window.setTimeout(() => {
        setIsRebooting(false);
      }, 4200);
    };
    window.addEventListener('sentinel-reboot', handleReboot);
    return () => window.removeEventListener('sentinel-reboot', handleReboot);
  }, []);

  if (isRebooting) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#050608] gap-6 z-[100] fixed inset-0">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        >
          <Power className="w-16 h-16 text-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.4)]" />
        </motion.div>
        <div className="flex flex-col items-center">
          <p className="text-sm font-mono text-orange-500 animate-pulse uppercase tracking-[0.3em]">System Reboot Sequence Initialized</p>
          <p className="text-[10px] text-slate-500 font-mono mt-2 uppercase tracking-widest">Saving cached kernels & flushing memory buffers...</p>
          <div className="w-64 h-1 bg-white/5 rounded-full mt-6 overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 4 }}
              className="h-full bg-orange-500"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-[#03070a] text-slate-300 overflow-hidden font-sans">
      <ParticleBackground />
      <AlertSystemInitializer />
      <NotificationManager />
      
      {/* Sidebar */}
      <aside className="w-64 sidebar-glass flex flex-col z-20">
        <div className="p-8 flex flex-col gap-1">
          <h1 className="text-2xl font-black tracking-tighter text-white neon-text-cyan uppercase leading-none">
            Sentinel<span className="text-neo-purple">OS</span>
          </h1>
          <p className="text-[10px] text-slate-500 font-mono tracking-widest opacity-50">V.4.0.2 ALPHA BUILD</p>
        </div>

        <nav className="flex-1 px-0 space-y-0 mt-4">
          <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />
          <NavItem to="/alerts" icon={Bell} label="Security Alerts" badge={unreadAlerts} />
          <NavItem to="/processes" icon={Cpu} label="Process Manager" />
          <NavItem to="/terminal" icon={Terminal} label="GhostShell" />
          <NavItem to="/files" icon={FileSearch} label="File Intelligence" />
          <NavItem to="/optimize" icon={Zap} label="Optimization" />
          <NavItem to="/visuals" icon={Layers} label="Visualization" />
          <NavItem to="/settings" icon={Settings} label="Settings" />
        </nav>

        <div className="p-6 border-t border-white/5 space-y-6">
          <div>
            <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <Terminal className="w-3 h-3 text-neo-cyan" />
              Quick Operations
            </h3>
            <QuickActions />
          </div>

          <div className="text-[11px] font-bold text-emerald-500 tracking-wider">
            SYSTEM SECURE<br />
            <span className="opacity-70">
              {unreadAlerts > 0 ? `${unreadAlerts} NEW ALERTS` : 'NO THREATS DETECTED'}
            </span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 relative flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 px-8 flex items-center justify-between border-b border-white/5 bg-black/10 backdrop-blur-sm z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">Network_Node:</span>
            <span className="text-xs font-mono text-neo-cyan uppercase">SNTL-ALPHA-01</span>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 text-[10px] font-mono text-slate-500 uppercase tracking-tighter">
              <div className="flex items-center gap-1.5">
                <span className="opacity-50">LATENCY:</span>
                <span className="text-white">12ms</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="opacity-50">TEMP:</span>
                <span className="text-white">42°C</span>
              </div>
            </div>
            <div className="h-8 w-[1px] bg-white/5" />
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-[10px] text-white font-medium leading-none">Admin_User</p>
                <p className="text-[9px] text-slate-500 font-mono">0x7F...9B2</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-neo-cyan/20 to-neo-magenta/20 border border-white/10" />
            </div>
          </div>
        </header>

        {/* Page View */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-8 scroll-smooth relative">
          <Suspense fallback={<div className="min-h-full"><ParticleBackground /></div>}>
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 10, filter: 'blur(6px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -8, filter: 'blur(6px)' }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="min-h-full"
              >
                <Routes location={location}>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/alerts" element={<AlertsPage />} />
                  <Route path="/processes" element={<ProcessManager />} />
                  <Route path="/terminal" element={<GhostShell />} />
                  <Route path="/files" element={<FileIntelligence />} />
                  <Route path="/optimize" element={<Optimization />} />
                  <Route path="/visuals" element={<SystemVisualization />} />
                  <Route path="/settings" element={<SettingsPage />} />
                </Routes>
              </motion.div>
            </AnimatePresence>
          </Suspense>
        </div>

        {/* Status Bar */}
        <footer className="h-8 px-6 bg-black/40 border-t border-white/5 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-4 text-[9px] font-mono text-slate-500 uppercase tracking-widest">
            <span>Sentinel_Core_v2.4.0</span>
            <span className="opacity-50">|</span>
            <span className="flex items-center gap-1">
              <Box className="w-2.5 h-2.5" />
              Container_Cluster: Local
            </span>
          </div>
          <div className="flex items-center gap-4 text-[9px] font-mono text-slate-500 uppercase tracking-widest">
            <span className="text-neo-magenta animate-pulse-cyan">Secure Connection Established</span>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default function App() {
  const [isInitialBooting, setIsInitialBooting] = useState(true);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setIsInitialBooting(false);
    }, INITIAL_BOOT_DURATION_MS);

    return () => window.clearTimeout(timeout);
  }, []);

  return (
    <Router>
      <NotificationProvider>
        <AnimatePresence mode="wait">
          {isInitialBooting ? (
            <InitialBootScreen key="initial-boot" />
          ) : (
            <motion.div
              key="app-shell"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.28 }}
            >
              <AppContent />
            </motion.div>
          )}
        </AnimatePresence>
      </NotificationProvider>
    </Router>
  );
}
