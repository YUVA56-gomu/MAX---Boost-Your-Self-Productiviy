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

export interface TaskHistoryEntry {
  id: string
  task_id: string
  changed_field: string
  old_value?: string | null
  new_value?: string | null
  timestamp: string
}

export type RecurrenceFrequency = 'daily' | 'weekdays' | 'weekly' | 'monthly' | 'custom'

export interface TaskRecurrenceRule {
  id: string
  workspace_id: string
  frequency: RecurrenceFrequency
  interval_days: number
  by_weekdays_json?: string | null
  start_date: string
  end_date?: string | null
  next_due_date: string
  created_at: string
}

export interface TaskRecurrenceInput {
  frequency: RecurrenceFrequency
  interval_days: number
  by_weekdays?: number[] | null
  start_date: string
  end_date?: string | null
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

export interface Milestone {
  id: string
  goal_id: string
  title: string
  target_date?: string | null
  is_completed: boolean
  completed_at?: string | null
  position: number
  created_at: string
}

export interface Goal {
  id: string
  workspace_id: string
  title: string
  description?: string | null
  goal_type?: 'short_term' | 'long_term' | string
  horizon?: 'short_term' | 'long_term'
  progress_percentage: number
  status: string
  target_date?: string | null
  color?: string | null
  icon?: string | null
  milestones?: Milestone[]
  linked_project_count?: number
  created_at?: string
  updated_at?: string
}

export interface Habit {
  id: string
  workspace_id: string
  title: string
  description?: string | null
  frequency?: string
  cadence?: string
  target_count?: number
  time_of_day?: string | null
  current_streak: number
  best_streak: number
  is_active: boolean
  logged_today?: boolean
  created_at?: string
  updated_at?: string
}

export interface FocusSession {
  id: string
  workspace_id: string
  task_id?: string | null
  project_id?: string | null
  session_type: string
  started_at: string
  ended_at?: string | null
  duration_seconds: number
  interruption_count: number
  energy_before?: number | null
  energy_after?: number | null
  notes?: string | null
  is_completed: boolean
}

export interface Note {
  id: string
  workspace_id: string
  project_id?: string | null
  goal_id?: string | null
  title: string
  content_markdown: string
  is_pinned: boolean
  is_archived: boolean
  outgoing_link_count: number
  created_at: string
  updated_at: string
}

export interface Blocker {
  id: string
  workspace_id: string
  task_id?: string | null
  project_id?: string | null
  title: string
  description?: string | null
  category: 'external' | 'technical' | 'energy' | 'scope' | string
  status: 'active' | 'resolved' | string
  created_at: string
  resolved_at?: string | null
}

export interface DailyReview {
  id: string
  workspace_id: string
  review_date: string
  wins?: string | null
  challenges?: string | null
  tomorrow_priorities?: string | null
  mood_score?: number | null
  energy_score?: number | null
  notes?: string | null
  created_at: string
  updated_at: string
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

export async function fetchTaskHistory(taskId: string): Promise<TaskHistoryEntry[]> {
  const res = await apiFetch(`${API_BASE_URL}/tasks/${taskId}/history`)
  if (!res.ok) {
    throw new Error(`Failed to load task history (HTTP ${res.status})`)
  }
  return res.json()
}

export async function fetchTaskRecurrence(taskId: string): Promise<TaskRecurrenceRule | null> {
  const res = await apiFetch(`${API_BASE_URL}/tasks/${taskId}/recurring`)
  if (!res.ok) {
    throw new Error(`Failed to load task recurrence (HTTP ${res.status})`)
  }
  return res.json()
}

export async function setTaskRecurrence(taskId: string, input: TaskRecurrenceInput): Promise<TaskRecurrenceRule> {
  const res = await apiFetch(`${API_BASE_URL}/tasks/${taskId}/recurring`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.detail || `Failed to set task recurrence (HTTP ${res.status})`)
  }
  return res.json()
}

export async function deleteTaskRecurrence(taskId: string): Promise<void> {
  const res = await apiFetch(`${API_BASE_URL}/tasks/${taskId}/recurring`, {
    method: 'DELETE',
  })
  if (!res.ok) {
    throw new Error(`Failed to delete task recurrence (HTTP ${res.status})`)
  }
}

export async function fetchWorkloadInsights(workspaceId: string, range = '7d'): Promise<WorkloadInsights> {
  const res = await apiFetch(`${API_BASE_URL}/insights/workload?workspace_id=${workspaceId}&range=${range}`)
  if (!res.ok) {
    throw new Error(`Failed to load workload insights (HTTP ${res.status})`)
  }
  return res.json()
}

export async function fetchGoals(workspaceId: string, goalType?: string, status?: string): Promise<Goal[]> {
  const url = new URL(`${API_BASE_URL}/goals`)
  url.searchParams.set('workspace_id', workspaceId)
  if (goalType) url.searchParams.set('goal_type', goalType)
  if (status) url.searchParams.set('status', status)
  const res = await apiFetch(url.toString())
  if (!res.ok) {
    throw new Error(`Failed to load goals (HTTP ${res.status})`)
  }
  return res.json()
}

export async function createGoal(
  workspaceId: string,
  title: string,
  goalType = 'short_term',
  description?: string,
  targetDate?: string
): Promise<Goal> {
  const res = await apiFetch(`${API_BASE_URL}/goals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      workspace_id: workspaceId,
      title,
      goal_type: goalType,
      description: description || null,
      target_date: targetDate || null,
    }),
  })
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.detail || `Failed to create goal (HTTP ${res.status})`)
  }
  return res.json()
}

export async function updateGoal(goalId: string, input: Partial<Goal>): Promise<Goal> {
  const res = await apiFetch(`${API_BASE_URL}/goals/${goalId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.detail || `Failed to update goal (HTTP ${res.status})`)
  }
  return res.json()
}

export async function deleteGoal(goalId: string): Promise<void> {
  const res = await apiFetch(`${API_BASE_URL}/goals/${goalId}`, {
    method: 'DELETE',
  })
  if (!res.ok) {
    throw new Error(`Failed to delete goal (HTTP ${res.status})`)
  }
}

export async function createMilestone(goalId: string, title: string, targetDate?: string): Promise<Milestone> {
  const res = await apiFetch(`${API_BASE_URL}/goals/${goalId}/milestones`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title,
      target_date: targetDate || null,
    }),
  })
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.detail || `Failed to create milestone (HTTP ${res.status})`)
  }
  return res.json()
}

