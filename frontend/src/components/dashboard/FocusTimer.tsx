import { useState, useEffect, useRef, useCallback } from 'react'
import { Play, Pause, Square, Settings2, Maximize2 } from 'lucide-react'
import { startFocusSession, completeFocusSession, type Task } from '@/lib/api'

interface FocusTimerProps {
  workspaceId: string
  tasks: Task[]
  onSessionSaved?: () => void
}

type TimerMode = 'pomodoro' | 'short_break' | 'long_break'

const MODE_DURATIONS: Record<TimerMode, number> = {
  pomodoro: 25 * 60,
  short_break: 5 * 60,
  long_break: 15 * 60,
}

export const FocusTimer = ({
  workspaceId,
  tasks,
  onSessionSaved,
}: FocusTimerProps) => {
  const [mode, setMode] = useState<TimerMode>('pomodoro')
  const [timeLeft, setTimeLeft] = useState<number>(MODE_DURATIONS.pomodoro)
  const [isRunning, setIsRunning] = useState<boolean>(false)
  const [selectedTaskId, setSelectedTaskId] = useState<string>('')
  const [interruptions, setInterruptions] = useState<number>(0)
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState<boolean>(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const totalDuration = MODE_DURATIONS[mode]
  const progressFraction = (totalDuration - timeLeft) / totalDuration
  const circumference = 2 * Math.PI * 54 // radius = 54
  const strokeDashoffset = circumference - progressFraction * circumference

  // Switch modes
  const handleSwitchMode = (newMode: TimerMode) => {
    setIsRunning(false)
    setMode(newMode)
    setTimeLeft(MODE_DURATIONS[newMode])
    setInterruptions(0)
    setActiveSessionId(null)
  }

  // Complete & Persist session
  const handleAutoFinish = useCallback(async () => {
    if (activeSessionId) {
      setIsSaving(true)
      try {
        const elapsedSeconds = totalDuration - timeLeft || totalDuration
        await completeFocusSession(activeSessionId, elapsedSeconds, interruptions)
        setStatusMessage('Session recorded! Great focus 🔥')
        setActiveSessionId(null)
        if (onSessionSaved) onSessionSaved()
      } catch (err) {
        console.error('Failed to complete focus session:', err)
      } finally {
        setIsSaving(false)
      }
    }
  }, [activeSessionId, totalDuration, timeLeft, interruptions, onSessionSaved])

  // Timer Tick
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false)
            handleAutoFinish()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [isRunning, timeLeft, handleAutoFinish])

  // Play / Pause toggle
  const handleToggleTimer = async () => {
    if (!isRunning) {
      if (!activeSessionId) {
        try {
          const session = await startFocusSession(
            workspaceId,
            selectedTaskId || undefined,
            mode === 'pomodoro' ? 'pomodoro' : 'stopwatch'
          )
          setActiveSessionId(session.id)
        } catch (err) {
          console.warn('Failed to start backend focus session record:', err)
        }
      }
      setIsRunning(true)
    } else {
      setIsRunning(false)
    }
  }

  // Reset timer
  const handleReset = () => {
    setIsRunning(false)
    setTimeLeft(MODE_DURATIONS[mode])
    setInterruptions(0)
    setActiveSessionId(null)
  }

  // Format MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="rounded-2xl bg-[#111827]/80 backdrop-blur-md border border-white/10 p-5 flex flex-col items-center shadow-sm">
      {/* Header */}
      <div className="w-full flex items-center justify-between pb-3 border-b border-white/10">
        <h3 className="text-sm font-semibold text-[#F8FAFC] tracking-tight flex items-center gap-2">
          <span>Focus Timer</span>
          <span className="sr-only">Focus Engine</span>
        </h3>
        <button
          className="text-[#64748B] hover:text-[#F8FAFC] p-1 rounded transition-colors"
          title="Expand"
          aria-label="Expand Focus Timer"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Mode Selectors */}
      <div className="flex items-center gap-1 bg-[#1E293B]/70 p-1 rounded-xl border border-white/5 mt-4 text-xs w-full justify-between">
        <button
          onClick={() => handleSwitchMode('pomodoro')}
          aria-label="Pomodoro"
          className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all text-center ${
            mode === 'pomodoro'
              ? 'bg-[#111827] text-white shadow-sm border border-white/10'
              : 'text-[#94A3B8] hover:text-[#F8FAFC]'
          }`}
        >
          Pomodoro
        </button>
        <button
          onClick={() => handleSwitchMode('short_break')}
          aria-label="Short"
          className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all text-center ${
            mode === 'short_break'
              ? 'bg-[#111827] text-white shadow-sm border border-white/10'
              : 'text-[#94A3B8] hover:text-[#F8FAFC]'
          }`}
        >
          Short Break
        </button>
        <button
          onClick={() => handleSwitchMode('long_break')}
          aria-label="Long"
          className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all text-center ${
            mode === 'long_break'
              ? 'bg-[#111827] text-white shadow-sm border border-white/10'
              : 'text-[#94A3B8] hover:text-[#F8FAFC]'
          }`}
        >
          Long Break
        </button>
      </div>

      {/* Circular Progress Ring */}
      <div className="relative w-44 h-44 my-4 flex items-center justify-center">
        <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 128 128">
          <defs>
            <linearGradient id="focusNeonGlow" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="45%" stopColor="#818CF8" />
              <stop offset="100%" stopColor="#EC4899" />
            </linearGradient>
          </defs>
          {/* Subtle Background Track */}
          <circle
            cx="64"
            cy="64"
            r="54"
            stroke="rgba(255, 255, 255, 0.06)"
            strokeWidth="5"
            fill="transparent"
          />
          {/* Vibrant Neon Gradient Active Ring */}
          <circle
            cx="64"
            cy="64"
            r="54"
            stroke="url(#focusNeonGlow)"
            strokeWidth="5"
            strokeLinecap="round"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-linear"
          />
        </svg>

        {/* Center Countdown Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold font-mono tracking-tight text-[#F8FAFC]">
            {formatTime(timeLeft)}
          </span>
          <span className="text-xs text-[#94A3B8] font-medium mt-0.5">
            Focus
          </span>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-4 mt-1">
        {/* Play / Pause Toggle Button */}
        <button
          onClick={handleToggleTimer}
          aria-label={isRunning ? 'Pause' : 'Start Focus'}
          className="w-10 h-10 rounded-full bg-slate-200 hover:bg-white text-slate-900 flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95"
        >
          {isRunning ? (
            <Pause className="w-4 h-4 fill-current" />
          ) : (
            <Play className="w-4 h-4 fill-current translate-x-0.5" />
          )}
        </button>

        {/* Stop / Reset Button */}
        <button
          onClick={handleReset}
          className="w-10 h-10 rounded-xl bg-[#1E293B]/80 hover:bg-[#334155] border border-white/10 text-slate-300 flex items-center justify-center transition-all"
          title="Reset Timer"
          aria-label="Reset Timer"
        >
          <Square className="w-3.5 h-3.5 fill-current" />
        </button>

        {/* Settings Button */}
        <button
          className="w-10 h-10 rounded-xl text-[#64748B] hover:text-[#F8FAFC] flex items-center justify-center transition-colors"
          title="Focus Settings"
          aria-label="Focus Settings"
        >
          <Settings2 className="w-4 h-4" />
        </button>
      </div>

      {/* Task Link Selection */}
      <div className="mt-4 w-full">
        <select
          value={selectedTaskId}
          onChange={(e) => setSelectedTaskId(e.target.value)}
          className="w-full text-xs px-3 py-1.5 bg-[#1E293B]/60 border border-white/10 rounded-xl text-[#94A3B8] focus:text-[#F8FAFC] focus:outline-none focus:border-indigo-500"
          aria-label="Attach to task"
        >
          <option value="">No task attached (Free Focus)</option>
          {tasks
            .filter((t) => t.status !== 'completed')
            .map((task) => (
              <option key={task.id} value={task.id}>
                {task.title}
              </option>
            ))}
        </select>
      </div>

      {/* Status toast */}
      {isSaving && (
        <div className="mt-2 text-[11px] text-cyan-400 flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>Saving focus session...</span>
        </div>
      )}
      {statusMessage && !isSaving && (
        <div className="mt-2 text-[11px] text-emerald-400 flex items-center gap-1">
          <span>{statusMessage}</span>
        </div>
      )}
    </div>
  )
}
