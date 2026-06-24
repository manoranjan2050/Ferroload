import { X, HardDrive, Users, Radio } from 'lucide-react'
import { useTorrentStore } from '../stores/torrentStore'
import { formatBytes, formatSpeed, formatDate } from '../lib/utils'
import { cn } from '../lib/utils'
import { useState } from 'react'

type DetailTab = 'files' | 'peers' | 'trackers'

export default function TorrentDetailPanel() {
  const { torrents, selectedId, setSelectedId } = useTorrentStore()
  const [tab, setTab] = useState<DetailTab>('files')
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
          <circle
            cx="44" cy="44" r={r} fill="none"
            stroke={torrent.status === 'seeding' ? '#7c6af7' : '#22d3a5'}
            strokeWidth="6" strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            transform="rotate(-90 44 44)"
          />
          <text x="44" y="44" textAnchor="middle" dominantBaseline="central" fill="white" fontSize="14" fontWeight="600">
            {pct}%
          </text>
        </svg>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between gap-8">
            <span className="text-white/40">Size</span>
            <span className="text-white">{formatBytes(torrent.size)}</span>
          </div>
          <div className="flex justify-between gap-8">
            <span className="text-white/40">Down</span>
            <span className="text-teal">{formatSpeed(torrent.speed_down)}</span>
          </div>
          <div className="flex justify-between gap-8">
            <span className="text-white/40">Up</span>
            <span className="text-orange">{formatSpeed(torrent.speed_up)}</span>
          </div>
          <div className="flex justify-between gap-8">
            <span className="text-white/40">Peers</span>
            <span className="text-white">{torrent.peers}</span>
          </div>
          <div className="flex justify-between gap-8">
            <span className="text-white/40">Added</span>
            <span className="text-white">{formatDate(torrent.added_at)}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/5">
        {(['files', 'peers', 'trackers'] as DetailTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'flex-1 py-2 text-xs font-medium capitalize transition-colors',
              tab === t ? 'text-primary border-b-2 border-primary' : 'text-white/30 hover:text-white'
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-3">
        {tab === 'files' && (
          <div className="space-y-2">
            {torrent.files.length === 0 ? (
              <p className="text-xs text-white/20 text-center py-6">No file info available</p>
            ) : torrent.files.map((f, i) => (
              <div key={i} className="text-xs">
                <div className="flex justify-between mb-0.5">
                  <span className="truncate text-white/70 max-w-[160px]">{f.name}</span>
                  <span className="text-white/30 shrink-0 ml-2">{formatBytes(f.size)}</span>
                </div>
                <div className="h-1 bg-white/5 rounded-full">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${f.progress * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
        {tab === 'peers' && (
          <p className="text-xs text-white/20 text-center py-6">Peer data available when downloading</p>
        )}
        {tab === 'trackers' && (
          <p className="text-xs text-white/20 text-center py-6">Tracker info coming soon</p>
        )}
      </div>
    </div>
  )
}
