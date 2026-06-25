use actix_web::{web, App, HttpServer, HttpRequest, HttpResponse};
use include_dir::{include_dir, Dir};
use anyhow::Result;
use tracing::info;

use ferroload_engine::EngineSession;
use ferroload_api::{configure_routes, db::init_db, state::AppState, startup::restore_state};

static FRONTEND: Dir = include_dir!("$CARGO_MANIFEST_DIR/../../web/dist");

async fn serve_frontend(req: HttpRequest) -> HttpResponse {
    let path = req.path().trim_start_matches('/');
    let path = if path.is_empty() { "index.html" } else { path };

    if let Some(file) = FRONTEND.get_file(path) {
        HttpResponse::Ok()
            .content_type(mime_type(path))
            .body(file.contents())
    } else if let Some(index) = FRONTEND.get_file("index.html") {
        HttpResponse::Ok()
            .content_type("text/html; charset=utf-8")
            .body(index.contents())
    } else {
        HttpResponse::NotFound().body("Frontend not built. Run: cd web && npm install && npm run build")
    }
}

fn mime_type(path: &str) -> &'static str {
    if path.ends_with(".html")  { "text/html; charset=utf-8" }
    else if path.ends_with(".js")    { "application/javascript" }
    else if path.ends_with(".css")   { "text/css" }
    else if path.ends_with(".svg")   { "image/svg+xml" }
    else if path.ends_with(".png")   { "image/png" }
    else if path.ends_with(".ico")   { "image/x-icon" }
    else if path.ends_with(".woff2") { "font/woff2" }
    else if path.ends_with(".json")  { "application/json" }
    else { "application/octet-stream" }
}

#[tokio::main]
async fn main() -> Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::from_default_env()
                .add_directive("ferroload=info".parse().unwrap()),
        )
        .init();

    let data_dir = std::env::var("FERROLOAD_DATA_DIR").unwrap_or_else(|_| {
        let home = std::env::var("HOME")
            .or_else(|_| std::env::var("USERPROFILE"))
            .unwrap_or_else(|_| ".".to_string());
        format!("{}/.ferroload", home)
    });

    let port: u16 = std::env::var("FERROLOAD_PORT")
        .ok()
        .and_then(|p| p.parse().ok())
        .unwrap_or(7070);

    std::fs::create_dir_all(&data_dir)?;

    info!("Initializing database at {}/ferroload.db", data_dir);
    let db = init_db(&data_dir).await?;

    let default_download = sqlx::query_scalar::<_, String>(
        "SELECT value FROM settings WHERE key = 'download_path'",
    )
    .fetch_optional(&db)
    .await
    .ok()
    .flatten()
    .unwrap_or_else(|| {
        let home = std::env::var("HOME")
            .or_else(|_| std::env::var("USERPROFILE"))
            .unwrap_or_else(|_| ".".to_string());
        format!("{}/Downloads/Ferroload", home)
    });

    std::fs::create_dir_all(&default_download).ok();

    info!("Starting BitTorrent engine...");
    let engine = EngineSession::new(&default_download).await?;

    // ── Fix 1 + 2: restore persisted torrents & apply saved settings ──────────
    restore_state(&db, &engine).await;

    let state = web::Data::new(AppState::new(db, engine));
    let bind_addr = format!("0.0.0.0:{}", port);

    info!("Ferroload running at http://localhost:{}", port);
    println!("Ferroload running at http://localhost:{}", port);

    // Open browser
    #[cfg(target_os = "windows")]
    let _ = std::process::Command::new("cmd")
        .args(["/C", "start", &format!("http://localhost:{}", port)])
        .spawn();
    #[cfg(target_os = "macos")]
    let _ = std::process::Command::new("open")
        .arg(format!("http://localhost:{}", port))
        .spawn();
    #[cfg(target_os = "linux")]
    let _ = std::process::Command::new("xdg-open")
        .arg(format!("http://localhost:{}", port))
        .spawn();

    let state_clone = state.clone();
    HttpServer::new(move || {
        App::new()
            .app_data(state_clone.clone())
            .app_data(web::JsonConfig::default().limit(10_485_760))
            .configure(configure_routes)
            .default_service(web::get().to(serve_frontend))
    })
    .bind(&bind_addr)?
    .run()
    .await?;

    Ok(())
}
