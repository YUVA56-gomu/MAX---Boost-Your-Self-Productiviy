import React, { useState, useEffect, useCallback } from 'react'
import {
  BarChart3,
  Clock,
  CheckCircle2,
  Flame,
  Calendar,
  Plus,
  RefreshCw,
  AlertCircle,
  Smile,
  ShieldAlert,
  Save,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  fetchWorkloadInsights,
  fetchBlockers,
  createBlocker,
  updateBlocker,
  fetchDailyReview,
  upsertDailyReview,
  type WorkloadInsights,
  type Blocker,
  type DailyReview,
} from '@/lib/api'

const getTodayDateStr = () => new Date().toISOString().split('T')[0]

interface InsightsCanvasProps {
  workspaceId: string
}

export const InsightsCanvas: React.FC<InsightsCanvasProps> = ({ workspaceId }) => {
  const [range, setRange] = useState<'today' | '7d' | '30d'>('7d')
  const [insights, setInsights] = useState<WorkloadInsights | null>(null)
  const [blockers, setBlockers] = useState<Blocker[]>([])
  const [dailyReview, setDailyReview] = useState<DailyReview | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Blocker creation modal/form
  const [isAddingBlocker, setIsAddingBlocker] = useState(false)
  const [blockerTitle, setBlockerTitle] = useState('')
  const [blockerCategory, setBlockerCategory] = useState<'external' | 'technical' | 'energy' | 'scope'>('technical')
  const [blockerDesc, setBlockerDesc] = useState('')

  // Daily review form state
  const [todayDateStr] = useState(() => getTodayDateStr())
  const [wins, setWins] = useState('')
  const [challenges, setChallenges] = useState('')
  const [tomorrowPriorities, setTomorrowPriorities] = useState('')
  const [moodScore, setMoodScore] = useState<number>(4)
  const [energyScore, setEnergyScore] = useState<number>(4)
  const [isSavingReview, setIsSavingReview] = useState(false)
  const [reviewSavedSuccess, setReviewSavedSuccess] = useState(false)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [insightsData, blockersData, reviewData] = await Promise.all([
        fetchWorkloadInsights(workspaceId, range),
        fetchBlockers(workspaceId),
        fetchDailyReview(workspaceId, todayDateStr).catch(() => null),
      ])

      setInsights(insightsData)
      setBlockers(blockersData)
      if (reviewData) {
        setDailyReview(reviewData)
        setWins(reviewData.wins || '')
        setChallenges(reviewData.challenges || '')
        setTomorrowPriorities(reviewData.tomorrow_priorities || '')
        if (reviewData.mood_score) setMoodScore(reviewData.mood_score)
        if (reviewData.energy_score) setEnergyScore(reviewData.energy_score)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load insights data'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }, [workspaceId, range, todayDateStr])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleCreateBlocker = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!blockerTitle.trim()) return

    try {
      setError(null)
      const newBlocker = await createBlocker(
        workspaceId,
        blockerTitle.trim(),
        blockerCategory,
        blockerDesc.trim() || undefined
      )
      setBlockers((prev) => [newBlocker, ...prev])
      setBlockerTitle('')
      setBlockerDesc('')
      setIsAddingBlocker(false)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create blocker'
      setError(msg)
    }
  }

  const handleToggleBlockerResolve = async (blocker: Blocker) => {
    try {
      const nextStatus = blocker.status === 'resolved' ? 'active' : 'resolved'
      const updated = await updateBlocker(blocker.id, { status: nextStatus })
      setBlockers((prev) => prev.map((b) => (b.id === blocker.id ? updated : b)))
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update blocker'
      setError(msg)
    }
  }

  const handleSaveDailyReview = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingReview(true)
    setReviewSavedSuccess(false)
    setError(null)
    try {
      const saved = await upsertDailyReview(todayDateStr, {
        workspace_id: workspaceId,
        wins: wins.trim() || null,
        challenges: challenges.trim() || null,
        tomorrow_priorities: tomorrowPriorities.trim() || null,
        mood_score: moodScore,
        energy_score: energyScore,
      })
      setDailyReview(saved)
      setReviewSavedSuccess(true)
      setTimeout(() => setReviewSavedSuccess(false), 3000)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save daily review'
      setError(msg)
    } finally {
      setIsSavingReview(false)
    }
  }

  const activeBlockers = blockers.filter((b) => b.status === 'active')
  const resolvedBlockers = blockers.filter((b) => b.status === 'resolved')

  return (
    <div data-testid="insights-canvas" className="flex-1 overflow-y-auto px-6 py-6 space-y-8 bg-[#0B0F17] text-slate-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1F2937] pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                Insights & Reflection
                <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-300 border-purple-500/30">
                  SQLite Analytics
                </Badge>
              </h1>
              <p className="text-sm text-slate-400">
                Deterministic analytics calculated directly from your local tasks, focus logs, and daily reviews.
              </p>
            </div>
          </div>
        </div>

        {/* Range Selector & Refresh */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-[#131B2A] border border-[#1F2937] rounded-xl p-1 gap-1">
            <button
              onClick={() => setRange('today')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                range === 'today'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setRange('7d')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                range === '7d'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => setRange('30d')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                range === '30d'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Last 30 Days
            </button>
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={loadData}
            disabled={isLoading}
            className="border-[#1F2937] hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-xl"
            title="Refresh metrics"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Workload Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Planned vs Completed Card */}
        <div className="bg-[#131B2A]/80 border border-[#1F2937] rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Workload Completed</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {insights ? `${insights.total_completed_minutes}m` : '-'}
          </div>
          <p className="text-xs text-slate-400">
            vs {insights?.total_planned_minutes ?? 0}m estimated planned
          </p>
        </div>

        {/* Deep Work Hours */}
        <div className="bg-[#131B2A]/80 border border-[#1F2937] rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Deep Work Logged</span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {insights ? `${insights.deep_work_focus_hours}h` : '-'}
          </div>
          <p className="text-xs text-slate-400">
            From verified focus sessions in period
          </p>
        </div>

        {/* Tasks Completed */}
        <div className="bg-[#131B2A]/80 border border-[#1F2937] rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Tasks Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {insights?.tasks_completed_count ?? 0}
          </div>
          <p className="text-xs text-slate-400">
            {insights?.tasks_rolled_over_count ?? 0} tasks currently active/rolled over
          </p>
        </div>

        {/* Estimation Accuracy */}
        <div className="bg-[#131B2A]/80 border border-[#1F2937] rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Accuracy Ratio</span>
            <BarChart3 className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {insights ? `${Math.round(insights.estimation_accuracy_ratio * 100)}%` : '-'}
          </div>
          <p className="text-xs text-slate-400">
            Completed / Planned actual ratio
          </p>
        </div>
      </div>

      {/* Main Content Grid: Blockers & Daily Review */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Blockers & Obstacles Card */}
        <div className="bg-[#131B2A]/70 border border-[#1F2937] rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
                Active Blockers ({activeBlockers.length})
              </h2>
              <p className="text-xs text-slate-400">
                Identify friction points impeding execution speed.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => setIsAddingBlocker(!isAddingBlocker)}
              className="bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Add Blocker
            </Button>
          </div>

          {/* New Blocker Form */}
          {isAddingBlocker && (
            <form onSubmit={handleCreateBlocker} className="p-4 rounded-xl bg-[#0B0F17] border border-[#1F2937] space-y-3">
              <div className="text-xs font-semibold text-slate-200">Log New Impediment</div>
              <input
                type="text"
                placeholder="What is blocking you?"
                value={blockerTitle}
                onChange={(e) => setBlockerTitle(e.target.value)}
                className="w-full bg-[#131B2A] border border-[#1F2937] rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                autoFocus
              />
              <div className="flex gap-2">
                <select
                  value={blockerCategory}
                  onChange={(e) => setBlockerCategory(e.target.value as any)}
                  className="bg-[#131B2A] border border-[#1F2937] rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
                >
                  <option value="technical">Technical</option>
                  <option value="external">External / Dependency</option>
                  <option value="energy">Low Energy</option>
                  <option value="scope">Scope Creep</option>
                </select>
                <input
                  type="text"
                  placeholder="Optional details..."
                  value={blockerDesc}
                  onChange={(e) => setBlockerDesc(e.target.value)}
                  className="flex-1 bg-[#131B2A] border border-[#1F2937] rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAddingBlocker(false)}
                  className="text-xs text-slate-400"
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-amber-600 hover:bg-amber-500 text-white text-xs">
                  Save Blocker
                </Button>
              </div>
            </form>
          )}

          {/* Active Blockers List */}
          {activeBlockers.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-xs bg-[#0B0F17]/50 rounded-xl border border-[#1F2937]">
              No active blockers! All execution pathways are clear.
            </div>
          ) : (
            <div className="space-y-2.5">
              {activeBlockers.map((b) => (
                <div
                  key={b.id}
                  className="p-3.5 rounded-xl bg-[#0B0F17]/70 border border-[#1F2937] flex items-start justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-200">{b.title}</span>
                      <Badge variant="outline" className="text-[10px] uppercase font-mono tracking-wider border-amber-500/30 bg-amber-500/10 text-amber-300">
                        {b.category}
                      </Badge>
                    </div>
                    {b.description && (
                      <p className="text-xs text-slate-400">{b.description}</p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleToggleBlockerResolve(b)}
                    className="text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/30 flex items-center gap-1 flex-shrink-0"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Resolve
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Recently Resolved Blockers */}
          {resolvedBlockers.length > 0 && (
            <div className="pt-2 border-t border-[#1F2937]/50">
              <span className="text-xs text-slate-400 block mb-2 font-medium">
                Recently Resolved ({resolvedBlockers.length})
              </span>
              <div className="space-y-1.5 opacity-60">
                {resolvedBlockers.slice(0, 3).map((b) => (
                  <div key={b.id} className="text-xs text-slate-400 flex items-center justify-between">
                    <span className="line-through">{b.title}</span>
                    <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-800">
                      Resolved
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Daily Review & Reflection Card */}
        <div className="bg-[#131B2A]/70 border border-[#1F2937] rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-400" />
                Daily Review & Reflection
              </h2>
              <p className="text-xs text-slate-400">
                End-of-day grounding review for {todayDateStr}.
              </p>
            </div>
            {reviewSavedSuccess ? (
              <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-300 border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Saved to SQLite
              </Badge>
            ) : dailyReview ? (
              <span className="text-[11px] text-slate-400">
                Logged in SQLite
              </span>
            ) : null}
          </div>

          <form onSubmit={handleSaveDailyReview} className="space-y-4">
            {/* Wins */}
            <div>
              <label className="text-xs text-slate-300 font-medium block mb-1">
                Today's Wins & Progress
              </label>
              <textarea
                value={wins}
                onChange={(e) => setWins(e.target.value)}
                placeholder="What went well today? What did you ship or learn?"
                rows={2}
                className="w-full bg-[#0B0F17] border border-[#1F2937] rounded-xl p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 resize-none"
              />
            </div>

            {/* Challenges */}
            <div>
              <label className="text-xs text-slate-300 font-medium block mb-1">
                Challenges & Headwinds
              </label>
              <textarea
                value={challenges}
                onChange={(e) => setChallenges(e.target.value)}
                placeholder="What drained your energy or threw you off plan?"
                rows={2}
                className="w-full bg-[#0B0F17] border border-[#1F2937] rounded-xl p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 resize-none"
              />
            </div>

            {/* Tomorrow Priorities */}
            <div>
              <label className="text-xs text-slate-300 font-medium block mb-1">
                Tomorrow's Top Priorities
              </label>
              <input
                type="text"
                value={tomorrowPriorities}
                onChange={(e) => setTomorrowPriorities(e.target.value)}
                placeholder="1-3 critical tasks to tackle first tomorrow"
                className="w-full bg-[#0B0F17] border border-[#1F2937] rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Mood & Energy Pickers */}
            <div className="grid grid-cols-2 gap-4 pt-1">
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1.5 flex items-center gap-1.5">
                  <Smile className="w-3.5 h-3.5 text-amber-400" />
                  Mood Rating (1-5)
                </label>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setMoodScore(val)}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                        moodScore === val
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                          : 'bg-[#0B0F17] border-[#1F2937] text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1.5 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-purple-400" />
                  Energy Level (1-5)
                </label>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setEnergyScore(val)}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                        energyScore === val
                          ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                          : 'bg-[#0B0F17] border-[#1F2937] text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                type="submit"
                disabled={isSavingReview}
                className="bg-purple-600 hover:bg-purple-500 text-white font-medium px-5 rounded-xl text-xs flex items-center gap-2"
              >
                <Save className="w-3.5 h-3.5" />
                {isSavingReview ? 'Saving...' : 'Save Review'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
export default InsightsCanvas
