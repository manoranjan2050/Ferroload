use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::{RwLock, broadcast};
use anyhow::Result;
use uuid::Uuid;
use librqbit::{
    Session, AddTorrent, AddTorrentOptions, AddTorrentResponse,
    ManagedTorrent, TorrentStatsState,
};
use crate::models::*;
use crate::events::TorrentEvent;

pub struct TorrentRecord {
    pub id: String,
    pub librqbit_id: usize,
    pub download_path: String,
    pub label: Option<String>,
    pub added_at: i64,
}

pub struct EngineSession {
    pub session: Arc<Session>,
    pub torrents: Arc<RwLock<HashMap<String, TorrentRecord>>>,
    pub event_tx: broadcast::Sender<TorrentEvent>,
}

impl EngineSession {
    pub async fn new(download_path: &str) -> Result<Arc<Self>> {
        let (event_tx, _) = broadcast::channel(256);
        let session = Session::new(std::path::PathBuf::from(download_path)).await?;
        Ok(Arc::new(Self {
            session,
            torrents: Arc::new(RwLock::new(HashMap::new())),
            event_tx,
        }))
    }

    pub async fn add_magnet(&self, magnet: &str, download_path: &str, label: Option<String>) -> Result<TorrentInfo> {
        let opts = AddTorrentOptions {
            output_folder: Some(download_path.to_string()),
            ..Default::default()
        };
        let resp = self.session
            .add_torrent(AddTorrent::from_url(magnet), Some(opts))
            .await?;
        let handle = Self::handle_from_response(resp)?;
        self.register(handle, download_path, label).await
    }

    pub async fn add_torrent_file(&self, data: Vec<u8>, download_path: &str, label: Option<String>) -> Result<TorrentInfo> {
        let opts = AddTorrentOptions {
            output_folder: Some(download_path.to_string()),
            ..Default::default()
        };
        let resp = self.session
            .add_torrent(AddTorrent::TorrentFileBytes(data.into()), Some(opts))
            .await?;
        let handle = Self::handle_from_response(resp)?;
        self.register(handle, download_path, label).await
    }

    pub async fn remove_torrent(&self, id: &str) -> Result<()> {
        let mut torrents = self.torrents.write().await;
        if let Some(record) = torrents.remove(id) {
            let _ = self.session.delete(record.librqbit_id.into(), false);
        }
        Ok(())
    }

    pub async fn pause_torrent(&self, id: &str) -> Result<()> {
        if let Some(handle) = self.get_handle(id).await {
            let _ = self.session.pause(&handle);
        }
        Ok(())
    }

    pub async fn resume_torrent(&self, id: &str) -> Result<()> {
        if let Some(handle) = self.get_handle(id).await {
            let _ = self.session.unpause(&handle).await;
        }
        Ok(())
    }

    pub async fn list_torrents(&self) -> Vec<TorrentInfo> {
        let torrents = self.torrents.read().await;
        torrents.values().filter_map(|record| {
            let handle = self.session.get(record.librqbit_id.into())?;
            Some(Self::build_info(record, &handle))
        }).collect()
    }

    pub async fn get_torrent(&self, id: &str) -> Option<TorrentInfo> {
        let torrents = self.torrents.read().await;
        let record = torrents.get(id)?;
        let handle = self.session.get(record.librqbit_id.into())?;
        Some(Self::build_info(record, &handle))
    }

    pub fn subscribe_events(&self) -> broadcast::Receiver<TorrentEvent> {
        self.event_tx.subscribe()
    }

    pub async fn global_stats(&self) -> GlobalStats {
        let infos = self.list_torrents().await;
        GlobalStats {
            speed_down: infos.iter().map(|t| t.speed_down).sum(),
            speed_up: infos.iter().map(|t| t.speed_up).sum(),
            total_downloaded: infos.iter().map(|t| t.downloaded).sum(),
            total_uploaded: infos.iter().map(|t| t.uploaded).sum(),
            active_torrents: infos.iter().filter(|t| t.status == TorrentStatus::Downloading).count() as u32,
            paused_torrents: infos.iter().filter(|t| t.status == TorrentStatus::Paused).count() as u32,
            seeding_torrents: infos.iter().filter(|t| t.status == TorrentStatus::Seeding).count() as u32,
        }
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    fn handle_from_response(resp: AddTorrentResponse) -> Result<Arc<ManagedTorrent>> {
        match resp {
            AddTorrentResponse::Added(_, handle) => Ok(handle),
            AddTorrentResponse::AlreadyManaged(_, handle) => Ok(handle),
            AddTorrentResponse::ListOnly(_) => anyhow::bail!("list-only response"),
        }
    }

    async fn register(&self, handle: Arc<ManagedTorrent>, download_path: &str, label: Option<String>) -> Result<TorrentInfo> {
        let id = Uuid::new_v4().to_string();
        let record = TorrentRecord {
            id: id.clone(),
            librqbit_id: handle.id(),
            download_path: download_path.to_string(),
            label,
            added_at: chrono::Utc::now().timestamp(),
        };
        let info = Self::build_info(&record, &handle);
        self.torrents.write().await.insert(id, record);
        let _ = self.event_tx.send(TorrentEvent::TorrentAdded { torrent: info.clone() });
        Ok(info)
    }

    async fn get_handle(&self, id: &str) -> Option<Arc<ManagedTorrent>> {
        let torrents = self.torrents.read().await;
        let record = torrents.get(id)?;
        self.session.get(record.librqbit_id.into())
    }

    fn build_info(record: &TorrentRecord, handle: &ManagedTorrent) -> TorrentInfo {
        let stats = handle.stats();

        let size = stats.total_bytes;
        let downloaded = stats.progress_bytes;
        let uploaded = stats.uploaded_bytes;
        let progress = if size > 0 { downloaded as f64 / size as f64 } else { 0.0 };

        let (speed_down, speed_up, eta_secs) = if let Some(live) = &stats.live {
            let dl = live.download_speed.as_bytes();
            let ul = live.upload_speed.as_bytes();
            let eta = live.time_remaining.as_ref().map(|t| t.0.as_secs());
            (dl, ul, eta)
        } else {
            (0u64, 0u64, None)
        };

        let status = match stats.state {
            TorrentStatsState::Initializing { .. } => TorrentStatus::Checking,
            TorrentStatsState::Paused => TorrentStatus::Paused,
            TorrentStatsState::Live => {
                if stats.finished { TorrentStatus::Seeding } else { TorrentStatus::Downloading }
            }
            TorrentStatsState::Error => TorrentStatus::Error,
        };

        TorrentInfo {
            id: record.id.clone(),
            name: handle.name().unwrap_or_else(|| "Loading…".to_string()),
            info_hash: format!("{}", handle.info_hash()),
            size,
            downloaded,
            uploaded,
            progress,
            status,
            speed_down,
            speed_up,
            peers: 0, // AggregatePeerStats fields not stable across versions
            seeds: 0,
            eta_secs,
            download_path: record.download_path.clone(),
            label: record.label.clone(),
            added_at: record.added_at,
            files: vec![],
        }
    }
}
