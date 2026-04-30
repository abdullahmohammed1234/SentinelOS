import { useSyncExternalStore } from 'react';
import { SystemStats } from '../types';

type StatsSource = 'idle' | 'socket' | 'polling';

interface SystemStatsState {
  stats: SystemStats | null;
  loading: boolean;
  error: string | null;
  source: StatsSource;
  updatedAt: number;
}

interface StatsEnvelope {
  type?: string;
  payload?: SystemStats;
  stats?: SystemStats;
}

const STATS_ENDPOINT = '/api/stats';
const STATS_SOCKET_PATH = '/ws/stats';
const STATS_REQUEST_TIMEOUT_MS = 6000;
const SOCKET_RECONNECT_DELAY_MS = 3000;
const FALLBACK_POLL_INTERVAL_MS = 15000;

const listeners = new Set<() => void>();
let state: SystemStatsState = {
  stats: null,
  loading: true,
  error: null,
  source: 'idle',
  updatedAt: 0,
};

let socket: WebSocket | null = null;
let reconnectTimer: number | null = null;
let fallbackPollTimer: number | null = null;
let inflightFetch: Promise<void> | null = null;
let activeConsumers = 0;
let flushScheduled = false;
let lastSerializedSnapshot = '';

function scheduleFlush() {
  if (flushScheduled || typeof window === 'undefined') return;
  flushScheduled = true;

  window.requestAnimationFrame(() => {
    flushScheduled = false;
    listeners.forEach((listener) => listener());
  });
}

function commit(nextState: Partial<SystemStatsState>) {
  const next = { ...state, ...nextState };

  if (
    next.stats === state.stats &&
    next.loading === state.loading &&
    next.error === state.error &&
    next.source === state.source &&
    next.updatedAt === state.updatedAt
  ) {
    return;
  }

  state = next;
  scheduleFlush();
}

function mergeSnapshot(snapshot: SystemStats, source: StatsSource) {
  const serialized = JSON.stringify(snapshot);

  // Avoid repainting the whole app when the transport only replays the same cached payload.
  if (serialized === lastSerializedSnapshot) {
    commit({ loading: false, error: null, source });
    return;
  }

  lastSerializedSnapshot = serialized;
  commit({
    stats: snapshot,
    loading: false,
    error: null,
    source,
    updatedAt: Date.now(),
  });
}

async function fetchSnapshot(source: StatsSource = 'polling') {
  if (inflightFetch) return inflightFetch;

  inflightFetch = (async () => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), STATS_REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(STATS_ENDPOINT, {
        signal: controller.signal,
        headers: {
          'x-stats-source': source,
        },
      });

      if (!response.ok) {
        throw new Error(`Stats request failed with status ${response.status}`);
      }

      const data = (await response.json()) as SystemStats;
      mergeSnapshot(data, source);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        commit({ loading: false, error: 'Stats request timed out' });
      } else {
        commit({ loading: false, error: error instanceof Error ? error.message : 'Unable to load system stats' });
      }
    } finally {
      window.clearTimeout(timeoutId);
      inflightFetch = null;
    }
  })();

  return inflightFetch;
}

function connectSocket() {
  if (typeof window === 'undefined' || socket) return;

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const socketUrl = `${protocol}//${window.location.host}${STATS_SOCKET_PATH}`;

  try {
    socket = new WebSocket(socketUrl);

    socket.onopen = () => {
      commit({ source: 'socket', error: null });
      if (fallbackPollTimer !== null) {
        window.clearInterval(fallbackPollTimer);
        fallbackPollTimer = null;
      }
    };

    socket.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data) as StatsEnvelope;
        const snapshot = parsed.payload ?? parsed.stats;
        if (snapshot) {
          mergeSnapshot(snapshot, 'socket');
        }
      } catch {
        // Ignore malformed transport payloads so a single bad frame does not break the stream.
      }
    };

    socket.onerror = () => {
      commit({ source: 'polling' });
      scheduleFallbackPolling();
    };

    socket.onclose = () => {
      socket = null;
      commit({ source: 'polling' });
      scheduleFallbackPolling();

      if (activeConsumers > 0 && reconnectTimer === null) {
        reconnectTimer = window.setTimeout(() => {
          reconnectTimer = null;
          connectSocket();
        }, SOCKET_RECONNECT_DELAY_MS);
      }
    };
  } catch {
    socket = null;
    scheduleFallbackPolling();
  }
}

function scheduleFallbackPolling() {
  if (fallbackPollTimer !== null || typeof window === 'undefined' || activeConsumers === 0) return;

  fallbackPollTimer = window.setInterval(() => {
    void fetchSnapshot('polling');
  }, FALLBACK_POLL_INTERVAL_MS);
}

function startTransport() {
  if (typeof window === 'undefined') return;

  if (activeConsumers === 1) {
    void fetchSnapshot('polling');
    connectSocket();
    scheduleFallbackPolling();

    const refreshListener = () => {
      void refreshStats();
    };

    window.addEventListener('sentinel-refresh-stats', refreshListener);
    (window as Window & { __sentinelStatsRefreshListener?: () => void }).__sentinelStatsRefreshListener = refreshListener;
  }
}

function stopTransport() {
  if (typeof window === 'undefined') return;

  if (socket) {
    socket.close();
    socket = null;
  }

  if (reconnectTimer !== null) {
    window.clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  if (fallbackPollTimer !== null) {
    window.clearInterval(fallbackPollTimer);
    fallbackPollTimer = null;
  }

  const refreshListener = (window as Window & { __sentinelStatsRefreshListener?: () => void }).__sentinelStatsRefreshListener;
  if (refreshListener) {
    window.removeEventListener('sentinel-refresh-stats', refreshListener);
    delete (window as Window & { __sentinelStatsRefreshListener?: () => void }).__sentinelStatsRefreshListener;
  }
}

export function subscribeToSystemStats(listener: () => void) {
  listeners.add(listener);
  activeConsumers += 1;
  startTransport();

  return () => {
    listeners.delete(listener);
    activeConsumers = Math.max(0, activeConsumers - 1);

    if (activeConsumers === 0) {
      stopTransport();
    }
  };
}

export function getSystemStatsSnapshot() {
  return state;
}

export function useSystemStatsStore() {
  return useSyncExternalStore(subscribeToSystemStats, getSystemStatsSnapshot, getSystemStatsSnapshot);
}

export async function refreshStats() {
  return fetchSnapshot('polling');
}