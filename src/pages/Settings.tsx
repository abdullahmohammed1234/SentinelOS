import { motion } from 'motion/react';
import { 
  User, Shield, Bell, Eye, 
  Cpu, HardDrive, Network,
  Save, RotateCcw
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function Settings() {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto space-y-8"
    >
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">System Configuration</h2>
        <p className="text-sm text-slate-500 mt-1">Global parameters for SentinelOS and underlying hardware</p>
      </div>

      <div className="space-y-8">
        {/* Profile Section */}
        <section className="glass-panel rounded-2xl overflow-hidden">
          <div className="px-8 py-4 bg-white/[0.02] border-b border-white/5 flex items-center gap-3">
             <User className="w-5 h-5 text-neo-cyan" />
             <h3 className="text-sm font-bold uppercase tracking-wider">Identity & Access</h3>
          </div>
          <div className="p-8 space-y-6">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-neo-cyan/20 to-neo-magenta/20 border border-white/10 flex items-center justify-center">
                <User className="w-8 h-8 text-white opacity-50" />
              </div>
              <div className="flex-1 space-y-2">
                <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Admin Signature</label>
                <input 
                  type="text" 
                  value="0x7F2B1C...9B2" 
                  readOnly
                  className="w-full bg-black/20 border border-white/5 rounded-lg px-4 py-2 text-sm text-neo-cyan font-mono" 
                />
              </div>
            </div>
          </div>
        </section>

        {/* System Settings */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="glass-panel rounded-2xl p-8 space-y-6">
              <div className="flex items-center gap-3 text-neo-cyan mb-2">
                 <Shield className="w-5 h-5" />
                 <h3 className="text-sm font-bold uppercase tracking-wider">Neural Security</h3>
              </div>
              <Toggle label="Ghost Protocol" desc="Automated identity rotation and packet obfuscation" active />
              <Toggle label="Sentinel Firewall" desc="AI-driven threat mitigation and shell protection" active />
              <Toggle label="Deep Audit" desc="Log all hardware-level interrupt requests" />
           </div>

           <div className="glass-panel rounded-2xl p-8 space-y-6">
              <div className="flex items-center gap-3 text-neo-magenta mb-2">
                 <Eye className="w-5 h-5" />
                 <h3 className="text-sm font-bold uppercase tracking-wider">Visual Interface</h3>
              </div>
              <Toggle label="High-Fidelity Rendering" desc="Enable advanced glassmorphism and real-time shadows" active />
              <Toggle label="Monochrome Mode" desc="Switch UI to low-energy high-contrast technical mode" />
              <Toggle label="Haptic Feedback" desc="Simulate physical response for UI interactions" active />
           </div>
        </section>

        {/* Resource Allocation */}
        <section className="glass-panel rounded-2xl p-8">
           <div className="flex items-center gap-3 text-amber-500 mb-8">
              <Network className="w-5 h-5" />
              <h3 className="text-sm font-bold uppercase tracking-wider">Resource Caps</h3>
           </div>
           
           <div className="space-y-8">
             <div className="space-y-2">
               <div className="flex justify-between text-xs">
                 <span className="text-slate-300">Max CPU Cycle Reserved</span>
                 <span className="text-neo-cyan font-mono">85%</span>
               </div>
               <input type="range" className="w-full h-1.5 bg-white/10 rounded-full appearance-none accent-neo-cyan cursor-pointer" />
             </div>

             <div className="space-y-2">
               <div className="flex justify-between text-xs">
                 <span className="text-slate-300">Neural Memory Buffer</span>
                 <span className="text-neo-cyan font-mono">4.2 GB</span>
               </div>
               <input type="range" className="w-full h-1.5 bg-white/10 rounded-full appearance-none accent-neo-cyan cursor-pointer" />
             </div>
           </div>
        </section>

        {/* Footer Actions */}
        <div className="flex justify-end gap-4">
           <button className="flex items-center gap-2 px-6 py-2.5 rounded-xl border border-white/5 hover:bg-white/5 transition-colors text-sm font-medium">
             <RotateCcw className="w-4 h-4" />
             Discard
           </button>
           <button className="flex items-center gap-2 px-8 py-2.5 rounded-xl bg-neo-cyan text-black font-bold text-sm shadow-[0_0_20px_rgba(0,242,255,0.3)] hover:brightness-110 transition-all">
             <Save className="w-4 h-4" />
             Apply Vector
           </button>
        </div>
      </div>
    </motion.div>
  );
}

function Toggle({ label, desc, active = false }: { label: string, desc: string, active?: boolean }) {
  const [enabled, setEnabled] = (active ? [true, () => {}] : [false, () => {}]); // Mock local state behavior

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-1">
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="text-[10px] text-slate-500 leading-normal">{desc}</p>
      </div>
      <div className={cn(
        "w-10 h-5 rounded-full relative transition-colors cursor-pointer",
        active ? "bg-neo-cyan/40" : "bg-white/10"
      )}>
        <div className={cn(
          "w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all",
          active ? "left-5.5 shadow-[0_0_8px_white]" : "left-0.5 opacity-50"
        )} />
      </div>
    </div>
  );
}
