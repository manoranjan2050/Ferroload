use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::{RwLock, broadcast};
use anyhow::Result;
use uuid::Uuid;
use librqbit::{Session, AddTorrent, AddTorrentOptions, ManagedTorrentState};
use crate::models::*;
use crate::events::TorrentEvent;

pub struct EngineSession {
    pub session: Arc<Session>,
    pub torrents: Arc<RwLock<HashMap<String, TorrentHandle>>>,
    pub event_tx: broadcast::Sender<TorrentEvent>,
}

pub struct TorrentHandle {
    pub id: String,
    pub info: TorrentInfo,
    pub librqbit_id: usize,
}

impl EngineSession {
    pub async fn new(download_path: &str) -> Result<Arc<Self>> {
        let (event_tx, _) = broadcast::channel(256);
        let session = Session::new(download_path.into()).await?;
        Ok(Arc::new(Self {
            session: Arc::new(session),
            torrents: Arc::new(RwLock::new(HashMap::new())),
            event_tx,
        }))
    }

    pub async fn add_magnet(&self, magnet: &str, download_path: &str, label: Option<String>) -> Result<TorrentInfo> {
        let opts = AddTorrentOptions {
            output_folder: Some(download_path.to_string()),
            ..Default::default()
        };
        let handle = self.session.add_torrent(
            AddTorrent::from_url(magnet),
            Some(opts),
        ).await?;

        let id = Uuid::new_v4().to_string();
        let torrent_id = handle.id;
        let info = self.build_torrent_info(&id, torrent_id, download_path, label).await?;

        let mut torrents = self.torrents.write().await;
        torrents.insert(id.clone(), TorrentHandle {
            id: id.clone(),
            info: info.clone(),
            librqbit_id: torrent_id,
        });

        let _ = self.event_tx.send(TorrentEvent::TorrentAdded { torrent: info.clone() });
        Ok(info)
    }

    pub async fn add_torrent_file(&self, data: Vec<u8>, download_path: &str, label: Option<String>) -> Result<TorrentInfo> {
        let opts = AddTorrentOptions {
            output_folder: Some(download_path.to_string()),
            ..Default::default()
        };
        let handle = self.session.add_torrent(
            AddTorrent::TorrentFileBytes(data.into()),
            Some(opts),
        ).await?;

        let id = Uuid::new_v4().to_string();
        let torrent_id = handle.id;
        let info = self.build_torrent_info(&id, torrent_id, download_path, label).await?;

        let mut torrents = self.torrents.write().await;
        torrents.insert(id.clone(), TorrentHandle {
            id: id.clone(),
            info: info.clone(),
            librqbit_id: torrent_id,
        });

        let _ = self.event_tx.send(TorrentEvent::TorrentAdded { torrent: info.clone() });
        Ok(info)
    }

    pub async fn remove_torrent(&self, id: &str) -> Result<()> {
        let mut torrents = self.torrents.write().await;
        if let Some(handle) = torrents.remove(id) {
            self.session.delete(handle.librqbit_id, false).await?;
        }
        Ok(())
    }

    pub async fn pause_torrent(&self, id: &str) -> Result<()> {
        let torrents = self.torrents.read().await;
        if let Some(handle) = torrents.get(id) {
            self.session.pause(handle.librqbit_id)?;
        }
        Ok(())
    }

    pub async fn resume_torrent(&self, id: &str) -> Result<()> {
        let torrents = self.torrents.read().await;
        if let Some(handle) = torrents.get(id) {
            self.session.unpause(handle.librqbit_id)?;
        }
        Ok(())
    }

    pub async fn list_torrents(&self) -> Vec<TorrentInfo> {
        let torrents = self.torrents.read().await;
        let mut infos = Vec::new();
        for handle in torrents.values() {
            if let Ok(info) = self.refresh_torrent_info(&handle.info.id, handle.librqbit_id).await {
                infos.push(info);
            } else {
                infos.push(handle.info.clone());
            }
        }
        infos
    }

    pub async fn get_torrent(&self, id: &str) -> Option<TorrentInfo> {
        let torrents = self.torrents.read().await;
        if let Some(handle) = torrents.get(id) {
            self.refresh_torrent_info(&handle.info.id, handle.librqbit_id).await.ok()
                .or_else(|| Some(handle.info.clone()))
        } else {
            None
        }
    }

    pub fn subscribe_events(&self) -> broadcast::Receiver<TorrentEvent> {
        self.event_tx.subscribe()
    }

