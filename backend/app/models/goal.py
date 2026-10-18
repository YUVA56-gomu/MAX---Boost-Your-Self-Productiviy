import uuid
from datetime import datetime, date, timezone
from typing import Optional, List
from sqlalchemy import String, Text, Integer, Boolean, Date, DateTime, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.db.base import Base


class Goal(Base):
    """Strategic objectives with roll-up progress tracking."""

    __tablename__ = "goals"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id: Mapped[str] = mapped_column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    goal_type: Mapped[str] = mapped_column(String(20), default="short_term", nullable=False)  # long_term, short_term
    target_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="active", nullable=False)  # active, completed, paused, abandoned
    progress_percentage: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    color: Mapped[Optional[str]] = mapped_column(String(20), default="#A855F7", nullable=True)
    icon: Mapped[Optional[str]] = mapped_column(String(50), default="target", nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    milestones: Mapped[List["GoalMilestone"]] = relationship("GoalMilestone", back_populates="goal", cascade="all, delete-orphan")
    projects: Mapped[List["Project"]] = relationship("Project", back_populates="goal")
    tasks: Mapped[List["Task"]] = relationship("Task", back_populates="goal")
    notes: Mapped[List["Note"]] = relationship("Note", back_populates="goal")


class GoalMilestone(Base):
    """Measurable checkpoints within a strategic goal."""

    __tablename__ = "goal_milestones"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    goal_id: Mapped[str] = mapped_column(String(36), ForeignKey("goals.id", ondelete="CASCADE"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    target_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    position: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    goal: Mapped["Goal"] = relationship("Goal", back_populates="milestones")
