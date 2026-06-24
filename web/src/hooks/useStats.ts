import { useQuery } from '@tanstack/react-query'
import { getStats } from '../api/stats'
import { useTorrentStore } from '../stores/torrentStore'

export function useStats() {
  const setStats = useTorrentStore((s) => s.setStats)
  const stats = useTorrentStore((s) => s.stats)

  useQuery({
    queryKey: ['stats'],
    queryFn: getStats,
    refetchInterval: 2000,
    onSuccess: (data) => setStats(data),
  })

  return { stats }
}
