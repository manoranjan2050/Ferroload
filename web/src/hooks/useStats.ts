import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { getStats } from '../api/stats'
import { useTorrentStore } from '../stores/torrentStore'

export function useStats() {
  const setStats = useTorrentStore((s) => s.setStats)
  const stats = useTorrentStore((s) => s.stats)

  const { data } = useQuery({
    queryKey: ['stats'],
    queryFn: getStats,
    refetchInterval: 2000,
  })

  useEffect(() => {
    if (data) setStats(data)
  }, [data])

  return { stats }
}
