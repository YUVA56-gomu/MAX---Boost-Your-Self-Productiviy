import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ProposalCard } from './ProposalCard'
import type { ProposedChange, AIApplyProposalResponse } from '@/lib/api'
import * as api from '@/lib/api'

vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>()
  return {
    ...actual,
    applyAIProposal: vi.fn(),
    dismissAIRecommendation: vi.fn(),
  }
})

describe('ProposalCard Component (Human-in-the-Loop Review & Apply)', () => {
  const sampleProposal: ProposedChange = {
    id: 'prop-123',
    target_type: 'task',
    target_id: 'task-456',
    target_title: 'Complete Side Hustle Architecture',
    action: 'update_estimate',
    field: 'estimated_minutes',
    current_value: 30,
    proposed_value: 60,
    rationale: 'Historical tasks of this type took 1.5x longer than initial estimate.',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders proposal information truthfully without auto-applying', () => {
    render(
      <ProposalCard
        proposal={sampleProposal}
        auditId="audit-789"
        workspaceId="ws-1"
      />
    )

    expect(screen.getByText('task')).toBeDefined()
    expect(screen.getByText('Update Estimate')).toBeDefined()
    expect(screen.getByText('Complete Side Hustle Architecture')).toBeDefined()
    expect(screen.getByText(/30m/)).toBeDefined()
    expect(screen.getByText(/60 mins/)).toBeDefined()
    expect(
      screen.getByText(
        '"Historical tasks of this type took 1.5x longer than initial estimate."'
      )
    ).toBeDefined()

    // Explicit approval button must be visible
    expect(screen.getByRole('button', { name: /approve and apply/i })).toBeDefined()
    expect(screen.getByRole('button', { name: /dismiss/i })).toBeDefined()
    expect(api.applyAIProposal).not.toHaveBeenCalled()
  })

  it('allows user to edit proposed value before approval', async () => {
    render(
      <ProposalCard
        proposal={sampleProposal}
        auditId="audit-789"
        workspaceId="ws-1"
      />
    )

    // Click edit button
    const editBtn = screen.getByRole('button', { name: /edit proposed value/i })
    fireEvent.click(editBtn)

    const input = screen.getByRole('textbox', { name: /edit proposed value/i })
    fireEvent.change(input, { target: { value: '45' } })

    const saveBtn = screen.getByTitle('Save edit')
    fireEvent.click(saveBtn)

    expect(screen.getByText('45 mins')).toBeDefined()
  })

  it('calls applyAIProposal when user clicks Approve & Apply and displays success state', async () => {
    const mockResponse: AIApplyProposalResponse = {
      success: true,
      message: 'Successfully updated estimated_minutes for task',
      target_type: 'task',
      target_id: 'task-456',
      applied_changes: { estimated_minutes: 60 },
    }
    vi.mocked(api.applyAIProposal).mockResolvedValueOnce(mockResponse)

    const onAppliedMock = vi.fn()
    render(
      <ProposalCard
        proposal={sampleProposal}
        auditId="audit-789"
        workspaceId="ws-1"
        onApplied={onAppliedMock}
      />
    )

    const approveBtn = screen.getByRole('button', { name: /approve and apply/i })
    fireEvent.click(approveBtn)

    await waitFor(() => {
      expect(api.applyAIProposal).toHaveBeenCalledWith(
        'ws-1',
        'audit-789',
        expect.objectContaining({
          id: 'prop-123',
          proposed_value: 60,
        })
      )
    })

    await waitFor(() => {
      expect(
        screen.getByText(/Applied to local SQLite database: Successfully updated estimated_minutes for task/i)
      ).toBeDefined()
      expect(onAppliedMock).toHaveBeenCalledWith(mockResponse)
    })
  })

  it('calls dismissAIRecommendation when user clicks Dismiss', async () => {
    vi.mocked(api.dismissAIRecommendation).mockResolvedValueOnce({
      status: 'success',
      audit_id: 'audit-789',
      decision: 'dismissed',
    })

    const onDismissedMock = vi.fn()
    render(
      <ProposalCard
        proposal={sampleProposal}
        auditId="audit-789"
        workspaceId="ws-1"
        onDismissed={onDismissedMock}
      />
    )

    const dismissBtn = screen.getByRole('button', { name: /dismiss proposal/i })
    fireEvent.click(dismissBtn)

    await waitFor(() => {
      expect(api.dismissAIRecommendation).toHaveBeenCalledWith(
        'audit-789',
        expect.any(String)
      )
      expect(screen.getByText(/Proposal dismissed/i)).toBeDefined()
      expect(onDismissedMock).toHaveBeenCalledWith('audit-789')
    })
  })

  it('displays error message if apply request fails', async () => {
    vi.mocked(api.applyAIProposal).mockRejectedValueOnce(
      new Error('Target task not found in workspace')
    )

    render(
      <ProposalCard
        proposal={sampleProposal}
        auditId="audit-789"
        workspaceId="ws-1"
      />
    )

    const approveBtn = screen.getByRole('button', { name: /approve and apply/i })
    fireEvent.click(approveBtn)

    await waitFor(() => {
      expect(screen.getByText('Target task not found in workspace')).toBeDefined()
    })
  })
})
