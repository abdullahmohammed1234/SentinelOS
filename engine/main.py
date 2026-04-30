import asyncio
import json
import sys
import os
import time

# Add parent directory to path to allow absolute imports if needed
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from monitors.system_monitor import SystemMonitor
from monitors.process_monitor import ProcessMonitor
from analyzers.health_analyzer import HealthAnalyzer

class SentinelEngine:
    """
    The main driver for the SentinelOS backend engine.
    Orchestrates monitoring, analysis, and communication.
    """
    
    def __init__(self):
        self.system_monitor = SystemMonitor()
        self.process_monitor = ProcessMonitor()
        self.health_analyzer = HealthAnalyzer()
        self.running = True

    async def run(self):
        """Main loop for data collection and reporting."""
        while self.running:
            try:
                # 1. Collect Metrics
                metrics = await self.system_monitor.get_all_metrics()
                processes = self.process_monitor.get_processes()
                
                # 2. Analyze
                health_score = self.health_analyzer.calculate_health_score(metrics, processes)
                anomalies = self.health_analyzer.detect_anomalies(metrics, processes)
                recommendations = self.health_analyzer.get_recommendations(health_score, anomalies)
                
                # 3. Aggregate Data
                report = {
                    'status': 'operational',
                    'timestamp': time.time(),
                    'metrics': metrics,
                    'processes': processes[:50], # Limit for performance over IPC
                    'analysis': {
                        'health_score': health_score,
                        'anomalies': anomalies,
                        'recommendations': recommendations
                    }
                }
                
                # 4. Output as JSON to stdout (Inter-Process Communication)
                print(json.dumps(report), flush=True)
                
                # Sleep between polls
                await asyncio.sleep(2)
                
            except Exception as e:
                error_msg = {'status': 'error', 'message': str(e)}
                print(json.dumps(error_msg), flush=True)
                await asyncio.sleep(5)

if __name__ == "__main__":
    engine = SentinelEngine()
    try:
        asyncio.run(engine.run())
    except KeyboardInterrupt:
        pass
