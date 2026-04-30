import os
import time
import json
import asyncio

class SystemMonitor:
    """
    Core monitoring service for SentinelOS.
    Collects metrics directly from the Linux /proc filesystem to maintain
    zero-dependency architecture.
    """
    
    def __init__(self):
        self.last_cpu_times = self._get_cpu_times()

    def _get_cpu_times(self):
        """Reads /proc/stat to get raw CPU times."""
        try:
            with open('/proc/stat', 'r') as f:
                line = f.readline()
                parts = line.split()
                # user, nice, system, idle, iowait, irq, softirq
                times = [float(p) for p in parts[1:8]]
                return times
        except Exception:
            return [0.0] * 7

    def get_cpu_usage(self):
        """Calculates CPU usage percentage since last check."""
        new_times = self._get_cpu_times()
        
        # Calculate deltas
        deltas = [n - o for n, o in zip(new_times, self.last_cpu_times)]
        self.last_cpu_times = new_times
        
        total_delta = sum(deltas)
        if total_delta == 0:
            return 0.0
            
        # Idle time is the 4th value (index 3)
        idle_delta = deltas[3]
        usage = 100.0 * (1.0 - idle_delta / total_delta)
        return round(usage, 2)

    def get_memory_info(self):
        """Reads /proc/meminfo for RAM stats."""
        mem_info = {}
        try:
            with open('/proc/meminfo', 'r') as f:
                for line in f:
                    parts = line.split(':')
                    if len(parts) == 2:
                        name = parts[0].strip()
                        value = parts[1].split()[0].strip()
                        mem_info[name] = int(value) # value in KB
            
            total = mem_info.get('MemTotal', 0)
            free = mem_info.get('MemFree', 0)
            available = mem_info.get('MemAvailable', free)
            used = total - available
            
            return {
                'total': total // 1024, # MB
                'used': used // 1024,   # MB
                'available': available // 1024, # MB
                'percentage': round((used / total) * 100, 2) if total > 0 else 0
            }
        except Exception:
            return {'total': 0, 'used': 0, 'available': 0, 'percentage': 0}

    def get_disk_usage(self):
        """Gets root partition disk usage using os.statvfs."""
        try:
            st = os.statvfs('/')
            total = (st.f_blocks * st.f_frsize)
            used = (st.f_blocks - st.f_bfree) * st.f_frsize
            free = st.f_bavail * st.f_frsize
            
            return {
                'total': total // (1024 * 1024), # MB
                'used': used // (1024 * 1024),   # MB
                'free': free // (1024 * 1024),   # MB
                'percentage': round((used / total) * 100, 2) if total > 0 else 0
            }
        except Exception:
            return {'total': 0, 'used': 0, 'free': 0, 'percentage': 0}

    async def get_all_metrics(self):
        """Aggregates all system metrics."""
        return {
            'cpu': self.get_cpu_usage(),
            'memory': self.get_memory_info(),
            'disk': self.get_disk_usage(),
            'timestamp': time.time()
        }
