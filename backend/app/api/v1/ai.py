import json
import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from backend.app.db.session import get_db
from backend.app.config import settings
from backend.app.models.ai_audit import AIAuditLog
from backend.app.models.task import Task, TaskHistory
from backend.app.models.goal import Goal, GoalMilestone
from backend.app.models.workspace import Workspace
from backend.app.services.ai_analytics import ProductivitySnapshot
from backend.app.services.ollama_client import OllamaClient
from backend.app.schemas.ai import (
    AIStatusResponse,
    AIDiagnosisResponse,
    AICoachRequest,
    AICoachResponse,
    AIApplyProposalRequest,
    AIApplyProposalResponse,
    AIDismissRequest,
    ProposedChange,
    AIStartServiceResponse,
    AIPullModelRequest,
    AIPullModelResponse,
    AITestInferenceResponse,
)

router = APIRouter(prefix="/ai", tags=["Local AI Intelligence"])


@router.get("/status", response_model=AIStatusResponse)
async def get_ai_status():
    """Probe local Ollama daemon for binary presence, service status, and model readiness."""
    client = OllamaClient()
    detailed = await client.check_detailed_status()
    return AIStatusResponse(
        enabled=detailed["enabled"],
        available=detailed["available"],
        state=detailed["state"],
        ollama_installed=detailed["ollama_installed"],
        service_running=detailed["service_running"],
        configured_model=detailed["configured_model"],
        model_available=detailed["model_available"],
        active_model=detailed["active_model"],
        base_url=detailed["base_url"],
        installed_models=detailed["installed_models"],
        model_size_bytes=detailed.get("model_size_bytes"),
        model_size_mb=detailed.get("model_size_mb"),
        binary_path=detailed.get("binary_path"),
    )


@router.post("/start-service", response_model=AIStartServiceResponse)
async def start_ai_service():
    """Launch local Ollama background daemon using strictly allowlisted binary."""
    client = OllamaClient()
    success, message, running = await client.start_service()
    return AIStartServiceResponse(
        success=success,
        message=message,
        service_running=running,
    )


@router.post("/pull", response_model=AIPullModelResponse)
async def pull_ai_model(payload: Optional[AIPullModelRequest] = None):
    """Trigger explicit user-approved download of configured local open-weight model."""
    client = OllamaClient()
    target_model = payload.model_name if payload else None
    success, message = await client.pull_model(target_model)
    return AIPullModelResponse(
        success=success,
        message=message,
        model=target_model or client.model,
        status="completed" if success else "failed",
    )


@router.post("/test", response_model=AITestInferenceResponse)
async def test_ai_inference():
    """Execute bounded real inference health check with local model."""
    client = OllamaClient()
    success, latency_ms, message, response_text = await client.test_inference()
    return AITestInferenceResponse(
        success=success,
        latency_ms=latency_ms,
        message=message,
        response_text=response_text,
    )



