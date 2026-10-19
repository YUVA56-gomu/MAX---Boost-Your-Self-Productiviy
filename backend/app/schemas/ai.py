from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class ProposedChange(BaseModel):
    """Structured, reviewable modification proposed by local AI."""
    id: str = Field(..., description="Unique proposal identifier within the recommendation")
    target_type: str = Field(..., description="Entity type: task, goal, habit, milestone")
    target_id: Optional[str] = Field(None, description="Existing entity ID if updating, null if creating")
    target_title: Optional[str] = Field(None, description="Human-readable title or description of target")
    action: str = Field(..., description="Action: update_estimate, change_priority, adjust_deadline, create_task, create_milestone, reschedule")
    field: Optional[str] = Field(None, description="Field being modified")
    current_value: Optional[Any] = Field(None, description="Recorded current value from SQLite")
    proposed_value: Any = Field(..., description="Proposed replacement or new value")
    rationale: str = Field(..., description="Specific justification based on observed metrics")


class AIDiagnosisResponse(BaseModel):
    """Structured productivity diagnosis and mistake detection output."""
    id: str = Field(..., description="Audit log ID for user review & tracking")
    diagnosis: str = Field(..., description="Factual assessment of user's productivity patterns")
    planning_mistake: Optional[str] = Field(None, description="Identified root planning error from historical data")
    evidence: List[str] = Field(default_factory=list, description="Observed facts and calculated historical numbers")
    metrics: Dict[str, Any] = Field(default_factory=dict, description="Deterministic factual metrics extracted from SQLite")
    uncertainty_or_missing_data: Optional[str] = Field(None, description="Honest statement of missing records or confidence bounds")
    recommendations: List[str] = Field(default_factory=list, description="Actionable coaching recommendations")
    proposed_changes: List[ProposedChange] = Field(default_factory=list, description="Reviewable proposed modifications")
    model_name: str = Field(default="gemma2:2b")
    execution_time_ms: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class AICoachRequest(BaseModel):
    """User prompt to conversational productivity coach."""
    workspace_id: str
    user_message: str
    context_scope: Optional[str] = "all"  # 'all', 'tasks', 'goals', 'habits', 'focus'


class AICoachResponse(BaseModel):
    """Response from whole-app conversational coach."""
    id: str
    reply: str
    evidence_used: List[str] = Field(default_factory=list)
    planning_mistake: Optional[str] = None
    missing_data_acknowledged: Optional[str] = None
    proposed_changes: List[ProposedChange] = Field(default_factory=list)
    model_name: str = "gemma2:2b"
    execution_time_ms: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class AIApplyProposalRequest(BaseModel):
    """Explicit human approval payload to mutate application state."""
    workspace_id: str
    audit_id: str
    proposal: ProposedChange


class AIApplyProposalResponse(BaseModel):
    """Result of safely applying an approved change."""
    success: bool
    message: str
    target_type: str
    target_id: str
    applied_changes: Dict[str, Any]


class AIDismissRequest(BaseModel):
    """Record user dismissal or rejection of AI recommendation."""
    audit_id: str
    reason: Optional[str] = None


class AIStatusResponse(BaseModel):
    """Status probe for local AI capabilities and system readiness."""
    enabled: bool
    available: bool
    state: str = "ollama_not_installed"  # "ollama_not_installed", "ollama_stopped", "model_missing", "model_ready", "inference_failed", "ready"
    ollama_installed: bool = False
    service_running: bool = False
    configured_model: str = "gemma2:2b"
    model_available: bool = False
    active_model: Optional[str] = None
    base_url: str = "http://127.0.0.1:11434"
    installed_models: List[str] = Field(default_factory=list)
    model_size_bytes: Optional[int] = None
    model_size_mb: Optional[int] = None
    binary_path: Optional[str] = None


class AIStartServiceResponse(BaseModel):
    """Response when attempting to launch local Ollama daemon."""
    success: bool
    message: str
    service_running: bool


class AIPullModelRequest(BaseModel):
    """User-approved request to pull configured open-weight model."""
    model_name: Optional[str] = None


class AIPullModelResponse(BaseModel):
    """Result of requesting a model pull via Ollama."""
    success: bool
    message: str
    model: str
    status: str


class AITestInferenceResponse(BaseModel):
    """Result of bounded test inference verification."""
    success: bool
    latency_ms: int
    message: str
    response_text: Optional[str] = None

