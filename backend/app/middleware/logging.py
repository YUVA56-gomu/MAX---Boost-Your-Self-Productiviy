import logging
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

logger = logging.getLogger("api.access")

SENSITIVE_HEADERS = {"authorization", "cookie", "x-auth-token", "set-cookie"}


def sanitize_headers(headers) -> dict:
    """Redact sensitive authorization and secret tokens from header mappings."""
    sanitized = {}
    for key, value in headers.items():
        lower_key = key.lower()
        if lower_key in SENSITIVE_HEADERS:
            sanitized[key] = "[REDACTED]"
        else:
            sanitized[key] = value
    return sanitized


class SensitiveHeaderRedactionMiddleware(BaseHTTPMiddleware):
    """Logs requests and responses with guaranteed redaction of sensitive credentials and headers."""

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        sanitized_headers = sanitize_headers(request.headers)
        logger.debug(
            f"Incoming {request.method} {request.url.path} from {request.client.host if request.client else 'unknown'} | Headers: {sanitized_headers}"
        )

        response = await call_next(request)

        sanitized_resp_headers = sanitize_headers(response.headers)
        logger.debug(
            f"Completed {request.method} {request.url.path} -> {response.status_code} | Headers: {sanitized_resp_headers}"
        )

        return response
