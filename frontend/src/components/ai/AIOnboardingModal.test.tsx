import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AIOnboardingModal } from './AIOnboardingModal'
import * as api from '@/lib/api'

vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>()
  return {
    ...actual,
    fetchAIStatus: vi.fn(),
    startAIService: vi.fn(),
    pullAIModel: vi.fn(),
    testAIInference: vi.fn(),
  }
})

describe('AIOnboardingModal Component', () => {
  const mockOnClose = vi.fn()
  const mockOnComplete = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('renders Welcome Screen (Screen A) with MAX logo, trust pillars, and buttons', () => {
    render(
      <AIOnboardingModal
        isOpen={true}
        onClose={mockOnClose}
        onComplete={mockOnComplete}
        initialStep="welcome"
      />
    )

    expect(screen.getByTestId('onboarding-screen-welcome')).toBeInTheDocument()
    expect(screen.getByText(/Supercharge Your Focus with/i)).toBeInTheDocument()
    expect(screen.getByText('MAX Intelligence')).toBeInTheDocument()
    expect(screen.getByText('100% Sovereign & Local')).toBeInTheDocument()
    expect(screen.getByText('Zero Cloud Latency')).toBeInTheDocument()
    expect(screen.getByText('Private to Your Computer')).toBeInTheDocument()
    expect(screen.getByText('Human-in-the-Loop')).toBeInTheDocument()

    // Primary and Secondary buttons
    const primaryBtn = screen.getByRole('button', { name: "Let's advance with AI" })
    const secondaryBtn = screen.getByRole('button', { name: 'Continue without AI' })
    expect(primaryBtn).toBeInTheDocument()
    expect(secondaryBtn).toBeInTheDocument()
  })

  it('allows user to skip AI setup without blocking productivity features', () => {
    render(
      <AIOnboardingModal
        isOpen={true}
        onClose={mockOnClose}
        onComplete={mockOnComplete}
        initialStep="welcome"
      />
    )

    const skipBtn = screen.getByRole('button', { name: 'Continue without AI' })
    fireEvent.click(skipBtn)

    expect(mockOnClose).toHaveBeenCalledTimes(1)
    expect(mockOnComplete).not.toHaveBeenCalled()
  })

  it('transitions to Ollama Missing Screen (Screen C) when Ollama is not installed', async () => {
    vi.mocked(api.fetchAIStatus).mockResolvedValueOnce({
      enabled: true,
      available: false,
      state: 'ollama_not_installed',
      ollama_installed: false,
      service_running: false,
      configured_model: 'gemma2:2b',
      model_available: false,
      base_url: 'http://127.0.0.1:11434',
      installed_models: [],
    })

    render(
      <AIOnboardingModal
        isOpen={true}
        onClose={mockOnClose}
        onComplete={mockOnComplete}
        initialStep="welcome"
      />
    )

    // Click "Let's advance with AI"
    const advanceBtn = screen.getByRole('button', { name: "Let's advance with AI" })
    fireEvent.click(advanceBtn)

    // Should detect and transition to Screen C
    await waitFor(() => {
      expect(screen.getByTestId('onboarding-screen-ollama-missing')).toBeInTheDocument()
      expect(screen.getByText('Ollama Not Detected')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Open Official Download Page' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Check again' })).toBeInTheDocument()
    })
  })

  it('transitions to Ollama Stopped Screen (Screen D) and allows starting service safely', async () => {
    vi.mocked(api.fetchAIStatus).mockResolvedValueOnce({
      enabled: true,
      available: false,
      state: 'ollama_stopped',
      ollama_installed: true,
      service_running: false,
      configured_model: 'gemma2:2b',
      model_available: false,
      base_url: 'http://127.0.0.1:11434',
      installed_models: [],
    })

    vi.mocked(api.startAIService).mockResolvedValueOnce({
      success: true,
      message: 'Ollama background service launched successfully.',
      service_running: true,
    })

    // After starting, detection should find it ready
    vi.mocked(api.fetchAIStatus).mockResolvedValueOnce({
      enabled: true,
      available: true,
      state: 'model_ready',
      ollama_installed: true,
      service_running: true,
      configured_model: 'gemma2:2b',
      model_available: true,
      base_url: 'http://127.0.0.1:11434',
      installed_models: ['gemma2:2b'],
    })

    vi.mocked(api.testAIInference).mockResolvedValueOnce({
      success: true,
      latency_ms: 350,
      message: 'Local gemma2:2b responded in 350ms.',
      response_text: 'OK',
    })

    render(
      <AIOnboardingModal
        isOpen={true}
        onClose={mockOnClose}
        onComplete={mockOnComplete}
        initialStep="detecting"
      />
    )

    // Enters Screen D
    await waitFor(() => {
      expect(screen.getByTestId('onboarding-screen-ollama-stopped')).toBeInTheDocument()
      expect(screen.getByText('Ollama Service Stopped')).toBeInTheDocument()
      expect(screen.getByText('ollama serve')).toBeInTheDocument()
    })

    // Click "Start Ollama Service"
    const startBtn = screen.getByRole('button', { name: 'Start Ollama Service' })
    fireEvent.click(startBtn)

    // Should call startAIService and transition to ready
    await waitFor(() => {
      expect(api.startAIService).toHaveBeenCalledTimes(1)
      expect(screen.getByTestId('onboarding-screen-ready')).toBeInTheDocument()
    })
  })

  it('transitions to Model Missing Screen (Screen E) and handles download', async () => {
    vi.mocked(api.fetchAIStatus).mockResolvedValueOnce({
      enabled: true,
      available: false,
      state: 'model_missing',
      ollama_installed: true,
      service_running: true,
      configured_model: 'gemma2:2b',
      model_available: false,
      base_url: 'http://127.0.0.1:11434',
      installed_models: [],
    })

    vi.mocked(api.pullAIModel).mockResolvedValueOnce({
      success: true,
      message: "Model 'gemma2:2b' successfully downloaded and verified.",
      model: 'gemma2:2b',
      status: 'completed',
    })

    vi.mocked(api.fetchAIStatus).mockResolvedValueOnce({
      enabled: true,
      available: true,
      state: 'model_ready',
      ollama_installed: true,
      service_running: true,
      configured_model: 'gemma2:2b',
      model_available: true,
      base_url: 'http://127.0.0.1:11434',
      installed_models: ['gemma2:2b'],
    })

    vi.mocked(api.testAIInference).mockResolvedValueOnce({
      success: true,
      latency_ms: 410,
      message: 'Local gemma2:2b responded in 410ms.',
      response_text: 'OK',
    })

    render(
      <AIOnboardingModal
        isOpen={true}
        onClose={mockOnClose}
        onComplete={mockOnComplete}
        initialStep="detecting"
      />
    )

    // Enters Screen E
    await waitFor(() => {
      expect(screen.getByTestId('onboarding-screen-model-missing')).toBeInTheDocument()
      expect(screen.getByText('Local Model Required')).toBeInTheDocument()
      expect(screen.getByText('~1.6 GB')).toBeInTheDocument()
    })

    // Click "Download Gemma 2 2B"
    const downloadBtn = screen.getByRole('button', { name: 'Download Gemma 2 2B' })
    fireEvent.click(downloadBtn)

    await waitFor(() => {
      expect(api.pullAIModel).toHaveBeenCalledWith('gemma2:2b')
      expect(screen.getByTestId('onboarding-screen-ready')).toBeInTheDocument()
    })
  })

  it('handles bounded inference failure (Screen F - failure state) and allows retry', async () => {
    vi.mocked(api.fetchAIStatus).mockResolvedValueOnce({
      enabled: true,
      available: true,
      state: 'model_ready',
      ollama_installed: true,
      service_running: true,
      configured_model: 'gemma2:2b',
      model_available: true,
      base_url: 'http://127.0.0.1:11434',
      installed_models: ['gemma2:2b'],
    })

    vi.mocked(api.testAIInference).mockResolvedValueOnce({
      success: false,
      latency_ms: 1500,
      message: 'Inference test failed: model memory allocation error',
      response_text: null,
    })

    render(
      <AIOnboardingModal
        isOpen={true}
        onClose={mockOnClose}
        onComplete={mockOnComplete}
        initialStep="detecting"
      />
    )

    // Should transition to inference failed screen
    await waitFor(() => {
      expect(screen.getByTestId('onboarding-screen-inference-failed')).toBeInTheDocument()
      expect(screen.getByText('Inference Check Failed')).toBeInTheDocument()
      expect(screen.getByText(/model memory allocation error/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Retry Verification' })).toBeInTheDocument()
    })

    // On retry, succeed
    vi.mocked(api.testAIInference).mockResolvedValueOnce({
      success: true,
      latency_ms: 420,
      message: 'Local gemma2:2b responded in 420ms.',
      response_text: 'OK',
    })

    const retryBtn = screen.getByRole('button', { name: 'Retry Verification' })
    fireEvent.click(retryBtn)

    await waitFor(() => {
      expect(screen.getByTestId('onboarding-screen-ready')).toBeInTheDocument()
    })
  })

  it('transitions to AI Coach when user clicks Enter AI Coach after successful activation', async () => {
    vi.mocked(api.fetchAIStatus).mockResolvedValueOnce({
      enabled: true,
      available: true,
      state: 'model_ready',
      ollama_installed: true,
      service_running: true,
      configured_model: 'gemma2:2b',
      model_available: true,
      base_url: 'http://127.0.0.1:11434',
      installed_models: ['gemma2:2b'],
    })

    vi.mocked(api.testAIInference).mockResolvedValueOnce({
      success: true,
      latency_ms: 395,
      message: 'Local gemma2:2b responded in 395ms.',
      response_text: 'OK',
    })

    render(
      <AIOnboardingModal
        isOpen={true}
        onClose={mockOnClose}
        onComplete={mockOnComplete}
        initialStep="detecting"
      />
    )

    await waitFor(() => {
      expect(screen.getByTestId('onboarding-screen-ready')).toBeInTheDocument()
      expect(screen.getByText('MAX Intelligence Activated!')).toBeInTheDocument()
      expect(screen.getByText('Gemma 2 2B Verified')).toBeInTheDocument()
      expect(screen.getByText('Latency: 395ms')).toBeInTheDocument()
    })

    const enterBtn = screen.getByRole('button', { name: 'Enter AI Coach' })
    fireEvent.click(enterBtn)

    expect(mockOnComplete).toHaveBeenCalledTimes(1)
    expect(localStorage.getItem('max_ai_onboarding_completed')).toBe('true')
  })
})
