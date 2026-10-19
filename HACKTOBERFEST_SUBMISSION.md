---
title: "MAX: The Sovereign, Local-First Productivity App Powered by On-Device Gemma 2 2B"
published: false
description: "A 100% offline personal productivity desktop app integrating tasks, goals, habits, focus, and insights with a private local Gemma 2 2B AI Coach."
tags: "hacktoberfest, productivity, ai, opensource"
cover_image: "https://raw.githubusercontent.com/YUVA56-gomu/MAX---Boost-Your-Self-Productiviy/main/docs/screenshots/01_home_dashboard.png"
canonical_url: "https://github.com/YUVA56-gomu/MAX---Boost-Your-Self-Productiviy"
---

*This is a submission for the [DEV Hacktoberfest 2026 Challenge — Week 2: Side Hustle](https://dev.to/challenges/hacktoberfest-week2-2026-10-12).*

---

## What I Built

Most personal productivity stacks are fractured: one subscription for daily tasks, another app for habit streaks, a browser tab with a Pomodoro timer, a spreadsheet for strategic goals, and cloud-hosted AI extensions that harvest sensitive personal schedules.

I built **MAX** — a sovereign, local-first adaptive productivity desktop application designed specifically for independent makers, students, and professionals running ambitious side hustles.

MAX unifies personal execution under **Four Core Pillars** plus an **On-Device AI Coach**:

1. **Task Management**: Interactive 3-column Kanban board with HTML5 drag-and-drop, sortable list view, expandable subtask accordions, cognitive energy tags (⚡ 1 Low Focus to 5 Deep Work), custom recurrence rules (daily, weekdays, weekly intervals), and an itemized audit history timeline.
2. **Goals and Projects**: High-level quarterly goals tied directly to tactical projects, complete with automatic milestone progress percentage rollups and time horizon filtering.
3. **Habits and Focus Engine**: Habit streak compounding with daily check-ins, accompanied by a Pomodoro and Stopwatch HUD with 25m, 50m, and 15m presets that automatically increment elapsed focus minutes on linked tasks.
4. **Insights and Reflection**: Deterministic 7-day workload velocity charts, estimation accuracy ratios (planned vs. actual duration), blocker resolution tracking, and an end-of-day guided review journal.
5. **Supporting Notes**: Embedded Markdown notes index with dual Write / Preview tabs and character counts.
6. **Local Gemma 2 2B AI Coach**: Whole-application productivity auditing that detects planning mistakes from real SQLite data, answers strategic questions, and presents proposals through a strict **Human-in-the-Loop "Review & Apply"** workflow.

**The Golden Guarantee**: MAX operates **100% offline**. All personal data resides in a local SQLite database with zero external cloud subscriptions, zero telemetry, and zero phone-home tracking.

---

## Demo

Because MAX is a desktop application designed strictly for local privacy, there is no hosted cloud server tracking your clicks. You can run the entire verified application locally in under two minutes:

### Local Run Procedure
```powershell
# 1. Clone the repository
git clone https://github.com/YUVA56-gomu/MAX---Boost-Your-Self-Productiviy.git
cd MAX---Boost-Your-Self-Productiviy

# 2. Run backend & frontend with a single command (Windows PowerShell)
powershell -ExecutionPolicy Bypass -File scripts\start-dev.ps1
```
The application will launch on `http://127.0.0.1:5173/` and connect to the local FastAPI sidecar on `127.0.0.1:24125`.

### Visual Evidence & Artifacts

All screenshots and screen recordings are genuine artifacts captured from the live verified application:

| Feature Canvas | Preview |
| :--- | :--- |
| **Home Dashboard** | ![MAX Home Dashboard](https://raw.githubusercontent.com/YUVA56-gomu/MAX---Boost-Your-Self-Productiviy/main/docs/screenshots/01_home_dashboard.png) |
| **Tasks Kanban Canvas** | ![MAX Tasks Canvas](https://raw.githubusercontent.com/YUVA56-gomu/MAX---Boost-Your-Self-Productiviy/main/docs/screenshots/02_tasks_canvas.png) |
| **AI Whole-App Diagnosis** | ![AI Coach Diagnosis](https://raw.githubusercontent.com/YUVA56-gomu/MAX---Boost-Your-Self-Productiviy/main/docs/screenshots/03_ai_coach_diagnosis.png) |
| **Review & Apply Proposal** | ![AI Proposal Card](https://raw.githubusercontent.com/YUVA56-gomu/MAX---Boost-Your-Self-Productiviy/main/docs/screenshots/04_ai_review_and_apply_proposal.png) |
| **Local AI Onboarding Welcome** | ![AI Onboarding Welcome](https://raw.githubusercontent.com/YUVA56-gomu/MAX---Boost-Your-Self-Productiviy/main/docs/screenshots/06_ai_onboarding_welcome.png) |
| **Local AI Latency Verification** | ![AI Onboarding Verification](https://raw.githubusercontent.com/YUVA56-gomu/MAX---Boost-Your-Self-Productiviy/main/docs/screenshots/07_ai_onboarding_activation.png) |
| **Goals & Milestone Rollup** | ![Goals Canvas](https://raw.githubusercontent.com/YUVA56-gomu/MAX---Boost-Your-Self-Productiviy/main/docs/screenshots/08_goals_canvas.png) |
| **Habits Streak Tracker** | ![Habits Canvas](https://raw.githubusercontent.com/YUVA56-gomu/MAX---Boost-Your-Self-Productiviy/main/docs/screenshots/09_habits_canvas.png) |
| **Focus Engine HUD** | ![Focus Canvas](https://raw.githubusercontent.com/YUVA56-gomu/MAX---Boost-Your-Self-Productiviy/main/docs/screenshots/10_focus_canvas.png) |
| **Insights & Reflection** | ![Insights Canvas](https://raw.githubusercontent.com/YUVA56-gomu/MAX---Boost-Your-Self-Productiviy/main/docs/screenshots/11_insights_canvas.png) |
| **Contextual Notes** | ![Notes Canvas](https://raw.githubusercontent.com/YUVA56-gomu/MAX---Boost-Your-Self-Productiviy/main/docs/screenshots/12_notes_canvas.png) |

*(Full screen recordings verifying the real-time AI onboarding and sidebar workflow are saved directly in `docs/recordings/` in the repository).*

---

## Code

The full open-source codebase is hosted on GitHub:

[![GitHub Repository](https://img.shields.io/badge/GitHub-Repository-blue?logo=github)](https://github.com/YUVA56-gomu/MAX---Boost-Your-Self-Productiviy)

**Repository Link**: [https://github.com/YUVA56-gomu/MAX---Boost-Your-Self-Productiviy](https://github.com/YUVA56-gomu/MAX---Boost-Your-Self-Productiviy)

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, shadcn/ui, Vitest (69 tests).
- **Backend**: Python 3.14, FastAPI, SQLAlchemy 2.0, Alembic, SQLite WAL, Pytest (55 tests).
- **Desktop**: Tauri 2 with Rust sidecar supervisor and in-memory cryptographic token exchange.
- **AI Service**: Ollama integration hosting Google's open-weight `gemma2:2b`.
- **License**: MIT License.

---

## How I Built It

MAX was architected from day one to enforce **local-first sovereignty**:

```
+-----------------------------------------------------------+
|               Tauri 2 Native Desktop Shell                |
|  - Window Controls, Lifecycle Supervisor, Zero-Orphan Kill |
+-----------------------------+-----------------------------+
                              | In-Memory Ephemeral Token
+-----------------------------v-----------------------------+
|               Frontend (React 19 + TypeScript)            |
|  - Vite, Tailwind CSS v4, Lucide Icons, shadcn/ui          |
|  - Gemini-Dark obsidian aesthetic (#0B0F17, frosted glass) |
+-----------------------------+-----------------------------+
                              | Authenticated REST (127.0.0.1)
+-----------------------------v-----------------------------+
|               FastAPI Sidecar (Python 3.14)               |
|  - Constant-time token verification (secrets.compare_digest)|
|  - Sensitive header redaction middleware                  |
|  - SQLAlchemy 2.0 Declarative Models + Alembic Migrations |
+-----------------------------+-----------------------------+
                              |
               +--------------+--------------+
               |                             |
+--------------v--------------+ +------------v--------------+
|       Local SQLite WAL      | |    Ollama (127.0.0.1)     |
|  - data/app.db              | |  - Gemma 2 2B (Optional)  |
|  - 18 relational tables     | |  - Zero cloud leakage     |
+-----------------------------+ +---------------------------+
```

### Architectural Highlights

1. **Dual-Runtime Desktop Shell**: Tauri 2 provides a featherweight native container. When MAX starts, the Rust shell generates a 32-byte cryptographic token using Windows `BCryptGenRandom`, spawns the Python FastAPI backend on `127.0.0.1:24125`, and securely delivers the token to the frontend webview strictly via in-memory IPC. The token is **never stored in `localStorage`, `sessionStorage`, or cookies**, preventing unauthorized local scripts from accessing the REST API.
2. **ACID-Compliant SQLite Persistence**: 18 mapped relational tables manage workspaces, tasks, recurrence rules, goals, milestones, habits, focus intervals, daily reviews, blockers, and notes. Configured with `PRAGMA journal_mode=WAL` and `busy_timeout=5000` for seamless concurrent reads and writes.
3. **On-Device Gemma 2 2B Intelligence**: Instead of dispatching user prompts to third-party cloud APIs, MAX interfaces directly with a local **Ollama** instance (`127.0.0.1:11434`) running Google's open-weight **Gemma 2 2B** model.
4. **Human-in-the-Loop "Review & Apply" Safety**: The AI is architecturally prohibited from writing to the database. All AI diagnostic outputs are structured as typed JSON proposals. Users inspect proposed changes (e.g., re-estimating an overdue task or updating a priority), tweak values inline, and must explicitly click **"Approve & Apply"** before SQLite is mutated.
5. **Truthful Local AI Onboarding**: Rather than assuming Ollama is running or showing a fake spinner, MAX implements an honest 6-state onboarding flow that inspects local binaries, detects stopped services, offers a safe one-click daemon launcher, verifies model presence, and measures genuine inference latency (~430ms) before activation.

---

## Why Does Open Innovation Matter?

Open innovation is not just about sharing code; it is about **restoring digital sovereignty and privacy to creators**.

When you build a side hustle, your daily notes, customer thoughts, revenue milestones, and self-doubts are deeply personal. Under prevailing cloud paradigms, user data is aggregated on remote servers, monetized for telemetry, or ingested to train proprietary models behind closed subscription paywalls.

Open innovation matters because:
1. **Open-Weight Models Democratize Local AI**: Models like Google's **Gemma 2 2B** prove that capable, high-quality reasoning can run on everyday consumer laptops without GPU server farms or internet access.
2. **Local-First Architecture Guarantees Longevity**: Because MAX relies entirely on open standards—SQLite, React, FastAPI, and open-weight models—it will never break due to an unexpected cloud shutdown, price hike, or API deprecation. Your productivity system belongs to you forever.
3. **Transparent Trust**: Open source allows anyone to inspect network traffic and verify that zero bytes of data leave the machine.

---

## My Agent Session

This project was developed through rigorous pair-programming with **Google DeepMind's Antigravity Agent**. 

Rather than treating AI as an unstructured code generator, our collaboration was governed by strict architectural contracts (`AGENTS.md`, `ARCHITECTURE.md`, `DATA_MODEL.md`):
- **124 Automated Tests Passing**: Maintained 100% green tests across 69 Vitest frontend tests and 55 Pytest backend tests covering SQLite schema cascades, recurrence rules, and security boundaries.
- **Zero Hallucinations Policy**: Every screen and endpoint was audited against physical visual references (`docs/design-reference/dashboard-reference.png`) and real database queries before being declared complete.
- **Truthful Hardware Interaction**: The agent verified genuine Ollama process management, Windows child process tree termination (`taskkill /F /T`), and verified actual Gemma 2 2B inference latency in the browser.

---

## My First User

I was my own first user. Throughout the 135-minute Hacktoberfest sprint, I dogfooded MAX to manage the sprint itself:
- Tracked our sprint tasks in the **Tasks Canvas** with cognitive energy badges.
- Ran **Pomodoro focus intervals** to pace our 10-minute navigation audits.
- Ran the **Whole-App AI Diagnosis** against my live SQLite sprint data. The local Gemma model flagged that I had 3 active tasks with zero recorded focus minutes and proposed re-estimating my audit task. Seeing that real recommendation pop up on my own laptop—with zero internet traffic—validated the entire vision.

---

## Prize Categories

I am submitting MAX under:
* **DEV Hacktoberfest 2026: Week 2 — Side Hustle** (Primary Track)
* **Open Innovation / Local-First AI Showcase**

---

*Built with passion, caffeine, and open weights for Hacktoberfest 2026.* 🚀
