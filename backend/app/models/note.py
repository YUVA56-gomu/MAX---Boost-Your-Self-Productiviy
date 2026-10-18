import uuid
from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy import String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.db.base import Base


class Note(Base):
    """Contextual documentation supporting Goals, Projects, and Tasks."""

    __tablename__ = "notes"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id: Mapped[str] = mapped_column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    project_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("projects.id", ondelete="SET NULL"), nullable=True, index=True)
    goal_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("goals.id", ondelete="SET NULL"), nullable=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    content_markdown: Mapped[str] = mapped_column(Text, default="", nullable=False)
    is_pinned: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_archived: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    project: Mapped[Optional["Project"]] = relationship("Project", back_populates="notes")
    goal: Mapped[Optional["Goal"]] = relationship("Goal", back_populates="notes")


class NoteLink(Base):
    """Bidirectional wikilinks between notes."""

    __tablename__ = "note_links"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    source_note_id: Mapped[str] = mapped_column(String(36), ForeignKey("notes.id", ondelete="CASCADE"), nullable=False, index=True)
    target_note_id: Mapped[str] = mapped_column(String(36), ForeignKey("notes.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