@router.post("/diagnose", response_model=AIDiagnosisResponse)
async def diagnose_productivity(
    workspace_id: str = Query(..., description="Target workspace ID"),
    db: Session = Depends(get_db),
):
    """Whole-app productivity diagnosis and mistake detection using local SQLite data."""
    # Validate workspace
    ws = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not ws:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")

    # 1. Gather factual evidence from SQLite
    evidence_data = ProductivitySnapshot.gather_workspace_evidence(db, workspace_id)
    facts: List[str] = evidence_data["facts"]
    metrics: Dict[str, Any] = evidence_data["metrics"]
    detected_mistake: Optional[str] = evidence_data.get("planning_mistake")
    sample_tasks = evidence_data.get("sample_active_tasks", [])
    sample_goals = evidence_data.get("sample_active_goals", [])

    client = OllamaClient()
    available, active_model, _ = await client.check_availability()

    diagnosis_text = ""
    planning_mistake = detected_mistake
    uncertainty_text = None
    recommendations: List[str] = []
    proposed_changes: List[ProposedChange] = []
    execution_time_ms = 0

    if available and settings.ai_enabled:
        # Prompt Gemma 2 2B with verified facts
        prompt = f"""Analyze this user's local productivity records and diagnose their primary planning bottleneck.

VERIFIED FACTS FROM LOCAL DATABASE:
{json.dumps(facts, indent=2)}

METRICS SUMMARY:
{json.dumps(metrics, indent=2)}

ACTIVE TASKS:
{json.dumps(sample_tasks, indent=2)}

ACTIVE GOALS:
{json.dumps(sample_goals, indent=2)}

INSTRUCTIONS:
1. Provide a direct, constructive diagnosis based strictly on the observed metrics.
2. Identify the single biggest planning mistake (e.g. underestimating duration, deadline overload, WIP fragmentation, unanchored tasks).
3. If data is sparse (few completed tasks or estimates), state the uncertainty honestly.
4. Provide 2-3 concrete recommendations.
5. Provide 1-3 reviewable proposed changes to real active tasks or goals (e.g. increase estimate for underestimated task, adjust priority, or split a task).

Respond strictly in valid JSON matching this exact structure:
{{
  "diagnosis": "string explaining the observed productivity pattern",
  "planning_mistake": "string naming the primary planning error",
  "uncertainty_or_missing_data": "string explaining data gaps or null if sufficient",
  "recommendations": ["recommendation 1", "recommendation 2"],
  "proposed_changes": [
    {{
      "id": "prop-1",
      "target_type": "task",
      "target_id": "optional existing task id from active tasks",
      "target_title": "task title",
      "action": "update_estimate",
      "field": "estimated_minutes",
      "current_value": 30,
      "proposed_value": 60,
      "rationale": "reason based on historical completion time"
    }}
  ]
}}"""
        try:
            parsed, execution_time_ms = await client.generate_json(prompt)
            diagnosis_text = parsed.get("diagnosis", "")
            planning_mistake = parsed.get("planning_mistake") or detected_mistake
            uncertainty_text = parsed.get("uncertainty_or_missing_data")
            recommendations = parsed.get("recommendations", [])
            
            # Parse proposed changes safely
            for raw_prop in parsed.get("proposed_changes", []):
                try:
                    proposed_changes.append(
                        ProposedChange(
                            id=raw_prop.get("id") or str(uuid.uuid4())[:8],
                            target_type=raw_prop.get("target_type", "task"),
                            target_id=raw_prop.get("target_id"),
                            target_title=raw_prop.get("target_title"),
                            action=raw_prop.get("action", "update_estimate"),
                            field=raw_prop.get("field"),
                            current_value=raw_prop.get("current_value"),
                            proposed_value=raw_prop.get("proposed_value"),
                            rationale=raw_prop.get("rationale", "Suggested by productivity coach"),
                        )
                    )
                except Exception:
                    continue
        except Exception as exc:
            # Fallback to deterministic logic if inference failed
            available = False
            uncertainty_text = f"Local Ollama inference encountered an error: {exc}. Generated using deterministic rule engine."

    if not available or not diagnosis_text:
        # Deterministic offline rule engine fallback
        if detected_mistake:
            diagnosis_text = (
                f"Historical analysis of your workspace indicates an estimation discrepancy: "
                f"tasks have required on average {metrics.get('estimation_accuracy_ratio', 1.0)}x their planned time. "
                f"Workload delivery is constrained by inaccurate task duration forecasts."
            )
        elif metrics.get("overdue_tasks", 0) > 0:
            diagnosis_text = (
                f"You have {metrics.get('overdue_tasks')} overdue tasks in this workspace. "
                f"Deadlines were scheduled too close together without sufficient focus buffer."
            )
        else:
            diagnosis_text = (
                f"Workspace healthy: {metrics.get('completed_tasks')} completed tasks recorded. "
                f"Maintain structured daily reviews and log actual minutes to refine predictive accuracy."
            )

        if not recommendations:
            recommendations = [
                f"Apply a {max(1.3, metrics.get('estimation_accuracy_ratio', 1.2))}x multiplier to upcoming technical task estimates.",
                "Attach focus timer sessions to active tasks to log verified actual durations.",
                "Set clear milestones for active strategic goals to prevent work-in-progress fragmentation.",
            ]

        # Suggest a concrete proposal if active tasks exist
        if sample_tasks and not proposed_changes:
            target_t = sample_tasks[0]
            curr_est = target_t.get("estimated_minutes") or 30
            proposed_changes.append(
                ProposedChange(
                    id="prop-auto-1",
                    target_type="task",
                    target_id=target_t.get("id"),
                    target_title=target_t.get("title"),
                    action="update_estimate",
                    field="estimated_minutes",
                    current_value=curr_est,
                    proposed_value=round(curr_est * max(1.5, metrics.get("estimation_accuracy_ratio", 1.5))),
                    rationale=f"Adjusted to reflect your historical {metrics.get('estimation_accuracy_ratio', 1.5)}x completion ratio.",
                )
            )

    # Save to AIAuditLog table
    audit_entry = client.log_audit_entry(
        db=db,
        workspace_id=workspace_id,
        action_type="productivity_diagnosis",
        prompt_text=json.dumps({"facts": facts, "metrics": metrics}),
        response_text=json.dumps({
            "diagnosis": diagnosis_text,
            "planning_mistake": planning_mistake,
            "recommendations": recommendations,
            "proposed_changes": [p.model_dump() for p in proposed_changes],
        }),
        execution_time_ms=execution_time_ms,
    )

    return AIDiagnosisResponse(
        id=audit_entry.id,
        diagnosis=diagnosis_text,
        planning_mistake=planning_mistake,
        evidence=facts,
        metrics=metrics,
        uncertainty_or_missing_data=uncertainty_text,
        recommendations=recommendations,
        proposed_changes=proposed_changes,
        model_name=client.model if available else "deterministic_engine",
        execution_time_ms=execution_time_ms,
        created_at=audit_entry.created_at,
    )


