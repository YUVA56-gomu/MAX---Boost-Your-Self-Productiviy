import json
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from backend.app.db.session import get_db
from backend.app.models.task import Task, TaskHistory, TaskRecurrenceRule
from backend.app.schemas.task import (
    TaskCreate,
    TaskUpdate,
    TaskResponse,
    TaskHistoryResponse,
    TaskRecurrenceCreate,
    TaskRecurrenceResponse,
)

router = APIRouter(prefix="/tasks", tags=["Tasks"])


def serialize_task(task: Task) -> TaskResponse:
    """Helper to convert Task model to TaskResponse with calculated subtask counts."""
    subtasks = task.subtasks
    completed_subtasks = [s for s in subtasks if s.status == "completed"]
    return TaskResponse(
        id=task.id,
        workspace_id=task.workspace_id,
        project_id=task.project_id,
        goal_id=task.goal_id,
        milestone_id=task.milestone_id,
        parent_id=task.parent_id,
        recurrence_rule_id=task.recurrence_rule_id,
        title=task.title,
        description=task.description,
        status=task.status,
        priority=task.priority,
        energy_level=task.energy_level,
        estimated_minutes=task.estimated_minutes,
        actual_minutes=task.actual_minutes,
        due_date=task.due_date,
        position=task.position,
        completed_at=task.completed_at,
        subtask_count=len(subtasks),
        completed_subtask_count=len(completed_subtasks),
        created_at=task.created_at,
        updated_at=task.updated_at,
    )


@router.get("", response_model=List[TaskResponse])
def list_tasks(
    workspace_id: str = Query(..., description="Target workspace ID"),
    project_id: Optional[str] = None,
    goal_id: Optional[str] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    energy_level: Optional[int] = None,
    parent_id: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """List tasks matching query filters."""
    query = db.query(Task).filter(Task.workspace_id == workspace_id)

    if project_id:
        query = query.filter(Task.project_id == project_id)
    if goal_id:
        query = query.filter(Task.goal_id == goal_id)
    if status:
        query = query.filter(Task.status == status)
    if priority:
        query = query.filter(Task.priority == priority)
    if energy_level:
        query = query.filter(Task.energy_level == energy_level)
    if parent_id is not None:
        query = query.filter(Task.parent_id == parent_id)
    if search:
        query = query.filter(
            or_(Task.title.ilike(f"%{search}%"), Task.description.ilike(f"%{search}%"))
        )

    tasks = query.order_by(Task.position.asc(), Task.created_at.desc()).all()
    return [serialize_task(t) for t in tasks]


@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(payload: TaskCreate, db: Session = Depends(get_db)):
    """Create a new task and record initial creation history."""
    task_data = payload.model_dump()
    task = Task(**task_data)
    db.add(task)
    db.flush()

    # Log task creation in task history
    history = TaskHistory(
        task_id=task.id,
        changed_field="created",
        old_value=None,
        new_value=task.title,
    )
    db.add(history)
    db.commit()
    db.refresh(task)
    return serialize_task(task)


@router.get("/{task_id}", response_model=TaskResponse)
def get_task(task_id: str, db: Session = Depends(get_db)):
    """Get single task by ID."""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return serialize_task(task)


@router.patch("/{task_id}", response_model=TaskResponse)
def update_task(task_id: str, payload: TaskUpdate, db: Session = Depends(get_db)):
    """Update task fields and record audit history for mutations."""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    update_data = payload.model_dump(exclude_unset=True)

    for field, new_val in update_data.items():
        old_val = getattr(task, field)
        if old_val != new_val:
            # Audit field change
            history = TaskHistory(
                task_id=task.id,
                changed_field=field,
                old_value=str(old_val) if old_val is not None else None,
                new_value=str(new_val) if new_val is not None else None,
            )
            db.add(history)
            setattr(task, field, new_val)

    # Set completed_at timestamp if transitioned to completed
    if update_data.get("status") == "completed" and not task.completed_at:
        task.completed_at = datetime.now(timezone.utc)
    elif update_data.get("status") and update_data["status"] != "completed":
        task.completed_at = None

    db.commit()
    db.refresh(task)
    return serialize_task(task)


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(task_id: str, db: Session = Depends(get_db)):
    """Delete a task and cascade delete its subtasks and history."""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    db.delete(task)
    db.commit()
    return None


@router.get("/{task_id}/history", response_model=List[TaskHistoryResponse])
def get_task_history(task_id: str, db: Session = Depends(get_db)):
    """Get chronological mutation history for a task."""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    return (
        db.query(TaskHistory)
        .filter(TaskHistory.task_id == task_id)
        .order_by(TaskHistory.timestamp.asc())
        .all()
    )


@router.post("/{task_id}/recurring", response_model=TaskRecurrenceResponse)
def set_task_recurrence(task_id: str, payload: TaskRecurrenceCreate, db: Session = Depends(get_db)):
    """Configure automated recurrence schedule for a task."""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    rule = TaskRecurrenceRule(
        workspace_id=task.workspace_id,
        frequency=payload.frequency,
        interval_days=payload.interval_days,
        by_weekdays_json=json.dumps(payload.by_weekdays) if payload.by_weekdays else None,
        start_date=payload.start_date,
        end_date=payload.end_date,
        next_due_date=payload.start_date,
    )
    db.add(rule)
    db.flush()

    task.recurrence_rule_id = rule.id
    db.commit()
    db.refresh(rule)
    return rule
