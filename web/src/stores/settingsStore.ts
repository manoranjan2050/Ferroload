import { create } from 'zustand'
import type { Settings } from '../types'

interface SettingsStore {
  settings: Settings | null
  theme: 'dark' | 'light'
  aiAvailable: boolean
  setSettings: (s: Settings) => void
  setTheme: (t: 'dark' | 'light') => void
  setAiAvailable: (v: boolean) => void
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  settings: null,
  theme: 'dark',
  aiAvailable: false,
  setSettings: (settings) => set({ settings }),
  setTheme: (theme) => {
    set({ theme })
    document.documentElement.classList.toggle('dark', theme === 'dark')
  },
  setAiAvailable: (aiAvailable) => set({ aiAvailable }),
}))
