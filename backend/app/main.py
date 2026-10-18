import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.config import settings
from backend.app.api.v1 import api_v1_router
from backend.app.db.init_db import init_db
from backend.app.middleware.auth import AuthenticationMiddleware
from backend.app.middleware.logging import SensitiveHeaderRedactionMiddleware


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan context for startup initialization and graceful shutdown."""
    # Startup: ensure local data directory and database initialized
    os.makedirs("./data", exist_ok=True)
    init_db()
    yield
    # Shutdown: clean up open database pool connections
    from backend.app.db.session import engine
    engine.dispose()


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Local-First Adaptive Productivity Desktop Application Backend",
    lifespan=lifespan,
)

# Authentication middleware enforces 401 on non-public endpoints
app.add_middleware(AuthenticationMiddleware)

# Sensitive header redaction middleware intercepts headers before logging
app.add_middleware(SensitiveHeaderRedactionMiddleware)

# Strict CORS restriction for local development and Tauri webview (outermost)
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
