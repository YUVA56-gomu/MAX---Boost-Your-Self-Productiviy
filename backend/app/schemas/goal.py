from pydantic import BaseModel, ConfigDict
from datetime import datetime, date
from typing import Optional, List


class MilestoneBase(BaseModel):
    title: str
    target_date: Optional[date] = None


class MilestoneCreate(MilestoneBase):
    position: Optional[int] = 0


class MilestoneUpdate(BaseModel):
    title: Optional[str] = None
    target_date: Optional[date] = None
    is_completed: Optional[bool] = None
    position: Optional[int] = None


class MilestoneResponse(MilestoneBase):
    id: str
    goal_id: str
    is_completed: bool
    completed_at: Optional[datetime] = None
    position: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class GoalBase(BaseModel):
    title: str
    description: Optional[str] = None
    goal_type: Optional[str] = "short_term"  # long_term, short_term
    target_date: Optional[date] = None
    color: Optional[str] = "#A855F7"
    icon: Optional[str] = "target"


class GoalCreate(GoalBase):
    workspace_id: str


class GoalUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    goal_type: Optional[str] = None
    target_date: Optional[date] = None
    status: Optional[str] = None
    progress_percentage: Optional[int] = None
    color: Optional[str] = None
    icon: Optional[str] = None


class GoalResponse(GoalBase):
    id: str
    workspace_id: str
    status: str
    progress_percentage: int
    milestones: List[MilestoneResponse] = []
    linked_project_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
