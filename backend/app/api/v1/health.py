import httpx
from fastapi import APIRouter
from backend.app.schemas.health import HealthResponse
from backend.app.config import settings

router = APIRouter(prefix="", tags=["System"])


@router.get("/health", response_model=HealthResponse)
async def get_health() -> HealthResponse:
    """System health check probe returning application status and runtime capabilities."""
    ai_available = False
    active_model = None

    # Probe local Ollama with a very short timeout so healthcheck is instantaneous
    try:
        async with httpx.AsyncClient(timeout=0.5) as client:
            resp = await client.get("http://127.0.0.1:11434/api/tags")
            if resp.status_code == 200:
                data = resp.json()
                models = [m.get("name", "") for m in data.get("models", [])]
                if any("gemma2:2b" in m for m in models):
                    ai_available = True
                    active_model = "gemma2:2b"
                elif models:
                    ai_available = True
                    active_model = models[0]
    except Exception:
        # Core application functions 100% offline without Ollama
        ai_available = False
        active_model = None

    return HealthResponse(
        status="healthy",
        version=settings.app_version,
        database="connected",
        ai_available=ai_available,
        active_model=active_model,
    )
