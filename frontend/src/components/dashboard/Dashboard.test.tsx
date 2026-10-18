import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { TodayTasks } from './TodayTasks'
import { FocusTimer } from './FocusTimer'
import { TaskDrawer } from './TaskDrawer'
import type { Task } from '@/lib/api'

describe('Dashboard Component Unit Tests', () => {
  const sampleTasks: Task[] = [
    {
      id: 'task-1',
      workspace_id: 'ws-1',
      title: 'Deep work on compiler',
      description: 'Focus on AST parser optimization',
      status: 'todo',
      priority: 'urgent',
      energy_level: 5,
      estimated_minutes: 60,
      actual_minutes: 0,
      subtask_count: 2,
      completed_subtask_count: 1,
      position: 0,
      due_date: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'task-2',
      workspace_id: 'ws-1',
      title: 'Review pull requests',
      description: null,
      status: 'completed',
      priority: 'low',
      energy_level: 2,
      estimated_minutes: 20,
      actual_minutes: 25,
      subtask_count: 0,
      completed_subtask_count: 0,
      position: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]

  describe('TodayTasks Component', () => {
    it('renders task list with priority badge, energy tag, and estimated minutes', () => {
      render(
        <TodayTasks
          tasks={sampleTasks}
          onToggleComplete={vi.fn()}
          onSelectTask={vi.fn()}
          onDeleteTask={vi.fn()}
          onAddTask={vi.fn()}
        />
      )

      expect(screen.getByText('Deep work on compiler')).toBeInTheDocument()
      expect(screen.getByText('Urgent')).toBeInTheDocument()
      expect(screen.getByText('60m')).toBeInTheDocument()
      expect(screen.getByText('5')).toBeInTheDocument() // Energy level 5
      expect(screen.getByText('Review pull requests')).toBeInTheDocument()
    })

    it('triggers onToggleComplete when checkbox button is clicked', async () => {
      const handleToggle = vi.fn().mockResolvedValue(undefined)
      render(
        <TodayTasks
          tasks={sampleTasks}
          onToggleComplete={handleToggle}
          onSelectTask={vi.fn()}
          onDeleteTask={vi.fn()}
          onAddTask={vi.fn()}
        />
      )

      const markBtn = screen.getByLabelText('Mark completed')
      fireEvent.click(markBtn)

      expect(handleToggle).toHaveBeenCalledWith(sampleTasks[0])
    })

    it('filters tasks when tab is switched to Completed', () => {
      render(
        <TodayTasks
          tasks={sampleTasks}
          onToggleComplete={vi.fn()}
          onSelectTask={vi.fn()}
          onDeleteTask={vi.fn()}
          onAddTask={vi.fn()}
        />
      )

      // Click "Completed" tab
      const completedTab = screen.getByRole('button', { name: 'Completed' })
      fireEvent.click(completedTab)

      expect(screen.queryByText('Deep work on compiler')).not.toBeInTheDocument()
      expect(screen.getByText('Review pull requests')).toBeInTheDocument()
    })

    it('renders empty state when task array is empty', () => {
      render(
        <TodayTasks
          tasks={[]}
          onToggleComplete={vi.fn()}
          onSelectTask={vi.fn()}
          onDeleteTask={vi.fn()}
          onAddTask={vi.fn()}
        />
      )

      expect(screen.getByText('All clear for today!')).toBeInTheDocument()
    })
  })

  describe('FocusTimer Component', () => {
    it('renders default 25:00 countdown and allows mode switching', () => {
      render(
        <FocusTimer
          workspaceId="ws-1"
          tasks={sampleTasks}
        />
      )

      expect(screen.getByText('25:00')).toBeInTheDocument()
      expect(screen.getByText('Focus Engine')).toBeInTheDocument()

      // Switch to Short Break (5 min)
      const shortTab = screen.getByRole('button', { name: 'Short' })
      fireEvent.click(shortTab)

      expect(screen.getByText('05:00')).toBeInTheDocument()
    })

    it('starts and toggles timer state between Start Focus and Pause', async () => {
      // Mock fetch for focus session creation
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 'session-123',
          workspace_id: 'ws-1',
          session_type: 'pomodoro',
          duration_seconds: 0,
          interruption_count: 0,
          is_completed: false,
          started_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        }),
      })
      vi.stubGlobal('fetch', mockFetch)

      render(
        <FocusTimer
          workspaceId="ws-1"
          tasks={sampleTasks}
        />
      )

      const startBtn = screen.getByRole('button', { name: /start focus/i })
      fireEvent.click(startBtn)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument()
      })
    })
  })

  describe('TaskDrawer Component', () => {
    it('renders in editing mode with prefilled task metadata and invokes onSaveTask', async () => {
      const handleSave = vi.fn().mockResolvedValue(undefined)
      render(
        <TaskDrawer
          isOpen={true}
          onClose={vi.fn()}
          task={sampleTasks[0]}
          workspaceId="ws-1"
          onSaveTask={handleSave}
        />
      )

      expect(screen.getByText('Task Details')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Deep work on compiler')).toBeInTheDocument()

      // Submit form
      const saveBtn = screen.getByRole('button', { name: /save changes/i })
      fireEvent.click(saveBtn)

      await waitFor(() => {
        expect(handleSave).toHaveBeenCalled()
      })
    })

    it('validates required title when creating a new task', async () => {
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

      // Click create with empty title
      const createBtn = screen.getByRole('button', { name: /create task/i })
      fireEvent.click(createBtn)

      await waitFor(() => {
        expect(screen.getByText('Task title is required.')).toBeInTheDocument()
        expect(handleSave).not.toHaveBeenCalled()
      })
    })
  })
})