export async function updateMilestone(milestoneId: string, input: { is_completed?: boolean; title?: string }): Promise<Milestone> {
  const res = await apiFetch(`${API_BASE_URL}/goals/milestones/${milestoneId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    throw new Error(`Failed to update milestone (HTTP ${res.status})`)
  }
  return res.json()
}

export async function deleteMilestone(milestoneId: string): Promise<void> {
  const res = await apiFetch(`${API_BASE_URL}/goals/milestones/${milestoneId}`, {
    method: 'DELETE',
  })
  if (!res.ok) {
    throw new Error(`Failed to delete milestone (HTTP ${res.status})`)
  }
}

export async function fetchHabits(workspaceId: string, isActive?: boolean): Promise<Habit[]> {
  const url = new URL(`${API_BASE_URL}/habits`)
  url.searchParams.set('workspace_id', workspaceId)
  if (isActive !== undefined) url.searchParams.set('is_active', isActive.toString())
  const res = await apiFetch(url.toString())
  if (!res.ok) {
    throw new Error(`Failed to load habits (HTTP ${res.status})`)
  }
  return res.json()
}

export async function createHabit(
  workspaceId: string,
  title: string,
  frequency = 'daily',
  timeOfDay = 'any',
  description?: string
): Promise<Habit> {
  const res = await apiFetch(`${API_BASE_URL}/habits`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      workspace_id: workspaceId,
      title,
      frequency,
      time_of_day: timeOfDay,
      description: description || null,
    }),
  })
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.detail || `Failed to create habit (HTTP ${res.status})`)
  }
  return res.json()
}

export async function logHabit(habitId: string, logDate: string, completed = true): Promise<any> {
  const res = await apiFetch(`${API_BASE_URL}/habits/${habitId}/log`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      log_date: logDate,
      completed,
      numeric_value: completed ? 1.0 : 0.0,
    }),
  })
  if (!res.ok) {
    throw new Error(`Failed to log habit (HTTP ${res.status})`)
  }
  return res.json()
}

export async function deleteHabit(habitId: string): Promise<void> {
  const res = await apiFetch(`${API_BASE_URL}/habits/${habitId}`, {
    method: 'DELETE',
  })
  if (!res.ok) {
    throw new Error(`Failed to delete habit (HTTP ${res.status})`)
  }
}

export async function fetchFocusSessions(workspaceId: string): Promise<FocusSession[]> {
  const res = await apiFetch(`${API_BASE_URL}/focus/sessions?workspace_id=${workspaceId}`)
  if (!res.ok) {
    throw new Error(`Failed to load focus sessions (HTTP ${res.status})`)
  }
  return res.json()
}

export async function startFocusSession(
  workspaceId: string,
  taskId?: string,
  sessionType = 'pomodoro',
  energyBefore?: number
): Promise<FocusSession> {
  const res = await apiFetch(`${API_BASE_URL}/focus/sessions/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      workspace_id: workspaceId,
      task_id: taskId || null,
      session_type: sessionType,
      energy_before: energyBefore || null,
    }),
  })
  if (!res.ok) {
    throw new Error(`Failed to start focus session (HTTP ${res.status})`)
  }
  return res.json()
}

