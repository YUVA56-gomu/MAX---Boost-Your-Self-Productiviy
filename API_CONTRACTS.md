# API Contracts Specification

## 1. Conventions, Transport & Security Contract

- **Base URL**: `http://127.0.0.1:<APP_PORT>/api/v1`
- **Loopback Binding**: Exclusively `127.0.0.1` (never `0.0.0.0`).
- **Authentication**: `Authorization: Bearer <APP_AUTH_TOKEN>` required on all endpoints except `/health`.
- **Token Security Model**:
  - Ephemeral 32-byte cryptographic hex token generated on startup by the Tauri shell.
  - Injected directly into the sidecar process environment (`APP_AUTH_TOKEN`) and frontend memory.
  - **Never stored in persistent browser storage** (`localStorage`, `sessionStorage`, cookies, `IndexedDB`).
  - Validated per-request using constant-time string comparison (`secrets.compare_digest`).
  - Missing, invalid, or malformed tokens yield `401 Unauthorized`.
- **Log Redaction**: All authorization headers, token strings, and payload secrets are scrubbed before logging.
- **Content Type**: `application/json; charset=utf-8`.
- **Time Representation**: All timestamps are UTC ISO-8601 strings (`YYYY-MM-DDTHH:MM:SSZ`).
- **Standard Error Schema**:
```json
{
  "error": {
    "code": "ENTITY_NOT_FOUND",
    "message": "The requested entity was not found.",
    "details": null
  }
}
```

---

## 2. System Endpoints

### 2.1 `GET /api/v1/health`
Health probe called by Tauri desktop shell and UI during startup.

- **Auth Required**: No
- **Response `200 OK`**:
```json
{
  "status": "healthy",
  "version": "0.1.0",
  "database": "connected",
  "ai_available": true,
  "active_model": "gemma2:2b"
}
```

### 2.2 `POST /api/v1/system/shutdown`
Gracefully flushes open SQLite WAL connections and exits the sidecar.

- **Auth Required**: Yes
- **Response `200 OK`**: `{"status": "shutting_down"}`

---

## 3. Workspaces

### 3.1 `GET /api/v1/workspaces`
- **Response `200 OK`**:
```json
[
  {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "name": "Personal",
    "slug": "personal",
    "color": "#6366F1",
    "icon": "user",
    "is_default": true,
    "created_at": "2026-10-18T12:00:00Z"
  }
]
```

### 3.2 `POST /api/v1/workspaces`
- **Request Body**:
```json
{
  "name": "Engineering",
  "slug": "engineering",
  "color": "#10B981",
  "icon": "code"
}
```
- **Response `201 Created`**: Returns created Workspace object.

---

## 4. Pillar 1: Task Management Endpoints

### 4.1 `GET /api/v1/tasks`
- **Query Parameters**:
  - `workspace_id` (UUID, required)
  - `project_id` (UUID, optional)
  - `goal_id` (UUID, optional)
  - `status` (`draft`, `todo`, `in_progress`, `blocked`, `completed`, `archived`)
  - `priority` (`low`, `medium`, `high`, `urgent`)
  - `energy_level` (1 to 5)
  - `parent_id` (UUID, optional: for subtasks)
  - `search` (string, optional)
- **Response `200 OK`**:
```json
[
  {
    "id": "task-uuid-1",
    "workspace_id": "ws-uuid",
    "project_id": "proj-uuid",
    "goal_id": "goal-uuid",
    "milestone_id": "milestone-uuid",
    "parent_id": null,
    "recurrence_rule_id": null,
    "title": "Implement SQLite WAL initialization",
    "description": "Configure journal_mode=WAL and foreign_keys=ON.",
    "status": "in_progress",
    "priority": "high",
    "energy_level": 4,
    "estimated_minutes": 60,
    "actual_minutes": 25,
    "due_date": "2026-10-20T17:00:00Z",
    "position": 0,
    "subtask_count": 2,
    "completed_subtask_count": 1,
    "created_at": "2026-10-18T12:00:00Z",
    "updated_at": "2026-10-18T12:30:00Z"
  }
]
```

### 4.2 `POST /api/v1/tasks`
- **Request Body**:
```json
{
  "workspace_id": "ws-uuid",
  "project_id": "proj-uuid",
  "goal_id": "goal-uuid",
  "parent_id": null,
  "title": "Configure Alembic migrations",
  "description": "Set up batch alter mode for SQLite compatibility.",
  "status": "todo",
  "priority": "medium",
  "energy_level": 3,
  "estimated_minutes": 45,
  "due_date": null
}
```
- **Response `201 Created`**: Returns created Task object.

### 4.3 `PATCH /api/v1/tasks/{id}`
- **Request Body**: Updates any subset of task attributes.
- **Response `200 OK`**: Returns updated Task object; records an entry in `task_history`.

