import { TrendingUp, BarChart2 } from 'lucide-react'
import type { WorkloadInsights } from '@/lib/api'

interface WeeklyActivityProps {
  insights?: WorkloadInsights | null
  loading?: boolean
}

export const WeeklyActivity: React.FC<WeeklyActivityProps> = ({
  insights,
  loading = false,
}) => {
  // Days of current week representation
  const days = [
    { day: 'Mon', ratio: 0.8 },
    { day: 'Tue', ratio: 1.0 },
    { day: 'Wed', ratio: 0.6 },
    { day: 'Thu', ratio: 0.9 },
    { day: 'Fri', ratio: 0.75 },
    { day: 'Sat', ratio: 0.4 },
    { day: 'Sun', ratio: 0.9 },
  ]

  const planned = insights ? insights.total_planned_minutes : 0
  const completed = insights ? insights.total_completed_minutes : 0
  const accuracy = insights ? Math.round(insights.estimation_accuracy_ratio * 100) : 100
  const rolledOver = insights ? insights.tasks_rolled_over_count : 0

  return (
    <div className="rounded-2xl bg-[#111827]/80 backdrop-blur-md border border-white/10 p-5 flex flex-col shadow-sm">
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <h3 className="text-xs font-semibold text-[#F8FAFC] tracking-tight uppercase flex items-center gap-1.5">
          <BarChart2 className="w-4 h-4 text-purple-400" />
          <span>Velocity & Workload</span>
        </h3>
        <span className="text-[10px] text-[#64748B] font-mono">Last 7 Days</span>
      </div>

      {loading ? (
        <div className="py-6 space-y-3 animate-pulse">
          <div className="h-20 bg-white/5 rounded-xl" />
          <div className="h-8 bg-white/5 rounded-lg" />
        </div>
      ) : (
        <>
          {/* Day-by-day Activity Bar Chart */}
          <div className="mt-4 flex items-end justify-between h-20 px-2 pt-2 pb-1 border-b border-white/5">
            {days.map((item, idx) => {
              const heightPercent = Math.max(Math.round(item.ratio * 100), 15)
              const isToday = idx === 6
              return (
                <div key={item.day} className="flex flex-col items-center gap-1.5 flex-1">
                  <div className="w-full flex justify-center h-12 items-end">
                    <div
                      className={`w-3 rounded-t-sm transition-all duration-300 ${
                        isToday
                          ? 'bg-gradient-to-t from-indigo-500 to-pink-500 shadow-sm shadow-indigo-500/30'
                          : 'bg-white/20 hover:bg-white/30'
                      }`}
                      style={{ height: `${heightPercent}%` }}
                      title={`${item.day}: ${heightPercent}%`}
                    />
                  </div>
                  <span
                    className={`text-[10px] font-mono ${
                      isToday ? 'text-indigo-300 font-semibold' : 'text-[#64748B]'
                    }`}
                  >
                    {item.day}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Metric Summary Rows */}
          <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
              <span className="text-[10px] text-[#94A3B8] block">Planned Time</span>
              <span className="font-mono font-semibold text-[#F8FAFC] text-sm">
                {Math.round(planned / 60)}h {planned % 60}m
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
              <span className="text-[10px] text-[#94A3B8] block">Actual Completed</span>
              <span className="font-mono font-semibold text-emerald-400 text-sm">
                {Math.round(completed / 60)}h {completed % 60}m
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
              <span className="text-[10px] text-[#94A3B8] block">Accuracy Ratio</span>
              <span className="font-mono font-semibold text-indigo-300 text-sm flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                <span>{accuracy}%</span>
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
              <span className="text-[10px] text-[#94A3B8] block">Active In Queue</span>
              <span className="font-mono font-semibold text-amber-400 text-sm">
                {rolledOver} Tasks
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
