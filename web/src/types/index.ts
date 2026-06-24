export type TorrentStatus = 'paused' | 'downloading' | 'seeding' | 'error' | 'checking' | 'queued'
export type FilePriority = 'high' | 'normal' | 'skip'

export interface TorrentFile {
  name: string
  path: string
  size: number
  downloaded: number
  progress: number
  priority: FilePriority
}

export interface PeerInfo {
  ip: string
  port: number
  client: string
  speed_down: number
  speed_up: number
  progress: number
  flags: string
}

export interface TorrentInfo {
  id: string
  name: string
  info_hash: string
  size: number
  downloaded: number
  uploaded: number
  progress: number
  status: TorrentStatus
  speed_down: number
  speed_up: number
  peers: number
  seeds: number
  eta_secs: number | null
  download_path: string
  label: string | null
  added_at: number
  files: TorrentFile[]
}

export interface GlobalStats {
  speed_down: number
  speed_up: number
  total_downloaded: number
  total_uploaded: number
  active_torrents: number
  paused_torrents: number
  seeding_torrents: number
}

export interface Settings {
  download_path: string
  max_download_speed_kbps: number
  max_upload_speed_kbps: number
  listen_port: number
  dht_enabled: boolean
  schedule_enabled: boolean
  schedule_start: string
  schedule_end: string
  ollama_url: string
  ollama_model: string
  ai_enabled: boolean
  theme: 'dark' | 'light'
}

export interface RssFeed {
  id: string
  url: string
  name: string
  filter_regex: string | null
  download_path: string | null
  last_checked: number | null
  enabled: number
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export type WsEvent =
  | { type: 'torrent_progress'; id: string; downloaded: number; total: number; speed_down: number; speed_up: number; peers: number; eta_secs: number | null; progress: number }
  | { type: 'torrent_added'; torrent: TorrentInfo }
  | { type: 'torrent_finished'; id: string }
  | { type: 'torrent_error'; id: string; message: string }
  | { type: 'global_stats'; speed_down: number; speed_up: number; active_torrents: number }
