import type { RssFeed, ApiResponse } from '../types'

export async function listFeeds(): Promise<RssFeed[]> {
  const res = await fetch('/api/v1/rss')
  const json: ApiResponse<RssFeed[]> = await res.json()
  if (!json.success) throw new Error(json.error)
  return json.data!
}

export async function addFeed(feed: { url: string; name: string; filter_regex?: string; download_path?: string }): Promise<void> {
  await fetch('/api/v1/rss', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(feed),
  })
}

export async function deleteFeed(id: string): Promise<void> {
  await fetch(`/api/v1/rss/${id}`, { method: 'DELETE' })
}

export async function checkFeeds(): Promise<void> {
  await fetch('/api/v1/rss/check', { method: 'POST' })
}
