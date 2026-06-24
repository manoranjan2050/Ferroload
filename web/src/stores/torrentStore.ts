import { create } from 'zustand'
import type { TorrentInfo, GlobalStats } from '../types'

interface TorrentStore {
  torrents: TorrentInfo[]
  stats: GlobalStats | null
  selectedId: string | null
  setTorrents: (torrents: TorrentInfo[]) => void
  updateTorrent: (id: string, patch: Partial<TorrentInfo>) => void
  addTorrent: (torrent: TorrentInfo) => void
  removeTorrent: (id: string) => void
  setStats: (stats: GlobalStats) => void
  setSelectedId: (id: string | null) => void
}

export const useTorrentStore = create<TorrentStore>((set) => ({
  torrents: [],
  stats: null,
  selectedId: null,
  setTorrents: (torrents) => set({ torrents }),
  updateTorrent: (id, patch) =>
    set((state) => ({
      torrents: state.torrents.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    })),
  addTorrent: (torrent) =>
    set((state) => ({
      torrents: state.torrents.some((t) => t.id === torrent.id)
        ? state.torrents.map((t) => (t.id === torrent.id ? torrent : t))
        : [...state.torrents, torrent],
    })),
  removeTorrent: (id) =>
    set((state) => ({ torrents: state.torrents.filter((t) => t.id !== id) })),
  setStats: (stats) => set({ stats }),
  setSelectedId: (id) => set({ selectedId: id }),
}))
