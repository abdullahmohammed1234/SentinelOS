import time

class HealthAnalyzer:
    """
    Analyzes system metrics to generate health scores and detect anomalies.
    """
    
    def calculate_health_score(self, metrics, processes):
        """
        Calculates a system health score (0-100).
        Penalizes for high CPU/RAM usage and suspicious process counts.
        """
        score = 100.0
        
        # CPU Penalty
        if metrics['cpu'] > 90:
            score -= 30
        elif metrics['cpu'] > 70:
            score -= 15
            
        # Memory Penalty
        if metrics['memory']['percentage'] > 95:
            score -= 40
        elif metrics['memory']['percentage'] > 85:
            score -= 20
            
        # Disk Penalty
        if metrics['disk']['percentage'] > 95:
            score -= 10
            
        # Process count penalty (heuristic)
        if len(processes) > 500:
            score -= 5
            
        return max(0.0, score)

    def detect_anomalies(self, metrics, processes):
        """
        Detects anomalies such as process leaks or unexpected resource spikes.
        """
        anomalies = []
        
        # High CPU usage anomaly
        if metrics['cpu'] > 95:
            anomalies.append({
                'type': 'CRITICAL_CPU_LOAD',
                'severity': 'high',
                'message': 'System CPU usage is at critical levels (>95%).'
            })
            
        # Low available memory anomaly
        if metrics['memory']['available'] < 100: # Less than 100MB
            anomalies.append({
                'type': 'LOW_MEMORY_ALERT',
                'severity': 'high',
                'message': 'Available system memory is dangerously low.'
            })
            
        # Suspicious processes (e.g. many processes with the same name - potential leak)
        name_counts = {}
        for p in processes:
            name = p['name']
            name_counts[name] = name_counts.get(name, 0) + 1
            
        for name, count in name_counts.items():
            if count > 20: 
                anomalies.append({
                    'type': 'PROCESS_REPLICATION_ANOMALY',
                    'severity': 'medium',
                    'message': f'Excessive instances of process "{name}" detected ({count}).'
                })
                
        return anomalies

    def get_recommendations(self, score, anomalies):
        """
        Provides optimization recommendations based on score and anomalies.
        """
        recommendations = []
        
        if score < 80:
            recommendations.append("Consider closing high-resource background applications.")
            
        for anomaly in anomalies:
            if anomaly['type'] == 'CRITICAL_CPU_LOAD':
                recommendations.append("Review running processes and terminate unresponsive tasks.")
            if anomaly['type'] == 'LOW_MEMORY_ALERT':
                recommendations.append("Clear system cache or expand swap space.")
                
        if not recommendations and score > 95:
            recommendations.append("System is optimal. No action required.")
            
        return recommendations
