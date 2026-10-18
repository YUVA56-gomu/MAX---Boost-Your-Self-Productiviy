# Implementation Plan & Milestone Roadmap

## 1. Governance & Execution Protocol

Development progresses strictly through sequential, gated milestones governed by **[`AGENTS.md`](file:///d:/SelfProductivityApp/AGENTS.md)** and tracked via **[`PROJECT_STATUS.md`](file:///d:/SelfProductivityApp/PROJECT_STATUS.md)**:
1. **Sequential Execution**: Milestones must be executed in order. No milestone may start until the preceding milestone is approved.
2. **Explicit Statuses**: Every milestone and task carries one of `NOT_STARTED`, `IN_PROGRESS`, `BLOCKED`, `IN_REVIEW`, or `COMPLETED`.
3. **No Premature Feature Code**: No feature code or unnecessary dependencies for a future milestone may be introduced.
4. **Deferred Decisions**: Rust toolchain installation is deferred to Milestone 3; production packaging is deferred to Milestone 3/7; cross-device sync is deferred to post-MVP.
5. **Gatekeeper Sign-Off**: A milestone in `IN_REVIEW` cannot be marked `COMPLETED` without explicit human sign-off.

---

## 2. Milestone Roadmap & Detailed Tracking

```mermaid
gantt
    title Adaptive Productivity App - Four Pillars Roadmap
    dateFormat  X
    axisFormat  M%s
    
    section Foundation & Engine
    M0: Governance, 4 Pillars & Tracking (IN_REVIEW) :active, m0, 0, 1
    M1: Repository Foundation & Dual Bootstrap       :m1, after m0, 1
    M2: Core Data Engine & 4 Pillars Backend         :m2, after m1, 2
    
    section Shell & Canvas
    M3: Tauri 2 Desktop Shell Integration           :m3, after m2, 3
    M4: Gemini-Dark UI: Tasks & Goals Canvas         :m4, after m3, 4
    
    section Behavioral & Intelligence
    M5: Habits, Focus & Insights Dashboard           :m5, after m4, 5
    M6: Optional Local AI (Ollama / Gemma 2 2B)      :m6, after m5, 6
    
    section Release
    M7: Hardening, Packaging & Installer            :m7, after m6, 7
```

---

### Milestone 0: Establish Project Governance & Prepare Repository
- **Status**: **`COMPLETED`**
- **Review & Approval Status**: **Explicitly Approved by User on 2026-10-18**
- **Objective & Scope**: Establish authoritative architecture, data model, API contracts, design system, UI reference management, tracking system, and runtime compatibility verification for the four core pillars without implementing application code.
- **Prerequisites**: Access to project workspace and local development tools.
- **Ordered Implementation Tasks**:
  - [x] **Task 0.1**: Inspect workstation environment (Node.js, npm, pnpm, Python 3.14, pip, uv, Git, SQLite3, Ollama). Empirically verify Python 3.14 dependency compatibility with `uv`. Flag missing Rust toolchain as `[OPEN-001]`.
  - [x] **Task 0.2**: Author the authoritative governance documents (`AGENTS.md`, `PROJECT_SPEC.md`, `ARCHITECTURE.md`, `DATA_MODEL.md`, `API_CONTRACTS.md`, `DESIGN_SYSTEM.md`, `AI_POLICY.md`, `TESTING.md`, `IMPLEMENTATION_PLAN.md`, `DECISIONS.md`, `README.md`). Align with the Four Core Pillars and the security threat model.
  - [x] **Task 0.3**: Establish UI reference framework in `docs/design-reference/` and author [`UI.md`](file:///d:/SelfProductivityApp/UI.md) detailing 3-column shell layout and all 14 product screen specifications. Mandate UI reference inspection in `AGENTS.md`. Maintain `[OPEN-004]` as open pending image placement.
  - [x] **Task 0.4**: Implement mandatory phase tracking system: author [`PROJECT_STATUS.md`](file:///d:/SelfProductivityApp/PROJECT_STATUS.md) dashboard, [`TASK_LOG.md`](file:///d:/SelfProductivityApp/TASK_LOG.md) chronological ledger, and codify session recovery & gatekeeping rules in [`AGENTS.md`](file:///d:/SelfProductivityApp/AGENTS.md).
- **Acceptance Criteria**:
  - [x] All authoritative documents authored, mutually consistent, and cross-linked.
  - [x] Zero application feature code or unapproved dependencies installed.
  - [x] Security model (in-memory token, loopback binding, constant-time validation, log redaction) formalized.
  - [x] Python 3.14 compatibility verified with pre-built wheel resolutions.
  - [x] Tracking system operational with explicit statuses and recovery rules.
- **Required Verification Commands**:
  - `uv pip install --dry-run --system fastapi uvicorn pydantic sqlalchemy alembic pytest httpx` (Pass)
  - `Get-ChildItem -Path "d:\SelfProductivityApp" -Recurse` (Pass)
- **Dependencies & Blockers**:
  - `[OPEN-001]`: Rust toolchain deferred to Milestone 3.
  - `[OPEN-004]`: Manual placement of `dashboard-reference.png` pending by user.
- **Completion Evidence**: All 14 authoritative documents present in repository; terminal logs recorded in `TASK_LOG.md`. User explicit approval recorded on 2026-10-18.

---

### Milestone 1: Repository Foundation & Dual-Runtime Bootstrap
- **Status**: **`IN_PROGRESS`**
- **Review & Approval Status**: In Progress (Milestone 0 approved to unlock)
- **Objective & Scope**: Establish project directory structure, initialize Git version control, scaffold Vite + React frontend and Python 3.14 FastAPI backend with `uv`, and configure browser-mode development runner with in-memory token harness.
- **Prerequisites**: Approval of Milestone 0 (Satisfied on 2026-10-18).
- **Ordered Implementation Tasks**:
  - [ ] **Task 1.1**: Initialize Git repository (`git init`) and configure root `.gitignore` (ignoring node_modules, `.venv`, SQLite `.db`, cache files, and build artifacts).
  - [ ] **Task 1.2**: Scaffold frontend in `frontend/` using Vite with React 18, TypeScript (`"strict": true`), Tailwind CSS, and Gemini-dark tokens from `DESIGN_SYSTEM.md`. Verify build via `pnpm build`.
  - [ ] **Task 1.3**: Scaffold backend in `backend/` using Python 3.14 with `uv venv`, `pyproject.toml`, FastAPI, Pydantic v2 schemas, and health probe endpoint (`GET /api/v1/health`).
  - [ ] **Task 1.4**: Configure local dual-runtime runner script (`pnpm dev` or PowerShell runner) to launch both frontend and backend concurrently in browser development mode (`http://localhost:5173` + `http://127.0.0.1:24125`).
  - [ ] **Task 1.5**: Implement ephemeral in-memory session token harness for development communication.
  - [ ] **Task 1.6**: Author Milestone 1 completion verification report.
- **Acceptance Criteria**:
  - Frontend builds cleanly without TypeScript or CSS errors (`pnpm build`).
  - Backend launches and returns HTTP 200 on `GET /api/v1/health`.
  - Browser dev mode allows frontend to communicate with localhost backend using in-memory bearer token.
  - Zero persistent browser storage of session tokens.
- **Required Verification Commands**:
  - `pnpm --dir frontend build`
  - `curl -I http://127.0.0.1:24125/api/v1/health`
- **Dependencies & Blockers**: None (browser dev mode avoids Rust requirement).
- **Completion Evidence**: Verifiable terminal execution logs of build and healthcheck response recorded in `TASK_LOG.md`.

---

### Milestone 2: Core Data Engine & Backend Services (Four Pillars)
- **Status**: **`NOT_STARTED`**
- **Review & Approval Status**: Pending
- **Objective & Scope**: Implement complete relational persistence layer in SQLite (WAL mode) and REST APIs in FastAPI across all four core pillars + supporting notes, secured by constant-time token comparison and log redaction.
- **Prerequisites**: Milestone 1 approved.
- **Ordered Implementation Tasks**:
  - [ ] **Task 2.1**: Configure SQLite database connection manager with WAL mode (`PRAGMA journal_mode=WAL`), foreign keys (`PRAGMA foreign_keys=ON`), and busy timeout.
  - [ ] **Task 2.2**: Implement SQLAlchemy 2.0 mapped models for all entities:
    - Pillar 1: `tasks`, `task_recurrence_rules`, `task_history`, `tags`, `task_tags`.
    - Pillar 2: `goals`, `goal_milestones`, `projects`.
    - Pillar 3: `habits`, `habit_logs`, `focus_sessions`.
    - Pillar 4: `daily_reviews`, `blockers`, `daily_metrics`.
    - Supporting: `notes`, `note_links`, and `ai_audit_logs`.
  - [ ] **Task 2.3**: Configure Alembic migrations (`render_as_batch=True`) and generate baseline migration script.
  - [ ] **Task 2.4**: Implement security middleware: constant-time token comparison (`secrets.compare_digest`), 401 rejection for unauthenticated requests, and log redaction.
  - [ ] **Task 2.5**: Implement CRUD endpoint routers matching `API_CONTRACTS.md` for all 4 pillars and supporting notes.
  - [ ] **Task 2.6**: Build Pytest test suite with in-memory SQLite fixtures and security test cases.
  - [ ] **Task 2.7**: Author Milestone 2 completion report.
- **Acceptance Criteria**:
  - `alembic upgrade head` applies cleanly.
  - Pytest test suite achieves >= 85% coverage across routes and models.
  - Security tests verify unauthenticated requests are rejected with 401 and tokens are redacted from logs.
- **Required Verification Commands**:
  - `python -m pytest backend/tests -v --cov=backend/app`
- **Dependencies & Blockers**: Python 3.14 venv from Milestone 1.
- **Completion Evidence**: Verifiable Pytest test execution logs recorded in `TASK_LOG.md`.

---

### Milestone 3: Desktop Shell Integration (Tauri 2)
- **Status**: **`NOT_STARTED`**
- **Review & Approval Status**: Pending
- **Objective & Scope**: Integrate native desktop shell via Tauri 2, configure Rust toolchain on workstation, implement automated sidecar supervisor lifecycle, and manage in-memory token delivery.
- **Prerequisites**: Milestone 2 approved; Rust toolchain installed.
- **Ordered Implementation Tasks**:
  - [ ] **Task 3.1**: Verify/install Rust toolchain (`rustup`) and MSVC C++ Build Tools on host workstation (resolving `[OPEN-001]`).
  - [ ] **Task 3.2**: Initialize and configure Tauri 2 in `src-tauri/`.
  - [ ] **Task 3.3**: Implement sidecar supervisor: generate 32-byte ephemeral hex token, allocate loopback port, spawn Python sidecar, and monitor `/api/v1/health`.
  - [ ] **Task 3.4**: Inject session token into webview memory via secure Tauri IPC command (strictly zero persistent storage).
  - [ ] **Task 3.5**: Handle window close events with graceful sidecar shutdown signal (`POST /api/v1/system/shutdown`).
  - [ ] **Task 3.6**: Configure custom dark window titlebar, window controls, and system tray.
  - [ ] **Task 3.7**: Author Milestone 3 completion report.
- **Acceptance Criteria**:
  - Native Tauri window compiles and renders the React application.
  - Python sidecar process cleanly launches with Tauri and shuts down when window is closed (zero orphan processes).
  - Healthcheck probe verifies backend readiness before webview display.
- **Required Verification Commands**:
  - `pnpm tauri dev`
- **Dependencies & Blockers**: Requires resolving `[OPEN-001]` (installing Rust toolchain).
- **Completion Evidence**: Running desktop application verified; process termination verified in task manager.

---

### Milestone 4: Gemini-Dark UI - Execution & Goals Canvas
- **Status**: **`NOT_STARTED`**
- **Review & Approval Status**: Pending
- **Objective & Scope**: Build the user interface for Dashboard/Home, Tasks & Subtasks, Task Details modal, Goals & Milestones, Projects, Workspaces, and supporting Notes following `UI.md` and `DESIGN_SYSTEM.md`.
- **Prerequisites**: Milestone 3 approved; `dashboard-reference.png` placed in `docs/design-reference/`.
- **Ordered Implementation Tasks**:
  - [ ] **Task 4.1**: Build app shell layout: 240px collapsible left sidebar, top header bar with search input (`Ctrl+K`), and 340px right contextual drawer.
  - [ ] **Task 4.2**: Implement Dashboard/Home (Screen 1): greeting hero banner, 4 quick stat cards, Today's Tasks widget, Focus Timer widget, and weekly activity bar chart.
  - [ ] **Task 4.3**: Implement Tasks & Subtasks Canvas (Screen 2): Kanban board with drag-and-drop, list view, subtask trees, priority pills, and cognitive energy badges.
  - [ ] **Task 4.4**: Implement Task Details & Creation Modal (Screen 3): markdown editor, metadata selectors, recurrence configuration, and `task_history` audit drawer.
  - [ ] **Task 4.5**: Implement Goals Canvas (Screen 4 & 5): Long-Term/Short-Term horizon cards, milestone timeline, linked tasks table, and automated progress roll-up.
  - [ ] **Task 4.6**: Implement Projects Canvas (Screen 6) and Workspace Overview (Screen 7).
  - [ ] **Task 4.7**: Implement Supporting Notes Editor: markdown editor with wikilink autocompletion (`[[Note]]`).
  - [ ] **Task 4.8**: Build Vitest test suite covering core components.
  - [ ] **Task 4.9**: Author Milestone 4 completion report.
- **Acceptance Criteria**:
  - UI visual identity strictly matches `dashboard-reference.png`.
  - Vitest test suite achieves >= 80% component coverage.
  - Full keyboard navigability across all views.
- **Required Verification Commands**:
  - `pnpm vitest run --coverage`
- **Dependencies & Blockers**: Requires `dashboard-reference.png` placed in `docs/design-reference/`.
- **Completion Evidence**: Vitest test execution output and visual component verification recorded in `TASK_LOG.md`.

---

### Milestone 5: Habits, Focus Engine & Insights Dashboard
- **Status**: **`NOT_STARTED`**
- **Review & Approval Status**: Pending
- **Objective & Scope**: Implement Habit Tracking matrix, full Focus Timer HUD with pre/post energy level sliders, Calendar timeboxing, Planned vs Completed workload analytics, Blocker tracking, and Evening Daily Review modal.
- **Prerequisites**: Milestone 4 approved.
- **Ordered Implementation Tasks**:
  - [ ] **Task 5.1**: Implement Habits View (Screen 8): weekly checkoff matrix grid, streak calculation badges, and time-of-day filtering.
  - [ ] **Task 5.2**: Implement Focus Timer HUD (Screen 9): circular SVG progress ring with glowing neon cyan/purple stroke, Pomodoro/stopwatch modes, interruption counter, and pre/post energy rating modal (1-5).
  - [ ] **Task 5.3**: Implement Calendar & Schedule (Screen 10): hourly time grid (6 AM–11 PM) with unscheduled task tray for drag-and-drop timeboxing.
  - [ ] **Task 5.4**: Implement Insights & Analytics Dashboard (Screen 11): planned vs actual workload split chart, estimation accuracy ratio, and Blocker Tracker.
  - [ ] **Task 5.5**: Implement Daily Review Flow: guided evening reflection modal (wins, challenges, tomorrow's commitments, mood/energy scores).
  - [ ] **Task 5.6**: Implement Settings & Local Backup (Screen 12): one-click SQLite snapshot backup and full JSON export.
  - [ ] **Task 5.7**: Author Milestone 5 completion report.
- **Acceptance Criteria**:
  - Focus session intervals accurately log duration and update task actual minutes.
  - Daily metrics accurately compute workload ratios and streak counts.
  - Daily review entries persist in `daily_reviews`.
- **Required Verification Commands**:
  - `pnpm vitest run`
  - `python -m pytest backend/tests`
- **Dependencies & Blockers**: None.
- **Completion Evidence**: Test execution reports and metric persistence verification recorded in `TASK_LOG.md`.

---

### Milestone 6: Optional Local AI (Ollama + Gemma 2 2B)
- **Status**: **`NOT_STARTED`**
- **Review & Approval Status**: Pending
- **Objective & Scope**: Integrate optional local LLM capabilities via Ollama daemon (`gemma2:2b`), implementing task deconstruction, goal milestones suggestions, reflection synthesis, "Review & Apply" UI flow, and mandatory audit logging.
- **Prerequisites**: Milestone 5 approved; local Ollama service active.
- **Ordered Implementation Tasks**:
  - [ ] **Task 6.1**: Implement backend Ollama client gateway (`http://127.0.0.1:11434`) with candidate model `gemma2:2b`.
  - [ ] **Task 6.2**: Implement read-and-suggest endpoints (`/task-breakdown`, `/goal-milestones`, `/reflection-synthesis`).
  - [ ] **Task 6.3**: Implement "Review & Apply" UI modal with itemized checkable suggestions and diff previews.
  - [ ] **Task 6.4**: Implement persistent audit logging in `ai_audit_logs`.
  - [ ] **Task 6.5**: Implement Sidebar Promo Card (Screen 13) with permanent dismiss option (`[OPEN-006]`).
  - [ ] **Task 6.6**: Implement Local AI Setup Wizard (Screen 14): hardware detection, live connection probe, download instructions, and troubleshooting.
  - [ ] **Task 6.7**: Author Milestone 6 completion report.
- **Acceptance Criteria**:
  - Core application remains 100% operational when Ollama is offline.
  - Zero database mutations occur without explicit user "Apply Selected" click.
  - All prompts and outputs recorded in `ai_audit_logs`.
- **Required Verification Commands**:
  - `python -m pytest backend/tests/unit/test_ai_sanitizer.py`
  - Connection probe verified against live Ollama daemon.
- **Dependencies & Blockers**: Ollama v0.40+ installed (already verified on host).
- **Completion Evidence**: Live AI suggestion and audit log entry verification recorded in `TASK_LOG.md`.

---

### Milestone 7: Hardening, Packaging & Release Readiness
- **Status**: **`NOT_STARTED`**
- **Review & Approval Status**: Pending
- **Objective & Scope**: End-to-end regression validation, production sidecar packaging (PyInstaller vs embedded Python), standalone Windows desktop installer (MSI/NSIS) generation, zero-leak security audit, and final release verification.
- **Prerequisites**: Milestone 6 approved.
- **Ordered Implementation Tasks**:
  - [ ] **Task 7.1**: Resolve `[OPEN-002]` by benchmarking PyInstaller standalone executable vs embedded Python runtime.
  - [ ] **Task 7.2**: Configure Tauri production bundle configuration (`tauri.conf.json`) with sidecar executable inclusion.
  - [ ] **Task 7.3**: Execute full end-to-end test suite across backend (Pytest) and frontend (Vitest).
  - [ ] **Task 7.4**: Perform security audit: verify zero persistent token storage, zero telemetry, and complete log redaction.
  - [ ] **Task 7.5**: Build standalone Windows installer package (`.msi` or `.exe`).
  - [ ] **Task 7.6**: Test clean installation and offline execution on target machine without developer runtimes.
  - [ ] **Task 7.7**: Author final project release report.
- **Acceptance Criteria**:
  - Standalone installer installs and launches cleanly without pre-installed Node or Python.
  - Application operates 100% offline with full data persistence.
  - Clean process termination with zero orphaned background processes.
- **Required Verification Commands**:
  - `pnpm tauri build`
- **Dependencies & Blockers**: Resolution of `[OPEN-002]`.
- **Completion Evidence**: Built installer verified and documented in `TASK_LOG.md`.
