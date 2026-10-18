import pytest
from backend.app.config import settings
from backend.app.middleware.logging import sanitize_headers


def test_unauthenticated_request_rejected(client):
    """Protected endpoint returns 401 Unauthorized when Authorization header is omitted."""
    response = client.get("/api/v1/workspaces")
    assert response.status_code == 401
    assert response.json()["detail"] == "Authorization header missing"


def test_malformed_auth_header_rejected(client):
    """Requests with malformed Authorization headers return 401 Unauthorized."""
    # Scheme is not Bearer
    response = client.get(
        "/api/v1/workspaces",
        headers={"Authorization": "Basic dXNlcjpwYXNz"},
    )
    assert response.status_code == 401
    assert "Invalid authorization header format" in response.json()["detail"]

    # Missing token part
    response = client.get(
        "/api/v1/workspaces",
        headers={"Authorization": "Bearer"},
    )
    assert response.status_code == 401


def test_invalid_bearer_token_rejected(client):
    """Requests with incorrect bearer token return 401 Unauthorized."""
    response = client.get(
        "/api/v1/workspaces",
        headers={"Authorization": "Bearer invalid-wrong-token-abc-123"},
    )
    assert response.status_code == 401
    assert "Invalid or unauthorized session token" in response.json()["detail"]


def test_valid_bearer_token_accepted(client, auth_headers):
    """Requests with valid bearer token succeed with 200 OK."""
    response = client.get("/api/v1/workspaces", headers=auth_headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_sensitive_header_redaction():
    """Verify sanitize_headers masks sensitive authorization credentials."""
    raw_headers = {
        "Host": "127.0.0.1:24125",
        "Authorization": "Bearer secret-ephemeral-key-9999",
        "Cookie": "session_id=confidential_session_data",
        "Content-Type": "application/json",
        "X-Auth-Token": "secret_token_value",
    }
    sanitized = sanitize_headers(raw_headers)

    assert sanitized["Authorization"] == "[REDACTED]"
    assert sanitized["Cookie"] == "[REDACTED]"
    assert sanitized["X-Auth-Token"] == "[REDACTED]"
    assert sanitized["Host"] == "127.0.0.1:24125"
    assert sanitized["Content-Type"] == "application/json"
