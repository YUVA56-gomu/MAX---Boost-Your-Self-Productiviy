import uuid
from datetime import datetime, date, timezone
from typing import Optional
from sqlalchemy import String, Text, Integer, Float, Date, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.db.base import Base


class DailyReview(Base):
    """End-of-day guided reflections and energy self-assessments."""

    __tablename__ = "daily_reviews"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id: Mapped[str] = mapped_column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    review_date: Mapped[date] = mapped_column(Date, nullable=False)
    wins: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    challenges: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    tomorrow_priorities: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    mood_score: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # 1-5
    energy_score: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # 1-5
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    __table_args__ = (
        UniqueConstraint("workspace_id", "review_date", name="uq_daily_reviews_workspace_date"),
    )


class Blocker(Base):
    """Obstacle impeding task or project progression."""

    __tablename__ = "blockers"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id: Mapped[str] = mapped_column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    task_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("tasks.id", ondelete="SET NULL"), nullable=True, index=True)
    project_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("projects.id", ondelete="SET NULL"), nullable=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    category: Mapped[str] = mapped_column(String(30), default="external", nullable=False)  # external, technical, energy, scope
    status: Mapped[str] = mapped_column(String(20), default="active", nullable=False)  # active, resolved
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    resolved_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Relationships
    task: Mapped[Optional["Task"]] = relationship("Task", back_populates="blockers")


class DailyMetric(Base):
    """Pre-calculated historical rollups for dashboard visualization."""

    __tablename__ = "daily_metrics"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id: Mapped[str] = mapped_column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    metric_date: Mapped[date] = mapped_column(Date, nullable=False)
    focus_minutes_total: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    planned_minutes_total: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    tasks_completed_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    tasks_rolled_over_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    habits_completed_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    average_energy: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    __table_args__ = (
        UniqueConstraint("workspace_id", "metric_date", name="uq_daily_metrics_workspace_date"),
    )
