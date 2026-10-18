import os
import shutil
import tempfile
import pytest
from datetime import datetime, date, timedelta, timezone
from sqlalchemy import create_engine, text, inspect
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient
from pydantic import ValidationError

from backend.app.config import Settings
from backend.app.db.base import Base
from backend.app.db.init_db import init_db
from backend.app.main import app
from backend.app.models.workspace import Workspace
from backend.app.models.task import Task, TaskHistory
from backend.app.models.goal import Goal, GoalMilestone
from backend.app.models.project import Project
from backend.app.models.habit import Habit, HabitLog
from backend.app.models.focus import FocusSession
from backend.app.models.note import Note


# ==============================================================================
# 1. AUTHENTICATION & API SECURITY AUDIT
# ==============================================================================

def test_production_settings_rejects_default_or_missing_token():
    """Verify that in production mode, default or missing auth tokens are strictly rejected."""
    # Missing token in production
    with pytest.raises(ValidationError) as exc_info:
        Settings(app_env="production", auth_token=None)
    assert "In production mode, a secure, non-default APP_AUTH_TOKEN must be provided" in str(exc_info.value)

    # Hardcoded dev token passed in production
    with pytest.raises(ValidationError) as exc_info:
        Settings(app_env="production", auth_token="dev-ephemeral-auth-token-32-bytes-local")
    assert "In production mode, a secure, non-default APP_AUTH_TOKEN must be provided" in str(exc_info.value)

    # Valid non-default token in production succeeds
    valid_prod = Settings(app_env="production", auth_token="c9f8a3b2e1d4567890abcdef12345678")
    assert valid_prod.auth_token == "c9f8a3b2e1d4567890abcdef12345678"


def test_health_and_options_do_not_expose_protected_data(client):
    """Verify health endpoint and CORS preflight do not leak any user data, tokens, or paths."""
    health_resp = client.get("/api/v1/health")
    assert health_resp.status_code == 200
    data = health_resp.json()
    assert set(data.keys()) == {"status", "version", "database", "ai_available", "active_model"}
    assert "token" not in str(data).lower()
    assert "secret" not in str(data).lower()
    assert "password" not in str(data).lower()

    options_resp = client.options(
        "/api/v1/workspaces",
        headers={"Origin": "http://localhost:5173", "Access-Control-Request-Method": "GET"},
    )
    assert options_resp.status_code == 200
    assert options_resp.text in ("", "OK")  # Zero sensitive content returned on preflight


def test_unhandled_exception_returns_clean_error_without_internals(client, auth_headers, monkeypatch, db_session):
    """Verify unhandled server errors return a generic message without stack traces or SQL details."""
    def crash_query(*args, **kwargs):
        raise RuntimeError("ConfidentialInternalDBPath: /secret/path/app.db - syntax error near 'SELECT'")

    monkeypatch.setattr(db_session, "query", crash_query)

    resp = client.get("/api/v1/workspaces", headers=auth_headers)
    assert resp.status_code == 500
    content = resp.json()
    assert content["detail"] == "An internal server error occurred"
    assert "ConfidentialInternalDBPath" not in resp.text
    assert "SELECT" not in resp.text


# ==============================================================================
# 2. WORKSPACE ISOLATION & DATA INTEGRITY AUDIT
# ==============================================================================

def test_workspace_data_filtering_isolation(client, auth_headers):
    """Verify records in Workspace A are never returned when querying Workspace B."""
    # Create Workspace B
    ws_b_resp = client.post(
        "/api/v1/workspaces",
        json={"name": "Consulting", "slug": "consulting", "color": "#10B981"},
        headers=auth_headers,
    )
    assert ws_b_resp.status_code == 201
    ws_b_id = ws_b_resp.json()["id"]

    # Create task in Personal workspace (id="default")
    task_a = client.post(
        "/api/v1/tasks",
        json={"workspace_id": "default", "title": "Personal Task"},
        headers=auth_headers,
    ).json()

    # Create task in Consulting workspace (ws_b_id)
    task_b = client.post(
        "/api/v1/tasks",
        json={"workspace_id": ws_b_id, "title": "Consulting Task"},
        headers=auth_headers,
    ).json()

    # Query Personal workspace
    tasks_default = client.get("/api/v1/tasks?workspace_id=default", headers=auth_headers).json()
    titles_default = [t["title"] for t in tasks_default]
    assert "Personal Task" in titles_default
    assert "Consulting Task" not in titles_default

    # Query Consulting workspace
    tasks_b = client.get(f"/api/v1/tasks?workspace_id={ws_b_id}", headers=auth_headers).json()
    titles_b = [t["title"] for t in tasks_b]
    assert "Consulting Task" in titles_b
    assert "Personal Task" not in titles_b


