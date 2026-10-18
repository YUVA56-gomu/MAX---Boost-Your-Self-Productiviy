import secrets
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response, JSONResponse
from backend.app.config import settings

# Paths exempt from authentication
PUBLIC_PATHS = {
    "/api/v1/health",
    "/",
    "/docs",
    "/redoc",
    "/openapi.json",
}


class AuthenticationMiddleware(BaseHTTPMiddleware):
    """Enforces constant-time in-memory token authentication for all non-public endpoints."""

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        # Preflight CORS OPTIONS requests must pass through without auth
        if request.method == "OPTIONS":
            return await call_next(request)

        # Check public paths
        path = request.url.path.rstrip("/")
        if path in {"/api/v1/health", ""}:
            return await call_next(request)

        # Docs and OpenAPI schema are public ONLY in non-production environments
        if settings.app_env != "production" and (
            path in {"/docs", "/redoc", "/openapi.json"}
            or path.startswith("/docs")
            or path.startswith("/redoc")
        ):
            return await call_next(request)

        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return JSONResponse(
                status_code=401,
                content={"detail": "Authorization header missing"},
                headers={"WWW-Authenticate": "Bearer"},
            )

        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != "bearer":
            return JSONResponse(
                status_code=401,
                content={"detail": "Invalid authorization header format; expected 'Bearer <token>'"},
                headers={"WWW-Authenticate": "Bearer"},
            )

        token = parts[1]
        # Constant-time comparison prevents timing side-channel attacks
        if not secrets.compare_digest(token, settings.auth_token):
            return JSONResponse(
                status_code=401,
                content={"detail": "Invalid or unauthorized session token"},
                headers={"WWW-Authenticate": "Bearer"},
            )

        return await call_next(request)
