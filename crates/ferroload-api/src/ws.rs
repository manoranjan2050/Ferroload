use actix_web::{web, HttpRequest, HttpResponse};
use actix_ws::Message;
use ferroload_engine::TorrentEvent;
use crate::state::AppState;

pub async fn ws_handler(
    req: HttpRequest,
    body: web::Payload,
    state: web::Data<AppState>,
) -> Result<HttpResponse, actix_web::Error> {
    let (response, mut session, mut msg_stream) = actix_ws::handle(&req, body)?;

    let mut event_rx = state.event_tx.subscribe();

    actix_web::rt::spawn(async move {
        loop {
            tokio::select! {
                Ok(event) = event_rx.recv() => {
                    if let Ok(text) = serde_json::to_string(&event) {
                        if session.text(text).await.is_err() {
                            break;
                        }
                    }
                }
                Some(Ok(msg)) = msg_stream.recv() => {
                    match msg {
                        Message::Ping(bytes) => {
                            if session.pong(&bytes).await.is_err() {
                                break;
                            }
                        }
                        Message::Close(_) => break,
                        _ => {}
                    }
                }
                else => break,
            }
        }
        let _ = session.close(None).await;
    });

    Ok(response)
}
