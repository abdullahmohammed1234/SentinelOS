import { useCallback, useEffect, useRef, useState } from 'react';
import { OptimizationMetrics, OptimizationResult } from '../types';

export const useOptimization = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [metrics, setMetrics] = useState<OptimizationMetrics | null>(null);
  const [results, setResults] = useState<OptimizationResult | null>(null);
  const [scanProgress, setScanProgress] = useState(0);
  const [optimizeProgress, setOptimizeProgress] = useState(0);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    const worker = new Worker(new URL('../workers/optimizationWorker.ts', import.meta.url), { type: 'module' });
    workerRef.current = worker;

    worker.onmessage = (event: MessageEvent<any>) => {
      const message = event.data;

      if (message.type === 'progress' && message.phase === 'scan') {
        setScanProgress(message.progress);
        return;
      }

      if (message.type === 'progress' && message.phase === 'optimize') {
        setOptimizeProgress(message.progress);
        return;
      }

      if (message.type === 'scan-complete') {
        setMetrics(message.metrics);
        setIsScanning(false);
        return;
      }

      if (message.type === 'optimize-complete') {
        setResults(message.results);
        setMetrics(null);
        setIsOptimizing(false);
      }
    };

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  const scan = useCallback(async () => {
    if (!workerRef.current || isScanning || isOptimizing) return;

    setIsScanning(true);
    setScanProgress(0);
    setResults(null);

    workerRef.current.postMessage({ type: 'scan' });
  }, [isScanning, isOptimizing]);

  const optimize = useCallback(async () => {
    if (!metrics || !workerRef.current || isScanning || isOptimizing) return;

    setIsOptimizing(true);
    setOptimizeProgress(0);

    workerRef.current.postMessage({ type: 'optimize', metrics });
  }, [metrics, isScanning, isOptimizing]);

  return {
    isScanning,
    isOptimizing,
    metrics,
    results,
    scanProgress,
    optimizeProgress,
    scan,
    optimize
  };
};
