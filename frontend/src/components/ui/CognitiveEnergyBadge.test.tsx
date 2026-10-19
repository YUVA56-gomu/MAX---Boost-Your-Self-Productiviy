import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { CognitiveEnergyBadge } from './CognitiveEnergyBadge'
import { ENERGY_DESCRIPTIONS } from '@/lib/energy'

describe('CognitiveEnergyBadge Component', () => {
  it('renders numeric level and Brain icon with subtle cyan accent', () => {
    render(<CognitiveEnergyBadge level={4} />)

    const badge = screen.getByTestId('cognitive-energy-badge')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveTextContent('4')

    const icon = screen.getByTestId('cognitive-energy-icon')
    expect(icon).toBeInTheDocument()
    expect(icon).toHaveClass('text-cyan-400')
    expect(badge).toHaveClass('bg-[#0C1A30]/80')
    expect(badge).toHaveClass('border-cyan-500/25')
  })

  it('includes accessible tooltip and aria-label explaining the scale', () => {
    render(<CognitiveEnergyBadge level={5} />)

    const badge = screen.getByTestId('cognitive-energy-badge')
    const expectedDescription = ENERGY_DESCRIPTIONS[5]
    expect(badge).toHaveAttribute(
      'title',
      `Cognitive Energy: Level 5/5 (${expectedDescription}) • Scale: 1 = low mental effort; 5 = deep-focus/high mental effort`
    )
    expect(badge).toHaveAttribute(
      'aria-label',
      `Cognitive energy level 5 of 5: ${expectedDescription}. Scale: 1 = low mental effort; 5 = deep-focus/high mental effort`
    )
  })

  it('explains 1 as low mental effort and 5 as deep-focus / high mental effort', () => {
    const { unmount } = render(<CognitiveEnergyBadge level={1} />)
    const badge1 = screen.getByTestId('cognitive-energy-badge')
    expect(badge1).toHaveAttribute(
      'title',
      expect.stringContaining('1 = low mental effort')
    )
    expect(badge1).toHaveAttribute(
      'title',
      expect.stringContaining('5 = deep-focus/high mental effort')
    )
    unmount()

    render(<CognitiveEnergyBadge level={5} />)
    const badge5 = screen.getByTestId('cognitive-energy-badge')
    expect(badge5).toHaveAttribute(
      'aria-label',
      expect.stringContaining('Deep-focus / high mental effort')
    )
  })

  it('renders nothing when level is null or undefined or zero', () => {
    const { container } = render(<CognitiveEnergyBadge level={null} />)
    expect(container.firstChild).toBeNull()

    const { container: containerZero } = render(<CognitiveEnergyBadge level={0} />)
    expect(containerZero.firstChild).toBeNull()
  })

  it('renders with optional inline label when showLabel is true', () => {
    render(<CognitiveEnergyBadge level={3} showLabel={true} />)
    expect(screen.getByText('(Balanced mental effort)')).toBeInTheDocument()
  })
})
