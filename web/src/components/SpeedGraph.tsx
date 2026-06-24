import { useEffect, useRef, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useTorrentStore } from '../stores/torrentStore'
import { formatSpeed } from '../lib/utils'

interface DataPoint { time: number; down: number; up: number }

export default function SpeedGraph() {
  const stats = useTorrentStore((s) => s.stats)
  const [data, setData] = useState<DataPoint[]>([])

  useEffect(() => {
    if (!stats) return
    setData((prev) => {
      const next = [...prev, { time: Date.now(), down: stats.speed_down, up: stats.speed_up }]
      return next.slice(-60)
    })
  }, [stats])

  return (
    <div className="bg-surface border border-white/5 rounded-card p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-white/60">Network Speed</span>
        <div className="flex gap-4 text-xs">
          <span className="flex items-center gap-1 text-teal">
            <span className="w-2 h-2 rounded-full bg-teal inline-block" /> DL {formatSpeed(stats?.speed_down ?? 0)}
          </span>
          <span className="flex items-center gap-1 text-orange">
            <span className="w-2 h-2 rounded-full bg-orange inline-block" /> UL {formatSpeed(stats?.speed_up ?? 0)}
          </span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={100}>
        <LineChart data={data}>
          <XAxis dataKey="time" hide />
          <YAxis hide />
          <Tooltip
            formatter={(val: number) => formatSpeed(val)}
            contentStyle={{ background: '#1a1a1f', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, fontSize: 12 }}
            labelStyle={{ display: 'none' }}
          />
          <Line type="monotone" dataKey="down" stroke="#22d3a5" strokeWidth={2} dot={false} isAnimationActive={false} />
          <Line type="monotone" dataKey="up" stroke="#f97316" strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
