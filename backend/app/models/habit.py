import uuid
from datetime import datetime, date, timezone
from typing import Optional, List
from sqlalchemy import String, Text, Integer, Float, Boolean, Date, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.db.base import Base


class Habit(Base):
    """Routine behavioral habit definition and streak tracking."""

    __tablename__ = "habits"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id: Mapped[str] = mapped_column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    frequency: Mapped[str] = mapped_column(String(20), default="daily", nullable=False)  # daily, weekdays, weekly_target
    target_count: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    time_of_day: Mapped[str] = mapped_column(String(20), default="any", nullable=False)  # morning, afternoon, evening, any
    current_streak: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    best_streak: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    logs: Mapped[List["HabitLog"]] = relationship("HabitLog", back_populates="habit", cascade="all, delete-orphan")


class HabitLog(Base):
    """Daily check-off record for an individual habit."""

    __tablename__ = "habit_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    habit_id: Mapped[str] = mapped_column(String(36), ForeignKey("habits.id", ondelete="CASCADE"), nullable=False, index=True)
    log_date: Mapped[date] = mapped_column(Date, nullable=False)
    completed: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    numeric_value: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    habit: Mapped["Habit"] = relationship("Habit", back_populates="logs")

    __table_args__ = (
        UniqueConstraint("habit_id", "log_date", name="uq_habit_logs_habit_date"),
    )
