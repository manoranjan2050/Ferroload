import { useEffect, useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { getSettings, updateSettings } from '../api/settings'
import type { Settings } from '../types'
import { Save, Zap, Network, HardDrive, Radio, Shield, Clock, Bot } from 'lucide-react'

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="bg-surface border border-white/5 rounded-2xl px-5 mb-4">
      <div className="flex items-center gap-2 pt-4 pb-2">
        <Icon size={14} className="text-primary" />
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">{title}</p>
      </div>
      {children}
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
      <div>
        <p className="text-sm text-white/80">{label}</p>
        {hint && <p className="text-xs text-white/30 mt-0.5">{hint}</p>}
      </div>
      <div className="ml-4 shrink-0">{children}</div>
    </div>
  )
}

function TextInput({ value, onChange, placeholder, width = 'w-44' }: { value: string; onChange: (v: string) => void; placeholder?: string; width?: string }) {
  return (
    <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      className={`${width} bg-background border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-primary`} />
  )
}

function NumberInput({ value, onChange, min = 0, placeholder }: { value: number; onChange: (v: number) => void; min?: number; placeholder?: string }) {
  return (
    <input type="number" min={min} value={value} onChange={(e) => onChange(Number(e.target.value))} placeholder={placeholder}
      className="w-28 bg-background border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-primary text-right" />
  )
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!value)}
      className={`relative w-10 h-6 rounded-full transition-colors ${value ? 'bg-primary' : 'bg-white/10'}`}>
      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-1'}`} />
    </button>
  )
}

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { label: string; value: string }[] }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className="w-44 bg-background border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-primary">
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
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

  const saved = mut.isSuccess && !mut.isPending

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-white">Settings</h1>
          <p className="text-xs text-white/30 mt-0.5">Changes take effect immediately after saving</p>
        </div>
        <button onClick={save} disabled={mut.isPending}
          className="flex items-center gap-2 bg-primary hover:bg-primary/80 disabled:opacity-40 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          <Save size={14} /> {mut.isPending ? 'Saving…' : saved ? 'Saved ✓' : 'Save'}
        </button>
      </div>

      {/* Download */}
      <Section title="Download" icon={HardDrive}>
        <Field label="Default download path">
          <TextInput width="w-56" value={form.download_path ?? ''} onChange={(v) => set('download_path', v)} placeholder="~/Downloads/Ferroload" />
        </Field>
        <Field label="Max download speed" hint="0 = unlimited">
          <div className="flex items-center gap-2">
            <NumberInput value={form.max_download_speed_kbps ?? 0} onChange={(v) => set('max_download_speed_kbps', v)} />
            <span className="text-xs text-white/30">KB/s</span>
          </div>
        </Field>
      </Section>

      {/* Feature 5 – Upload throttle */}
      <Section title="Upload Throttle" icon={Zap}>
        <Field label="Max upload speed" hint="Caps upload so download isn't starved on asymmetric connections. 0 = unlimited.">
          <div className="flex items-center gap-2">
            <NumberInput value={form.max_upload_speed_kbps ?? 0} onChange={(v) => set('max_upload_speed_kbps', v)} />
            <span className="text-xs text-white/30">KB/s</span>
          </div>
        </Field>
      </Section>

      {/* Feature 2 – Connection pool */}
      <Section title="Connection Pool" icon={Network}>
        <Field label="Max connections per torrent" hint="50–200. More = faster discovery & download.">
          <NumberInput value={form.max_connections_per_torrent ?? 80} min={1} onChange={(v) => set('max_connections_per_torrent', v)} />
        </Field>
        <Field label="Max total connections" hint="Global cap across all torrents.">
          <NumberInput value={form.max_total_connections ?? 500} min={1} onChange={(v) => set('max_total_connections', v)} />
        </Field>
        <Field label="Listen port">
          <NumberInput value={form.listen_port ?? 6881} min={1024} onChange={(v) => set('listen_port', v)} />
        </Field>
      </Section>

      {/* Feature 4 – DHT + PEX + LSD */}
      <Section title="Peer Discovery (DHT · PEX · LSD)" icon={Radio}>
        <Field label="DHT (Distributed Hash Table)" hint="Find peers without a tracker. Uses bootstrap nodes.">
          <Toggle value={Boolean(form.dht_enabled ?? true)} onChange={(v) => set('dht_enabled', v)} />
        </Field>
        <Field label="PEX (Peer Exchange)" hint="Peers share their peer lists with each other.">
          <Toggle value={Boolean(form.pex_enabled ?? true)} onChange={(v) => set('pex_enabled', v)} />
        </Field>
        <Field label="LSD (Local Service Discovery)" hint="Find peers on your LAN via multicast.">
          <Toggle value={Boolean(form.lsd_enabled ?? true)} onChange={(v) => set('lsd_enabled', v)} />
        </Field>
      </Section>

      {/* Feature 6 – Disk write buffer */}
      <Section title="Disk Write Buffer" icon={HardDrive}>
        <Field label="Write buffer size" hint="Accumulate pieces in RAM then flush in large sequential blocks. Avoids HDD random-write thrash.">
          <div className="flex items-center gap-2">
            <NumberInput value={form.write_buffer_mb ?? 4} min={1} onChange={(v) => set('write_buffer_mb', v)} />
            <span className="text-xs text-white/30">MB</span>
          </div>
        </Field>
      </Section>

      {/* Feature 7 – uTP */}
      <Section title="Transport Protocol" icon={Shield}>
        <Field label="Enable uTP (Micro Transport Protocol)" hint="Adaptive congestion control — Ferroload yields to other traffic automatically. Recommended on.">
          <Toggle value={Boolean(form.utp_enabled ?? true)} onChange={(v) => set('utp_enabled', v)} />
        </Field>
      </Section>

      {/* Bandwidth schedule */}
      <Section title="Bandwidth Schedule" icon={Clock}>
        <Field label="Enable schedule" hint="Limit speeds during off-hours.">
          <Toggle value={Boolean(form.schedule_enabled)} onChange={(v) => set('schedule_enabled', v)} />
        </Field>
        <Field label="Start time">
          <TextInput value={form.schedule_start ?? '08:00'} onChange={(v) => set('schedule_start', v)} placeholder="08:00" />
        </Field>
        <Field label="End time">
          <TextInput value={form.schedule_end ?? '22:00'} onChange={(v) => set('schedule_end', v)} placeholder="22:00" />
        </Field>
      </Section>

      {/* AI */}
      <Section title="AI Assistant (Ollama)" icon={Bot}>
        <Field label="Ollama server URL">
          <TextInput width="w-56" value={form.ollama_url ?? 'http://localhost:11434'} onChange={(v) => set('ollama_url', v)} />
        </Field>
        <Field label="Model">
          <TextInput value={form.ollama_model ?? 'llama3'} onChange={(v) => set('ollama_model', v)} />
        </Field>
        <Field label="Enable AI features">
          <Toggle value={Boolean(form.ai_enabled)} onChange={(v) => set('ai_enabled', v)} />
        </Field>
      </Section>
    </div>
  )
}
