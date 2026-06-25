use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::{RwLock, broadcast};
use anyhow::Result;
use uuid::Uuid;
use serde::Deserialize;
use crate::models::*;
use crate::events::TorrentEvent;

// ── .torrent file bencode structures ────────────────────────────────────────

#[derive(Debug, Deserialize)]
struct BencodeInfo {
    pub name: Option<String>,
    pub length: Option<u64>,
    pub files: Option<Vec<BencodeFile>>,
    pub pieces: Option<serde_bytes::ByteBuf>,
    #[serde(rename = "piece length")]
    pub piece_length: Option<u64>,
}

#[derive(Debug, Deserialize)]
struct BencodeFile {
    pub length: u64,
    pub path: Vec<String>,
}

#[derive(Debug, Deserialize)]
struct BencodeTorrent {
    pub info: BencodeInfo,
}

// ── engine ───────────────────────────────────────────────────────────────────

pub struct EngineSession {
    pub torrents: Arc<RwLock<HashMap<String, TorrentInfo>>>,
    pub event_tx: broadcast::Sender<TorrentEvent>,
}

impl EngineSession {
    pub async fn new(_download_path: &str) -> Result<Arc<Self>> {
        let (event_tx, _) = broadcast::channel(256);
        Ok(Arc::new(Self {
            torrents: Arc::new(RwLock::new(HashMap::new())),
            event_tx,
        }))
    }

    pub async fn add_magnet(&self, magnet: &str, download_path: &str, label: Option<String>) -> Result<TorrentInfo> {
        let (info_hash, name) = parse_magnet(magnet)?;
        let info = self.new_torrent(info_hash, name, 0, vec![], download_path, label, Some(magnet.to_string()));
        self.store_and_emit(info.clone()).await;
        Ok(info)
    }

    pub async fn add_torrent_file(&self, data: Vec<u8>, download_path: &str, label: Option<String>) -> Result<TorrentInfo> {
        let (info_hash, name, size, files) = parse_torrent_file(&data)?;
        let info = self.new_torrent(info_hash, name, size, files, download_path, label, None);
        self.store_and_emit(info.clone()).await;
        Ok(info)
    }

    pub async fn remove_torrent(&self, id: &str) -> Result<()> {
        self.torrents.write().await.remove(id);
        Ok(())
    }

    pub async fn pause_torrent(&self, id: &str) -> Result<()> {
        let mut torrents = self.torrents.write().await;
        if let Some(t) = torrents.get_mut(id) {
            t.status = TorrentStatus::Paused;
            t.speed_down = 0;
            t.speed_up = 0;
        }
        Ok(())
    }

    pub async fn resume_torrent(&self, id: &str) -> Result<()> {
        let mut torrents = self.torrents.write().await;
        if let Some(t) = torrents.get_mut(id) {
            t.status = if t.progress >= 1.0 {
                TorrentStatus::Seeding
            } else {
                TorrentStatus::Downloading
            };
        }
        Ok(())
    }

    pub async fn list_torrents(&self) -> Vec<TorrentInfo> {
        self.torrents.read().await.values().cloned().collect()
    }

    pub async fn get_torrent(&self, id: &str) -> Option<TorrentInfo> {
        self.torrents.read().await.get(id).cloned()
    }

    pub fn subscribe_events(&self) -> broadcast::Receiver<TorrentEvent> {
        self.event_tx.subscribe()
    }

