from fastapi import APIRouter
from backend.app.api.v1.health import router as health_router
from backend.app.api.v1.workspaces import router as workspaces_router
from backend.app.api.v1.tasks import router as tasks_router
from backend.app.api.v1.goals import router as goals_router
from backend.app.api.v1.projects import router as projects_router
from backend.app.api.v1.habits import router as habits_router
from backend.app.api.v1.focus import router as focus_router
from backend.app.api.v1.insights import router as insights_router
from backend.app.api.v1.notes import router as notes_router
from backend.app.api.v1.system import router as system_router
from backend.app.api.v1.ai import router as ai_router

api_v1_router = APIRouter(prefix="/api/v1")
api_v1_router.include_router(health_router)
api_v1_router.include_router(workspaces_router)
api_v1_router.include_router(tasks_router)
api_v1_router.include_router(goals_router)
api_v1_router.include_router(projects_router)
api_v1_router.include_router(habits_router)
api_v1_router.include_router(focus_router)
api_v1_router.include_router(insights_router)
api_v1_router.include_router(notes_router)
api_v1_router.include_router(system_router)
api_v1_router.include_router(ai_router)

__all__ = ["api_v1_router"]
