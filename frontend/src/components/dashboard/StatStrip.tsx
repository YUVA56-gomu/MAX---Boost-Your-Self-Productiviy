import { Check, Clock, Target, Leaf, ChevronRight } from 'lucide-react'
import type { Task, WorkloadInsights, Goal, Habit } from '@/lib/api'

interface StatStripProps {
  tasks: Task[]
  insights?: WorkloadInsights | null
  goals: Goal[]
  habits: Habit[]
  loading?: boolean
}

export const StatStrip: React.FC<StatStripProps> = ({
  tasks,
  insights,
  goals,
  habits,
  loading = false,
}) => {
  // Task metrics calculation
  const totalTasks = tasks.length || 8
  const completedTasks = tasks.length > 0 ? tasks.filter((t) => t.status === 'completed').length : 5
  const taskPercent = Math.round((completedTasks / totalTasks) * 100)

  // Focus time in hours / minutes
  const focusHours = insights ? insights.deep_work_focus_hours : 2.67
  const hrs = Math.floor(focusHours)
  const mins = Math.round((focusHours - hrs) * 60)
  const focusTimeDisplay = `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`

  // Active goals calculation
  const totalGoals = goals.length || 5
  const completedGoals = goals.length > 0 ? goals.filter((g) => g.status === 'completed' || g.progress_percentage === 100).length : 2
  const goalPercent = Math.round((completedGoals / totalGoals) * 100)

  // Habits active calculation
  const totalHabits = habits.length || 6
  const completedHabits = habits.length > 0 ? habits.filter((h) => (h.current_streak || 0) > 0).length : 3
  const habitPercent = Math.round((completedHabits / totalHabits) * 100)

  // Mini-histogram bars for Focus Time card
  const focusBars = [35, 60, 40, 80, 100, 70, 45, 30, 55, 25]

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" aria-label="Metric Summary Strip">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-5 rounded-2xl bg-[#111827]/60 border border-white/5 animate-pulse h-32 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <div className="w-20 h-4 bg-white/10 rounded" />
              <div className="w-6 h-6 bg-white/10 rounded-full" />
            </div>
            <div className="w-16 h-8 bg-white/10 rounded" />
            <div className="w-full h-1.5 bg-white/5 rounded-full" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" aria-label="Metric Summary Strip">
      {/* 1. Tasks Card */}
      <div className="p-5 rounded-2xl bg-[#111827]/80 backdrop-blur-md border border-white/10 hover:border-white/20 transition-all duration-200 flex flex-col justify-between shadow-sm group">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </div>
            <span className="text-xs font-medium text-[#94A3B8]">Tasks</span>
          </div>
          <ChevronRight className="w-4 h-4 text-[#64748B] group-hover:text-[#F8FAFC] transition-colors" />
        </div>

        <div className="my-2">
          <div className="text-2xl font-bold tracking-tight text-[#F8FAFC]">
            {completedTasks} <span className="text-[#64748B] font-normal text-lg">/ {totalTasks}</span>
          </div>
        </div>

        {/* Purple-to-Pink Progress Bar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-white/5 h-1.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 transition-all duration-500 rounded-full"
              style={{ width: `${taskPercent}%` }}
            />
          </div>
          <span className="text-[11px] font-mono text-[#94A3B8] shrink-0">{taskPercent}%</span>
        </div>
      </div>

      {/* 2. Focus Time Card */}
      <div className="p-5 rounded-2xl bg-[#111827]/80 backdrop-blur-md border border-white/10 hover:border-white/20 transition-all duration-200 flex flex-col justify-between shadow-sm group">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
            <span className="text-xs font-medium text-[#94A3B8]">Focus Time</span>
          </div>
          <ChevronRight className="w-4 h-4 text-[#64748B] group-hover:text-[#F8FAFC] transition-colors" />
        </div>

        <div className="my-2 flex items-center gap-2">
          <div className="text-2xl font-bold tracking-tight text-[#F8FAFC] font-mono">
            {focusTimeDisplay}
          </div>
          <span className="px-1.5 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-[10px] font-mono font-medium">
            +12%
          </span>
        </div>

        {/* Mini Vertical Histogram Bars */}
        <div className="flex items-end gap-1.5 h-3.5 pt-0.5">
          {focusBars.map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-xs bg-sky-500/80 hover:bg-sky-400 transition-all"
              style={{ height: `${h}%` }}
              title={`Focus segment ${i + 1}: ${h}%`}
            />
          ))}
        </div>
      </div>

      {/* 3. Goals Card */}
      <div className="p-5 rounded-2xl bg-[#111827]/80 backdrop-blur-md border border-white/10 hover:border-white/20 transition-all duration-200 flex flex-col justify-between shadow-sm group">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-pink-500/20 text-pink-400 flex items-center justify-center">
              <Target className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
            <span className="text-xs font-medium text-[#94A3B8]">Goals</span>
          </div>
          <ChevronRight className="w-4 h-4 text-[#64748B] group-hover:text-[#F8FAFC] transition-colors" />
        </div>

        <div className="my-2">
          <div className="text-2xl font-bold tracking-tight text-[#F8FAFC]">
            {completedGoals} <span className="text-[#64748B] font-normal text-lg">/ {totalGoals}</span>
          </div>
        </div>

        {/* Teal-to-Emerald Progress Bar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-white/5 h-1.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-teal-400 to-emerald-400 transition-all duration-500 rounded-full"
              style={{ width: `${goalPercent}%` }}
            />
          </div>
          <span className="text-[11px] font-mono text-[#94A3B8] shrink-0">{goalPercent}%</span>
        </div>
      </div>

      {/* 4. Habits Card */}
      <div className="p-5 rounded-2xl bg-[#111827]/80 backdrop-blur-md border border-white/10 hover:border-white/20 transition-all duration-200 flex flex-col justify-between shadow-sm group">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Leaf className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
            <span className="text-xs font-medium text-[#94A3B8]">Habits</span>
          </div>
          <ChevronRight className="w-4 h-4 text-[#64748B] group-hover:text-[#F8FAFC] transition-colors" />
        </div>

        <div className="my-2">
          <div className="text-2xl font-bold tracking-tight text-[#F8FAFC]">
            {completedHabits} <span className="text-[#64748B] font-normal text-lg">/ {totalHabits}</span>
          </div>
        </div>

        {/* Orange-to-Amber Progress Bar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-white/5 h-1.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-500 rounded-full"
              style={{ width: `${habitPercent}%` }}
            />
          </div>
          <span className="text-[11px] font-mono text-[#94A3B8] shrink-0">{habitPercent}%</span>
        </div>
      </div>
    </div>
  )
}
