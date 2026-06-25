use sqlx::{SqlitePool, sqlite::SqlitePoolOptions};
use anyhow::Result;

pub async fn init_db(data_dir: &str) -> Result<SqlitePool> {
    let db_path = format!("{}/ferroload.db", data_dir);
    let db_url = format!("sqlite://{}?mode=rwc", db_path);

    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect(&db_url)
        .await?;

    run_migrations(&pool).await?;
    Ok(pool)
}

async fn run_migrations(pool: &SqlitePool) -> Result<()> {
    sqlx::query(
        r#"CREATE TABLE IF NOT EXISTS torrents (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            info_hash TEXT NOT NULL UNIQUE,
            magnet_uri TEXT,
            torrent_file BLOB,
            download_path TEXT NOT NULL,
            added_at INTEGER NOT NULL,
            label TEXT,
            status TEXT NOT NULL DEFAULT 'paused'
        )"#,
    )
    .execute(pool)
    .await?;

    sqlx::query(
        r#"CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        )"#,
    )
    .execute(pool)
    .await?;

    sqlx::query(
        r#"CREATE TABLE IF NOT EXISTS rss_feeds (
            id TEXT PRIMARY KEY,
            url TEXT NOT NULL,
            name TEXT NOT NULL,
            filter_regex TEXT,
            download_path TEXT,
            last_checked INTEGER,
            enabled INTEGER NOT NULL DEFAULT 1
        )"#,
    )
    .execute(pool)
    .await?;

    sqlx::query(
        r#"CREATE TABLE IF NOT EXISTS download_history (
            id TEXT PRIMARY KEY,
            torrent_id TEXT,
            name TEXT NOT NULL,
            info_hash TEXT NOT NULL,
            completed_at INTEGER NOT NULL,
            total_size INTEGER,
            download_path TEXT
        )"#,
    )
    .execute(pool)
    .await?;

    // Insert default settings
    let defaults = [
        ("download_path", dirs_default()),
        ("max_download_speed_kbps", "0".to_string()),
        ("max_upload_speed_kbps", "0".to_string()),
        ("listen_port", "6881".to_string()),
        // Feature 4 – peer discovery
        ("dht_enabled", "true".to_string()),
        ("pex_enabled", "true".to_string()),
        ("lsd_enabled", "true".to_string()),
        // Feature 2 – connection pool
        ("max_connections_per_torrent", "80".to_string()),
        ("max_total_connections", "500".to_string()),
        // Feature 6 – disk write buffer (MB)
        ("write_buffer_mb", "4".to_string()),
        // Feature 7 – uTP
        ("utp_enabled", "true".to_string()),
        ("schedule_enabled", "false".to_string()),
        ("schedule_start", "08:00".to_string()),
        ("schedule_end", "22:00".to_string()),
        ("ollama_url", "http://localhost:11434".to_string()),
        ("ollama_model", "llama3".to_string()),
        ("ai_enabled", "true".to_string()),
        ("theme", "dark".to_string()),
    ];

    for (key, value) in defaults {
        sqlx::query("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)")
            .bind(key)
            .bind(value)
            .execute(pool)
            .await?;
    }

    Ok(())
}

fn dirs_default() -> String {
    let home = std::env::var("HOME")
        .or_else(|_| std::env::var("USERPROFILE"))
        .unwrap_or_else(|_| ".".to_string());
    format!("{}/Downloads/Ferroload", home)
}
