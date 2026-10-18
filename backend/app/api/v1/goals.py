from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.models.goal import Goal, GoalMilestone
from backend.app.schemas.goal import (
    GoalCreate,
    GoalUpdate,
    GoalResponse,
    MilestoneCreate,
    MilestoneUpdate,
    MilestoneResponse,
)

router = APIRouter(prefix="/goals", tags=["Goals & Projects"])


def serialize_goal(goal: Goal) -> GoalResponse:
    """Helper to convert Goal model with milestone progression."""
    milestones = [
        MilestoneResponse(
            id=m.id,
            goal_id=m.goal_id,
            title=m.title,
            target_date=m.target_date,
            is_completed=m.is_completed,
            completed_at=m.completed_at,
            position=m.position,
            created_at=m.created_at,
        )
        for m in goal.milestones
    ]

    # Calculate roll-up progress if milestones exist
    if milestones:
        completed = sum(1 for m in milestones if m.is_completed)
        progress = int((completed / len(milestones)) * 100)
    else:
        progress = goal.progress_percentage

    return GoalResponse(
        id=goal.id,
        workspace_id=goal.workspace_id,
        title=goal.title,
        description=goal.description,
        goal_type=goal.goal_type,
        target_date=goal.target_date,
        status=goal.status,
        progress_percentage=progress,
        color=goal.color,
        icon=goal.icon,
        milestones=milestones,
        linked_project_count=len(goal.projects),
        created_at=goal.created_at,
        updated_at=goal.updated_at,
    )


@router.get("", response_model=List[GoalResponse])
def list_goals(
    workspace_id: str = Query(..., description="Target workspace ID"),
    goal_type: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """List goals matching query filters."""
    query = db.query(Goal).filter(Goal.workspace_id == workspace_id)
    if goal_type:
        query = query.filter(Goal.goal_type == goal_type)
    if status:
        query = query.filter(Goal.status == status)

    goals = query.order_by(Goal.created_at.desc()).all()
    return [serialize_goal(g) for g in goals]


@router.post("", response_model=GoalResponse, status_code=status.HTTP_201_CREATED)
def create_goal(payload: GoalCreate, db: Session = Depends(get_db)):
    """Create a new goal."""
    goal = Goal(**payload.model_dump())
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return serialize_goal(goal)


@router.get("/{goal_id}", response_model=GoalResponse)
def get_goal(goal_id: str, db: Session = Depends(get_db)):
    """Get single goal by ID."""
    goal = db.query(Goal).filter(Goal.id == goal_id).first()
    if not goal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found")
    return serialize_goal(goal)


@router.patch("/{goal_id}", response_model=GoalResponse)
def update_goal(goal_id: str, payload: GoalUpdate, db: Session = Depends(get_db)):
    """Update goal attributes."""
    goal = db.query(Goal).filter(Goal.id == goal_id).first()
    if not goal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(goal, field, val)

    db.commit()
    db.refresh(goal)
    return serialize_goal(goal)


@router.delete("/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_goal(goal_id: str, db: Session = Depends(get_db)):
    """Delete goal and cascade milestones."""
    goal = db.query(Goal).filter(Goal.id == goal_id).first()
    if not goal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found")
    db.delete(goal)
    db.commit()
    return None


@router.post("/{goal_id}/milestones", response_model=MilestoneResponse, status_code=status.HTTP_201_CREATED)
def create_milestone(goal_id: str, payload: MilestoneCreate, db: Session = Depends(get_db)):
    """Add a checkpoint milestone to a goal."""
    goal = db.query(Goal).filter(Goal.id == goal_id).first()
    if not goal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found")

    milestone = GoalMilestone(
        goal_id=goal_id,
        title=payload.title,
        target_date=payload.target_date,
        position=payload.position,
    )
    db.add(milestone)
    db.commit()
    db.refresh(milestone)
    return milestone


@router.patch("/milestones/{milestone_id}", response_model=MilestoneResponse)
def update_milestone(milestone_id: str, payload: MilestoneUpdate, db: Session = Depends(get_db)):
    """Update milestone details or completion state."""
    milestone = db.query(GoalMilestone).filter(GoalMilestone.id == milestone_id).first()
    if not milestone:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Milestone not found")

    update_data = payload.model_dump(exclude_unset=True)
    if "is_completed" in update_data:
        if update_data["is_completed"] and not milestone.is_completed:
            milestone.completed_at = datetime.now(timezone.utc)
        elif not update_data["is_completed"]:
            milestone.completed_at = None

    for field, val in update_data.items():
        setattr(milestone, field, val)

    db.commit()
    db.refresh(milestone)
    return milestone


@router.delete("/milestones/{milestone_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_milestone(milestone_id: str, db: Session = Depends(get_db)):
    """Delete a goal milestone."""
    milestone = db.query(GoalMilestone).filter(GoalMilestone.id == milestone_id).first()
    if not milestone:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Milestone not found")
    db.delete(milestone)
    db.commit()
    return None
