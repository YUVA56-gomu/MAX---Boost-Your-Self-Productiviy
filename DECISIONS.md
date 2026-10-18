# Architecture Decision Records (ADRs) & Decisions Log

## 1. Overview
This document records all authoritative architectural and engineering decisions for the local-first adaptive productivity desktop application.

Per project governance, every decision is explicit. **Any unresolved or intentionally deferred decision is marked with its exact status and rationale.**

---

## 2. Approved Architecture Decision Records (ADRs)

### ADR-001: Local-First Architecture with SQLite WAL Mode
- **Status**: **ACCEPTED**
- **Context**: The app must operate 100% offline without remote accounts or network dependency. Mutations must be sub-50ms.
- **Decision**: Persist all data in a local SQLite database configured with Write-Ahead Logging (`PRAGMA journal_mode=WAL`) and `PRAGMA synchronous=NORMAL`.
- **Consequences**: Instantaneous local persistence, zero cloud lock-in, reliable ACID transactions.

---

### ADR-002: Desktop Shell Selection - Tauri 2
- **Status**: **ACCEPTED**
- **Context**: Need a lightweight, secure desktop shell that integrates natively with the OS while keeping idle memory footprint < 150MB.
- **Decision**: Adopt Tauri 2 over Electron. Native Rust shell supervises child processes and hosts webview.
- **Consequences**: High performance, small binary size, WebView2 on Windows. Rust toolchain installation is deferred to Milestone 3.

---

### ADR-003: Backend Architecture - Python 3.14 FastAPI Sidecar
- **Status**: **ACCEPTED**
- **Context**: Need a rapid-development backend with declarative validation, rich relational ORM, and first-class synergy with local AI tools. Python 3.14.0 is installed on the workstation.
- **Decision**: Implement the backend using **FastAPI**, **Pydantic v2**, and **SQLAlchemy 2.0** on Python 3.14.0 using `uv`.
- **Empirical Evidence**: Verified live via `uv pip install --dry-run`: pre-built wheels resolve cleanly on Python 3.14.0 for `fastapi==0.143.3`, `pydantic==2.14.1`, `pydantic-core==2.50.1`, `sqlalchemy==2.1.5`, `alembic==1.20.0`, `uvicorn==0.54.0`, `pytest==9.1.1`, `httpx==0.28.1`, and `pyinstaller==6.22.3`.

---

### ADR-004: Frontend Stack - React 18, TypeScript, Vite, Tailwind CSS & shadcn/ui
- **Status**: **ACCEPTED**
- **Context**: The user interface demands high visual polish (Gemini-inspired dark mode), fast feedback loops, strong type safety, and rich component primitives.
- **Decision**: Use React 18+ with TypeScript (strict mode) bundled via Vite, styled using Tailwind CSS and headless components from shadcn/ui.

---

### ADR-005: Four Core Pillars Product Architecture with Supporting Notes
- **Status**: **ACCEPTED**
- **Context**: The productivity system must unify tactical execution, strategic horizons, compounding daily routines, and behavioral reflection.
- **Decision**: Establish four core pillars:
  1. **Task Management**: tasks, subtasks, priorities, deadlines, estimates, recurring tasks, and task history.
  2. **Goals and Projects**: long-term goals, short-term goals, milestones, projects, and task-to-goal relationships.
  3. **Habits and Focus**: habit tracking, focus sessions, Pomodoro timer, and scheduling.
  4. **Insights and Reflection**: daily reviews, historical analytics, blockers, planned-versus-completed workload, and progress trends.
  *Supporting Feature*: Contextual Notes & Knowledge Capture (supporting documentation linked to projects, goals, and tasks).

---

### ADR-006: Optional Local AI via Ollama & Gemma 2 2B
- **Status**: **ACCEPTED**
- **Context**: Provide intelligent productivity enhancements (task breakdown, milestone planning, reflection synthesis) without cloud data leakage.
- **Decision**: Interface with local Ollama daemon hosting Gemma 2 2B under strict human-in-the-loop review.
- **Consequences**: Zero external API calls, zero telemetry. Model verified present on local workstation. AI has zero autonomous write authority.

---

### ADR-007: Ephemeral In-Memory Token Security Model
- **Status**: **ACCEPTED**
- **Context**: Protect localhost backend from unauthorized local processes or hostile web browser tabs.
- **Decision**:
  - Tauri generates an ephemeral 32-byte cryptographic hex token on startup.
  - Injected into sidecar environment variable and frontend runtime memory.
  - **Zero Persistent Storage**: Strictly prohibited from `localStorage`, `sessionStorage`, cookies, or `IndexedDB`.
  - Backend performs constant-time validation (`secrets.compare_digest`) on every request.
  - Logging middleware automatically redacts authorization tokens and secrets.

---

### ADR-008: Testing Stack - Pytest + Vitest with Security Test Coverage
- **Status**: **ACCEPTED**
- **Context**: High-velocity automated testing across backend and frontend runtimes.
- **Decision**: Pytest for backend unit, integration, and security tests (using in-memory SQLite); Vitest with React Testing Library for frontend component tests.

---

### ADR-009: Entity Identification - UUIDv4 Strings
- **Status**: **ACCEPTED**
- **Context**: Avoid auto-increment ID collisions and support offline entity generation.
- **Decision**: Standardize on UUIDv4 strings (`CHAR(36)`) across all database primary keys.

---

