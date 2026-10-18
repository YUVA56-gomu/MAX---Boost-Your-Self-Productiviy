from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional


class FocusSessionStart(BaseModel):
    workspace_id: str
    task_id: Optional[str] = None
    project_id: Optional[str] = None
    session_type: Optional[str] = "pomodoro"  # pomodoro, stopwatch, deep_work
    energy_before: Optional[int] = None


class FocusSessionComplete(BaseModel):
    duration_seconds: int
    interruption_count: Optional[int] = 0
    energy_after: Optional[int] = None
    notes: Optional[str] = None


class FocusSessionResponse(BaseModel):
    id: str
    workspace_id: str
    task_id: Optional[str] = None
    project_id: Optional[str] = None
    session_type: str
    started_at: datetime
    ended_at: Optional[datetime] = None
    duration_seconds: int
    interruption_count: int
    energy_before: Optional[int] = None
    energy_after: Optional[int] = None
    is_completed: bool
    notes: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
