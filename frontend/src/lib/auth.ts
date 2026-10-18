/**
 * Local-First Ephemeral Authentication Client.
 *
 * Security Guarantee:
 * - Token is held ONLY in JS heap memory.
 * - NEVER stored in localStorage, sessionStorage, cookies, or IndexedDB.
 * - In Tauri desktop mode: requested from Rust shell via IPC command `get_session_token`.
 * - In browser development mode: falls back to dev ephemeral token.
 */

const DEV_FALLBACK_TOKEN = 'dev-ephemeral-auth-token-32-bytes-local'

let inMemoryToken: string | null = null

/**
 * Check if running within a Tauri 2 desktop webview.
 */
export function isTauriEnvironment(): boolean {
  if (typeof window === 'undefined') return false
  return '__TAURI_INTERNALS__' in window || '__TAURI__' in window
}

/**
 * Retrieve the active ephemeral auth token without persistent caching.
 */
export async function getAuthToken(): Promise<string> {
  if (inMemoryToken) {
    return inMemoryToken
  }

  if (isTauriEnvironment()) {
    try {
      const { invoke } = await import('@tauri-apps/api/core')
      const token = await invoke<string>('get_session_token')
      if (token && typeof token === 'string' && token.trim().length > 0) {
        inMemoryToken = token
        return inMemoryToken
      }
    } catch (err) {
      console.warn('Tauri get_session_token IPC unavailable, using dev fallback token:', err)
    }
  }

  // Browser development mode fallback
  inMemoryToken = DEV_FALLBACK_TOKEN
  return inMemoryToken
}

/**
 * Reset in-memory token (e.g., on session teardown or test reset).
 */
export function resetInMemoryToken(): void {
  inMemoryToken = null
}

/**
 * Perform authenticated fetch to local FastAPI backend.
 * Automatically injects the in-memory bearer token into the Authorization header.
 */
export async function apiFetch(input: string | URL | Request, init?: RequestInit): Promise<Response> {
  const token = await getAuthToken()
  const headers = new Headers(init?.headers)
  headers.set('Authorization', `Bearer ${token}`)

  return fetch(input, {
    ...init,
    headers,
  })
}
