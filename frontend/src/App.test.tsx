import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { App } from './App'

describe('App Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('renders application branding, shadcn components, and truthful health data', async () => {
    // Mock truthful Milestone 1 healthcheck fetch: unconfigured DB, unconfigured AI
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'healthy',
        version: '0.1.0',
        database: 'unconfigured',
        ai_available: false,
        active_model: null,
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
      expect(screen.getAllByText(/healthy/i).length).toBeGreaterThanOrEqual(1)
      expect(screen.getByText((content) => content.includes('unconfigured'))).toBeInTheDocument()
      expect(screen.getByText((content) => content.includes('(M6)'))).toBeInTheDocument()
    })
  })

  it('renders waiting state when backend is unreachable', async () => {
    // Mock network failure
    const mockFetch = vi.fn().mockRejectedValue(new Error('Connection refused'))
    vi.stubGlobal('fetch', mockFetch)

    render(<App />)

    await waitFor(() => {
      expect(screen.getByText('Waiting for backend')).toBeInTheDocument()
      expect(screen.getByText(/Backend not currently running on 127\.0\.0\.1:24125/i)).toBeInTheDocument()
    })
  })
})