@router.post("/coach", response_model=AICoachResponse)
async def ask_ai_coach(
    payload: AICoachRequest,
    db: Session = Depends(get_db),
):
    """Conversational productivity coach grounded in real SQLite metrics and entities."""
    ws = db.query(Workspace).filter(Workspace.id == payload.workspace_id).first()
    if not ws:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")

    evidence_data = ProductivitySnapshot.gather_workspace_evidence(db, payload.workspace_id)
    facts: List[str] = evidence_data["facts"]
    metrics: Dict[str, Any] = evidence_data["metrics"]
    detected_mistake: Optional[str] = evidence_data.get("planning_mistake")
    sample_tasks = evidence_data.get("sample_active_tasks", [])
    sample_goals = evidence_data.get("sample_active_goals", [])

    client = OllamaClient()
    available, active_model, _ = await client.check_availability()

    reply_text = ""
    missing_data = None
    proposed_changes: List[ProposedChange] = []
    execution_time_ms = 0

    if available and settings.ai_enabled:
        prompt = f"""User Question: "{payload.user_message}"

VERIFIED FACTS FROM LOCAL WORKSPACE:
{json.dumps(facts, indent=2)}

METRICS SUMMARY:
{json.dumps(metrics, indent=2)}

ACTIVE TASKS:
{json.dumps(sample_tasks, indent=2)}

ACTIVE GOALS:
{json.dumps(sample_goals, indent=2)}

INSTRUCTIONS:
1. Answer the user's question directly using ONLY the real facts provided.
2. If the user asks about a goal, analyze its feasibility against the actual recorded metrics and active workload.
3. If data is missing (e.g. no estimates, no daily reviews), explicitly acknowledge what is missing rather than inventing facts.
4. If appropriate, propose 1-2 concrete, reviewable changes to active tasks or goals.

Respond strictly in valid JSON matching this exact structure:
{{
  "reply": "clear, constructive answer to user's question",
  "planning_mistake": "identified mistake or null",
  "missing_data_acknowledged": "description of missing data or null",
  "proposed_changes": [
    {{
      "id": "prop-1",
      "target_type": "task",
      "target_id": "optional existing task id",
      "target_title": "title",
      "action": "update_estimate",
      "field": "estimated_minutes",
      "current_value": 30,
      "proposed_value": 60,
      "rationale": "justification"
    }}
  ]
}}"""
        try:
            parsed, execution_time_ms = await client.generate_json(prompt)
            reply_text = parsed.get("reply", "")
            detected_mistake = parsed.get("planning_mistake") or detected_mistake
            missing_data = parsed.get("missing_data_acknowledged")
            
            for raw_prop in parsed.get("proposed_changes", []):
                try:
                    proposed_changes.append(
                        ProposedChange(
                            id=raw_prop.get("id") or str(uuid.uuid4())[:8],
                            target_type=raw_prop.get("target_type", "task"),
                            target_id=raw_prop.get("target_id"),
                            target_title=raw_prop.get("target_title"),
                            action=raw_prop.get("action", "update_estimate"),
                            field=raw_prop.get("field"),
                            current_value=raw_prop.get("current_value"),
                            proposed_value=raw_prop.get("proposed_value"),
                            rationale=raw_prop.get("rationale", "Suggested by coach"),
                        )
                    )
                except Exception:
                    continue
        except Exception:
            available = False

    if not available or not reply_text:
        # Factual fallback response grounded in SQLite evidence
        reply_text = (
            f"Based on your workspace records: you have {metrics.get('active_tasks')} active tasks "
            f"and {metrics.get('completed_tasks')} completed tasks. "
            f"{'Your recorded tasks show a ' + str(metrics.get('estimation_accuracy_ratio')) + 'x completion ratio versus estimates.' if metrics.get('tasks_with_estimate_data', 0) > 0 else 'Start logging actual minutes during focus sessions to enable predictive duration estimation.'} "
            f"{detected_mistake or 'Focus on completing top-priority tasks before creating new ones.'}"
        )
        missing_data = "Local Ollama daemon is offline; response constructed from local SQLite metrics."

    # Save to AIAuditLog table
    audit_entry = client.log_audit_entry(
        db=db,
        workspace_id=payload.workspace_id,
        action_type="conversational_coach",
        prompt_text=payload.user_message,
        response_text=reply_text,
        execution_time_ms=execution_time_ms,
    )

    return AICoachResponse(
        id=audit_entry.id,
        reply=reply_text,
        evidence_used=facts,
        planning_mistake=detected_mistake,
        missing_data_acknowledged=missing_data,
        proposed_changes=proposed_changes,
        model_name=client.model if available else "deterministic_engine",
        execution_time_ms=execution_time_ms,
        created_at=audit_entry.created_at,
    )


