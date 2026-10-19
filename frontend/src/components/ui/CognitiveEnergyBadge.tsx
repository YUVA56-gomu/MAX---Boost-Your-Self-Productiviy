import React from 'react'
import { Brain } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ENERGY_DESCRIPTIONS } from '@/lib/energy'

export interface CognitiveEnergyBadgeProps {
  level?: number | null
  className?: string
  showLabel?: boolean
  size?: 'sm' | 'md'
}

/**
 * CognitiveEnergyBadge renders a refined, dark-blue badge displaying
 * a task's mental effort level (1-5) using a Lucide Brain icon and accessible tooltips.
 * Scale: 1 = low mental effort; 5 = deep-focus / high mental effort.
 */
export const CognitiveEnergyBadge: React.FC<CognitiveEnergyBadgeProps> = ({
  level,
  className,
  showLabel = false,
  size = 'sm',
}) => {
  if (level === undefined || level === null || level < 1) {
    return null
  }

  // Bound level between 1 and 5
  const normalizedLevel = Math.max(1, Math.min(5, Math.round(level)))
  const description = ENERGY_DESCRIPTIONS[normalizedLevel] || 'Mental effort'

  const tooltipText = `Cognitive Energy: Level ${normalizedLevel}/5 (${description}) • Scale: 1 = low mental effort; 5 = deep-focus/high mental effort`
  const accessibleLabel = `Cognitive energy level ${normalizedLevel} of 5: ${description}. Scale: 1 = low mental effort; 5 = deep-focus/high mental effort`

  return (
    <span
      data-testid="cognitive-energy-badge"
      role="status"
      title={tooltipText}
      aria-label={accessibleLabel}
      className={cn(
        'inline-flex items-center gap-1 font-medium select-none shrink-0 transition-colors',
        'bg-[#0C1A30]/80 border border-cyan-500/25 text-cyan-200/90 hover:border-cyan-400/40 shadow-sm',
        size === 'sm'
          ? 'px-1.5 py-0.5 rounded-md text-[11px] leading-none'
          : 'px-2 py-1 rounded-lg text-xs',
        className
      )}
    >
      <Brain
        data-testid="cognitive-energy-icon"
        className={cn(
          'text-cyan-400 shrink-0',
          size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'
        )}
        aria-hidden="true"
      />
      <span className="font-semibold text-cyan-200 tabular-nums">
        {normalizedLevel}
      </span>
      {showLabel && (
        <span className="text-[#94A3B8] text-[10px] hidden sm:inline ml-0.5">
          ({description})
        </span>
      )}
    </span>
  )
}
