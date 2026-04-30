import express from "express";
import { createServer as createViteServer } from "vite";
import os from "os";
import path from "path";
import fs from "fs";
import { exec, spawn } from "child_process";
import type { ChildProcessWithoutNullStreams } from "child_process";
import { WebSocketServer } from "ws";

interface StatsSnapshot {
  cpu: number;
  cpuThreads: number[];
  memory: {
    used: number;
    total: number;
    percentage: number;
    buffer: number;
    cache: number;
  };
  uptime: number;
  processTree: any;
  processCount: number;
  tasks: any[];
  analysis: any;
  loadAverage: number[];
  disk: {
    used: number;
    total: number;
    percentage: number;
    readSpeed: number;
    writeSpeed: number;
    activeTime: number;
  };
  network: {
    upload: number;
    download: number;
    total: number;
    latency: number;
    jitter: number;
    packetLoss: number;
  };
  thermal: {
    cores: number[];
    gpu: number;
    disk: number;
    ambient: number;
    map: number[][];
  };
  battery: {
    level: number;
    isCharging: boolean;
    timeLeft: number | null;
  };
  timestamp: number;
}

type TransportMessage = {
  type: 'stats';
  payload: StatsSnapshot;
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  // --- Python Engine Integration ---
  let engineData: any = {
    status: 'initializing',
    metrics: { cpu: 0, memory: { total: 0, used: 0, available: 0, percentage: 0 }, disk: { total: 0, used: 0, free: 0, percentage: 0 } },
    processes: [],
    analysis: { health_score: 100, anomalies: [], recommendations: [] }
  };

  const pythonScriptPath = path.join(process.cwd(), 'engine/main.py');
  const configuredPython = process.env.PYTHON_EXECUTABLE;
  const pythonCandidates = [
    configuredPython ? { cmd: configuredPython, args: [] as string[] } : null,
    ...(process.platform === 'win32'
      ? [
          { cmd: 'python', args: [] as string[] },
          { cmd: 'py', args: ['-3'] as string[] }
        ]
      : [
          { cmd: 'python3', args: [] as string[] },
          { cmd: 'python', args: [] as string[] }
        ])
  ].filter((candidate): candidate is { cmd: string; args: string[] } => !!candidate);

  let cachedStats: StatsSnapshot | null = null;
  let cachedStatsJson = '';
  let statsRefreshTimer: NodeJS.Timeout | null = null;
  const connectedSockets = new Set<any>();

  let mockTasks: any[] = [
    { id: "1", pid: 1024, name: "Sentinel Core", cpu: 1.2, memory: 450, status: "running", user: "system", runtime: "45:12:08", isBackground: true, history: Array(20).fill(0).map(() => 1 + Math.random()) },
    { id: "2", pid: 2048, name: "GhostShell", cpu: 0.5, memory: 120, status: "running", user: "sentinel", runtime: "02:15:30", isBackground: false, history: Array(20).fill(0).map(() => 0.5 + Math.random()) },
    { id: "3", pid: 4096, name: "Intelligence.exe", cpu: 5.4, memory: 890, status: "running", user: "ai_host", runtime: "12:04:12", isBackground: true, history: Array(20).fill(0).map(() => 5 + Math.random()) },
    { id: "4", pid: 5122, name: "Network Guard", cpu: 0.1, memory: 45, status: "sleeping", user: "root", runtime: "168:00:00", isBackground: true, history: Array(20).fill(0).map(() => 0.1) },
    { id: "5", pid: 6789, name: "Visualization Engine", cpu: 12.1, memory: 1200, status: "running", user: "sentinel", runtime: "01:45:22", isBackground: false, history: Array(20).fill(0).map(() => 12 + Math.random() * 5) },
    { id: "6", pid: 9999, name: "Unknown_Daemon", cpu: 45.8, memory: 2500, status: "running", user: "unknown", runtime: "00:05:12", isBackground: true, history: Array(20).fill(0).map(() => 40 + Math.random() * 20) },
    { id: "7", pid: 8888, name: "Cryptic_Process", cpu: 2.1, memory: 4000, status: "running", user: "system", runtime: "00:01:45", isBackground: true, history: Array(20).fill(0).map(() => 2 + Math.random()) },
  ];

  const processTree = {
    id: "0",
    name: "Root Shell",
    cpu: 0.1,
    children: [
      { id: "100", name: "System.sys", cpu: 1.5, children: [
        { id: "101", name: "driver_host", cpu: 0.4, children: [
          { id: "101-1", name: "usb_bus", cpu: 0.1 },
          { id: "101-2", name: "pci_express", cpu: 2.3 }
        ]},
        { id: "102", name: "sec_vault", cpu: 0.1 }
      ]},
      { id: "200", name: "UserEnv", cpu: 2.1, children: [
        { id: "201", name: "Shell UI", cpu: 5.4, children: [
          { id: "201-1", name: "Window Manager", cpu: 1.2 },
          { id: "201-2", name: "Compositor", cpu: 3.1 }
        ]},
        { id: "202", name: "Browser", cpu: 12.1, children: [
          { id: "202-1", name: "GPU Process", cpu: 8.5 },
          { id: "202-2", name: "Renderer", cpu: 4.2 }
        ]}
      ]},
      { id: "300", name: "Sentinel_Daemon", cpu: 0.2 }
    ]
  };

  const buildStatsSnapshot = (): StatsSnapshot => {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const cpuLoad = (os.loadavg()[0] / Math.max(1, os.cpus().length)) * 100;
    const thermalMap = Array.from({ length: 10 }, () =>
      Array.from({ length: 10 }, () => 30 + Math.random() * 25)
    );

    return {
      cpu: engineData.metrics.cpu || Math.min(cpuLoad, 100),
      cpuThreads: os.cpus().map(() => 5 + Math.random() * 40),
      memory: {
        used: engineData.metrics.memory.used || Math.round(usedMem / 1024 / 1024),
        total: engineData.metrics.memory.total || Math.round(totalMem / 1024 / 1024),
        percentage: engineData.metrics.memory.percentage || Math.round((usedMem / totalMem) * 100),
        buffer: 120 + Math.random() * 50,
        cache: 840 + Math.random() * 200,
      },
      uptime: os.uptime(),
      processCount: engineData.processes.length || (mockTasks.length + 42),
      processTree,
      tasks: engineData.processes.length > 0 ? engineData.processes.map((p: any) => ({
        ...p,
        cpu: 0.1 + Math.random() * 2,
        user: p.user || 'system',
        runtime: "00:00:00",
        isBackground: true,
        history: Array(20).fill(0).map(() => 1 + Math.random())
      })) : mockTasks,
      analysis: engineData.analysis,
      loadAverage: os.loadavg(),
      disk: {
        used: engineData.metrics.disk.used || (48 + Math.random() * 2),
        total: engineData.metrics.disk.total || 512,
        percentage: engineData.metrics.disk.percentage || 9.5,
        readSpeed: 12 + Math.random() * 40,
        writeSpeed: 5 + Math.random() * 20,
        activeTime: Math.random() * 25
      },
      network: {
        upload: 12 + Math.random() * 5,
        download: 145 + Math.random() * 20,
        total: 1024,
        latency: 4 + Math.random() * 8,
        jitter: 1.2,
        packetLoss: 0.01
      },
      thermal: {
        cores: os.cpus().map(() => 42 + Math.random() * 15),
        gpu: 55 + Math.random() * 10,
        disk: 38 + Math.random() * 5,
        ambient: 24,
        map: thermalMap
      },
      battery: {
        level: 85 - (os.uptime() % 3600) / 120,
        isCharging: false,
        timeLeft: 4.5
      },
      timestamp: Date.now()
    };
  };

  const broadcastStats = (snapshot: StatsSnapshot) => {
    const payload: TransportMessage = { type: 'stats', payload: snapshot };
    const encoded = JSON.stringify(payload);

    connectedSockets.forEach((client) => {
      if (client.readyState === 1) {
        client.send(encoded);
      }
    });
  };

  const refreshStatsCache = () => {
    const nextSnapshot = buildStatsSnapshot();
    const encoded = JSON.stringify(nextSnapshot);

    if (encoded === cachedStatsJson) {
      return;
    }

    cachedStats = nextSnapshot;
    cachedStatsJson = encoded;
    broadcastStats(nextSnapshot);
  };

  const scheduleStatsRefresh = () => {
    // Debounce rapid engine updates so the UI receives one consolidated websocket push.
    if (statsRefreshTimer) {
      clearTimeout(statsRefreshTimer);
    }

    statsRefreshTimer = setTimeout(() => {
      statsRefreshTimer = null;
      refreshStatsCache();
    }, 150);
  };

  let pythonEngine: ChildProcessWithoutNullStreams | null = null;

  const attachEngineListeners = (engine: ChildProcessWithoutNullStreams) => {
    engine.stdout.on('data', (data) => {
      try {
        const lines = data.toString().split('\n');
        for (const line of lines) {
          if (line.trim()) {
            const parsed = JSON.parse(line);
            engineData = { ...engineData, ...parsed, status: 'online' };
            scheduleStatsRefresh();
          }
        }
      } catch (e) {
        // Ignore partial non-JSON lines from engine output.
      }
    });

    engine.stderr.on('data', (data) => {
      console.warn(`Engine Warning: ${data}`);
    });

    engine.on('close', (code) => {
      console.log(`Python process exited with code ${code}`);
      if (engineData.status !== 'offline') {
        engineData.status = 'degraded';
      }
      scheduleStatsRefresh();
    });
  };

  const startPythonEngine = (index = 0): void => {
    if (index >= pythonCandidates.length) {
      engineData.status = 'degraded';
      console.warn('Python engine could not be started. Set PYTHON_EXECUTABLE or install Python 3.');
      return;
    }

    const candidate = pythonCandidates[index];
    const args = [...candidate.args, pythonScriptPath];
    const child = spawn(candidate.cmd, args);

    child.once('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'ENOENT') {
        console.warn(`Python executable not found: ${candidate.cmd}. Trying next option...`);
        startPythonEngine(index + 1);
        return;
      }

      engineData.status = 'degraded';
      console.warn(`Failed to start Python engine with '${candidate.cmd}': ${err.message}`);
    });

    child.once('spawn', () => {
      pythonEngine = child;
      attachEngineListeners(child);
      console.log(`Python engine started with '${candidate.cmd}'`);
    });
  };

  startPythonEngine();

  app.use(express.json());

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", environment: process.env.NODE_ENV || "development" });
  });

  // API Routes
  app.get("/api/stats", (req, res) => {
    if (!cachedStats) {
      refreshStatsCache();
    }

    res.setHeader('Cache-Control', 'no-store');
    res.json(cachedStats);
  });

  // Persistent state for the shell
  let currentDirectory = process.cwd();

  app.post("/api/shell/exec", (req, res) => {
    const { command } = req.body;
    
    // Safety check: Basic whitelist or limited execution
    const allowedCommands = ['ls', 'pwd', 'whoami', 'uname', 'uptime', 'free', 'df', 'top', 'ps', 'du', 'cd', 'cat', 'src'];
    const cmdBase = command.split(' ')[0];

    if (!allowedCommands.includes(cmdBase)) {
      // For non-safe commands, we simulate the output if it's a known futuristic command
      if (command === 'clean temp') {
        return res.json({ output: "[SUCCESS] Temporary files purged. 4.2GB reclaimed.", error: null });
      }
      if (command === 'network status') {
        return res.json({ output: "[OK] Uplink stable. Latency: 4ms. Packet Loss: 0.00%.", error: null });
      }
      return res.json({ output: null, error: `Command '${cmdBase}' restricted for security protocols.` });
    }

    if (cmdBase === 'src') {
      const fileName = command.split(' ')[1];
      if (!fileName) return res.json({ output: null, error: "Usage: src <filename>", cwd: currentDirectory });
      
      try {
        const content = fs.readFileSync(path.resolve(currentDirectory, fileName), 'utf-8');
        return res.json({ output: content, error: null, cwd: currentDirectory });
      } catch (err: any) {
        return res.json({ output: null, error: `Error reading file: ${err.message}`, cwd: currentDirectory });
      }
    }

    if (cmdBase === 'cd') {
      const newPath = command.split(' ').slice(1).join(' ') || os.homedir();
      try {
        const targetPath = path.resolve(currentDirectory, newPath);
        if (fs.existsSync(targetPath) && fs.lstatSync(targetPath).isDirectory()) {
          currentDirectory = targetPath;
          return res.json({ output: `Changed directory to: ${currentDirectory}`, error: null, cwd: currentDirectory });
        } else {
          return res.json({ output: null, error: `Directory not found: ${newPath}`, cwd: currentDirectory });
        }
      } catch (err: any) {
        return res.json({ output: null, error: `Error changing directory: ${err.message}`, cwd: currentDirectory });
      }
    }

    exec(command, { cwd: currentDirectory }, (error, stdout, stderr) => {
      res.json({
        output: stdout,
        error: stderr || (error ? error.message : null),
        cwd: currentDirectory
      });
    });
  });

  app.post("/api/processes/:id/action", (req, res) => {
    const { id } = req.params;
    const { action } = req.body;
    
    const taskIndex = mockTasks.findIndex(t => t.id === id);
    if (taskIndex === -1) return res.status(404).json({ error: "Process not found" });

    switch (action) {
      case "terminate":
        mockTasks = mockTasks.filter(t => t.id !== id);
        break;
      case "suspend":
        mockTasks[taskIndex].status = "suspended";
        break;
      case "resume":
        mockTasks[taskIndex].status = "running";
        break;
    }

    res.json({ success: true });
  });

  app.get("/api/files", (req, res) => {
    res.json([
      {
        id: "root",
        name: "SENTINEL_ROOT",
        type: "directory",
        modified: new Date().toISOString(),
        children: [
          { id: "sys1", name: "kernel.bin", type: "file", size: "1.2GB", modified: "2026-04-20", intel: "Core system component. 98% integrity." },
          { id: "sys2", name: "drivers", type: "directory", modified: "2026-04-21", children: [] },
          { id: "sys3", name: "config.yaml", type: "file", size: "4KB", modified: "2026-04-28", intel: "Last modified by SentinelCore." },
        ]
      }
    ]);
  });

  // --- File Intelligence APIs ---

  interface IntelligenceScan {
    files: any[];
    stats: {
      totalSize: number;
      fileCount: number;
      categories: Record<string, number>;
      largeFiles: any[];
      duplicates: any[][];
      tempFiles: any[];
    };
  }

  function formatBytes(bytes: number) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  app.get("/api/intelligence/scan", (req, res) => {
    const rootPath = process.cwd();
    const result: IntelligenceScan = {
      files: [],
      stats: {
        totalSize: 0,
        fileCount: 0,
        categories: {
          Code: 0,
          Media: 0,
          System: 0,
          Config: 0,
          Other: 0
        },
        largeFiles: [],
        duplicates: [],
        tempFiles: []
      }
    };

    const fileMap: Record<string, any[]> = {}; // For duplicate detection (name + size)

    function walkSync(dir: string, depth = 0) {
      if (depth > 5) return; // Limit depth for safety
      const files = fs.readdirSync(dir);
      files.forEach(file => {
        const filePath = path.join(dir, file);
        if (file === 'node_modules' || file === '.git' || file === 'dist' || file === '.next') return;

        try {
          const stats = fs.statSync(filePath);
          const isDir = stats.isDirectory();
          const ext = path.extname(file).toLowerCase();
          
          const fileInfo = {
            id: filePath,
            name: file,
            type: isDir ? 'directory' : 'file',
            size: stats.size,
            sizeFormatted: formatBytes(stats.size),
            modified: stats.mtime.toISOString(),
            extension: ext,
            path: filePath.replace(rootPath, '')
          };

          if (!isDir) {
            result.stats.totalSize += stats.size;
            result.stats.fileCount += 1;

            // Categorization
            if (['.ts', '.tsx', '.js', '.jsx', '.html', '.css', '.json'].includes(ext)) {
              result.stats.categories.Code += stats.size;
            } else if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.mp4', '.mov'].includes(ext)) {
              result.stats.categories.Media += stats.size;
            } else if (['.bin', '.exe', '.sh', '.bat'].includes(ext)) {
              result.stats.categories.System += stats.size;
            } else if (['.yaml', '.yml', '.env', '.conf'].includes(ext)) {
              result.stats.categories.Config += stats.size;
            } else {
              result.stats.categories.Other += stats.size;
            }

            // Large files (> 1MB for demo purposes, usually check GB)
            if (stats.size > 1024 * 10) { // Using 10KB as "large" for this small repo demo
               result.stats.largeFiles.push(fileInfo);
            }

            // Temp files simulation
            if (['.tmp', '.log', '.cache'].includes(ext) || file.includes('temp')) {
              result.stats.tempFiles.push(fileInfo);
            }

            // Duplicate detection (simple based on name and size)
            const key = `${file}_${stats.size}`;
            if (!fileMap[key]) fileMap[key] = [];
            fileMap[key].push(fileInfo);
          }

          if (isDir) {
            walkSync(filePath, depth + 1);
          }
        } catch (e) {
          // Skip files we can't access
        }
      });
    }

    walkSync(rootPath);

    // Filter duplicates
    result.stats.duplicates = Object.values(fileMap).filter(list => list.length > 1);
    
    // Sort large files
    result.stats.largeFiles.sort((a, b) => b.size - a.size).slice(0, 5);

    res.json(result);
  });

  app.post("/api/intelligence/cleanup", (req, res) => {
    // In a real app we'd delete, here we simulate
    res.json({ 
      success: true, 
      message: "Temporary files cleared.",
      reclaimed: "2.4 MB" 
    });
  });

  // --- Quick Operations APIs ---
  app.post("/api/operations/deep-scan", (req, res) => {
    // Simulate a deep scan delay
    setTimeout(() => {
      res.json({
        success: true,
        message: "Deep scan completed. No critical vulnerabilities found. 3 optimizations suggested.",
        timestamp: new Date().toISOString()
      });
    }, 2000);
  });

  app.post("/api/operations/clear-logs", (req, res) => {
    res.json({
      success: true,
      message: "System logs successfully truncated and archived.",
      reclaimed: "142 MB"
    });
  });

  app.post("/api/operations/reboot", (req, res) => {
    // In a real environment we might actually restart the process,
    // but here we just acknowledge and the frontend will handle UI.
    res.json({
      success: true,
      message: "Reboot sequence initiated. System will be offline for approximately 15 seconds."
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      cacheDir: path.join(process.cwd(), '.vite-cache'),
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const httpServer = app.listen(PORT, "0.0.0.0", () => {
    console.log(`SentinelOS Backend operational on http://localhost:${PORT}`);
  });

  const websocketServer = new WebSocketServer({ server: httpServer, path: '/ws/stats' });

  websocketServer.on('connection', (socket) => {
    connectedSockets.add(socket);

    if (!cachedStats) {
      refreshStatsCache();
    }

    if (cachedStats) {
      socket.send(JSON.stringify({ type: 'stats', payload: cachedStats } satisfies TransportMessage));
    }

    socket.on('close', () => {
      connectedSockets.delete(socket);
    });
  });

  refreshStatsCache();
}

startServer();