export async function completeFocusSession(
  sessionId: string,
  durationSeconds: number,
  interruptionCount = 0,
  energyAfter?: number,
  notes?: string
): Promise<FocusSession> {
  const res = await apiFetch(`${API_BASE_URL}/focus/sessions/${sessionId}/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      duration_seconds: durationSeconds,
      interruption_count: interruptionCount,
      energy_after: energyAfter || null,
      notes: notes || null,
    }),
  })
  if (!res.ok) {
    throw new Error(`Failed to complete focus session (HTTP ${res.status})`)
  }
  return res.json()
}

export async function fetchBlockers(workspaceId: string, status?: string): Promise<Blocker[]> {
  const url = new URL(`${API_BASE_URL}/insights/blockers`)
  url.searchParams.set('workspace_id', workspaceId)
  if (status) url.searchParams.set('status', status)
  const res = await apiFetch(url.toString())
  if (!res.ok) {
    throw new Error(`Failed to load blockers (HTTP ${res.status})`)
  }
  return res.json()
}

export async function createBlocker(
  workspaceId: string,
  title: string,
  category = 'external',
  description?: string,
  taskId?: string,
  projectId?: string
): Promise<Blocker> {
  const res = await apiFetch(`${API_BASE_URL}/insights/blockers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      workspace_id: workspaceId,
      title,
      category,
      description: description || null,
      task_id: taskId || null,
      project_id: projectId || null,
    }),
  })
  if (!res.ok) {
    throw new Error(`Failed to create blocker (HTTP ${res.status})`)
  }
  return res.json()
}

