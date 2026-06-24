import { useEffect } from 'react'
import { wsClient } from '../api/ws'
import { useTorrentStore } from '../stores/torrentStore'
import type { WsEvent } from '../types'

export function useWebSocket() {
  const { updateTorrent, addTorrent, setStats } = useTorrentStore()

  useEffect(() => {
    wsClient.connect()
    const unsub = wsClient.subscribe((event: WsEvent) => {
      switch (event.type) {
        case 'torrent_progress':
          updateTorrent(event.id, {
            downloaded: event.downloaded,
            size: event.total,
            speed_down: event.speed_down,
            speed_up: event.speed_up,
            peers: event.peers,
            eta_secs: event.eta_secs,
            progress: event.progress,
          })
          break
        case 'torrent_added':
          addTorrent(event.torrent)
          break
        case 'torrent_finished':
          updateTorrent(event.id, { status: 'seeding', progress: 1, speed_down: 0 })
          break
        case 'torrent_error':
          updateTorrent(event.id, { status: 'error' })
          break
        case 'global_stats':
          setStats({
            speed_down: event.speed_down,
            speed_up: event.speed_up,
            active_torrents: event.active_torrents,
            paused_torrents: 0,
            seeding_torrents: 0,
            total_downloaded: 0,
            total_uploaded: 0,
          })
          break
      }
    })
    return unsub
  }, [])
}
