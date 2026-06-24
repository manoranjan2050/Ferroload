import { useState, useRef } from 'react'
import { X, Link, Upload, Globe } from 'lucide-react'
import { addMagnet, addTorrentFile } from '../api/torrents'
import { useQueryClient } from '@tanstack/react-query'
import { cn } from '../lib/utils'

interface Props { onClose: () => void }

type Tab = 'magnet' | 'file' | 'url'

export default function AddTorrentModal({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('magnet')
  const [magnet, setMagnet] = useState('')
  const [url, setUrl] = useState('')
  const [label, setLabel] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const qc = useQueryClient()

  async function submit() {
    setError('')
    setLoading(true)
    try {
      if (tab === 'magnet') {
        await addMagnet(magnet, undefined, label || undefined)
      } else if (tab === 'url') {
        const res = await fetch(url)
        const blob = await res.blob()
        const file = new File([blob], 'remote.torrent')
        await addTorrentFile(file, undefined, label || undefined)
      }
      qc.invalidateQueries({ queryKey: ['torrents'] })
      onClose()
    } catch (e: any) {
      setError(e.message ?? 'Failed to add torrent')
    } finally {
      setLoading(false)
    }
  }

  async function handleFile(file: File) {
    setLoading(true)
    setError('')
    try {
      await addTorrentFile(file, undefined, label || undefined)
      qc.invalidateQueries({ queryKey: ['torrents'] })
      onClose()
    } catch (e: any) {
      setError(e.message ?? 'Failed to add torrent')
    } finally {
      setLoading(false)
    }
  }

  const tabs: { id: Tab; icon: any; label: string }[] = [
    { id: 'magnet', icon: Link, label: 'Magnet' },
    { id: 'file', icon: Upload, label: 'File' },
    { id: 'url', icon: Globe, label: 'URL' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-surface border border-white/10 rounded-card w-full max-w-lg mx-4 shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <h2 className="font-semibold text-white">Add Torrent</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-4 pb-0">
          {tabs.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                tab === id ? 'bg-primary text-white' : 'text-white/40 hover:text-white hover:bg-white/5'
              )}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        <div className="p-5 space-y-4">
          {tab === 'magnet' && (
            <textarea
              value={magnet}
              onChange={(e) => setMagnet(e.target.value)}
              placeholder="magnet:?xt=urn:btih:..."
              rows={3}
              className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-primary resize-none"
            />
          )}

          {tab === 'file' && (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
              onClick={() => fileRef.current?.click()}
              className={cn(
                'border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors',
                dragOver ? 'border-primary bg-primary/5' : 'border-white/10 hover:border-white/20'
              )}
            >
              <Upload size={32} className="mx-auto mb-3 text-white/20" />
              <p className="text-sm text-white/40">Drop .torrent file or click to browse</p>
              <input ref={fileRef} type="file" accept=".torrent" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
            </div>
          )}

          {tab === 'url' && (
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/file.torrent"
              className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-primary"
            />
          )}

          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Label (optional)"
            className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-primary"
          />

          {error && <p className="text-sm text-danger">{error}</p>}

          {tab !== 'file' && (
            <button
              onClick={submit}
              disabled={loading || (tab === 'magnet' ? !magnet : !url)}
              className="w-full bg-primary hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg transition-colors"
            >
              {loading ? 'Adding…' : 'Add Torrent'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
