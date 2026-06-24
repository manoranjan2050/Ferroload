use actix_web::{web, HttpResponse};
use serde_json::json;
use crate::state::AppState;

pub async fn get_stats(state: web::Data<AppState>) -> HttpResponse {
    let stats = state.engine.global_stats().await;
    HttpResponse::Ok().json(json!({ "success": true, "data": stats }))
}
