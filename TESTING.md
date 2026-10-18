# Testing Strategy & Quality Assurance Specification

## 1. Governance & Strict Anti-Untested Rule

> [!CAUTION]
> **Anti-Untested Engineering Rule**:
> No agent or engineer may claim that code, build commands, test suites, or package scripts "work" without actively executing and verifying them in the environment.
> Every milestone delivery must be substantiated with verifiable terminal output from running tests.

---

## 2. Testing Stack Baseline

| Tier | Framework | Scope | Environment |
| :--- | :--- | :--- | :--- |
| **Backend Unit & API** | **Pytest** (v9.1+) | FastAPI routes, Pydantic schemas, SQLAlchemy models, Security middleware | In-memory SQLite (`sqlite:///:memory:`) on Python 3.14 |
| **Frontend Unit & UI** | **Vitest** (v3+) + **React Testing Library** | React components, custom hooks, Zustand stores | `jsdom` simulated browser environment |
| **Security & Contract** | **Pytest** + **FastAPI TestClient** | Loopback binding, in-memory token validation, log redaction | TestClient with custom security fixtures |

---

## 3. Backend Test Suite Specification (Pytest)

### 3.1 Directory Structure
```text
backend/tests/
├── conftest.py               # Shared test fixtures (in-memory DB, ephemeral auth tokens, client)
├── security/
│   ├── test_auth_middleware.py # 401 on missing/invalid token, constant-time validation
│   ├── test_loopback_binding.py# Loopback and host header verification
│   └── test_log_redaction.py   # Verify tokens/secrets never appear in logs
├── unit/
│   ├── test_task_models.py     # Subtask trees, recurrence calculation, task history
│   ├── test_goal_models.py     # Goals, milestones, project roll-up calculations
│   ├── test_habit_models.py    # Habit streak logic, execution logging
│   └── test_insight_models.py  # Planned vs completed workload rollups, blocker tracking
└── api/
    ├── test_health.py          # /api/v1/health probe
    ├── test_tasks_api.py       # Tasks CRUD, reorder, history, recurrence
    ├── test_goals_api.py       # Goals & Milestones CRUD, project linking
    ├── test_projects_api.py    # Projects CRUD and task association
    ├── test_habits_api.py      # Habits CRUD, daily logging, streak API
    ├── test_focus_api.py       # Focus sessions start/complete, energy ratings
    ├── test_insights_api.py    # Daily review, workload stats, blockers
    └── test_notes_api.py       # Supporting notes, wikilinks, backlinks
```

### 3.2 Security Tests Contract
1. **Unauthenticated Request Test**: Every endpoint (except `/api/v1/health`) must return HTTP `401 Unauthorized` when `Authorization` header is omitted.
2. **Invalid Token Test**: Passing an invalid or truncated token returns HTTP `401 Unauthorized`.
3. **Constant-Time Comparison**: Verification that `secrets.compare_digest` is used to guard against timing side-channel attacks.
4. **Log Redaction Test**: Inspect in-memory log buffer during unauthenticated/authenticated requests to ensure the raw token string is sanitized to `[REDACTED]`.
5. **No Persistent Storage Test**: Frontend unit tests assert that session tokens are never written to `window.localStorage`, `window.sessionStorage`, or cookies.

---

## 4. Frontend Test Suite Specification (Vitest)

### 4.1 Scope & Hierarchy
```text
frontend/src/
├── test/
│   ├── setup.ts              # Global test setup (matchers, jsdom polyfills)
│   └── mockData.ts           # Mock tasks, goals, projects, habits, reviews
├── components/
│   ├── tasks/
│   │   ├── KanbanBoard.test.tsx
│   │   └── TaskCard.test.tsx
│   ├── goals/
│   │   ├── GoalCard.test.tsx
│   │   └── MilestoneList.test.tsx
│   ├── habits/
│   │   ├── HabitMatrix.test.tsx
│   │   └── FocusTimerHUD.test.tsx
│   └── insights/
│       ├── WorkloadChart.test.tsx
│       └── DailyReviewModal.test.tsx
└── hooks/
    ├── useTasks.test.ts
    ├── useHabits.test.ts
    └── useFocusTimer.test.ts
```

---

## 5. Test Execution Commands

### Backend Test Execution
```powershell
# Run backend test suite on Python 3.14
python -m pytest backend/tests -v

# Run with coverage report across all 4 pillars
python -m pytest backend/tests --cov=backend/app --cov-report=term-missing
```

### Frontend Test Execution
```powershell
# Run Vitest suite in single-run mode
pnpm vitest run

# Run with coverage
pnpm vitest run --coverage
```

---

## 6. Milestone Acceptance Gateways

Every milestone submission must satisfy:
1. **Zero regressions**: 100% passing tests in Pytest and Vitest.
2. **Coverage thresholds**: >= 85% branch coverage on backend endpoints, >= 80% coverage on core UI components.
3. **Security validation**: All security tests in `backend/tests/security/` pass with zero failures.
