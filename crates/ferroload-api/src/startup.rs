use std::collections::HashMap;
use sqlx::SqlitePool;
use ferroload_engine::{EngineConfig, EngineSession, TorrentInfo, TorrentStatus, TorrentFile, FilePriority, PieceStrategy};
use std::sync::Arc;
use tracing::{info, warn};

/// Called once at startup: restore persisted torrents + apply saved settings to engine.
pub async fn restore_state(db: &SqlitePool, engine: &Arc<EngineSession>) {
    restore_torrents(db, engine).await;
    restore_engine_config(db, engine).await;
}

// ── Fix 1: Restore torrents from SQLite → engine HashMap ─────────────────────

async fn restore_torrents(db: &SqlitePool, engine: &Arc<EngineSession>) {
    let rows = sqlx::query_as::<_, (String, String, String, Option<String>, String, i64, Option<String>, String)>(
        "SELECT id, name, info_hash, label, download_path, added_at, label, status FROM torrents"
    )
    .fetch_all(db)
    .await;

    let rows = match rows {
        Ok(r) => r,
        Err(e) => { warn!("Could not restore torrents: {}", e); return; }
    };

    // Fetch all torrents properly
    let full_rows = sqlx::query_as::<_, (String, String, String, Option<String>, String, i64, String)>(
        "SELECT id, name, info_hash, label, download_path, added_at, status FROM torrents"
    )
    .fetch_all(db)
    .await
    .unwrap_or_default();

    let mut count = 0usize;
    for (id, name, info_hash, label, download_path, added_at, status) in full_rows {
        let torrent = TorrentInfo {
            id: id.clone(),
            name,
            info_hash,
            size: 0,
            downloaded: 0,
            uploaded: 0,
            progress: 0.0,
            status: status.parse().unwrap_or(TorrentStatus::Paused),
            speed_down: 0,
            speed_up: 0,
            peers: 0,
            seeds: 0,
            eta_secs: None,
            download_path,
            label,
            added_at,
            files: vec![],
            piece_strategy: PieceStrategy::RarestFirst,
            superseeding: false,
            metadata_ready: false,
            trackers: vec![],
        };
        engine.torrents.write().await.insert(id, torrent);
        count += 1;
    }

    if count > 0 {
        info!("Restored {} torrent(s) from database", count);
    }

    drop(rows); // suppress unused warning
}

// ── Fix 2: Apply saved settings to engine on startup ─────────────────────────

async fn restore_engine_config(db: &SqlitePool, engine: &Arc<EngineSession>) {
    let rows = sqlx::query_as::<_, (String, String)>("SELECT key, value FROM settings")
        .fetch_all(db)
        .await
        .unwrap_or_default();

    let map: HashMap<String, String> = rows.into_iter().collect();
    let get      = |k: &str, def: &str| map.get(k).map(|s| s.as_str()).unwrap_or(def).to_string();
    let get_bool = |k: &str, def: bool| get(k, if def { "true" } else { "false" }) == "true";
    let get_u64  = |k: &str, def: u64| get(k, &def.to_string()).parse::<u64>().unwrap_or(def);
    let get_u32  = |k: &str, def: u32| get(k, &def.to_string()).parse::<u32>().unwrap_or(def);

    let cfg = EngineConfig {
        max_connections_per_torrent: get_u32("max_connections_per_torrent", 80),
        max_total_connections:       get_u32("max_total_connections", 500),
        dht_enabled:                 get_bool("dht_enabled", true),
        pex_enabled:                 get_bool("pex_enabled", true),
        lsd_enabled:                 get_bool("lsd_enabled", true),
        max_upload_bps:              get_u64("max_upload_speed_kbps", 0) * 1024,
        max_download_bps:            get_u64("max_download_speed_kbps", 0) * 1024,
        write_buffer_bytes:          get_u64("write_buffer_mb", 4) * 1024 * 1024,
        utp_enabled:                 get_bool("utp_enabled", true),
    };

    engine.apply_config(cfg).await;
    info!("Engine config restored from saved settings");
}
