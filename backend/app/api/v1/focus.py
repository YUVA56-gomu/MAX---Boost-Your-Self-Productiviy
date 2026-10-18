from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.models.focus import FocusSession
from backend.app.models.task import Task
from backend.app.schemas.focus import (
    FocusSessionStart,
    FocusSessionComplete,
    FocusSessionResponse,
)

router = APIRouter(prefix="/focus", tags=["Habits & Focus"])


@router.get("/sessions", response_model=List[FocusSessionResponse])
def list_focus_sessions(
    workspace_id: str = Query(..., description="Target workspace ID"),
    task_id: Optional[str] = None,
    project_id: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """List focus sessions for workspace."""
    query = db.query(FocusSession).filter(FocusSession.workspace_id == workspace_id)
    if task_id:
        query = query.filter(FocusSession.task_id == task_id)
    if project_id:
        query = query.filter(FocusSession.project_id == project_id)

    return query.order_by(FocusSession.started_at.desc()).all()


@router.post("/sessions/start", response_model=FocusSessionResponse, status_code=status.HTTP_201_CREATED)
def start_focus_session(payload: FocusSessionStart, db: Session = Depends(get_db)):
    """Initialize a new active focus session."""
    session = FocusSession(
        workspace_id=payload.workspace_id,
        task_id=payload.task_id,
        project_id=payload.project_id,
        session_type=payload.session_type,
        started_at=datetime.now(timezone.utc),
        energy_before=payload.energy_before,
        is_completed=False,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


@router.post("/sessions/{session_id}/complete", response_model=FocusSessionResponse)
def complete_focus_session(session_id: str, payload: FocusSessionComplete, db: Session = Depends(get_db)):
    """Finalize a focus session and roll up logged minutes to associated task."""
    session = db.query(FocusSession).filter(FocusSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Focus session not found")

    session.ended_at = datetime.now(timezone.utc)
    session.duration_seconds = payload.duration_seconds
    session.interruption_count = payload.interruption_count
    session.energy_after = payload.energy_after
    session.notes = payload.notes
    session.is_completed = True

    # If associated with a task, increment task's actual_minutes
    if session.task_id:
        task = db.query(Task).filter(Task.id == session.task_id).first()
        if task:
            minutes_to_add = payload.duration_seconds // 60
            task.actual_minutes += minutes_to_add

    db.commit()
    db.refresh(session)
    return session
