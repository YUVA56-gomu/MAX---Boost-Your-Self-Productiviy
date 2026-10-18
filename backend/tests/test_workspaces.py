import pytest


def test_list_workspaces(client, auth_headers):
    """List workspaces returns default workspace seeded on init."""
    response = client.get("/api/v1/workspaces", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert data[0]["is_default"] is True
    assert data[0]["name"] == "Personal"


def test_create_workspace(client, auth_headers):
    """Create a new workspace successfully."""
    payload = {
        "name": "Engineering",
        "slug": "engineering",
        "color": "#10B981",
        "icon": "code",
    }
    response = client.post("/api/v1/workspaces", json=payload, headers=auth_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Engineering"
    assert data["slug"] == "engineering"
    assert data["color"] == "#10B981"
    assert "id" in data


def test_create_workspace_duplicate_slug_rejected(client, auth_headers):
    """Duplicate workspace slug returns 409 Conflict."""
    payload = {
        "name": "Personal Duplicate",
        "slug": "personal",
    }
    response = client.post("/api/v1/workspaces", json=payload, headers=auth_headers)
    assert response.status_code == 409


def test_get_workspace_by_id(client, auth_headers):
    """Retrieve workspace by ID or slug."""
    response = client.get("/api/v1/workspaces/default", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["id"] == "default"


def test_delete_default_workspace_prevented(client, auth_headers):
    """Deleting the default workspace returns 400 Bad Request."""
    response = client.delete("/api/v1/workspaces/default", headers=auth_headers)
    assert response.status_code == 400
    assert "Cannot delete default primary workspace" in response.json()["detail"]


def test_delete_custom_workspace(client, auth_headers):
    """Delete a custom workspace."""
    create_resp = client.post(
        "/api/v1/workspaces",
        json={"name": "Temporary", "slug": "temp"},
        headers=auth_headers,
    )
    ws_id = create_resp.json()["id"]

    del_resp = client.delete(f"/api/v1/workspaces/{ws_id}", headers=auth_headers)
    assert del_resp.status_code == 204

    get_resp = client.get(f"/api/v1/workspaces/{ws_id}", headers=auth_headers)
    assert get_resp.status_code == 404
