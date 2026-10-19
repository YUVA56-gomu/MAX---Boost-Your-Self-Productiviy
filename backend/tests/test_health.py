import pytest
import httpx
from backend.app.config import settings
from backend.app.api.v1.health import check_database_status, check_ai_status


def test_health_milestone_2_connected_state(client):
    """Test that /api/v1/health returns healthy and database connected."""
    orig_enabled = settings.ai_enabled
    try:
        settings.ai_enabled = False
        response = client.get("/api/v1/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["version"] == "0.1.0"
        assert data["database"] == "connected"
        assert data["ai_available"] is False
        assert data["active_model"] is None
    finally:
        settings.ai_enabled = orig_enabled


def test_database_status_truthful_connected():
    """Verify check_database_status() returns 'connected' with live SQLite engine."""
    status = check_database_status()
    assert status == "connected"


@pytest.mark.anyio
async def test_ai_status_truthful_when_disabled():
    """Verify check_ai_status() returns (False, None) when settings.ai_enabled is False."""
    orig_enabled = settings.ai_enabled
    try:
        settings.ai_enabled = False
        available, model = await check_ai_status()
        assert available is False
        assert model is None
    finally:
        settings.ai_enabled = orig_enabled


@pytest.mark.anyio
async def test_ai_status_when_enabled_and_ollama_reachable(monkeypatch):
    """Verify check_ai_status() returns model when enabled and Ollama responds with models."""
    orig_enabled = settings.ai_enabled
    try:
        settings.ai_enabled = True

        async def mock_get(self, url, *args, **kwargs):
            class MockResponse:
                status_code = 200
                def json(self):
                    return {"models": [{"name": "gemma2:2b"}]}
            return MockResponse()

        monkeypatch.setattr(httpx.AsyncClient, "get", mock_get)

        available, model = await check_ai_status()
        assert available is True
        assert model == "gemma2:2b"
    finally:
        settings.ai_enabled = orig_enabled


@pytest.mark.anyio
async def test_ai_status_when_enabled_and_ollama_unreachable(monkeypatch):
    """Verify check_ai_status() returns (False, None) when Ollama connection fails."""
    orig_enabled = settings.ai_enabled
    try:
        settings.ai_enabled = True

        async def mock_get_error(self, url, *args, **kwargs):
            raise httpx.ConnectError("Connection refused")

        monkeypatch.setattr(httpx.AsyncClient, "get", mock_get_error)

        available, model = await check_ai_status()
        assert available is False
        assert model is None
    finally:
        settings.ai_enabled = orig_enabled


def test_cors_allowed_development_origin(client):
    """Test that requests from documented Vite dev origin (http://localhost:5173) receive CORS approval."""
    headers = {
        "Origin": "http://localhost:5173",
        "Access-Control-Request-Method": "GET",
    }
    response = client.options("/api/v1/health", headers=headers)
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:5173"


def test_cors_disallowed_external_origin(client):
    """Test that unauthorized origins do NOT receive CORS approval."""
    headers = {
        "Origin": "http://malicious-external-origin.com",
        "Access-Control-Request-Method": "GET",
    }
    response = client.options("/api/v1/health", headers=headers)
    assert response.headers.get("access-control-allow-origin") != "http://malicious-external-origin.com"


def test_root_endpoint(client):
    """Test that root / endpoint returns online status without authentication."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert data["version"] == "0.1.0"
