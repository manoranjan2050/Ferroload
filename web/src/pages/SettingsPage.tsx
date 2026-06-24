import { useEffect, useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { getSettings, updateSettings } from '../api/settings'
import type { Settings } from '../types'
import { Save } from 'lucide-react'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/5">
      <label className="text-sm text-white/60">{label}</label>
      <div className="w-56">{children}</div>
    </div>
  )
}

function TextInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      className="w-full bg-background border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-primary" />
  )
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`relative w-10 h-6 rounded-full transition-colors ${value ? 'bg-primary' : 'bg-white/10'}`}
    >
      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-1'}`} />
    </button>
  )
}

export default function SettingsPage() {
  const { data } = useQuery({ queryKey: ['settings'], queryFn: getSettings })
  const [form, setForm] = useState<Partial<Settings>>({})
  const mut = useMutation({ mutationFn: updateSettings })

  useEffect(() => { if (data) setForm(data) }, [data])

  function set<K extends keyof Settings>(k: K, v: Settings[K]) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  function save() { mut.mutate(form) }

  if (!data) return <div className="p-6 text-white/30 text-sm">Loading settings…</div>

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold text-white">Settings</h1>
        <button onClick={save} disabled={mut.isPending}
          className="flex items-center gap-2 bg-primary hover:bg-primary-hover disabled:opacity-40 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          <Save size={14} /> {mut.isPending ? 'Saving…' : 'Save'}
        </button>
      </div>

      <div className="bg-surface border border-white/5 rounded-card px-5 mb-5">
        <p className="text-xs text-white/30 pt-4 pb-1 uppercase tracking-wider">Download</p>
        <Field label="Default download path">
          <TextInput value={form.download_path ?? ''} onChange={(v) => set('download_path', v)} placeholder="~/Downloads/Ferroload" />
        </Field>
        <Field label="Max download speed (KB/s)">
          <TextInput value={String(form.max_download_speed_kbps ?? 0)} onChange={(v) => set('max_download_speed_kbps', Number(v))} placeholder="0 = unlimited" />
        </Field>
        <Field label="Max upload speed (KB/s)">
          <TextInput value={String(form.max_upload_speed_kbps ?? 0)} onChange={(v) => set('max_upload_speed_kbps', Number(v))} placeholder="0 = unlimited" />
        </Field>
      </div>

      <div className="bg-surface border border-white/5 rounded-card px-5 mb-5">
        <p className="text-xs text-white/30 pt-4 pb-1 uppercase tracking-wider">Connection</p>
        <Field label="Listen port">
          <TextInput value={String(form.listen_port ?? 6881)} onChange={(v) => set('listen_port', Number(v))} />
        </Field>
        <Field label="DHT enabled">
          <div className="flex justify-end"><Toggle value={Boolean(form.dht_enabled)} onChange={(v) => set('dht_enabled', v)} /></div>
        </Field>
      </div>

      <div className="bg-surface border border-white/5 rounded-card px-5 mb-5">
        <p className="text-xs text-white/30 pt-4 pb-1 uppercase tracking-wider">Bandwidth Schedule</p>
        <Field label="Enable schedule">
          <div className="flex justify-end"><Toggle value={Boolean(form.schedule_enabled)} onChange={(v) => set('schedule_enabled', v)} /></div>
        </Field>
        <Field label="Start time">
          <TextInput value={form.schedule_start ?? '08:00'} onChange={(v) => set('schedule_start', v)} placeholder="08:00" />
        </Field>
        <Field label="End time">
          <TextInput value={form.schedule_end ?? '22:00'} onChange={(v) => set('schedule_end', v)} placeholder="22:00" />
        </Field>
      </div>

      <div className="bg-surface border border-white/5 rounded-card px-5">
        <p className="text-xs text-white/30 pt-4 pb-1 uppercase tracking-wider">AI (Ollama)</p>
        <Field label="Ollama server URL">
          <TextInput value={form.ollama_url ?? 'http://localhost:11434'} onChange={(v) => set('ollama_url', v)} />
        </Field>
        <Field label="Model">
          <TextInput value={form.ollama_model ?? 'llama3'} onChange={(v) => set('ollama_model', v)} />
        </Field>
        <Field label="Enable AI features">
          <div className="flex justify-end pb-3"><Toggle value={Boolean(form.ai_enabled)} onChange={(v) => set('ai_enabled', v)} /></div>
        </Field>
      </div>
    </div>
  )
}