    pub async fn global_stats(&self) -> GlobalStats {
        let infos = self.list_torrents().await;
        let speed_down: u64 = infos.iter().map(|t| t.speed_down).sum();
        let speed_up: u64 = infos.iter().map(|t| t.speed_up).sum();
        let total_downloaded: u64 = infos.iter().map(|t| t.downloaded).sum();
        let total_uploaded: u64 = infos.iter().map(|t| t.uploaded).sum();
        let active_torrents = infos.iter().filter(|t| t.status == TorrentStatus::Downloading).count() as u32;
        let paused_torrents = infos.iter().filter(|t| t.status == TorrentStatus::Paused).count() as u32;
        let seeding_torrents = infos.iter().filter(|t| t.status == TorrentStatus::Seeding).count() as u32;
        GlobalStats {
            speed_down, speed_up, total_downloaded, total_uploaded,
            active_torrents, paused_torrents, seeding_torrents,
        }
    }

    async fn build_torrent_info(&self, id: &str, torrent_id: usize, download_path: &str, label: Option<String>) -> Result<TorrentInfo> {
        let t = self.session.get(torrent_id).ok_or_else(|| anyhow::anyhow!("Torrent not found"))?;
        let details = t.with_metadata(|m| {
            let name = m.info.name.clone().unwrap_or_else(|| "Unknown".to_string());
            let info_hash = format!("{}", m.info_hash);
            let size: u64 = m.info.iter_file_lengths()
                .map(|r| r.map(|l| l as u64).unwrap_or(0))
                .sum();
            let files: Vec<TorrentFile> = m.info.iter_filenames_and_lengths()
                .unwrap_or_default()
                .map(|(path, len)| TorrentFile {
                    name: path.to_string_lossy().to_string(),
                    path: path.to_string_lossy().to_string(),
                    size: len as u64,
                    downloaded: 0,
                    progress: 0.0,
                    priority: FilePriority::Normal,
                })
                .collect();
            (name, info_hash, size, files)
        });

        let (name, info_hash, size, files) = match details {
            Some(d) => d,
            None => ("Unknown".to_string(), String::new(), 0, vec![]),
        };

        let status = match t.state() {
            ManagedTorrentState::Paused => TorrentStatus::Paused,
            ManagedTorrentState::Live(_) => TorrentStatus::Downloading,
            ManagedTorrentState::Error(_) => TorrentStatus::Error,
            _ => TorrentStatus::Queued,
        };

        Ok(TorrentInfo {
            id: id.to_string(),
            name,
            info_hash,
            size,
            downloaded: 0,
            uploaded: 0,
            progress: 0.0,
            status,
            speed_down: 0,
            speed_up: 0,
            peers: 0,
            seeds: 0,
            eta_secs: None,
            download_path: download_path.to_string(),
            label,
            added_at: chrono::Utc::now().timestamp(),
            files,
        })
    }

    async fn refresh_torrent_info(&self, id: &str, torrent_id: usize) -> Result<TorrentInfo> {
        let t = self.session.get(torrent_id).ok_or_else(|| anyhow::anyhow!("Torrent not found"))?;

        let (name, info_hash, size, files) = t.with_metadata(|m| {
            let name = m.info.name.clone().unwrap_or_else(|| "Unknown".to_string());
            let info_hash = format!("{}", m.info_hash);
            let size: u64 = m.info.iter_file_lengths()
                .map(|r| r.map(|l| l as u64).unwrap_or(0))
                .sum();
            let files = vec![];
            (name, info_hash, size, files)
        }).unwrap_or_else(|| ("Unknown".to_string(), String::new(), 0, vec![]));

        let (downloaded, speed_down, speed_up, peers) = match t.state() {
            ManagedTorrentState::Live(live) => {
                let stats = live.stats_snapshot();
                let downloaded = stats.downloaded_and_checked_bytes;
                let speed_down = stats.download_speed.mbps as u64 * 125_000;
                let speed_up = stats.upload_speed.mbps as u64 * 125_000;
                let peers = stats.peer_stats.live as u32;
                (downloaded, speed_down, speed_up, peers)
            }
            _ => (0, 0, 0, 0),
        };

        let progress = if size > 0 { downloaded as f64 / size as f64 } else { 0.0 };
        let eta_secs = if speed_down > 0 && size > downloaded {
            Some((size - downloaded) / speed_down)
        } else {
            None
        };

        let status = match t.state() {
            ManagedTorrentState::Paused => TorrentStatus::Paused,
            ManagedTorrentState::Live(_) => {
                if progress >= 1.0 { TorrentStatus::Seeding } else { TorrentStatus::Downloading }
            }
            ManagedTorrentState::Error(_) => TorrentStatus::Error,
            _ => TorrentStatus::Queued,
        };

        Ok(TorrentInfo {
            id: id.to_string(),
            name,
            info_hash,
            size,
            downloaded,
            uploaded: 0,
            progress,
            status,
            speed_down,
            speed_up,
            peers,
            seeds: 0,
            eta_secs,
            download_path: String::new(),
            label: None,
            added_at: chrono::Utc::now().timestamp(),
            files,
        })
    }
}
