type WorkerInput =
  | { type: 'scan' }
  | { type: 'optimize'; metrics: {
      storageRecoverable: number;
      ramFreeable: number;
      cpuOptimizationPotential: number;
      startupItemsCount: number;
      backgroundProcessCount: number;
      tempFilesCount: number;
    }};

type WorkerOutput =
  | { type: 'progress'; phase: 'scan' | 'optimize'; progress: number }
  | { type: 'scan-complete'; metrics: {
      storageRecoverable: number;
      ramFreeable: number;
      cpuOptimizationPotential: number;
      startupItemsCount: number;
      backgroundProcessCount: number;
      tempFilesCount: number;
    }}
  | { type: 'optimize-complete'; results: {
      storageRecovered: number;
      ramFreed: number;
      cpuImprovement: number;
      tasksTerminated: number;
      tempFilesDeleted: number;
    }};

const scanMetrics = {
  storageRecoverable: 1240000000,
  ramFreeable: 840000000,
  cpuOptimizationPotential: 15,
  startupItemsCount: 3,
  backgroundProcessCount: 12,
  tempFilesCount: 450,
};

function runProgress(step: number, max: number, delay: number, onTick: (progress: number) => void) {
  return new Promise<void>((resolve) => {
    let progress = 0;
    const timer = setInterval(() => {
      progress = Math.min(100, progress + step);
      onTick(progress);

      if (progress >= max) {
        clearInterval(timer);
        resolve();
      }
    }, delay);
  });
}

self.onmessage = async (event: MessageEvent<WorkerInput>) => {
  if (event.data.type === 'scan') {
    await runProgress(5, 100, 60, (progress) => {
      const message: WorkerOutput = { type: 'progress', phase: 'scan', progress };
      self.postMessage(message);
    });

    const completeMessage: WorkerOutput = { type: 'scan-complete', metrics: scanMetrics };
    self.postMessage(completeMessage);
    return;
  }

  await runProgress(2, 100, 35, (progress) => {
    const message: WorkerOutput = { type: 'progress', phase: 'optimize', progress };
    self.postMessage(message);
  });

  const resultMessage: WorkerOutput = {
    type: 'optimize-complete',
    results: {
      storageRecovered: event.data.metrics.storageRecoverable * 0.95,
      ramFreed: event.data.metrics.ramFreeable * 0.8,
      cpuImprovement: 12.5,
      tasksTerminated: 10,
      tempFilesDeleted: 432,
    },
  };

  self.postMessage(resultMessage);
};