export async function updateBlocker(
  blockerId: string,
  input: { status?: string; title?: string; description?: string; category?: string }
): Promise<Blocker> {
  const res = await apiFetch(`${API_BASE_URL}/insights/blockers/${blockerId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    throw new Error(`Failed to update blocker (HTTP ${res.status})`)
  }
  return res.json()
}

export async function fetchDailyReview(workspaceId: string, reviewDate: string): Promise<DailyReview | null> {
  const res = await apiFetch(`${API_BASE_URL}/insights/daily-review/${reviewDate}?workspace_id=${workspaceId}`)
  if (res.status === 404) return null
  if (!res.ok) {
    throw new Error(`Failed to load daily review (HTTP ${res.status})`)
  }
  return res.json()
}

export async function upsertDailyReview(
  reviewDate: string,
  input: {
    workspace_id: string
    wins?: string | null
    challenges?: string | null
    tomorrow_priorities?: string | null
    mood_score?: number | null
    energy_score?: number | null
    notes?: string | null
  }
): Promise<DailyReview> {
  const res = await apiFetch(`${API_BASE_URL}/insights/daily-review/${reviewDate}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    throw new Error(`Failed to save daily review (HTTP ${res.status})`)
  }
  return res.json()
}


export async function fetchNotes(workspaceId: string, search?: string): Promise<Note[]> {
  const url = new URL(`${API_BASE_URL}/notes`)
  url.searchParams.set('workspace_id', workspaceId)
  if (search) url.searchParams.set('search', search)
  const res = await apiFetch(url.toString())
  if (!res.ok) {
    throw new Error(`Failed to load notes (HTTP ${res.status})`)
  }
  return res.json()
}

export async function createNote(
  workspaceId: string,
  title: string,
  contentMarkdown = '',
  isPinned = false
): Promise<Note> {
  const res = await apiFetch(`${API_BASE_URL}/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      workspace_id: workspaceId,
      title,
      content_markdown: contentMarkdown,
      is_pinned: isPinned,
    }),
  })
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.detail || `Failed to create note (HTTP ${res.status})`)
  }
  return res.json()
}

export async function updateNote(
  noteId: string,
  input: { title?: string; content_markdown?: string; is_pinned?: boolean }
): Promise<Note> {
  const res = await apiFetch(`${API_BASE_URL}/notes/${noteId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.detail || `Failed to update note (HTTP ${res.status})`)
  }
  return res.json()
}

export async function deleteNote(noteId: string): Promise<void> {
  const res = await apiFetch(`${API_BASE_URL}/notes/${noteId}`, {
    method: 'DELETE',
  })
  if (!res.ok) {
    throw new Error(`Failed to delete note (HTTP ${res.status})`)
  }
}

// Local AI Types matching backend/app/schemas/ai.py
export interface ProposedChange {
  id: string
  target_type: 'task' | 'goal' | 'habit' | 'milestone' | string
  target_id?: string | null
  target_title?: string | null
  action: 'update_estimate' | 'change_priority' | 'adjust_deadline' | 'create_task' | 'create_milestone' | 'reschedule' | string
  field?: string | null
  current_value?: any
  proposed_value: any
  rationale: string
}

export interface AIDiagnosisResponse {
  id: string
  diagnosis: string
  planning_mistake?: string | null
  evidence: string[]
  metrics: Record<string, any>
  uncertainty_or_missing_data?: string | null
  recommendations: string[]
  proposed_changes: ProposedChange[]
  model_name: string
  execution_time_ms: number
  created_at: string
}

export interface AICoachRequest {
  workspace_id: string
  user_message: string
  context_scope?: 'all' | 'tasks' | 'goals' | 'habits' | 'focus' | string
}

export interface AICoachResponse {
  id: string
  reply: string
  evidence_used: string[]
  planning_mistake?: string | null
  missing_data_acknowledged?: string | null
  proposed_changes: ProposedChange[]
  model_name: string
  execution_time_ms: number
  created_at: string
}

export interface AIApplyProposalRequest {
  workspace_id: string
  audit_id: string
  proposal: ProposedChange
}

export interface AIApplyProposalResponse {
  success: boolean
  message: string
  target_type: string
  target_id: string
  applied_changes: Record<string, any>
}

export interface AIDismissRequest {
  audit_id: string
  reason?: string | null
}