### 4.4 `GET /api/v1/tasks/{id}/history`
Fetches chronological audit trail of mutations for a task.
- **Response `200 OK`**:
```json
[
  {
    "id": "hist-uuid-1",
    "task_id": "task-uuid-1",
    "changed_field": "status",
    "old_value": "todo",
    "new_value": "in_progress",
    "timestamp": "2026-10-18T12:15:00Z"
  }
]
```

### 4.5 `POST /api/v1/tasks/{id}/recurring`
Attaches or updates a recurrence rule for a task.
- **Request Body**:
```json
{
  "frequency": "weekly",
  "interval_days": 7,
  "by_weekdays": [1, 3, 5],
  "start_date": "2026-10-19",
  "end_date": null
}
```
- **Response `200 OK`**: Returns configured recurrence rule.

---

## 5. Pillar 2: Goals and Projects Endpoints (Core Pillar)

### 5.1 `GET /api/v1/goals`
- **Query Parameters**: `workspace_id` (required), `goal_type` (`long_term`, `short_term`), `status` (`active`, `completed`)
- **Response `200 OK`**:
```json
[
  {
    "id": "goal-uuid-1",
    "workspace_id": "ws-uuid",
    "title": "Establish Sovereign Developer Workstation",
    "description": "Achieve 100% offline personal productivity stack.",
    "goal_type": "long_term",
    "target_date": "2026-12-31",
    "status": "active",
    "progress_percentage": 35,
    "color": "#A855F7",
    "icon": "shield",
    "milestones": [
      {
        "id": "ms-uuid-1",
        "title": "Milestone 0 Governance Completion",
        "target_date": "2026-10-18",
        "is_completed": true,
        "completed_at": "2026-10-18T13:00:00Z"
      }
    ],
    "linked_project_count": 2,
    "created_at": "2026-10-18T10:00:00Z"
  }
]
```

### 5.2 `POST /api/v1/goals`
- **Request Body**:
```json
{
  "workspace_id": "ws-uuid",
  "title": "Publish Offline Productivity Suite",
  "description": "Ship v1.0.0 desktop installer.",
  "goal_type": "short_term",
  "target_date": "2026-11-30",
  "color": "#EC4899",
  "icon": "rocket"
}
```
- **Response `201 Created`**: Returns created Goal object.

### 5.3 `POST /api/v1/goals/{id}/milestones`
- **Request Body**:
```json
{
  "title": "Complete Backend Data Engine & Pytest Suite",
  "target_date": "2026-10-25"
}
```
- **Response `201 Created`**: Returns created Milestone object.

### 5.4 `GET /api/v1/projects`
- **Query Parameters**: `workspace_id` (required), `goal_id` (optional), `status` (optional)
- **Response `200 OK`**:
```json
[
  {
    "id": "proj-uuid-1",
    "workspace_id": "ws-uuid",
    "goal_id": "goal-uuid-1",
    "title": "Core Desktop App Build",
    "description": "Tauri 2 shell and FastAPI sidecar implementation.",
    "color": "#6366F1",
    "status": "active",
    "target_date": "2026-11-15",
    "task_count": 14,
    "completed_task_count": 4,
    "created_at": "2026-10-18T10:00:00Z"
  }
]
```

### 5.5 `POST /api/v1/projects`
- **Request Body**:
```json
{
  "workspace_id": "ws-uuid",
  "goal_id": "goal-uuid-1",
  "title": "Core Desktop App Build",
  "description": "Tauri 2 shell and FastAPI sidecar.",
  "color": "#6366F1",
  "target_date": "2026-11-15"
}
```
- **Response `201 Created`**: Returns created Project object.

---

## 6. Pillar 3: Habits and Focus Endpoints

### 6.1 `GET /api/v1/habits`
- **Query Parameters**: `workspace_id` (required), `is_active` (bool)
- **Response `200 OK`**:
```json
[
  {
    "id": "habit-uuid-1",
    "workspace_id": "ws-uuid",
    "title": "Morning Deep Work Session",
    "description": "90 minutes uninterrupted focus before 11 AM.",
    "frequency": "weekdays",
    "target_count": 1,
    "time_of_day": "morning",
    "current_streak": 8,
    "best_streak": 14,
    "is_active": true,
    "logged_today": true
  }
]
```

### 6.2 `POST /api/v1/habits`
- **Request Body**:
```json
{
  "workspace_id": "ws-uuid",
  "title": "Evening Daily Review",
  "description": "Complete reflection and plan tomorrow.",
  "frequency": "daily",
  "target_count": 1,
  "time_of_day": "evening"
}
```
- **Response `201 Created`**: Returns created Habit object.

