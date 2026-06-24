import type { Settings, ApiResponse } from '../types'

export async function getSettings(): Promise<Settings> {
  const res = await fetch('/api/v1/settings')
  const json: ApiResponse<Settings> = await res.json()
  if (!json.success) throw new Error(json.error)
  return json.data!
}

export async function updateSettings(settings: Partial<Settings>): Promise<void> {
  await fetch('/api/v1/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  })
}
