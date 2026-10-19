import React, { useState, useEffect, useCallback } from 'react'
import {
  Repeat,
  Plus,
  CheckCircle2,
  Circle,
  Flame,
  Trophy,
  Trash2,
  Sun,
  Sunset,
  Moon,
  Clock,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  fetchHabits,
  createHabit,
  logHabit,
  deleteHabit,
  type Habit,
} from '@/lib/api'

interface HabitsCanvasProps {
  workspaceId: string
  onHabitMutated?: () => void
}

function getTodayIsoString(): string {
  return new Date().toISOString().split('T')[0]
}

export const HabitsCanvas: React.FC<HabitsCanvasProps> = ({
  workspaceId,
  onHabitMutated,
}) => {
  const [habits, setHabits] = useState<Habit[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Creation form state
  const [isCreating, setIsCreating] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newFrequency, setNewFrequency] = useState('daily')
  const [newTimeOfDay, setNewTimeOfDay] = useState('any')
  const [newDescription, setNewDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Toggling state tracker to prevent rapid multi-clicks
  const [loggingHabitId, setLoggingHabitId] = useState<string | null>(null)

  const loadHabits = useCallback(async () => {
    if (!workspaceId) return
    setLoading(true)
    setError(null)
    try {
      const data = await fetchHabits(workspaceId)
      setHabits(data)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load habits'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    void loadHabits()
  }, [loadHabits])

  const handleCreateHabit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim() || !workspaceId) return
    setIsSubmitting(true)
    try {
      await createHabit(
        workspaceId,
        newTitle.trim(),
        newFrequency,
        newTimeOfDay,
        newDescription.trim() || undefined
      )
      setNewTitle('')
      setNewDescription('')
      setIsCreating(false)
      await loadHabits()
      if (onHabitMutated) onHabitMutated()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create habit'
      setError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleHabit = async (habit: Habit) => {
    if (loggingHabitId === habit.id) return
    setLoggingHabitId(habit.id)
    try {
      const today = getTodayIsoString()
      const nextCompleted = !habit.logged_today
      await logHabit(habit.id, today, nextCompleted)
      await loadHabits()
      if (onHabitMutated) onHabitMutated()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to log habit'
      setError(msg)
    } finally {
      setLoggingHabitId(null)
    }
  }

  const handleDeleteHabit = async (habitId: string) => {
    try {
      await deleteHabit(habitId)
      setHabits((prev) => prev.filter((h) => h.id !== habitId))
      if (onHabitMutated) onHabitMutated()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete habit'
      setError(msg)
    }
  }

  // Summary statistics
  const totalCount = habits.length
  const completedTodayCount = habits.filter((h) => h.logged_today).length
  const completionRate = totalCount > 0 ? Math.round((completedTodayCount / totalCount) * 100) : 0
  const maxStreak = habits.reduce((max, h) => Math.max(max, h.best_streak || 0), 0)

  const getTimeIcon = (timeOfDay?: string | null) => {
    switch (timeOfDay) {
      case 'morning':
        return <Sun className="w-3.5 h-3.5 text-amber-400" />
      case 'afternoon':
        return <Sunset className="w-3.5 h-3.5 text-orange-400" />
      case 'evening':
        return <Moon className="w-3.5 h-3.5 text-indigo-400" />
      default:
        return <Clock className="w-3.5 h-3.5 text-cyan-400" />
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12" data-testid="habits-canvas">
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-[#111827] border border-white/10 shadow-lg">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Repeat className="w-5 h-5 text-emerald-400" />
            Habits & Daily Consistency
          </h1>
          <p className="text-xs text-[#94A3B8] mt-1">
            Build streak momentum, track completion consistency, and anchor daily routines.
          </p>
        </div>

        <Button
          onClick={() => setIsCreating((prev) => !prev)}
          className="h-9 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-semibold text-xs rounded-xl shadow-md flex items-center gap-1.5 shrink-0"
          aria-label="New Habit"
        >
          <Plus className="w-4 h-4" />
          <span>New Habit</span>
        </Button>
      </div>

      {/* 2. Stat Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-[#111827] border border-white/10">
          <span className="text-[10px] text-[#94A3B8] uppercase tracking-wider block">Active Habits</span>
          <span className="text-xl font-bold text-white font-mono">{totalCount}</span>
        </div>

        <div className="p-4 rounded-xl bg-[#111827] border border-white/10">
          <span className="text-[10px] text-[#94A3B8] uppercase tracking-wider block">Completed Today</span>
          <span className="text-xl font-bold text-emerald-400 font-mono">
            {completedTodayCount}/{totalCount}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-[#111827] border border-white/10">
          <span className="text-[10px] text-[#94A3B8] uppercase tracking-wider block">Today's Rate</span>
          <span className="text-xl font-bold text-cyan-400 font-mono">{completionRate}%</span>
        </div>

        <div className="p-4 rounded-xl bg-[#111827] border border-white/10">
          <span className="text-[10px] text-[#94A3B8] uppercase tracking-wider block">Best Record</span>
          <span className="text-xl font-bold text-amber-400 font-mono flex items-center gap-1">
            <Trophy className="w-4 h-4 text-amber-400" />
            {maxStreak}d
          </span>
        </div>
      </div>

      {/* 3. New Habit Form */}
      {isCreating && (
        <form
          onSubmit={handleCreateHabit}
          className="p-5 rounded-2xl bg-[#151924] border border-emerald-500/30 space-y-4 shadow-xl"
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <h3 className="text-sm font-bold text-white">Create New Habit</h3>
            <span className="text-[11px] text-[#94A3B8]">Persisted in SQLite</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1 space-y-1">
              <label className="text-xs font-semibold text-[#CBD5E1]">Habit Title *</label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Deep Work Morning Block"
                className="w-full h-9 px-3 bg-[#0B0F17] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#CBD5E1]">Frequency</label>
              <select
                value={newFrequency}
                onChange={(e) => setNewFrequency(e.target.value)}
                className="w-full h-9 px-3 bg-[#0B0F17] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500/50"
              >
                <option value="daily">Daily (7 days)</option>
                <option value="weekdays">Weekdays Only (Mon-Fri)</option>
                <option value="weekly_target">Weekly Target</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#CBD5E1]">Preferred Time</label>
              <select
                value={newTimeOfDay}
                onChange={(e) => setNewTimeOfDay(e.target.value)}
                className="w-full h-9 px-3 bg-[#0B0F17] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500/50"
              >
                <option value="any">Any Time</option>
                <option value="morning">Morning</option>
                <option value="afternoon">Afternoon</option>
                <option value="evening">Evening</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#CBD5E1]">Description / Context (Optional)</label>
            <input
              type="text"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="e.g. 45 minutes focused coding with zero social media distraction"
              className="w-full h-9 px-3 bg-[#0B0F17] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsCreating(false)}
              className="text-xs text-[#94A3B8]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || !newTitle.trim()}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4"
            >
              {isSubmitting ? 'Saving...' : 'Save Habit'}
            </Button>
          </div>
        </form>
      )}

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <Button size="sm" variant="outline" onClick={loadHabits} className="h-7 text-xs">
            Retry
          </Button>
        </div>
      )}

      {/* 4. Habits List */}
      {loading ? (
        <div className="p-12 text-center text-xs text-[#94A3B8] space-y-2">
          <RefreshCw className="w-5 h-5 animate-spin mx-auto text-emerald-400" />
          <p>Loading habits from SQLite...</p>
        </div>
      ) : habits.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#111827] border border-white/10 space-y-3">
          <Repeat className="w-10 h-10 mx-auto text-[#64748B]" />
          <h3 className="text-sm font-semibold text-white">No habits created yet</h3>
          <p className="text-xs text-[#94A3B8] max-w-sm mx-auto">
            Establish atomic habits to maintain consistency and track daily streaks.
          </p>
          <Button
            size="sm"
            onClick={() => setIsCreating(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs mt-2"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Create First Habit
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {habits.map((habit) => {
            const isLogged = habit.logged_today
            const isBusy = loggingHabitId === habit.id

            return (
              <div
                key={habit.id}
                className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                  isLogged
                    ? 'bg-emerald-950/20 border-emerald-500/30'
                    : 'bg-[#111827] border-white/10 hover:border-emerald-500/20'
                }`}
              >
                {/* Left: Info */}
                <div className="flex items-start gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => handleToggleHabit(habit)}
                    disabled={isBusy}
                    className="mt-0.5 shrink-0 text-[#64748B] hover:text-emerald-400 transition-colors cursor-pointer"
                    title={isLogged ? 'Mark incomplete' : 'Check-in today'}
                    aria-label={`Toggle habit ${habit.title}`}
                  >
                    {isLogged ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                    ) : (
                      <Circle className="w-6 h-6 hover:text-emerald-400" />
                    )}
                  </button>

                  <div className="min-w-0 space-y-1">
                    <h4 className={`text-sm font-semibold leading-snug truncate ${isLogged ? 'line-through text-[#94A3B8]' : 'text-white'}`}>
                      {habit.title}
                    </h4>
                    {habit.description && (
                      <p className="text-xs text-[#64748B] line-clamp-1">
                        {habit.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-2 pt-0.5">
                      <span className="text-[11px] text-[#94A3B8] flex items-center gap-1">
                        {getTimeIcon(habit.time_of_day)}
                        <span className="capitalize">{habit.time_of_day || 'any'}</span>
                      </span>

                      <Badge
                        variant="outline"
                        className="text-[10px] font-mono border-white/10 bg-white/5 text-[#CBD5E1]"
                      >
                        {habit.frequency || 'daily'}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Right: Streak Badges & Delete */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold font-mono bg-amber-500/10 border border-amber-500/20 text-amber-300">
                      <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      {habit.current_streak}d
                    </span>
                    <span className="text-[10px] text-[#64748B] block mt-0.5 font-mono">
                      Best: {habit.best_streak}d
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteHabit(habit.id)}
                    className="text-[#64748B] hover:text-rose-400 p-1.5 rounded transition-colors"
                    title="Delete habit"
                    aria-label="Delete habit"
                  >
                    <Trash2 className="w-4 h-4" />
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
