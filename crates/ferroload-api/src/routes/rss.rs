use actix_web::{web, HttpResponse};
use serde::{Deserialize, Serialize};
use serde_json::json;
use uuid::Uuid;
use crate::state::AppState;

#[derive(Deserialize)]
pub struct NewFeed {
    pub url: String,
    pub name: String,
    pub filter_regex: Option<String>,
    pub download_path: Option<String>,
}

#[derive(Serialize, sqlx::FromRow)]
pub struct RssFeed {
    pub id: String,
    pub url: String,
    pub name: String,
    pub filter_regex: Option<String>,
    pub download_path: Option<String>,
    pub last_checked: Option<i64>,
    pub enabled: i64,
}

pub async fn list_feeds(state: web::Data<AppState>) -> HttpResponse {
    match sqlx::query_as::<_, RssFeed>("SELECT * FROM rss_feeds")
        .fetch_all(&state.db)
        .await
    {
        Ok(feeds) => HttpResponse::Ok().json(json!({ "success": true, "data": feeds })),
        Err(e) => HttpResponse::InternalServerError().json(json!({ "success": false, "error": e.to_string() })),
    }
}

pub async fn add_feed(state: web::Data<AppState>, body: web::Json<NewFeed>) -> HttpResponse {
    let id = Uuid::new_v4().to_string();
    match sqlx::query(
        "INSERT INTO rss_feeds (id, url, name, filter_regex, download_path, enabled) VALUES (?, ?, ?, ?, ?, 1)"
    )
    .bind(&id)
    .bind(&body.url)
    .bind(&body.name)
    .bind(&body.filter_regex)
    .bind(&body.download_path)
    .execute(&state.db)
    .await
    {
        Ok(_) => HttpResponse::Ok().json(json!({ "success": true, "data": { "id": id } })),
        Err(e) => HttpResponse::InternalServerError().json(json!({ "success": false, "error": e.to_string() })),
    }
}

pub async fn delete_feed(state: web::Data<AppState>, path: web::Path<String>) -> HttpResponse {
    let id = path.into_inner();
    let _ = sqlx::query("DELETE FROM rss_feeds WHERE id = ?")
        .bind(&id)
        .execute(&state.db)
        .await;
    HttpResponse::Ok().json(json!({ "success": true }))
}

pub async fn check_feeds(state: web::Data<AppState>) -> HttpResponse {
    let now = chrono::Utc::now().timestamp();
    let _ = sqlx::query("UPDATE rss_feeds SET last_checked = ? WHERE enabled = 1")
        .bind(now)
        .execute(&state.db)
        .await;
    HttpResponse::Ok().json(json!({ "success": true, "data": { "checked_at": now } }))
}
