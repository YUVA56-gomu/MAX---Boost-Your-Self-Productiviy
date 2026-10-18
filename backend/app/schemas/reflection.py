from pydantic import BaseModel, ConfigDict
from datetime import datetime, date
from typing import Optional


class DailyReviewCreate(BaseModel):
    workspace_id: str
    wins: Optional[str] = None
    challenges: Optional[str] = None
    tomorrow_priorities: Optional[str] = None
    mood_score: Optional[int] = None
    energy_score: Optional[int] = None
    notes: Optional[str] = None


class DailyReviewResponse(BaseModel):
    id: str
    workspace_id: str
    review_date: date
    wins: Optional[str] = None
    challenges: Optional[str] = None
    tomorrow_priorities: Optional[str] = None
    mood_score: Optional[int] = None
    energy_score: Optional[int] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class BlockerCreate(BaseModel):
    workspace_id: str
    task_id: Optional[str] = None
    project_id: Optional[str] = None
    title: str
    description: Optional[str] = None
    category: Optional[str] = "external"  # external, technical, energy, scope


class BlockerUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    status: Optional[str] = None  # active, resolved


class BlockerResponse(BaseModel):
    id: str
    workspace_id: str
    task_id: Optional[str] = None
    project_id: Optional[str] = None
    title: str
    description: Optional[str] = None
    category: str
    status: str
    created_at: datetime
    resolved_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class WorkloadInsightsResponse(BaseModel):
    range: str
    total_planned_minutes: int
    total_completed_minutes: int
    estimation_accuracy_ratio: float
    tasks_completed_count: int
    tasks_rolled_over_count: int
    deep_work_focus_hours: float
