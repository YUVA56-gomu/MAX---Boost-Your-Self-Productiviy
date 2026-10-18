import { apiFetch } from './auth'

export const API_BASE_URL = 'http://127.0.0.1:24125/api/v1'

export interface Workspace {
  id: string
  name: string
  slug: string
  color?: string
  icon?: string
  is_default: boolean
  created_at: string
  updated_at: string
}

export type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'completed'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface Task {
  id: string
  workspace_id: string
  project_id?: string | null
  goal_id?: string | null
  milestone_id?: string | null
  parent_id?: string | null
  title: string
  description?: string | null
  status: TaskStatus
  priority: TaskPriority
  energy_level: number
  estimated_minutes?: number | null
  actual_minutes: number
  due_date?: string | null
  position: number
  subtask_count: number
  completed_subtask_count: number
  completed_at?: string | null
  created_at: string
  updated_at: string
}

export interface TaskCreateInput {
  workspace_id: string
  title: string
  description?: string | null
  status?: TaskStatus
  priority?: TaskPriority
  energy_level?: number
  estimated_minutes?: number | null
  due_date?: string | null
  project_id?: string | null
  goal_id?: string | null
  parent_id?: string | null
}

export interface TaskUpdateInput {
  title?: string
  description?: string | null
  status?: TaskStatus
  priority?: TaskPriority
  energy_level?: number
  estimated_minutes?: number | null
  actual_minutes?: number
  due_date?: string | null
  parent_id?: string | null
  completed_at?: string | null
}

export interface WorkloadInsights {
  range: string
  total_planned_minutes: number
  total_completed_minutes: number
  estimation_accuracy_ratio: number
  tasks_completed_count: number
  tasks_rolled_over_count: number
  deep_work_focus_hours: number
}

export interface Goal {
  id: string
  workspace_id: string
  title: string
  horizon: 'short_term' | 'long_term'
  progress_percentage: number
  status: string
  target_date?: string | null
}

export interface Habit {
  id: string
  workspace_id: string
  title: string
  cadence: string
  current_streak: number
  best_streak: number
  is_active: boolean
}

export interface FocusSession {
  id: string
  workspace_id: string
  task_id?: string | null
  session_type: string
  started_at: string
  ended_at?: string | null
  duration_seconds: number
  interruption_count: number
  energy_before?: number | null
  energy_after?: number | null
  is_completed: boolean
}

export interface HealthStatus {
  status: string
  version: string
  database: string
  ai_available: boolean
  active_model?: string | null
}

export async function fetchHealth(): Promise<HealthStatus> {
  const res = await apiFetch(`${API_BASE_URL}/health`)
  if (!res.ok) {
    throw new Error(`Health check returned HTTP ${res.status}`)
  }
  return res.json()
}

export async function fetchWorkspaces(): Promise<Workspace[]> {
  const res = await apiFetch(`${API_BASE_URL}/workspaces`)
  if (!res.ok) {
    throw new Error(`Failed to load workspaces (HTTP ${res.status})`)
  }
  return res.json()
}

export async function createWorkspace(name: string, color = '#6366F1'): Promise<Workspace> {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'workspace'
  const res = await apiFetch(`${API_BASE_URL}/workspaces`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, slug, color, icon: 'folder' }),
  })
  if (!res.ok) {
    throw new Error(`Failed to create workspace (HTTP ${res.status})`)
  }
  return res.json()
}

export interface TaskFilterOptions {
  status?: TaskStatus
  priority?: TaskPriority
  energy_level?: number
  parent_id?: string | null
  search?: string
}

export async function fetchTasks(workspaceId: string, filters?: TaskStatus | TaskFilterOptions): Promise<Task[]> {
  const url = new URL(`${API_BASE_URL}/tasks`)
  url.searchParams.set('workspace_id', workspaceId)
  if (typeof filters === 'string') {
    url.searchParams.set('status', filters)
  } else if (filters) {
    if (filters.status) url.searchParams.set('status', filters.status)
    if (filters.priority) url.searchParams.set('priority', filters.priority)
    if (filters.energy_level !== undefined) url.searchParams.set('energy_level', filters.energy_level.toString())
    if (filters.parent_id !== undefined && filters.parent_id !== null) url.searchParams.set('parent_id', filters.parent_id)
    if (filters.search) url.searchParams.set('search', filters.search)
  }
  const res = await apiFetch(url.toString())
  if (!res.ok) {
    throw new Error(`Failed to load tasks (HTTP ${res.status})`)
  }
  return res.json()
}

export async function createTask(input: TaskCreateInput): Promise<Task> {
  const res = await apiFetch(`${API_BASE_URL}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.detail || `Failed to create task (HTTP ${res.status})`)
  }
  return res.json()
}

export async function updateTask(taskId: string, input: TaskUpdateInput): Promise<Task> {
  const res = await apiFetch(`${API_BASE_URL}/tasks/${taskId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.detail || `Failed to update task (HTTP ${res.status})`)
  }
  return res.json()
}

export async function deleteTask(taskId: string): Promise<void> {
  const res = await apiFetch(`${API_BASE_URL}/tasks/${taskId}`, {
    method: 'DELETE',
  })
  if (!res.ok) {
    throw new Error(`Failed to delete task (HTTP ${res.status})`)
  }
}

export async function fetchWorkloadInsights(workspaceId: string, range = '7d'): Promise<WorkloadInsights> {
  const res = await apiFetch(`${API_BASE_URL}/insights/workload?workspace_id=${workspaceId}&range=${range}`)
  if (!res.ok) {
    throw new Error(`Failed to load workload insights (HTTP ${res.status})`)
  }
  return res.json()
}

export async function fetchGoals(workspaceId: string): Promise<Goal[]> {
  const res = await apiFetch(`${API_BASE_URL}/goals?workspace_id=${workspaceId}`)
  if (!res.ok) {
    throw new Error(`Failed to load goals (HTTP ${res.status})`)
  }
  return res.json()
}

export async function fetchHabits(workspaceId: string): Promise<Habit[]> {
  const res = await apiFetch(`${API_BASE_URL}/habits?workspace_id=${workspaceId}`)
  if (!res.ok) {
    throw new Error(`Failed to load habits (HTTP ${res.status})`)
  }
  return res.json()
}

export async function startFocusSession(workspaceId: string, taskId?: string, sessionType = 'pomodoro'): Promise<FocusSession> {
  const res = await apiFetch(`${API_BASE_URL}/focus/sessions/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      workspace_id: workspaceId,
      task_id: taskId || null,
      session_type: sessionType,
    }),
  })
  if (!res.ok) {
    throw new Error(`Failed to start focus session (HTTP ${res.status})`)
  }
  return res.json()
}

export async function completeFocusSession(sessionId: string, durationSeconds: number, interruptionCount = 0): Promise<FocusSession> {
  const res = await apiFetch(`${API_BASE_URL}/focus/sessions/${sessionId}/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      duration_seconds: durationSeconds,
      interruption_count: interruptionCount,
    }),
  })
  if (!res.ok) {
    throw new Error(`Failed to complete focus session (HTTP ${res.status})`)
  }
  return res.json()
}
