use serde::{Deserialize, Serialize};
use crate::models::TorrentInfo;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum TorrentEvent {
    TorrentProgress {
        id: String,
        downloaded: u64,
        total: u64,
        speed_down: u64,
        speed_up: u64,
        peers: u32,
        eta_secs: Option<u64>,
        progress: f64,
    },
    TorrentAdded {
        torrent: TorrentInfo,
    },
    TorrentFinished {
        id: String,
    },
    TorrentError {
        id: String,
        message: String,
    },
    GlobalStats {
        speed_down: u64,
        speed_up: u64,
        active_torrents: u32,
    },
}
