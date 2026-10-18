import pytest
from fastapi.testclient import TestClient
from backend.app.main import app


@pytest.fixture
def client():
    """Test client fixture initialized with the FastAPI application."""
    with TestClient(app) as test_client:
        yield test_client