    pub async fn global_stats(&self) -> GlobalStats {
        let t = self.torrents.read().await;
        let infos: Vec<&TorrentInfo> = t.values().collect();
        GlobalStats {
            speed_down: infos.iter().map(|i| i.speed_down).sum(),
            speed_up: infos.iter().map(|i| i.speed_up).sum(),
            total_downloaded: infos.iter().map(|i| i.downloaded).sum(),
            total_uploaded: infos.iter().map(|i| i.uploaded).sum(),
            active_torrents: infos.iter().filter(|i| i.status == TorrentStatus::Downloading).count() as u32,
            paused_torrents: infos.iter().filter(|i| i.status == TorrentStatus::Paused).count() as u32,
            seeding_torrents: infos.iter().filter(|i| i.status == TorrentStatus::Seeding).count() as u32,
        }
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    fn new_torrent(
        &self,
        info_hash: String,
        name: String,
        size: u64,
        files: Vec<TorrentFile>,
        download_path: &str,
        label: Option<String>,
        _magnet: Option<String>,
    ) -> TorrentInfo {
        TorrentInfo {
            id: Uuid::new_v4().to_string(),
            name,
            info_hash,
            size,
            downloaded: 0,
            uploaded: 0,
            progress: 0.0,
            status: TorrentStatus::Downloading,
            speed_down: 0,
            speed_up: 0,
            peers: 0,
            seeds: 0,
            eta_secs: None,
            download_path: download_path.to_string(),
            label,
            added_at: chrono::Utc::now().timestamp(),
            files,
        }
    }

    async fn store_and_emit(&self, info: TorrentInfo) {
        self.torrents.write().await.insert(info.id.clone(), info.clone());
        let _ = self.event_tx.send(TorrentEvent::TorrentAdded { torrent: info });
    }
}

// ── parsers ──────────────────────────────────────────────────────────────────

fn parse_magnet(magnet: &str) -> Result<(String, String)> {
    let mut info_hash = String::new();
    let mut name = String::from("Unknown");

    for part in magnet.split('&') {
        if let Some(xt) = part.strip_prefix("magnet:?xt=urn:btih:").or_else(|| part.strip_prefix("xt=urn:btih:")) {
            info_hash = xt.to_lowercase();
        } else if let Some(dn) = part.strip_prefix("dn=") {
            name = urlencoding_decode(dn);
        }
    }

    if info_hash.is_empty() {
        anyhow::bail!("Invalid magnet link: missing info hash");
    }

    Ok((info_hash, name))
}

fn urlencoding_decode(s: &str) -> String {
    let s = s.replace('+', " ");
    let mut result = String::new();
    let mut chars = s.chars().peekable();
    while let Some(c) = chars.next() {
        if c == '%' {
            let h1 = chars.next().unwrap_or('0');
            let h2 = chars.next().unwrap_or('0');
            if let Ok(byte) = u8::from_str_radix(&format!("{}{}", h1, h2), 16) {
                result.push(byte as char);
            }
        } else {
            result.push(c);
        }
    }
    result
}

fn parse_torrent_file(data: &[u8]) -> Result<(String, String, u64, Vec<TorrentFile>)> {
    // Compute info_hash from the raw info dict
    let torrent: BencodeTorrent = serde_bencode::from_bytes(data)
        .map_err(|e| anyhow::anyhow!("Failed to parse .torrent: {}", e))?;

    // Extract info dict bytes for SHA-1 hashing
    let info_hash = compute_info_hash(data).unwrap_or_else(|_| "0000000000000000000000000000000000000000".to_string());

    let info = &torrent.info;
    let name = info.name.clone().unwrap_or_else(|| "Unknown".to_string());

    let (size, files) = if let Some(ref file_list) = info.files {
        // Multi-file torrent
        let total: u64 = file_list.iter().map(|f| f.length).sum();
        let tfiles: Vec<TorrentFile> = file_list.iter().map(|f| {
            let path = f.path.join("/");
            TorrentFile {
                name: path.clone(),
                path,
                size: f.length,
                downloaded: 0,
                progress: 0.0,
                priority: FilePriority::Normal,
            }
        }).collect();
        (total, tfiles)
    } else {
        // Single-file torrent
        let len = info.length.unwrap_or(0);
        let file = TorrentFile {
            name: name.clone(),
            path: name.clone(),
            size: len,
            downloaded: 0,
            progress: 0.0,
            priority: FilePriority::Normal,
        };
        (len, vec![file])
    };

    Ok((info_hash, name, size, files))
}

fn compute_info_hash(torrent_data: &[u8]) -> Result<String> {
    use sha1::{Sha1, Digest};

    // Find the "4:info" key and extract the value bytes
    let needle = b"4:info";
    let pos = torrent_data
        .windows(needle.len())
        .position(|w| w == needle)
        .ok_or_else(|| anyhow::anyhow!("info key not found"))?;

    let info_start = pos + needle.len();
    let info_bytes = &torrent_data[info_start..torrent_data.len() - 1]; // strip trailing 'e'

    let mut hasher = Sha1::new();
    hasher.update(info_bytes);
    let hash = hasher.finalize();
    Ok(hex::encode(hash))
}
