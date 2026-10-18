from pydantic import BaseModel, ConfigDict
from typing import Optional


class HealthResponse(BaseModel):
    """Health check probe response schema matching API_CONTRACTS.md."""

    status: str
    version: str
    database: str
    ai_available: bool
    active_model: Optional[str] = None

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "status": "healthy",
                "version": "0.1.0",
                "database": "unconfigured",
                "ai_available": False,
                "active_model": None,
            }
        }
    )
