from pydantic import BaseModel, ConfigDict
from datetime import datetime, date
from typing import Optional


class ProjectBase(BaseModel):
    title: str
    description: Optional[str] = None
    color: Optional[str] = "#6366F1"
    target_date: Optional[date] = None
    position: Optional[int] = 0


class ProjectCreate(ProjectBase):
    workspace_id: str
    goal_id: Optional[str] = None


class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None
    status: Optional[str] = None
    target_date: Optional[date] = None
    goal_id: Optional[str] = None
    position: Optional[int] = None


class ProjectResponse(ProjectBase):
    id: str
    workspace_id: str
    goal_id: Optional[str] = None
    status: str
    task_count: int = 0
    completed_task_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
