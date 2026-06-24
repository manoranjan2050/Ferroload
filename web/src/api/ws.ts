import type { WsEvent } from '../types'

type Listener = (event: WsEvent) => void

class WsClient {
  private ws: WebSocket | null = null
  private listeners = new Set<Listener>()
  private retryDelay = 1000
  private shouldReconnect = true

  connect() {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const url = `${proto}//${window.location.host}/ws`
    this.ws = new WebSocket(url)

    this.ws.onmessage = (e) => {
      try {
        const event: WsEvent = JSON.parse(e.data)
        this.listeners.forEach((l) => l(event))
      } catch {}
    }

    this.ws.onclose = () => {
      if (this.shouldReconnect) {
        setTimeout(() => {
          this.retryDelay = Math.min(this.retryDelay * 2, 30000)
          this.connect()
        }, this.retryDelay)
      }
    }

    this.ws.onopen = () => {
      this.retryDelay = 1000
    }
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  disconnect() {
    this.shouldReconnect = false
    this.ws?.close()
  }
}

export const wsClient = new WsClient()
