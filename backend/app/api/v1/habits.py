from datetime import datetime, date, timedelta, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.models.habit import Habit, HabitLog
from backend.app.schemas.habit import (
    HabitCreate,
    HabitUpdate,
    HabitResponse,
    HabitLogCreate,
    HabitLogResponse,
)

router = APIRouter(prefix="/habits", tags=["Habits & Focus"])


def serialize_habit(habit: Habit, today_date: date) -> HabitResponse:
    """Helper to convert Habit model with logged_today check."""
    logged_today = any(log.log_date == today_date and log.completed for log in habit.logs)
    return HabitResponse(
        id=habit.id,
        workspace_id=habit.workspace_id,
        title=habit.title,
        description=habit.description,
        frequency=habit.frequency,
        target_count=habit.target_count,
        time_of_day=habit.time_of_day,
        current_streak=habit.current_streak,
        best_streak=habit.best_streak,
        is_active=habit.is_active,
        logged_today=logged_today,
        created_at=habit.created_at,
        updated_at=habit.updated_at,
    )


@router.get("", response_model=List[HabitResponse])
def list_habits(
    workspace_id: str = Query(..., description="Target workspace ID"),
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
):
    """List habits for workspace."""
    query = db.query(Habit).filter(Habit.workspace_id == workspace_id)
    if is_active is not None:
        query = query.filter(Habit.is_active == is_active)

    today_date = datetime.now(timezone.utc).date()
    habits = query.order_by(Habit.created_at.desc()).all()
    return [serialize_habit(h, today_date) for h in habits]


@router.post("", response_model=HabitResponse, status_code=status.HTTP_201_CREATED)
def create_habit(payload: HabitCreate, db: Session = Depends(get_db)):
    """Create a new habit."""
    habit = Habit(**payload.model_dump())
    db.add(habit)
    db.commit()
    db.refresh(habit)
    today_date = datetime.now(timezone.utc).date()
    return serialize_habit(habit, today_date)


@router.get("/{habit_id}", response_model=HabitResponse)
def get_habit(habit_id: str, db: Session = Depends(get_db)):
    """Get single habit by ID."""
    habit = db.query(Habit).filter(Habit.id == habit_id).first()
    if not habit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Habit not found")
    today_date = datetime.now(timezone.utc).date()
    return serialize_habit(habit, today_date)


@router.patch("/{habit_id}", response_model=HabitResponse)
def update_habit(habit_id: str, payload: HabitUpdate, db: Session = Depends(get_db)):
    """Update habit configuration."""
    habit = db.query(Habit).filter(Habit.id == habit_id).first()
    if not habit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Habit not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(habit, field, val)

    db.commit()
    db.refresh(habit)
    today_date = datetime.now(timezone.utc).date()
    return serialize_habit(habit, today_date)


@router.delete("/{habit_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_habit(habit_id: str, db: Session = Depends(get_db)):
    """Delete a habit and its logs."""
    habit = db.query(Habit).filter(Habit.id == habit_id).first()
    if not habit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Habit not found")
    db.delete(habit)
    db.commit()
    return None


@router.post("/{habit_id}/log", response_model=HabitLogResponse)
def log_habit_execution(habit_id: str, payload: HabitLogCreate, db: Session = Depends(get_db)):
    """Record or update a daily habit execution log and calculate streak."""
    habit = db.query(Habit).filter(Habit.id == habit_id).first()
    if not habit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Habit not found")

    # Upsert log for habit_id + log_date
    log = db.query(HabitLog).filter(
        HabitLog.habit_id == habit_id,
        HabitLog.log_date == payload.log_date,
    ).first()

    if log:
        log.completed = payload.completed
        log.numeric_value = payload.numeric_value
        log.notes = payload.notes
    else:
        log = HabitLog(
            habit_id=habit_id,
            log_date=payload.log_date,
            completed=payload.completed,
            numeric_value=payload.numeric_value,
            notes=payload.notes,
        )
        db.add(log)

    db.flush()

    # Recalculate streak
    completed_logs = (
        db.query(HabitLog)
        .filter(HabitLog.habit_id == habit_id, HabitLog.completed == True)
        .order_by(HabitLog.log_date.desc())
        .all()
    )

    if completed_logs:
        # Check consecutive days starting from today or yesterday
        today = datetime.now(timezone.utc).date()
        dates = sorted({l.log_date for l in completed_logs}, reverse=True)
        streak = 0
        expected = dates[0]

        # Only count if the latest log is today or yesterday
        if expected in (today, today - timedelta(days=1)):
            for d in dates:
                if d == expected:
                    streak += 1
                    expected -= timedelta(days=1)
                else:
                    break
        habit.current_streak = streak
        if habit.current_streak > habit.best_streak:
            habit.best_streak = habit.current_streak
    else:
        habit.current_streak = 0

    db.commit()
    db.refresh(log)
    return log
