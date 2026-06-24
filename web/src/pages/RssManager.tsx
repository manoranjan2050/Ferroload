import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listFeeds, addFeed, deleteFeed, checkFeeds } from '../api/rss'
import { Plus, Trash2, RefreshCw, Rss } from 'lucide-react'
import { formatDate } from '../lib/utils'

export default function RssManager() {
  const qc = useQueryClient()
  const { data: feeds = [] } = useQuery({ queryKey: ['rss'], queryFn: listFeeds })
  const addMut = useMutation({ mutationFn: addFeed, onSuccess: () => { qc.invalidateQueries({ queryKey: ['rss'] }); setForm({ url: '', name: '', filter_regex: '' }) } })
  const delMut = useMutation({ mutationFn: deleteFeed, onSuccess: () => qc.invalidateQueries({ queryKey: ['rss'] }) })
  const checkMut = useMutation({ mutationFn: checkFeeds, onSuccess: () => qc.invalidateQueries({ queryKey: ['rss'] }) })

  const [form, setForm] = useState({ url: '', name: '', filter_regex: '' })

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold text-white">RSS Feeds</h1>
        <button
          onClick={() => checkMut.mutate()}
          disabled={checkMut.isPending}
          className="flex items-center gap-2 text-sm bg-white/5 hover:bg-white/10 text-white/60 hover:text-white px-4 py-2 rounded-lg transition-colors"
        >
          <RefreshCw size={14} className={checkMut.isPending ? 'animate-spin' : ''} />
          Check Now
        </button>
      </div>

      {/* Add feed form */}
      <div className="bg-surface border border-white/5 rounded-card p-4 mb-6 space-y-3">
        <h2 className="text-sm font-medium text-white/60">Add Feed</h2>
        <div className="grid grid-cols-2 gap-3">
          <input value={form.url} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
            placeholder="Feed URL" className="input col-span-2 bg-background border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-primary" />
          <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Name" className="bg-background border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-primary" />
          <input value={form.filter_regex} onChange={(e) => setForm((f) => ({ ...f, filter_regex: e.target.value }))}
            placeholder="Filter regex (optional)" className="bg-background border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-primary" />
        </div>
        <button
          onClick={() => addMut.mutate({ url: form.url, name: form.name, filter_regex: form.filter_regex || undefined })}
          disabled={!form.url || !form.name || addMut.isPending}
          className="flex items-center gap-2 bg-primary hover:bg-primary-hover disabled:opacity-40 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={14} /> Add Feed
        </button>
      </div>

      {/* Feed list */}
      {feeds.length === 0 ? (
        <div className="text-center py-16 text-white/20">
          <Rss size={40} strokeWidth={1} className="mx-auto mb-3" />
          <p className="text-sm">No RSS feeds configured</p>
        </div>
      ) : (
        <div className="space-y-2">
          {feeds.map((feed) => (
            <div key={feed.id} className="bg-surface border border-white/5 rounded-card px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">{feed.name}</p>
                <p className="text-xs text-white/30 mt-0.5">{feed.url}</p>
                {feed.filter_regex && <p className="text-xs text-primary/60 mt-0.5">Filter: {feed.filter_regex}</p>}
                {feed.last_checked && <p className="text-xs text-white/20 mt-0.5">Last checked: {formatDate(feed.last_checked)}</p>}
              </div>
              <button onClick={() => delMut.mutate(feed.id)} className="p-2 text-white/20 hover:text-danger hover:bg-danger/10 rounded-lg transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
