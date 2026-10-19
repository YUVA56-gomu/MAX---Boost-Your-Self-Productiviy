import React, { useState, useEffect, useCallback } from 'react'
import {
  Target,
  Plus,
  CheckCircle2,
  Circle,
  Calendar,
  Trash2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  fetchGoals,
  createGoal,
  deleteGoal,
  createMilestone,
  updateMilestone,
  deleteMilestone,
  type Goal,
  type Milestone,
} from '@/lib/api'

interface GoalsCanvasProps {
  workspaceId: string
  onGoalMutated?: () => void
}

export const GoalsCanvas: React.FC<GoalsCanvasProps> = ({
  workspaceId,
  onGoalMutated,
}) => {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [filterHorizon, setFilterHorizon] = useState<string>('all')

  // New goal modal / inline form state
  const [isCreatingGoal, setIsCreatingGoal] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newHorizon, setNewHorizon] = useState<'short_term' | 'long_term'>('short_term')
  const [newDescription, setNewDescription] = useState('')
  const [newTargetDate, setNewTargetDate] = useState('')
  const [isSubmittingGoal, setIsSubmittingGoal] = useState(false)

  // New milestone state map { [goalId]: string }
  const [milestoneInputs, setMilestoneInputs] = useState<Record<string, string>>({})

  const loadGoals = useCallback(async () => {
    if (!workspaceId) return
    setLoading(true)
    setError(null)
    try {
      const data = await fetchGoals(workspaceId)
      setGoals(data)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load goals'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    void loadGoals()
  }, [loadGoals])

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim() || !workspaceId) return
    setIsSubmittingGoal(true)
    try {
      await createGoal(
        workspaceId,
        newTitle.trim(),
        newHorizon,
        newDescription.trim() || undefined,
        newTargetDate || undefined
      )
      setNewTitle('')
      setNewDescription('')
      setNewTargetDate('')
      setIsCreatingGoal(false)
      await loadGoals()
      if (onGoalMutated) onGoalMutated()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create goal'
      setError(msg)
    } finally {
      setIsSubmittingGoal(false)
    }
  }

  const handleDeleteGoal = async (goalId: string) => {
    try {
      await deleteGoal(goalId)
      setGoals((prev) => prev.filter((g) => g.id !== goalId))
      if (onGoalMutated) onGoalMutated()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete goal'
      setError(msg)
    }
  }

  const handleToggleMilestone = async (_goal: Goal, milestone: Milestone) => {
    try {
      const nextCompleted = !milestone.is_completed
      await updateMilestone(milestone.id, { is_completed: nextCompleted })
      await loadGoals()
      if (onGoalMutated) onGoalMutated()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update milestone'
      setError(msg)
    }
  }

  const handleAddMilestone = async (goalId: string) => {
    const text = milestoneInputs[goalId]?.trim()
    if (!text) return
    try {
      await createMilestone(goalId, text)
      setMilestoneInputs((prev) => ({ ...prev, [goalId]: '' }))
      await loadGoals()
      if (onGoalMutated) onGoalMutated()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to add milestone'
      setError(msg)
    }
  }

  const handleDeleteMilestone = async (milestoneId: string) => {
    try {
      await deleteMilestone(milestoneId)
      await loadGoals()
      if (onGoalMutated) onGoalMutated()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete milestone'
      setError(msg)
    }
  }

  const filteredGoals = goals.filter((g) => {
    const horizonType = g.goal_type || g.horizon || 'short_term'
    if (filterHorizon === 'all') return true
    if (filterHorizon === 'completed') return g.status === 'completed' || g.progress_percentage === 100
    return horizonType === filterHorizon
  })

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12" data-testid="goals-canvas">
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-[#111827] border border-white/10 shadow-lg">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-400" />
            Strategic Goals & Milestones
          </h1>
          <p className="text-xs text-[#94A3B8] mt-1">
            Track short-term milestones and multi-month objectives with automated progress roll-up.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => setIsCreatingGoal((prev) => !prev)}
            className="h-9 px-4 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl shadow-md flex items-center gap-1.5"
            aria-label="New Goal"
          >
            <Plus className="w-4 h-4" />
            <span>New Goal</span>
          </Button>
        </div>
      </div>

      {/* 2. New Goal Inline Form */}
      {isCreatingGoal && (
        <form
          onSubmit={handleCreateGoal}
          className="p-5 rounded-2xl bg-[#151924] border border-purple-500/30 space-y-4 shadow-xl"
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <h3 className="text-sm font-bold text-white">Create Strategic Goal</h3>
            <span className="text-[11px] text-[#94A3B8]">Persisted in SQLite</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#CBD5E1]">Goal Title *</label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Ship Hacktoberfest Side Hustle Project"
                className="w-full h-9 px-3 bg-[#0B0F17] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500/50"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#CBD5E1]">Horizon Horizon</label>
              <select
                value={newHorizon}
                onChange={(e) => setNewHorizon(e.target.value as 'short_term' | 'long_term')}
                className="w-full h-9 px-3 bg-[#0B0F17] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500/50"
              >
                <option value="short_term">Short-term (1-3 Months)</option>
                <option value="long_term">Long-term (Strategic 6+ Months)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#CBD5E1]">Target Completion Date</label>
              <input
                type="date"
                value={newTargetDate}
                onChange={(e) => setNewTargetDate(e.target.value)}
                className="w-full h-9 px-3 bg-[#0B0F17] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500/50"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#CBD5E1]">Description / Context</label>
              <input
                type="text"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Key outcome or business intent"
                className="w-full h-9 px-3 bg-[#0B0F17] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500/50"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsCreatingGoal(false)}
              className="text-xs text-[#94A3B8]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmittingGoal || !newTitle.trim()}
              className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold px-4"
            >
              {isSubmittingGoal ? 'Saving...' : 'Save Goal'}
            </Button>
          </div>
        </form>
      )}

      {/* 3. Filter Bar */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2 text-xs">
        <span className="text-[#64748B] font-medium mr-1">Filter:</span>
        {[
          { id: 'all', label: 'All Goals' },
          { id: 'short_term', label: 'Short-Term' },
          { id: 'long_term', label: 'Long-Term' },
          { id: 'completed', label: 'Completed' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilterHorizon(tab.id)}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
              filterHorizon === tab.id
                ? 'bg-purple-500/20 border border-purple-500/40 text-purple-300'
                : 'text-[#94A3B8] hover:text-white hover:bg-white/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <Button size="sm" variant="outline" onClick={loadGoals} className="h-7 text-xs">
            Retry
          </Button>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="p-12 text-center text-xs text-[#94A3B8] space-y-2">
          <RefreshCw className="w-5 h-5 animate-spin mx-auto text-purple-400" />
          <p>Loading strategic goals from SQLite...</p>
        </div>
      ) : filteredGoals.length === 0 ? (
        /* Empty State */
        <div className="p-12 text-center rounded-2xl bg-[#111827] border border-white/10 space-y-3">
          <Target className="w-10 h-10 mx-auto text-[#64748B]" />
          <h3 className="text-sm font-semibold text-white">No goals found</h3>
          <p className="text-xs text-[#94A3B8] max-w-sm mx-auto">
            {filterHorizon === 'all'
              ? 'Create your first goal to connect daily task execution with long-term strategic outcomes.'
              : `No ${filterHorizon.replace('_', ' ')} goals found in this workspace.`}
          </p>
          <Button
            size="sm"
            onClick={() => setIsCreatingGoal(true)}
            className="bg-purple-600 hover:bg-purple-500 text-white text-xs mt-2"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Create Goal
          </Button>
        </div>
      ) : (
        /* Goals Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredGoals.map((goal) => {
            const milestones = goal.milestones || []
            const completedCount = milestones.filter((m) => m.is_completed).length
            const isFinished = goal.progress_percentage === 100 || goal.status === 'completed'

            return (
              <div
                key={goal.id}
                className="p-5 rounded-2xl bg-[#111827] border border-white/10 hover:border-purple-500/30 transition-all space-y-4 flex flex-col justify-between"
              >
                <div>
                  {/* Top Badges & Actions */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="text-[10px] uppercase font-mono tracking-wider border-purple-500/30 bg-purple-500/10 text-purple-300"
                      >
                        {goal.goal_type || goal.horizon || 'short_term'}
                      </Badge>
                      {goal.target_date && (
                        <span className="text-[11px] text-[#64748B] flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {goal.target_date}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteGoal(goal.id)}
                      className="text-[#64748B] hover:text-rose-400 p-1 rounded transition-colors"
                      title="Delete goal"
                      aria-label="Delete goal"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Goal Title & Description */}
                  <h3 className={`text-base font-bold leading-snug ${isFinished ? 'line-through text-[#64748B]' : 'text-white'}`}>
                    {goal.title}
                  </h3>
                  {goal.description && (
                    <p className="text-xs text-[#94A3B8] mt-1 leading-relaxed">
                      {goal.description}
                    </p>
                  )}

                  {/* Progress Bar */}
                  <div className="mt-4 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#94A3B8]">Progress</span>
                      <span className="font-mono font-bold text-purple-300">
                        {goal.progress_percentage}%
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-300"
                        style={{ width: `${Math.min(100, Math.max(0, goal.progress_percentage))}%` }}
                      />
                    </div>
                  </div>

                  {/* Milestones Checklist */}
                  <div className="mt-4 space-y-2 pt-3 border-t border-white/5">
                    <span className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider block">
                      Milestones ({completedCount}/{milestones.length})
                    </span>

                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {milestones.map((ms) => (
                        <div
                          key={ms.id}
                          className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-white/[0.02] border border-white/5 text-xs group"
                        >
                          <button
                            type="button"
                            onClick={() => handleToggleMilestone(goal, ms)}
                            className="flex items-center gap-2 text-left flex-1"
                          >
                            {ms.is_completed ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            ) : (
                              <Circle className="w-4 h-4 text-[#64748B] hover:text-purple-400 shrink-0" />
                            )}
                            <span className={ms.is_completed ? 'line-through text-[#64748B]' : 'text-[#E2E8F0]'}>
                              {ms.title}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteMilestone(ms.id)}
                            className="opacity-0 group-hover:opacity-100 text-[#64748B] hover:text-rose-400 p-0.5 rounded transition-opacity"
                            title="Remove milestone"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Add Milestone Form */}
                    <div className="flex items-center gap-1.5 pt-1">
                      <input
                        type="text"
                        value={milestoneInputs[goal.id] || ''}
                        onChange={(e) =>
                          setMilestoneInputs((prev) => ({ ...prev, [goal.id]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            void handleAddMilestone(goal.id)
                          }
                        }}
                        placeholder="Add a sequential milestone checkpoint..."
                        className="flex-1 h-7 px-2.5 bg-[#0B0F17] border border-white/10 rounded-lg text-xs text-white placeholder:text-[#64748B] focus:outline-none focus:border-purple-500/40"
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleAddMilestone(goal.id)}
                        className="h-7 px-2.5 bg-white/5 hover:bg-purple-500/20 text-purple-300 text-xs border border-white/10"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
