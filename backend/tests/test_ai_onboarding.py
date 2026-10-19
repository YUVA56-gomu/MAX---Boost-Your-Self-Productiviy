import pytest
from unittest.mock import patch, AsyncMock
from backend.app.schemas.ai import AIStatusResponse, AIStartServiceResponse, AITestInferenceResponse


def test_ai_status_requires_auth(client):
    """AI status endpoint must be protected by local authentication."""
    res = client.get("/api/v1/ai/status")
    assert res.status_code == 401


def test_ai_status_ollama_not_installed(client, auth_headers):
    """When Ollama binary is not found on disk, report ollama_not_installed."""
    mock_status = {
        "enabled": True,
        "available": False,
        "state": "ollama_not_installed",
        "ollama_installed": False,
        "service_running": False,
        "configured_model": "gemma2:2b",
        "model_available": False,
        "active_model": None,
        "base_url": "http://127.0.0.1:11434",
        "installed_models": [],
        "model_size_bytes": None,
        "model_size_mb": None,
        "binary_path": None,
    }
    with patch("backend.app.services.ollama_client.OllamaClient.check_detailed_status", new_callable=AsyncMock) as mock_check:
        mock_check.return_value = mock_status
        res = client.get("/api/v1/ai/status", headers=auth_headers)
        assert res.status_code == 200
        data = res.json()
        assert data["state"] == "ollama_not_installed"
        assert data["ollama_installed"] is False
        assert data["service_running"] is False
        assert data["model_available"] is False


def test_ai_status_ollama_stopped(client, auth_headers):
    """When Ollama binary exists but daemon is stopped, report ollama_stopped."""
    mock_status = {
        "enabled": True,
        "available": False,
        "state": "ollama_stopped",
        "ollama_installed": True,
        "service_running": False,
        "configured_model": "gemma2:2b",
        "model_available": False,
        "active_model": None,
        "base_url": "http://127.0.0.1:11434",
        "installed_models": [],
        "model_size_bytes": None,
        "model_size_mb": None,
        "binary_path": "C:\\Program Files\\Ollama\\ollama.exe",
    }
    with patch("backend.app.services.ollama_client.OllamaClient.check_detailed_status", new_callable=AsyncMock) as mock_check:
        mock_check.return_value = mock_status
        res = client.get("/api/v1/ai/status", headers=auth_headers)
        assert res.status_code == 200
        data = res.json()
        assert data["state"] == "ollama_stopped"
        assert data["ollama_installed"] is True
        assert data["service_running"] is False


def test_ai_status_model_missing(client, auth_headers):
    """When Ollama is running but gemma2:2b is absent, report model_missing."""
    mock_status = {
        "enabled": True,
        "available": False,
        "state": "model_missing",
        "ollama_installed": True,
        "service_running": True,
        "configured_model": "gemma2:2b",
        "model_available": False,
        "active_model": "llama3.1:8b",
        "base_url": "http://127.0.0.1:11434",
        "installed_models": ["llama3.1:8b"],
        "model_size_bytes": None,
        "model_size_mb": None,
        "binary_path": "C:\\Program Files\\Ollama\\ollama.exe",
    }
    with patch("backend.app.services.ollama_client.OllamaClient.check_detailed_status", new_callable=AsyncMock) as mock_check:
        mock_check.return_value = mock_status
        res = client.get("/api/v1/ai/status", headers=auth_headers)
        assert res.status_code == 200
        data = res.json()
        assert data["state"] == "model_missing"
        assert data["service_running"] is True
        assert data["model_available"] is False


def test_ai_status_model_ready(client, auth_headers):
    """When Ollama and gemma2:2b are both present, report model_ready."""
    mock_status = {
        "enabled": True,
        "available": True,
        "state": "model_ready",
        "ollama_installed": True,
        "service_running": True,
        "configured_model": "gemma2:2b",
        "model_available": True,
        "active_model": "gemma2:2b",
        "base_url": "http://127.0.0.1:11434",
        "installed_models": ["gemma2:2b"],
        "model_size_bytes": 1629518495,
        "model_size_mb": 1554,
        "binary_path": "C:\\Program Files\\Ollama\\ollama.exe",
    }
    with patch("backend.app.services.ollama_client.OllamaClient.check_detailed_status", new_callable=AsyncMock) as mock_check:
        mock_check.return_value = mock_status
        res = client.get("/api/v1/ai/status", headers=auth_headers)
        assert res.status_code == 200
        data = res.json()
        assert data["state"] == "model_ready"
        assert data["model_available"] is True
        assert data["model_size_mb"] == 1554


def test_ai_start_service_success(client, auth_headers):
    """Starting service via allowlisted binary returns success."""
    with patch("backend.app.services.ollama_client.OllamaClient.start_service", new_callable=AsyncMock) as mock_start:
        mock_start.return_value = (True, "Ollama service started successfully.", True)
        res = client.post("/api/v1/ai/start-service", headers=auth_headers)
        assert res.status_code == 200
        data = res.json()
        assert data["success"] is True
        assert data["service_running"] is True


def test_ai_start_service_failure(client, auth_headers):
    """When Ollama binary cannot be executed or fails, returns failure."""
    with patch("backend.app.services.ollama_client.OllamaClient.start_service", new_callable=AsyncMock) as mock_start:
        mock_start.return_value = (False, "Ollama executable not found on host machine.", False)
        res = client.post("/api/v1/ai/start-service", headers=auth_headers)
        assert res.status_code == 200
        data = res.json()
        assert data["success"] is False
        assert data["service_running"] is False


def test_ai_pull_model_success(client, auth_headers):
    """Pulling allowed model returns success."""
    with patch("backend.app.services.ollama_client.OllamaClient.pull_model", new_callable=AsyncMock) as mock_pull:
        mock_pull.return_value = (True, "Model 'gemma2:2b' successfully downloaded and verified.")
        res = client.post("/api/v1/ai/pull", json={"model_name": "gemma2:2b"}, headers=auth_headers)
        assert res.status_code == 200
        data = res.json()
        assert data["success"] is True
        assert data["status"] == "completed"


def test_ai_test_inference_success(client, auth_headers):
    """Inference test returns success, latency_ms, and response text."""
    with patch("backend.app.services.ollama_client.OllamaClient.test_inference", new_callable=AsyncMock) as mock_test:
        mock_test.return_value = (True, 380, "Local gemma2:2b responded in 380ms.", "OK")
        res = client.post("/api/v1/ai/test", headers=auth_headers)
        assert res.status_code == 200
        data = res.json()
        assert data["success"] is True
        assert data["latency_ms"] == 380
        assert data["response_text"] == "OK"


def test_ai_test_inference_failure(client, auth_headers):
    """Inference failure returns success=False with clear error message."""
    with patch("backend.app.services.ollama_client.OllamaClient.test_inference", new_callable=AsyncMock) as mock_test:
        mock_test.return_value = (False, 2000, "Inference test failed: connection refused", None)
        res = client.post("/api/v1/ai/test", headers=auth_headers)
        assert res.status_code == 200
        data = res.json()
        assert data["success"] is False
        assert "failed" in data["message"].lower()