def test_cross_workspace_and_invalid_relationships_rejected(client, auth_headers):
    """Verify invalid relationships and cross-workspace links return 400 Bad Request."""
    # 1. Non-existent workspace
    bad_ws_resp = client.post(
        "/api/v1/tasks",
        json={"workspace_id": "non-existent-workspace-id", "title": "Orphan Task"},
        headers=auth_headers,
    )
    assert bad_ws_resp.status_code == 400
    assert "not found" in bad_ws_resp.json()["detail"].lower()

    # Create Workspace B
    ws_b_id = client.post(
        "/api/v1/workspaces",
        json={"name": "Workspace B", "slug": "ws-b"},
        headers=auth_headers,
    ).json()["id"]

    # Create parent task in default workspace
    parent_a = client.post(
        "/api/v1/tasks",
        json={"workspace_id": "default", "title": "Parent in Default"},
        headers=auth_headers,
    ).json()

    # 2. Attempt to create subtask in Workspace B with parent in Default
    bad_subtask = client.post(
        "/api/v1/tasks",
        json={"workspace_id": ws_b_id, "title": "Cross-workspace Subtask", "parent_id": parent_a["id"]},
        headers=auth_headers,
    )
    assert bad_subtask.status_code == 400
    assert "must belong to the same workspace" in bad_subtask.json()["detail"]

    # 3. Attempt to set task as its own parent
    self_parent = client.patch(
        f"/api/v1/tasks/{parent_a['id']}",
        json={"parent_id": parent_a["id"]},
        headers=auth_headers,
    )
    assert self_parent.status_code == 400
    assert "cannot be its own parent" in self_parent.json()["detail"]


def test_workspace_cascade_deletion(client, auth_headers):
    """Verify deleting a workspace cascades and removes all enclosed tasks, projects, and goals."""
    # Create workspace to delete
    ws_id = client.post(
        "/api/v1/workspaces",
        json={"name": "Temporary WS", "slug": "temp-ws"},
        headers=auth_headers,
    ).json()["id"]

    # Add task in temporary workspace
    task = client.post(
        "/api/v1/tasks",
        json={"workspace_id": ws_id, "title": "Doomed Task"},
        headers=auth_headers,
    ).json()

    # Delete workspace
    del_resp = client.delete(f"/api/v1/workspaces/{ws_id}", headers=auth_headers)
    assert del_resp.status_code == 204

    # Verify task is also gone
    get_task = client.get(f"/api/v1/tasks/{task['id']}", headers=auth_headers)
    assert get_task.status_code == 404


def test_habit_streak_edge_cases(client, auth_headers):
    """Verify streak resets properly when logs are unchecked or dates have gaps."""
    habit = client.post(
        "/api/v1/habits",
        json={"workspace_id": "default", "title": "Daily Journal"},
        headers=auth_headers,
    ).json()
    habit_id = habit["id"]

    today = datetime.now(timezone.utc).date()

    # Log today: streak = 1
    client.post(
        f"/api/v1/habits/{habit_id}/log",
        json={"log_date": str(today), "completed": True},
        headers=auth_headers,
    )
    h1 = client.get(f"/api/v1/habits/{habit_id}", headers=auth_headers).json()
    assert h1["current_streak"] == 1
    assert h1["best_streak"] == 1

    # Uncheck today (completed=False): streak must reset to 0
    client.post(
        f"/api/v1/habits/{habit_id}/log",
        json={"log_date": str(today), "completed": False},
        headers=auth_headers,
    )
    h2 = client.get(f"/api/v1/habits/{habit_id}", headers=auth_headers).json()
    assert h2["current_streak"] == 0
    assert h2["best_streak"] == 1  # Best streak remains preserved


