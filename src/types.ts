export interface SystemStats {
  cpu: number;
  cpuThreads: number[]; // Percentage per thread
  memory: {
    used: number;
    total: number;
    percentage: number;
    buffer: number;
    cache: number;
  };
  uptime: number;
  tasks: Task[];
  processTree: ProcessNode;
  processCount: number;
  loadAverage: number[];
  disk: {
    used: number;
    total: number;
    percentage: number;
    readSpeed: number;
    writeSpeed: number;
    activeTime: number; // 0-100 percentage activity
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
    cores: number[]; // Temperatures in Celsius
    gpu: number;
    disk: number;
    ambient: number;
    map: number[][]; // 10x10 grid of heatmap values
  };
  battery: {
    level: number;
    isCharging: boolean;
    timeLeft: number | null;
  };
  timestamp?: number;
}

export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface Alert {
  id: string;
  timestamp: number;
  message: string;
  severity: AlertSeverity;
  type: 'cpu' | 'ram' | 'process' | 'disk' | 'network' | 'system' | 'predictive';
  dismissed: boolean;
  read: boolean;
}

export interface ProcessNode {
  id: string;
  name: string;
  cpu: number;
  children?: ProcessNode[];
}

export interface Task {
  id: string;
  pid: number;
  name: string;
  cpu: number;
  memory: number;
  status: 'running' | 'sleeping' | 'stopped' | 'zombie' | 'suspended';
  user: string;
  runtime: string;
  isBackground: boolean;
  history: number[]; // Last 20 CPU usage readings
}

export interface FileIntelligenceData {
  stats: {
    totalSize: number;
    fileCount: number;
    categories: Record<string, number>;
    largeFiles: FileNode[];
    duplicates: FileNode[][];
    tempFiles: FileNode[];
  };
}

export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'directory';
  size?: number;
  sizeFormatted?: string;
  modified: string;
  children?: FileNode[];
  intel?: string;
  path?: string;
  extension?: string;
}

export interface OptimizationMetrics {
  storageRecoverable: number;
  ramFreeable: number;
  cpuOptimizationPotential: number;
  startupItemsCount: number;
  backgroundProcessCount: number;
  tempFilesCount: number;
}

export interface OptimizationResult {
  storageRecovered: number;
  ramFreed: number;
  cpuImprovement: number;
  tasksTerminated: number;
  tempFilesDeleted: number;
}
