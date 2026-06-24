import type { TorrentInfo, ApiResponse } from '../types'

const BASE = '/api/v1'

export async function listTorrents(): Promise<TorrentInfo[]> {
  const res = await fetch(`${BASE}/torrents`)
  const json: ApiResponse<TorrentInfo[]> = await res.json()
  if (!json.success) throw new Error(json.error)
  return json.data!
}

export async function getTorrent(id: string): Promise<TorrentInfo> {
  const res = await fetch(`${BASE}/torrents/${id}`)
  const json: ApiResponse<TorrentInfo> = await res.json()
  if (!json.success) throw new Error(json.error)
  return json.data!
}

export async function addMagnet(magnet: string, downloadPath?: string, label?: string): Promise<TorrentInfo> {
  const res = await fetch(`${BASE}/torrents/magnet`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ magnet, download_path: downloadPath, label }),
  })
  const json: ApiResponse<TorrentInfo> = await res.json()
  if (!json.success) throw new Error(json.error)
  return json.data!
}

export async function addTorrentFile(file: File, downloadPath?: string, label?: string): Promise<TorrentInfo> {
  const fd = new FormData()
  fd.append('file', file)
  if (downloadPath) fd.append('download_path', downloadPath)
  if (label) fd.append('label', label)
  const res = await fetch(`${BASE}/torrents/file`, { method: 'POST', body: fd })
  const json: ApiResponse<TorrentInfo> = await res.json()
  if (!json.success) throw new Error(json.error)
  return json.data!
}

export async function deleteTorrent(id: string, deleteFiles = false): Promise<void> {
  await fetch(`${BASE}/torrents/${id}?delete_files=${deleteFiles}`, { method: 'DELETE' })
}

export async function pauseTorrent(id: string): Promise<void> {
  await fetch(`${BASE}/torrents/${id}/pause`, { method: 'POST' })
}

export async function resumeTorrent(id: string): Promise<void> {
  await fetch(`${BASE}/torrents/${id}/resume`, { method: 'POST' })
}
