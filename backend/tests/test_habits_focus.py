import pytest
from datetime import datetime, timezone, timedelta


def test_habit_creation_and_streak_tracking(client, auth_headers):
    """Habit logging calculates consecutive daily streaks."""
    habit_payload = {
        "workspace_id": "default",
        "title": "Daily Code Review",
        "frequency": "daily",
        "target_count": 1,
    }
    habit_resp = client.post("/api/v1/habits", json=habit_payload, headers=auth_headers)
    assert habit_resp.status_code == 201
    habit_id = habit_resp.json()["id"]

    today = datetime.now(timezone.utc).date()
    yesterday = today - timedelta(days=1)

    # Log yesterday
    client.post(
        f"/api/v1/habits/{habit_id}/log",
        json={"log_date": str(yesterday), "completed": True},
        headers=auth_headers,
    )

    # Log today
    log_resp = client.post(
        f"/api/v1/habits/{habit_id}/log",
        json={"log_date": str(today), "completed": True},
        headers=auth_headers,
    )
    assert log_resp.status_code == 200

    # Inspect habit: current_streak should be 2, best_streak should be 2, logged_today True
    get_habit = client.get(f"/api/v1/habits/{habit_id}", headers=auth_headers)
    habit_data = get_habit.json()
    assert habit_data["current_streak"] == 2
    assert habit_data["best_streak"] == 2
    assert habit_data["logged_today"] is True


def test_focus_session_lifecycle_and_task_duration_rollover(client, auth_headers):
    """Completing a focus session automatically increments associated task actual_minutes."""
    task_resp = client.post(
        "/api/v1/tasks",
        json={"workspace_id": "default", "title": "Implement authentication middleware"},
        headers=auth_headers,
    )
    task_id = task_resp.json()["id"]
    assert task_resp.json()["actual_minutes"] == 0

    # Start focus session
    start_resp = client.post(
        "/api/v1/focus/sessions/start",
        json={
            "workspace_id": "default",
            "task_id": task_id,
            "session_type": "pomodoro",
            "energy_before": 4,
        },
        headers=auth_headers,
    )
    assert start_resp.status_code == 201
    session_id = start_resp.json()["id"]
    assert start_resp.json()["is_completed"] is False

    # Complete focus session with 25 minutes (1500 seconds)
    complete_resp = client.post(
        f"/api/v1/focus/sessions/{session_id}/complete",
        json={
            "duration_seconds": 1500,
            "interruption_count": 0,
            "energy_after": 4,
            "notes": "Good focus",
        },
        headers=auth_headers,
    )
    assert complete_resp.status_code == 200
    assert complete_resp.json()["is_completed"] is True

    # Verify task actual_minutes was incremented by 25
    get_task = client.get(f"/api/v1/tasks/{task_id}", headers=auth_headers)
    assert get_task.json()["actual_minutes"] == 25
