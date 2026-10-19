import React, { useState, useEffect, useCallback } from 'react'
import {
  Brain,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Download,
  ExternalLink,
  RefreshCw,
  Power,
  ChevronRight,
  X,
  ArrowRight,
  Zap,
  Lock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MaxLogo } from '@/components/brand/MaxLogo'
import { PromoArtwork } from '@/components/brand/PromoArtwork'
import {
  fetchAIStatus,
  startAIService,
  pullAIModel,
  testAIInference,
  type AIStatusResponse,
} from '@/lib/api'

export type OnboardingStep =
  | 'welcome'
  | 'detecting'
  | 'ollama_missing'
  | 'ollama_stopped'
  | 'model_missing'
  | 'activating'
  | 'inference_failed'
  | 'ready'

interface AIOnboardingModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete: () => void
  initialStep?: OnboardingStep
}

export const AIOnboardingModal: React.FC<AIOnboardingModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  initialStep = 'welcome',
}) => {
  const [step, setStep] = useState<OnboardingStep>(initialStep)
  const [status, setStatus] = useState<AIStatusResponse | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isStartingService, setIsStartingService] = useState(false)
  const [isDownloadingModel, setIsDownloadingModel] = useState(false)
  const [isTestingInference, setIsTestingInference] = useState(false)
  const [inferenceLatencyMs, setInferenceLatencyMs] = useState<number | null>(null)

  // Run bounded test inference
  const runInferenceTest = useCallback(async () => {
    setStep('activating')
    setIsTestingInference(true)
    setErrorMsg(null)
    try {
      const testRes = await testAIInference()
      if (testRes.success) {
        setInferenceLatencyMs(testRes.latency_ms)
        setStep('ready')
      } else {
        setErrorMsg(testRes.message || 'Model inference verification failed.')
        setStep('inference_failed')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Inference test failed'
      setErrorMsg(msg)
      setStep('inference_failed')
    } finally {
      setIsTestingInference(false)
    }
  }, [])

  // Real system detection
  const runDetection = useCallback(async () => {
    setStep('detecting')
    setErrorMsg(null)
    try {
      const res = await fetchAIStatus()
      setStatus(res)

      if (res.state === 'ollama_not_installed') {
        setStep('ollama_missing')
      } else if (res.state === 'ollama_stopped') {
        setStep('ollama_stopped')
      } else if (res.state === 'model_missing') {
        setStep('model_missing')
      } else if (res.state === 'model_ready' || res.state === 'ready') {
        // Model ready: run bounded test inference for truthfulness
        void runInferenceTest()
      } else {
        setStep('ollama_missing')
      }
    } catch {
      // If backend returns error, assume stopped or unavailable
      setStatus({
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
      setStep('ollama_stopped')
    }
  }, [runInferenceTest])

  // Automatically trigger detection if mounted or opened with 'detecting' step
  useEffect(() => {
    if (isOpen && initialStep === 'detecting') {
      void runDetection()
    }
  }, [isOpen, initialStep, runDetection])


  // Safe service launcher
  const handleStartService = async () => {
    setIsStartingService(true)
    setErrorMsg(null)
    try {
      const res = await startAIService()
      if (res.service_running) {
        // Re-run detection to verify
        await runDetection()
      } else {
        setErrorMsg(res.message)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to launch Ollama'
      setErrorMsg(msg)
    } finally {
      setIsStartingService(false)
    }
  }

  // Model download
  const handleDownloadModel = async () => {
    setIsDownloadingModel(true)
    setErrorMsg(null)
    try {
      const res = await pullAIModel(status?.configured_model || 'gemma2:2b')
      if (res.success) {
        await runDetection()
      } else {
        setErrorMsg(res.message)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to download model'
      setErrorMsg(msg)
    } finally {
      setIsDownloadingModel(false)
    }
  }

  // Finish setup and launch AI Coach
  const handleCompleteSetup = () => {
    localStorage.setItem('max_ai_onboarding_completed', 'true')
    onComplete()
  }

  // Continue without AI
  const handleSkipAI = () => {
    onClose()
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#0B0F17]/85 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-onboarding-title"
      data-testid="ai-onboarding-modal"
    >
      <div className="relative w-full max-w-xl rounded-3xl bg-[#111827] border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Abstract Geometric Corner Artwork */}
        <PromoArtwork className="absolute -top-4 -right-4 w-44 h-36 pointer-events-none opacity-80" />

        {/* Top Dismiss Button */}
        <button
          onClick={handleSkipAI}
          className="absolute top-4 right-4 z-20 text-[#64748B] hover:text-[#F8FAFC] p-1.5 rounded-full hover:bg-white/10 transition-colors"
          title="Close setup"
          aria-label="Close AI setup"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content Container */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 relative z-10">
          {/* ============================================================ */}
          {/* SCREEN A: WELCOME                                            */}
          {/* ============================================================ */}
          {step === 'welcome' && (
            <div className="space-y-6 text-center sm:text-left" data-testid="onboarding-screen-welcome">
              <div className="flex items-center gap-3 justify-center sm:justify-start">
                <MaxLogo size={42} />
                <Badge
                  variant="outline"
                  className="border-cyan-500/30 bg-cyan-500/10 text-cyan-300 text-xs px-2.5 py-0.5 font-mono"
                >
                  Local AI Intelligence
                </Badge>
              </div>

              <div className="space-y-2">
                <h2
                  id="ai-onboarding-title"
                  className="text-2xl sm:text-3xl font-bold tracking-tight text-white leading-tight"
                >
                  Supercharge Your Focus with{' '}
                  <span className="bg-gradient-to-r from-cyan-400 via-indigo-300 to-pink-400 bg-clip-text text-transparent">
                    MAX Intelligence
                  </span>
                </h2>
                <p className="text-xs sm:text-sm text-[#94A3B8] leading-relaxed max-w-lg">
                  MAX uses Google's open-weight <strong className="text-white">Gemma 2 2B</strong> model running strictly on your local hardware via Ollama. 100% offline, zero cloud subscriptions, zero telemetry.
                </p>
              </div>

              {/* Four Trust Pillars */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-left">
                <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white">100% Sovereign & Local</h4>
                    <p className="text-[11px] text-[#64748B] leading-normal">
                      Runs locally on your CPU/GPU. No remote API calls or accounts.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white">Zero Cloud Latency</h4>
                    <p className="text-[11px] text-[#64748B] leading-normal">
                      Sub-second local inference for instant task estimates & bottlenecks.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white">Private to Your Computer</h4>
                    <p className="text-[11px] text-[#64748B] leading-normal">
                      Your tasks, goals, and notes never leave your personal machine.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                    <Brain className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white">Human-in-the-Loop</h4>
                    <p className="text-[11px] text-[#64748B] leading-normal">
                      Suggests improvements; never mutates your data without your approval.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex flex-col sm:flex-row items-center gap-3">
                <Button
                  onClick={runDetection}
                  className="w-full sm:flex-1 h-11 gap-2 bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 hover:opacity-95 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-950/40"
                  aria-label="Let's advance with AI"
                >
                  <Sparkles className="w-4 h-4 text-cyan-200" />
                  <span>Let's advance with AI</span>
                  <ArrowRight className="w-4 h-4 ml-auto sm:ml-0" />
                </Button>

                <Button
                  onClick={handleSkipAI}
                  variant="outline"
                  className="w-full sm:w-auto h-11 border-white/10 bg-white/5 hover:bg-white/10 text-[#94A3B8] hover:text-white text-xs rounded-xl"
                  aria-label="Continue without AI"
                >
                  Continue without AI
                </Button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* SCREEN B: DETECTING                                          */}
          {/* ============================================================ */}
          {step === 'detecting' && (
            <div className="py-8 space-y-6 text-center" data-testid="onboarding-screen-detecting">
              <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/20 mx-auto flex items-center justify-center text-cyan-400">
                <RefreshCw className="w-8 h-8 animate-spin" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-white">Detecting Local AI Environment...</h3>
                <p className="text-xs text-[#94A3B8] max-w-sm mx-auto">
                  Probing local Ollama executable, daemon service responsiveness, and local model availability on 127.0.0.1:11434.
                </p>
              </div>

              <div className="max-w-xs mx-auto space-y-2 text-left text-xs text-[#94A3B8]">
                <div className="flex items-center gap-2.5 p-2 rounded-lg bg-white/[0.02]">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  <span>Checking Ollama system binary...</span>
                </div>
                <div className="flex items-center gap-2.5 p-2 rounded-lg bg-white/[0.02]">
                  <span className="w-2 h-2 rounded-full bg-cyan-400/50" />
                  <span>Checking daemon port 11434...</span>
                </div>
                <div className="flex items-center gap-2.5 p-2 rounded-lg bg-white/[0.02]">
                  <span className="w-2 h-2 rounded-full bg-cyan-400/30" />
                  <span>Scanning for Gemma 2 2B weights...</span>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* SCREEN C: OLLAMA MISSING                                     */}
          {/* ============================================================ */}
          {step === 'ollama_missing' && (
            <div className="space-y-6" data-testid="onboarding-screen-ollama-missing">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Download className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Ollama Not Detected</h3>
                  <p className="text-xs text-[#94A3B8]">
                    Local intelligence requires Ollama to execute open-weight AI models offline.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                <h4 className="text-xs font-semibold text-white uppercase tracking-wider text-[#94A3B8]">
                  Quick Installation Steps
                </h4>
                <ol className="space-y-2.5 text-xs text-[#CBD5E1]">
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono flex items-center justify-center shrink-0 text-[10px]">
                      1
                    </span>
                    <span>
                      Download the official installer from{' '}
                      <a
                        href="https://ollama.com/download"
                        target="_blank"
                        rel="noreferrer"
                        className="text-cyan-300 underline hover:text-cyan-200"
                      >
                        ollama.com/download
                      </a>
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono flex items-center justify-center shrink-0 text-[10px]">
                      2
                    </span>
                    <span>Run the installer to set up Ollama on your machine.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono flex items-center justify-center shrink-0 text-[10px]">
                      3
                    </span>
                    <span>Return here and click <strong className="text-white">Check again</strong>.</span>
                  </li>
                </ol>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <Button
                  onClick={() => window.open('https://ollama.com/download', '_blank')}
                  className="w-full sm:flex-1 h-11 gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:opacity-95 text-white font-semibold text-xs rounded-xl"
                  aria-label="Open Official Download Page"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open Official Download Page</span>
                </Button>

                <Button
                  onClick={runDetection}
                  variant="outline"
                  className="w-full sm:w-auto h-11 gap-1.5 border-white/10 bg-white/5 hover:bg-white/10 text-white text-xs rounded-xl"
                  aria-label="Check again"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Check again</span>
                </Button>
              </div>

              <div className="text-center pt-1">
                <button
                  onClick={handleSkipAI}
                  className="text-xs text-[#64748B] hover:text-[#94A3B8] underline"
                >
                  Continue without AI (Use core MAX productivity features)
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* SCREEN D: OLLAMA STOPPED                                     */}
          {/* ============================================================ */}
          {step === 'ollama_stopped' && (
            <div className="space-y-6" data-testid="onboarding-screen-ollama-stopped">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Power className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Ollama Service Stopped</h3>
                  <p className="text-xs text-[#94A3B8]">
                    Ollama is installed on your workstation, but the local background service is not running.
                  </p>
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                  {errorMsg}
                </div>
              )}

              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                <h4 className="text-xs font-semibold text-white">Safe Launch Options</h4>
                <p className="text-xs text-[#CBD5E1]">
                  Click below to launch the background service using MAX's safe local supervisor, or start it manually from your terminal.
                </p>
                <div className="p-2.5 rounded-xl bg-[#0B0F17] border border-white/10 font-mono text-xs text-cyan-300 flex items-center justify-between">
                  <span>ollama serve</span>
                  <span className="text-[10px] text-[#64748B]">Terminal Command</span>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <Button
                  onClick={handleStartService}
                  disabled={isStartingService}
                  className="w-full sm:flex-1 h-11 gap-2 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:opacity-95 text-white font-semibold text-xs rounded-xl"
                  aria-label="Start Ollama Service"
                >
                  <Power className={`w-4 h-4 ${isStartingService ? 'animate-spin' : ''}`} />
                  <span>{isStartingService ? 'Starting Service...' : 'Start Ollama Service'}</span>
                </Button>

                <Button
                  onClick={runDetection}
                  disabled={isStartingService}
                  variant="outline"
                  className="w-full sm:w-auto h-11 gap-1.5 border-white/10 bg-white/5 hover:bg-white/10 text-white text-xs rounded-xl"
                  aria-label="Check again"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Check again</span>
                </Button>
              </div>

              <div className="text-center pt-1">
                <button
                  onClick={handleSkipAI}
                  className="text-xs text-[#64748B] hover:text-[#94A3B8] underline"
                >
                  Continue without AI (Use core MAX productivity features)
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* SCREEN E: MODEL MISSING                                      */}
          {/* ============================================================ */}
          {step === 'model_missing' && (
            <div className="space-y-6" data-testid="onboarding-screen-model-missing">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Brain className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Local Model Required</h3>
                  <p className="text-xs text-[#94A3B8]">
                    Ollama is running, but the configured model <strong className="text-white">{status?.configured_model || 'gemma2:2b'}</strong> is not yet installed.
                  </p>
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                  {errorMsg}
                </div>
              )}

              {/* Model Specifications Card */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">Target Open-Weight Model</span>
                  <Badge variant="outline" className="border-indigo-500/40 bg-indigo-500/10 text-indigo-300 font-mono text-[11px]">
                    {status?.configured_model || 'gemma2:2b'}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-[#0B0F17] border border-white/5">
                    <span className="text-[10px] text-[#64748B] block">Download Size</span>
                    <span className="font-mono text-white font-semibold">~1.6 GB</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#0B0F17] border border-white/5">
                    <span className="text-[10px] text-[#64748B] block">Memory Footprint</span>
                    <span className="font-mono text-emerald-400 font-semibold">~2.0 GB RAM</span>
                  </div>
                </div>

                <p className="text-[11px] text-[#94A3B8] leading-relaxed pt-1">
                  ⚠️ <strong>One-time download:</strong> Model download requires an active internet connection. Once downloaded, all AI inference and user data remain 100% offline.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <Button
                  onClick={handleDownloadModel}
                  disabled={isDownloadingModel}
                  className="w-full sm:flex-1 h-11 gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-95 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-950/40"
                  aria-label="Download Gemma 2 2B"
                >
                  {isDownloadingModel ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Downloading Gemma 2 2B (~1.6GB)...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Download Gemma 2 2B</span>
                    </>
                  )}
                </Button>

                <Button
                  onClick={runDetection}
                  disabled={isDownloadingModel}
                  variant="outline"
                  className="w-full sm:w-auto h-11 gap-1.5 border-white/10 bg-white/5 hover:bg-white/10 text-white text-xs rounded-xl"
                  aria-label="Check again"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Check again</span>
                </Button>
              </div>

              <div className="text-center pt-1">
                <button
                  onClick={handleSkipAI}
                  className="text-xs text-[#64748B] hover:text-[#94A3B8] underline"
                >
                  Continue without AI
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* SCREEN F (PART 1): ACTIVATING / INFERENCE TEST              */}
          {/* ============================================================ */}
          {step === 'activating' && (
            <div className="py-8 space-y-6 text-center" data-testid="onboarding-screen-activating">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 mx-auto flex items-center justify-center text-emerald-400">
                <Brain className="w-8 h-8 animate-pulse" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-white">Verifying Local Gemma 2 2B...</h3>
                <p className="text-xs text-[#94A3B8] max-w-sm mx-auto">
                  Executing a bounded test inference to confirm end-to-end model execution and measure local latency.
                </p>
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-cyan-300">
                <RefreshCw className="w-3 h-3 animate-spin text-cyan-400" />
                <span>Running benchmark prompt...</span>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* SCREEN F (PART 2): INFERENCE FAILED                          */}
          {/* ============================================================ */}
          {step === 'inference_failed' && (
            <div className="space-y-6" data-testid="onboarding-screen-inference-failed">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Inference Check Failed</h3>
                  <p className="text-xs text-[#94A3B8]">
                    Ollama is running, but the test inference timed out or encountered an error.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs leading-relaxed">
                {errorMsg || 'Local model execution did not respond within the timeout window.'}
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <Button
                  onClick={runInferenceTest}
                  disabled={isTestingInference}
                  className="w-full sm:flex-1 h-11 gap-2 bg-gradient-to-r from-rose-500 to-pink-600 hover:opacity-95 text-white font-semibold text-xs rounded-xl"
                  aria-label="Retry Verification"
                >
                  <RefreshCw className={`w-4 h-4 ${isTestingInference ? 'animate-spin' : ''}`} />
                  <span>Retry Verification</span>
                </Button>

                <Button
                  onClick={handleSkipAI}
                  variant="outline"
                  className="w-full sm:w-auto h-11 border-white/10 bg-white/5 hover:bg-white/10 text-white text-xs rounded-xl"
                >
                  Continue without AI
                </Button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* SCREEN F (PART 3): READY / ACTIVATED CELEBRATION             */}
          {/* ============================================================ */}
          {step === 'ready' && (
            <div className="space-y-6 text-center sm:text-left" data-testid="onboarding-screen-ready">
              <div className="flex items-center gap-3 justify-center sm:justify-start">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">MAX Intelligence Activated!</h3>
                  <div className="flex items-center gap-2 pt-0.5">
                    <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-300 text-[10px] font-mono">
                      Gemma 2 2B Verified
                    </Badge>
                    {inferenceLatencyMs && (
                      <span className="text-[11px] text-[#64748B] font-mono">
                        Latency: {inferenceLatencyMs}ms
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
                <p className="text-xs text-[#E2E8F0] leading-relaxed">
                  Your workstation is fully configured for offline personal coaching. MAX can now audit your task completion history, detect estimation bottlenecks, evaluate goal milestones, and answer productivity inquiries.
                </p>
                <div className="flex items-center gap-2 text-[11px] text-[#94A3B8] pt-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Sovereign Local Inference • Zero Cloud Accounts • 100% Private</span>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <Button
                  onClick={handleCompleteSetup}
                  className="w-full sm:flex-1 h-12 gap-2 bg-gradient-to-r from-emerald-500 via-cyan-500 to-indigo-600 hover:opacity-95 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-950/40"
                  aria-label="Enter AI Coach"
                >
                  <Sparkles className="w-4 h-4 text-emerald-100" />
                  <span>Enter AI Coach</span>
                  <ChevronRight className="w-4 h-4 ml-auto sm:ml-0" />
                </Button>

                <Button
                  onClick={handleSkipAI}
                  variant="outline"
                  className="w-full sm:w-auto h-12 border-white/10 bg-white/5 hover:bg-white/10 text-[#94A3B8] hover:text-white text-xs rounded-xl"
                  aria-label="Back to Dashboard"
                >
                  Back to Dashboard
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
