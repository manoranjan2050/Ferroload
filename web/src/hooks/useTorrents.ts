import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listTorrents, pauseTorrent, resumeTorrent, deleteTorrent } from '../api/torrents'
import { useTorrentStore } from '../stores/torrentStore'

export function useTorrents() {
  const setTorrents = useTorrentStore((s) => s.setTorrents)
  const torrents = useTorrentStore((s) => s.torrents)
  const qc = useQueryClient()

  const { isLoading, data } = useQuery({
    queryKey: ['torrents'],
    queryFn: listTorrents,
    refetchInterval: 3000,
  })

  useEffect(() => {
    if (data) setTorrents(data)
  }, [data])

  const pause = useMutation({ mutationFn: pauseTorrent, onSuccess: () => qc.invalidateQueries({ queryKey: ['torrents'] }) })
  const resume = useMutation({ mutationFn: resumeTorrent, onSuccess: () => qc.invalidateQueries({ queryKey: ['torrents'] }) })
  const remove = useMutation({ mutationFn: (id: string) => deleteTorrent(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['torrents'] }) })

  return { torrents, isLoading, pause, resume, remove }
}
