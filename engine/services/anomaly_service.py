import time

class AnomalyService:
    """
    Advanced anomaly detection service for SentinelOS.
    Uses pattern matching and heuristic analysis to identify system risks.
    """
    
    def __init__(self):
        self.baseline_cpu = None
        self.baseline_mem = None

    def analyze_risk(self, metrics, processes):
        """Analyzes the risk factor of current system state."""
        risk_level = 0
        factors = []
        
        # Identity-based risk (unknown users)
        unknown_procs = [p for p in processes if p.get('user') == 'unknown']
        if unknown_procs:
            risk_level += len(unknown_procs) * 5
            factors.append(f"Detected {len(unknown_procs)} processes from unverified users.")
            
        # Resource-based risk
        if metrics['cpu'] > 85:
            risk_level += 20
            factors.append("Sustained high CPU utilization.")
            
        if metrics['memory']['percentage'] > 90:
            risk_level += 25
            factors.append("Low free memory buffers.")
            
        return {
            'risk_score': min(100, risk_level),
            'risk_category': self._get_category(risk_level),
            'factors': factors
        }

    def _get_category(self, score):
        if score > 70: return 'CRITICAL'
        if score > 40: return 'ELEVATED'
        if score > 15: return 'GUARDED'
        return 'STABLE'
