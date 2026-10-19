import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AICoachCanvas } from './AICoachCanvas'
import type {
  AIStatusResponse,
  AIDiagnosisResponse,
  AICoachResponse,
} from '@/lib/api'
import * as api from '@/lib/api'

vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>()
  return {
    ...actual,
    fetchAIStatus: vi.fn(),
    diagnoseProductivity: vi.fn(),
    askAICoach: vi.fn(),
    applyAIProposal: vi.fn(),
    dismissAIRecommendation: vi.fn(),
  }
})

describe('AICoachCanvas Component (Whole-App Local AI Intelligence)', () => {
  const mockAvailableStatus: AIStatusResponse = {
    enabled: true,
    available: true,
    active_model: 'gemma2:2b',
    base_url: 'http://127.0.0.1:11434',
    installed_models: ['gemma2:2b', 'llama3.1:8b'],
  }

  const mockDiagnosis: AIDiagnosisResponse = {
    id: 'diag-001',
    diagnosis: 'Your workload is constrained by duration underestimation. Tasks require 1.5x longer than planned.',
    planning_mistake: 'Duration Underestimation Discrepancy',
    evidence: [
      'Recorded 4 tasks in workspace',
      'Average duration ratio: 1.5x',
      'Overdue tasks: 0',
    ],
    metrics: {
      active_tasks: 3,
      completed_tasks: 1,
      estimation_accuracy_ratio: 1.5,
      overdue_tasks: 0,
    },
    uncertainty_or_missing_data: 'Sparse focus sessions recorded. Complete more timed sessions.',
    recommendations: [
      'Apply a 1.5x multiplier to upcoming tasks',
      'Attach focus sessions to verify actual time',
    ],
    proposed_changes: [
      {
        id: 'prop-diag-1',
        target_type: 'task',
        target_id: 'task-1',
        target_title: 'Implement AI Coach Interface',
        action: 'update_estimate',
        field: 'estimated_minutes',
        current_value: 30,
        proposed_value: 45,
        rationale: 'Adjusted to reflect your historical 1.5x ratio',
      },
    ],
    model_name: 'gemma2:2b',
    execution_time_ms: 450,
    created_at: '2026-10-19T04:00:00Z',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(api.fetchAIStatus).mockResolvedValue(mockAvailableStatus)
  })

  it('probes local AI status and displays active model', async () => {
    render(<AICoachCanvas workspaceId="ws-1" />)

    await waitFor(() => {
      expect(api.fetchAIStatus).toHaveBeenCalled()
      expect(screen.getByText(/Local gemma2:2b Ready/i)).toBeDefined()
      expect(screen.getByText(/On-Device AI • Zero Cloud Telemetry/i)).toBeDefined()
    })
  })

  it('renders offline warning truthfully when Ollama is unavailable', async () => {
    vi.mocked(api.fetchAIStatus).mockResolvedValueOnce({
      enabled: true,
      available: false,
      active_model: null,
      base_url: 'http://127.0.0.1:11434',
      installed_models: [],
    })

    render(<AICoachCanvas workspaceId="ws-1" />)

    await waitFor(() => {
      expect(screen.getByText(/Ollama Daemon Offline/i)).toBeDefined()
      expect(
        screen.getByText(/Local Ollama daemon is currently unreachable on 127.0.0.1:11434/i)
      ).toBeDefined()
    })
  })

  it('requests productivity diagnosis and displays evidence, planning mistake, and proposed changes', async () => {
    vi.mocked(api.diagnoseProductivity).mockResolvedValueOnce(mockDiagnosis)

    render(<AICoachCanvas workspaceId="ws-1" />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /run productivity diagnosis/i })).toBeDefined()
    })

    const runBtn = screen.getByRole('button', { name: /run productivity diagnosis/i })
    fireEvent.click(runBtn)

    await waitFor(() => {
      expect(api.diagnoseProductivity).toHaveBeenCalledWith('ws-1')
      // Identified planning mistake
      expect(screen.getByText('Duration Underestimation Discrepancy')).toBeDefined()
      // Diagnosis text
      expect(
        screen.getByText(/Your workload is constrained by duration underestimation/i)
      ).toBeDefined()
      // Observed facts
      expect(screen.getByText('Recorded 4 tasks in workspace')).toBeDefined()
      // Recommendations
      expect(screen.getByText('Apply a 1.5x multiplier to upcoming tasks')).toBeDefined()
      // Proposed change card
      expect(screen.getByText('Implement AI Coach Interface')).toBeDefined()
      expect(screen.getByText('45 mins')).toBeDefined()
      expect(screen.getByRole('button', { name: /approve and apply/i })).toBeDefined()
    })
  })

  it('switches to conversational coach and sends question to Gemma', async () => {
    const mockCoachResponse: AICoachResponse = {
      id: 'coach-res-1',
      reply: 'Based on your 1.5x completion ratio, your active goal is feasible if you schedule 2 additional focus blocks.',
      evidence_used: ['3 active tasks recorded', 'Goal horizon: Q4 2026'],
      planning_mistake: null,
      missing_data_acknowledged: null,
      proposed_changes: [],
      model_name: 'gemma2:2b',
      execution_time_ms: 320,
      created_at: '2026-10-19T04:05:00Z',
    }
    vi.mocked(api.askAICoach).mockResolvedValueOnce(mockCoachResponse)

    render(<AICoachCanvas workspaceId="ws-1" />)

    // Switch to Coach tab
    const coachTabBtn = screen.getByRole('button', { name: /conversational coach tab/i })
    fireEvent.click(coachTabBtn)

    // Type question
    const input = screen.getByLabelText(/coach question input/i)
    fireEvent.change(input, {
      target: { value: 'How feasible is my current goal?' },
    })

    const sendBtn = screen.getByRole('button', { name: /send question to coach/i })
    fireEvent.click(sendBtn)

    await waitFor(() => {
      expect(api.askAICoach).toHaveBeenCalledWith(
        'ws-1',
        'How feasible is my current goal?',
        'all'
      )
      expect(
        screen.getByText(
          /Based on your 1.5x completion ratio, your active goal is feasible/i
        )
      ).toBeDefined()
    })
  })

  it('handles diagnosis API errors cleanly without crashing', async () => {
    vi.mocked(api.diagnoseProductivity).mockRejectedValueOnce(
      new Error('Connection to Ollama timed out after 45s')
    )

    render(<AICoachCanvas workspaceId="ws-1" />)

    const runBtn = screen.getByRole('button', { name: /run productivity diagnosis/i })
    fireEvent.click(runBtn)

    await waitFor(() => {
      expect(
        screen.getByText(/Connection to Ollama timed out after 45s/i)
      ).toBeDefined()
    })
  })
})
