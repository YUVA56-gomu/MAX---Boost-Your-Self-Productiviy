import { Search, Plus, Bell, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Workspace } from '@/lib/api'

interface HeaderProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  activeWorkspace?: Workspace
  onQuickAddTask: () => void
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  activeWorkspace,
  onQuickAddTask,
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
      <div className="flex items-center gap-3">
        {/* Active Workspace Chip */}
        {activeWorkspace && (
          <Badge
            variant="outline"
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs border-white/10 bg-white/5 text-[#F8FAFC]"
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: activeWorkspace.color || '#6366F1' }}
            />
            <span>{activeWorkspace.name}</span>
          </Badge>
        )}

        {/* Offline / Localhost Status Pills */}
        <div className="hidden lg:flex items-center gap-2 text-xs text-[#94A3B8]">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            127.0.0.1:24125
          </span>
          <span className="text-[11px] text-[#64748B] border-l border-white/10 pl-2">
            100% Offline
          </span>
        </div>

        {/* Quick Add Button */}
        <Button
          onClick={onQuickAddTask}
          size="sm"
          className="h-8 gap-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:opacity-90 text-white font-medium text-xs px-3 shadow-sm shadow-indigo-500/20"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Task</span>
        </Button>

        {/* Notification Bell */}
        <button
          className="p-1.5 text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/5 rounded-lg transition-colors relative"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 rounded-full bg-indigo-500 absolute top-1 right-1" />
        </button>

        {/* User Profile Chip */}
        <div className="flex items-center gap-2 pl-2 border-l border-white/10 cursor-pointer group">
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
