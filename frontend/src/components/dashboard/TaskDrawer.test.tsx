import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TaskDrawer } from './TaskDrawer'
import type { Task, TaskHistoryEntry, TaskRecurrenceRule } from '@/lib/api'
import * as api from '@/lib/api'

vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>()
  return {
    ...actual,
    fetchTaskHistory: vi.fn(),
    fetchTaskRecurrence: vi.fn(),
    setTaskRecurrence: vi.fn(),
    deleteTaskRecurrence: vi.fn(),
  }
})

describe('TaskDrawer Component (Task 4.4 Details, Recurrence & History)', () => {
  const sampleTask: Task = {
    id: 'task-100',
    workspace_id: 'ws-1',
    title: 'Implement Local AI Agent',
    description: '### Acceptance Criteria\n- Connect to Ollama\n- Gemma 2 2B',
    status: 'in_progress',
    priority: 'high',
    energy_level: 5,
    estimated_minutes: 60,
    actual_minutes: 15,
    position: 0,
    subtask_count: 0,
    completed_subtask_count: 0,
    due_date: '2026-10-25T10:00:00Z',
    created_at: '2026-10-18T10:00:00Z',
    updated_at: '2026-10-18T12:00:00Z',
  }

  const sampleRecurrenceRule: TaskRecurrenceRule = {
    id: 'rec-1',
    workspace_id: 'ws-1',
    frequency: 'weekly',
    interval_days: 7,
    by_weekdays_json: '[0,2,4]',
    start_date: '2026-10-20',
    end_date: '2026-12-31',
    next_due_date: '2026-10-20',
    created_at: '2026-10-18T10:00:00Z',
  }

  const sampleHistory: TaskHistoryEntry[] = [
    {
      id: 'hist-1',
      task_id: 'task-100',
      changed_field: 'created',
      old_value: null,
      new_value: 'Implement Local AI Agent',
      timestamp: '2026-10-18T10:00:00Z',
    },
    {
      id: 'hist-2',
      task_id: 'task-100',
      changed_field: 'status',
      old_value: 'todo',
      new_value: 'in_progress',
      timestamp: '2026-10-18T11:00:00Z',
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(api.fetchTaskRecurrence).mockResolvedValue(null)
    vi.mocked(api.fetchTaskHistory).mockResolvedValue([])
  })

  it('renders Details tab with prefilled title and markdown description', () => {
    render(
      <TaskDrawer
        isOpen={true}
        onClose={vi.fn()}
        task={sampleTask}
        workspaceId="ws-1"
        onSaveTask={vi.fn()}
      />
    )

    expect(screen.getByText('Task Details')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Implement Local AI Agent')).toBeInTheDocument()
    expect(
      screen.getByDisplayValue(/Acceptance Criteria/)
    ).toBeInTheDocument()
  })

  it('switches to Recurrence tab and configures recurrence schedule', async () => {
    vi.mocked(api.setTaskRecurrence).mockResolvedValue(sampleRecurrenceRule)

    render(
      <TaskDrawer
        isOpen={true}
        onClose={vi.fn()}
        task={sampleTask}
        workspaceId="ws-1"
        onSaveTask={vi.fn()}
      />
    )

    // Switch to Recurrence tab
    const recurrenceTabBtn = screen.getByRole('button', { name: /recurrence/i })
    fireEvent.click(recurrenceTabBtn)

    await waitFor(() => {
      expect(screen.getByText(/automate repetition/i)).toBeInTheDocument()
    })

    // Select frequency
    const freqSelect = screen.getByLabelText('Recurrence frequency')
    fireEvent.change(freqSelect, { target: { value: 'weekly' } })

    // Change interval
    const intervalInput = screen.getByLabelText('Recurrence interval')
    fireEvent.change(intervalInput, { target: { value: '7' } })

    // Save schedule
    const saveRecBtn = screen.getByRole('button', { name: /save recurrence schedule/i })
    fireEvent.click(saveRecBtn)

    await waitFor(() => {
      expect(api.setTaskRecurrence).toHaveBeenCalledWith('task-100', expect.objectContaining({
        frequency: 'weekly',
        interval_days: 7,
      }))
      expect(screen.getByText(/recurrence schedule configured successfully/i)).toBeInTheDocument()
    })
  })

  it('switches to Audit History tab and renders chronological timeline', async () => {
    vi.mocked(api.fetchTaskHistory).mockResolvedValue(sampleHistory)

    render(
      <TaskDrawer
        isOpen={true}
        onClose={vi.fn()}
        task={sampleTask}
        workspaceId="ws-1"
        onSaveTask={vi.fn()}
      />
    )

    // Switch to History tab
    const historyTabBtn = screen.getByRole('button', { name: /audit history/i })
    fireEvent.click(historyTabBtn)

    await waitFor(() => {
      expect(screen.getByText('created')).toBeInTheDocument()
      expect(screen.getByText('status')).toBeInTheDocument()
      expect(screen.getByText('todo')).toBeInTheDocument()
      expect(screen.getByText('in_progress')).toBeInTheDocument()
    })
  })

  it('validates title field on submission when creating new task', async () => {
    const handleSave = vi.fn()
    render(
      <TaskDrawer
        isOpen={true}
        onClose={vi.fn()}
        task={null}
        workspaceId="ws-1"
        onSaveTask={handleSave}
      />
    )

    expect(screen.getByText('New Task')).toBeInTheDocument()

    const submitBtn = screen.getByRole('button', { name: /create task/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByText('Task title is required.')).toBeInTheDocument()
      expect(handleSave).not.toHaveBeenCalled()
    })
  })

  it('updates cognitive energy level with accessible brain buttons and scale description', () => {
    const handleSave = vi.fn()
    render(
      <TaskDrawer
        isOpen={true}
        onClose={vi.fn()}
        task={sampleTask}
        workspaceId="ws-1"
        onSaveTask={handleSave}
      />
    )

    // Verify initial energy level display
    expect(
      screen.getByText('Deep-focus / high mental effort')
    ).toBeInTheDocument()

    // Click on energy level 2 button
    const level2Btn = screen.getByRole('button', {
      name: /cognitive energy level 2/i,
    })
    fireEvent.click(level2Btn)

    // Level description updates
    expect(screen.getByText('Routine mental effort')).toBeInTheDocument()
  })
})
