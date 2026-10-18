from datetime import datetime, date, timedelta, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.app.db.session import get_db
from backend.app.models.reflection import DailyReview, Blocker
from backend.app.models.task import Task
from backend.app.models.focus import FocusSession
from backend.app.schemas.reflection import (
    DailyReviewCreate,
    DailyReviewResponse,
    BlockerCreate,
    BlockerUpdate,
    BlockerResponse,
    WorkloadInsightsResponse,
)

router = APIRouter(prefix="/insights", tags=["Insights & Reflection"])


@router.get("/daily-review/{review_date}", response_model=DailyReviewResponse)
def get_daily_review(
    review_date: date,
    workspace_id: str = Query(..., description="Target workspace ID"),
    db: Session = Depends(get_db),
):
    """Fetch daily review record for specific calendar date."""
    review = db.query(DailyReview).filter(
        DailyReview.workspace_id == workspace_id,
        DailyReview.review_date == review_date,
    ).first()

    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Daily review for {review_date} not found",
        )
    return review


@router.post("/daily-review/{review_date}", response_model=DailyReviewResponse)
def upsert_daily_review(
    review_date: date,
    payload: DailyReviewCreate,
    db: Session = Depends(get_db),
):
    """Save or update end-of-day review and reflections."""
    review = db.query(DailyReview).filter(
        DailyReview.workspace_id == payload.workspace_id,
        DailyReview.review_date == review_date,
    ).first()

    if review:
        update_data = payload.model_dump(exclude_unset=True)
        for field, val in update_data.items():
            setattr(review, field, val)
    else:
        review = DailyReview(
            workspace_id=payload.workspace_id,
            review_date=review_date,
            wins=payload.wins,
            challenges=payload.challenges,
            tomorrow_priorities=payload.tomorrow_priorities,
            mood_score=payload.mood_score,
            energy_score=payload.energy_score,
            notes=payload.notes,
        )
        db.add(review)

    db.commit()
    db.refresh(review)
    return review


@router.get("/blockers", response_model=List[BlockerResponse])
def list_blockers(
    workspace_id: str = Query(..., description="Target workspace ID"),
    status: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """List obstacles and blockers for workspace."""
    query = db.query(Blocker).filter(Blocker.workspace_id == workspace_id)
    if status:
        query = query.filter(Blocker.status == status)
    return query.order_by(Blocker.created_at.desc()).all()


@router.post("/blockers", response_model=BlockerResponse, status_code=status.HTTP_201_CREATED)
def create_blocker(payload: BlockerCreate, db: Session = Depends(get_db)):
    """Log a new blocker impeding work progression."""
    blocker = Blocker(**payload.model_dump())
    db.add(blocker)
    db.commit()
    db.refresh(blocker)
    return blocker


@router.patch("/blockers/{blocker_id}", response_model=BlockerResponse)
def update_blocker(blocker_id: str, payload: BlockerUpdate, db: Session = Depends(get_db)):
    """Update blocker or mark it resolved."""
    blocker = db.query(Blocker).filter(Blocker.id == blocker_id).first()
    if not blocker:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Blocker not found")

    update_data = payload.model_dump(exclude_unset=True)
    if update_data.get("status") == "resolved" and not blocker.resolved_at:
        blocker.resolved_at = datetime.now(timezone.utc)
    elif update_data.get("status") and update_data["status"] != "resolved":
        blocker.resolved_at = None

    for field, val in update_data.items():
        setattr(blocker, field, val)

    db.commit()
    db.refresh(blocker)
    return blocker


@router.get("/workload", response_model=WorkloadInsightsResponse)
def get_workload_insights(
    workspace_id: str = Query(..., description="Target workspace ID"),
    range: str = Query("7d", description="Time range: today, 7d, 30d"),
    db: Session = Depends(get_db),
):
    """Calculate deterministic planned vs completed workload analytics."""
    now = datetime.now(timezone.utc)
    if range == "today":
        start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
    elif range == "30d":
        start_date = now - timedelta(days=30)
    else:  # default 7d
        start_date = now - timedelta(days=7)

    # Completed tasks in date window
    completed_tasks = (
        db.query(Task)
        .filter(
            Task.workspace_id == workspace_id,
            Task.status == "completed",
            Task.completed_at >= start_date,
        )
        .all()
    )

    # Active tasks
    active_tasks = (
        db.query(Task)
        .filter(
            Task.workspace_id == workspace_id,
            Task.status.in_(["todo", "in_progress"]),
        )
        .all()
    )

    total_planned = sum(t.estimated_minutes or 0 for t in completed_tasks) + sum(
        t.estimated_minutes or 0 for t in active_tasks
    )
    total_completed = sum(t.actual_minutes or 0 for t in completed_tasks)

    # Focus sessions total seconds
    focus_seconds = (
        db.query(func.coalesce(func.sum(FocusSession.duration_seconds), 0))
        .filter(
            FocusSession.workspace_id == workspace_id,
            FocusSession.started_at >= start_date,
            FocusSession.is_completed == True,
        )
        .scalar()
    ) or 0

    deep_work_hours = round(focus_seconds / 3600.0, 1)

    ratio = 1.0
    if total_planned > 0:
        ratio = round(min(total_completed / total_planned, 2.0), 2)

    return WorkloadInsightsResponse(
        range=range,
        total_planned_minutes=total_planned,
        total_completed_minutes=total_completed,
        estimation_accuracy_ratio=ratio,
        tasks_completed_count=len(completed_tasks),
        tasks_rolled_over_count=len(active_tasks),
        deep_work_focus_hours=deep_work_hours,
    )
