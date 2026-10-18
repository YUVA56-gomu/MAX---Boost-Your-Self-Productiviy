from pydantic import BaseModel, ConfigDict
from datetime import datetime, date
from typing import Optional, List


class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: Optional[str] = "todo"
    priority: Optional[str] = "medium"
    energy_level: Optional[int] = 3
    estimated_minutes: Optional[int] = None
    due_date: Optional[datetime] = None
    position: Optional[int] = 0


class TaskCreate(TaskBase):
    workspace_id: str
    project_id: Optional[str] = None
    goal_id: Optional[str] = None
    milestone_id: Optional[str] = None
    parent_id: Optional[str] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    energy_level: Optional[int] = None
    estimated_minutes: Optional[int] = None
    actual_minutes: Optional[int] = None
    due_date: Optional[datetime] = None
    position: Optional[int] = None
    project_id: Optional[str] = None
    goal_id: Optional[str] = None
    milestone_id: Optional[str] = None
    parent_id: Optional[str] = None
    completed_at: Optional[datetime] = None


class TaskResponse(TaskBase):
    id: str
    workspace_id: str
    project_id: Optional[str] = None
    goal_id: Optional[str] = None
    milestone_id: Optional[str] = None
    parent_id: Optional[str] = None
    recurrence_rule_id: Optional[str] = None
    actual_minutes: int = 0
    completed_at: Optional[datetime] = None
    subtask_count: int = 0
    completed_subtask_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TaskHistoryResponse(BaseModel):
    id: str
    task_id: str
    changed_field: str
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)


class TaskRecurrenceCreate(BaseModel):
    frequency: str = "daily"
    interval_days: int = 1
    by_weekdays: Optional[List[int]] = None
    start_date: date
    end_date: Optional[date] = None


class TaskRecurrenceResponse(BaseModel):
    id: str
    workspace_id: str
    frequency: str
    interval_days: int
    by_weekdays_json: Optional[str] = None
    start_date: date
    end_date: Optional[date] = None
    next_due_date: date
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
