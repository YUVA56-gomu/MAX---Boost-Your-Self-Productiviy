import { useState } from 'react'
import {
  CheckCircle2,
  Circle,
  Clock,
  Plus,
  Trash2,
  Calendar,
  AlertCircle,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CognitiveEnergyBadge } from '@/components/ui/CognitiveEnergyBadge'
import type { Task, TaskPriority } from '@/lib/api'

interface TodayTasksProps {
  tasks: Task[]
  searchQuery?: string
  loading?: boolean
  error?: string | null
  onToggleComplete: (task: Task) => Promise<void>
  onSelectTask: (task: Task) => void
  onDeleteTask: (taskId: string) => Promise<void>
  onAddTask: () => void
  onRetry?: () => void
}

export const TodayTasks: React.FC<TodayTasksProps> = ({
  tasks,
  searchQuery = '',
  loading = false,
  error = null,
  onToggleComplete,
  onSelectTask,
  onDeleteTask,
  onAddTask,
  onRetry,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'todo' | 'in_progress' | 'completed'>('all')

  const filterTabs: { id: 'all' | 'todo' | 'in_progress' | 'completed'; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'todo', label: 'To Do' },
    { id: 'in_progress', label: 'In Progress' },
    { id: 'completed', label: 'Completed' },
  ]

  // Filter tasks based on status tab and search query
  const filteredTasks = tasks.filter((task) => {
    // Status filter
    if (activeTab === 'todo' && task.status !== 'todo') return false
    if (activeTab === 'in_progress' && task.status !== 'in_progress') return false
    if (activeTab === 'completed' && task.status !== 'completed') return false

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchTitle = task.title.toLowerCase().includes(q)
      const matchDesc = task.description?.toLowerCase().includes(q)
      if (!matchTitle && !matchDesc) return false
    }

    return true
  })

  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case 'urgent':
        return (
          <Badge className="bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-medium px-2 py-0">
            Urgent
          </Badge>
        )
      case 'high':
        return (
          <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-medium px-2 py-0">
            High
          </Badge>
        )
      case 'medium':
        return (
          <Badge className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-medium px-2 py-0">
            Medium
          </Badge>
        )
      case 'low':
      default:
        return (
          <Badge className="bg-slate-500/20 text-slate-400 border border-slate-500/30 text-[10px] font-medium px-2 py-0">
            Low
          </Badge>
        )
    }
  }

  const formatDueDate = (dateStr?: string | null) => {
    if (!dateStr) return null
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    } catch {
      return null
    }
  }

  return (
    <div className="rounded-2xl bg-[#111827]/80 backdrop-blur-md border border-white/10 p-6 flex flex-col shadow-sm">
      {/* Widget Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold text-[#F8FAFC] tracking-tight">
            Today's Tasks
          </h2>
          <Badge
            variant="outline"
            className="text-xs bg-white/5 border-white/10 text-[#94A3B8] font-mono px-2 py-0.5"
          >
            {tasks.length}
          </Badge>
        </div>

        {/* Tab Filters and Add Button */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <div className="flex items-center bg-[#1E293B]/70 p-1 rounded-xl border border-white/5">
            {filterTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                  activeTab === tab.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <Button
            onClick={onAddTask}
            size="sm"
            className="h-8 gap-1.5 bg-white/10 hover:bg-white/15 text-[#F8FAFC] text-xs px-3 border border-white/10"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Task</span>
          </Button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="my-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          {onRetry && (
            <Button
              size="sm"
              variant="outline"
              onClick={onRetry}
              className="h-7 text-xs border-rose-500/30 text-rose-200"
            >
              Retry
            </Button>
          )}
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-3 py-4" aria-label="Loading tasks">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="p-3.5 rounded-xl bg-[#1E293B]/40 border border-white/5 animate-pulse flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-white/10" />
                <div className="space-y-1.5">
                  <div className="w-44 h-3.5 bg-white/10 rounded" />
                  <div className="w-24 h-2.5 bg-white/5 rounded" />
                </div>
              </div>
              <div className="w-16 h-5 bg-white/10 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredTasks.length === 0 && (
        <div className="py-12 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3 shadow-inner">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-[#F8FAFC]">All clear for today!</h3>
          <p className="mt-1 text-xs text-[#94A3B8] max-w-xs">
            {searchQuery
              ? `No tasks match "${searchQuery}".`
              : activeTab !== 'all'
              ? `No tasks in ${activeTab.replace('_', ' ')} state.`
              : 'Take a break, reflect on your wins, or plan tomorrow’s high-impact goals.'}
          </p>
          <Button
            onClick={onAddTask}
            size="sm"
            className="mt-4 h-8 gap-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create a Task</span>
          </Button>
        </div>
      )}

      {/* Task List Rows */}
      {!loading && !error && filteredTasks.length > 0 && (
        <div className="divide-y divide-white/5 mt-2 space-y-1">
          {filteredTasks.map((task) => {
            const isCompleted = task.status === 'completed'
            const dueDateText = formatDueDate(task.due_date)

            return (
              <div
                key={task.id}
                className={`group flex items-center justify-between p-3 rounded-xl transition-all duration-150 cursor-pointer ${
                  isCompleted
                    ? 'opacity-60 bg-white/[0.01] hover:bg-white/[0.03]'
                    : 'hover:bg-white/[0.04]'
                }`}
                onClick={() => onSelectTask(task)}
              >
                {/* Left: Checkbox & Title */}
                <div className="flex items-center gap-3 min-w-0 flex-1 pr-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onToggleComplete(task)
                    }}
                    className="text-[#64748B] hover:text-indigo-400 p-0.5 rounded transition-colors shrink-0"
                    aria-label={isCompleted ? 'Mark incomplete' : 'Mark completed'}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-emerald-500/10" />
                    ) : (
                      <Circle className="w-5 h-5 hover:border-indigo-400" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    <div
                      className={`text-xs font-medium truncate ${
                        isCompleted
                          ? 'line-through text-[#64748B]'
                          : 'text-[#F8FAFC] group-hover:text-indigo-200'
                      }`}
                    >
                      {task.title}
                    </div>
                    {task.description && (
                      <div className="text-[11px] text-[#64748B] truncate mt-0.5">
                        {task.description}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Badges & Controls */}
                <div
                  className="flex items-center gap-2.5 shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Priority */}
                  {getPriorityBadge(task.priority)}

                  {/* Cognitive Energy Badge */}
                  {task.energy_level && (
                    <CognitiveEnergyBadge
                      level={task.energy_level}
                      className="hidden sm:inline-flex"
                    />
                  )}

                  {/* Estimated Minutes */}
                  {task.estimated_minutes && (
                    <span className="hidden md:inline-flex items-center gap-1 text-[11px] text-[#64748B] font-mono">
                      <Clock className="w-3 h-3 text-[#64748B]" />
                      <span>{task.estimated_minutes}m</span>
                    </span>
                  )}

                  {/* Due Date */}
                  {dueDateText && (
                    <span className="hidden lg:inline-flex items-center gap-1 text-[11px] text-[#64748B]">
                      <Calendar className="w-3 h-3 text-[#64748B]" />
                      <span>{dueDateText}</span>
                    </span>
                  )}

                  {/* Delete Button */}
                  <button
                    onClick={() => onDeleteTask(task.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-[#64748B] hover:text-rose-400 hover:bg-rose-500/10 rounded transition-all"
                    title="Delete task"
                    aria-label="Delete task"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
