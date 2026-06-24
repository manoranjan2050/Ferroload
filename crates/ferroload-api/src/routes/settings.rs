use actix_web::{web, HttpResponse};
use serde_json::{json, Value};
use std::collections::HashMap;
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
    HttpResponse::Ok().json(json!({ "success": true }))
}
