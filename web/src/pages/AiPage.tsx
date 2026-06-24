import AiSidebar from '../components/AiSidebar'

export default function AiPage() {
  return (
    <div className="flex h-full">
      <div className="flex-1 p-6">
        <h1 className="text-lg font-semibold text-white mb-2">AI Assistant</h1>
        <p className="text-sm text-white/40">Chat with your local Ollama AI about your torrents.</p>
      </div>
      <AiSidebar />
    </div>
  )
}
