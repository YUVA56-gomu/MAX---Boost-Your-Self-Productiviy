import httpx
from fastapi import APIRouter
from typing import Optional, Tuple
from backend.app.schemas.health import HealthResponse
from backend.app.config import settings

router = APIRouter(prefix="", tags=["System"])


def check_database_status() -> str:
    """Check the real SQLite database connectivity.
    
    In Milestone 1, SQLite connection management is scheduled for Milestone 2,
    so database status is truthfully reported as 'unconfigured'.
    When database engine is initialized in Milestone 2, this performs an actual
    live check (e.g. SELECT 1) and returns 'connected' or 'disconnected'.
    """
    try:
        from backend.app.db.session import engine
        from sqlalchemy import text
        if engine is None:
            return "unconfigured"
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return "connected"
    except (ImportError, AttributeError, ModuleNotFoundError):
        # Database session/engine or SQLAlchemy not yet installed/implemented in Milestone 1
        return "unconfigured"
    except Exception as exc:
        return f"disconnected: {exc}"


async def check_ai_status() -> Tuple[bool, Optional[str]]:
    """Check the real Ollama local AI runtime status.
    
    In Milestone 1, local AI integration is scheduled for Milestone 6.
    If settings.ai_enabled is False, AI is truthfully reported as unconfigured (False, None).
    When enabled, a live runtime probe is made to the configured Ollama base URL.
    """
    if not settings.ai_enabled:
        return False, None

    try:
        async with httpx.AsyncClient(timeout=settings.ai_probe_timeout_seconds) as client:
            resp = await client.get(f"{settings.ollama_base_url}/api/tags")
            if resp.status_code == 200:
                data = resp.json()
                models = [m.get("name", "") for m in data.get("models", [])]
                if any(settings.ollama_model in m for m in models):
                    return True, settings.ollama_model
                elif models:
                    return True, models[0]
            return False, None
    except Exception:
        return False, None


@router.get("/health", response_model=HealthResponse)
async def get_health() -> HealthResponse:
    """System health check probe returning verified application status and runtime capabilities."""
    db_status = check_database_status()
    ai_available, active_model = await check_ai_status()

    return HealthResponse(
        status="healthy",
        version=settings.app_version,
        database=db_status,
        ai_available=ai_available,
        active_model=active_model,
    )
