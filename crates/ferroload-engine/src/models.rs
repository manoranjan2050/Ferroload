use serde::{Deserialize, Serialize};

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
            TorrentStatus::Paused => write!(f, "paused"),
            TorrentStatus::Downloading => write!(f, "downloading"),
            TorrentStatus::Seeding => write!(f, "seeding"),
            TorrentStatus::Error => write!(f, "error"),
            TorrentStatus::Checking => write!(f, "checking"),
            TorrentStatus::Queued => write!(f, "queued"),
        }
    }
}

impl std::str::FromStr for TorrentStatus {
    type Err = anyhow::Error;
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "paused" => Ok(TorrentStatus::Paused),
            "downloading" => Ok(TorrentStatus::Downloading),
            "seeding" => Ok(TorrentStatus::Seeding),
            "error" => Ok(TorrentStatus::Error),
            "checking" => Ok(TorrentStatus::Checking),
            "queued" => Ok(TorrentStatus::Queued),
            _ => Ok(TorrentStatus::Paused),
        }
    }
}

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
    pub flags: String,
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
}
