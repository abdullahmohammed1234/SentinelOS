import os
import re

class ProcessMonitor:
    """
    Scans the /proc filesystem for active processes.
    Extracts PIDs, names, and basic resource usage without psutil.
    """

    def get_processes(self):
        """Discovers all running processes by scanning /proc/[pid] directories."""
        processes = []
        pids = [d for d in os.listdir('/proc') if d.isdigit()]
        
        for pid in pids:
            try:
                # Read process name and basic info from /proc/[pid]/stat
                with open(f'/proc/{pid}/stat', 'r') as f:
                    content = f.read()
                    # Pattern: pid (comm) state ppid ...
                    match = re.match(r'^(\d+) \((.*)\) (.) (\d+)', content)
                    if match:
                        proc_pid = match.group(1)
                        name = match.group(2)
                        state = match.group(3)
                        ppid = match.group(4)
                        
                        # Read memory usage from /proc/[pid]/status
                        rss = 0
                        with open(f'/proc/{pid}/status', 'r') as fs:
                            for line in fs:
                                if line.startswith('VmRSS:'):
                                    rss = int(line.split()[1]) # KB
                                    break
                        
                        processes.append({
                            'id': proc_pid,
                            'pid': int(proc_pid),
                            'name': name,
                            'status': self._map_state(state),
                            'memory': rss // 1024, # MB
                            'ppid': int(ppid)
                        })
            except (FileNotFoundError, PermissionError):
                continue
                
        return processes

    def _map_state(self, state_char):
        """Maps Linux process states to human readable strings."""
        mapping = {
            'R': 'running',
            'S': 'sleeping',
            'D': 'disk sleep',
            'Z': 'zombie',
            'T': 'stopped',
            't': 'tracing stop',
            'X': 'dead',
            'I': 'idle'
        }
        return mapping.get(state_char, 'unknown')
