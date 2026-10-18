import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { App } from './App'

describe('App Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('renders application branding and header elements', async () => {
    // Mock successful healthcheck fetch
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'healthy',
        version: '0.1.0',
        database: 'connected',
        ai_available: true,
        active_model: 'gemma2:2b',
      }),
    })
    vi.stubGlobal('fetch', mockFetch)

    render(<App />)

    expect(screen.getByText('MAX')).toBeInTheDocument()
    expect(screen.getByText('Milestone 1 Dev')).toBeInTheDocument()
    expect(screen.getByText('Adaptive Productivity Desktop App')).toBeInTheDocument()
    expect(screen.getByText('Task Management')).toBeInTheDocument()
    expect(screen.getByText('Goals & Projects')).toBeInTheDocument()
    expect(screen.getByText('Habits & Focus')).toBeInTheDocument()
    expect(screen.getByText('Insights & Reflection')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('Healthy')).toBeInTheDocument()
    })
  })

  it('renders waiting state when backend is unreachable', async () => {
    // Mock network failure
    const mockFetch = vi.fn().mockRejectedValue(new Error('Connection refused'))
    vi.stubGlobal('fetch', mockFetch)

    render(<App />)

    await waitFor(() => {
      expect(screen.getByText('Waiting for backend')).toBeInTheDocument()
      expect(screen.getByText('Backend not currently running on 127.0.0.1:24125')).toBeInTheDocument()
    })
  })
})
