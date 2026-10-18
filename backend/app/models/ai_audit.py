import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Text, Integer, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from backend.app.db.base import Base


class AIAuditLog(Base):
    """Mandatory local audit ledger recording every prompt and completion generated via Ollama."""

    __tablename__ = "ai_audit_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id: Mapped[str] = mapped_column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    action_type: Mapped[str] = mapped_column(String(50), nullable=False)  # task_breakdown, goal_milestones, reflection
    model_name: Mapped[str] = mapped_column(String(50), default="gemma2:2b", nullable=False)
    prompt_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    prompt_text: Mapped[str] = mapped_column(Text, nullable=False)
    response_text: Mapped[str] = mapped_column(Text, nullable=False)
    user_decision: Mapped[str] = mapped_column(String(20), default="pending", nullable=False)  # applied, rejected, dismissed
    execution_time_ms: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
