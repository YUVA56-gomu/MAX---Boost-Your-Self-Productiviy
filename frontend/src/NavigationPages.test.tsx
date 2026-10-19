import { render, screen, waitFor, within } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { App } from './App'

describe('MAX Sidebar Navigation & Canvases (Goals, Habits, Focus, Insights, Notes)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()

    const mockFetch = vi.fn().mockImplementation((url: string | URL, options?: RequestInit) => {
      const urlStr = url.toString()

      // Health
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

      // Workspaces
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

      // Tasks
      if (urlStr.includes('/tasks')) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            {
              id: 'task-1',
              workspace_id: 'ws-1',
              title: 'Build Sidebar Canvases',
              status: 'in_progress',
              priority: 'high',
              energy_level: 4,
              estimated_minutes: 60,
              actual_minutes: 25,
              subtask_count: 2,
              completed_subtask_count: 1,
              position: 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ],
        })
      }

      // Goals
      if (urlStr.includes('/goals')) {
        if (options?.method === 'POST') {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              id: 'goal-2',
              workspace_id: 'ws-1',
              title: 'Launch MAX on Hacktoberfest',
              goal_type: 'short_term',
              progress_percentage: 0,
              status: 'in_progress',
              milestones: [],
            }),
          })
        }
        return Promise.resolve({
          ok: true,
          json: async () => [
            {
              id: 'goal-1',
              workspace_id: 'ws-1',
              title: 'Ship Local-First MVP',
              goal_type: 'short_term',
              progress_percentage: 67,
              status: 'in_progress',
              milestones: [
                { id: 'm-1', goal_id: 'goal-1', title: 'Complete Dual-Runtime', is_completed: true, position: 0 },
                { id: 'm-2', goal_id: 'goal-1', title: 'Connect Local Gemma AI', is_completed: true, position: 1 },
                { id: 'm-3', goal_id: 'goal-1', title: 'Activate All Canvases', is_completed: false, position: 2 },
              ],
            },
          ],
        })
      }

      // Habits
      if (urlStr.includes('/habits')) {
        if (urlStr.includes('/log')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              id: 'log-1',
              habit_id: 'habit-1',
              log_date: '2026-10-19',
              completed: true,
            }),
          })
        }
        return Promise.resolve({
          ok: true,
          json: async () => [
            {
              id: 'habit-1',
              workspace_id: 'ws-1',
              title: 'Morning Deep Work',
              frequency: 'daily',
              time_of_day: 'morning',
              current_streak: 5,
              best_streak: 12,
              is_active: true,
            },
            {
              id: 'habit-2',
              workspace_id: 'ws-1',
              title: 'Review Insights',
              frequency: 'daily',
              time_of_day: 'evening',
              current_streak: 3,
              best_streak: 7,
              is_active: true,
            },
          ],
        })
      }

      // Focus
      if (urlStr.includes('/focus/sessions')) {
        if (urlStr.includes('/start')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              id: 'session-live',
              workspace_id: 'ws-1',
              session_type: 'pomodoro',
              started_at: new Date().toISOString(),
              duration_seconds: 0,
              interruption_count: 0,
              is_completed: false,
            }),
          })
        }
        if (urlStr.includes('/complete')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              id: 'session-live',
              workspace_id: 'ws-1',
              session_type: 'pomodoro',
              started_at: new Date().toISOString(),
              duration_seconds: 1500,
              interruption_count: 0,
              is_completed: true,
            }),
          })
        }
        return Promise.resolve({
          ok: true,
          json: async () => [
            {
              id: 'session-1',
              workspace_id: 'ws-1',
              session_type: 'pomodoro',
              started_at: new Date().toISOString(),
              duration_seconds: 1500,
              interruption_count: 0,
              energy_before: 4,
              energy_after: 5,
              is_completed: true,
              notes: 'Finished sidebar architecture design',
            },
          ],
        })
      }

      // Insights Workload & Blockers & Daily Review
      if (urlStr.includes('/insights/workload')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            range: '7d',
            total_planned_minutes: 180,
            total_completed_minutes: 125,
            estimation_accuracy_ratio: 0.69,
            tasks_completed_count: 4,
            tasks_rolled_over_count: 2,
            deep_work_focus_hours: 4.2,
          }),
        })
      }

      if (urlStr.includes('/insights/blockers')) {
        if (options?.method === 'POST') {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              id: 'blocker-2',
              workspace_id: 'ws-1',
              title: 'API rate limiting on external feed',
              category: 'external',
              status: 'active',
              created_at: new Date().toISOString(),
            }),
          })
        }
        return Promise.resolve({
          ok: true,
          json: async () => [
            {
              id: 'blocker-1',
              workspace_id: 'ws-1',
              title: 'Fix non-functional sidebar buttons',
              category: 'technical',
              status: 'active',
              created_at: new Date().toISOString(),
            },
          ],
        })
      }

      if (urlStr.includes('/insights/daily-review')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            id: 'review-1',
            workspace_id: 'ws-1',
            review_date: '2026-10-19',
            wins: 'Implemented all 5 sidebar canvases with SQLite persistence',
            challenges: 'Time pressure for Hacktoberfest submission',
            tomorrow_priorities: 'Polish packaging and verify installer',
            mood_score: 5,
            energy_score: 5,
            notes: 'High velocity day',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }),
        })
      }

      // Notes
      if (urlStr.includes('/notes')) {
        if (options?.method === 'POST') {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              id: 'note-2',
              workspace_id: 'ws-1',
              title: 'Hacktoberfest Architecture Plan',
              content_markdown: 'Dual-runtime architecture with [[Local AI]] and Tauri 2',
              is_pinned: true,
              is_archived: false,
              outgoing_link_count: 1,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }),
          })
        }
        return Promise.resolve({
          ok: true,
          json: async () => [
            {
              id: 'note-1',
              workspace_id: 'ws-1',
              title: 'System Architecture & Sovereignty',
              content_markdown: 'MAX operates 100% offline with SQLite in WAL mode and [[Ollama]] sidecar.',
              is_pinned: true,
              is_archived: false,
              outgoing_link_count: 1,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ],
        })
      }

      return Promise.resolve({ ok: true, json: async () => [] })
    })

    vi.stubGlobal('fetch', mockFetch)
  })

  it('navigates to Goals Canvas and displays genuine backend goals and milestones', async () => {
    render(<App />)

    // Wait for initial render to complete
    await screen.findByRole('heading', { name: "Today's Tasks" })

    // Click Goals nav in Sidebar
    const sidebar = screen.getByLabelText('Sidebar Navigation')
    const goalsBtn = within(sidebar).getByText('Goals')
    ;(goalsBtn.closest('button') || goalsBtn).click()

    await waitFor(() => {
      expect(screen.getByTestId('goals-canvas')).toBeInTheDocument()
      expect(screen.getByText('Strategic Goals & Milestones')).toBeInTheDocument()
      expect(screen.getByText('Ship Local-First MVP')).toBeInTheDocument()
      expect(screen.getByText('Complete Dual-Runtime')).toBeInTheDocument()
      expect(screen.getByText('Connect Local Gemma AI')).toBeInTheDocument()
      expect(screen.getByText('Activate All Canvases')).toBeInTheDocument()
    })
  })

  it('navigates to Habits Canvas and displays streaks and completion check-in', async () => {
    render(<App />)

    await screen.findByRole('heading', { name: "Today's Tasks" })

    const sidebar = screen.getByLabelText('Sidebar Navigation')
    const habitsBtn = within(sidebar).getByText('Habits')
    ;(habitsBtn.closest('button') || habitsBtn).click()

    await waitFor(() => {
      expect(screen.getByTestId('habits-canvas')).toBeInTheDocument()
      expect(screen.getByText('Habits & Daily Consistency')).toBeInTheDocument()
      expect(screen.getByText('Morning Deep Work')).toBeInTheDocument()
      expect(screen.getByText('Review Insights')).toBeInTheDocument()
      expect(screen.getByText('5d')).toBeInTheDocument()
    })
  })

  it('navigates to Focus Canvas and displays Pomodoro timer with mode toggles and session history', async () => {
    render(<App />)

    await screen.findByRole('heading', { name: "Today's Tasks" })

    const sidebar = screen.getByLabelText('Sidebar Navigation')
    const focusBtn = within(sidebar).getByText('Focus')
    ;(focusBtn.closest('button') || focusBtn).click()

    await waitFor(() => {
      const canvas = screen.getByTestId('focus-canvas')
      expect(canvas).toBeInTheDocument()
      expect(within(canvas).getByText(/Focus Engine/i)).toBeInTheDocument()
      expect(screen.getByText('Pomodoro (25m)')).toBeInTheDocument()
      expect(screen.getByText('Deep Work (50m)')).toBeInTheDocument()
      expect(screen.getByText('Stopwatch')).toBeInTheDocument()
      expect(screen.getByText('Finished sidebar architecture design')).toBeInTheDocument()
    })
  })

  it('navigates to Insights Canvas and displays calculated metrics, active blockers, and daily review', async () => {
    render(<App />)

    await screen.findByRole('heading', { name: "Today's Tasks" })

    const sidebar = screen.getByLabelText('Sidebar Navigation')
    const insightsBtn = within(sidebar).getByText('Insights')
    ;(insightsBtn.closest('button') || insightsBtn).click()

    await waitFor(() => {
      expect(screen.getByTestId('insights-canvas')).toBeInTheDocument()
      expect(screen.getByText('Insights & Reflection')).toBeInTheDocument()
      expect(screen.getByText('125m')).toBeInTheDocument()
      expect(screen.getByText('4.2h')).toBeInTheDocument()
      expect(screen.getByText('Fix non-functional sidebar buttons')).toBeInTheDocument()
      expect(screen.getByText('Implemented all 5 sidebar canvases with SQLite persistence')).toBeInTheDocument()
    })
  })

  it('navigates to Notes Canvas and displays notes index, markdown editor, and character counter', async () => {
    render(<App />)

    await screen.findByRole('heading', { name: "Today's Tasks" })

    const sidebar = screen.getByLabelText('Sidebar Navigation')
    const notesBtn = within(sidebar).getByText('Notes')
    ;(notesBtn.closest('button') || notesBtn).click()

    await waitFor(() => {
      expect(screen.getByTestId('notes-canvas')).toBeInTheDocument()
      expect(screen.getByText('Contextual Notes')).toBeInTheDocument()
      expect(screen.getByDisplayValue('System Architecture & Sovereignty')).toBeInTheDocument()
      expect(screen.getByDisplayValue(/MAX operates 100% offline with SQLite/i)).toBeInTheDocument()
      expect(screen.getByText('1 linked references')).toBeInTheDocument()
    })
  })

  it('navigates back to Home and restores Today Tasks and dashboard widgets', async () => {
    render(<App />)

    await screen.findByRole('heading', { name: "Today's Tasks" })

    const sidebar = screen.getByLabelText('Sidebar Navigation')
    const goalsBtn = within(sidebar).getByText('Goals')
    ;(goalsBtn.closest('button') || goalsBtn).click()

    await waitFor(() => {
      expect(screen.getByTestId('goals-canvas')).toBeInTheDocument()
    })

    const homeBtn = within(sidebar).getByText('Home')
    ;(homeBtn.closest('button') || homeBtn).click()

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: "Today's Tasks" })).toBeInTheDocument()
      expect(screen.getByText('Velocity & Workload')).toBeInTheDocument()
    })
  })
})
