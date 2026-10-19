import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { TasksCanvas } from './TasksCanvas'
import type { Task } from '@/lib/api'

describe('TasksCanvas Component Unit Tests', () => {
  const sampleTasks: Task[] = [
    {
      id: 'task-1',
      workspace_id: 'ws-1',
      parent_id: null,
      title: 'Architect storage engine',
      description: 'Design WAL and checkpointing',
      status: 'todo',
      priority: 'urgent',
      energy_level: 5,
      estimated_minutes: 90,
      actual_minutes: 0,
      subtask_count: 1,
      completed_subtask_count: 0,
      position: 0,
      due_date: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'task-2',
      workspace_id: 'ws-1',
      parent_id: null,
      title: 'Implement WAL ring buffer',
      description: 'Zero-copy ring buffer with memory map',
      status: 'in_progress',
      priority: 'high',
      energy_level: 4,
      estimated_minutes: 60,
      actual_minutes: 30,
      subtask_count: 0,
      completed_subtask_count: 0,
      position: 1,
      due_date: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'task-3',
      workspace_id: 'ws-1',
      parent_id: null,
      title: 'Write unit tests for hasher',
      description: 'Test SipHash and XXHash3 benchmarks',
      status: 'completed',
      priority: 'low',
      energy_level: 2,
      estimated_minutes: 30,
      actual_minutes: 25,
      subtask_count: 0,
      completed_subtask_count: 0,
      position: 2,
      due_date: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'subtask-1-1',
      workspace_id: 'ws-1',
      parent_id: 'task-1',
      title: 'Define file format header',
      description: 'Magic bytes and schema version',
      status: 'todo',
      priority: 'medium',
      energy_level: 3,
      estimated_minutes: 30,
      actual_minutes: 0,
      subtask_count: 0,
      completed_subtask_count: 0,
      position: 0,
      due_date: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]

  it('renders Kanban board with To Do, In Progress, and Completed columns', () => {
    render(
      <TasksCanvas
        tasks={sampleTasks}
        workspaceId="ws-1"
        onUpdateTaskStatus={vi.fn()}
        onSelectTask={vi.fn()}
        onDeleteTask={vi.fn()}
        onOpenNewTask={vi.fn()}
      />
    )

    expect(screen.getByText('Tasks Canvas')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'To Do' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'In Progress' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Completed' })).toBeInTheDocument()

    // Root tasks should appear in columns
    expect(screen.getByText('Architect storage engine')).toBeInTheDocument()
    expect(screen.getByText('Implement WAL ring buffer')).toBeInTheDocument()
    expect(screen.getByText('Write unit tests for hasher')).toBeInTheDocument()
  })

  it('switches between Kanban view and List view', () => {
    render(
      <TasksCanvas
        tasks={sampleTasks}
        workspaceId="ws-1"
        onUpdateTaskStatus={vi.fn()}
        onSelectTask={vi.fn()}
        onDeleteTask={vi.fn()}
        onOpenNewTask={vi.fn()}
      />
    )

    // Switch to List view
    const listBtn = screen.getByLabelText('List View')
    fireEvent.click(listBtn)

    // Table / List headers should be visible
    expect(screen.getByText('Task Title')).toBeInTheDocument()
    expect(screen.getByText('Priority & Energy')).toBeInTheDocument()
    expect(screen.getByText('Due Date')).toBeInTheDocument()

    // Switch back to Kanban
    const kanbanBtn = screen.getByLabelText('Kanban Board View')
    fireEvent.click(kanbanBtn)
    expect(screen.getByRole('heading', { name: 'To Do' })).toBeInTheDocument()
  })

  it('filters tasks by cognitive energy level', () => {
    render(
      <TasksCanvas
        tasks={sampleTasks}
        workspaceId="ws-1"
        onUpdateTaskStatus={vi.fn()}
        onSelectTask={vi.fn()}
        onDeleteTask={vi.fn()}
        onOpenNewTask={vi.fn()}
      />
    )

    // Select Energy Level 5 (Deep Work)
    const energySelect = screen.getByLabelText('Filter by cognitive energy')
    fireEvent.change(energySelect, { target: { value: '5' } })

    // Only 'Architect storage engine' should be visible
    expect(screen.getByText('Architect storage engine')).toBeInTheDocument()
    expect(screen.queryByText('Implement WAL ring buffer')).not.toBeInTheDocument()
    expect(screen.queryByText('Write unit tests for hasher')).not.toBeInTheDocument()
  })

  it('filters tasks by priority', () => {
    render(
      <TasksCanvas
        tasks={sampleTasks}
        workspaceId="ws-1"
        onUpdateTaskStatus={vi.fn()}
        onSelectTask={vi.fn()}
        onDeleteTask={vi.fn()}
        onOpenNewTask={vi.fn()}
      />
    )

    // Select Priority 'urgent'
    const prioritySelect = screen.getByLabelText('Filter by priority')
    fireEvent.change(prioritySelect, { target: { value: 'urgent' } })

    expect(screen.getByText('Architect storage engine')).toBeInTheDocument()
    expect(screen.queryByText('Implement WAL ring buffer')).not.toBeInTheDocument()
  })

  it('filters tasks by search query', () => {
    render(
      <TasksCanvas
        tasks={sampleTasks}
        workspaceId="ws-1"
        onUpdateTaskStatus={vi.fn()}
        onSelectTask={vi.fn()}
        onDeleteTask={vi.fn()}
        onOpenNewTask={vi.fn()}
      />
    )

    const searchInput = screen.getByPlaceholderText('Search tasks and subtasks...')
    fireEvent.change(searchInput, { target: { value: 'hasher' } })

    expect(screen.getByText('Write unit tests for hasher')).toBeInTheDocument()
    expect(screen.queryByText('Architect storage engine')).not.toBeInTheDocument()
  })

  it('displays subtasks count and expands subtasks on click', async () => {
    render(
      <TasksCanvas
        tasks={sampleTasks}
        workspaceId="ws-1"
        onUpdateTaskStatus={vi.fn()}
        onSelectTask={vi.fn()}
        onDeleteTask={vi.fn()}
        onOpenNewTask={vi.fn()}
      />
    )

    // Subtask count indicator should be visible
    const expandBtn = screen.getByTitle('Expand subtasks')
    expect(expandBtn).toBeInTheDocument()

    // Expand subtasks
    fireEvent.click(expandBtn)

    await waitFor(() => {
      expect(screen.getByText('Define file format header')).toBeInTheDocument()
    })
  })

  it('calls onOpenNewTask when clicking New Task button', () => {
    const handleNewTask = vi.fn()
    render(
      <TasksCanvas
        tasks={sampleTasks}
        workspaceId="ws-1"
        onUpdateTaskStatus={vi.fn()}
        onSelectTask={vi.fn()}
        onDeleteTask={vi.fn()}
        onOpenNewTask={handleNewTask}
      />
    )

    const newBtn = screen.getByRole('button', { name: /new task/i })
    fireEvent.click(newBtn)

    expect(handleNewTask).toHaveBeenCalledWith(null)
  })

  it('calls onSelectTask when task card is clicked', () => {
    const handleSelectTask = vi.fn()
    render(
      <TasksCanvas
        tasks={sampleTasks}
        workspaceId="ws-1"
        onUpdateTaskStatus={vi.fn()}
        onSelectTask={handleSelectTask}
        onDeleteTask={vi.fn()}
        onOpenNewTask={vi.fn()}
      />
    )

    const taskTitle = screen.getByText('Architect storage engine')
    fireEvent.click(taskTitle)

    expect(handleSelectTask).toHaveBeenCalledWith(sampleTasks[0])
  })

  it('shows empty state when no tasks match filters and can clear filters', () => {
    render(
      <TasksCanvas
        tasks={sampleTasks}
        workspaceId="ws-1"
        onUpdateTaskStatus={vi.fn()}
        onSelectTask={vi.fn()}
        onDeleteTask={vi.fn()}
        onOpenNewTask={vi.fn()}
      />
    )

    const searchInput = screen.getByPlaceholderText('Search tasks and subtasks...')
    fireEvent.change(searchInput, { target: { value: 'nonexistent query 12345' } })

    expect(screen.getByText('No tasks match your filters')).toBeInTheDocument()

    const clearBtn = screen.getByRole('button', { name: /clear filters/i })
    fireEvent.click(clearBtn)

    expect(screen.getByText('Architect storage engine')).toBeInTheDocument()
  })

  it('supports keyboard-accessible status changes via column select dropdown', () => {
    const handleUpdateStatus = vi.fn()
    render(
      <TasksCanvas
        tasks={sampleTasks}
        workspaceId="ws-1"
        onUpdateTaskStatus={handleUpdateStatus}
        onSelectTask={vi.fn()}
        onDeleteTask={vi.fn()}
        onOpenNewTask={vi.fn()}
      />
    )

    const moveSelect = screen.getByLabelText('Move Architect storage engine')
    expect(moveSelect).toBeInTheDocument()

    // Change status from 'todo' to 'in_progress' via keyboard / select
    fireEvent.change(moveSelect, { target: { value: 'in_progress' } })
    expect(handleUpdateStatus).toHaveBeenCalledWith(sampleTasks[0], 'in_progress')
  })

  it('renders refined CognitiveEnergyBadge with Brain icon and accessible scale tooltip on task cards', () => {
    render(
      <TasksCanvas
        tasks={sampleTasks}
        workspaceId="ws-1"
        onUpdateTaskStatus={vi.fn()}
        onSelectTask={vi.fn()}
        onDeleteTask={vi.fn()}
        onOpenNewTask={vi.fn()}
      />
    )

    const energyBadges = screen.getAllByTestId('cognitive-energy-badge')
    expect(energyBadges.length).toBeGreaterThan(0)

    // Inspect the first energy badge (level 5 for Architect storage engine)
    const level5Badge = energyBadges[0]
    expect(level5Badge).toHaveTextContent('5')
    expect(level5Badge).toHaveAttribute(
      'title',
      expect.stringContaining('Scale: 1 = low mental effort; 5 = deep-focus/high mental effort')
    )
    expect(level5Badge).toHaveAttribute(
      'aria-label',
      expect.stringContaining('Scale: 1 = low mental effort; 5 = deep-focus/high mental effort')
    )
  })
})
