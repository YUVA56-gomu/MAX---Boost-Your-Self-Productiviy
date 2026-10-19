import React, { useState } from 'react'
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Edit2,
  Check,
  X,
  Target,
  ListTodo,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  applyAIProposal,
  dismissAIRecommendation,
  type ProposedChange,
  type AIApplyProposalResponse,
} from '@/lib/api'

interface ProposalCardProps {
  proposal: ProposedChange
  auditId: string
  workspaceId: string
  onApplied?: (result: AIApplyProposalResponse) => void
  onDismissed?: (auditId: string) => void
}

export const ProposalCard: React.FC<ProposalCardProps> = ({
  proposal,
  auditId,
  workspaceId,
  onApplied,
  onDismissed,
}) => {
  const [proposedValue, setProposedValue] = useState<any>(proposal.proposed_value)
  const [isEditing, setIsEditing] = useState(false)
  const [editInput, setEditInput] = useState(String(proposal.proposed_value))

  const [isApplying, setIsApplying] = useState(false)
  const [isDismissing, setIsDismissing] = useState(false)
  const [appliedResult, setAppliedResult] = useState<AIApplyProposalResponse | null>(null)
  const [isDismissed, setIsDismissed] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSaveEdit = () => {
    // If original proposed_value was number, convert back to number
    if (typeof proposal.proposed_value === 'number') {
      const num = Number(editInput)
      setProposedValue(isNaN(num) ? editInput : num)
    } else {
      setProposedValue(editInput)
    }
    setIsEditing(false)
  }

  const handleApply = async () => {
    setIsApplying(true)
    setError(null)
    try {
      const modifiedProposal: ProposedChange = {
        ...proposal,
        proposed_value: proposedValue,
      }
      const res = await applyAIProposal(workspaceId, auditId, modifiedProposal)
      setAppliedResult(res)
      if (onApplied) {
        onApplied(res)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to apply proposal'
      setError(msg)
    } finally {
      setIsApplying(false)
    }
  }

  const handleDismiss = async () => {
    setIsDismissing(true)
    setError(null)
    try {
      await dismissAIRecommendation(auditId, 'User dismissed from review card')
      setIsDismissed(true)
      if (onDismissed) {
        onDismissed(auditId)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to dismiss recommendation'
      setError(msg)
    } finally {
      setIsDismissing(false)
    }
  }

  if (isDismissed) {
    return (
      <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs text-[#64748B]">
        <span className="flex items-center gap-2">
          <XCircle className="w-4 h-4 text-[#64748B]" />
          Proposal dismissed
        </span>
        <span className="text-[11px] font-mono">{proposal.id}</span>
      </div>
    )
  }

  const formatActionName = (action: string) => {
    switch (action) {
      case 'update_estimate':
        return 'Update Estimate'
      case 'change_priority':
        return 'Adjust Priority'
      case 'adjust_deadline':
        return 'Reschedule Deadline'
      case 'create_task':
        return 'Create Actionable Task'
      case 'create_milestone':
        return 'Add Strategic Milestone'
      default:
        return action.replace(/_/g, ' ')
    }
  }

  return (
    <div
      className={`rounded-xl border p-4 transition-all duration-200 ${
        appliedResult
          ? 'bg-emerald-950/20 border-emerald-500/30'
          : 'bg-[#151924] border-white/10 hover:border-cyan-500/30'
      }`}
      data-testid={`proposal-card-${proposal.id}`}
    >
      {/* Header Badges & Target Info */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="text-[11px] font-medium border-cyan-500/30 bg-cyan-500/10 text-cyan-300 capitalize flex items-center gap-1"
          >
            {proposal.target_type === 'goal' ? (
              <Target className="w-3 h-3" />
            ) : (
              <ListTodo className="w-3 h-3" />
            )}
            {proposal.target_type}
          </Badge>

          <Badge
            variant="outline"
            className="text-[11px] font-medium border-indigo-500/30 bg-indigo-500/10 text-indigo-300"
          >
            {formatActionName(proposal.action)}
          </Badge>
        </div>

        <span className="text-[10px] font-mono text-[#64748B]">
          ID: {proposal.id}
        </span>
      </div>

      {/* Target Title */}
      {proposal.target_title && (
        <h5 className="text-sm font-semibold text-[#F8FAFC] mb-2 leading-snug">
          {proposal.target_title}
        </h5>
      )}

      {/* Value Comparison / Modification */}
      <div className="my-3 p-2.5 rounded-lg bg-[#0B0F17]/70 border border-white/5 flex flex-wrap items-center gap-3 text-xs">
        {proposal.current_value !== undefined && proposal.current_value !== null && (
          <div className="flex items-center gap-1.5 text-[#94A3B8]">
            <span className="text-[#64748B]">Current:</span>
            <span className="line-through px-1.5 py-0.5 rounded bg-white/5 font-mono text-[#CBD5E1]">
              {String(proposal.current_value)}
              {proposal.action === 'update_estimate' ? 'm' : ''}
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          </div>
        )}

        <div className="flex items-center gap-2 flex-1">
          <span className="text-[#64748B]">Proposed:</span>
          {isEditing ? (
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={editInput}
                onChange={(e) => setEditInput(e.target.value)}
                className="h-6 px-2 text-xs bg-[#1E293B] border border-cyan-500/50 rounded text-cyan-200 font-mono focus:outline-none"
                autoFocus
                aria-label="Edit proposed value"
              />
              <button
                type="button"
                onClick={handleSaveEdit}
                className="p-1 rounded bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                title="Save edit"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditInput(String(proposedValue))
                  setIsEditing(false)
                }}
                className="p-1 rounded bg-white/10 text-[#94A3B8] hover:bg-white/20"
                title="Cancel"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/30 font-semibold font-mono text-cyan-300">
                {String(proposedValue)}
                {proposal.action === 'update_estimate' ? ' mins' : ''}
              </span>
              {!appliedResult && (
                <button
                  type="button"
                  onClick={() => {
                    setEditInput(String(proposedValue))
                    setIsEditing(true)
                  }}
                  className="text-[#64748B] hover:text-cyan-300 p-0.5 rounded transition-colors"
                  title="Adjust proposed value before applying"
                  aria-label="Edit proposed value"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Rationale Quote */}
      <p className="text-xs text-[#94A3B8] leading-relaxed italic bg-white/[0.02] p-2.5 rounded-lg border-l-2 border-cyan-500/40 mb-3">
        "{proposal.rationale}"
      </p>

      {/* Error state */}
      {error && (
        <div className="mb-3 p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Applied Success State */}
      {appliedResult ? (
        <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center justify-between">
          <span className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            Applied to local SQLite database: {appliedResult.message}
          </span>
          <span className="text-[11px] text-emerald-400/80 font-mono">
            {appliedResult.target_id.slice(0, 8)}...
          </span>
        </div>
      ) : (
        /* Action buttons requiring explicit human review */
        <div className="flex items-center justify-end gap-2 pt-1 border-t border-white/5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            disabled={isApplying || isDismissing}
            className="text-xs text-[#94A3B8] hover:text-rose-300 hover:bg-rose-500/10 h-8 px-3"
            aria-label="Dismiss proposal"
          >
            {isDismissing ? 'Dismissing...' : 'Dismiss'}
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleApply}
            disabled={isApplying || isDismissing}
            className="text-xs font-semibold bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-md shadow-cyan-950/40 h-8 px-4 flex items-center gap-1.5"
            aria-label="Approve and apply proposal"
          >
            {isApplying ? (
              <>
                <Clock className="w-3.5 h-3.5 animate-spin" />
                <span>Committing...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Approve & Apply</span>
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
