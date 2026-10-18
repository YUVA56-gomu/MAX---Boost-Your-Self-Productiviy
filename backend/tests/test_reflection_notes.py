import pytest
from datetime import datetime, timezone


def test_daily_review_upsert(client, auth_headers):
    """Daily review records daily reflection and energy rating."""
    today = str(datetime.now(timezone.utc).date())
    payload = {
        "workspace_id": "default",
        "wins": "Shipped database persistence engine.",
        "challenges": "Handling nested subtasks.",
        "tomorrow_priorities": "Build UI screens.",
        "mood_score": 5,
        "energy_score": 4,
    }
    resp = client.post(f"/api/v1/insights/daily-review/{today}", json=payload, headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["wins"] == "Shipped database persistence engine."
    assert data["mood_score"] == 5

    # Retrieve
    get_resp = client.get(f"/api/v1/insights/daily-review/{today}?workspace_id=default", headers=auth_headers)
    assert get_resp.status_code == 200
    assert get_resp.json()["energy_score"] == 4


def test_blocker_lifecycle(client, auth_headers):
    """Log and resolve a blocker."""
    payload = {
        "workspace_id": "default",
        "title": "Awaiting design reference image",
        "category": "external",
        "description": "User will place dashboard-reference.png",
    }
    resp = client.post("/api/v1/insights/blockers", json=payload, headers=auth_headers)
    assert resp.status_code == 201
    blocker_id = resp.json()["id"]
    assert resp.json()["status"] == "active"
    assert resp.json()["resolved_at"] is None

    # Resolve blocker
    patch_resp = client.patch(
        f"/api/v1/insights/blockers/{blocker_id}",
        json={"status": "resolved"},
        headers=auth_headers,
    )
    assert patch_resp.status_code == 200
    assert patch_resp.json()["status"] == "resolved"
    assert patch_resp.json()["resolved_at"] is not None


def test_deterministic_workload_insights(client, auth_headers):
    """Workload calculation calculates planned vs completed workload without AI."""
    # Create and complete a task with estimated 60 and actual 45 minutes
    t = client.post(
        "/api/v1/tasks",
        json={"workspace_id": "default", "title": "Task A", "estimated_minutes": 60},
        headers=auth_headers,
    ).json()

    client.patch(
        f"/api/v1/tasks/{t['id']}",
        json={"status": "completed", "actual_minutes": 45},
        headers=auth_headers,
    )

    resp = client.get("/api/v1/insights/workload?workspace_id=default&range=7d", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["tasks_completed_count"] >= 1
    assert data["total_completed_minutes"] >= 45
    assert data["total_planned_minutes"] >= 60


def test_notes_wikilinks_and_backlinks(client, auth_headers):
    """Notes parse [[WikiLink]] syntax and expose backlinks."""
    # Create target note
    n1 = client.post(
        "/api/v1/notes",
        json={"workspace_id": "default", "title": "Architecture Overview", "content_markdown": "Core doc."},
        headers=auth_headers,
    ).json()
    n1_id = n1["id"]

    # Create source note referencing target note via [[Architecture Overview]]
    n2 = client.post(
        "/api/v1/notes",
        json={
            "workspace_id": "default",
            "title": "Meeting Notes",
            "content_markdown": "Discussed [[Architecture Overview]] and decided on SQLite WAL.",
        },
        headers=auth_headers,
    ).json()
    assert n2["outgoing_link_count"] == 1

    # Check backlinks for target note
    backlinks_resp = client.get(f"/api/v1/notes/{n1_id}/backlinks", headers=auth_headers)
    assert backlinks_resp.status_code == 200
    backlinks = backlinks_resp.json()
    assert len(backlinks) == 1
    assert backlinks[0]["source_note_title"] == "Meeting Notes"
