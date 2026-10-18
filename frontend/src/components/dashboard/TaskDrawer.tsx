import { useState, useEffect } from 'react'
import { X, Clock, Zap, Trash2, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import type { Task, TaskCreateInput, TaskUpdateInput, TaskPriority, TaskStatus } from '@/lib/api'

interface TaskDrawerProps {
  isOpen: boolean
  onClose: () => void
  task?: Task | null
  workspaceId: string
  parentTaskId?: string | null
  onSaveTask: (taskData: TaskCreateInput | TaskUpdateInput) => Promise<void>
  onDeleteTask?: (taskId: string) => Promise<void>
}

export const TaskDrawer: React.FC<TaskDrawerProps> = ({
  isOpen,
  onClose,
  task,
  workspaceId,
  parentTaskId = null,
  onSaveTask,
  onDeleteTask,
}) => {
  const isEditing = !!task

  const [title, setTitle] = useState(task?.title || '')
  const [description, setDescription] = useState(task?.description || '')
  const [status, setStatus] = useState<TaskStatus>(task?.status || 'todo')
  const [priority, setPriority] = useState<TaskPriority>(task?.priority || 'medium')
  const [energyLevel, setEnergyLevel] = useState<number>(task?.energy_level || 3)
  const [estimatedMinutes, setEstimatedMinutes] = useState<number | undefined>(task?.estimated_minutes ?? 30)
  const [dueDate, setDueDate] = useState<string>(task?.due_date ? task.due_date.slice(0, 10) : '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setError('Task title is required.')
      return
    }

    setIsSubmitting(true)
    setError(null)
    try {
      if (isEditing) {
        const updatePayload: TaskUpdateInput = {
          title: title.trim(),
          description: description.trim() || null,
          status,
          priority,
          energy_level: energyLevel,
          estimated_minutes: estimatedMinutes || null,
          due_date: dueDate ? new Date(dueDate).toISOString() : null,
        }
        await onSaveTask(updatePayload)
      } else {
        const createPayload: TaskCreateInput = {
          workspace_id: workspaceId,
          title: title.trim(),
          description: description.trim() || null,
          status,
          priority,
          energy_level: energyLevel,
          estimated_minutes: estimatedMinutes || null,
          due_date: dueDate ? new Date(dueDate).toISOString() : null,
          parent_id: parentTaskId || null,
        }
        await onSaveTask(createPayload)
      }
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save task'
      setError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (task && onDeleteTask) {
      if (window.confirm(`Delete task "${task.title}"?`)) {
        await onDeleteTask(task.id)
        onClose()
      }
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs transition-opacity duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#111827] border-l border-white/10 h-full flex flex-col p-6 shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={isEditing ? 'Edit Task' : 'Create Task'}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="text-xs bg-indigo-500/10 text-indigo-300 border-indigo-500/30"
            >
              {isEditing ? 'Task Details' : 'New Task'}
            </Badge>
            {isEditing && (
              <span className="text-[11px] font-mono text-[#64748B]">
                ID: {task.id.slice(0, 8)}...
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/10"
            aria-label="Close drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4 flex-1 flex flex-col">
          {/* Status selector (when editing) */}
          {isEditing && (
            <div>
              <label className="text-[11px] font-medium text-[#94A3B8] uppercase block mb-1">
                Status
              </label>
              <div className="grid grid-cols-4 gap-1.5 bg-[#1E293B]/60 p-1 rounded-xl border border-white/5">
                {(['todo', 'in_progress', 'blocked', 'completed'] as TaskStatus[]).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatus(st)}
                    className={`py-1 text-[11px] font-medium rounded-lg capitalize transition-all ${
                      status === st
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                    }`}
                  >
                    {st.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="text-[11px] font-medium text-[#94A3B8] uppercase block mb-1">
              Title *
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Implement Pomodoro timer HUD"
              className="text-sm"
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-[11px] font-medium text-[#94A3B8] uppercase block mb-1">
              Description / Notes
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add contextual details or checklist..."
              rows={4}
              className="w-full rounded-lg border border-white/10 bg-[#1E293B]/60 p-3 text-xs text-[#F8FAFC] placeholder:text-[#64748B] focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50"
            />
          </div>

          {/* Priority & Energy */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium text-[#94A3B8] uppercase block mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full text-xs px-2.5 py-2 bg-[#1E293B]/60 border border-white/10 rounded-lg text-[#F8FAFC] focus:outline-none focus:border-indigo-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-medium text-[#94A3B8] uppercase block mb-1">
                Energy Level (1-5)
              </label>
              <div className="flex items-center gap-1.5 bg-[#1E293B]/60 px-2.5 py-1.5 border border-white/10 rounded-lg">
                {[1, 2, 3, 4, 5].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setEnergyLevel(lvl)}
                    className={`flex-1 py-1 rounded text-xs font-semibold flex items-center justify-center transition-all ${
                      energyLevel >= lvl
                        ? 'text-amber-400 bg-amber-500/20'
                        : 'text-[#64748B] hover:text-[#94A3B8]'
                    }`}
                  >
                    <Zap className="w-3 h-3" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Estimate & Due Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium text-[#94A3B8] uppercase block mb-1">
                Estimate (mins)
              </label>
              <div className="relative">
                <Input
                  type="number"
                  min="5"
                  step="5"
                  value={estimatedMinutes || ''}
                  onChange={(e) => setEstimatedMinutes(Number(e.target.value) || undefined)}
                  placeholder="30"
                  className="pr-8 text-xs font-mono"
                />
                <Clock className="w-3.5 h-3.5 text-[#64748B] absolute right-2.5 top-3 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-medium text-[#94A3B8] uppercase block mb-1">
                Due Date
              </label>
              <div className="relative">
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Footer actions */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-3">
            {isEditing && onDeleteTask ? (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                className="h-9 px-3 gap-1.5 text-xs bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/30"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </Button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                className="h-9 px-3 text-xs border-white/10 text-[#94A3B8] hover:text-[#F8FAFC]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="h-9 px-4 gap-1.5 text-xs bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium shadow-md shadow-indigo-500/20"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isEditing ? 'Save Changes' : 'Create Task'}</span>
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
