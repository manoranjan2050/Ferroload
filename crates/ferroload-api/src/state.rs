use std::sync::Arc;
use sqlx::SqlitePool;
use tokio::sync::broadcast;
use ferroload_engine::{EngineSession, TorrentEvent};

#[derive(Clone)]
pub struct AppState {
    pub db: SqlitePool,
    pub engine: Arc<EngineSession>,
    pub event_tx: broadcast::Sender<TorrentEvent>,
}

impl AppState {
    pub fn new(db: SqlitePool, engine: Arc<EngineSession>) -> Self {
        let event_tx = engine.event_tx.clone();
        Self { db, engine, event_tx }
    }
}
