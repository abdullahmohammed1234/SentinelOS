import { useState, useEffect, useRef, FormEvent, KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import { 
  Terminal as TerminalIcon, 
  ShieldCheck, 
  Zap, 
  Ghost, 
  Info, 
  Command, 
  Cpu, 
  Database, 
  Activity,
  ChevronRight,
  Search,
  ExternalLink,
  History,
  AlertCircle
} from 'lucide-react';
import { cn } from '../lib/utils';

interface ShellEntry {
  type: 'input' | 'output' | 'error' | 'meta';
  content: string;
  timestamp: string;
}

interface CommandSuggestion {
  command: string;
  description: string;
  category: 'system' | 'ai' | 'file';
}

const DEFAULT_SUGGESTIONS: CommandSuggestion[] = [
  { command: 'status', description: 'Show system health', category: 'system' },
  { command: 'ls', description: 'List current sector directories', category: 'file' },
  { command: 'ps', description: 'Monitor active neural processes', category: 'system' },
  { command: 'clean temp', description: 'Purge temporary cache files', category: 'system' },
  { command: 'network status', description: 'Check uplink stability', category: 'system' },
  { command: 'free', description: 'Display memory allocation', category: 'system' },
  { command: 'cat', description: 'Read file contents', category: 'file' },
  { command: 'src', description: 'View source code of a file', category: 'file' },
];

function TypewriterEffect({ text, onComplete }: { text: string; onComplete?: () => void }) {
  const [displayedText, setDisplayedText] = useState("");
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setDisplayedText("");
    setIndex(0);
  }, [text]);

  useEffect(() => {
    if (text && index < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + (text[index] || ""));
        setIndex(prev => prev + 1);
      }, 15);
      return () => clearTimeout(timeout);
    } else if (onComplete) {
      onComplete();
    }
  }, [index, text, onComplete]);

  return <span>{displayedText}</span>;
}

