import uuid
from datetime import datetime, date, timezone
from typing import Optional, List
from sqlalchemy import String, Text, Integer, Date, DateTime, ForeignKey, Table, Column, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.db.base import Base

# Association table for Many-to-Many tasks <-> tags
task_tags = Table(
    "task_tags",
    Base.metadata,
    Column("task_id", String(36), ForeignKey("tasks.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", String(36), ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
)


class Tag(Base):
    """Categorization tag for tasks."""

    __tablename__ = "tags"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id: Mapped[str] = mapped_column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(50), nullable=False)
    color: Mapped[Optional[str]] = mapped_column(String(20), default="#6366F1", nullable=True)

    # Relationships
    tasks: Mapped[List["Task"]] = relationship("Task", secondary=task_tags, back_populates="tags")


class TaskRecurrenceRule(Base):
    """Defines automated repetition schedule for recurring tasks."""

    __tablename__ = "task_recurrence_rules"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id: Mapped[str] = mapped_column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    frequency: Mapped[str] = mapped_column(String(20), default="daily", nullable=False)  # daily, weekdays, weekly, monthly, custom
    interval_days: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    by_weekdays_json: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # e.g. "[1,3,5]"
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    next_due_date: Mapped[date] = mapped_column(Date, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)


class Task(Base):
    """Core executable work unit supporting subtask hierarchy, energy tags, and tracking."""

    __tablename__ = "tasks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id: Mapped[str] = mapped_column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    project_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("projects.id", ondelete="SET NULL"), nullable=True, index=True)
    goal_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("goals.id", ondelete="SET NULL"), nullable=True, index=True)
    milestone_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("goal_milestones.id", ondelete="SET NULL"), nullable=True)
    parent_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("tasks.id", ondelete="CASCADE"), nullable=True, index=True)
    recurrence_rule_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("task_recurrence_rules.id", ondelete="SET NULL"), nullable=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(30), default="todo", nullable=False)  # draft, todo, in_progress, blocked, completed, archived
    priority: Mapped[str] = mapped_column(String(20), default="medium", nullable=False)  # low, medium, high, urgent
    energy_level: Mapped[int] = mapped_column(Integer, default=3, nullable=False)  # 1 (low) to 5 (deep focus)
    estimated_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    actual_minutes: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    due_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True, index=True)
    position: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    project: Mapped[Optional["Project"]] = relationship("Project", back_populates="tasks")
    goal: Mapped[Optional["Goal"]] = relationship("Goal", back_populates="tasks")
    parent: Mapped[Optional["Task"]] = relationship("Task", remote_side=[id], back_populates="subtasks")
    subtasks: Mapped[List["Task"]] = relationship("Task", back_populates="parent", cascade="all, delete-orphan")
    history: Mapped[List["TaskHistory"]] = relationship("TaskHistory", back_populates="task", cascade="all, delete-orphan")
    tags: Mapped[List["Tag"]] = relationship("Tag", secondary=task_tags, back_populates="tasks")
    focus_sessions: Mapped[List["FocusSession"]] = relationship("FocusSession", back_populates="task")
    blockers: Mapped[List["Blocker"]] = relationship("Blocker", back_populates="task")

    __table_args__ = (
        Index("idx_tasks_workspace_status", "workspace_id", "status"),
    )


class TaskHistory(Base):
    """Immutable chronological audit log of all task mutations."""

    __tablename__ = "task_history"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    task_id: Mapped[str] = mapped_column(String(36), ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False, index=True)
    changed_field: Mapped[str] = mapped_column(String(50), nullable=False)
    old_value: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    new_value: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    task: Mapped["Task"] = relationship("Task", back_populates="history")
