import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { App } from './App'

describe('App Component (Milestone 4 Dashboard)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('renders application branding, 3-column shell, and dashboard components when backend is healthy', async () => {
    // Mock backend responses for health, workspaces, tasks, insights, goals, habits
    const mockFetch = vi.fn().mockImplementation((url: string | URL) => {
      const urlStr = url.toString()
      if (urlStr.includes('/health')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            status: 'healthy',
            version: '0.1.0',
            database: 'connected',
            ai_available: false,
            active_model: null,
          }),
        })
      }
      if (urlStr.includes('/workspaces')) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            {
              id: 'ws-1',
              name: 'Personal',
              slug: 'personal',
              color: '#6366F1',
              is_default: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ],
        })
      }
      if (urlStr.includes('/tasks')) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            {
              id: 'task-1',
              workspace_id: 'ws-1',
              title: 'Finish dashboard architecture',
              description: 'Implement vertical slice with real API persistence',
              status: 'todo',
              priority: 'high',
              energy_level: 4,
              estimated_minutes: 45,
              actual_minutes: 0,
              subtask_count: 0,
              completed_subtask_count: 0,
              position: 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ],
        })
      }
      if (urlStr.includes('/insights/workload')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            range: '7d',
            total_planned_minutes: 90,
            total_completed_minutes: 60,
            estimation_accuracy_ratio: 0.67,
            tasks_completed_count: 3,
            tasks_rolled_over_count: 1,
            deep_work_focus_hours: 2.5,
          }),
        })
      }
      if (urlStr.includes('/goals')) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            {
              id: 'goal-1',
              workspace_id: 'ws-1',
              title: 'Ship Local-First MVP',
              horizon: 'short_term',
              progress_percentage: 50,
              status: 'in_progress',
            },
          ],
        })
      }
      if (urlStr.includes('/habits')) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            {
              id: 'habit-1',
              workspace_id: 'ws-1',
              title: 'Morning Deep Work',
              cadence: 'daily',
              current_streak: 5,
              best_streak: 7,
              is_active: true,
            },
          ],
        })
      }
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })

    vi.stubGlobal('fetch', mockFetch)

    render(<App />)

    // Shell Branding
    expect(screen.getByRole('img', { name: /max brand mark/i })).toBeInTheDocument()
    expect(screen.getByText('MAX')).toBeInTheDocument()
    expect(screen.getByText('v0.1.0')).toBeInTheDocument()
    expect(screen.getByText('Discipline today builds the freedom tomorrow.')).toBeInTheDocument()
    expect(screen.getByText(/Want to/i)).toBeInTheDocument()

    // Navigation Items
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getAllByText('Tasks').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Goals').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Habits').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Focus').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Insights')).toBeInTheDocument()
    expect(screen.getByText('Notes')).toBeInTheDocument()

    // Header Controls
    expect(screen.getByPlaceholderText('Search tasks, goals, or anything...')).toBeInTheDocument()
    expect(screen.getByText('New Task')).toBeInTheDocument()
    expect(screen.getAllByText('Yuvaraj').length).toBeGreaterThanOrEqual(1)

    // Dashboard Hero & Widgets
    expect(await screen.findByRole('heading', { name: "Today's Tasks" })).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getAllByText('Finish dashboard architecture').length).toBeGreaterThanOrEqual(1)
    })

    expect(screen.getByText('Focus Engine')).toBeInTheDocument()
    expect(screen.getByText('Velocity & Workload')).toBeInTheDocument()
  })

  it('navigates to Tasks Canvas when clicking Tasks in sidebar', async () => {
    const mockFetch = vi.fn().mockImplementation((url: string | URL) => {
      const urlStr = url.toString()
      if (urlStr.includes('/health')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ status: 'healthy', version: '0.1.0', database: 'connected', ai_available: false, active_model: null }),
        })
      }
      if (urlStr.includes('/workspaces')) {
        return Promise.resolve({
          ok: true,
          json: async () => [{ id: 'ws-1', name: 'Personal', slug: 'personal', color: '#6366F1', is_default: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }],
        })
      }
      if (urlStr.includes('/tasks')) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            {
              id: 'task-1',
              workspace_id: 'ws-1',
              title: 'Finish dashboard architecture',
              status: 'todo',
              priority: 'high',
              energy_level: 4,
              estimated_minutes: 45,
              actual_minutes: 0,
              subtask_count: 0,
              completed_subtask_count: 0,
              position: 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ],
        })
      }
      return Promise.resolve({ ok: true, json: async () => [] })
    })

    vi.stubGlobal('fetch', mockFetch)

    render(<App />)

    // Find Tasks nav button in sidebar and click it
    const tasksNavBtn = screen.getByText('Tasks', { selector: 'button *' }) || screen.getAllByText('Tasks')[0]
    tasksNavBtn.click()

    // Tasks Canvas should now be rendered
    await waitFor(() => {
      expect(screen.getByText('Tasks Canvas')).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'To Do' })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'In Progress' })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'Completed' })).toBeInTheDocument()
    })
  })

  it('navigates to AI Coach Canvas when clicking AI Coach in sidebar', async () => {
    const mockFetch = vi.fn().mockImplementation((url: string | URL) => {
      const urlStr = url.toString()
      if (urlStr.includes('/health')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            status: 'healthy',
            version: '0.1.0',
            database: 'connected',
            ai_available: true,
            active_model: 'gemma2:2b',
          }),
        })
      }
      if (urlStr.includes('/ai/status')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            enabled: true,
            available: true,
            active_model: 'gemma2:2b',
            base_url: 'http://127.0.0.1:11434',
            installed_models: ['gemma2:2b'],
          }),
        })
      }
      if (urlStr.includes('/workspaces')) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            {
              id: 'ws-1',
              name: 'Personal',
              slug: 'personal',
              is_default: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ],
        })
      }
      return Promise.resolve({ ok: true, json: async () => [] })
    })

    vi.stubGlobal('fetch', mockFetch)
    localStorage.setItem('max_ai_onboarding_completed', 'true')
    render(<App />)

    // Wait for initial render
    await waitFor(() => {
      expect(screen.getAllByText('AI Coach').length).toBeGreaterThan(0)
    })

    const aiCoachNavBtn = screen.getAllByText('AI Coach')[0]
    aiCoachNavBtn.click()

    // AI Coach Canvas should now be rendered
    await waitFor(() => {
      expect(screen.getByTestId('ai-coach-canvas')).toBeInTheDocument()
      expect(screen.getByText('MAX Local AI Intelligence')).toBeInTheDocument()
    })
  })

  it('opens AI Onboarding Modal when clicking AI Coach if onboarding is not completed', async () => {
    localStorage.removeItem('max_ai_onboarding_completed')
    const mockFetch = vi.fn().mockImplementation((url: string | URL) => {
      const urlStr = url.toString()
      if (urlStr.includes('/health')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            status: 'healthy',
            version: '0.1.0',
            database: 'connected',
            ai_available: true,
            active_model: 'gemma2:2b',
          }),
        })
      }
      if (urlStr.includes('/workspaces')) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            {
              id: 'ws-1',
              name: 'Personal',
              slug: 'personal',
              is_default: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ],
        })
      }
      return Promise.resolve({ ok: true, json: async () => [] })
    })

    vi.stubGlobal('fetch', mockFetch)

    render(<App />)

    await waitFor(() => {
      expect(screen.getAllByText('AI Coach').length).toBeGreaterThan(0)
    })

    const aiCoachNavBtn = screen.getAllByText('AI Coach')[0]
    aiCoachNavBtn.click()

    // AI Onboarding Modal should now be opened
    await waitFor(() => {
      expect(screen.getByTestId('ai-onboarding-modal')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: "Let's advance with AI" })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Continue without AI' })).toBeInTheDocument()
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
