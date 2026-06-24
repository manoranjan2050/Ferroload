import { useState, useRef, useEffect } from 'react'
import { Send, Bot, X } from 'lucide-react'
import { useSettingsStore } from '../stores/settingsStore'

interface Message { role: 'user' | 'assistant'; content: string }

export default function AiSidebar({ onClose }: { onClose?: () => void }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function send() {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }])
    setLoading(true)
    try {
      const res = await fetch('/api/v1/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg }),
      })
      const json = await res.json()
      const reply = json.data?.response ?? 'No response'
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }])
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Error communicating with Ollama.' }])
    } finally {
      setLoading(false)
    }
  }

  const suggestions = [
    'Label all my torrents by type',
    "What's my total downloaded?",
    'Show storage summary',
  ]

  return (
    <div className="w-72 shrink-0 bg-surface border-l border-white/5 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Bot size={16} className="text-primary" />
          <span className="text-sm font-medium">AI Assistant</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
            <X size={16} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <div className="space-y-2">
            <p className="text-xs text-white/30 text-center py-4">Ask about your torrents</p>
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => setInput(s)}
                className="w-full text-left text-xs bg-white/5 hover:bg-white/10 px-3 py-2 rounded-lg text-white/60 hover:text-white transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[90%] text-xs px-3 py-2 rounded-lg leading-relaxed ${
              m.role === 'user' ? 'bg-primary text-white' : 'bg-white/5 text-white/80'
            }`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white/5 text-white/40 text-xs px-3 py-2 rounded-lg">Thinking…</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-3 border-t border-white/5">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder="Ask anything…"
            className="flex-1 bg-background border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none focus:border-primary"
          />
          <button
            onClick={send}
            disabled={!input.trim() || loading}
            className="p-2 bg-primary hover:bg-primary-hover disabled:opacity-40 rounded-lg transition-colors"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
