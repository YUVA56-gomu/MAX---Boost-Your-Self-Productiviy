import { useState, useMemo } from 'react'
import {
  Kanban,
  List as ListIcon,
  Plus,
  Search,
  X,
  CheckCircle2,
  Circle,
  Clock,
  Calendar,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Trash2,
  Edit3,
  CornerDownRight,
  AlertCircle,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CognitiveEnergyBadge } from '@/components/ui/CognitiveEnergyBadge'
import type { Task, TaskPriority, TaskStatus } from '@/lib/api'

interface TasksCanvasProps {
  tasks: Task[]
  workspaceId: string
  loading?: boolean
  error?: string | null
  onUpdateTaskStatus: (task: Task, newStatus: TaskStatus) => Promise<void>
  onSelectTask: (task: Task) => void
  onDeleteTask: (taskId: string) => Promise<void>
  onOpenNewTask: (parentTaskId?: string | null) => void
  onRetry?: () => void
}

type ViewMode = 'kanban' | 'list'

const KANBAN_COLUMNS: { id: TaskStatus; label: string; color: string; dotColor: string }[] = [
  { id: 'todo', label: 'To Do', color: 'border-sky-500/30 bg-sky-500/5', dotColor: 'bg-sky-400' },
  { id: 'in_progress', label: 'In Progress', color: 'border-indigo-500/30 bg-indigo-500/5', dotColor: 'bg-indigo-400' },
  { id: 'completed', label: 'Completed', color: 'border-emerald-500/30 bg-emerald-500/5', dotColor: 'bg-emerald-400' },
]