export interface AIStatusResponse {
  enabled: boolean
  available: boolean
  state: 'ollama_not_installed' | 'ollama_stopped' | 'model_missing' | 'model_ready' | 'inference_failed' | 'ready'
  ollama_installed: boolean
  service_running: boolean
  configured_model: string
  model_available: boolean
  active_model?: string | null
  base_url: string
  installed_models: string[]
  model_size_bytes?: number | null
  model_size_mb?: number | null
  binary_path?: string | null
}

export interface AIStartServiceResponse {
  success: boolean
  message: string
  service_running: boolean
}

export interface AIPullModelResponse {
  success: boolean
  message: string
  model: string
  status: string
}

export interface AITestInferenceResponse {
  success: boolean
  latency_ms: number
  message: string
  response_text?: string | null
}

export interface AIAuditHistoryEntry {
  id: string
  action_type: string
  model_name: string
  user_decision?: string | null
  execution_time_ms: number
  created_at: string
}

// Local AI API Client Methods
export async function fetchAIStatus(): Promise<AIStatusResponse> {
  const res = await apiFetch(`${API_BASE_URL}/ai/status`)
  if (!res.ok) {
    throw new Error(`Failed to check AI status (HTTP ${res.status})`)
  }
  return res.json()
}

export async function startAIService(): Promise<AIStartServiceResponse> {
  const res = await apiFetch(`${API_BASE_URL}/ai/start-service`, {
    method: 'POST',
  })
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.detail || `Failed to start Ollama service (HTTP ${res.status})`)
  }
  return res.json()
}

export async function pullAIModel(modelName?: string): Promise<AIPullModelResponse> {
  const res = await apiFetch(`${API_BASE_URL}/ai/pull`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(modelName ? { model_name: modelName } : {}),
  })
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.detail || `Failed to download model (HTTP ${res.status})`)
  }
  return res.json()
}

export async function testAIInference(): Promise<AITestInferenceResponse> {
  const res = await apiFetch(`${API_BASE_URL}/ai/test`, {
    method: 'POST',
  })
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.detail || `Failed to test AI inference (HTTP ${res.status})`)
  }
  return res.json()
}

export async function diagnoseProductivity(workspaceId: string): Promise<AIDiagnosisResponse> {
  const res = await apiFetch(`${API_BASE_URL}/ai/diagnose?workspace_id=${workspaceId}`, {
    method: 'POST',
  })
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.detail || `Failed to generate diagnosis (HTTP ${res.status})`)
  }
  return res.json()
}

export async function askAICoach(
  workspaceId: string,
  userMessage: string,
  contextScope = 'all'
): Promise<AICoachResponse> {
  const res = await apiFetch(`${API_BASE_URL}/ai/coach`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      workspace_id: workspaceId,
      user_message: userMessage,
      context_scope: contextScope,
    }),
  })
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.detail || `Failed to query AI coach (HTTP ${res.status})`)
  }
  return res.json()
}

export async function applyAIProposal(
  workspaceId: string,
  auditId: string,
  proposal: ProposedChange
): Promise<AIApplyProposalResponse> {
  const res = await apiFetch(`${API_BASE_URL}/ai/apply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      workspace_id: workspaceId,
      audit_id: auditId,
      proposal,
    }),
  })
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.detail || `Failed to apply proposal (HTTP ${res.status})`)
  }
  return res.json()
}

export async function dismissAIRecommendation(
  auditId: string,
  reason?: string
): Promise<{ status: string; audit_id: string; decision: string }> {
  const res = await apiFetch(`${API_BASE_URL}/ai/dismiss`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      audit_id: auditId,
      reason,
    }),
  })
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.detail || `Failed to dismiss recommendation (HTTP ${res.status})`)
  }
  return res.json()
}

export async function fetchAIHistory(
  workspaceId: string,
  limit = 10
): Promise<AIAuditHistoryEntry[]> {
  const res = await apiFetch(`${API_BASE_URL}/ai/history?workspace_id=${workspaceId}&limit=${limit}`)
  if (!res.ok) {
    throw new Error(`Failed to load AI history (HTTP ${res.status})`)
  }
  return res.json()
}


