from pydantic import BaseModel, ConfigDict
from datetime import datetime, date
from typing import Optional, List


class HabitBase(BaseModel):
    title: str
    description: Optional[str] = None
    frequency: Optional[str] = "daily"  # daily, weekdays, weekly_target
    target_count: Optional[int] = 1
    time_of_day: Optional[str] = "any"  # morning, afternoon, evening, any


class HabitCreate(HabitBase):
    workspace_id: str


class HabitUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    frequency: Optional[str] = None
    target_count: Optional[int] = None
    time_of_day: Optional[str] = None
    is_active: Optional[bool] = None


class HabitLogCreate(BaseModel):
    log_date: date
    completed: Optional[bool] = True
    numeric_value: Optional[float] = 1.0
    notes: Optional[str] = None


class HabitLogResponse(BaseModel):
    id: str
    habit_id: str
    log_date: date
    completed: bool
    numeric_value: float
    notes: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class HabitResponse(HabitBase):
    id: str
    workspace_id: str
    current_streak: int
    best_streak: int
    is_active: bool
    logged_today: bool = False
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
