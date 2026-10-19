import { useState, useEffect, useCallback } from 'react'
import {
  X,
  Clock,
  Brain,
  Trash2,
  Save,
  RotateCw,
  History,
  FileText,
  AlertCircle,
  Loader2,
  CheckCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { MarkdownEditor } from '@/components/ui/MarkdownEditor'
import { CognitiveEnergyBadge } from '@/components/ui/CognitiveEnergyBadge'
import { ENERGY_DESCRIPTIONS } from '@/lib/energy'
import {
  fetchTaskHistory,
  fetchTaskRecurrence,
  setTaskRecurrence,
  deleteTaskRecurrence,
  type Task,
  type TaskCreateInput,
  type TaskUpdateInput,
  type TaskPriority,
  type TaskStatus,
  type TaskHistoryEntry,
  type TaskRecurrenceRule,
  type RecurrenceFrequency,
} from '@/lib/api'

interface TaskDrawerProps {
  isOpen: boolean
  onClose: () => void
  task?: Task | null
  workspaceId: string
  parentTaskId?: string | null
  onSaveTask: (taskData: TaskCreateInput | TaskUpdateInput) => Promise<void>
  onDeleteTask?: (taskId: string) => Promise<void>
  onTaskUpdated?: () => void
}

type DrawerTab = 'details' | 'recurrence' | 'history'

const WEEKDAYS = [
  { label: 'Mon', value: 0 },
  { label: 'Tue', value: 1 },
  { label: 'Wed', value: 2 },
  { label: 'Thu', value: 3 },
  { label: 'Fri', value: 4 },
  { label: 'Sat', value: 5 },
  { label: 'Sun', value: 6 },
]

export const TaskDrawer: React.FC<TaskDrawerProps> = ({
  isOpen,
  onClose,
  task,
  workspaceId,
  parentTaskId = null,
  onSaveTask,
  onDeleteTask,
  onTaskUpdated,
}) => {
  const isEditing = !!task
  const [activeTab, setActiveTab] = useState<DrawerTab>('details')

  // Details State
  const [title, setTitle] = useState(task?.title || '')
  const [description, setDescription] = useState(task?.description || '')
  const [status, setStatus] = useState<TaskStatus>(task?.status || 'todo')
  const [priority, setPriority] = useState<TaskPriority>(task?.priority || 'medium')
  const [energyLevel, setEnergyLevel] = useState<number>(task?.energy_level || 3)
  const [estimatedMinutes, setEstimatedMinutes] = useState<number | undefined>(
    task?.estimated_minutes ?? 30
  )
  const [dueDate, setDueDate] = useState<string>(
    task?.due_date ? task.due_date.slice(0, 10) : ''
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Recurrence State
  const [recurrenceRule, setRecurrenceRule] = useState<TaskRecurrenceRule | null>(null)
  const [recurrenceLoading, setRecurrenceLoading] = useState<boolean>(() => !!task?.id)
  const [recurrenceSaving, setRecurrenceSaving] = useState(false)
  const [recurrenceSuccess, setRecurrenceSuccess] = useState<string | null>(null)
  const [frequency, setFrequency] = useState<RecurrenceFrequency>('daily')
  const [intervalDays, setIntervalDays] = useState<number>(1)
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([])
  const [startDate, setStartDate] = useState<string>(() => new Date().toISOString().slice(0, 10))
  const [endDate, setEndDate] = useState<string>('')

  // History State
  const [historyEntries, setHistoryEntries] = useState<TaskHistoryEntry[]>([])
  const [historyLoading, setHistoryLoading] = useState<boolean>(() => !!task?.id)
  const [historyError, setHistoryError] = useState<string | null>(null)

  // Manual Reload Functions
  const loadRecurrence = useCallback(async (taskId: string) => {
    setRecurrenceLoading(true)
    try {
      const rule = await fetchTaskRecurrence(taskId)
      setRecurrenceRule(rule)
      if (rule) {
        setFrequency(rule.frequency)
        setIntervalDays(rule.interval_days || 1)
        setStartDate(rule.start_date ? rule.start_date.slice(0, 10) : new Date().toISOString().slice(0, 10))
        setEndDate(rule.end_date ? rule.end_date.slice(0, 10) : '')
        if (rule.by_weekdays_json) {
          try {
            setSelectedWeekdays(JSON.parse(rule.by_weekdays_json))
          } catch {
            setSelectedWeekdays([])
          }
        }
      }
    } catch (err) {
      console.error('Failed to load recurrence:', err)
    } finally {
      setRecurrenceLoading(false)
    }
  }, [])

  const loadHistory = useCallback(async (taskId: string) => {
    setHistoryLoading(true)
    setHistoryError(null)
    try {
      const history = await fetchTaskHistory(taskId)
      setHistoryEntries(history)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load task history'
      setHistoryError(msg)
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  // Initial load on mount
  useEffect(() => {
    let isCancelled = false
    if (task?.id) {
      fetchTaskRecurrence(task.id)
        .then((rule) => {
          if (!isCancelled) {
            setRecurrenceRule(rule)
            if (rule) {
              setFrequency(rule.frequency)
              setIntervalDays(rule.interval_days || 1)
              setStartDate(rule.start_date ? rule.start_date.slice(0, 10) : new Date().toISOString().slice(0, 10))
              setEndDate(rule.end_date ? rule.end_date.slice(0, 10) : '')
              if (rule.by_weekdays_json) {
                try {
                  setSelectedWeekdays(JSON.parse(rule.by_weekdays_json))
                } catch {
                  setSelectedWeekdays([])
                }
              }
            }
          }
        })
        .catch((err) => console.error('Failed to load recurrence:', err))
        .finally(() => {
          if (!isCancelled) setRecurrenceLoading(false)
        })

      fetchTaskHistory(task.id)
        .then((history) => {
          if (!isCancelled) setHistoryEntries(history)
        })
        .catch((err) => {
          if (!isCancelled) setHistoryError(err instanceof Error ? err.message : 'Failed to load task history')
        })
        .finally(() => {
          if (!isCancelled) setHistoryLoading(false)
        })
    }
    return () => {
      isCancelled = true
    }
  }, [task?.id])

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

  // Save Task Form Submission
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

  // Delete Task
  const handleDelete = async () => {
    if (task && onDeleteTask) {
      if (window.confirm(`Delete task "${task.title}"?`)) {
        await onDeleteTask(task.id)
        onClose()
      }
    }
  }

  // Toggle Weekday Selection
  const toggleWeekday = (val: number) => {
    setSelectedWeekdays((prev) =>
      prev.includes(val) ? prev.filter((d) => d !== val) : [...prev, val].sort()
    )
  }

  // Save Recurrence Rule
  const handleSaveRecurrence = async () => {
    if (!task) return
    if (intervalDays < 1) {
      setError('Interval must be at least 1 day.')
      return
    }
    if (endDate && endDate < startDate) {
      setError('End date cannot be earlier than start date.')
      return
    }

    setRecurrenceSaving(true)
    setError(null)
    setRecurrenceSuccess(null)
    try {
      const savedRule = await setTaskRecurrence(task.id, {
        frequency,
        interval_days: intervalDays,
        by_weekdays: frequency === 'weekly' ? selectedWeekdays : null,
        start_date: startDate,
        end_date: endDate || null,
      })
      setRecurrenceRule(savedRule)
      setRecurrenceSuccess('Recurrence schedule configured successfully.')
      void loadHistory(task.id)
      onTaskUpdated?.()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save recurrence schedule'
      setError(msg)
    } finally {
      setRecurrenceSaving(false)
    }
  }

  // Remove Recurrence Rule
  const handleRemoveRecurrence = async () => {
    if (!task) return
    setRecurrenceSaving(true)
    setError(null)
    setRecurrenceSuccess(null)
    try {
      await deleteTaskRecurrence(task.id)
      setRecurrenceRule(null)
      setRecurrenceSuccess('Recurrence schedule removed.')
      void loadHistory(task.id)
      onTaskUpdated?.()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to remove recurrence'
      setError(msg)
    } finally {
      setRecurrenceSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs transition-opacity duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-[#111827] border-l border-white/10 h-full flex flex-col p-6 shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={isEditing ? 'Edit Task' : 'Create Task'}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <Badge
              variant="outline"
              className="text-xs bg-indigo-500/10 text-indigo-300 border-indigo-500/30"
            >
              {isEditing ? 'Task Details' : 'New Task'}
            </Badge>
            {isEditing && (
              <>
                <CognitiveEnergyBadge level={energyLevel} />
                <span className="text-[11px] font-mono text-[#64748B] hidden sm:inline">
                  ID: {task.id.slice(0, 8)}...
                </span>
              </>
            )}
            {recurrenceRule && (
              <Badge
                variant="outline"
                className="text-[10px] bg-purple-500/10 text-purple-300 border-purple-500/30 flex items-center gap-1"
              >
                <RotateCw className="w-2.5 h-2.5" />
                <span>Recurring</span>
              </Badge>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/10 transition-colors"
            aria-label="Close drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 pt-4 pb-2 border-b border-white/10">
          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'details'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/5'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Details</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('recurrence')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'recurrence'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/5'
            }`}
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Recurrence</span>
            {recurrenceRule && (
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
            )}
          </button>

          {isEditing && (
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'history'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/5'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Audit History</span>
              {historyEntries.length > 0 && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 bg-white/10 rounded-full">
                  {historyEntries.length}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Banner Feedback Messages */}
        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span className="flex-1">{error}</span>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-rose-400 hover:text-rose-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {recurrenceSuccess && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
            <span className="flex-1">{recurrenceSuccess}</span>
            <button
              type="button"
              onClick={() => setRecurrenceSuccess(null)}
              className="text-emerald-400 hover:text-emerald-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* TAB 1: DETAILS */}
        {activeTab === 'details' && (
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
                className="text-sm bg-[#1E293B]/60 border-white/10 text-[#F8FAFC]"
                autoFocus
              />
            </div>

            {/* Markdown Description */}
            <div>
              <label className="text-[11px] font-medium text-[#94A3B8] uppercase block mb-1">
                Description & Notes (Markdown)
              </label>
              <MarkdownEditor
                value={description}
                onChange={setDescription}
                placeholder="Write detailed acceptance criteria, technical notes, or checklists using Markdown..."
                minHeight="140px"
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
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-medium text-[#94A3B8] uppercase">
                    Cognitive Energy
                  </label>
                  <span className="text-[10px] text-cyan-300 font-mono">
                    {ENERGY_DESCRIPTIONS[energyLevel] || `Level ${energyLevel}`}
                  </span>
                </div>
                <div
                  className="flex items-center gap-1 bg-[#1E293B]/60 p-1 border border-white/10 rounded-lg"
                  role="group"
                  aria-label="Cognitive energy level selector"
                >
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setEnergyLevel(lvl)}
                      className={`flex-1 py-1 rounded text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                        energyLevel >= lvl
                          ? 'text-cyan-200 bg-[#0C1A30] border border-cyan-500/40 shadow-sm'
                          : 'text-[#64748B] hover:text-[#94A3B8] hover:bg-white/5 border border-transparent'
                      }`}
                      title={`Cognitive Energy: Level ${lvl} (${ENERGY_DESCRIPTIONS[lvl]}) • Scale: 1 = low mental effort; 5 = deep-focus/high mental effort`}
                      aria-label={`Cognitive energy level ${lvl}: ${ENERGY_DESCRIPTIONS[lvl]}`}
                    >
                      <Brain
                        className={`w-3 h-3 ${energyLevel >= lvl ? 'text-cyan-400' : 'text-[#64748B]'}`}
                        aria-hidden="true"
                      />
                      <span>{lvl}</span>
                    </button>
                  ))}
                </div>
                <p className="mt-1 text-[10px] text-[#64748B]">
                  Scale: 1 = low mental effort; 5 = deep-focus / high mental effort
                </p>
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
                    className="pr-8 text-xs font-mono bg-[#1E293B]/60 border-white/10 text-[#F8FAFC]"
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
                    className="text-xs font-mono bg-[#1E293B]/60 border-white/10 text-[#F8FAFC]"
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
        )}

        {/* TAB 2: RECURRENCE */}
        {activeTab === 'recurrence' && (
          <div className="mt-4 space-y-4 flex-1 flex flex-col">
            {!isEditing ? (
              <div className="p-4 rounded-xl border border-white/10 bg-[#1E293B]/40 text-center space-y-2">
                <RotateCw className="w-8 h-8 text-indigo-400 mx-auto opacity-70" />
                <h4 className="text-sm font-semibold text-[#F8FAFC]">Task not yet created</h4>
                <p className="text-xs text-[#94A3B8] max-w-sm mx-auto">
                  Please create this task first under the Details tab before setting up an automated recurrence schedule.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setActiveTab('details')}
                  className="text-xs border-white/10 text-indigo-300"
                >
                  Return to Details
                </Button>
              </div>
            ) : recurrenceLoading ? (
              <div className="flex items-center justify-center p-12 text-[#94A3B8] gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
                <span className="text-xs">Loading recurrence schedule...</span>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-1 border-b border-white/5">
                  <span className="text-[11px] text-[#94A3B8]">Automated repetition rules</span>
                  <button
                    type="button"
                    onClick={() => loadRecurrence(task.id)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                    disabled={recurrenceLoading}
                  >
                    <RotateCw className={`w-3 h-3 ${recurrenceLoading ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                </div>

                {/* Active Schedule Status Pill */}
                {recurrenceRule ? (
                  <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <RotateCw className="w-3.5 h-3.5 text-purple-400" />
                        <span className="text-xs font-semibold text-purple-300 capitalize">
                          Recurring {recurrenceRule.frequency}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#94A3B8] mt-0.5">
                        Interval: Every {recurrenceRule.interval_days} day(s) &bull; Next due:{' '}
                        {recurrenceRule.next_due_date}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={handleRemoveRecurrence}
                      disabled={recurrenceSaving}
                      className="h-7 px-2.5 text-[11px] bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/30"
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <p className="text-xs text-[#94A3B8]">
                    This task is currently not recurring. Set up a schedule below to automate repetition.
                  </p>
                )}

                {/* Recurrence Frequency */}
                <div>
                  <label className="text-[11px] font-medium text-[#94A3B8] uppercase block mb-1">
                    Frequency
                  </label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as RecurrenceFrequency)}
                    className="w-full text-xs px-2.5 py-2 bg-[#1E293B]/60 border border-white/10 rounded-lg text-[#F8FAFC] focus:outline-none focus:border-indigo-500"
                    aria-label="Recurrence frequency"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekdays">Weekdays (Mon-Fri)</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>

                {/* Interval Days */}
                <div>
                  <label className="text-[11px] font-medium text-[#94A3B8] uppercase block mb-1">
                    Repeat Every (Days / Steps) *
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="365"
                    value={intervalDays}
                    onChange={(e) => setIntervalDays(Math.max(1, Number(e.target.value) || 1))}
                    className="text-xs font-mono bg-[#1E293B]/60 border-white/10 text-[#F8FAFC]"
                    aria-label="Recurrence interval"
                  />
                </div>

                {/* Weekdays picker (if weekly) */}
                {frequency === 'weekly' && (
                  <div>
                    <label className="text-[11px] font-medium text-[#94A3B8] uppercase block mb-1">
                      Repeat on Days
                    </label>
                    <div className="grid grid-cols-7 gap-1.5">
                      {WEEKDAYS.map((day) => {
                        const isSelected = selectedWeekdays.includes(day.value)
                        return (
                          <button
                            key={day.value}
                            type="button"
                            onClick={() => toggleWeekday(day.value)}
                            className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                              isSelected
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'bg-[#1E293B]/60 text-[#94A3B8] hover:text-[#F8FAFC] border border-white/5'
                            }`}
                          >
                            {day.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Start Date & End Date */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-medium text-[#94A3B8] uppercase block mb-1">
                      Start Date *
                    </label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="text-xs font-mono bg-[#1E293B]/60 border-white/10 text-[#F8FAFC]"
                      aria-label="Recurrence start date"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-[#94A3B8] uppercase block mb-1">
                      End Date (Optional)
                    </label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="text-xs font-mono bg-[#1E293B]/60 border-white/10 text-[#F8FAFC]"
                      aria-label="Recurrence end date"
                    />
                  </div>
                </div>

                {/* Save recurrence button */}
                <div className="pt-2">
                  <Button
                    type="button"
                    onClick={handleSaveRecurrence}
                    disabled={recurrenceSaving}
                    className="w-full gap-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-xs h-9"
                  >
                    {recurrenceSaving ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Save className="w-3.5 h-3.5" />
                    )}
                    <span>Save Recurrence Schedule</span>
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: AUDIT HISTORY */}
        {activeTab === 'history' && isEditing && (
          <div className="mt-4 space-y-4 flex-1 flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <span className="text-xs text-[#94A3B8]">
                Immutable timeline of all mutations to this task.
              </span>
              <button
                type="button"
                onClick={() => loadHistory(task.id)}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                disabled={historyLoading}
              >
                <RotateCw className={`w-3 h-3 ${historyLoading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            {historyLoading ? (
              <div className="flex items-center justify-center p-12 text-[#94A3B8] gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
                <span className="text-xs">Loading audit history...</span>
              </div>
            ) : historyError ? (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                {historyError}
              </div>
            ) : historyEntries.length === 0 ? (
              <div className="p-8 text-center text-[#64748B] text-xs">
                No mutation history recorded for this task yet.
              </div>
            ) : (
              <div className="space-y-3 overflow-y-auto max-h-[500px] pr-1">
                {historyEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-3 rounded-xl bg-[#1E293B]/40 border border-white/5 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                          {entry.changed_field}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-[#64748B]">
                        {new Date(entry.timestamp).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </span>
                    </div>

                    <div className="text-xs text-[#94A3B8] flex items-center gap-2 flex-wrap">
                      {entry.old_value !== null && entry.old_value !== undefined ? (
                        <>
                          <span className="line-through text-[#64748B] max-w-[150px] truncate">
                            {entry.old_value}
                          </span>
                          <span className="text-[#64748B]">&rarr;</span>
                        </>
                      ) : null}
                      <span className="text-[#F8FAFC] font-medium max-w-[200px] truncate">
                        {entry.new_value || '(cleared)'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
