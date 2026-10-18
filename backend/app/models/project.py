import uuid
from datetime import datetime, date, timezone
from typing import Optional, List
from sqlalchemy import String, Text, Integer, Date, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.db.base import Base


class Project(Base):
    """Deliverable-oriented container grouping tasks toward a specific outcome."""

    __tablename__ = "projects"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id: Mapped[str] = mapped_column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    goal_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("goals.id", ondelete="SET NULL"), nullable=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    color: Mapped[Optional[str]] = mapped_column(String(20), default="#6366F1", nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="active", nullable=False)  # planning, active, on_hold, completed, archived
    target_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    position: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    goal: Mapped[Optional["Goal"]] = relationship("Goal", back_populates="projects")
    tasks: Mapped[List["Task"]] = relationship("Task", back_populates="project")
    notes: Mapped[List["Note"]] = relationship("Note", back_populates="project")
    focus_sessions: Mapped[List["FocusSession"]] = relationship("FocusSession", back_populates="project")
