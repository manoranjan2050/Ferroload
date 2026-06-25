use actix_web::{web, HttpResponse};
use serde::Deserialize;
use serde_json::json;
use crate::state::AppState;

#[derive(Deserialize)]
pub struct ChatInput {
    pub message: String,
    pub model: Option<String>,
    pub context: Option<String>,
}

pub async fn ai_status(state: web::Data<AppState>) -> HttpResponse {
    let ollama_url = get_ollama_url(&state).await;
    let client = reqwest::Client::new();
    match client.get(format!("{}/api/tags", ollama_url)).timeout(std::time::Duration::from_secs(2)).send().await {
        Ok(r) if r.status().is_success() => {
            let models: serde_json::Value = r.json().await.unwrap_or(json!({}));
            HttpResponse::Ok().json(json!({ "success": true, "data": { "available": true, "models": models } }))
        }
        _ => HttpResponse::Ok().json(json!({ "success": true, "data": { "available": false } })),
    }
}

pub async fn ai_chat(state: web::Data<AppState>, body: web::Json<ChatInput>) -> HttpResponse {
    let ollama_url = get_ollama_url(&state).await;
    let model = body.model.clone().unwrap_or_else(|| "llama3".to_string());

    let torrents = state.engine.list_torrents().await;
    let torrent_context = serde_json::to_string(&torrents).unwrap_or_default();

    let system_prompt = format!(
        "You are a helpful assistant for Ferroload, a BitTorrent client. Current torrents: {}",
        torrent_context
    );

    let payload = json!({
        "model": model,
        "messages": [
            { "role": "system", "content": system_prompt },
            { "role": "user", "content": body.message }
        ],
        "stream": false
    });

    let client = reqwest::Client::new();
    match client
        .post(format!("{}/api/chat", ollama_url))
        .json(&payload)
        .timeout(std::time::Duration::from_secs(60))
        .send()
        .await
    {
        Ok(r) => {
            let response: serde_json::Value = r.json().await.unwrap_or(json!({}));
            let content = response["message"]["content"].as_str().unwrap_or("").to_string();
            HttpResponse::Ok().json(json!({ "success": true, "data": { "response": content } }))
        }
        Err(e) => HttpResponse::ServiceUnavailable().json(json!({ "success": false, "error": e.to_string() })),
    }
}

async fn get_ollama_url(state: &AppState) -> String {
    sqlx::query_scalar::<_, String>("SELECT value FROM settings WHERE key = 'ollama_url'")
        .fetch_optional(&state.db)
        .await
        .ok()
        .flatten()
        .unwrap_or_else(|| "http://localhost:11434".to_string())
}
