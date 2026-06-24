import type { GlobalStats, ApiResponse } from '../types'

export async function getStats(): Promise<GlobalStats> {
  const res = await fetch('/api/v1/stats')
  const json: ApiResponse<GlobalStats> = await res.json()
  if (!json.success) throw new Error(json.error)
  return json.data!
}
