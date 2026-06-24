import TorrentRow from './TorrentRow'
import { useTorrentStore } from '../stores/torrentStore'
import { useTorrents } from '../hooks/useTorrents'
import { Download } from 'lucide-react'

export default function TorrentList() {
  const { torrents, pause, resume, remove } = useTorrents()
  const { selectedId, setSelectedId } = useTorrentStore()

  if (torrents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-white/20">
        <Download size={48} strokeWidth={1} />
        <p className="mt-4 text-sm">No torrents yet. Add one to get started.</p>
      </div>
    )
  }

  return (
    <div>
      {/* Header row */}
      <div className="grid grid-cols-[1fr_80px_90px_80px_80px_60px_80px_80px] gap-2 px-4 py-2 text-xs text-white/30 font-medium border-b border-white/5">
        <span>Name</span>
        <span className="text-right">Size</span>
        <span className="text-center">Status</span>
        <span className="text-right">Done</span>
        <span className="text-right">↓ Speed</span>
        <span className="text-center">Peers</span>
        <span className="text-right">ETA</span>
        <span />
      </div>
      {torrents.map((t) => (
        <TorrentRow
          key={t.id}
          torrent={t}
          isSelected={selectedId === t.id}
          onSelect={() => setSelectedId(selectedId === t.id ? null : t.id)}
          onPause={() => pause.mutate(t.id)}
          onResume={() => resume.mutate(t.id)}
          onDelete={() => remove.mutate(t.id)}
        />
      ))}
    </div>
  )
}
