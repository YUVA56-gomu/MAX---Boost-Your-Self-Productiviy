# Adaptive Productivity Desktop Application

A sovereign, local-first adaptive productivity desktop application built for deep work, goal achievement, habit compounding, and behavioral reflection.

---

## 1. Overview & Core Philosophy

This application is designed to unify personal productivity without sacrificing privacy, autonomy, or performance:
- **100% Offline & Sovereign**: All tasks, goals, habits, focus intervals, and insights reside on the local machine in a high-performance SQLite database. No mandatory cloud accounts, no subscriptions, and zero external network calls.
- **The Four Core Pillars**:
  1. **Task Management**: tasks, subtasks, priorities, deadlines, estimates, recurring tasks, and task history.
  2. **Goals and Projects**: long-term goals, short-term goals, milestones, projects, and task-to-goal relationships.
  3. **Habits and Focus**: habit tracking, focus sessions, Pomodoro timer, and scheduling.
  4. **Insights and Reflection**: daily reviews, historical analytics, blockers, planned-versus-completed workload, and progress trends.
  *Supporting Feature*: **Contextual Notes & Knowledge Capture** (documentation attached directly to projects, goals, and tasks).
- **Optional Local AI Upgrade**: Powered strictly by a local **Ollama** daemon hosting **Gemma 2 2B**. All AI actions operate in read-only suggestion mode with mandatory human-in-the-loop review and local audit logging.
- **Gemini Dark Elegance**: Modern, high-density user interface built on obsidian foundations with frosted glassmorphism, refined gradients, and colorful geometric accents.

---

## 2. Architecture Baseline

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Desktop Shell** | **Tauri 2** (Rust) | Native window management, system tray, and sidecar process supervisor |
| **Frontend** | **React 18+**, **TypeScript**, **Vite** | High-performance SPA with strict typing and instant HMR |
| **Styling & UI** | **Tailwind CSS**, **shadcn/ui** | Design system implementation with obsidian dark tokens |
| **Backend Engine**| **Python 3.14**, **FastAPI**, **Pydantic v2** | High-throughput local REST API; verified compatible with pre-built wheels via `uv` |
| **Persistence** | **SQLite 3**, **SQLAlchemy 2.0**, **Alembic** | ACID relational storage in WAL mode with versioned migrations |
| **Security** | **Ephemeral In-Memory Token** | 32-byte token, loopback binding, constant-time validation, zero persistent storage |
| **Optional AI** | **Ollama**, **Gemma 2 2B** | Offline local LLM inference under strict user consent |
| **Testing** | **Pytest**, **Vitest** | Comprehensive backend, security, and frontend automated testing |

---

## 3. Authoritative Project Documentation

All engineering decisions and implementation standards are strictly governed by the authoritative documents:

| Document | Purpose |
| :--- | :--- |
| [AGENTS.md](file:///d:/SelfProductivityApp/AGENTS.md) | Agent governance, milestone rules, security rules, and engineering constraints |
| [PROJECT_SPEC.md](file:///d:/SelfProductivityApp/PROJECT_SPEC.md) | Comprehensive functional specification for the 4 core pillars and workspace tiers |
| [ARCHITECTURE.md](file:///d:/SelfProductivityApp/ARCHITECTURE.md) | System multi-process model, threat model, in-memory token lifecycle, and IPC protocols |
| [DATA_MODEL.md](file:///d:/SelfProductivityApp/DATA_MODEL.md) | Relational schema, entity relationships (Mermaid), and Alembic conventions |
| [API_CONTRACTS.md](file:///d:/SelfProductivityApp/API_CONTRACTS.md) | Complete OpenAPI/REST specification and payload definitions for all 4 pillars |
| [DESIGN_SYSTEM.md](file:///d:/SelfProductivityApp/DESIGN_SYSTEM.md) | Gemini-dark visual tokens, typography scale, and UI components across the 4 pillars |
| [UI.md](file:///d:/SelfProductivityApp/UI.md) | Authoritative UI reference index, shell layout specifications, and 14-screen inventory |
| [AI_POLICY.md](file:///d:/SelfProductivityApp/AI_POLICY.md) | Local AI sovereignty, human-in-the-loop review, and audit logging |
| [TESTING.md](file:///d:/SelfProductivityApp/TESTING.md) | Testing pyramid: Pytest, Vitest, dedicated security test suite, and coverage gates |
| [IMPLEMENTATION_PLAN.md](file:///d:/SelfProductivityApp/IMPLEMENTATION_PLAN.md)| Milestone execution plan, 4 pillars roadmap, and acceptance checklists |
| [PROJECT_STATUS.md](file:///d:/SelfProductivityApp/PROJECT_STATUS.md) | Real-time project execution dashboard, milestone statuses, and blockers |
| [TASK_LOG.md](file:///d:/SelfProductivityApp/TASK_LOG.md) | Chronological session implementation ledger, terminal results, and decisions |
| [DECISIONS.md](file:///d:/SelfProductivityApp/DECISIONS.md) | Architecture Decision Records (ADRs 001–009) and catalog of deferred/open decisions |
| [docs/README.md](file:///d:/SelfProductivityApp/docs/README.md) | Documentation index and visual asset directory tracker |

---

## 4. Current Workstation Environment Status

Inspected during **Milestone 0**:
- **Node.js**: `v24.16.0` (Installed)
- **npm**: `12.0.2` (Installed)
- **pnpm**: `11.1.1` (Installed)
- **Python**: `3.14.0` 64-bit (Installed; verified compatible with FastAPI/SQLAlchemy stack via `uv`)
- **pip**: `26.0.1` (Installed)
- **uv**: `0.12.15` (Installed)
- **Git**: `2.49.0.windows.1` (Installed)
- **SQLite3**: `3.44.4` (Installed)
- **Ollama**: `0.40.6` (Installed; model `gemma2:2b` verified present)
- **Rust (`rustc`/`cargo`)**: **Not in PATH** (Installation deferred to Milestone 3)

---

## 5. Implementation Roadmap Status

- [x] **Milestone 0: Project Governance & Workspace Preparation** (Approved & Aligned)
- [ ] **Milestone 1: Repository Foundation & Dual-Runtime Bootstrap** (Next)
- [ ] **Milestone 2: Core Data Engine & Backend Services (Four Pillars)**
- [ ] **Milestone 3: Desktop Shell Integration (Tauri 2)**
- [ ] **Milestone 4: Gemini-Dark UI - Execution & Goals Canvas**
- [ ] **Milestone 5: Habits, Focus Engine & Insights Dashboard**
- [ ] **Milestone 6: Optional Local AI (Ollama + Gemma 2 2B)**
- [ ] **Milestone 7: Hardening, Packaging & Release Readiness**
