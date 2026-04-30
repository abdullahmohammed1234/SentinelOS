import { useEffect, useRef } from 'react';
import { useSystemStats } from './useSystemStats';
import { useNotifications } from './useNotifications';

export function useAlertEngine() {
  const { stats } = useSystemStats();
  const { addAlert } = useNotifications();
  
  // Refs to track states and avoid duplicate alerts
  const lastCpuAlert = useRef<number>(0);
  const lastRamAlert = useRef<number>(0);
  const lastDiskAlert = useRef<number>(0);
  const knownSuspiciousPids = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (!stats) return;

    const now = Date.now();
    const COOLDOWN = 30000; // 30 seconds cooldown between similar alerts

    // 1. CPU Monitoring
    if (stats.cpu > 90 && now - lastCpuAlert.current > COOLDOWN) {
      addAlert({
        message: `Critical CPU Load: ${stats.cpu.toFixed(1)}% usage detected. System stability may be compromised.`,
        severity: 'critical',
        type: 'cpu'
      });
      lastCpuAlert.current = now;
    } else if (stats.cpu > 75 && now - lastCpuAlert.current > COOLDOWN) {
      addAlert({
        message: `High CPU Usage: ${stats.cpu.toFixed(1)}% load. Cooling systems compensated.`,
        severity: 'warning',
        type: 'cpu'
      });
      lastCpuAlert.current = now;
    }

    // 2. RAM Monitoring
    if (stats.memory.percentage > 95 && now - lastRamAlert.current > COOLDOWN) {
      addAlert({
        message: `Memory Exhaustion: ${stats.memory.percentage.toFixed(1)}% RAM usage. Paging occurring.`,
        severity: 'critical',
        type: 'ram'
      });
      lastRamAlert.current = now;
    } else if (stats.memory.percentage > 85 && now - lastRamAlert.current > COOLDOWN) {
      addAlert({
        message: `Memory Pressure: ${stats.memory.percentage.toFixed(1)}% usage detected. Consider terminating non-essential tasks.`,
        severity: 'warning',
        type: 'ram'
      });
      lastRamAlert.current = now;
    }

    // 3. Disk Space Monitoring
    if (stats.disk.percentage > 95 && now - lastDiskAlert.current > COOLDOWN) {
      addAlert({
        message: `Drive Near Capacity: ${stats.disk.percentage.toFixed(1)}% full. Write performance degraded.`,
        severity: 'critical',
        type: 'disk'
      });
      lastDiskAlert.current = now;
    } else if (stats.disk.percentage > 90 && now - lastDiskAlert.current > COOLDOWN) {
      addAlert({
        message: `Low Disk Space: ${stats.disk.percentage.toFixed(1)}% usage on primary volume.`,
        severity: 'warning',
        type: 'disk'
      });
      lastDiskAlert.current = now;
    }

    // 4. Suspicious Process Detection (Simulated logic based on task names/types)
    const suspiciousNames = ['miner', 'unknown_daemon', 'unauthorized_shell', 'shadow_proc'];
    stats.tasks.forEach(task => {
      if (suspiciousNames.some(name => task.name.toLowerCase().includes(name)) && !knownSuspiciousPids.current.has(task.pid)) {
        addAlert({
          message: `Security Threat: Suspicious process detected - ${task.name} (PID: ${task.pid})`,
          severity: 'critical',
          type: 'process'
        });
        knownSuspiciousPids.current.add(task.pid);
      }
    });

    // 5. Predictive Warnings (Based on delta trends if we had them, here we simulate)
    // If network latency is spiking
    if (stats.network.latency > 150) {
      addAlert({
        message: `Network Degradation: Latency spike of ${stats.network.latency}ms. Possible packet loss inbound.`,
        severity: 'info',
        type: 'predictive'
      });
    }

  }, [stats, addAlert]);
}
