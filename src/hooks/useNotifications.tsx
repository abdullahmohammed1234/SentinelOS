import { useState, useCallback, useEffect, createContext, useContext, ReactNode } from 'react';
import { Alert, AlertSeverity } from '../types';

interface NotificationContextType {
  alerts: Alert[];
  activeNotifications: Alert[];
  addAlert: (alert: Omit<Alert, 'id' | 'timestamp' | 'dismissed' | 'read'>) => void;
  dismissAlert: (id: string) => void;
  markAsRead: (id: string) => void;
  clearHistory: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Sound utility
const playAlertSound = (severity: AlertSeverity) => {
  const frequencies = {
    info: 440,
    warning: 660,
    critical: 220,
  };
  
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = severity === 'critical' ? 'sawtooth' : 'sine';
    oscillator.frequency.setValueAtTime(frequencies[severity], audioCtx.currentTime);
    
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.5);
  } catch (e) {
    console.warn('Audio visualization not supported or blocked by browser');
  }
};

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [activeNotifications, setActiveNotifications] = useState<Alert[]>([]);

  const addAlert = useCallback((newAlert: Omit<Alert, 'id' | 'timestamp' | 'dismissed' | 'read'>) => {
    const alert: Alert = {
      ...newAlert,
      id: Math.random().toString(36).substring(2, 9),
      timestamp: Date.now(),
      dismissed: false,
      read: false,
    };

    setAlerts((prev) => [alert, ...prev].slice(0, 50)); // Keep last 50
    setActiveNotifications((prev) => [...prev, alert]);
    
    playAlertSound(alert.severity);

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      setActiveNotifications((prev) => prev.filter((a) => a.id !== alert.id));
    }, 5000);
  }, []);

  const dismissAlert = useCallback((id: string) => {
    setActiveNotifications((prev) => prev.filter((a) => a.id !== id));
    setAlerts((prev) => prev.map(a => a.id === id ? { ...a, dismissed: true } : a));
  }, []);

  const markAsRead = useCallback((id: string) => {
    setAlerts((prev) => prev.map(a => a.id === id ? { ...a, read: true } : a));
  }, []);

  const clearHistory = useCallback(() => {
    setAlerts([]);
  }, []);

  return (
    <NotificationContext.Provider value={{
      alerts,
      activeNotifications,
      addAlert,
      dismissAlert,
      markAsRead,
      clearHistory
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