@router.post("/apply", response_model=AIApplyProposalResponse)
def apply_ai_proposal(
    payload: AIApplyProposalRequest,
    db: Session = Depends(get_db),
):
    """Safely apply an explicitly approved AI proposal with validation and audit trail."""
    proposal = payload.proposal
    applied_changes: Dict[str, Any] = {}
    target_id = proposal.target_id or ""

    if proposal.target_type == "task":
        if proposal.action in ("update_estimate", "change_priority", "adjust_deadline") and proposal.target_id:
            task = db.query(Task).filter(
                Task.id == proposal.target_id,
                Task.workspace_id == payload.workspace_id,
            ).first()
            if not task:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Target task not found in workspace")

            if proposal.action == "update_estimate" and proposal.proposed_value is not None:
                old_val = str(task.estimated_minutes)
                task.estimated_minutes = int(proposal.proposed_value)
                applied_changes["estimated_minutes"] = task.estimated_minutes
                # Record audit history in task_history
                db.add(TaskHistory(
                    task_id=task.id,
                    changed_field="estimated_minutes",
                    old_value=old_val,
                    new_value=str(task.estimated_minutes),
                ))

            elif proposal.action == "change_priority" and proposal.proposed_value:
                old_val = task.priority
                task.priority = str(proposal.proposed_value)
                applied_changes["priority"] = task.priority
                db.add(TaskHistory(
                    task_id=task.id,
                    changed_field="priority",
                    old_value=old_val,
                    new_value=task.priority,
                ))

            elif proposal.action == "adjust_deadline" and proposal.proposed_value:
                old_val = str(task.due_date)
                task.due_date = proposal.proposed_value
                applied_changes["due_date"] = str(task.due_date)
                db.add(TaskHistory(
                    task_id=task.id,
                    changed_field="due_date",
                    old_value=old_val,
                    new_value=str(task.due_date),
                ))

            db.commit()
            db.refresh(task)

        elif proposal.action == "create_task":
            new_task = Task(
                workspace_id=payload.workspace_id,
                title=proposal.target_title or str(proposal.proposed_value),
                priority="medium",
                energy_level=3,
                estimated_minutes=30,
            )
            db.add(new_task)
            db.commit()
            db.refresh(new_task)
            target_id = new_task.id
            applied_changes["created_task_id"] = new_task.id
            applied_changes["title"] = new_task.title

    elif proposal.target_type == "goal":
        if proposal.action == "create_milestone" and proposal.target_id:
            goal = db.query(Goal).filter(
                Goal.id == proposal.target_id,
                Goal.workspace_id == payload.workspace_id,
            ).first()
            if not goal:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Target goal not found in workspace")

            ms = GoalMilestone(
                goal_id=goal.id,
                title=str(proposal.proposed_value),
                is_completed=False,
            )
            db.add(ms)
            db.commit()
            db.refresh(ms)
            target_id = ms.id
            applied_changes["milestone_id"] = ms.id
            applied_changes["milestone_title"] = ms.title

    # Update audit log entry decision
    audit_log = db.query(AIAuditLog).filter(AIAuditLog.id == payload.audit_id).first()
    if audit_log:
        audit_log.user_decision = "applied"
        db.commit()

    return AIApplyProposalResponse(
        success=True,
        message=f"Successfully applied {proposal.action} for {proposal.target_type}",
        target_type=proposal.target_type,
        target_id=target_id,
        applied_changes=applied_changes,
    )


@router.post("/dismiss")
def dismiss_ai_recommendation(
    payload: AIDismissRequest,
    db: Session = Depends(get_db),
):
    """Mark an AI recommendation as dismissed or rejected."""
    audit_log = db.query(AIAuditLog).filter(AIAuditLog.id == payload.audit_id).first()
    if not audit_log:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Audit record not found")

    audit_log.user_decision = "dismissed"
    db.commit()
    return {"status": "success", "audit_id": payload.audit_id, "decision": "dismissed"}


@router.get("/history")
def get_ai_history(
    workspace_id: str = Query(..., description="Target workspace ID"),
    limit: int = Query(10, description="Max audit entries to retrieve"),
    db: Session = Depends(get_db),
):
    """Retrieve audit history of past local AI recommendations and decisions."""
    logs = (
        db.query(AIAuditLog)
        .filter(AIAuditLog.workspace_id == workspace_id)
        .order_by(AIAuditLog.created_at.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "id": l.id,
            "action_type": l.action_type,
            "model_name": l.model_name,
            "user_decision": l.user_decision,
            "execution_time_ms": l.execution_time_ms,
            "created_at": l.created_at.isoformat(),
        }
        for l in logs
    ]
