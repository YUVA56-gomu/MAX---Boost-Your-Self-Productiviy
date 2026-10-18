import pytest


def test_goal_with_milestones_and_progress_rollup(client, auth_headers):
    """Creating and completing milestones dynamically calculates goal progress_percentage."""
    goal_payload = {
        "workspace_id": "default",
        "title": "Establish Offline Engineering Foundation",
        "description": "Milestones 0, 1, and 2 completed.",
        "goal_type": "short_term",
        "target_date": "2026-10-31",
    }
    goal_resp = client.post("/api/v1/goals", json=goal_payload, headers=auth_headers)
    assert goal_resp.status_code == 201
    goal = goal_resp.json()
    assert goal["progress_percentage"] == 0
    goal_id = goal["id"]

    # Add 2 milestones
    ms1_resp = client.post(
        f"/api/v1/goals/{goal_id}/milestones",
        json={"title": "Milestone 1 Bootstrap", "target_date": "2026-10-18"},
        headers=auth_headers,
    )
    assert ms1_resp.status_code == 201
    ms1_id = ms1_resp.json()["id"]

    ms2_resp = client.post(
        f"/api/v1/goals/{goal_id}/milestones",
        json={"title": "Milestone 2 Data Engine", "target_date": "2026-10-25"},
        headers=auth_headers,
    )
    assert ms2_resp.status_code == 201

    # Check goal: progress is 0% (0/2 completed)
    get_goal = client.get(f"/api/v1/goals/{goal_id}", headers=auth_headers)
    assert get_goal.json()["progress_percentage"] == 0
    assert len(get_goal.json()["milestones"]) == 2

    # Complete ms1
    patch_ms = client.patch(
        f"/api/v1/goals/milestones/{ms1_id}",
        json={"is_completed": True},
        headers=auth_headers,
    )
    assert patch_ms.status_code == 200
    assert patch_ms.json()["is_completed"] is True
    assert patch_ms.json()["completed_at"] is not None

    # Check goal again: progress is now 50% (1/2 completed)
    get_goal = client.get(f"/api/v1/goals/{goal_id}", headers=auth_headers)
    assert get_goal.json()["progress_percentage"] == 50


def test_project_linking_and_task_metrics(client, auth_headers):
    """Project tracks tasks and calculates completed_task_count."""
    proj_resp = client.post(
        "/api/v1/projects",
        json={"workspace_id": "default", "title": "Desktop Shell Integration"},
        headers=auth_headers,
    )
    assert proj_resp.status_code == 201
    proj_id = proj_resp.json()["id"]

    # Create 2 tasks in this project
    t1 = client.post(
        "/api/v1/tasks",
        json={"workspace_id": "default", "project_id": proj_id, "title": "Configure Tauri 2"},
        headers=auth_headers,
    ).json()

    t2 = client.post(
        "/api/v1/tasks",
        json={"workspace_id": "default", "project_id": proj_id, "title": "Sidecar Process Manager"},
        headers=auth_headers,
    ).json()

    # Complete task 1
    client.patch(
        f"/api/v1/tasks/{t1['id']}",
        json={"status": "completed"},
        headers=auth_headers,
    )

    # Inspect project
    get_proj = client.get(f"/api/v1/projects/{proj_id}", headers=auth_headers)
    assert get_proj.json()["task_count"] == 2
    assert get_proj.json()["completed_task_count"] == 1


def test_goal_cascade_delete(client, auth_headers):
    """Deleting goal cascades deletion to its milestones."""
    goal_resp = client.post(
        "/api/v1/goals",
        json={"workspace_id": "default", "title": "Ephemeral Goal"},
        headers=auth_headers,
    )
    goal_id = goal_resp.json()["id"]

    ms_resp = client.post(
        f"/api/v1/goals/{goal_id}/milestones",
        json={"title": "Ephemeral Milestone"},
        headers=auth_headers,
    )
    ms_id = ms_resp.json()["id"]

    # Delete goal
    del_resp = client.delete(f"/api/v1/goals/{goal_id}", headers=auth_headers)
    assert del_resp.status_code == 204

    # Milestone should be gone
    get_ms = client.patch(
        f"/api/v1/goals/milestones/{ms_id}",
        json={"title": "Should Fail"},
        headers=auth_headers,
    )
    assert get_ms.status_code == 404