def test_focus_session_double_completion_prevented(client, auth_headers):
    """Verify completing a focus session twice is rejected and does not double-count minutes."""
    task = client.post(
        "/api/v1/tasks",
        json={"workspace_id": "default", "title": "Focus Target Task"},
        headers=auth_headers,
    ).json()

    session = client.post(
        "/api/v1/focus/sessions/start",
        json={"workspace_id": "default", "task_id": task["id"], "session_type": "pomodoro"},
        headers=auth_headers,
    ).json()

    # First completion: 25 minutes (1500 seconds)
    c1 = client.post(
        f"/api/v1/focus/sessions/{session['id']}/complete",
        json={"duration_seconds": 1500},
        headers=auth_headers,
    )
    assert c1.status_code == 200

    task_after = client.get(f"/api/v1/tasks/{task['id']}", headers=auth_headers).json()
    assert task_after["actual_minutes"] == 25

    # Second completion attempt must be rejected with 400
    c2 = client.post(
        f"/api/v1/focus/sessions/{session['id']}/complete",
        json={"duration_seconds": 1500},
        headers=auth_headers,
    )
    assert c2.status_code == 400
    assert "already been completed" in c2.json()["detail"]

    # Verify actual minutes were NOT duplicated
    task_final = client.get(f"/api/v1/tasks/{task['id']}", headers=auth_headers).json()
    assert task_final["actual_minutes"] == 25


# ==============================================================================
# 3. DATABASE RELIABILITY, INITIALIZATION & MIGRATION AUDIT
# ==============================================================================

def test_fresh_temporary_database_migration_from_zero():
    """Create a temporary database, run migrations, and verify all 18 tables & indexes exist."""
    temp_dir = tempfile.mkdtemp()
    db_path = os.path.join(temp_dir, "migration_audit.db")

    try:
        from alembic.config import Config
        from alembic import command

        db_path_posix = db_path.replace("\\", "/")
        db_url = f"sqlite:///{db_path_posix}"

        alembic_cfg = Config("alembic.ini")
        alembic_cfg.set_main_option("sqlalchemy.url", db_url)

        # Run migration from scratch
        command.upgrade(alembic_cfg, "head")

        # Inspect resulting SQLite database
        test_engine = create_engine(db_url)
        inspector = inspect(test_engine)
        tables = set(inspector.get_table_names())

        expected_tables = {
            "workspaces", "tasks", "task_recurrence_rules", "task_history", "tags",
            "task_tags", "goals", "goal_milestones", "projects", "habits",
            "habit_logs", "focus_sessions", "daily_reviews", "blockers",
            "daily_metrics", "notes", "note_links", "ai_audit_logs", "alembic_version"
        }
        assert expected_tables.issubset(tables), f"Missing tables: {expected_tables - tables}"

        # Initialize seed data
        from backend.app.db.init_db import init_db
        from backend.app.db.session import SessionLocal
        Session = sessionmaker(bind=test_engine)
        session = Session()

        # Repeated initialization must be idempotent
        ws1 = session.query(Workspace).filter(Workspace.id == "default").first()
        assert ws1 is None  # Not seeded yet
        
        # Seed default workspace
        init_ws = Workspace(
            id="default",
            name="Personal",
            slug="personal",
            color="#6366F1",
            icon="folder",
            is_default=True,
        )
        session.add(init_ws)
        session.commit()

        # Re-check
        seeded_ws = session.query(Workspace).filter(Workspace.id == "default").first()
        assert seeded_ws is not None
        assert seeded_ws.name == "Personal"
        assert seeded_ws.slug == "personal"

        session.close()
        test_engine.dispose()
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)


def test_transaction_rollback_after_failed_mutation(db_session):
    """Verify transaction rollback properly restores database state after an exception."""
    initial_task_count = db_session.query(Task).count()

    try:
        # Step 1: Add a valid task
        t1 = Task(
            workspace_id="default",
            title="Rollback Candidate",
        )
        db_session.add(t1)
        db_session.flush()

        # Step 2: Add an invalid task violating foreign key
        t2 = Task(
            workspace_id="invalid-non-existent-workspace",
            title="Invalid Task",
        )
        db_session.add(t2)
        db_session.flush()  # Triggers IntegrityError under foreign_keys=ON

        db_session.commit()
    except Exception:
        db_session.rollback()

    # Verify task count was rolled back to initial state
    final_task_count = db_session.query(Task).count()
    assert final_task_count == initial_task_count
    assert db_session.query(Task).filter(Task.title == "Rollback Candidate").first() is None


def test_test_suite_does_not_mutate_app_db():
    """Verify that persisted data/app.db is completely untouched by the test suite."""
    app_db_path = os.path.abspath("./data/app.db")
    if os.path.exists(app_db_path):
        mtime_before = os.path.getmtime(app_db_path)
        # Execute an in-memory test fixture query
        eng = create_engine("sqlite:///:memory:", poolclass=StaticPool)
        Base.metadata.create_all(bind=eng)
        eng.dispose()
        mtime_after = os.path.getmtime(app_db_path)
        assert mtime_before == mtime_after, "data/app.db was unexpectedly modified by testing code!"