export const TasksCanvas: React.FC<TasksCanvasProps> = ({
  tasks,
  workspaceId: _workspaceId,
  loading = false,
  error = null,
  onUpdateTaskStatus,
  onSelectTask,
  onDeleteTask,
  onOpenNewTask,
  onRetry,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('kanban')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [energyFilter, setEnergyFilter] = useState<string>('all')
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)
  const [activeDropColumn, setActiveDropColumn] = useState<TaskStatus | null>(null)
  const [expandedParents, setExpandedParents] = useState<Record<string, boolean>>({})

  // Toggle parent task expansion
  const toggleParentExpand = (parentId: string) => {
    setExpandedParents((prev) => ({
      ...prev,
      [parentId]: !prev[parentId],
    }))
  }

  // Separate parent tasks and child subtasks
  const { rootTasks, subtasksByParent } = useMemo(() => {
    const roots: Task[] = []
    const subMap: Record<string, Task[]> = {}

    tasks.forEach((t) => {
      if (t.parent_id) {
        if (!subMap[t.parent_id]) subMap[t.parent_id] = []
        subMap[t.parent_id].push(t)
      } else {
        roots.push(t)
      }
    })

    return { rootTasks: roots, subtasksByParent: subMap }
  }, [tasks])

  // Filter root tasks
  const filteredTasks = useMemo(() => {
    return rootTasks.filter((task) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchTitle = task.title.toLowerCase().includes(q)
        const matchDesc = task.description?.toLowerCase().includes(q)
        // Also check if any subtask matches
        const subtasks = subtasksByParent[task.id] || []
        const matchSub = subtasks.some((s) => s.title.toLowerCase().includes(q))
        if (!matchTitle && !matchDesc && !matchSub) return false
      }

      // Status
      if (statusFilter !== 'all' && task.status !== statusFilter) {
        return false
      }

      // Priority
      if (priorityFilter !== 'all' && task.priority !== priorityFilter) {
        return false
      }

      // Cognitive Energy Level (1-5)
      if (energyFilter !== 'all' && task.energy_level.toString() !== energyFilter) {
        return false
      }

      return true
    })
  }, [rootTasks, subtasksByParent, searchQuery, statusFilter, priorityFilter, energyFilter])

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    statusFilter !== 'all' ||
    priorityFilter !== 'all' ||
    energyFilter !== 'all'

  const clearFilters = () => {
    setSearchQuery('')
    setStatusFilter('all')
    setPriorityFilter('all')
    setEnergyFilter('all')
  }

  // Priority badge helper
  const getPriorityBadge = (p: TaskPriority) => {
    switch (p) {
      case 'urgent':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
            Urgent
          </span>
        )
      case 'high':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            High
          </span>
        )
      case 'medium':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-500/15 text-sky-300 border border-sky-500/30">
            Medium
          </span>
        )
      case 'low':
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-500/15 text-slate-400 border border-slate-500/30">
            Low
          </span>
        )
    }
  }

  // Energy badge helper
  const getEnergyBadge = (level?: number | null) => {
    return <CognitiveEnergyBadge level={level} />
  }

  // Drag-and-drop handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId)
    e.dataTransfer.setData('text/plain', taskId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, colId: TaskStatus) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (activeDropColumn !== colId) {
      setActiveDropColumn(colId)
    }
  }

  const handleDragLeave = () => {
    setActiveDropColumn(null)
  }

  const handleDrop = async (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault()
    setActiveDropColumn(null)
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId
    setDraggedTaskId(null)
    if (!taskId) return

    const taskToMove = tasks.find((t) => t.id === taskId)
    if (taskToMove && taskToMove.status !== targetStatus) {
      await onUpdateTaskStatus(taskToMove, targetStatus)
    }
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-6">
      {/* Top Header & View Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-[#F8FAFC]">
              Tasks Canvas
            </h1>
            <Badge
              variant="outline"
              className="text-xs bg-white/5 border-white/10 text-[#94A3B8] font-mono px-2 py-0.5"
            >
              {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'}
            </Badge>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Segmented View Switcher: Kanban vs List */}
          <div className="flex items-center bg-[#1E293B]/70 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'kanban'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
              title="Kanban Board View"
              aria-label="Kanban Board View"
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'list'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
              title="List View"
              aria-label="List View"
            >
              <ListIcon className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
          </div>

          {/* New Task Button */}
          <Button
            onClick={() => onOpenNewTask(null)}
            size="sm"
            className="h-8 gap-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:opacity-90 text-white text-xs px-3.5 font-medium shadow-md shadow-indigo-500/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Task</span>
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center gap-3 p-3.5 rounded-2xl bg-[#111827]/70 border border-white/10 backdrop-blur-md">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search tasks and subtasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-8 pl-9 pr-3 bg-[#1E293B]/70 border border-white/10 rounded-xl text-xs text-[#F8FAFC] placeholder:text-[#64748B] focus:outline-none focus:border-indigo-500/60"
            aria-label="Search tasks"
          />
        </div>

        {/* Status Dropdown */}
        <div className="flex items-center gap-1.5">
          <label className="text-[11px] text-[#94A3B8] hidden sm:inline">Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-8 text-xs px-2.5 bg-[#1E293B]/70 border border-white/10 rounded-xl text-[#F8FAFC] focus:outline-none focus:border-indigo-500/60"
            aria-label="Filter by status"
          >
            <option value="all">All Statuses</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {/* Priority Dropdown */}
        <div className="flex items-center gap-1.5">
          <label className="text-[11px] text-[#94A3B8] hidden sm:inline">Priority:</label>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="h-8 text-xs px-2.5 bg-[#1E293B]/70 border border-white/10 rounded-xl text-[#F8FAFC] focus:outline-none focus:border-indigo-500/60"
            aria-label="Filter by priority"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        {/* Cognitive Energy Dropdown (1-5) */}
        <div className="flex items-center gap-1.5">
          <label className="text-[11px] text-[#94A3B8] hidden sm:inline">Energy:</label>
          <select
            value={energyFilter}
            onChange={(e) => setEnergyFilter(e.target.value)}
            className="h-8 text-xs px-2.5 bg-[#1E293B]/70 border border-white/10 rounded-xl text-[#F8FAFC] focus:outline-none focus:border-indigo-500/60"
            aria-label="Filter by cognitive energy"
          >
            <option value="all">All Energy (1-5)</option>
            <option value="1">Level 1 - Low mental effort</option>
            <option value="2">Level 2 - Routine mental effort</option>
            <option value="3">Level 3 - Balanced mental effort</option>
            <option value="4">Level 4 - High mental effort</option>
            <option value="5">Level 5 - Deep-focus / high mental effort</option>
          </select>
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="h-8 px-2.5 text-xs text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/5 rounded-xl border border-white/10 flex items-center gap-1 transition-colors"
            title="Clear all active filters"
          >
            <X className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Error State Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
          {onRetry && (
            <Button
              size="sm"
              variant="outline"
              onClick={onRetry}
              className="h-7 text-xs border-rose-500/30 text-rose-200 hover:bg-rose-500/20"
            >
              Retry
            </Button>
          )}
        </div>
      )}

      {/* Loading Skeletons */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map((col) => (
            <div key={col} className="p-4 rounded-2xl bg-[#111827]/60 border border-white/10 space-y-3">
              <div className="h-6 w-28 bg-white/10 rounded-lg" />
              <div className="h-28 bg-white/5 rounded-xl" />
              <div className="h-28 bg-white/5 rounded-xl" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredTasks.length === 0 && (
        <div className="p-12 rounded-2xl bg-[#111827]/60 border border-white/10 backdrop-blur-md flex flex-col items-center justify-center text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-[#F8FAFC]">
            {hasActiveFilters ? 'No tasks match your filters' : 'Task Canvas is ready'}
          </h3>
          <p className="text-xs text-[#94A3B8] max-w-sm">
            {hasActiveFilters
              ? 'Try adjusting your search terms, priority, or energy level filter to see matching tasks.'
              : 'Create your first actionable task to begin structuring your workflow.'}
          </p>
          <div className="pt-2 flex items-center gap-2">
            {hasActiveFilters ? (
              <Button size="sm" variant="outline" onClick={clearFilters} className="text-xs border-white/10">
                Clear Filters
              </Button>
            ) : null}
            <Button
              size="sm"
              onClick={() => onOpenNewTask(null)}
              className="text-xs bg-gradient-to-r from-indigo-500 to-purple-600 text-white"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              <span>Create Task</span>
            </Button>
          </div>
        </div>
      )}

      {/* View 1: KANBAN BOARD */}
      {!loading && !error && filteredTasks.length > 0 && viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start pb-8">
          {KANBAN_COLUMNS.map((column) => {
            const columnTasks = filteredTasks.filter((t) => t.status === column.id)
            const isDropActive = activeDropColumn === column.id

            return (
              <div
                key={column.id}
                onDragOver={(e) => handleDragOver(e, column.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, column.id)}
                className={`flex flex-col rounded-2xl bg-[#111827]/70 border transition-all duration-200 p-4 min-h-[500px] shadow-sm ${
                  isDropActive
                    ? 'border-indigo-400 bg-indigo-500/10 ring-2 ring-indigo-500/30'
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${column.dotColor}`} />
                    <h3 className="text-xs font-bold text-[#F8FAFC] tracking-wide uppercase">
                      {column.label}
                    </h3>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[#94A3B8]">
                      {columnTasks.length}
                    </span>
                  </div>

                  <button
                    onClick={() => onOpenNewTask(null)}
                    className="p-1 rounded-lg text-[#64748B] hover:text-[#F8FAFC] hover:bg-white/10 transition-colors"
                    title={`Add task to ${column.label}`}
                    aria-label={`Add task to ${column.label}`}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Column Cards Drop Area */}
                <div className="space-y-3 flex-1">
                  {columnTasks.length === 0 ? (
                    <div className="h-32 rounded-xl border border-dashed border-white/10 flex items-center justify-center text-center p-4">
                      <span className="text-[11px] text-[#64748B]">
                        Drag tasks here or click + to add
                      </span>
                    </div>
                  ) : (
                    columnTasks.map((task) => {
                      const isCompleted = task.status === 'completed'
                      const subtasks = subtasksByParent[task.id] || []
                      const isExpanded = !!expandedParents[task.id]

                      return (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, task.id)}
                          onClick={() => onSelectTask(task)}
                          className={`group relative rounded-xl p-4 bg-[#1E293B]/70 border border-white/10 hover:border-white/20 transition-all duration-150 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md ${
                            isCompleted ? 'opacity-70 bg-[#1E293B]/40' : ''
                          }`}
                        >
                          {/* Top Badges: Priority + Energy */}
                          <div className="flex items-center justify-between gap-2 mb-2 flex-wrap sm:flex-nowrap">
                            <div className="flex items-center gap-1.5 shrink-0">
                              {getPriorityBadge(task.priority)}
                              {getEnergyBadge(task.energy_level)}
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <select
                                value={task.status}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) =>
                                  onUpdateTaskStatus(task, e.target.value as TaskStatus)
                                }
                                className="text-[10px] bg-[#0B0F17]/60 border border-white/10 rounded px-1.5 py-0.5 text-[#94A3B8] focus:outline-none focus:border-indigo-500 cursor-pointer"
                                aria-label={`Move ${task.title}`}
                                title="Move to column"
                              >
                                <option value="todo">To Do</option>
                                <option value="in_progress">In Progress</option>
                                <option value="completed">Completed</option>
                              </select>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onSelectTask(task)
                                }}
                                className="text-[#64748B] hover:text-[#F8FAFC] p-0.5 rounded"
                                title="Edit task"
                                aria-label={`Edit task ${task.title}`}
                              >
                                <MoreHorizontal className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Task Title */}
                          <h4
                            className={`text-xs font-semibold leading-snug ${
                              isCompleted ? 'line-through text-[#64748B]' : 'text-[#F8FAFC]'
                            }`}
                          >
                            {task.title}
                          </h4>

                          {/* Description Snippet */}
                          {task.description && (
                            <p className="mt-1 text-[11px] text-[#94A3B8] line-clamp-2 leading-relaxed">
                              {task.description}
                            </p>
                          )}

                          {/* Metadata row: Due Date, Minutes, Subtask indicator */}
                          <div className="mt-3 flex items-center justify-between text-[11px] text-[#64748B] pt-2 border-t border-white/5">
                            <div className="flex items-center gap-2">
                              {task.due_date && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  <span>{new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                </span>
                              )}
                              {task.estimated_minutes && (
                                <span className="flex items-center gap-1 font-mono">
                                  <Clock className="w-3 h-3" />
                                  <span>{task.estimated_minutes}m</span>
                                </span>
                              )}
                            </div>

                            {/* Subtask Count & Expand Accordion */}
                            {subtasks.length > 0 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggleParentExpand(task.id)
                                }}
                                className="flex items-center gap-1 text-[10px] text-indigo-300 hover:text-indigo-200 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20"
                                title="Expand subtasks"
                              >
                                <span>{task.completed_subtask_count}/{subtasks.length}</span>
                                {isExpanded ? (
                                  <ChevronDown className="w-3 h-3" />
                                ) : (
                                  <ChevronRight className="w-3 h-3" />
                                )}
                              </button>
                            )}
                          </div>

                          {/* Expandable Subtask Tree inside card */}
                          {isExpanded && subtasks.length > 0 && (
                            <div
                              className="mt-3 pt-2 border-t border-white/10 space-y-1.5 pl-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {subtasks.map((st) => (
                                <div
                                  key={st.id}
                                  className="flex items-center justify-between gap-2 text-[11px] py-1 px-1.5 rounded hover:bg-white/5"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        onUpdateTaskStatus(
                                          st,
                                          st.status === 'completed' ? 'todo' : 'completed'
                                        )
                                      }
                                      className="text-[#64748B] hover:text-indigo-400 shrink-0"
                                    >
                                      {st.status === 'completed' ? (
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                      ) : (
                                        <Circle className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                    <span
                                      className={`truncate ${
                                        st.status === 'completed'
                                          ? 'line-through text-[#64748B]'
                                          : 'text-[#F8FAFC]'
                                      }`}
                                    >
                                      {st.title}
                                    </span>
                                  </div>
                                  <button
                                    onClick={() => onDeleteTask(st.id)}
                                    className="opacity-0 group-hover:opacity-100 text-[#64748B] hover:text-rose-400"
                                    title="Delete subtask"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}

                              {/* Add Subtask Quick Button */}
                              <button
                                onClick={() => onOpenNewTask(task.id)}
                                className="w-full text-left text-[10px] text-indigo-400 hover:text-indigo-300 pt-1 flex items-center gap-1"
                              >
                                <Plus className="w-3 h-3" />
                                <span>Add subtask</span>
                              </button>
                            </div>
                          )}

                          {/* Quick Add Subtask button when 0 subtasks */}
                          {subtasks.length === 0 && (
                            <div className="mt-2 pt-1 border-t border-white/5 opacity-0 group-hover:opacity-100 transition-opacity flex justify-end">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onOpenNewTask(task.id)
                                }}
                                className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                                title="Add a subtask under this task"
                              >
                                <CornerDownRight className="w-3 h-3" />
                                <span>+ Subtask</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* View 2: LIST VIEW */}
      {!loading && !error && filteredTasks.length > 0 && viewMode === 'list' && (
        <div className="rounded-2xl bg-[#111827]/80 backdrop-blur-md border border-white/10 overflow-hidden shadow-sm">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-3 px-5 py-3 border-b border-white/10 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
            <div className="col-span-5 flex items-center gap-2">Task Title</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Priority & Energy</div>
            <div className="col-span-2">Due Date</div>
            <div className="col-span-1 text-right">Actions</div>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-white/5">
            {filteredTasks.map((task) => {
              const isCompleted = task.status === 'completed'
              const subtasks = subtasksByParent[task.id] || []
              const isExpanded = !!expandedParents[task.id]

              return (
                <div key={task.id} className="group">
                  {/* Parent Row */}
                  <div
                    onClick={() => onSelectTask(task)}
                    className={`grid grid-cols-12 gap-3 px-5 py-3.5 items-center hover:bg-white/[0.03] transition-colors cursor-pointer ${
                      isCompleted ? 'opacity-60 bg-white/[0.01]' : ''
                    }`}
                  >
                    {/* Title + Subtask Expander */}
                    <div className="col-span-5 flex items-center gap-2.5 min-w-0">
                      {subtasks.length > 0 ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleParentExpand(task.id)
                          }}
                          className="text-[#64748B] hover:text-[#F8FAFC] p-0.5"
                          title={isExpanded ? 'Collapse subtasks' : 'Expand subtasks'}
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5" />
                          )}
                        </button>
                      ) : (
                        <div className="w-4" />
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onUpdateTaskStatus(
                            task,
                            isCompleted ? 'todo' : 'completed'
                          )
                        }}
                        className="text-[#64748B] hover:text-indigo-400 p-0.5 shrink-0"
                        aria-label={isCompleted ? 'Mark incomplete' : 'Mark completed'}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Circle className="w-4 h-4" />
                        )}
                      </button>

                      <div className="min-w-0 flex-1">
                        <span
                          className={`text-xs font-medium truncate block ${
                            isCompleted ? 'line-through text-[#64748B]' : 'text-[#F8FAFC]'
                          }`}
                        >
                          {task.title}
                        </span>
                        {task.description && (
                          <span className="text-[11px] text-[#64748B] truncate block mt-0.5">
                            {task.description}
                          </span>
                        )}
                      </div>

                      {subtasks.length > 0 && (
                        <span className="text-[10px] font-mono text-indigo-300 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20 shrink-0">
                          {task.completed_subtask_count}/{subtasks.length}
                        </span>
                      )}
                    </div>

                    {/* Status Select */}
                    <div className="col-span-2">
                      <select
                        value={task.status}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) =>
                          onUpdateTaskStatus(task, e.target.value as TaskStatus)
                        }
                        className="text-xs px-2 py-1 bg-[#1E293B]/80 border border-white/10 rounded-lg text-[#F8FAFC] focus:outline-none focus:border-indigo-500"
                        aria-label="Change task status"
                      >
                        <option value="todo">To Do</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>

                    {/* Priority & Energy */}
                    <div className="col-span-2 flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
                      {getPriorityBadge(task.priority)}
                      {getEnergyBadge(task.energy_level)}
                    </div>

                    {/* Due Date & Minutes */}
                    <div className="col-span-2 text-xs text-[#94A3B8]">
                      {task.due_date ? (
                        <span>{new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      ) : (
                        <span className="text-[#64748B] italic text-[11px]">No deadline</span>
                      )}
                    </div>

                    {/* Actions */}
                    <div
                      className="col-span-1 flex items-center justify-end gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => onOpenNewTask(task.id)}
                        className="p-1 rounded text-[#64748B] hover:text-indigo-400 hover:bg-white/5"
                        title="Add subtask"
                        aria-label="Add subtask"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onSelectTask(task)}
                        className="p-1 rounded text-[#64748B] hover:text-[#F8FAFC] hover:bg-white/5"
                        title="Edit task"
                        aria-label="Edit task"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteTask(task.id)}
                        className="p-1 rounded text-[#64748B] hover:text-rose-400 hover:bg-rose-500/10"
                        title="Delete task"
                        aria-label="Delete task"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Subtask Rows */}
                  {isExpanded && subtasks.length > 0 && (
                    <div className="bg-[#161F30]/60 divide-y divide-white/5 pl-10 pr-5 py-1">
                      {subtasks.map((st) => (
                        <div
                          key={st.id}
                          className="grid grid-cols-12 gap-3 py-2.5 items-center hover:bg-white/[0.02]"
                        >
                          <div className="col-span-5 flex items-center gap-2 min-w-0">
                            <CornerDownRight className="w-3 h-3 text-[#64748B] shrink-0" />
                            <button
                              type="button"
                              onClick={() =>
                                onUpdateTaskStatus(
                                  st,
                                  st.status === 'completed' ? 'todo' : 'completed'
                                )
                              }
                              className="text-[#64748B] hover:text-indigo-400 shrink-0"
                            >
                              {st.status === 'completed' ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Circle className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <span
                              className={`text-xs truncate ${
                                st.status === 'completed'
                                  ? 'line-through text-[#64748B]'
                                  : 'text-[#F8FAFC]'
                              }`}
                            >
                              {st.title}
                            </span>
                          </div>

                          <div className="col-span-2 text-[11px] text-[#94A3B8] capitalize">
                            {st.status.replace('_', ' ')}
                          </div>

                          <div className="col-span-2">
                            {getPriorityBadge(st.priority)}
                          </div>

                          <div className="col-span-2 text-[11px] text-[#64748B]">
                            {st.due_date
                              ? new Date(st.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                              : '—'}
                          </div>

                          <div className="col-span-1 flex items-center justify-end gap-1">
                            <button
                              onClick={() => onDeleteTask(st.id)}
                              className="p-1 rounded text-[#64748B] hover:text-rose-400"
                              title="Delete subtask"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
