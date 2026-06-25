# Ferroload — Troubleshooting Guide

This guide covers the most common issues users encounter. Jump to the section that matches your problem.

---

## Contents

1. [App won't start / port already in use](#1-app-wont-start--port-already-in-use)
2. [Blank white screen in browser](#2-blank-white-screen-in-browser)
3. [Torrents disappear after restart](#3-torrents-disappear-after-restart)
4. [No peers / stuck at 0 peers](#4-no-peers--stuck-at-0-peers)
5. [Download speed is very slow](#5-download-speed-is-very-slow)
6. [Settings changes don't take effect](#6-settings-changes-dont-take-effect)
7. [Build fails on Windows](#7-build-fails-on-windows)
8. [Build fails — Rust errors](#8-build-fails--rust-errors)
9. [Build fails — npm / frontend errors](#9-build-fails--npm--frontend-errors)
10. [ferroload.exe is locked / can't rebuild](#10-ferroloadexe-is-locked--cant-rebuild)
11. [AI Chat not showing up](#11-ai-chat-not-showing-up)
12. [RSS feed not auto-downloading](#12-rss-feed-not-auto-downloading)
13. [High CPU usage](#13-high-cpu-usage)
14. [Database errors / corrupted state](#14-database-errors--corrupted-state)
15. [WebSocket disconnects frequently](#15-websocket-disconnects-frequently)
16. [How to change the default port](#16-how-to-change-the-default-port)
17. [How to change the download folder](#17-how-to-change-the-download-folder)
18. [How to reset all settings](#18-how-to-reset-all-settings)

---

## 1. App won't start / port already in use

**Symptom:** Terminal shows `Address already in use (os error 98)` or `Only one usage of each socket address`.

**Cause:** Another process is already listening on port 7070, or a previous Ferroload instance is still running.

**Fix — find and kill the conflicting process:**

```bash
# Windows
netstat -ano | findstr :7070
taskkill /PID <PID> /F

# Linux / macOS
lsof -i :7070
kill -9 <PID>
```

**Fix — use a different port:**

```bash
# Windows (cmd)
set FERROLOAD_PORT=8080 && ferroload.exe

# Windows (PowerShell)
$env:FERROLOAD_PORT = "8080"; .\ferroload.exe

# Linux / macOS
FERROLOAD_PORT=8080 ./ferroload
```

---

## 2. Blank white screen in browser

**Symptom:** `http://localhost:7070` loads but shows nothing.

**Cause A:** Frontend was never built. The binary embeds the React build at compile time — if `web/dist` was empty when you ran `cargo build`, the binary has no UI.

**Fix:**
```bash
cd web
npm install
npm run build
cd ..
cargo build --release
```

**Cause B:** Browser cache serving a broken build.

**Fix:** Hard-refresh with `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (macOS).

**Cause C:** JavaScript error in the console.

**Fix:** Open browser DevTools (`F12`) → Console tab. If you see a red error, copy it and open a GitHub issue.

---

## 3. Torrents disappear after restart

**Symptom:** All torrents are gone every time the app restarts.

**Cause:** The engine stores torrents in memory. On a clean start, it restores them from the SQLite database. If the DB is missing or in a different location, restore fails silently.

**Check the database location:**
```bash
# Windows — default location
%USERPROFILE%\.ferroload\ferroload.db

# Linux / macOS — default location
~/.ferroload/ferroload.db
```

**If the DB file is missing:** the first run creates it fresh — this is normal. Torrents added before a crash may be lost if they were never saved to the DB. From v0.2+ every `add_magnet` / `add_torrent_file` call persists to DB immediately.

**If you moved the binary:** make sure `FERROLOAD_DATA_DIR` points to your existing DB:
```bash
FERROLOAD_DATA_DIR=/path/to/your/data ./ferroload
```

---

## 4. No peers / stuck at 0 peers

**Symptom:** Torrent stays at 0 peers, no download starts.

**Possible causes and fixes:**

| Cause | Fix |
|---|---|
| Firewall blocking incoming connections | Allow ferroload.exe through Windows Firewall, or open your router port (default 6881 TCP+UDP) |
| Tracker announce failed | Check the Trackers tab in the detail panel — trackers should show "Announced" |
| DHT not bootstrapped yet | Wait 10–15 seconds after adding the torrent; DHT ramps up from 0 to 256 nodes |
| Torrent is very old / unpopular | Try a more popular torrent to verify connectivity |
| ISP blocking BitTorrent | Enable uTP in Settings → Transport Protocol; uTP traffic looks like normal UDP |
| VPN interference | Some VPNs block UDP — disable VPN or use a VPN with port forwarding |

---

## 5. Download speed is very slow

**Symptom:** Speeds are well below your internet connection capacity.

**Checklist:**

1. **Upload is saturating download** — if upload is maxed, TCP ACKs get dropped and download slows. Set an upload limit in Settings → Upload Throttle (e.g. 80% of your upload capacity).

2. **Too few connections** — increase max connections per torrent in Settings → Connection Pool (try 150–200 for fast connections).

3. **Piece strategy** — for sequential streaming, the Sequential strategy is fine. For raw speed, use Rarest First — it improves swarm diversity.

4. **Disk is the bottleneck** — if you're on an HDD, the disk can't keep up with random writes. Increase the Write Buffer in Settings → Disk Write Buffer (try 16–32 MB on HDD).

5. **uTP throttling itself** — uTP is designed to yield to other traffic. If you want maximum BitTorrent speed regardless of other apps, disable uTP in Settings.

6. **ISP throttling** — uTP helps bypass some throttling. Also try a different tracker or add a private tracker.

---

## 6. Settings changes don't take effect

**Symptom:** You changed a setting (e.g. max connections) but behavior didn't change.

**Fix:** Settings are applied immediately when you click Save in the Settings page. If you changed a setting via the API directly (e.g. with curl), restart the app so it re-reads from DB on startup.

**Verify current engine config** — check the browser console for WebSocket messages; `global_stats` events include the live connection count.

---

## 7. Build fails on Windows

**Symptom:** `ferroload.bat` or `ferroload-rebuild.bat` exits with an error.

**Common issues:**

**Rust not installed:**
```
'cargo' is not recognized as an internal or external command
```
Fix: Install from https://rustup.rs — then restart your terminal.

**Node.js not installed:**
```
'npm' is not recognized as an internal or external command
```
Fix: Install from https://nodejs.org — then restart your terminal.

**PATH not refreshed:** The bat files load PATH from the Windows registry automatically. If a fresh install isn't picked up, open a new terminal window and try again.

**Long path issues:** Windows has a 260-character path limit by default. If your repo is deeply nested, enable long paths:
```
# Run as Administrator
reg add "HKLM\SYSTEM\CurrentControlSet\Control\FileSystem" /v LongPathsEnabled /t REG_DWORD /d 1 /f
```

---

## 8. Build fails — Rust errors

**Symptom:** `cargo build` outputs red `error[E...]` messages.

**Out-of-date Rust toolchain:**
```
error: package `X` cannot be built because it requires rustc Y or newer
```
Fix: `rustup update stable`

**Missing system dependencies (Linux):**
```
error: linker `cc` not found
```
Fix:
```bash
# Ubuntu / Debian
sudo apt install build-essential pkg-config libssl-dev

# Fedora / RHEL
sudo dnf install gcc openssl-devel
```

**SQLite not found (Linux):**
```
error: failed to find libsqlite3
```
Fix:
```bash
sudo apt install libsqlite3-dev   # Ubuntu
sudo dnf install sqlite-devel      # Fedora
```

---

## 9. Build fails — npm / frontend errors

**Symptom:** `npm run build` fails.

**Node version too old:**
```
SyntaxError: Unexpected token '?.'
```
Fix: Install Node.js 18 or later from https://nodejs.org

**Missing dependencies:**
```
Cannot find module 'X'
```
Fix:
```bash
cd web
rm -rf node_modules
npm install
npm run build
```

**TypeScript errors:**
```
error TS2345: Argument of type...
```
These are usually pre-existing. Fix: `cd web && npx tsc --noEmit` to see all errors at once.

---

## 10. ferroload.exe is locked / can't rebuild

**Symptom:** `cargo build` says `Access is denied (os error 5)` on Windows.

**Cause:** The running `ferroload.exe` process has the file locked.

**Fix:**
```powershell
# Stop the running process first
Stop-Process -Name "ferroload" -Force

# Then rebuild
cargo build --release
```

Or close the terminal window where Ferroload is running, then rebuild.

---

## 11. AI Chat not showing up

**Symptom:** There's no AI chat panel in the sidebar.

**Cause:** Ferroload checks for Ollama at `http://localhost:11434` on startup. If Ollama isn't running, the AI panel is hidden completely (by design — no errors, no clutter).

**Fix:**
1. Install Ollama: https://ollama.ai
2. Pull a model: `ollama pull llama3`
3. Start Ollama: `ollama serve` (or it auto-starts on most platforms)
4. Refresh the Ferroload UI

**Verify Ollama is reachable:**
```bash
curl http://localhost:11434/api/tags
```
Should return a JSON list of installed models.

---

## 12. RSS feed not auto-downloading

**Symptom:** RSS feed is added but nothing downloads automatically.

**Check these:**

1. **Feed URL is correct** — paste the URL in your browser and verify it returns XML/RSS.
2. **Regex filter** — if you set a filter, test it at regex101.com with a sample torrent title from the feed.
3. **Auto-check not triggered** — Ferroload checks RSS feeds when you click "Check Now" or when the app starts. Background periodic checking is not yet automatic — click "Check Now" manually or restart the app.
4. **Duplicate detection** — if a torrent matching the filter was already added (same info hash), it won't be re-added.

---

## 13. High CPU usage

**Symptom:** Ferroload is using 30–100% CPU when idle or downloading.

**Cause A:** Write buffer too small — many small disk writes thrash the I/O scheduler and burn CPU waiting. Fix: increase Write Buffer to 16+ MB in Settings.

**Cause B:** Too many connection attempts — if max connections is very high (500+) and peers are unreachable, connection timeouts consume CPU. Fix: reduce max connections per torrent to 100.

**Cause C:** DHT bootstrapping — for the first 15 seconds after start, DHT ramps up aggressively. This is normal and subsides.

---

## 14. Database errors / corrupted state

**Symptom:** App starts but shows errors like `database disk image is malformed`.

**Cause:** Power loss or hard crash during a write can corrupt SQLite.

**Fix — reset the database (loses torrent history):**
```bash
# Windows
del %USERPROFILE%\.ferroload\ferroload.db

# Linux / macOS
rm ~/.ferroload/ferroload.db
```

The app will create a fresh database on next start.

**Fix — try to repair first (keeps data):**
```bash
sqlite3 ~/.ferroload/ferroload.db "PRAGMA integrity_check;"
sqlite3 ~/.ferroload/ferroload.db ".dump" > backup.sql
sqlite3 ~/.ferroload/ferroload_new.db ".read backup.sql"
mv ~/.ferroload/ferroload.db ~/.ferroload/ferroload.db.bak
mv ~/.ferroload/ferroload_new.db ~/.ferroload/ferroload.db
```

---

## 15. WebSocket disconnects frequently

**Symptom:** The speed graph or torrent list stops updating; stats freeze.

**Cause:** Reverse proxy (nginx, Caddy, Cloudflare Tunnel) is closing idle WebSocket connections.

**Fix — nginx:**
```nginx
location /ws {
    proxy_pass http://localhost:7070;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_read_timeout 86400;
}
```

**Fix — Caddy:**
```
reverse_proxy localhost:7070 {
    transport http {
        keepalive 1h
    }
}
```

The React client automatically reconnects — a brief freeze followed by catching up is normal.

---

## 16. How to change the default port

```bash
# Windows (PowerShell — for this session only)
$env:FERROLOAD_PORT = "8080"; .\ferroload.exe

# Windows (permanent — set system environment variable)
[System.Environment]::SetEnvironmentVariable("FERROLOAD_PORT", "8080", "User")

# Linux / macOS
FERROLOAD_PORT=8080 ./ferroload

# Or add to ~/.bashrc / ~/.zshrc:
export FERROLOAD_PORT=8080
```

---

## 17. How to change the download folder

Go to **Settings → Download Path** in the web UI and set a new default path. This takes effect for all new torrents. Existing torrents keep their original path.

Or set it before first run:
```bash
FERROLOAD_DATA_DIR=/my/data/dir ./ferroload
# Default download path will be: /my/data/dir/../Downloads/Ferroload
```

---

## 18. How to reset all settings

**Option A — through the UI:** Go to Settings and change each value manually.

**Option B — delete just the settings table:**
```bash
sqlite3 ~/.ferroload/ferroload.db "DELETE FROM settings;"
```
Restart the app — defaults are re-inserted automatically.

**Option C — full reset (deletes everything including torrent history):**
```bash
# Windows
rmdir /s /q %USERPROFILE%\.ferroload

# Linux / macOS
rm -rf ~/.ferroload
```

---

## Still stuck?

Open an issue on GitHub: **https://github.com/manoranjan2050/Ferroload/issues**

Include:
- Your OS and version
- Ferroload version (shown in the About page)
- The exact error message or description
- Steps to reproduce

For build failures, paste the full output of `cargo build --release 2>&1`.
