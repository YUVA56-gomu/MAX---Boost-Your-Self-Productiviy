import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Brain,
  Coffee,
  Check,
  History,
  Target,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  fetchFocusSessions,
  startFocusSession,
  completeFocusSession,
  fetchTasks,
  type FocusSession,
  type Task,
} from '@/lib/api'

interface FocusCanvasProps {
  workspaceId: string
  onSessionCompleted?: () => void
}

type TimerMode = 'pomodoro' | 'deep_work' | 'stopwatch'

export const FocusCanvas: React.FC<FocusCanvasProps> = ({
  workspaceId,
  onSessionCompleted,
}) => {
  const [sessions, setSessions] = useState<FocusSession[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Timer configuration
  const [mode, setMode] = useState<TimerMode>('pomodoro')
  const [selectedTaskId, setSelectedTaskId] = useState<string>('')
  const [energyBefore, setEnergyBefore] = useState<number>(3)
  const [energyAfter, setEnergyAfter] = useState<number>(3)
  const [interruptions, setInterruptions] = useState<number>(0)
  const [sessionNotes, setSessionNotes] = useState<string>('')

  // Live timer state
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [secondsRemaining, setSecondsRemaining] = useState<number>(25 * 60)
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0)
  const [isFinishing, setIsFinishing] = useState(false)

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const getTargetSeconds = useCallback((m: TimerMode): number => {
    switch (m) {
      case 'pomodoro':
        return 25 * 60
      case 'deep_work':
        return 50 * 60
      case 'stopwatch':
        return 0
    }
  }, [])

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [sessionsData, tasksData] = await Promise.all([
        fetchFocusSessions(workspaceId),
        fetchTasks(workspaceId, { status: 'in_progress' }).catch(() =>
          fetchTasks(workspaceId)
        ),
      ])
      setSessions(sessionsData)
      setTasks(tasksData.filter((t) => t.status !== 'completed'))
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load focus sessions'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Timer tick effect
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1)
        if (mode !== 'stopwatch') {
          setSecondsRemaining((prev) => {
            if (prev <= 1) {
              clearInterval(timerRef.current!)
              setIsRunning(false)
              setIsFinishing(true)
              return 0
            }
            return prev - 1
          })
        }
      }, 1000)
    } else if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isRunning, mode])

  const handleModeChange = (newMode: TimerMode) => {
    if (activeSessionId || isRunning) {
      if (!window.confirm('Switching modes will reset your current timer. Continue?')) {
        return
      }
      handleReset()
    }
    setMode(newMode)
    setSecondsRemaining(getTargetSeconds(newMode))
    setElapsedSeconds(0)
  }

  const handleStart = async () => {
    try {
      setError(null)
      if (!activeSessionId) {
        // Persist session initialization to SQLite
        const session = await startFocusSession(
          workspaceId,
          selectedTaskId || undefined,
          mode,
          energyBefore
        )
        setActiveSessionId(session.id)
      }
      setIsRunning(true)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to start session'
      setError(msg)
    }
  }

  const handlePause = () => {
    setIsRunning(false)
  }

  const handleReset = () => {
    setIsRunning(false)
    setActiveSessionId(null)
    setElapsedSeconds(0)
    setSecondsRemaining(getTargetSeconds(mode))
    setInterruptions(0)
    setIsFinishing(false)
  }

  const handleCompleteSession = async () => {
    if (!activeSessionId) {
      setError('No active session found to complete.')
      return
    }

    try {
      setError(null)
      const durationToLog = Math.max(elapsedSeconds, 1)
      await completeFocusSession(
        activeSessionId,
        durationToLog,
        interruptions,
        energyAfter,
        sessionNotes || undefined
      )

      // Refresh sessions and reset timer
      handleReset()
      await loadData()
      if (onSessionCompleted) onSessionCompleted()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to finalize focus session'
      setError(msg)
    }
  }

  // Formatting helpers
  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60)
    const secs = totalSec % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const displayTime =
    mode === 'stopwatch' ? formatTime(elapsedSeconds) : formatTime(secondsRemaining)

  const selectedTask = tasks.find((t) => t.id === selectedTaskId)

  return (
    <div data-testid="focus-canvas" className="flex-1 overflow-y-auto px-6 py-6 space-y-8 bg-[#0B0F17] text-slate-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1F2937] pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Timer className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                Focus Engine
                <Badge variant="outline" className="text-xs bg-cyan-500/10 text-cyan-300 border-cyan-500/30">
                  SQLite-Backed
                </Badge>
              </h1>
              <p className="text-sm text-slate-400">
                Track deep work sessions, maintain cognitive flow, and roll up time directly into task records.
              </p>
            </div>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center bg-[#131B2A] border border-[#1F2937] rounded-xl p-1 gap-1">
          <button
            onClick={() => handleModeChange('pomodoro')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              mode === 'pomodoro'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Pomodoro (25m)
          </button>
          <button
            onClick={() => handleModeChange('deep_work')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              mode === 'deep_work'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Deep Work (50m)
          </button>
          <button
            onClick={() => handleModeChange('stopwatch')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              mode === 'stopwatch'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Stopwatch
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Timer HUD Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Timer Display */}
        <div className="lg:col-span-2 bg-[#131B2A]/90 border border-[#1F2937] rounded-2xl p-8 flex flex-col items-center justify-center relative overflow-hidden shadow-2xl">
          {/* Subtle Ambient Glow */}
          <div
            className={`absolute -top-24 -left-24 w-72 h-72 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
              isRunning ? 'bg-cyan-500/20' : 'bg-slate-700/10'
            }`}
          />

          {/* Active Status Badge */}
          <div className="mb-4">
            {activeSessionId ? (
              <Badge
                variant="outline"
                className={`text-xs px-3 py-1 font-mono uppercase tracking-widest ${
                  isRunning
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 animate-pulse'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                }`}
              >
                {isRunning ? '● Active Session In Progress' : '❚❚ Session Paused'}
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs px-3 py-1 font-mono uppercase text-slate-400 border-slate-700">
                Ready to Focus
              </Badge>
            )}
          </div>

          {/* Big Clock Display */}
          <div className="font-mono text-7xl md:text-8xl font-black tracking-tight text-white my-4 select-none drop-shadow-md">
            {displayTime}
          </div>

          {/* Target Task info if linked */}
          {selectedTask && (
            <div className="flex items-center gap-2 text-sm text-cyan-300 bg-cyan-950/40 border border-cyan-800/50 px-4 py-1.5 rounded-full mb-6">
              <Target className="w-4 h-4" />
              <span className="font-medium truncate max-w-xs">{selectedTask.title}</span>
            </div>
          )}

          {/* Control Buttons */}
          <div className="flex items-center gap-4 mt-2">
            {!isRunning ? (
              <Button
                onClick={handleStart}
                className="bg-cyan-600 hover:bg-cyan-500 text-white font-medium px-8 py-3 rounded-xl shadow-lg shadow-cyan-900/30 flex items-center gap-2 text-base transition-all"
              >
                <Play className="w-5 h-5 fill-current" />
                {activeSessionId ? 'Resume' : 'Start Focus'}
              </Button>
            ) : (
              <Button
                onClick={handlePause}
                variant="secondary"
                className="bg-amber-600 hover:bg-amber-500 text-white font-medium px-8 py-3 rounded-xl shadow-lg flex items-center gap-2 text-base transition-all"
              >
                <Pause className="w-5 h-5 fill-current" />
                Pause
              </Button>
            )}

            {activeSessionId && (
              <Button
                onClick={() => setIsFinishing(true)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 text-base transition-all"
              >
                <CheckCircle2 className="w-5 h-5" />
                Complete
              </Button>
            )}

            <Button
              onClick={handleReset}
              variant="outline"
              size="icon"
              className="border-[#1F2937] hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-xl w-12 h-12"
              title="Reset Timer"
            >
              <RotateCcw className="w-5 h-5" />
            </Button>
          </div>

          {/* Elapsed indicator */}
          {activeSessionId && (
            <p className="text-xs text-slate-400 mt-6">
              Total session time elapsed: <span className="font-mono text-slate-200">{formatTime(elapsedSeconds)}</span>
            </p>
          )}
        </div>

        {/* Session Config & Energy Selector */}
        <div className="bg-[#131B2A]/70 border border-[#1F2937] rounded-2xl p-6 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Session Parameters
            </h3>

            {/* Link to Task */}
            <div>
              <label className="text-xs text-slate-400 font-medium block mb-1.5">
                Attach to Task (Optional)
              </label>
              <select
                disabled={Boolean(activeSessionId)}
                value={selectedTaskId}
                onChange={(e) => setSelectedTaskId(e.target.value)}
                className="w-full bg-[#0B0F17] border border-[#1F2937] text-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500 disabled:opacity-50"
              >
                <option value="">No task linked</option>
                {tasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title} ({t.actual_minutes}m logged)
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                Completing this session automatically adds minutes to the task in SQLite.
              </p>
            </div>

            {/* Starting Energy Level */}
            <div>
              <label className="text-xs text-slate-400 font-medium block mb-2">
                Initial Energy Level (1-5)
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((lvl) => (
                  <button
                    key={lvl}
                    disabled={Boolean(activeSessionId)}
                    type="button"
                    onClick={() => setEnergyBefore(lvl)}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${
                      energyBefore === lvl
                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-sm'
                        : 'bg-[#0B0F17] border-[#1F2937] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Interruption Counter */}
            {activeSessionId && (
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1.5">
                  Interruptions
                </label>
                <div className="flex items-center gap-3 bg-[#0B0F17] border border-[#1F2937] rounded-xl p-2 px-3">
                  <Coffee className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-bold text-slate-200 flex-1">
                    {interruptions} logged
                  </span>
                  <button
                    onClick={() => setInterruptions((prev) => Math.max(0, prev - 1))}
                    className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
                  >
                    -
                  </button>
                  <button
                    onClick={() => setInterruptions((prev) => prev + 1)}
                    className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
                  >
                    +
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-300 font-medium">
              <Brain className="w-3.5 h-3.5 text-cyan-400" />
              Focus Rule
            </div>
            <p>
              Commit to a single unit of work without context switching. Completed sessions are persisted locally.
            </p>
          </div>
        </div>
      </div>

      {/* Completion Modal / Drawer */}
      {isFinishing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#131B2A] border border-[#1F2937] rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl animate-in fade-in duration-150">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Check className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Finalize Focus Session</h3>
                <p className="text-xs text-slate-400">
                  Recorded elapsed time: <span className="font-mono text-emerald-400">{formatTime(elapsedSeconds)}</span>
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-300 font-medium block mb-2">
                  Post-Session Energy Level (1-5)
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setEnergyAfter(lvl)}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${
                        energyAfter === lvl
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                          : 'bg-[#0B0F17] border-[#1F2937] text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1">
                  Session Notes & Reflection
                </label>
                <textarea
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  placeholder="What did you accomplish? Any mental hurdles or discoveries?"
                  rows={3}
                  className="w-full bg-[#0B0F17] border border-[#1F2937] rounded-xl p-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="ghost"
                onClick={() => setIsFinishing(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                Back to Timer
              </Button>
              <Button
                onClick={handleCompleteSession}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-5 rounded-xl flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Save & Persist
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Session History Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-slate-400" />
            Session History
          </h2>
          <span className="text-xs text-slate-400">
            {sessions.length} sessions logged
          </span>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-slate-400 text-sm bg-[#131B2A]/40 rounded-xl border border-[#1F2937]">
            Loading session logs...
          </div>
        ) : sessions.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm bg-[#131B2A]/40 rounded-xl border border-[#1F2937]">
            No focus sessions recorded yet. Start your first session above to build focus momentum!
          </div>
        ) : (
          <div className="bg-[#131B2A]/60 border border-[#1F2937] rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-[#0B0F17]/80 text-xs uppercase font-medium text-slate-400 border-b border-[#1F2937]">
                  <tr>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Duration</th>
                    <th className="px-4 py-3">Energy (Pre → Post)</th>
                    <th className="px-4 py-3">Interruptions</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1F2937]/50">
                  {sessions.map((sess) => {
                    const durMins = Math.round(sess.duration_seconds / 60)
                    const dateStr = new Date(sess.started_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                    return (
                      <tr key={sess.id} className="hover:bg-slate-800/20 transition-colors">
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="text-xs capitalize font-normal border-slate-700 bg-slate-900/40 text-slate-300">
                            {sess.session_type.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 font-mono font-medium text-cyan-300">
                          {durMins} min
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-400">
                          <span className="text-slate-200 font-semibold">{sess.energy_before ?? '-'}</span>
                          {' → '}
                          <span className="text-slate-200 font-semibold">{sess.energy_after ?? '-'}</span>
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {sess.interruption_count > 0 ? (
                            <span className="text-amber-400">{sess.interruption_count}</span>
                          ) : (
                            <span className="text-slate-400">0</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                          {dateStr}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-400 max-w-xs truncate">
                          {sess.notes || <span className="text-slate-400 italic">None</span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
export default FocusCanvas
