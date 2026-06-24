# Ferroload

> A fast, beautiful, open-source BitTorrent client with a local web dashboard. Built with Rust + React.

## Features
- 🚀 Rust-powered engine (librqbit) — fast and lightweight
- 🌐 Beautiful web dashboard served at localhost:7070
- 📡 Real-time speed graphs and peer information
- 🤖 Optional AI assistant via local Ollama
- 📰 RSS feed auto-downloader with regex filtering
- 🗂️ File priority management
- ⏱️ Bandwidth scheduler
- 🔒 100% local — no accounts, no telemetry, no ads
- 📦 Single binary — just download and run

## Quick Start

Download the binary for your platform from [Releases](../../releases), then run:

- **Linux/macOS:** `./ferroload`
- **Windows:** double-click `ferroload.exe`

Open your browser to `http://localhost:7070`

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `FERROLOAD_PORT` | `7070` | HTTP server port |
| `FERROLOAD_DATA_DIR` | `~/.ferroload` | Config/database directory |

## Build from Source

**Prerequisites:** Rust stable, Node.js 18+

```bash
git clone https://github.com/manoranjan2050/Ferroload
cd Ferroload
cd web && npm install && npm run build && cd ..
cargo build --release
./target/release/ferroload
```

## Tech Stack

- **Backend:** Rust, Actix-Web 4, librqbit, SQLite (sqlx), Tokio
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Recharts, Zustand

## License

MIT
