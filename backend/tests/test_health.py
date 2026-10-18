def test_health_endpoint(client):
    """Test that /api/v1/health returns healthy status and expected schema."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["version"] == "0.1.0"
    assert data["database"] == "connected"
    assert isinstance(data["ai_available"], bool)


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
    """Test that root / endpoint returns online status."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert data["version"] == "0.1.0"
