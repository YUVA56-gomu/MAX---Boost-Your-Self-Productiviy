import { Search, Plus, Bell, ChevronDown, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Workspace } from '@/lib/api'

interface HeaderProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  activeWorkspace?: Workspace
  onQuickAddTask: () => void
  onOpenAICoach?: () => void
  backendStatus?: 'connected' | 'disconnected' | 'checking'
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  activeWorkspace,
  onQuickAddTask,
  onOpenAICoach,
  backendStatus = 'connected',
}) => {
  return (
    <header className="h-16 px-6 border-b border-white/10 bg-[#111827]/80 backdrop-blur-md flex items-center justify-between gap-4 sticky top-0 z-10">
      {/* Search Input Bar */}
      <div className="flex-1 max-w-md relative">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-[#64748B] absolute left-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search tasks, goals, or anything..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full h-9 pl-9 pr-16 bg-[#1E293B]/60 border border-white/10 rounded-xl text-xs text-[#F8FAFC] placeholder:text-[#64748B] focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
            aria-label="Search"
          />
          <kbd className="absolute right-2.5 px-1.5 py-0.5 text-[10px] font-mono text-[#94A3B8] bg-white/5 border border-white/10 rounded">
            Ctrl K
          </kbd>
        </div>
      </div>

      {/* Right Shell Controls */}
      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
        {/* Active Workspace Chip */}
        {activeWorkspace && (
          <Badge
            variant="outline"
            className="hidden sm:inline-flex items-center gap-1.5 h-8 px-2.5 text-xs border-white/10 bg-white/5 text-[#F8FAFC] rounded-lg"
          >
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: activeWorkspace.color || '#6366F1' }}
            />
            <span className="truncate max-w-[120px]">{activeWorkspace.name}</span>
          </Badge>
        )}

        {/* Local Service Status & Architecture Indicator */}
        <div className="hidden lg:flex items-center gap-2 text-xs">
          {backendStatus === 'connected' && (
            <span
              className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-medium"
              title="Local service connected and operational"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Service Ready</span>
            </span>
          )}
          {backendStatus === 'checking' && (
            <span
              className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[11px] font-medium"
              title="Checking local service readiness"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span>Connecting...</span>
            </span>
          )}
          {backendStatus === 'disconnected' && (
            <span
              className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20 text-[11px] font-medium"
              title="Local service disconnected"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              <span>Service Offline</span>
            </span>
          )}
          <span className="text-[11px] text-[#94A3B8] border-l border-white/10 pl-2 font-medium">
            Local-first
          </span>
        </div>

        {/* AI Coach Quick Access */}
        {onOpenAICoach && (
          <Button
            onClick={onOpenAICoach}
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 border-cyan-500/30 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 text-xs px-2.5 sm:px-3 rounded-lg shadow-sm"
            title="Open Local AI Coach"
            aria-label="Open Local AI Coach"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">AI Coach</span>
          </Button>
        )}

        {/* Quick Add Button */}
        <Button
          onClick={onQuickAddTask}
          size="sm"
          className="h-8 gap-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:opacity-90 text-white font-medium text-xs px-3 rounded-lg shadow-sm shadow-indigo-500/20"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Task</span>
        </Button>

        {/* Notification Bell */}
        <button
          className="w-8 h-8 flex items-center justify-center text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/5 rounded-lg transition-colors relative"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 absolute top-2 right-2" />
        </button>

        {/* Divider & User Profile Chip */}
        <div className="h-5 w-px bg-white/10 mx-0.5 hidden sm:block" />

        <div className="flex items-center gap-2 cursor-pointer group py-1">
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-xs font-bold text-white shadow-sm">
            Y
          </div>
          <span className="text-xs font-medium text-[#F8FAFC] hidden md:inline">
            Yuvaraj
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-[#64748B] group-hover:text-[#F8FAFC] transition-colors" />
        </div>
      </div>
    </header>
  )
}
