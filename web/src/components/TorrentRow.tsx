import { Pause, Play, Trash2, ChevronRight } from 'lucide-react'
import type { TorrentInfo } from '../types'
import { formatBytes, formatSpeed, formatEta } from '../lib/utils'
import { cn } from '../lib/utils'

interface Props {
  torrent: TorrentInfo
  onPause: () => void
  onResume: () => void
  onDelete: () => void
  onSelect: () => void
  isSelected: boolean
}

const STATUS_COLORS: Record<string, string> = {
  downloading: 'bg-teal/20 text-teal',
  seeding: 'bg-primary/20 text-primary',
  paused: 'bg-white/10 text-white/40',
  error: 'bg-danger/20 text-danger',
  checking: 'bg-yellow-500/20 text-yellow-400',
  queued: 'bg-white/10 text-white/40',
}

export default function TorrentRow({ torrent, onPause, onResume, onDelete, onSelect, isSelected }: Props) {
  const pct = Math.round(torrent.progress * 100)

  return (
    <div
      onClick={onSelect}
      className={cn(
        'grid grid-cols-[1fr_80px_90px_80px_80px_60px_80px_80px] gap-2 items-center px-4 py-3 cursor-pointer transition-colors border-b border-white/[0.04] hover:bg-white/[0.03]',
        isSelected && 'bg-primary/5 border-l-2 border-l-primary'
      )}
    >
      {/* Name + progress */}
      <div className="min-w-0">
        <div className="text-sm font-medium truncate text-white/90">{torrent.name}</div>
        <div className="mt-1 h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all', torrent.status === 'seeding' ? 'bg-primary' : 'bg-teal')}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Size */}
      <div className="text-xs text-white/50 text-right">{formatBytes(torrent.size)}</div>

      {/* Status */}
      <div className="flex justify-center">
        <span className={cn('text-xs px-2 py-0.5 rounded-full capitalize', STATUS_COLORS[torrent.status] ?? 'bg-white/10 text-white/40')}>
          {torrent.status}
        </span>
      </div>

      {/* Progress */}
      <div className="text-xs text-white/50 text-right">{pct}%</div>

      {/* Down speed */}
      <div className="text-xs text-teal text-right">{formatSpeed(torrent.speed_down)}</div>

      {/* Peers */}
      <div className="text-xs text-white/50 text-center">{torrent.peers}</div>

      {/* ETA */}
      <div className="text-xs text-white/50 text-right">{formatEta(torrent.eta_secs)}</div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
        {torrent.status === 'downloading' || torrent.status === 'queued' ? (
          <button onClick={onPause} className="p-1 rounded hover:bg-white/10 text-white/40 hover:text-white transition-colors">
            <Pause size={14} />
          </button>
        ) : (
          <button onClick={onResume} className="p-1 rounded hover:bg-white/10 text-white/40 hover:text-white transition-colors">
            <Play size={14} />
          </button>
        )}
        <button onClick={onDelete} className="p-1 rounded hover:bg-danger/20 text-white/40 hover:text-danger transition-colors">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}
