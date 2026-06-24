<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=7c6af7&height=200&section=header&text=Ferroload&fontSize=80&fontColor=ffffff&animation=fadeIn&fontAlignY=38&desc=Fast%20%E2%80%A2%20Beautiful%20%E2%80%A2%20Open-Source%20BitTorrent%20Client&descAlignY=60&descColor=ffffff&descSize=20" width="100%"/>

<br/>

[![Rust](https://img.shields.io/badge/Rust-1.75+-F74C00?style=for-the-badge&logo=rust&logoColor=white)](https://www.rust-lang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-22d3a5?style=for-the-badge)](LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/manoranjan2050/Ferroload?style=for-the-badge&color=7c6af7&logo=github)](https://github.com/manoranjan2050/Ferroload/stargazers)

<br/>

<img src="https://readme-typing-svg.demolab.com?font=Inter&weight=600&size=22&pause=1000&color=7C6AF7&center=true&vCenter=true&width=600&lines=BitTorrent+Client+Built+with+Rust+%2B+React;Real-time+Speed+Graphs+%26+Dashboard;100%25+Local+%E2%80%94+No+Accounts%2C+No+Telemetry;Single+Binary+%E2%80%94+Download+and+Run!" alt="Typing SVG" />

<br/><br/>

</div>

---

## ✨ What is Ferroload?

**Ferroload** is a fully open-source, standalone BitTorrent client that runs as a **single Rust binary** and serves a gorgeous React web dashboard at `localhost:7070`. No Electron. No cloud. No ads. Just speed.

<br/>

<div align="center">

```
┌─────────────────────────────────────────────────────────────────┐
│                      FERROLOAD DASHBOARD                        │
│   ┌────────────────────────────────────────────────────────┐   │
│   │  ↓ 12.4 MB/s    ↑ 2.1 MB/s    ⚡ 8 Active    💾 48GB  │   │
│   └────────────────────────────────────────────────────────┘   │
│                                                                 │
│   ████████████████░░░░  Ubuntu 24.04 LTS    78%  11m left      │
│   ████████░░░░░░░░░░░░  Arch Linux ISO      42%  32m left      │
│   ████████████████████  Debian 12           Done  Seeding      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

</div>

<br/>

## 🚀 Features

<table>
<tr>
<td width="50%">

### ⚡ Performance
- **Rust-powered** engine via `librqbit`
- Async I/O with **Tokio** runtime
- Zero-cost abstractions — minimal CPU & RAM
- **WebSocket** real-time updates (no polling lag)

### 🎨 Beautiful UI
- Dark/Light mode toggle
- **Real-time speed graphs** (last 60 seconds)
- Drag-and-drop `.torrent` file support
- Slide-in torrent detail panel with file tree

</td>
<td width="50%">

### 🔒 Privacy First
- **100% local** — no accounts, no cloud
- No telemetry, no ads, no tracking
- Your data stays on your machine

### 🤖 AI Assistant *(Optional)*
- Chat with **local Ollama** models
- Auto-label torrents by type
- Ask about download stats naturally
- Silently hidden if Ollama not running

</td>
</tr>
</table>

<br/>

## 🎯 Feature Highlights

<div align="center">

| Feature | Status | Details |
|:---|:---:|:---|
| 📥 Magnet Links | ✅ | Paste and go |
| 📁 .torrent File Upload | ✅ | Drag & drop or file picker |
| 🌐 Torrent from URL | ✅ | Remote .torrent file fetching |
| ⏸️ Pause / Resume | ✅ | Per-torrent control |
| 📊 Real-time Speed Graph | ✅ | 60-second rolling window |
| 👥 Peer Information | ✅ | Per-torrent peer list |
| 📂 File Priority | ✅ | High / Normal / Skip per file |
| 📡 RSS Auto-downloader | ✅ | With regex filter support |
| ⚙️ Settings Panel | ✅ | Speed limits, port, schedule |
| 🤖 AI Chat (Ollama) | ✅ | Optional, fully local |
| 🔄 WebSocket Events | ✅ | Live torrent progress |
| 🗄️ SQLite History | ✅ | Persistent download records |
| 🌙 Dark / Light Mode | ✅ | System preference aware |
| 📦 Single Binary | ✅ | Frontend embedded at compile time |
| 🚀 Cross-platform CI | ✅ | Windows / macOS / Linux |

</div>

<br/>

## 🏗️ Architecture

```
ferroload/
├── 🦀 crates/
│   ├── ferroload-engine/     ← BitTorrent engine (librqbit wrapper)
│   │   ├── session.rs        ← Torrent session management
│   │   ├── models.rs         ← TorrentInfo, PeerInfo, Stats structs
│   │   └── events.rs         ← WebSocket event types
│   │
│   ├── ferroload-api/        ← Actix-Web REST API server
│   │   ├── routes/
│   │   │   ├── torrents.rs   ← Full torrent CRUD
│   │   │   ├── settings.rs   ← App configuration
│   │   │   ├── rss.rs        ← RSS feed management
│   │   │   ├── stats.rs      ← Global statistics
│   │   │   └── ai.rs         ← Ollama proxy
│   │   ├── ws.rs             ← WebSocket event broadcaster
│   │   ├── db.rs             ← SQLite + migrations
│   │   └── state.rs          ← Shared app state
│   │
│   └── ferroload-cli/        ← Binary entrypoint
│       ├── main.rs           ← Server startup + frontend serving
│       └── build.rs          ← Builds React, embeds into binary
│
└── ⚛️  web/
    ├── src/
    │   ├── pages/            ← Dashboard, RSS, Settings, AI
    │   ├── components/       ← TorrentList, SpeedGraph, Modals…
    │   ├── hooks/            ← useWebSocket, useTorrents, useStats
    │   ├── stores/           ← Zustand global state
    │   ├── api/              ← Type-safe API client layer
    │   └── types/            ← Shared TypeScript types
    └── (Vite + Tailwind + shadcn/ui + Recharts)
```

<br/>

## 🛠️ Tech Stack

<div align="center">

### Backend
![Rust](https://img.shields.io/badge/Rust-F74C00?style=flat-square&logo=rust&logoColor=white)
![Actix Web](https://img.shields.io/badge/Actix--Web-4-green?style=flat-square)
![Tokio](https://img.shields.io/badge/Tokio-async-blue?style=flat-square)
![SQLite](https://img.shields.io/badge/SQLite-sqlx-003B57?style=flat-square&logo=sqlite&logoColor=white)
![librqbit](https://img.shields.io/badge/librqbit-BitTorrent-red?style=flat-square)

### Frontend
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)
![Recharts](https://img.shields.io/badge/Recharts-graphs-ff6b6b?style=flat-square)
![Zustand](https://img.shields.io/badge/Zustand-state-orange?style=flat-square)

</div>

<br/>

## ⚡ Quick Start

### Download Binary *(Recommended)*

Head to [**Releases**](https://github.com/manoranjan2050/Ferroload/releases) and grab the binary for your platform:

| Platform | File |
|:---:|:---:|
| 🐧 Linux x86_64 | `ferroload-linux-x86_64` |
| 🪟 Windows x86_64 | `ferroload-windows-x86_64.exe` |
| 🍎 macOS Intel | `ferroload-macos-x86_64` |
| 🍎 macOS Apple Silicon | `ferroload-macos-arm64` |

```bash
# Linux / macOS
chmod +x ferroload-linux-x86_64
./ferroload-linux-x86_64

# Windows — just double-click ferroload-windows-x86_64.exe
```

Then open 👉 **[http://localhost:7070](http://localhost:7070)**

<br/>

## 🔨 Build from Source

**Prerequisites:** [Rust stable](https://rustup.rs/) · [Node.js 18+](https://nodejs.org/)

```bash
# 1. Clone the repo
git clone https://github.com/manoranjan2050/Ferroload.git
cd Ferroload

# 2. Build the React frontend
cd web
npm install
npm run build
cd ..

# 3. Build the Rust binary
cargo build --release

# 4. Run it!
./target/release/ferroload
```

> 🌐 Opens automatically at **http://localhost:7070**

<br/>

## ⚙️ Configuration

Ferroload is configured entirely through the web UI. You can also use environment variables:

| Variable | Default | Description |
|:---|:---:|:---|
| `FERROLOAD_PORT` | `7070` | HTTP server port |
| `FERROLOAD_DATA_DIR` | `~/.ferroload` | Config & database directory |

The SQLite database lives at `$FERROLOAD_DATA_DIR/ferroload.db`.  
Default download path is `~/Downloads/Ferroload`.

<br/>

## 🌐 REST API

All endpoints are under `/api/v1`. Full spec:

<details>
<summary><b>📥 Torrents</b></summary>

```
GET    /api/v1/torrents                 List all torrents
POST   /api/v1/torrents/magnet          Add via magnet link
POST   /api/v1/torrents/file            Add via .torrent file upload
GET    /api/v1/torrents/:id             Get torrent details
DELETE /api/v1/torrents/:id             Remove torrent
POST   /api/v1/torrents/:id/pause       Pause
POST   /api/v1/torrents/:id/resume      Resume
GET    /api/v1/torrents/:id/peers       Peer list
GET    /api/v1/torrents/:id/files       File list with progress
PATCH  /api/v1/torrents/:id/priority    Set file priorities
```
</details>

<details>
<summary><b>📊 Stats & Settings</b></summary>

```
GET    /api/v1/stats                    Global speed + session stats
GET    /api/v1/settings                 Get all settings
PUT    /api/v1/settings                 Update settings
```
</details>

<details>
<summary><b>📡 RSS & AI</b></summary>

```
GET    /api/v1/rss                      List RSS feeds
POST   /api/v1/rss                      Add RSS feed
DELETE /api/v1/rss/:id                  Remove feed
POST   /api/v1/rss/check               Force-check all feeds
GET    /api/v1/ai/status               Ollama availability check
POST   /api/v1/ai/chat                 Chat with Ollama
WS     /ws                             Real-time WebSocket events
```
</details>

<details>
<summary><b>🔌 WebSocket Events</b></summary>

```json
{ "type": "torrent_progress", "id": "...", "downloaded": 1234, "total": 9999, "speed_down": 512000, "speed_up": 128000, "peers": 12, "eta_secs": 300 }
{ "type": "torrent_added",    "torrent": { ... } }
{ "type": "torrent_finished", "id": "..." }
{ "type": "torrent_error",    "id": "...", "message": "..." }
{ "type": "global_stats",     "speed_down": 2048000, "speed_up": 512000 }
```
</details>

<br/>

## 🤖 AI Assistant (Optional)

Ferroload integrates with [**Ollama**](https://ollama.ai/) for a fully local AI assistant — no API keys, no internet required.

```bash
# Install Ollama (https://ollama.ai)
ollama pull llama3

# Start Ollama (usually auto-starts)
ollama serve
```

Once running, the AI sidebar will appear automatically in Ferroload. Ask it things like:

- *"Label all my torrents by type"*
- *"What's my total downloaded this week?"*
- *"Pause everything and show storage summary"*

> If Ollama isn't running, all AI features are **silently hidden** — no errors, no clutter.

<br/>

## 📦 Database Schema

<details>
<summary>View SQLite schema</summary>

```sql
CREATE TABLE torrents (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  info_hash    TEXT NOT NULL UNIQUE,
  magnet_uri   TEXT,
  torrent_file BLOB,
  download_path TEXT NOT NULL,
  added_at     INTEGER NOT NULL,
  label        TEXT,
  status       TEXT NOT NULL DEFAULT 'paused'
);

CREATE TABLE settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE rss_feeds (
  id           TEXT PRIMARY KEY,
  url          TEXT NOT NULL,
  name         TEXT NOT NULL,
  filter_regex TEXT,
  download_path TEXT,
  last_checked INTEGER,
  enabled      INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE download_history (
  id            TEXT PRIMARY KEY,
  torrent_id    TEXT,
  name          TEXT NOT NULL,
  info_hash     TEXT NOT NULL,
  completed_at  INTEGER NOT NULL,
  total_size    INTEGER,
  download_path TEXT
);
```
</details>

<br/>

## 🚀 CI/CD

Ferroload uses GitHub Actions to automatically build release binaries for all platforms when a version tag is pushed:

```bash
git tag v1.0.0
git push origin v1.0.0
# → Triggers build for Linux, Windows, macOS Intel, macOS ARM
# → Uploads binaries to GitHub Releases automatically
```

<br/>

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

```bash
git clone https://github.com/manoranjan2050/Ferroload.git
cd Ferroload

# Backend development
cargo check
cargo clippy

# Frontend development
cd web && npm install && npm run dev
# (proxies API calls to localhost:7070 — run the backend separately)
```

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Commit changes: `git commit -m 'feat: add my feature'`
4. Push: `git push origin feat/my-feature`
5. Open a Pull Request

<br/>

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

<br/>

<div align="center">

**Built with ❤️ using Rust + React**

<img src="https://capsule-render.vercel.app/api?type=waving&color=7c6af7&height=100&section=footer" width="100%"/>

</div>
