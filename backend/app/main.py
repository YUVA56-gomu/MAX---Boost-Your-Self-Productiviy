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


import logging
from starlette.exceptions import HTTPException as StarletteHTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi import Request

logger = logging.getLogger("backend.security")

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Local-First Adaptive Productivity Desktop Application Backend",
    lifespan=lifespan,
    docs_url="/docs" if settings.app_env != "production" else None,
    redoc_url="/redoc" if settings.app_env != "production" else None,
    openapi_url="/openapi.json" if settings.app_env != "production" else None,
)

# Exception handlers ensuring no stack traces or database internals leak
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers=getattr(exc, "headers", None),
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors()},
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error("Internal unhandled error: %s on %s %s", type(exc).__name__, request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred"},
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
        "docs_url": "/docs" if settings.app_env != "production" else None,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "backend.app.main:app",
        host=settings.host,
        port=settings.port,
        reload=True,
    )
