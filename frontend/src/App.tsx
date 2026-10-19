import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  fetchHealth,
  fetchWorkspaces,
  createWorkspace,
  fetchTasks,
  createTask,
  updateTask,
  deleteTask,
  fetchWorkloadInsights,
  fetchGoals,
  fetchHabits,
  type Workspace,
  type Task,
  type WorkloadInsights,
  type Goal,
  type Habit,
  type HealthStatus,
  type TaskCreateInput,
  type TaskUpdateInput,
  type TaskStatus,
} from '@/lib/api'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { Header } from '@/components/dashboard/Header'
import { HeroBanner } from '@/components/dashboard/HeroBanner'
import { StatStrip } from '@/components/dashboard/StatStrip'
import { TodayTasks } from '@/components/dashboard/TodayTasks'
import { FocusTimer } from '@/components/dashboard/FocusTimer'
import { WeeklyActivity } from '@/components/dashboard/WeeklyActivity'
import { TaskDrawer } from '@/components/dashboard/TaskDrawer'
import { TasksCanvas } from '@/components/tasks/TasksCanvas'
import { AICoachCanvas } from '@/components/ai/AICoachCanvas'
import { AIOnboardingModal } from '@/components/ai/AIOnboardingModal'
import { GoalsCanvas } from '@/components/goals/GoalsCanvas'
import { HabitsCanvas } from '@/components/habits/HabitsCanvas'
import { FocusCanvas } from '@/components/focus/FocusCanvas'
import { InsightsCanvas } from '@/components/insights/InsightsCanvas'
import { NotesCanvas } from '@/components/notes/NotesCanvas'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function App() {
  const [health, setHealth] = useState<HealthStatus | null>(null)
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>('')
  const [tasks, setTasks] = useState<Task[]>([])
  const [insights, setInsights] = useState<WorkloadInsights | null>(null)
  const [goals, setGoals] = useState<Goal[]>([])
  const [habits, setHabits] = useState<Habit[]>([])

  const [loading, setLoading] = useState<boolean>(true)
  const [tasksLoading, setTasksLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [tasksError, setTasksError] = useState<string | null>(null)

  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false)
  const [activeNavId, setActiveNavId] = useState<string>('home')
  const [isAIOnboardingOpen, setIsAIOnboardingOpen] = useState<boolean>(false)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [parentTaskIdForNew, setParentTaskIdForNew] = useState<string | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false)

  // Navigation handler that triggers onboarding if AI Coach selected and not yet onboarded
  const handleSelectNav = useCallback((id: string) => {
    if (id === 'ai-coach') {
      const isCompleted = typeof window !== 'undefined' && localStorage.getItem('max_ai_onboarding_completed') === 'true'
      if (!isCompleted) {
        setIsAIOnboardingOpen(true)
        return
      }
    }
    setActiveNavId(id)
  }, [])

  const handleAIOnboardingComplete = useCallback(() => {
    setIsAIOnboardingOpen(false)
    setActiveNavId('ai-coach')
  }, [])

  const handleAIOnboardingClose = useCallback(() => {
    setIsAIOnboardingOpen(false)
  }, [])


  // Active workspace object
  const activeWorkspace = useMemo(
    () => workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0],
    [workspaces, activeWorkspaceId]
  )

  // Load workspace data: tasks, insights, goals, habits
  const loadWorkspaceData = useCallback(async (wsId: string, isManual = false) => {
    if (!wsId) return
    if (isManual) {
      setTasksLoading(true)
    }
    setTasksError(null)
    try {
      const [fetchedTasks, fetchedInsights, fetchedGoals, fetchedHabits] = await Promise.all([
        fetchTasks(wsId).catch(() => []),
        fetchWorkloadInsights(wsId).catch(() => null),
        fetchGoals(wsId).catch(() => []),
        fetchHabits(wsId).catch(() => []),
      ])

      setTasks(fetchedTasks)
      setInsights(fetchedInsights)
      setGoals(fetchedGoals)
      setHabits(fetchedHabits)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load workspace data'
      setTasksError(msg)
    } finally {
      setTasksLoading(false)
    }
  }, [])

  // Initialize: Probe health, load workspaces, and load default workspace data
  const initializeApp = useCallback(async (isManual = false) => {
    if (isManual) {
      setLoading(true)
    }
    setError(null)
    try {
      // 1. Health Probe
      const healthData = await fetchHealth()
      setHealth(healthData)

      // 2. Workspaces
      const wsList = await fetchWorkspaces()
      setWorkspaces(wsList)
      if (wsList.length > 0) {
        const defaultWs = wsList.find((w) => w.is_default) || wsList[0]
        setActiveWorkspaceId(defaultWs.id)
        await loadWorkspaceData(defaultWs.id)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Backend unreachable'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [loadWorkspaceData])

  // Initial load
  useEffect(() => {
    let isMounted = true
    const run = async () => {
      if (isMounted) {
        await initializeApp(false)
      }
    }
    void run()
    return () => {
      isMounted = false
    }
  }, [initializeApp])

  // Switch active workspace
  const handleSelectWorkspace = useCallback(
    (id: string) => {
      setActiveWorkspaceId(id)
      void loadWorkspaceData(id, true)
    },
    [loadWorkspaceData]
  )

  // Global Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K: Focus search input
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        const searchInput = document.querySelector('input[aria-label="Search"]') as HTMLInputElement | null
        if (searchInput) searchInput.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Action: Toggle task completion
  const handleToggleComplete = async (task: Task) => {
    const nextStatus = task.status === 'completed' ? 'todo' : 'completed'
    // Optimistic update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? {
              ...t,
              status: nextStatus,
              completed_at: nextStatus === 'completed' ? new Date().toISOString() : null,
            }
          : t
      )
    )

    try {
      await updateTask(task.id, {
        status: nextStatus,
        completed_at: nextStatus === 'completed' ? new Date().toISOString() : null,
      })
      // Refresh workload insights to keep velocity and completed counts in sync
      const freshInsights = await fetchWorkloadInsights(activeWorkspaceId).catch(() => null)
      if (freshInsights) setInsights(freshInsights)
    } catch (err) {
      // Rollback on failure
      setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)))
      console.error('Failed to update task status:', err)
    }
  }

  // Action: Update task status (Kanban drag-and-drop or status selector)
  const handleUpdateTaskStatus = async (task: Task, newStatus: TaskStatus) => {
    // Optimistic update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? {
              ...t,
              status: newStatus,
              completed_at: newStatus === 'completed' ? new Date().toISOString() : null,
            }
          : t
      )
    )

    try {
      await updateTask(task.id, {
        status: newStatus,
        completed_at: newStatus === 'completed' ? new Date().toISOString() : null,
      })
      const freshInsights = await fetchWorkloadInsights(activeWorkspaceId).catch(() => null)
      if (freshInsights) setInsights(freshInsights)
    } catch (err) {
      // Rollback on failure
      setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)))
      const msg = err instanceof Error ? err.message : 'Failed to update task status'
      setTasksError(msg)
      console.error('Failed to update task status:', err)
    }
  }

  // Action: Create or Update task from Drawer
  const handleSaveTask = async (taskData: TaskCreateInput | TaskUpdateInput) => {
    if (selectedTask) {
      // Update existing
      const updated = await updateTask(selectedTask.id, taskData as TaskUpdateInput)
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
    } else {
      // Create new
      const created = await createTask(taskData as TaskCreateInput)
      setTasks((prev) => [created, ...prev])
    }
    // Refresh insights
    const freshInsights = await fetchWorkloadInsights(activeWorkspaceId).catch(() => null)
    if (freshInsights) setInsights(freshInsights)
  }

  // Action: Delete task
  const handleDeleteTask = async (taskId: string) => {
    // Optimistic removal
    const previousTasks = [...tasks]
    setTasks((prev) => prev.filter((t) => t.id !== taskId))
    try {
      await deleteTask(taskId)
      const freshInsights = await fetchWorkloadInsights(activeWorkspaceId).catch(() => null)
      if (freshInsights) setInsights(freshInsights)
    } catch (err) {
      setTasks(previousTasks)
      const msg = err instanceof Error ? err.message : 'Failed to delete task'
      setTasksError(msg)
      console.error('Failed to delete task:', err)
    }
  }

  // Action: Add new workspace
  const handleAddWorkspace = async (name: string) => {
    try {
      const created = await createWorkspace(name)
      setWorkspaces((prev) => [...prev, created])
      setActiveWorkspaceId(created.id)
    } catch (err) {
      console.error('Failed to create workspace:', err)
    }
  }

  // Open drawer for new task (optional parentTaskId for subtasks)
  const handleOpenNewTask = (parentTaskId?: string | null) => {
    setParentTaskIdForNew(parentTaskId || null)
    setSelectedTask(null)
    setIsDrawerOpen(true)
  }

  // Open drawer to inspect / edit task
  const handleSelectTask = (task: Task) => {
    setSelectedTask(task)
    setParentTaskIdForNew(task.parent_id || null)
    setIsDrawerOpen(true)
  }

  // Render Waiting / Backend Unreachable Screen
  if (error && !health) {
    return (
      <div className="min-h-screen bg-[#0B0F17] text-[#F8FAFC] flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full p-8 rounded-2xl bg-[#111827] border border-white/10 text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold">Waiting for backend</h2>
          <p className="text-xs text-[#94A3B8]">
            Backend not currently running on 127.0.0.1:24125. Please ensure the local FastAPI sidecar is active.
          </p>
          <div className="pt-2">
            <Button
              onClick={() => void initializeApp(true)}
              disabled={loading}
              className="w-full gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs h-9"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Retry Connection</span>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0B0F17] text-[#F8FAFC] flex flex-row font-sans overflow-hidden">
      {/* 1. Left Navigation Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
        workspaces={workspaces}
        activeWorkspaceId={activeWorkspaceId}
        onSelectWorkspace={handleSelectWorkspace}
        onAddWorkspace={handleAddWorkspace}
        activeNavId={activeNavId}
        onSelectNav={handleSelectNav}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* 2. Top Header Bar */}
        <Header
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeWorkspace={activeWorkspace}
          onQuickAddTask={() => handleOpenNewTask(null)}
          onOpenAICoach={() => handleSelectNav('ai-coach')}
          backendStatus={loading ? 'checking' : error || !health ? 'disconnected' : 'connected'}
        />

        {/* 3. Three-Column Content Body */}
        <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-y-auto">
          {/* Center Column: Execution Canvas */}
          <main className="flex-1 min-w-0 p-6 space-y-6 overflow-y-auto">
            {activeNavId === 'tasks' ? (
              <TasksCanvas
                tasks={tasks}
                workspaceId={activeWorkspaceId}
                loading={tasksLoading}
                error={tasksError}
                onUpdateTaskStatus={handleUpdateTaskStatus}
                onSelectTask={handleSelectTask}
                onDeleteTask={handleDeleteTask}
                onOpenNewTask={handleOpenNewTask}
                onRetry={() => loadWorkspaceData(activeWorkspaceId)}
              />
            ) : activeNavId === 'ai-coach' ? (
              <AICoachCanvas
                workspaceId={activeWorkspaceId}
                onWorkspaceDataChanged={() => loadWorkspaceData(activeWorkspaceId)}
              />
            ) : activeNavId === 'goals' ? (
              <GoalsCanvas
                workspaceId={activeWorkspaceId}
                onGoalMutated={() => loadWorkspaceData(activeWorkspaceId)}
              />
            ) : activeNavId === 'habits' ? (
              <HabitsCanvas
                workspaceId={activeWorkspaceId}
                onHabitMutated={() => loadWorkspaceData(activeWorkspaceId)}
              />
            ) : activeNavId === 'focus' ? (
              <FocusCanvas
                workspaceId={activeWorkspaceId}
                onSessionCompleted={() => loadWorkspaceData(activeWorkspaceId)}
              />
            ) : activeNavId === 'insights' ? (
              <InsightsCanvas
                workspaceId={activeWorkspaceId}
              />
            ) : activeNavId === 'notes' ? (
              <NotesCanvas
                workspaceId={activeWorkspaceId}
              />
            ) : (
              <>
                {/* Hero Greeting Banner */}
                <HeroBanner />

                {/* 4 Stat Summary Cards */}
                <StatStrip
                  tasks={tasks}
                  insights={insights}
                  goals={goals}
                  habits={habits}
                  loading={tasksLoading}
                />

                {/* Today's Tasks Widget */}
                <TodayTasks
                  tasks={tasks}
                  searchQuery={searchQuery}
                  loading={tasksLoading}
                  error={tasksError}
                  onToggleComplete={handleToggleComplete}
                  onSelectTask={handleSelectTask}
                  onDeleteTask={handleDeleteTask}
                  onAddTask={() => handleOpenNewTask(null)}
                  onRetry={() => loadWorkspaceData(activeWorkspaceId)}
                />
              </>
            )}
          </main>

          {/* Right Column: Contextual Widget Hub */}
          <aside
            className="w-full lg:w-[340px] shrink-0 p-6 space-y-6 border-t lg:border-t-0 lg:border-l border-white/10 bg-[#111827]/40 backdrop-blur-xs overflow-y-auto"
            aria-label="Contextual Widgets"
          >
            {/* Focus Engine HUD */}
            <FocusTimer
              workspaceId={activeWorkspaceId}
              tasks={tasks}
              onSessionSaved={() => loadWorkspaceData(activeWorkspaceId)}
            />

            {/* Weekly Velocity & Workload Analytics */}
            <WeeklyActivity insights={insights} loading={tasksLoading} />
          </aside>
        </div>
      </div>

      {/* Contextual Task Details / Creation Drawer */}
      <TaskDrawer
        key={selectedTask ? selectedTask.id : (isDrawerOpen ? `drawer-open-new-${parentTaskIdForNew || 'root'}` : 'drawer-closed')}
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false)
          setParentTaskIdForNew(null)
        }}
        task={selectedTask}
        workspaceId={activeWorkspaceId}
        parentTaskId={parentTaskIdForNew}
        onSaveTask={handleSaveTask}
        onDeleteTask={handleDeleteTask}
      />

      {/* Premium Local AI Onboarding & Ollama Setup Modal */}
      <AIOnboardingModal
        isOpen={isAIOnboardingOpen}
        onClose={handleAIOnboardingClose}
        onComplete={handleAIOnboardingComplete}
        initialStep="welcome"
      />
    </div>
  )
}

export default App
