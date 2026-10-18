import pytest


def test_create_task_with_audit_history(client, auth_headers):
    """Creating a task records an initial creation entry in task_history."""
    payload = {
        "workspace_id": "default",
        "title": "Build SQLite persistence layer",
        "description": "Configure WAL mode and declarative models.",
        "priority": "high",
        "energy_level": 4,
        "estimated_minutes": 60,
    }
    response = client.post("/api/v1/tasks", json=payload, headers=auth_headers)
    assert response.status_code == 201
    task = response.json()
    assert task["title"] == "Build SQLite persistence layer"
    assert task["energy_level"] == 4
    assert task["actual_minutes"] == 0

    # Verify audit history was recorded
    hist_resp = client.get(f"/api/v1/tasks/{task['id']}/history", headers=auth_headers)
    assert hist_resp.status_code == 200
    history = hist_resp.json()
    assert len(history) >= 1
    assert history[0]["changed_field"] == "created"


def test_update_task_mutations_logged_in_history(client, auth_headers):
    """Updating task status records field changes in task_history and sets completed_at."""
    create_resp = client.post(
        "/api/v1/tasks",
        json={"workspace_id": "default", "title": "Refactor test suite"},
        headers=auth_headers,
    )
    task_id = create_resp.json()["id"]

    # Transition to completed
    patch_resp = client.patch(
        f"/api/v1/tasks/{task_id}",
        json={"status": "completed", "priority": "urgent"},
        headers=auth_headers,
    )
    assert patch_resp.status_code == 200
    updated_task = patch_resp.json()
    assert updated_task["status"] == "completed"
    assert updated_task["priority"] == "urgent"
    assert updated_task["completed_at"] is not None

    # Inspect history audit log
    hist_resp = client.get(f"/api/v1/tasks/{task_id}/history", headers=auth_headers)
    history = hist_resp.json()
    fields_changed = {h["changed_field"] for h in history}
    assert "status" in fields_changed
    assert "priority" in fields_changed


def test_subtask_hierarchy_and_cascade_delete(client, auth_headers):
    """Parent task links subtasks; deleting parent cascades deletion to subtasks."""
    parent_resp = client.post(
        "/api/v1/tasks",
        json={"workspace_id": "default", "title": "Parent Feature Epic"},
        headers=auth_headers,
    )
    parent_id = parent_resp.json()["id"]

    # Create subtask
    sub_resp = client.post(
        "/api/v1/tasks",
        json={"workspace_id": "default", "parent_id": parent_id, "title": "Subtask 1"},
        headers=auth_headers,
    )
    assert sub_resp.status_code == 201
    subtask_id = sub_resp.json()["id"]

    # Get parent: subtask_count should be 1
    get_parent = client.get(f"/api/v1/tasks/{parent_id}", headers=auth_headers)
    assert get_parent.json()["subtask_count"] == 1
    assert get_parent.json()["completed_subtask_count"] == 0

    # Delete parent
    del_resp = client.delete(f"/api/v1/tasks/{parent_id}", headers=auth_headers)
    assert del_resp.status_code == 204

    # Subtask should also be deleted via CASCADE
    get_sub = client.get(f"/api/v1/tasks/{subtask_id}", headers=auth_headers)
    assert get_sub.status_code == 404


def test_set_task_recurrence_rule(client, auth_headers):
    """Configure automated repetition schedule for task."""
    task_resp = client.post(
        "/api/v1/tasks",
        json={"workspace_id": "default", "title": "Weekly Planning"},
        headers=auth_headers,
    )
    task_id = task_resp.json()["id"]

    rule_payload = {
        "frequency": "weekly",
        "interval_days": 7,
        "by_weekdays": [1],
        "start_date": "2026-10-19",
    }
    rec_resp = client.post(
        f"/api/v1/tasks/{task_id}/recurring",
        json=rule_payload,
        headers=auth_headers,
    )
    assert rec_resp.status_code == 200
    rule = rec_resp.json()
    assert rule["frequency"] == "weekly"
    assert rule["interval_days"] == 7
