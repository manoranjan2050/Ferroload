pub mod db;
pub mod routes;
pub mod state;
pub mod ws;

use actix_web::web;
use routes::{ai, rss, settings, stats, torrents};
use ws::ws_handler;

pub fn configure_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/api/v1")
            .route("/torrents", web::get().to(torrents::list_torrents))
            .route("/torrents/magnet", web::post().to(torrents::add_magnet))
            .route("/torrents/file", web::post().to(torrents::add_torrent_file))
            .route("/torrents/{id}", web::get().to(torrents::get_torrent))
            .route("/torrents/{id}", web::delete().to(torrents::delete_torrent))
            .route("/torrents/{id}/pause", web::post().to(torrents::pause_torrent))
            .route("/torrents/{id}/resume", web::post().to(torrents::resume_torrent))
            .route("/torrents/{id}/peers", web::get().to(torrents::get_peers))
            .route("/torrents/{id}/files", web::get().to(torrents::get_files))
            .route("/torrents/{id}/priority", web::patch().to(torrents::set_priority))
            .route("/stats", web::get().to(stats::get_stats))
            .route("/settings", web::get().to(settings::get_settings))
            .route("/settings", web::put().to(settings::update_settings))
            .route("/rss", web::get().to(rss::list_feeds))
            .route("/rss", web::post().to(rss::add_feed))
            .route("/rss/{id}", web::delete().to(rss::delete_feed))
            .route("/rss/check", web::post().to(rss::check_feeds))
            .route("/ai/status", web::get().to(ai::ai_status))
            .route("/ai/chat", web::post().to(ai::ai_chat)),
    )
    .route("/ws", web::get().to(ws_handler));
}
