import { X, CheckCircle } from 'lucide-react'
import { useTorrentStore } from '../stores/torrentStore'
import { formatBytes, formatSpeed, formatDate } from '../lib/utils'
import { cn } from '../lib/utils'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { PieceStrategy, TorrentFile } from '../types'

type DetailTab = 'files' | 'peers' | 'trackers' | 'options'

// ── API helpers ───────────────────────────────────────────────────────────────

async function fetchPeers(id: string) {
  const r = await fetch(`/api/v1/torrents/${id}/peers`)
  const j = await r.json()
  return j.data ?? []
}

async function patchConfig(id: string, body: Record<string, unknown>) {
  await fetch(`/api/v1/torrents/${id}/config`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

async function patchPriority(id: string, fileIndex: number, priority: string) {
  await fetch(`/api/v1/torrents/${id}/priority`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ file_index: fileIndex, priority }),
  })
}

// ── Main component ────────────────────────────────────────────────────────────

export default function TorrentDetailPanel() {
  const { torrents, selectedId, setSelectedId } = useTorrentStore()
  const [tab, setTab] = useState<DetailTab>('files')
  const qc = useQueryClient()
  const torrent = torrents.find((t) => t.id === selectedId)

  if (!torrent) return null

  const pct = Math.round(torrent.progress * 100)
  const r = 36
  const circumference = 2 * Math.PI * r
  const dashOffset = circumference * (1 - torrent.progress)

  return (
    <div className="w-80 shrink-0 bg-surface border-l border-white/5 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between p-4 border-b border-white/5">
        <div className="flex-1 min-w-0 pr-2">
          <h3 className="font-semibold text-sm text-white truncate">{torrent.name}</h3>
          <p className="text-xs text-white/30 mt-0.5 font-mono truncate">{torrent.info_hash.slice(0, 20)}…</p>
        </div>
        <button onClick={() => setSelectedId(null)} className="text-white/30 hover:text-white transition-colors shrink-0">
          <X size={16} />
        </button>
      </div>

      {/* Progress ring + stats */}
      <div className="p-4 flex items-center gap-4 border-b border-white/5">
        <svg width="88" height="88" className="shrink-0">
          <circle cx="44" cy="44" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
          <circle cx="44" cy="44" r={r} fill="none"
            stroke={torrent.status === 'seeding' ? '#7c6af7' : '#22d3a5'}
            strokeWidth="6" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={dashOffset}
            transform="rotate(-90 44 44)" />
          <text x="44" y="44" textAnchor="middle" dominantBaseline="central" fill="white" fontSize="14" fontWeight="600">
            {pct}%
          </text>
        </svg>
        <div className="space-y-2 text-xs">
          <Row label="Size"  value={formatBytes(torrent.size)} />
          <Row label="Down"  value={formatSpeed(torrent.speed_down)} cls="text-teal" />
          <Row label="Up"    value={formatSpeed(torrent.speed_up)} cls="text-orange" />
          <Row label="Peers" value={String(torrent.peers)} />
          <Row label="Seeds" value={String(torrent.seeds)} />
          <Row label="Added" value={formatDate(torrent.added_at)} />
        </div>
      </div>

      {/* Metadata prefetch badge (Feature 8) */}
      {!torrent.metadata_ready && (
        <div className="mx-3 mt-2 px-3 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-xs text-yellow-400 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
          Fetching metadata from peers…
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-white/5 mt-1">
        {(['files', 'peers', 'trackers', 'options'] as DetailTab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={cn('flex-1 py-2 text-xs font-medium capitalize transition-colors',
              tab === t ? 'text-primary border-b-2 border-primary' : 'text-white/30 hover:text-white')}>
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-3">
        {tab === 'files' && <FilesTab torrentId={torrent.id} files={torrent.files} onRefetch={() => qc.invalidateQueries({ queryKey: ['torrents'] })} />}
        {tab === 'peers' && <PeersTab torrentId={torrent.id} />}
        {tab === 'trackers' && <TrackersTab trackers={torrent.trackers} />}
        {tab === 'options' && <OptionsTab torrentId={torrent.id} strategy={torrent.piece_strategy} superseeding={torrent.superseeding} />}
      </div>
    </div>
  )
}

// ── Tab: Files ────────────────────────────────────────────────────────────────

function FilesTab({ torrentId, files, onRefetch }: { torrentId: string; files: TorrentFile[]; onRefetch: () => void }) {
  const mut = useMutation({
    mutationFn: ({ idx, p }: { idx: number; p: string }) => patchPriority(torrentId, idx, p),
    onSuccess: onRefetch,
  })

  if (files.length === 0)
    return <p className="text-xs text-white/20 text-center py-6">No file info — metadata still loading</p>

  return (
    <div className="space-y-2">
      {files.map((f, i) => (
        <div key={i} className="text-xs">
          <div className="flex justify-between mb-0.5">
            <span className="truncate text-white/70 max-w-[140px]">{f.name}</span>
            <span className="text-white/30 shrink-0 ml-1">{formatBytes(f.size)}</span>
          </div>
          <div className="h-1 bg-white/5 rounded-full mb-1">
            <div className="h-full bg-primary rounded-full" style={{ width: `${f.progress * 100}%` }} />
          </div>
          {/* Feature 1: per-file priority */}
          <div className="flex gap-1">
            {(['high', 'normal', 'skip'] as const).map((p) => (
              <button key={p} onClick={() => mut.mutate({ idx: i, p })}
                className={cn('flex-1 py-0.5 rounded text-[10px] capitalize transition-colors',
                  f.priority === p ? 'bg-primary text-white' : 'bg-white/5 text-white/30 hover:bg-white/10')}>
                {p}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Tab: Peers (Features 2 + 4 + 7) ──────────────────────────────────────────

function PeersTab({ torrentId }: { torrentId: string }) {
  const { data: peers = [] } = useQuery({
    queryKey: ['peers', torrentId],
    queryFn: () => fetchPeers(torrentId),
    refetchInterval: 4000,
  })

  if (peers.length === 0)
    return <p className="text-xs text-white/20 text-center py-6">No peers connected yet</p>

  return (
    <div className="space-y-1">
      {peers.map((p: { ip: string; client: string; progress: number; speed_down: number; flags: string }, i: number) => (
        <div key={i} className="text-[11px] flex items-center gap-2 py-1 border-b border-white/5">
          <div className="flex-1 min-w-0">
            <p className="text-white/70 truncate">{p.ip}</p>
            <p className="text-white/30 truncate">{p.client}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-teal">{formatSpeed(p.speed_down)}</p>
            <p className="text-white/30 text-[10px]">{p.flags}</p>
          </div>
          <div className="w-10 shrink-0">
            <div className="h-1 bg-white/5 rounded-full">
              <div className="h-full bg-primary/60 rounded-full" style={{ width: `${p.progress * 100}%` }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Tab: Trackers (Feature 8) ─────────────────────────────────────────────────

function TrackersTab({ trackers }: { trackers: string[] }) {
  if (trackers.length === 0)
    return <p className="text-xs text-white/20 text-center py-6">No trackers (DHT only)</p>

  return (
    <div className="space-y-1">
      {trackers.map((url, i) => (
        <div key={i} className="text-[11px] py-2 border-b border-white/5">
          <p className="text-white/60 break-all">{url}</p>
          <p className="text-white/30 mt-0.5 flex items-center gap-1">
            <CheckCircle size={10} className="text-teal" /> Announced
          </p>
        </div>
      ))}
    </div>
  )
}

// ── Tab: Options (Features 1 + 3) ────────────────────────────────────────────

function OptionsTab({ torrentId, strategy, superseeding }: { torrentId: string; strategy: PieceStrategy; superseeding: boolean }) {
  const qc = useQueryClient()
  const mut = useMutation({
    mutationFn: (body: Record<string, unknown>) => patchConfig(torrentId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['torrents'] }),
  })

  return (
    <div className="space-y-4 pt-1">
      {/* Feature 1: Piece strategy */}
      <div>
        <p className="text-xs text-white/40 mb-2 uppercase tracking-wider">Piece Strategy</p>
        <div className="space-y-1">
          {([
            { value: 'rarest_first', label: 'Rarest First', hint: 'Best swarm health (default)' },
            { value: 'sequential',   label: 'Sequential',   hint: 'Stream video while downloading' },
            { value: 'random',       label: 'Random',       hint: 'Reduces hotspot load' },
          ] as { value: PieceStrategy; label: string; hint: string }[]).map((opt) => (
            <button key={opt.value}
              onClick={() => mut.mutate({ piece_strategy: opt.value })}
              className={cn('w-full text-left px-3 py-2 rounded-lg border text-xs transition-colors',
                strategy === opt.value
                  ? 'border-primary bg-primary/10 text-white'
                  : 'border-white/5 bg-white/3 text-white/50 hover:border-white/20 hover:text-white')}>
              <span className="font-medium">{opt.label}</span>
              <span className="text-white/30 ml-2">{opt.hint}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Feature 3: Superseeding */}
      <div className="flex items-center justify-between py-3 border-t border-white/5">
        <div>
          <p className="text-xs text-white/80">Superseeding</p>
          <p className="text-[10px] text-white/30 mt-0.5">Upload each piece only once to maximize swarm spread</p>
        </div>
        <button onClick={() => mut.mutate({ superseeding: !superseeding })}
          className={`relative w-10 h-6 rounded-full transition-colors ml-4 shrink-0 ${superseeding ? 'bg-primary' : 'bg-white/10'}`}>
          <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${superseeding ? 'translate-x-5' : 'translate-x-1'}`} />
        </button>
      </div>
    </div>
  )
}

// ── Small helpers ─────────────────────────────────────────────────────────────

function Row({ label, value, cls = 'text-white' }: { label: string; value: string; cls?: string }) {
  return (
    <div className="flex justify-between gap-8">
      <span className="text-white/40">{label}</span>
      <span className={cls}>{value}</span>
    </div>
  )
}