export default function GhostShell() {
  const processEnv = (globalThis as any)?.process?.env;
  const geminiApiKey =
    (import.meta as any).env?.VITE_GEMINI_API_KEY ||
    (import.meta as any).env?.GEMINI_API_KEY ||
    processEnv?.GEMINI_API_KEY;

  let ai: GoogleGenAI | null = null;
  try {
    if (geminiApiKey) {
      ai = new GoogleGenAI({ apiKey: geminiApiKey });
    }
  } catch {
    ai = null;
  }

  const [entries, setEntries] = useState<ShellEntry[]>([
    { type: 'meta', content: "SENTINEL OS [Version 2.4.0.88]", timestamp: new Date().toLocaleTimeString() },
    { type: 'meta', content: "(c) 2026 Sentinel Dynamics. Node encrypted with Spectral-Key-4.", timestamp: new Date().toLocaleTimeString() },
    { type: 'output', content: "GhostShell v1.0.4 initialized. Neural link established.", timestamp: new Date().toLocaleTimeString() },
  ]);
  const [input, setInput] = useState("");
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeExplanation, setActiveExplanation] = useState<{ command: string; explanation: string } | null>(null);
  const [suggestions, setSuggestions] = useState<CommandSuggestion[]>([]);
  const [currentPath, setCurrentPath] = useState("~");
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries]);

  useEffect(() => {
    // Basic autocomplete logic
    if (input.trim()) {
      const filtered = DEFAULT_SUGGESTIONS.filter(s => 
        s.command.startsWith(input.toLowerCase())
      );
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  }, [input]);

  const addEntry = (type: ShellEntry['type'], content: string) => {
    setEntries(prev => [...prev, {
      type,
      content,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const executeCommand = async (cmd: string) => {
    setIsProcessing(true);
    addEntry('input', cmd);
    setCommandHistory(prev => [cmd, ...prev.slice(0, 49)]);
    setHistoryIndex(-1);

    try {
      // Check if it's natural language or a direct command
      const isNL = cmd.split(' ').length > 2 || cmd.includes(' ') && !DEFAULT_SUGGESTIONS.find(s => s.command === cmd.split(' ')[0]);

      if (isNL) {
        addEntry('meta', `[AI] Interpreting intent: "${cmd}"...`);

        if (!ai) {
          addEntry('error', "AI module unavailable. Set VITE_GEMINI_API_KEY to enable natural language mode.");
          return;
        }
        
        try {
          const systemPrompt = `You are GhostShell OS, a futuristic intelligent terminal. 
          The user is asking in natural language. Convert their intent into a valid terminal command or a helpful system response.
          Available simulated environment:
          - ls, cd, pwd
          - ps, top (simulated)
          - df, du, cat, src
          - network status
          - clean temp
          
          IMPORTANT: You MUST return ONLY a valid JSON object. No other text.
          JSON Schema:
          {
            "command": "the terminal command to run",
            "explanation": "brief futuristic explanation of what this does (max 15 words)",
            "type": "cmd" | "info"
          }`;

          const result = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: [{ role: "user", parts: [{ text: `${systemPrompt}\n\nUser request: ${cmd}` }] }],
          });
          
          const text = result.text || "";
          const match = text.match(/\{[\s\S]*\}/);
          if (!match) throw new Error("Neural link failed to synthesize valid syntax.");
          
          const interpretData = JSON.parse(match[0]);
          
          if (interpretData.explanation) {
            setActiveExplanation({ command: interpretData.command, explanation: interpretData.explanation });
          }

          if (interpretData.type === 'cmd' && interpretData.command) {
            addEntry('meta', `[AI] Executing: ${interpretData.command}`);
            const execRes = await fetch('/api/shell/exec', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ command: interpretData.command })
            });
            const execData = await execRes.json();
            if (execData.cwd) setCurrentPath(execData.cwd);
            if (execData.output) addEntry('output', execData.output);
            if (execData.error) addEntry('error', execData.error);
          } else if (interpretData.explanation) {
            addEntry('output', interpretData.explanation);
          } else {
            addEntry('error', "GhostShell cognitive unit returned an empty response.");
          }
        } catch (error) {
          console.error("Interpret Error:", error);
          addEntry('error', `Neural link disruption: ${error instanceof Error ? error.message : "Unknown anomaly"}`);
        }
      } else {
        // Direct command
        const execRes = await fetch('/api/shell/exec', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command: cmd })
        });
            const execData = await execRes.json();
        if (execData.cwd) setCurrentPath(execData.cwd);
        if (execData.output) addEntry('output', execData.output);
        if (execData.error) addEntry('error', execData.error);
      }
    } catch (err) {
      addEntry('error', "Failed to connect to GhostShell kernel.");
    } finally {
      setIsProcessing(false);
      setInput("");
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;
    executeCommand(input.trim());
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex < commandHistory.length - 1) {
        const nextIndex = historyIndex + 1;
        setHistoryIndex(nextIndex);
        setInput(commandHistory[nextIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const nextIndex = historyIndex - 1;
        setHistoryIndex(nextIndex);
        setInput(commandHistory[nextIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput("");
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      if (suggestions.length > 0) {
        setInput(suggestions[0].command);
      }
    }
  };

  return (
    <div className="h-[calc(100vh-10rem)] flex gap-4">
      {/* Main Terminal Panel */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex-1 flex flex-col glass-panel rounded-2xl overflow-hidden border-neo-cyan/20 shadow-[0_0_50px_rgba(0,242,255,0.05)] bg-black/60 relative"
      >
        {/* Terminal Header */}
        <div className="px-5 py-3 bg-white/[0.03] border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-1 px-2 rounded bg-neo-cyan/10 border border-neo-cyan/20">
              <TerminalIcon className="w-4 h-4 text-neo-cyan" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-mono text-neo-cyan uppercase tracking-widest font-bold">GhostShell Terminal</span>
              <span className="text-[8px] font-mono text-slate-500 uppercase">Interactive AI Protocol v1.0.4</span>
            </div>
          </div>
          <div className="flex gap-4 items-center">
             <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
               <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
               <span className="text-[9px] font-mono text-green-500 uppercase font-bold">Encrypted</span>
             </div>
             <div className="flex gap-1.5">
               <div className="w-2.5 h-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-red-500/40 transition-colors" />
               <div className="w-2.5 h-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-amber-500/40 transition-colors" />
               <div className="w-2.5 h-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-green-500/40 transition-colors" />
             </div>
          </div>
        </div>

        {/* Terminal Body */}
        <div 
          ref={scrollRef}
          className="flex-1 p-6 font-mono text-[13px] overflow-y-auto selection:bg-neo-cyan selection:text-black custom-scrollbar bg-[radial-gradient(circle_at_center,rgba(0,242,255,0.02)_0%,transparent_100%)]"
        >
          <div className="space-y-1.5 mb-20">
            {entries.map((entry, i) => (
              <motion.div 
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                key={i} 
                className={cn(
                  "flex gap-4 group",
                  entry.type === 'input' && "text-neo-cyan py-1",
                  entry.type === 'output' && "text-[#e2e8f0]/90",
                  entry.type === 'error' && "text-rose-500 bg-rose-500/5 px-2 rounded -ml-2",
                  entry.type === 'meta' && "text-slate-500 italic text-[11px]"
                )}
              >
                <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[9px] shrink-0 w-16 pt-0.5">
                  {entry.timestamp.split(' ')[0]}
                </span>
                <div className="flex-1 whitespace-pre-wrap break-all leading-relaxed">
                  {entry.type === 'input' && <span className="mr-2 text-neo-cyan/40">λ</span>}
                  {i === entries.length - 1 && entry.type !== 'input' ? (
                    <TypewriterEffect text={entry.content} />
                  ) : (
                    entry.content
                  )}
                </div>
              </motion.div>
            ))}
            
            {isProcessing && (
              <div className="flex items-center gap-2 text-neo-cyan/50 italic animate-pulse">
                <span className="mr-2">λ</span>
                Processing temporal request...
              </div>
            )}
          </div>

          {/* Form always stays at bottom of content */}
          <div className="mt-8">
            <form onSubmit={handleSubmit} className="flex flex-col gap-2 relative">
              <div className="flex items-center group">
                <div className="flex items-center gap-1 text-neo-cyan mr-3 font-bold select-none group-hover:drop-shadow-[0_0_8px_rgba(0,242,255,0.5)] transition-all">
                  <span className="text-xs opacity-50 font-mono truncate max-w-[150px]">{currentPath.split('/').pop() || '/'}</span>
                  <span>λ</span>
                </div>
                <div className="flex-1 relative">
                  <input 
                    ref={inputRef}
                    autoFocus
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isProcessing}
                    placeholder={isProcessing ? "" : "Enter command or ask natural language..."}
                    className="w-full bg-transparent border-none outline-none text-white p-0 text-sm caret-neo-cyan placeholder:text-slate-700"
                    spellCheck="false"
                  />
                  {/* Ghost Text Overlay for suggestion */}
                  {suggestions.length > 0 && input.length > 0 && suggestions[0].command.startsWith(input) && (
                    <span className="absolute left-0 top-0 text-white/20 -z-10 pointer-events-none">
                      {suggestions[0].command}
                    </span>
                  )}
                </div>
              </div>
              
              {/* Autocomplete Bar */}
              <AnimatePresence>
                {suggestions.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="flex flex-wrap gap-2 pt-2 border-t border-white/5 mt-2"
                  >
                    {suggestions.slice(0, 4).map((s, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => executeCommand(s.command)}
                        className="px-2 py-1 bg-white/[0.03] hover:bg-neo-cyan/10 border border-white/10 hover:border-neo-cyan/30 rounded text-[10px] font-mono text-slate-400 hover:text-neo-cyan transition-all flex items-center gap-2 cursor-pointer group"
                      >
                        <Command className="w-3 h-3 group-hover:scale-110 transition-transform" />
                        {s.command}
                        <span className="text-[8px] opacity-40">— {s.description}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </div>
        </div>
      </motion.div>

      {/* Side Intelligence Panel */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-80 flex flex-col gap-4"
      >
        {/* Command Explanation */}
        <div className="glass-panel flex-1 rounded-2xl p-5 border-white/5 flex flex-col">
          <div className="flex items-center gap-2 mb-6 text-neo-cyan">
             <Info className="w-4 h-4" />
             <span className="text-xs font-mono font-bold uppercase tracking-widest">Ghost Intelligence</span>
          </div>
          
          <div className="flex-1">
            <AnimatePresence mode="wait">
              {activeExplanation ? (
                <motion.div 
                  key={activeExplanation.command}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  <div className="p-3 bg-neo-cyan/5 border border-neo-cyan/20 rounded-lg">
                    <div className="text-[10px] text-neo-cyan/60 font-mono mb-1 uppercase">Recommended Command</div>
                    <div className="text-sm font-mono font-bold text-neo-cyan flex items-center gap-2">
                      <ChevronRight className="w-4 h-4" />
                      {activeExplanation.command}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="text-[10px] text-slate-500 font-mono uppercase">Decoded Analysis</div>
                    <p className="text-[12px] text-slate-300 font-mono leading-relaxed italic">
                      {activeExplanation.explanation}
                    </p>
                  </div>
                  <button 
                    onClick={() => executeCommand(activeExplanation.command)}
                    className="w-full py-2 bg-neo-cyan text-black text-[11px] font-mono font-bold rounded-lg hover:scale-[1.02] active:scale-95 transition-transform flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,242,255,0.3)]"
                  >
                    <Zap className="w-3 h-3" />
                    EXECUTE_PROTOCOL
                  </button>
                </motion.div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-30 grayscale">
                  <Activity className="w-12 h-12 text-slate-500 animate-pulse" />
                  <p className="text-[10px] font-mono text-slate-500 uppercase leading-relaxed px-4">
                    Idle. Waiting for neural input strings or system queries to analyze.
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* System Vitals Widget */}
        <div className="glass-panel h-64 rounded-2xl p-5 border-white/5">
           <div className="flex items-center gap-2 mb-6 text-slate-400">
             <Activity className="w-4 h-4" />
             <span className="text-xs font-mono font-bold uppercase tracking-widest">Ghost Vitals</span>
          </div>
          <div className="space-y-5">
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-mono text-slate-500 uppercase">
                <span className="flex items-center gap-1.5"><Cpu className="w-3 h-3" /> Neural Core</span>
                <span>Active</span>
              </div>
              <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  animate={{ width: ["20%", "45%", "32%", "60%", "40%"] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                  className="h-full bg-neo-cyan shadow-[0_0_8px_rgb(0,242,255)]"
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-mono text-slate-500 uppercase">
                <span className="flex items-center gap-1.5"><Database className="w-3 h-3" /> Synaptic Cache</span>
                <span>8.4GB Free</span>
              </div>
              <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full w-[72%] bg-amber-500 shadow-[0_0_8px_rgb(245,158,11)]" />
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
