import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getAuthToken, resetInMemoryToken, isTauriEnvironment, apiFetch } from './auth'

describe('auth module', () => {
  beforeEach(() => {
    resetInMemoryToken()
    vi.restoreAllMocks()
    // Clean window object
    delete (window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__
    delete (window as unknown as { __TAURI__?: unknown }).__TAURI__
  })

  it('detects non-Tauri browser environment correctly', () => {
    expect(isTauriEnvironment()).toBe(false)
  })

  it('falls back to dev ephemeral token in browser environment', async () => {
    const token = await getAuthToken()
    expect(token).toBe('dev-ephemeral-auth-token-32-bytes-local')
  })

  it('caches the token in memory across calls without persistent storage', async () => {
    const token1 = await getAuthToken()
    const token2 = await getAuthToken()
    expect(token1).toBe(token2)
    expect(sessionStorage.getItem('auth_token')).toBeNull()
    expect(localStorage.getItem('auth_token')).toBeNull()
  })

  it('detects Tauri environment when __TAURI_INTERNALS__ is present', () => {
    Object.assign(window, { __TAURI_INTERNALS__: {} })
    expect(isTauriEnvironment()).toBe(true)
  })

  it('attaches Authorization Bearer token to apiFetch calls', async () => {
    const mockFetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ status: 'ok' })))
    global.fetch = mockFetch

    await apiFetch('http://127.0.0.1:24125/api/v1/health')

    expect(mockFetch).toHaveBeenCalledTimes(1)
    const callArgs = mockFetch.mock.calls[0]
    const headers = callArgs[1]?.headers as Headers
    expect(headers.get('Authorization')).toBe('Bearer dev-ephemeral-auth-token-32-bytes-local')
  })
})
