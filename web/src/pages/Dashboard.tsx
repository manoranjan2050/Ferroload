import { useState, useEffect } from 'react'
import { Plus, ArrowDown, ArrowUp, Activity } from 'lucide-react'
import SpeedGraph from '../components/SpeedGraph'
import TorrentList from '../components/TorrentList'
import TorrentDetailPanel from '../components/TorrentDetailPanel'
import AddTorrentModal from '../components/AddTorrentModal'
import { useTorrentStore } from '../stores/torrentStore'
import { useStats } from '../hooks/useStats'
import { useWebSocket } from '../hooks/useWebSocket'
import { formatSpeed, formatBytes } from '../lib/utils'

export default function Dashboard() {
  const [showAdd, setShowAdd] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const { selectedId } = useTorrentStore()
  const { stats } = useStats()
  useWebSocket()

  // Global drag-and-drop
  useEffect(() => {
    const onDragOver = (e: DragEvent) => { e.preventDefault(); setDragActive(true) }
    const onDragLeave = () => setDragActive(false)
    const onDrop = (e: DragEvent) => { e.preventDefault(); setDragActive(false); setShowAdd(true) }
    window.addEventListener('dragover', onDragOver)
    window.addEventListener('dragleave', onDragLeave)
    window.addEventListener('drop', onDrop)
    return () => {
      window.removeEventListener('dragover', onDragOver)
      window.removeEventListener('dragleave', onDragLeave)
      window.removeEventListener('drop', onDrop)
    }
  }, [])

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 shrink-0">
          <h1 className="text-lg font-semibold text-white">Torrents</h1>
          <div className="flex items-center gap-6">
            {/* Stats */}
            <div className="flex items-center gap-1 text-sm text-teal">
              <ArrowDown size={14} />
              {formatSpeed(stats?.speed_down ?? 0)}
            </div>
            <div className="flex items-center gap-1 text-sm text-orange">
              <ArrowUp size={14} />
              {formatSpeed(stats?.speed_up ?? 0)}
            </div>
            <div className="flex items-center gap-1 text-sm text-white/40">
              <Activity size={14} />
              {stats?.active_torrents ?? 0} active
            </div>
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              <Plus size={16} /> Add Torrent
            </button>
          </div>
        </div>

        {/* Speed graph */}
        <div className="px-6 py-4 shrink-0">
          <SpeedGraph />
        </div>

        {/* Torrent list */}
        <div className="flex-1 overflow-y-auto bg-surface/50 mx-6 mb-4 rounded-card border border-white/5">
          <TorrentList />
        </div>
      </div>

      {/* Detail panel */}
      {selectedId && <TorrentDetailPanel />}

      {/* Add modal */}
      {showAdd && <AddTorrentModal onClose={() => setShowAdd(false)} />}

      {/* Drag overlay */}
      {dragActive && (
        <div className="fixed inset-0 z-40 bg-primary/10 border-4 border-primary/40 border-dashed flex items-center justify-center pointer-events-none">
          <div className="text-white text-xl font-semibold">Drop .torrent file here</div>
        </div>
      )}
    </div>
  )
}
