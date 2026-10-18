import { useEffect, useState, useCallback } from 'react'
import { CheckCircle2, ShieldCheck, Activity, Terminal, ArrowRight, RefreshCw } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { apiFetch } from '@/lib/auth'

interface HealthStatus {
  status: string
  version: string
  database: string
  ai_available: boolean
  active_model?: string | null
}

export function App() {
  const [health, setHealth] = useState<HealthStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchHealth = useCallback(async (isManual = false) => {
    if (isManual) {
      setLoading(true)
    }
    try {
      const response = await apiFetch('http://127.0.0.1:24125/api/v1/health')
      if (!response.ok) {
        throw new Error(`Health probe returned HTTP ${response.status}`)
      }
      const data = await response.json()
      setHealth(data)
      setError(null)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to reach local backend service'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Invoke asynchronous probe on mount without synchronous setState before promise
    let isMounted = true
    const probe = async () => {
      try {
        const response = await apiFetch('http://127.0.0.1:24125/api/v1/health')
        if (!response.ok) {
          throw new Error(`Health probe returned HTTP ${response.status}`)
        }
        const data = await response.json()
        if (isMounted) {
          setHealth(data)
          setError(null)
          setLoading(false)
        }
      } catch (err: unknown) {
        if (isMounted) {
          const message = err instanceof Error ? err.message : 'Failed to reach local backend service'
          setError(message)
          setLoading(false)
        }
      }
    }
    probe()
    return () => {
      isMounted = false
    }
  }, [])

  return (
    <div className="min-h-screen bg-[#0B0F17] text-[#F8FAFC] flex flex-col font-sans">
      {/* Top Header */}
      <header className="border-b border-white/10 bg-[#111827]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
            M
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight flex items-center gap-2">
              MAX
              <Badge variant="outline" className="text-xs bg-indigo-500/20 text-indigo-300 border-indigo-500/30 font-medium">
                Milestone 1 Dev
              </Badge>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-[#94A3B8]">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Loopback Bound (127.0.0.1)
          </span>
          <span className="border-l border-white/10 pl-4">100% Offline Core</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 space-y-8">
        {/* Hero Section */}
        <Card className="rounded-2xl border-white/10 bg-[#111827]/50 backdrop-blur-md p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="relative z-10 space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
              Repository Foundation & Dual-Runtime Bootstrap
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight">
              Adaptive Productivity Desktop App
            </h2>
            <p className="text-[#94A3B8] max-w-2xl text-sm leading-relaxed">
              Operating system for sovereign personal productivity. Architecture baseline established with
              React, TypeScript, Vite, Tailwind CSS v4, shadcn/ui, Python FastAPI, and SQLite WAL mode.
            </p>
          </div>
        </Card>

        {/* Backend Connection Healthcheck Card */}
        <Card className="rounded-2xl border-white/10 bg-[#1E293B]/60 backdrop-blur-md p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold">Local Backend Sidecar Status</h3>
                <p className="text-xs text-[#94A3B8]">Probing HTTP REST health endpoint at 127.0.0.1:24125/api/v1/health</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {loading ? (
                <Badge variant="outline" className="text-xs bg-slate-800 text-slate-400 border-white/10">
                  Connecting...
                </Badge>
              ) : error ? (
                <Badge variant="outline" className="text-xs bg-amber-500/20 text-amber-400 border-amber-500/30">
                  Waiting for backend
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs bg-emerald-500/20 text-emerald-400 border-emerald-500/30 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Healthy
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchHealth(true)}
                disabled={loading}
                className="h-7 text-xs border-white/10 hover:bg-white/5 text-[#94A3B8]"
              >
                <RefreshCw className={`w-3 h-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          <div className="bg-[#0B0F17]/80 rounded-xl p-4 border border-white/5 font-mono text-xs space-y-1.5 text-[#94A3B8]">
            {loading && <p className="text-slate-400">Checking local backend health probe...</p>}
            {error && (
              <div>
                <p className="text-amber-400 font-medium">Backend not currently running on 127.0.0.1:24125</p>
                <p className="text-slate-500 mt-1">Start the backend service via: <code className="text-indigo-300">uv run uvicorn backend.app.main:app --port 24125</code></p>
              </div>
            )}
            {health && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block">Service Status:</span>
                  <span className="text-emerald-400 font-semibold uppercase">{health.status}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">API Version:</span>
                  <span className="text-[#F8FAFC]">{health.version}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Database Engine:</span>
                  <span className={health.database === 'connected' ? 'text-emerald-400' : 'text-amber-400'}>
                    {health.database} {health.database === 'unconfigured' ? '(M2)' : ''}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Local AI:</span>
                  <span className={health.ai_available ? 'text-indigo-400' : 'text-slate-400'}>
                    {health.ai_available ? `Ready (${health.active_model})` : 'Unconfigured (M6)'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Four Core Pillars Architecture Overview */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#94A3B8]">
              Four Core Pillars (Foundation Scope)
            </h3>
            <span className="text-xs text-indigo-400 flex items-center gap-1">
              Specifications in UI.md <ArrowRight className="w-3 h-3" />
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-white/10 bg-[#1E293B]/40 hover:border-indigo-500/40 transition-colors">
              <CardHeader className="p-4 pb-2">
                <Badge variant="outline" className="w-fit text-xs text-indigo-400 border-indigo-500/30 bg-indigo-500/10 mb-1">
                  Pillar 1
                </Badge>
                <CardTitle className="text-sm font-bold text-white">Task Management</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <CardDescription className="text-xs text-[#94A3B8] leading-relaxed">
                  Hierarchical subtasks, cognitive energy tags (1-5), recurrence rules, and audit history.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-[#1E293B]/40 hover:border-purple-500/40 transition-colors">
              <CardHeader className="p-4 pb-2">
                <Badge variant="outline" className="w-fit text-xs text-purple-400 border-purple-500/30 bg-purple-500/10 mb-1">
                  Pillar 2
                </Badge>
                <CardTitle className="text-sm font-bold text-white">Goals & Projects</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <CardDescription className="text-xs text-[#94A3B8] leading-relaxed">
                  Strategic long/short-term horizons, milestone checkpoints, and task roll-up tracking.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-[#1E293B]/40 hover:border-cyan-500/40 transition-colors">
              <CardHeader className="p-4 pb-2">
                <Badge variant="outline" className="w-fit text-xs text-cyan-400 border-cyan-500/30 bg-cyan-500/10 mb-1">
                  Pillar 3
                </Badge>
                <CardTitle className="text-sm font-bold text-white">Habits & Focus</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <CardDescription className="text-xs text-[#94A3B8] leading-relaxed">
                  Compounding habit streaks, Pomodoro/stopwatch HUD, and pre/post energy tracking.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-[#1E293B]/40 hover:border-emerald-500/40 transition-colors">
              <CardHeader className="p-4 pb-2">
                <Badge variant="outline" className="w-fit text-xs text-emerald-400 border-emerald-500/30 bg-emerald-500/10 mb-1">
                  Pillar 4
                </Badge>
                <CardTitle className="text-sm font-bold text-white">Insights & Reflection</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <CardDescription className="text-xs text-[#94A3B8] leading-relaxed">
                  Daily review journaling, planned vs completed workload analytics, and blocker detection.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Security & Offline Guarantees Footer Info */}
        <div className="rounded-xl border border-white/5 bg-[#111827]/30 p-4 flex flex-col md:flex-row items-center justify-between text-xs text-[#94A3B8] gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Ephemeral in-memory authorization: zero tokens stored in persistent browser storage.</span>
          </div>
          <div className="flex items-center gap-2 font-mono text-[11px] text-slate-500">
            <Terminal className="w-3.5 h-3.5" />
            <span>FastAPI Sidecar + React 19 + Vite 8</span>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
