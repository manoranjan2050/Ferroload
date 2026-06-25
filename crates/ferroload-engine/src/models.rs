use serde::{Deserialize, Serialize};

// ── Per-torrent info ──────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TorrentInfo {
    pub id: String,
    pub name: String,
    pub info_hash: String,
    pub size: u64,
    pub downloaded: u64,
    pub uploaded: u64,
    pub progress: f64,
    pub status: TorrentStatus,
    pub speed_down: u64,
    pub speed_up: u64,
    pub peers: u32,
    pub seeds: u32,
    pub eta_secs: Option<u64>,
    pub download_path: String,
    pub label: Option<String>,
    pub added_at: i64,
    pub files: Vec<TorrentFile>,
    // --- speed features ---
    pub piece_strategy: PieceStrategy,
    pub superseeding: bool,
    pub metadata_ready: bool,
    pub trackers: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum TorrentStatus {
    Paused,
    Downloading,
    Seeding,
    Error,
    Checking,
    Queued,
}

impl std::fmt::Display for TorrentStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            TorrentStatus::Paused     => write!(f, "paused"),
            TorrentStatus::Downloading => write!(f, "downloading"),
            TorrentStatus::Seeding    => write!(f, "seeding"),
            TorrentStatus::Error      => write!(f, "error"),
            TorrentStatus::Checking   => write!(f, "checking"),
            TorrentStatus::Queued     => write!(f, "queued"),
        }
    }
}

impl std::str::FromStr for TorrentStatus {
    type Err = anyhow::Error;
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        Ok(match s {
            "downloading" => TorrentStatus::Downloading,
            "seeding"     => TorrentStatus::Seeding,
            "error"       => TorrentStatus::Error,
            "checking"    => TorrentStatus::Checking,
            "queued"      => TorrentStatus::Queued,
            _             => TorrentStatus::Paused,
        })
    }
}

// ── Feature 1: Piece strategy ─────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum PieceStrategy {
    RarestFirst,  // Default: best swarm health
    Sequential,   // Good for video streaming
    Random,       // Reduces hotspot load
}

impl Default for PieceStrategy {
    fn default() -> Self { PieceStrategy::RarestFirst }
}

impl std::fmt::Display for PieceStrategy {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            PieceStrategy::RarestFirst => write!(f, "rarest_first"),
            PieceStrategy::Sequential  => write!(f, "sequential"),
            PieceStrategy::Random      => write!(f, "random"),
        }
    }
}

impl std::str::FromStr for PieceStrategy {
    type Err = anyhow::Error;
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        Ok(match s {
            "sequential" => PieceStrategy::Sequential,
            "random"     => PieceStrategy::Random,
            _            => PieceStrategy::RarestFirst,
        })
    }
}

// ── Feature 2 + 5 + 6 + 7: Global engine config ───────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EngineConfig {
    // Feature 2 – Connection pool
    pub max_connections_per_torrent: u32,
    pub max_total_connections: u32,

    // Feature 4 – Peer discovery
    pub dht_enabled: bool,
    pub pex_enabled: bool,
    pub lsd_enabled: bool,

    // Feature 5 – Upload throttle (0 = unlimited, bytes/sec)
    pub max_upload_bps: u64,
    pub max_download_bps: u64,

    // Feature 6 – Disk write buffer (bytes)
    pub write_buffer_bytes: u64,

    // Feature 7 – uTP
    pub utp_enabled: bool,
}

impl Default for EngineConfig {
    fn default() -> Self {
        Self {
            max_connections_per_torrent: 80,
            max_total_connections: 500,
            dht_enabled: true,
            pex_enabled: true,
            lsd_enabled: true,
            max_upload_bps: 0,
            max_download_bps: 0,
            write_buffer_bytes: 4 * 1024 * 1024, // 4 MB
            utp_enabled: true,
        }
    }
}

// ── Per-torrent config input (from API) ───────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TorrentConfig {
    pub piece_strategy: Option<PieceStrategy>,
    pub superseeding: Option<bool>,
}

// ── File + peers ──────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TorrentFile {
    pub name: String,
    pub path: String,
    pub size: u64,
    pub downloaded: u64,
    pub progress: f64,
    pub priority: FilePriority,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum FilePriority {
    High,
    Normal,
    Skip,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PeerInfo {
    pub ip: String,
    pub port: u16,
    pub client: String,
    pub speed_down: u64,
    pub speed_up: u64,
    pub progress: f64,
    pub flags: String,  // e.g. "uT" = uTP, "D" = DHT, "P" = PEX
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct GlobalStats {
    pub speed_down: u64,
    pub speed_up: u64,
    pub total_downloaded: u64,
    pub total_uploaded: u64,
    pub active_torrents: u32,
    pub paused_torrents: u32,
    pub seeding_torrents: u32,
    // Feature 4 – peer discovery breakdown
    pub dht_nodes: u32,
    pub pex_peers: u32,
    pub lsd_peers: u32,
    // Feature 6 – disk buffer
    pub write_buffer_used: u64,
    pub write_buffer_capacity: u64,
}

// ── Tracker announce response (Feature 8) ─────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct TrackerInfo {
    pub url: String,
    pub status: TrackerStatus,
    pub seeders: u32,
    pub leechers: u32,
    pub last_announce: Option<i64>,
    pub next_announce: Option<i64>,
    pub message: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum TrackerStatus {
    #[default]
    Idle,
    Announcing,
    Ok,
    Error,
}
