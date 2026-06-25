use actix_web::{web, HttpResponse};
use serde_json::{json, Value};
use std::collections::HashMap;
use ferroload_engine::EngineConfig;
use crate::state::AppState;

pub async fn get_settings(state: web::Data<AppState>) -> HttpResponse {
    match sqlx::query_as::<_, (String, String)>("SELECT key, value FROM settings")
        .fetch_all(&state.db)
        .await
    {
        Ok(rows) => {
            let map: HashMap<String, Value> = rows
                .into_iter()
                .map(|(k, v)| {
                    let val: Value = serde_json::from_str(&v).unwrap_or(Value::String(v));
                    (k, val)
                })
                .collect();
            HttpResponse::Ok().json(json!({ "success": true, "data": map }))
        }
        Err(e) => HttpResponse::InternalServerError().json(json!({ "success": false, "error": e.to_string() })),
    }
}

pub async fn update_settings(state: web::Data<AppState>, body: web::Json<HashMap<String, Value>>) -> HttpResponse {
    for (key, value) in body.iter() {
        let str_val = match value {
            Value::String(s) => s.clone(),
            other => other.to_string(),
        };
        let _ = sqlx::query("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)")
            .bind(key)
            .bind(str_val)
            .execute(&state.db)
            .await;
    }

    // Sync updated settings → engine config (Features 2, 4, 5, 6, 7)
    sync_engine_config(&state).await;

    HttpResponse::Ok().json(json!({ "success": true }))
}

async fn sync_engine_config(state: &AppState) {
    let rows = sqlx::query_as::<_, (String, String)>("SELECT key, value FROM settings")
        .fetch_all(&state.db)
        .await
        .unwrap_or_default();

    let map: HashMap<String, String> = rows.into_iter().collect();
    let get = |k: &str, def: &str| map.get(k).map(|s| s.as_str()).unwrap_or(def).to_string();
    let get_bool = |k: &str, def: bool| get(k, if def { "true" } else { "false" }) == "true";
    let get_u64 = |k: &str, def: u64| get(k, &def.to_string()).parse::<u64>().unwrap_or(def);
    let get_u32 = |k: &str, def: u32| get(k, &def.to_string()).parse::<u32>().unwrap_or(def);

    let cfg = EngineConfig {
        max_connections_per_torrent: get_u32("max_connections_per_torrent", 80),
        max_total_connections: get_u32("max_total_connections", 500),
        dht_enabled: get_bool("dht_enabled", true),
        pex_enabled: get_bool("pex_enabled", true),
        lsd_enabled: get_bool("lsd_enabled", true),
        max_upload_bps: get_u64("max_upload_speed_kbps", 0) * 1024,
        max_download_bps: get_u64("max_download_speed_kbps", 0) * 1024,
        write_buffer_bytes: get_u64("write_buffer_mb", 4) * 1024 * 1024,
        utp_enabled: get_bool("utp_enabled", true),
    };

    state.engine.apply_config(cfg).await;
}
