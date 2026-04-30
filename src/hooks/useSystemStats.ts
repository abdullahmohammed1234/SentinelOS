import { useSystemStatsStore } from '../lib/systemStatsStore';

export function useSystemStats() {
  return useSystemStatsStore();
}
