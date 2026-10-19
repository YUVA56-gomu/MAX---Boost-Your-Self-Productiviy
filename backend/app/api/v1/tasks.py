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


from backend.app.models.workspace import Workspace
from backend.app.models.project import Project
from backend.app.models.goal import Goal


@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(payload: TaskCreate, db: Session = Depends(get_db)):
    """Create a new task and record initial creation history."""
    # Validate workspace existence
    ws = db.query(Workspace).filter(Workspace.id == payload.workspace_id).first()
    if not ws:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Workspace '{payload.workspace_id}' not found")

    # Validate parent task hierarchy & workspace matching
    if payload.parent_id:
        parent = db.query(Task).filter(Task.id == payload.parent_id).first()
        if not parent:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Parent task '{payload.parent_id}' not found")
        if parent.workspace_id != payload.workspace_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Subtask must belong to the same workspace as parent task")

    # Validate project belongs to same workspace
    if payload.project_id:
        proj = db.query(Project).filter(Project.id == payload.project_id).first()
        if not proj:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Project '{payload.project_id}' not found")
        if proj.workspace_id != payload.workspace_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Task project must belong to the same workspace")

    # Validate goal belongs to same workspace
    if payload.goal_id:
        goal = db.query(Goal).filter(Goal.id == payload.goal_id).first()
        if not goal:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Goal '{payload.goal_id}' not found")
        if goal.workspace_id != payload.workspace_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Task goal must belong to the same workspace")

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

    # Validate parent_id updates
    if "parent_id" in update_data and update_data["parent_id"] is not None:
        if update_data["parent_id"] == task.id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A task cannot be its own parent")
        parent = db.query(Task).filter(Task.id == update_data["parent_id"]).first()
        if not parent:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Parent task '{update_data['parent_id']}' not found")
        if parent.workspace_id != task.workspace_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Subtask must belong to the same workspace as parent task")

    # Validate project_id updates
    if "project_id" in update_data and update_data["project_id"] is not None:
        proj = db.query(Project).filter(Project.id == update_data["project_id"]).first()
        if not proj:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Project '{update_data['project_id']}' not found")
        if proj.workspace_id != task.workspace_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Task project must belong to the same workspace")

    # Validate goal_id updates
    if "goal_id" in update_data and update_data["goal_id"] is not None:
        goal = db.query(Goal).filter(Goal.id == update_data["goal_id"]).first()
        if not goal:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Goal '{update_data['goal_id']}' not found")
        if goal.workspace_id != task.workspace_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Task goal must belong to the same workspace")

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


@router.get("/{task_id}/recurring", response_model=Optional[TaskRecurrenceResponse])
def get_task_recurrence(task_id: str, db: Session = Depends(get_db)):
    """Get the active recurrence schedule for a task, or null if non-recurring."""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    if not task.recurrence_rule_id:
        return None

    return db.query(TaskRecurrenceRule).filter(TaskRecurrenceRule.id == task.recurrence_rule_id).first()


@router.post("/{task_id}/recurring", response_model=TaskRecurrenceResponse)
def set_task_recurrence(task_id: str, payload: TaskRecurrenceCreate, db: Session = Depends(get_db)):
    """Configure or update automated recurrence schedule for a task."""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    # If an existing rule exists, clean it up first
    old_rule_desc = None
    if task.recurrence_rule_id:
        old_rule = db.query(TaskRecurrenceRule).filter(TaskRecurrenceRule.id == task.recurrence_rule_id).first()
        if old_rule:
            old_rule_desc = f"{old_rule.frequency} (every {old_rule.interval_days}d)"
            db.delete(old_rule)

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

    # Record audit history
    new_desc = f"{payload.frequency} (every {payload.interval_days}d)"
    history = TaskHistory(
        task_id=task.id,
        changed_field="recurrence",
        old_value=old_rule_desc,
        new_value=new_desc,
    )
    db.add(history)

    db.commit()
    db.refresh(rule)
    return rule


@router.delete("/{task_id}/recurring", status_code=status.HTTP_204_NO_CONTENT)
def delete_task_recurrence(task_id: str, db: Session = Depends(get_db)):
    """Remove automated recurrence schedule from a task."""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    if task.recurrence_rule_id:
        old_rule = db.query(TaskRecurrenceRule).filter(TaskRecurrenceRule.id == task.recurrence_rule_id).first()
        old_desc = f"{old_rule.frequency} (every {old_rule.interval_days}d)" if old_rule else "active"
        if old_rule:
            db.delete(old_rule)
        task.recurrence_rule_id = None

        history = TaskHistory(
            task_id=task.id,
            changed_field="recurrence",
            old_value=old_desc,
            new_value="none",
        )
        db.add(history)
        db.commit()

    return None
