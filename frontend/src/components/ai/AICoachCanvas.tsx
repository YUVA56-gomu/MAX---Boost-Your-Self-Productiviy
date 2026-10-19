import React, { useState, useEffect, useCallback } from 'react'
import {
  Brain,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Send,
  RefreshCw,
  Info,
  ShieldCheck,
  TrendingUp,
  MessageSquare,
  Activity,
  Lightbulb,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ProposalCard } from '@/components/ai/ProposalCard'
import { AIOnboardingModal, type OnboardingStep } from '@/components/ai/AIOnboardingModal'
import {
  fetchAIStatus,
  diagnoseProductivity,
  askAICoach,
  type AIStatusResponse,
  type AIDiagnosisResponse,
  type AICoachResponse,
  type ProposedChange,
  type AIApplyProposalResponse,
} from '@/lib/api'

interface AICoachCanvasProps {
  workspaceId: string
  onWorkspaceDataChanged?: () => void
}

interface ChatMessage {
  id: string
  sender: 'user' | 'coach'
  text: string
  timestamp: string
  planningMistake?: string | null
  evidenceUsed?: string[]
  missingData?: string | null
  proposedChanges?: ProposedChange[]
  modelName?: string
  executionTimeMs?: number
  auditId?: string
}

function getCurrentTimeString(): string {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function generateMsgId(prefix: string): string {
  return `${prefix}-${Date.now()}`
}

export const AICoachCanvas: React.FC<AICoachCanvasProps> = ({
  workspaceId,
  onWorkspaceDataChanged,
}) => {
  // Navigation Tabs: 'diagnosis' | 'coach'
  const [activeTab, setActiveTab] = useState<'diagnosis' | 'coach'>('diagnosis')

  // AI Status
  const [aiStatus, setAiStatus] = useState<AIStatusResponse | null>(null)
  const [statusLoading, setStatusLoading] = useState(true)

  // AI Onboarding Modal
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false)
  const [onboardingInitialStep, setOnboardingInitialStep] = useState<OnboardingStep>('detecting')

  // Diagnosis State
  const [diagnosis, setDiagnosis] = useState<AIDiagnosisResponse | null>(null)
  const [isDiagnosing, setIsDiagnosing] = useState(false)
  const [diagnosisError, setDiagnosisError] = useState<string | null>(null)

  // Coach Dialogue State
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'coach',
      text: "Hello! I'm your local AI productivity coach running Gemma 2 2B directly on your workstation. I inspect your actual SQLite tasks, subtasks, milestones, and focus records to diagnose bottlenecks and answer questions about your workload.",
      timestamp: 'Just now',
      modelName: 'gemma2:2b',
    },
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [contextScope, setContextScope] = useState<'all' | 'tasks' | 'goals' | 'habits' | 'focus'>('all')
  const [isSendingMessage, setIsSendingMessage] = useState(false)
  const [coachError, setCoachError] = useState<string | null>(null)

  // Applied proposals notification banner
  const [lastAppliedMessage, setLastAppliedMessage] = useState<string | null>(null)

  // Load local AI status
  const checkStatus = useCallback(async () => {
    setStatusLoading(true)
    try {
      const status = await fetchAIStatus()
      setAiStatus(status)
    } catch {
      setAiStatus({
        enabled: false,
        available: false,
        state: 'ollama_stopped',
        ollama_installed: false,
        service_running: false,
        configured_model: 'gemma2:2b',
        model_available: false,
        base_url: 'http://127.0.0.1:11434',
        installed_models: [],
      })
    } finally {
      setStatusLoading(false)
    }
  }, [])

  useEffect(() => {
    let isMounted = true
    const run = async () => {
      if (isMounted) await checkStatus()
    }
    void run()
    return () => {
      isMounted = false
    }
  }, [checkStatus])

  // Trigger whole-app diagnosis
  const handleRunDiagnosis = async () => {
    if (!workspaceId) return
    setIsDiagnosing(true)
    setDiagnosisError(null)
    try {
      const result = await diagnoseProductivity(workspaceId)
      setDiagnosis(result)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Diagnosis failed'
      setDiagnosisError(msg)
    } finally {
      setIsDiagnosing(false)
    }
  }

  // Submit coach query
  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = (customPrompt || inputMessage).trim()
    if (!textToSend || !workspaceId || isSendingMessage) return

    const userMsgId = generateMsgId('user')
    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text: textToSend,
      timestamp: getCurrentTimeString(),
    }

    setMessages((prev) => [...prev, userMsg])
    setInputMessage('')
    setIsSendingMessage(true)
    setCoachError(null)

    try {
      const response: AICoachResponse = await askAICoach(workspaceId, textToSend, contextScope)
      const coachMsg: ChatMessage = {
        id: response.id || generateMsgId('coach'),
        sender: 'coach',
        text: response.reply,
        timestamp: getCurrentTimeString(),
        planningMistake: response.planning_mistake,
        evidenceUsed: response.evidence_used,
        missingData: response.missing_data_acknowledged,
        proposedChanges: response.proposed_changes,
        modelName: response.model_name,
        executionTimeMs: response.execution_time_ms,
        auditId: response.id,
      }
      setMessages((prev) => [...prev, coachMsg])
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to get coach response'
      setCoachError(msg)
    } finally {
      setIsSendingMessage(false)
    }
  }

  // Proposal applied callback
  const handleProposalApplied = (result: AIApplyProposalResponse) => {
    setLastAppliedMessage(result.message)
    if (onWorkspaceDataChanged) {
      onWorkspaceDataChanged()
    }
  }

  // Pre-configured prompt starters for whole-app guidance
  const promptStarters = [
    'Evaluate my active goal feasibility based on historical velocity',
    'What is my biggest planning bottleneck in this workspace?',
    'How can I balance my workload to prevent deadline overload?',
    'Audit my task duration estimates against historical completion time',
  ]

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12" data-testid="ai-coach-canvas">
      {/* 1. Header & Sovereignty Status Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-[#111827] border border-white/10 p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300">
                <Brain className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  MAX Local AI Intelligence
                  <Badge variant="outline" className="border-cyan-500/40 bg-cyan-500/10 text-cyan-300 text-[10px] font-mono">
                    Gemma 2 2B
                  </Badge>
                </h1>
                <p className="text-xs text-[#94A3B8]">
                  Sovereign whole-app productivity diagnosis, planning error detection & conversational guidance.
                </p>
              </div>
            </div>
          </div>

          {/* Right Status Badge & Onboarding Trigger */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border bg-white/5 border-white/10 text-[#94A3B8]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              On-Device AI • Zero Cloud Telemetry
            </span>

            {statusLoading ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono bg-white/5 border border-white/10 text-[#94A3B8]">
                <RefreshCw className="w-3 h-3 animate-spin" />
                Probing Ollama...
              </span>
            ) : aiStatus?.available ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Local {aiStatus.active_model || 'gemma2:2b'} Ready
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono bg-amber-500/10 border border-amber-500/30 text-amber-300">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                Ollama Daemon Offline
              </span>
            )}

            {/* AI Setup & Diagnostics Launcher Button */}
            <Button
              onClick={() => {
                setOnboardingInitialStep(aiStatus?.available ? 'welcome' : 'detecting')
                setIsOnboardingOpen(true)
              }}
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-xs px-2.5 rounded-full"
              aria-label="AI Setup & Diagnostics"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>AI Setup & Diagnostics</span>
            </Button>
          </div>
        </div>

        {/* Status Alert if AI offline */}
        {!statusLoading && !aiStatus?.available && (
          <div className="mt-4 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-amber-300">
                  Local Ollama daemon is currently unreachable on 127.0.0.1:11434
                </p>
                <p className="text-[#94A3B8]">
                  Start Ollama in your terminal: <code className="text-cyan-300 font-mono">ollama run gemma2:2b</code> or use MAX's guided setup assistant.
                  Core MAX features (Tasks, Kanban, Goals, Notes, Focus Timer) remain 100% operational offline.
                </p>
              </div>
            </div>

            <Button
              onClick={() => {
                setOnboardingInitialStep('detecting')
                setIsOnboardingOpen(true)
              }}
              size="sm"
              className="h-8 shrink-0 bg-gradient-to-r from-amber-500 to-orange-600 hover:opacity-90 text-white font-semibold text-xs px-3 rounded-lg"
              aria-label="Launch Guided Setup"
            >
              Launch Guided Setup
            </Button>
          </div>
        )}


        {/* Success toast after applying proposal */}
        {lastAppliedMessage && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{lastAppliedMessage}</span>
            </span>
            <button
              onClick={() => setLastAppliedMessage(null)}
              className="text-emerald-400 hover:text-white text-xs underline"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* 2. Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2">
        <button
          onClick={() => setActiveTab('diagnosis')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'diagnosis'
              ? 'bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 shadow-sm'
              : 'text-[#94A3B8] hover:text-white hover:bg-white/5'
          }`}
          aria-label="Productivity Diagnosis Tab"
        >
          <Activity className="w-4 h-4" />
          <span>Productivity Diagnosis</span>
        </button>

        <button
          onClick={() => setActiveTab('coach')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'coach'
              ? 'bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 shadow-sm'
              : 'text-[#94A3B8] hover:text-white hover:bg-white/5'
          }`}
          aria-label="Conversational Coach Tab"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Conversational Coach</span>
        </button>
      </div>

      {/* 3. TAB 1: Whole-App Productivity Diagnosis */}
      {activeTab === 'diagnosis' && (
        <div className="space-y-6">
          {/* Action Trigger Card */}
          <div className="p-6 rounded-2xl bg-[#111827] border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                Comprehensive Workspace Audit & Error Detection
              </h3>
              <p className="text-xs text-[#94A3B8] max-w-xl leading-relaxed">
                Audits your tasks, active goals, overdue deadlines, and historical completion ratios to diagnose bottlenecks and suggest verified improvements.
              </p>
            </div>

            <Button
              onClick={handleRunDiagnosis}
              disabled={isDiagnosing}
              className="bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-semibold text-xs px-5 py-2.5 h-auto shadow-lg shadow-cyan-950/40 shrink-0 flex items-center gap-2"
              aria-label="Run Productivity Diagnosis"
            >
              {isDiagnosing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Auditing Workspace...</span>
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4" />
                  <span>Diagnose Productivity</span>
                </>
              )}
            </Button>
          </div>

          {/* Loading Indicator */}
          {isDiagnosing && (
            <div className="p-8 rounded-2xl bg-[#111827]/60 border border-white/10 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/20 mx-auto flex items-center justify-center text-cyan-400">
                <Brain className="w-6 h-6 animate-pulse" />
              </div>
              <h4 className="text-sm font-semibold text-white">
                Gemma 2 2B Analyzing Workspace SQLite Records...
              </h4>
              <p className="text-xs text-[#94A3B8] max-w-md mx-auto">
                Comparing planned estimates against actual completion velocity, checking milestone alignment, and calculating planning ratios.
              </p>
            </div>
          )}

          {/* Diagnosis Error */}
          {diagnosisError && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <div>
                <p className="font-semibold">Diagnosis could not be completed</p>
                <p className="text-rose-400/90">{diagnosisError}</p>
              </div>
            </div>
          )}

          {/* Diagnosis Results Display */}
          {diagnosis && !isDiagnosing && (
            <div className="space-y-6">
              {/* Root Planning Mistake Alert */}
              {diagnosis.planning_mistake && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300 shrink-0">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold tracking-wider uppercase text-amber-400">
                      Identified Planning Bottleneck
                    </span>
                    <h4 className="text-sm font-bold text-white mt-0.5">
                      {diagnosis.planning_mistake}
                    </h4>
                  </div>
                </div>
              )}

              {/* Core Diagnosis Card */}
              <div className="p-6 rounded-2xl bg-[#111827] border border-white/10 space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-cyan-400" />
                    Productivity Assessment
                  </h4>
                  <div className="flex items-center gap-2 text-[11px] text-[#64748B] font-mono">
                    <span>Model: {diagnosis.model_name}</span>
                    <span>•</span>
                    <span>{diagnosis.execution_time_ms} ms</span>
                  </div>
                </div>

                <p className="text-sm text-[#E2E8F0] leading-relaxed whitespace-pre-line">
                  {diagnosis.diagnosis}
                </p>

                {/* Deterministic Metrics Grid */}
                {diagnosis.metrics && Object.keys(diagnosis.metrics).length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                      <span className="text-[10px] text-[#94A3B8] uppercase tracking-wider block">Active Tasks</span>
                      <span className="text-base font-bold text-white font-mono">
                        {diagnosis.metrics.active_tasks ?? 0}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                      <span className="text-[10px] text-[#94A3B8] uppercase tracking-wider block">Completed</span>
                      <span className="text-base font-bold text-emerald-400 font-mono">
                        {diagnosis.metrics.completed_tasks ?? 0}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                      <span className="text-[10px] text-[#94A3B8] uppercase tracking-wider block">Duration Ratio</span>
                      <span className="text-base font-bold text-cyan-400 font-mono">
                        {diagnosis.metrics.estimation_accuracy_ratio ? `${diagnosis.metrics.estimation_accuracy_ratio}x` : '1.0x'}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                      <span className="text-[10px] text-[#94A3B8] uppercase tracking-wider block">Overdue Tasks</span>
                      <span className="text-base font-bold text-amber-400 font-mono">
                        {diagnosis.metrics.overdue_tasks ?? 0}
                      </span>
                    </div>
                  </div>
                )}

                {/* Sparse Data / Uncertainty Warning */}
                {diagnosis.uncertainty_or_missing_data && (
                  <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-200 flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-blue-300">Data Confidence Note: </span>
                      <span>{diagnosis.uncertainty_or_missing_data}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Factual Evidence List */}
              {diagnosis.evidence && diagnosis.evidence.length > 0 && (
                <div className="p-5 rounded-2xl bg-[#111827] border border-white/10 space-y-3">
                  <h4 className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider flex items-center gap-2">
                    <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                    Observed Facts From Your Workspace
                  </h4>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#CBD5E1]">
                    {diagnosis.evidence.map((fact, idx) => (
                      <li key={idx} className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5 flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                        <span>{fact}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Actionable Recommendations */}
              {diagnosis.recommendations && diagnosis.recommendations.length > 0 && (
                <div className="p-5 rounded-2xl bg-[#111827] border border-white/10 space-y-3">
                  <h4 className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider flex items-center gap-2">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                    Strategic Coaching Guidance
                  </h4>
                  <div className="space-y-2">
                    {diagnosis.recommendations.map((rec, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-[#F8FAFC] flex items-start gap-3"
                      >
                        <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono font-bold flex items-center justify-center shrink-0 text-[10px]">
                          {idx + 1}
                        </span>
                        <p className="leading-relaxed">{rec}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reviewable Proposed Changes (Review & Apply pattern) */}
              {diagnosis.proposed_changes && diagnosis.proposed_changes.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-cyan-400" />
                        Reviewable Proposed Modifications
                      </h4>
                      <p className="text-xs text-[#94A3B8]">
                        Human-in-the-loop: inspect, adjust, and approve changes before persisting to SQLite.
                      </p>
                    </div>
                    <Badge variant="outline" className="border-cyan-500/30 text-cyan-300 text-[11px]">
                      {diagnosis.proposed_changes.length} Actionable Proposal{diagnosis.proposed_changes.length === 1 ? '' : 's'}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    {diagnosis.proposed_changes.map((prop) => (
                      <ProposalCard
                        key={prop.id}
                        proposal={prop}
                        auditId={diagnosis.id}
                        workspaceId={workspaceId}
                        onApplied={handleProposalApplied}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 4. TAB 2: Conversational Productivity Coach */}
      {activeTab === 'coach' && (
        <div className="space-y-4">
          {/* Context Scope Filter */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-[#111827] border border-white/10 text-xs">
            <span className="text-[#94A3B8] font-medium flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-cyan-400" />
              Grounding Context:
            </span>

            <div className="flex flex-wrap items-center gap-1.5">
              {(['all', 'tasks', 'goals', 'habits', 'focus'] as const).map((scope) => (
                <button
                  key={scope}
                  type="button"
                  onClick={() => setContextScope(scope)}
                  className={`px-2.5 py-1 rounded-lg text-xs capitalize transition-all ${
                    contextScope === scope
                      ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-semibold'
                      : 'text-[#94A3B8] hover:text-white hover:bg-white/5'
                  }`}
                >
                  {scope === 'all' ? 'Whole Workspace' : scope}
                </button>
              ))}
            </div>
          </div>

          {/* Prompt Starters */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
              Quick Inquiries:
            </span>
            <div className="flex flex-wrap gap-2">
              {promptStarters.map((starter, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(starter)}
                  disabled={isSendingMessage}
                  className="px-3 py-1.5 rounded-lg bg-[#151924] border border-white/10 hover:border-cyan-500/40 text-xs text-[#CBD5E1] hover:text-white transition-all text-left disabled:opacity-50"
                >
                  "{starter}"
                </button>
              ))}
            </div>
          </div>

          {/* Chat Message Feed */}
          <div className="p-4 rounded-2xl bg-[#111827] border border-white/10 min-h-[360px] max-h-[560px] overflow-y-auto space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.sender === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-2xl rounded-2xl p-4 text-xs leading-relaxed space-y-3 ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600/30 border border-indigo-500/30 text-white rounded-br-none'
                      : 'bg-[#151924] border border-white/10 text-[#F8FAFC] rounded-bl-none shadow-md'
                  }`}
                >
                  {/* Sender Header */}
                  <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-1.5">
                    <span className="font-semibold text-[11px] text-cyan-300 flex items-center gap-1.5">
                      {msg.sender === 'coach' ? (
                        <>
                          <Brain className="w-3.5 h-3.5 text-cyan-400" />
                          <span>MAX AI Coach</span>
                        </>
                      ) : (
                        <span>You</span>
                      )}
                    </span>
                    <span className="text-[10px] text-[#64748B] font-mono">
                      {msg.timestamp}
                    </span>
                  </div>

                  {/* Message Body */}
                  <p className="whitespace-pre-line text-xs">{msg.text}</p>

                  {/* Identified Planning Mistake in Chat */}
                  {msg.planningMistake && (
                    <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                      <span>Notice: {msg.planningMistake}</span>
                    </div>
                  )}

                  {/* Missing Data Note */}
                  {msg.missingData && (
                    <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300 text-[11px]">
                      <span className="font-semibold">Note: </span>
                      {msg.missingData}
                    </div>
                  )}

                  {/* Evidence Used */}
                  {msg.evidenceUsed && msg.evidenceUsed.length > 0 && (
                    <details className="text-[11px] text-[#94A3B8] cursor-pointer pt-1">
                      <summary className="hover:text-cyan-300">
                        View verified evidence used ({msg.evidenceUsed.length} facts)
                      </summary>
                      <ul className="mt-1.5 space-y-1 pl-3 border-l border-white/10">
                        {msg.evidenceUsed.map((ev, i) => (
                          <li key={i}>{ev}</li>
                        ))}
                      </ul>
                    </details>
                  )}

                  {/* Proposed Changes Inside Message */}
                  {msg.proposedChanges && msg.proposedChanges.length > 0 && (
                    <div className="pt-2 space-y-2 border-t border-white/10">
                      <span className="text-[11px] font-semibold text-cyan-300 block">
                        Actionable Proposals:
                      </span>
                      {msg.proposedChanges.map((prop) => (
                        <ProposalCard
                          key={prop.id}
                          proposal={prop}
                          auditId={msg.auditId || `audit-${msg.id}`}
                          workspaceId={workspaceId}
                          onApplied={handleProposalApplied}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* In-Flight Coach Thinking */}
            {isSendingMessage && (
              <div className="flex items-start">
                <div className="max-w-md rounded-2xl p-4 bg-[#151924] border border-white/10 text-xs text-[#94A3B8] flex items-center gap-3">
                  <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                  <span>Gemma 2 2B thinking with workspace context...</span>
                </div>
              </div>
            )}
          </div>

          {/* Coach Error Banner */}
          {coachError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{coachError}</span>
            </div>
          )}

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              void handleSendMessage()
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask about your tasks, goal feasibility, duration estimation, or workload..."
              disabled={isSendingMessage}
              className="flex-1 h-11 px-4 bg-[#111827] border border-white/10 rounded-xl text-xs text-white placeholder:text-[#64748B] focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all"
              aria-label="Coach question input"
            />
            <Button
              type="submit"
              disabled={!inputMessage.trim() || isSendingMessage}
              className="h-11 px-5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl shrink-0 flex items-center gap-1.5 shadow-md shadow-cyan-950/40"
              aria-label="Send question to coach"
            >
              {isSendingMessage ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">Ask Coach</span>
            </Button>
          </form>
        </div>
      )}

      {/* AI Guided Onboarding & Diagnostics Modal */}
      <AIOnboardingModal
        isOpen={isOnboardingOpen}
        initialStep={onboardingInitialStep}
        onClose={() => setIsOnboardingOpen(false)}
        onComplete={() => {
          setIsOnboardingOpen(false)
          void checkStatus()
        }}
      />
    </div>
  )
}