### ADR-010: SQLite Migration Strategy (Alembic Batch Mode) & Test Isolation (StaticPool)
- **Status**: **ACCEPTED**
- **Context**: SQLite has structural limitations with certain `ALTER TABLE` statements (e.g. constraint changes require table copy-rebuild), and default in-memory SQLite connections (`sqlite:///:memory:`) create isolated databases per connection unless pinned to a single connection pool.
- **Decision**: Configure Alembic with `render_as_batch=True` in `backend/alembic/env.py` to enable declarative batch table migrations. Configure backend test fixtures using SQLAlchemy `StaticPool` (`connect_args={"check_same_thread": False}, poolclass=StaticPool`) to guarantee consistent, thread-safe in-memory database isolation across FastAPI `TestClient` calls.
- **Consequences**: Safe migrations on SQLite without external tooling; deterministic, sub-second test execution across all 32 backend tests.

---

## 3. Catalog of Deferred & Open Decisions

### [OPEN-001]: Rust Toolchain Setup for Tauri 2 Development
- **Status**: **RESOLVED / ACCEPTED (2026-10-18)**
- **Audit Findings**:
  - `rustup 1.29.1` installed with `rustc 1.99.1 (58cf8f9c3 2026-10-13)` and `cargo 1.99.1 (5f94df478 2026-08-27)`.
  - Toolchain: `stable-x86_64-pc-windows-gnu` linked with WinLibs MinGW-w64 (GCC 16.2.0, Binutils 2.47 UCRT x86_64).
  - Resolved legacy 32-bit `C:\MinGW\bin\dlltool.exe` collision by prioritizing 64-bit WinLibs binutils ahead of legacy paths in user environment.
  - Successfully compiled Tauri 2 native desktop binary (`src-tauri/target/debug/app.exe`) with exit code 0.
- **Decision**: Standardize on `stable-x86_64-pc-windows-gnu` with WinLibs MinGW-w64 for Windows desktop development.

---

### [OPEN-002]: Sidecar Distribution Packaging Strategy
- **Status**: **INVESTIGATED / DEFERRED TO MILESTONE 7**
- **Context**: Packaging the FastAPI Python sidecar for distribution to end users who do not have Python 3.14 installed.
- **Investigation & Findings**:
  - **Option A (PyInstaller)**: Standalone binary `fastapi-backend.exe` generated via PyInstaller 6.22.3 (verified compatible with Python 3.14). Configured as Tauri external sidecar (`"bundle": { "externalBin": ["binaries/fastapi-backend"] }`).
  - **Option B (Embedded Python)**: Bundling `python-3.14.0-embed-amd64.zip` into Tauri `resources/`, launching via internal path.
  - **Milestone 3 Implementation**: Desktop shell supervisor uses `backend/.venv/Scripts/python.exe` dynamically with full health probing, ephemeral production token passing, and orphan process cleanup.
  - **Truthful Status**: No production installer is claimed as ready until complete end-to-end bundling and installer testing is executed in Milestone 7.

---

### [OPEN-003]: Rich Markdown Editor Component Selection
- **Status**: **DEFERRED TO MILESTONE 4**
- **Context**: Evaluate TipTap (ProseMirror) vs. CodeMirror 6 for supporting notes and wikilinks during UI implementation.

---

### ADR-011: Local Vector Branding & Geometric Glass Artwork Architecture
- **Status**: **ACCEPTED (2026-10-18)**
- **Context**: The desktop application requires a distinctive, premium brand mark and ambient artwork matching the approved Gemini-dark visual reference (`dashboard-reference.png`). Remote assets, random emoji, and bulky base64 data URIs are strictly prohibited.
- **Decision**: Implement the visual branding using lightweight, local SVG vector assets and reusable React components:
  1. `MaxLogo` (`frontend/src/components/brand/MaxLogo.tsx` & `frontend/src/assets/brand/max-logo.svg`): 4-petal geometric clover with a transparent central aperture mask and four calibrated gradient lobes (cyan, royal blue, amber/emerald, coral red/orange).
  2. `HeroArtwork` (`frontend/src/components/brand/HeroArtwork.tsx` & `frontend/src/assets/brand/hero-artwork.svg`): Translucent overlapping glass sheets with specular highlight rims and deep ambient radial glows.
  3. `PromoArtwork` (`frontend/src/components/brand/PromoArtwork.tsx` & `frontend/src/assets/brand/promo-artwork.svg`): Coordinated corner artwork for the sidebar "Want to level up?" AI promotional card.
- **Consequences**: Zero network runtime dependencies, 100% offline compliance, crisp resolution-independent rendering at all DPI levels, and sub-millisecond render times.

---

### [OPEN-004]: Visual Design Reference Asset Placement
- **Status**: **RESOLVED / ACCEPTED (2026-10-18)**
- **Audit Findings**:
  - `docs/design-reference/dashboard-reference.png` (1,020,340 bytes) verified present on disk as the primary visual source of truth for dashboard layout, tokens, stat strip, task list, focus timer, and weekly activity.
  - `docs/design-reference/geometric-artwork-reference.png` (131,379 bytes) verified present on disk as the visual reference for the geometric clover logo, translucent glass ribbons, and isometric blocks.
- **Decision**: Visual branding pass executed against these verified reference assets. Both files registered in [`docs/design-reference/README.md`](file:///d:/SelfProductivityApp/docs/design-reference/README.md) and [`UI.md`](file:///d:/SelfProductivityApp/UI.md).

---

### [OPEN-005]: Cross-Device Synchronization
- **Status**: **DEFERRED (POST-MVP)**
- **Context**: Multi-device sync is explicitly excluded from the MVP to preserve simplicity, speed, and privacy sovereignty.
