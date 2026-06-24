use actix_web::{web, HttpResponse, HttpRequest};
use actix_multipart::Multipart;
use futures_util::StreamExt;
use serde::{Deserialize, Serialize};
use serde_json::json;
use crate::state::AppState;

#[derive(Deserialize)]
pub struct MagnetInput {
    pub magnet: String,
    pub download_path: Option<String>,
    pub label: Option<String>,
    pub start: Option<bool>,
}

#[derive(Deserialize)]
pub struct DeleteQuery {
    pub delete_files: Option<bool>,
}

#[derive(Deserialize)]
pub struct PriorityInput {
    pub file_index: usize,
    pub priority: String,
}

pub async fn list_torrents(state: web::Data<AppState>) -> HttpResponse {
    let torrents = state.engine.list_torrents().await;
    HttpResponse::Ok().json(json!({ "success": true, "data": torrents }))
}

pub async fn add_magnet(state: web::Data<AppState>, body: web::Json<MagnetInput>) -> HttpResponse {
    let default_path = get_default_download_path(&state).await;
    let path = body.download_path.clone().unwrap_or(default_path);

    match state.engine.add_magnet(&body.magnet, &path, body.label.clone()).await {
        Ok(info) => {
            save_torrent_to_db(&state, &info, Some(&body.magnet), None).await;
            HttpResponse::Ok().json(json!({ "success": true, "data": info }))
        }
        Err(e) => HttpResponse::BadRequest().json(json!({ "success": false, "error": e.to_string() })),
    }
}

pub async fn add_torrent_file(state: web::Data<AppState>, mut payload: Multipart) -> HttpResponse {
    let mut file_data: Option<Vec<u8>> = None;
    let mut download_path: Option<String> = None;
    let mut label: Option<String> = None;

    while let Some(item) = payload.next().await {
        let mut field = match item {
            Ok(f) => f,
            Err(_) => continue,
        };
        let name = field.name().to_string();
        let mut data = Vec::new();
        while let Some(chunk) = field.next().await {
            if let Ok(bytes) = chunk {
                data.extend_from_slice(&bytes);
            }
        }
        match name.as_str() {
            "file" => file_data = Some(data),
            "download_path" => download_path = Some(String::from_utf8_lossy(&data).to_string()),
            "label" => label = Some(String::from_utf8_lossy(&data).to_string()),
            _ => {}
        }
    }

    let data = match file_data {
        Some(d) => d,
        None => return HttpResponse::BadRequest().json(json!({ "success": false, "error": "No file provided" })),
    };

    let default_path = get_default_download_path(&state).await;
    let path = download_path.unwrap_or(default_path);

    match state.engine.add_torrent_file(data.clone(), &path, label.clone()).await {
        Ok(info) => {
            save_torrent_to_db(&state, &info, None, Some(&data)).await;
            HttpResponse::Ok().json(json!({ "success": true, "data": info }))
        }
        Err(e) => HttpResponse::BadRequest().json(json!({ "success": false, "error": e.to_string() })),
    }
}

pub async fn get_torrent(state: web::Data<AppState>, path: web::Path<String>) -> HttpResponse {
    let id = path.into_inner();
    match state.engine.get_torrent(&id).await {
        Some(info) => HttpResponse::Ok().json(json!({ "success": true, "data": info })),
        None => HttpResponse::NotFound().json(json!({ "success": false, "error": "Torrent not found" })),
    }
}

pub async fn delete_torrent(
    state: web::Data<AppState>,
    path: web::Path<String>,
    query: web::Query<DeleteQuery>,
) -> HttpResponse {
    let id = path.into_inner();
    match state.engine.remove_torrent(&id).await {
        Ok(_) => {
            let _ = sqlx::query("DELETE FROM torrents WHERE id = ?")
                .bind(&id)
                .execute(&state.db)
                .await;
            HttpResponse::Ok().json(json!({ "success": true }))
        }
        Err(e) => HttpResponse::InternalServerError().json(json!({ "success": false, "error": e.to_string() })),
    }
}

pub async fn pause_torrent(state: web::Data<AppState>, path: web::Path<String>) -> HttpResponse {
    let id = path.into_inner();
    match state.engine.pause_torrent(&id).await {
        Ok(_) => {
            let _ = sqlx::query("UPDATE torrents SET status = 'paused' WHERE id = ?")
                .bind(&id)
                .execute(&state.db)
                .await;
            HttpResponse::Ok().json(json!({ "success": true }))
        }
        Err(e) => HttpResponse::InternalServerError().json(json!({ "success": false, "error": e.to_string() })),
    }
}

pub async fn resume_torrent(state: web::Data<AppState>, path: web::Path<String>) -> HttpResponse {
    let id = path.into_inner();
    match state.engine.resume_torrent(&id).await {
        Ok(_) => {
            let _ = sqlx::query("UPDATE torrents SET status = 'downloading' WHERE id = ?")
                .bind(&id)
                .execute(&state.db)
                .await;
            HttpResponse::Ok().json(json!({ "success": true }))
        }
        Err(e) => HttpResponse::InternalServerError().json(json!({ "success": false, "error": e.to_string() })),
    }
}

pub async fn get_peers(state: web::Data<AppState>, path: web::Path<String>) -> HttpResponse {
    let id = path.into_inner();
    if let Some(info) = state.engine.get_torrent(&id).await {
        HttpResponse::Ok().json(json!({ "success": true, "data": [] }))
    } else {
        HttpResponse::NotFound().json(json!({ "success": false, "error": "Torrent not found" }))
    }
}

pub async fn get_files(state: web::Data<AppState>, path: web::Path<String>) -> HttpResponse {
    let id = path.into_inner();
    match state.engine.get_torrent(&id).await {
        Some(info) => HttpResponse::Ok().json(json!({ "success": true, "data": info.files })),
        None => HttpResponse::NotFound().json(json!({ "success": false, "error": "Torrent not found" })),
    }
}

pub async fn set_priority(
    state: web::Data<AppState>,
    path: web::Path<String>,
    body: web::Json<PriorityInput>,
) -> HttpResponse {
    HttpResponse::Ok().json(json!({ "success": true }))
}

async fn get_default_download_path(state: &AppState) -> String {
    sqlx::query_scalar::<_, String>("SELECT value FROM settings WHERE key = 'download_path'")
        .fetch_optional(&state.db)
        .await
        .ok()
        .flatten()
        .unwrap_or_else(|| {
            let home = std::env::var("HOME")
                .or_else(|_| std::env::var("USERPROFILE"))
                .unwrap_or_else(|_| ".".to_string());
            format!("{}/Downloads/Ferroload", home)
        })
}

async fn save_torrent_to_db(state: &AppState, info: &ferroload_engine::TorrentInfo, magnet: Option<&str>, file: Option<&[u8]>) {
    let _ = sqlx::query(
        "INSERT OR IGNORE INTO torrents (id, name, info_hash, magnet_uri, torrent_file, download_path, added_at, label, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(&info.id)
    .bind(&info.name)
    .bind(&info.info_hash)
    .bind(magnet)
    .bind(file)
    .bind(&info.download_path)
    .bind(info.added_at)
    .bind(&info.label)
    .bind(info.status.to_string())
    .execute(&state.db)
    .await;
}
