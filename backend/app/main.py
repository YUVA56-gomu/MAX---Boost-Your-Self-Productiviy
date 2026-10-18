from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.config import settings
from backend.app.api.v1 import api_v1_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan context for startup initialization and graceful shutdown."""
    # Startup: ensure local data directory exists
    import os
    os.makedirs("./data", exist_ok=True)
    yield
    # Shutdown: clean up open connections if needed


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Local-First Adaptive Productivity Desktop Application Backend",
    lifespan=lifespan,
)

# Strict CORS restriction for local development and Tauri webview
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Register versioned API router
app.include_router(api_v1_router)


@app.get("/")
async def root():
    """Root status endpoint."""
    return {
        "app": settings.app_name,
        "version": settings.app_version,
        "status": "online",
        "docs_url": "/docs",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "backend.app.main:app",
        host=settings.host,
        port=settings.port,
        reload=True,
    )
