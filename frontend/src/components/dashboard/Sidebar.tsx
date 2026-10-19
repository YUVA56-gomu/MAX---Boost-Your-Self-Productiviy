import { useState } from 'react'
import {
  Home,
  CheckSquare,
  Target,
  Repeat,
  Timer,
  BarChart3,
  FileText,
  ChevronLeft,
  ChevronRight,
  Folder,
  Plus,
  X,
  Settings,
  ArrowRight,
  Sparkles,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MaxLogo } from '@/components/brand/MaxLogo'
import { PromoArtwork } from '@/components/brand/PromoArtwork'
import type { Workspace } from '@/lib/api'

interface SidebarProps {
  collapsed: boolean
  onToggleCollapse: () => void
  workspaces: Workspace[]
  activeWorkspaceId: string
  onSelectWorkspace: (id: string) => void
  onAddWorkspace: (name: string) => Promise<void>
  activeNavId?: string
  onSelectNav?: (id: string) => void
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggleCollapse,
  workspaces,
  activeWorkspaceId,
  onSelectWorkspace,
  onAddWorkspace,
  activeNavId = 'home',
  onSelectNav,
}) => {
  const [showAiPromo, setShowAiPromo] = useState(true)
  const [isAddingWorkspace, setIsAddingWorkspace] = useState(false)
  const [newWorkspaceName, setNewWorkspaceName] = useState('')

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newWorkspaceName.trim()) return
    await onAddWorkspace(newWorkspaceName.trim())
    setNewWorkspaceName('')
    setIsAddingWorkspace(false)
  }

  const navItems = [
    { id: 'home', label: 'Home', icon: Home, active: activeNavId === 'home' },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare, active: activeNavId === 'tasks' },
    { id: 'ai-coach', label: 'AI Coach', icon: Sparkles, active: activeNavId === 'ai-coach' },
    { id: 'goals', label: 'Goals', icon: Target, active: activeNavId === 'goals' },
    { id: 'habits', label: 'Habits', icon: Repeat, active: activeNavId === 'habits' },
    { id: 'focus', label: 'Focus', icon: Timer, active: activeNavId === 'focus' },
    { id: 'insights', label: 'Insights', icon: BarChart3, active: activeNavId === 'insights' },
    { id: 'notes', label: 'Notes', icon: FileText, active: activeNavId === 'notes' },
  ]

  return (
    <aside
      className={`relative flex flex-col bg-[#111827] border-r border-white/10 transition-all duration-300 select-none z-20 ${
        collapsed ? 'w-16' : 'w-60'
      }`}
      aria-label="Sidebar Navigation"
    >
      {/* Brand & Header */}
      <div className="h-16 flex items-center px-4 border-b border-white/10 justify-between">
        <div className="flex items-center gap-3 overflow-hidden">
          <MaxLogo size={32} />
          {!collapsed && (
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-wider text-[#F8FAFC]">MAX</span>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-indigo-500/30 bg-indigo-500/10 text-indigo-300">
                v0.1.0
              </Badge>
            </div>
          )}
        </div>

        <button
          onClick={onToggleCollapse}
          className="text-[#94A3B8] hover:text-[#F8FAFC] p-1 rounded-lg hover:bg-white/5 transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
        <div className="space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => onSelectNav?.(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                  item.active
                    ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/10 text-indigo-300 border border-indigo-500/30 shadow-sm'
                    : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/5 border border-transparent'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon className={`w-4 h-4 shrink-0 ${item.active ? 'text-indigo-400' : 'text-[#64748B]'}`} />
                {!collapsed && <span>{item.label}</span>}
              </button>
            )
          })}
        </div>

        {/* Workspaces Section */}
        <div className="pt-6">
          {!collapsed && (
            <div className="flex items-center justify-between px-3 pb-2 text-[11px] font-semibold tracking-wider text-[#64748B] uppercase">
              <span>Workspaces</span>
              <button
                onClick={() => setIsAddingWorkspace(true)}
                className="hover:text-[#F8FAFC] p-0.5 rounded hover:bg-white/10"
                title="Add workspace"
                aria-label="Add workspace"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {isAddingWorkspace && !collapsed && (
            <form onSubmit={handleCreateWorkspace} className="px-2 mb-2">
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  placeholder="Workspace name"
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  className="w-full text-xs px-2 py-1 bg-[#1E293B] border border-white/10 rounded-md text-[#F8FAFC] focus:outline-none focus:border-indigo-500"
                  autoFocus
                />
                <Button size="sm" type="submit" className="h-6 px-2 text-xs">
                  Add
                </Button>
                <button
                  type="button"
                  onClick={() => setIsAddingWorkspace(false)}
                  className="text-[#64748B] hover:text-[#F8FAFC]"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </form>
          )}

          <div className="space-y-0.5">
            {workspaces.map((ws) => {
              const isSelected = ws.id === activeWorkspaceId
              return (
                <button
                  key={ws.id}
                  onClick={() => onSelectWorkspace(ws.id)}
                  className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    isSelected
                      ? 'text-[#F8FAFC] bg-white/10'
                      : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/5'
                  }`}
                  title={collapsed ? ws.name : undefined}
                >
                  <Folder
                    className="w-3.5 h-3.5 shrink-0"
                    style={{ color: ws.color || '#6366F1' }}
                  />
                  {!collapsed && <span className="truncate">{ws.name}</span>}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Level Up Promo Card */}
      {showAiPromo && !collapsed && (
        <div className="relative mx-3 mb-4 p-4 rounded-2xl bg-[#151924] border border-white/10 overflow-hidden shadow-lg group">
          {/* Abstract Geometric Corner Artwork */}
          <PromoArtwork className="absolute -top-1 -right-1 w-32 h-24 pointer-events-none" />

          {/* Dismiss button */}
          <button
            onClick={() => setShowAiPromo(false)}
            className="absolute top-2 right-2 text-[#64748B] hover:text-[#F8FAFC] p-1 rounded transition-colors z-10"
            title="Dismiss"
            aria-label="Dismiss AI promo"
          >
            <X className="w-3.5 h-3.5" />
          </button>

          <div className="relative z-10 pr-4">
            <h4 className="text-sm font-bold text-white tracking-tight leading-snug">
              Want to<br />level up?
            </h4>
            <p className="mt-2 text-xs text-[#94A3B8] leading-relaxed max-w-[150px]">
              Add a local AI coach to get personalized insights and plans.
            </p>
          </div>

          {/* Bottom Right Circle Button */}
          <div className="relative z-10 flex justify-end mt-3">
            <button
              onClick={() => onSelectNav?.('ai-coach')}
              className="w-8 h-8 rounded-full bg-[#1E293B]/90 hover:bg-[#334155] border border-white/10 flex items-center justify-center text-white transition-all shadow-sm group-hover:scale-105 cursor-pointer"
              title="Explore AI coach"
              aria-label="Explore AI coach"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Footer Settings */}
      <div className="p-3 border-t border-white/10 flex items-center gap-3">
        <button
          className="w-full flex items-center gap-3 px-2 py-1.5 rounded-lg text-xs text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/5 transition-colors"
          title="Settings"
        >
          <Settings className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Settings</span>}
        </button>
      </div>
    </aside>
  )
}
