import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, Text, Integer, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.db.base import Base


class FocusSession(Base):
    """Execution interval recording Pomodoro or deep work duration and energy metrics."""

    __tablename__ = "focus_sessions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id: Mapped[str] = mapped_column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    task_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("tasks.id", ondelete="SET NULL"), nullable=True, index=True)
    project_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("projects.id", ondelete="SET NULL"), nullable=True, index=True)
    session_type: Mapped[str] = mapped_column(String(20), default="pomodoro", nullable=False)  # pomodoro, stopwatch, deep_work
    started_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    ended_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    duration_seconds: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    interruption_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    energy_before: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # 1-5
    energy_after: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # 1-5
    is_completed: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    task: Mapped[Optional["Task"]] = relationship("Task", back_populates="focus_sessions")
    project: Mapped[Optional["Project"]] = relationship("Project", back_populates="focus_sessions")