### 6.3 `POST /api/v1/habits/{id}/log`
- **Request Body**:
```json
{
  "log_date": "2026-10-18",
  "completed": true,
  "numeric_value": 1.0,
  "notes": "Reviewed architecture and validated Python 3.14."
}
```
- **Response `200 OK`**: Returns updated habit streak status.

### 6.4 `POST /api/v1/focus/sessions/start`
- **Request Body**:
```json
{
  "workspace_id": "ws-uuid",
  "task_id": "task-uuid-1",
  "project_id": "proj-uuid-1",
  "session_type": "pomodoro",
  "energy_before": 4
}
```
- **Response `201 Created`**: Returns active FocusSession with `started_at` timestamp.

### 6.5 `POST /api/v1/focus/sessions/{id}/complete`
- **Request Body**:
```json
{
  "duration_seconds": 1500,
  "interruption_count": 0,
  "energy_after": 4,
  "notes": "Finished API contract specifications."
}
```
- **Response `200 OK`**: Finalizes focus session; increments task `actual_minutes`.

---

## 7. Pillar 4: Insights and Reflection Endpoints

### 7.1 `GET /api/v1/insights/daily-review/{date}`
- **Query Parameters**: `workspace_id` (required)
- **Response `200 OK`**: Returns DailyReview record.

### 7.2 `POST /api/v1/insights/daily-review/{date}`
- **Request Body**:
```json
{
  "workspace_id": "ws-uuid",
  "wins": "Established all 4 pillars across schemas and contracts.",
  "challenges": "Rust toolchain installation deferred.",
  "tomorrow_priorities": "Initialize frontend and backend runtime bootstrap.",
  "mood_score": 5,
  "energy_score": 4,
  "notes": "Clean governance session."
}
```
- **Response `200 OK`**: Returns created/updated DailyReview record.

### 7.3 `GET /api/v1/insights/workload`
Planned-versus-completed workload analytics.
- **Query Parameters**: `workspace_id` (required), `range` (`today`, `7d`, `30d`)
- **Response `200 OK`**:
```json
{
  "range": "7d",
  "total_planned_minutes": 2400,
  "total_completed_minutes": 2150,
  "estimation_accuracy_ratio": 0.89,
  "tasks_completed_count": 28,
  "tasks_rolled_over_count": 3,
  "deep_work_focus_hours": 35.8
}
```

### 7.4 `GET /api/v1/insights/blockers` & `POST /api/v1/insights/blockers`
- **POST Request Body**:
```json
{
  "workspace_id": "ws-uuid",
  "task_id": "task-uuid-1",
  "title": "Awaiting design reference image asset",
  "category": "external",
  "description": "Waiting for user to place visual reference in docs/design-reference/"
}
```
- **Response `201 Created`**: Returns logged Blocker record.

---

## 8. Supporting Feature: Notes Endpoints

### 8.1 `GET /api/v1/notes`
- **Query Parameters**: `workspace_id` (required), `project_id` (optional), `goal_id` (optional), `search` (optional)
- **Response `200 OK`**: Array of Note summaries.

### 8.2 `POST /api/v1/notes`
- **Request Body**:
```json
{
  "workspace_id": "ws-uuid",
  "project_id": "proj-uuid-1",
  "goal_id": null,
  "title": "Architecture Baseline Notes",
  "content_markdown": "# Notes\nLinked to [[Core Desktop App Build]]."
}
```
- **Response `201 Created`**: Returns created Note object with parsed outgoing links.

### 8.3 `GET /api/v1/notes/{id}/backlinks`
- **Response `200 OK`**: Array of incoming reference links.

---

## 9. Optional Local AI Endpoints (Ollama Gateway)

### 9.1 `GET /api/v1/ai/status`
- **Response `200 OK`**:
```json
{
  "ollama_running": true,
  "candidate_model": "gemma2:2b",
  "model_installed": true
}
```

### 9.2 `POST /api/v1/ai/task-breakdown`
- **Request Body**: `{"task_id": "task-uuid-1", "max_subtasks": 4}`
- **Response `200 OK`**: Returns suggested subtasks; strictly read-only until user applies.

### 9.3 `POST /api/v1/ai/goal-milestones`
- **Request Body**: `{"goal_id": "goal-uuid-1"}`
- **Response `200 OK`**: Returns suggested milestone progression for user review.

### 9.4 `POST /api/v1/ai/decision`
Applies user's explicit approval or rejection of AI suggestions.
- **Request Body**:
```json
{
  "audit_log_id": "ai-audit-uuid",
  "decision": "applied",
  "applied_items": [{"title": "Configure SQLite WAL"}]
}
```
- **Response `200 OK`**: Commits items to SQLite; logs decision in `ai_audit_logs`.
