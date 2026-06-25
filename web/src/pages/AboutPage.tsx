export default function AboutPage() {
  return (
    <div className="p-6 max-w-3xl mx-auto space-y-8 text-white/90">

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-primary/30">
          F
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Ferroload</h1>
          <p className="text-white/50 text-sm">Open-source BitTorrent client · v0.1.0</p>
        </div>
      </div>

      {/* Developer */}
      <section className="bg-surface rounded-2xl p-5 border border-white/5 space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-primary">Developer</h2>
        <div className="flex items-center gap-4">
          <img
            src="https://github.com/manoranjan2050.png"
            alt="manoranjan2050"
            className="w-14 h-14 rounded-full border-2 border-primary/40"
          />
          <div>
            <p className="font-semibold text-white text-lg">Manoranjan</p>
            <p className="text-white/50 text-sm">@manoranjan2050</p>
            <div className="flex gap-3 mt-1">
              <a
                href="https://github.com/manoranjan2050"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-primary hover:underline"
              >
                GitHub
              </a>
              <a
                href="mailto:manoranjan2050@live.com"
                className="text-xs text-primary hover:underline"
              >
                manoranjan2050@live.com
              </a>
            </div>
          </div>
        </div>
        <p className="text-white/60 text-sm leading-relaxed">
          Ferroload is a personal open-source project. Built for fun, learning, and the love of fast downloads.
          Contributions, issues, and pull requests are very welcome on GitHub.
        </p>
      </section>

      {/* Declaration */}
      <section className="bg-surface rounded-2xl p-5 border border-white/5 space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-primary">Declaration</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          Ferroload is a general-purpose BitTorrent client. It does not host, distribute, or endorse any
          copyrighted content. The BitTorrent protocol is a legitimate peer-to-peer file transfer technology
          used by many open-source projects, Linux distributions, and content creators.
        </p>
        <p className="text-white/60 text-sm leading-relaxed">
          Users are solely responsible for the content they choose to download or upload. Always respect
          the intellectual property rights of content creators and comply with the laws of your jurisdiction.
        </p>
        <p className="text-white/60 text-sm leading-relaxed">
          This software is provided "as-is" without warranty of any kind. See the MIT License for full terms.
        </p>
      </section>

      {/* Open Source Credits */}
      <section className="bg-surface rounded-2xl p-5 border border-white/5 space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-primary">Open Source Credits</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {credits.map((c) => (
            <CreditRow key={c.name} {...c} />
          ))}
        </div>
      </section>

      {/* License */}
      <section className="bg-surface rounded-2xl p-5 border border-white/5 space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-primary">License</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          Ferroload is released under the{' '}
          <span className="text-white font-medium">MIT License</span>.
          Free to use, modify, and distribute. Copyright © 2025 Manoranjan.
        </p>
        <a
          href="https://github.com/manoranjan2050/Ferroload"
          target="_blank"
          rel="noreferrer"
          className="inline-block mt-1 text-xs text-primary hover:underline"
        >
          View source on GitHub →
        </a>
      </section>

      <p className="text-center text-white/20 text-xs pb-4">
        Made with ♥ in Rust + React
      </p>
    </div>
  )
}

function CreditRow({ name, version, license, role }: { name: string; version: string; license: string; role: string }) {
  return (
    <div className="flex items-start gap-2 p-2 rounded-lg hover:bg-white/5 transition-colors">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{name}</p>
        <p className="text-xs text-white/40">{role}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-xs text-white/50">{version}</p>
        <p className="text-xs text-primary/70">{license}</p>
      </div>
    </div>
  )
}

const credits = [
  // Rust backend
  { name: 'Rust', version: 'v1.78+', license: 'MIT / Apache-2.0', role: 'Systems language (backend)' },
  { name: 'Actix-Web', version: 'v4', license: 'MIT / Apache-2.0', role: 'HTTP & WebSocket server' },
  { name: 'Tokio', version: 'v1', license: 'MIT', role: 'Async runtime' },
  { name: 'SQLx', version: 'v0.7', license: 'MIT / Apache-2.0', role: 'SQLite database' },
  { name: 'serde / serde_json', version: 'v1', license: 'MIT / Apache-2.0', role: 'Serialization' },
  { name: 'serde_bencode', version: 'v0.2', license: 'MIT', role: '.torrent file parsing' },
  { name: 'sha1', version: 'v0.10', license: 'MIT / Apache-2.0', role: 'Info hash computation' },
  { name: 'anyhow', version: 'v1', license: 'MIT / Apache-2.0', role: 'Error handling' },
  { name: 'tracing', version: 'v0.1', license: 'MIT', role: 'Structured logging' },
  { name: 'uuid', version: 'v1', license: 'MIT / Apache-2.0', role: 'Unique IDs' },
  { name: 'include_dir', version: 'v0.7', license: 'MIT', role: 'Embed frontend into binary' },
  { name: 'reqwest', version: 'v0.12', license: 'MIT / Apache-2.0', role: 'HTTP client (AI/RSS)' },
  { name: 'chrono', version: 'v0.4', license: 'MIT / Apache-2.0', role: 'Date & time' },
  // Frontend
  { name: 'React', version: 'v18', license: 'MIT', role: 'UI framework' },
  { name: 'TypeScript', version: 'v5', license: 'Apache-2.0', role: 'Type-safe JavaScript' },
  { name: 'Vite', version: 'v5', license: 'MIT', role: 'Frontend build tool' },
  { name: 'Tailwind CSS', version: 'v3', license: 'MIT', role: 'Utility CSS framework' },
  { name: 'TanStack Query', version: 'v5', license: 'MIT', role: 'Server state / data fetching' },
  { name: 'Zustand', version: 'v4', license: 'MIT', role: 'Global UI state' },
  { name: 'Recharts', version: 'v2', license: 'MIT', role: 'Speed graphs' },
  { name: 'React Router', version: 'v6', license: 'MIT', role: 'Client-side routing' },
  { name: 'Lucide React', version: 'latest', license: 'ISC', role: 'Icon set' },
]
