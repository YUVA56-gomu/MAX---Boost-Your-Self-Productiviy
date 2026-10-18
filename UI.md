# UI Reference Index & Screen Specifications

## 1. Governance & Overview

This document is the **authoritative index for all visual UI references, screen layouts, interaction patterns, and component specifications** for the **Adaptive Productivity Desktop Application**.

- **Design System Link**: For global design tokens, color scales, typography metrics, spacing systems, and CSS variables, refer to [`DESIGN_SYSTEM.md`](file:///d:/SelfProductivityApp/DESIGN_SYSTEM.md).
- **Agent Governance Rule**: Per [`AGENTS.md`](file:///d:/SelfProductivityApp/AGENTS.md), agents and engineers **must consult this document and inspect the approved visual references** before implementing or modifying any user interface screen.
- **Milestone Boundary**: We are currently at **Milestone 0 (Documentation & Governance)**. In accordance with milestone rules, this document establishes screen specifications and inventory; **no frontend application code is implemented during Milestone 0**.

---

## 2. Visual Reference Registry

| Reference File | Role & Hierarchy | Applicable Screens | Visual Source of Truth |
| :--- | :--- | :--- | :--- |
| **`docs/design-reference/dashboard-reference.png`** | **Primary Visual Source of Truth**. High-fidelity desktop dashboard defining obsidian surfaces, typography, glass cards, stat strip, task list, circular focus timer, and weekly analytics. | Screens 1, 2, 3, 7, 8, 9, 11, 13 | **YES (Primary Benchmark)** |
| **`docs/design-reference/geometric-artwork-reference.png`** | **Artwork & Brand Identity Source**. Geometric clover logo, isometric 3D gradient blocks, ribbons, and polyhedra used for decorative accents and headers. | Shell branding, Hero banners, Goal badges, AI promo cards | Supporting Asset |

> [!NOTE]
> **Reference File Status**:
> As recorded in `[OPEN-004]`, the physical file `docs/design-reference/dashboard-reference.png` is currently awaiting manual placement in the repository at `d:\SelfProductivityApp\docs\design-reference\dashboard-reference.png`.

---

## 3. Approved Visual Identity & Shell Layout Patterns

The visual design language is grounded in the **Gemini-inspired dark dashboard** archetype:

```text
+-------------------------------------------------------------------------------------------------------------------------+
| [Clover] MAX  | [ Search tasks, goals, or anything... Ctrl+K ]                         | [Bell]  [ (Y) Yuvaraj v ]     |
+---------------+---------------------------------------------------------------------------------------------------------+
| [Sidebar]     | [Hero Banner: Good morning, Yuvaraj ✨]                                | [Quote: "Discipline today..."] |
| - Home (*)    +---------------------------------------------------------------------------------------------------------+
| - Tasks       | [Tasks: 5/8 62%] | [Focus: 02:40 +12%] | [Goals: 2/5 40%] | [Habits: 3/6 50%]                           |
| - Calendar    +-------------------------------------------------------------------+-------------------------------------+
| - Goals       | Today's Tasks (8)                     [+ Add task] [Filter Tabs]  | Focus Timer (25:00)                 |
| - Focus       |  :: [x] Finish project architecture    High    10:00 AM   ...     |  [Pomodoro | Short | Long]          |
| - Habits      |  :: [x] Practice 2 DSA problems        Medium  11:30 AM   ...     |  (  25:00 Focus  ) [Play] [Stop]    |
| - Analytics   |  :: [ ] Review weekly goals            Medium   3:00 PM   ...     +-------------------------------------+
|               |  :: [ ] UI design exploration          Low      5:00 PM   ...     | This Week (Task Completion)         |
| WORKSPACES +  |  :: [ ] Read 30 mins                   Low      9:00 PM   ...     |  [||||||| Bar Chart]                |
| - Personal    |                                                                   |  28 Tasks | 18 Done | 64%           |
| - College     |                                                                   |                                     |
| - Work        |                                                                   |                                     |
| - Projects    |                                                                   |                                     |
|               |                                                                   |                                     |
| [Level Up? ->]|                                                                   |                                     |
| [Settings]    |                                                                   |                                     |
+---------------+-------------------------------------------------------------------+-------------------------------------+
```

### 3.1 Layout & Grid Principles
1. **Three-Column Adaptive Grid**:
   - **Left Column (Navigation Sidebar)**: Fixed width `240px` (collapsible to `64px` icon-only mode on compact displays). Houses application branding, core navigation, workspace selector, optional AI promo card, and settings.
   - **Center Column (Main Execution Canvas)**: Flexible fluid area (`minmax(600px, 1fr)`). Houses greeting banner, quick stat cards, and primary view canvas (Task lists, Kanban, Goal trees, Habit matrices).
   - **Right Column (Contextual Widget Hub)**: Fixed width `340px` (collapsible or repositionable). Houses the active Focus Timer HUD, daily quotes, and weekly velocity charts.
2. **Glassmorphism & Surfaces**:
   - Base canvas: Near-black obsidian `#0B0F17`.
   - Elevated panels: `bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-2xl`.
   - Hover states: Luminous border glow `hover:border-indigo-500/40 transition-all duration-200`.
3. **Refined Luminous Gradients**:
   - Gemini sparkle gradients (`linear-gradient(135deg, #6366F1, #A855F7, #EC4899)`) used selectively on primary buttons, active tabs, progress rings, and header typography.
4. **Typography & Readability**:
   - Clean modern sans (`Inter` / `Outfit`) with high-contrast text (`#F8FAFC`), paired with monospace (`JetBrains Mono`) for timecodes and numbers.

---

## 4. Complete Product Screen Inventory (14 Screens)

Below is the exhaustive specification for each product screen. All screens are marked with their planned implementation milestone.

---

### Screen 1: Dashboard / Home
- **Purpose**: Central command center providing an immediate, high-leverage overview of today's commitments, active focus timer, quick stat metrics, and habit streaks.
- **Reference Image**: `docs/design-reference/dashboard-reference.png`
- **Primary User Actions**:
  - Scan daily progress via 4-card metric strip.
  - Check off or start tasks directly from "Today's Tasks".
  - Launch or pause a Pomodoro focus interval.
  - Access global search / quick capture via `Ctrl+K`.
  - Switch active workspace context.
- **Key Components**:
  - App Shell Header: Search bar with `Ctrl+K`, notification bell, user profile avatar.
  - Left Sidebar: Navigation links, workspace list with colored chips, "Want to level up?" card, Settings.
  - Greeting Banner: Dynamic date, personalized greeting with gradient name, colorful geometric glass artwork.
  - Motivational Quote Card: Contextual inspirational quote.
  - 4 Quick Stat Cards: Tasks (count + progress %), Focus Time (hours + delta % + sparkline), Goals (active count + %), Habits (completed count + %).
  - Today's Tasks Widget: Pill filter tabs (`All`, `To do`, `In progress`, `Completed`), draggable task rows with priority pills and time badges.
  - Focus Timer HUD: Circular progress ring, mode toggle (`Pomodoro`, `Short Break`, `Long Break`), controls.
  - Weekly Activity Card: Day-by-day bar chart with completion rate metrics.
- **States**:
  - *Empty State*: "All clear for today! Take a break or plan tomorrow's tasks." with `+ Add Task` button.
  - *Loading State*: Sleek skeleton cards matching the 3-column layout with shimmer animation.
  - *Error State*: Glass alert banner with retry button.
  - *Success State*: Subtle particle sparkle micro-animation when all daily tasks are completed.
- **Responsive & Accessibility**:
  - Tablet/Mobile: Right widget hub collapses below main canvas; sidebar collapses to icon-only mode.
  - Full keyboard tab navigation (`1-4` for stat shortcuts, `Space` to toggle timer).
- **Implementation Status**: **Planned (Milestone 4)**

---

### Screen 2: Tasks and Subtasks (Task Canvas)
- **Purpose**: Deep management of tasks across Kanban board and detailed List views, supporting subtasks, recurring rules, and status pipelines.
- **Reference Image**: Visual styling derived from `docs/design-reference/dashboard-reference.png` (task card anatomy and filter tabs).
- **Primary User Actions**:
  - Drag-and-drop tasks between columns (`Draft`, `Todo`, `In Progress`, `Blocked`, `Completed`).
  - Expand subtask trees inline.
  - Filter by project, goal, priority, and required cognitive energy level (1-5).
  - Configure recurrence rules for repetitive routines.
- **Key Components**:
  - View Switcher: Segmented toggle between `Kanban Board`, `List View`, and `Priority Matrix`.
  - Filter & Sort Bar: Multi-select dropdowns for Priority, Energy Tag, Project, and Due Date.
  - Kanban Column Container: Columns with count badges, add button, and drop zone indicators.
  - Task Card Component: Title, project badge, subtask progress counter (`2/4 subtasks`), energy icon (1-5), priority pill, deadline chip.
  - Subtask Accordion: Indented tree of child checkboxes with inline quick-add.
- **States**:
  - *Empty State*: "No tasks found in this view. Create your first task to get started."
  - *Loading State*: Skeleton columns with pulsing card placeholders.
  - *Error State*: Inline error toast with action retry.
  - *Success State*: Task row highlights green before transitioning to completed column.
- **Responsive & Accessibility**:
  - Drag-and-drop operable via keyboard shortcuts (`Ctrl+M` to move card to next status).
  - ARIA drag-and-drop live region announcements.
- **Implementation Status**: **Planned (Milestone 4)**

---

### Screen 3: Task Details and Task Creation Modal
- **Purpose**: Focused modal or slide-over drawer to inspect, edit, or create a task with complete metadata.
- **Reference Image**: Modal design language from `docs/design-reference/dashboard-reference.png` (dark glassmorphism, refined inputs, rounded-xl).
- **Primary User Actions**:
  - Set task title, markdown description, and checklist items.
  - Assign to a Project and link to a Strategic Goal / Milestone.
  - Specify priority (`Low`, `Medium`, `High`, `Urgent`), deadline, and estimated minutes.
  - Set required Cognitive Energy Level (1 = Low to 5 = Deep Focus).
  - Configure recurrence cadence (`Daily`, `Weekdays`, `Weekly`, `Monthly`, `Custom`).
  - View timestamped `task_history` audit ledger.
- **Key Components**:
  - Modal Header: Task title input with instant autosave indicator, status selector.
  - Two-Column Layout: Left editor for markdown notes & checklist; right sidebar for metadata dropdowns (Project, Goal, Priority, Energy, Due Date, Recurrence).
  - Task History Accordion: Chronological feed showing date, field modified, and old/new values.
  - Action Footer: `Delete`, `Duplicate`, `Start Focus Session`, `Save & Close`.
- **States**:
  - *Default/Edit State*: Populated inputs with clear validation borders.
  - *Validation Error*: Red border on missing required title with inline message.
- **Responsive & Accessibility**:
  - `Escape` closes modal; `Ctrl+Enter` saves. Focus trapped inside modal during display.
- **Implementation Status**: **Planned (Milestone 4)**

---

### Screen 4: Goals: Long-Term and Short-Term
- **Purpose**: Strategic dashboard visualizing high-level personal and professional aspirations organized by visionary horizons and tactical quarters.
- **Reference Image**: Derived from `docs/design-reference/dashboard-reference.png` (stat cards, colorful geometric badges).
- **Primary User Actions**:
  - Create new Long-Term (1–5 yrs) and Short-Term (quarterly/monthly) goals.
  - Inspect goal health, completion percentages, and linked projects.
  - Filter goals by status (`Active`, `Completed`, `Paused`, `Abandoned`).
- **Key Components**:
  - Horizon Tabs: `All Goals`, `Long-Term Horizons`, `Short-Term Objectives`.
  - Goal Card: Title, category icon, geometric color badge, target horizon date, progress bar (0-100%), count of linked milestones and projects.
  - Summary Header: Total active goals, completion rate, target milestones due this month.
- **States**:
  - *Empty State*: "Set your north star. Define your first long-term or short-term goal."
  - *Loading State*: Skeleton goal cards with glowing progress bar placeholders.
- **Responsive & Accessibility**:
  - Responsive 2-column or 3-column card grid adapting down to single column on narrow screens.
- **Implementation Status**: **Planned (Milestone 4)**

---

### Screen 5: Goal Details, Milestones and Linked Tasks
- **Purpose**: In-depth view of a single strategic goal, detailing sequential milestone checkpoints, linked projects, and contributing task trees.
- **Reference Image**: Derived from `docs/design-reference/dashboard-reference.png`.
- **Primary User Actions**:
  - Add and reorder milestone checkpoints.
  - Check off completed milestones with celebration feedback.
  - Link existing tasks or create new tasks directly tied to a milestone.
  - Review automated progress roll-up calculation.
- **Key Components**:
  - Goal Hero Banner: Title, description, status badge, overall completion circular gauge.
  - Milestone Timeline: Vertical timeline with interactive checkpoint nodes, due dates, and completion timestamps.
  - Contributing Tasks Table: Filtered task list showing all tasks targeting this goal, grouped by milestone.
  - Linked Projects Strip: Cards showing projects aligning with this goal.
- **States**:
  - *Empty Milestones*: "No milestones defined yet. Break this goal into 3-5 key checkpoints."
- **Responsive & Accessibility**:
  - Full keyboard accessibility for expanding milestones and checking checkpoints.
- **Implementation Status**: **Planned (Milestone 4)**

---

### Screen 6: Projects Canvas
- **Purpose**: Portfolio view of deliverable containers grouping tasks toward concrete deliverables.
- **Reference Image**: Card layout derived from `docs/design-reference/dashboard-reference.png`.
- **Primary User Actions**:
  - Create, edit, and archive projects.
  - Track project task completion ratios (`12/18 tasks done`).
  - Associate projects with parent strategic goals.
  - Open supporting project documentation notes.
- **Key Components**:
  - Project Grid: Cards featuring project color accent, title, scope summary, goal tag, task completion progress bar, deadline chip.
  - Supporting Notes Drawer: Quick access to notes tagged with `project_id`.
  - Project Health Status: `Planning`, `Active`, `On Hold`, `Completed`, `Archived`.
- **States**:
  - *Empty State*: "No active projects. Group your tasks into a structured project."
- **Implementation Status**: **Planned (Milestone 4)**

---

### Screen 7: Workspace Overview and Workspace Creation
- **Purpose**: Manage isolated contextual environments (e.g. "Personal", "Work", "College", "Projects") to maintain strict separation of concerns.
- **Reference Image**: Left sidebar workspaces menu in `docs/design-reference/dashboard-reference.png`.
- **Primary User Actions**:
  - Switch active workspace with single click or shortcut.
  - Create a new workspace with custom name, slug, color accent, and icon.
  - Export or archive workspace data.
- **Key Components**:
  - Workspace Grid & Management Modal: List of workspaces with color indicators and task counts.
  - Creation Dialog: Name, slug generation, color picker (preset palette), icon picker.
  - Default Workspace Toggle.
- **States**:
  - *Creation Validation*: Slug auto-formatted; duplicate name warning.
- **Implementation Status**: **Planned (Milestone 4)**

---

### Screen 8: Habits and Habit Tracking
- **Purpose**: Daily behavioral routine execution and compounding streak monitoring.
- **Reference Image**: Habit stat card and clean checklist patterns in `docs/design-reference/dashboard-reference.png`.
- **Primary User Actions**:
  - Check off daily habit completion.
  - View current streak, all-time best streak, and consistency rating.
  - Schedule habits by time of day (`Morning`, `Afternoon`, `Evening`, `Any`).
- **Key Components**:
  - Habit Weekly Matrix: Matrix grid displaying habits along rows and the current week's days across columns with glowing checkoff badges.
  - Habit Card: Habit title, streak badge with flame icon, target count indicator.
  - Habit Creation Modal: Name, description, cadence (`Daily`, `Weekdays`, `X times/week`), target metric (boolean or numeric).
- **States**:
  - *Empty State*: "Form positive compounding habits. Add your first daily habit routine."
  - *Streak Milestone Celebration*: Subtle glow animation when reaching a 7-day or 30-day streak.
- **Implementation Status**: **Planned (Milestone 5)**

---

### Screen 9: Focus Timer and Focus Session History
- **Purpose**: Dedicated execution interface to preserve deep work flow, track session energy ratings, and inspect historical focus sessions.
- **Reference Image**: Focus Timer widget in top-right column of `docs/design-reference/dashboard-reference.png`.
- **Primary User Actions**:
  - Start, pause, or cancel a Pomodoro (25m) or custom stopwatch timer.
  - Associate timer with an active task or project.
  - Log pre-session and post-session cognitive energy ratings (1 to 5).
  - Record interruptions with quick-increment button.
  - Inspect chronological focus session log.
- **Key Components**:
  - Full-Screen or Widget HUD: Circular SVG progress ring with glowing neon cyan/purple gradient stroke.
  - Monospace Countdown Display (`25:00`).
  - Active Task Selector Chip.
  - Interruption Counter (`+1 Interruption`).
  - Pre/Post Energy Slider Modal: Rating from 1 (Exhausted) to 5 (Peak Flow).
  - Session History Table: Date, duration, associated task, interruptions, energy delta.
- **States**:
  - *Idle State*: Timer at initial duration; start button pulsing subtly.
  - *Running State*: Glowing animated ring; document title updates with remaining time.
  - *Completed State*: Gentle audio chime (optional/local) and transition to post-energy rating.
- **Implementation Status**: **Planned (Milestone 5)**

---

### Screen 10: Calendar and Schedule
- **Purpose**: Timebox tasks, planned focus sessions, and habits into a structured day and week calendar.
- **Reference Image**: Calendar sidebar link in `docs/design-reference/dashboard-reference.png`.
- **Primary User Actions**:
  - Drag tasks onto calendar time slots to schedule focus blocks.
  - Switch between Day, Week, and Month views.
  - Inspect planned workload density.
- **Key Components**:
  - Time Grid: Hourly grid (6:00 AM – 11:00 PM) with current time indicator line.
  - Unscheduled Tasks Tray: Side drawer of pending tasks ready to be dragged onto schedule.
  - Scheduled Block Chips: Color-coded by project/priority with duration handles.
- **States**:
  - *Empty Day*: Clean time grid with prompt: "Drag tasks here to timebox your day."
- **Implementation Status**: **Planned (Milestone 5)**

---

### Screen 11: Insights, Analytics and Daily Reflection
- **Purpose**: Operational intelligence dashboard visualizing planned vs completed workload, blocker tracking, energy correlation, and end-of-day reflection.
- **Reference Image**: Weekly analytics card in `docs/design-reference/dashboard-reference.png`.
- **Primary User Actions**:
  - Review planned vs actual hours executed.
  - Inspect task rollover frequency and estimation accuracy.
  - Log and resolve obstacles in the Blocker Tracker.
  - Complete the Evening Daily Review reflection flow.
- **Key Components**:
  - Workload Split Chart: Dual-bar chart comparing estimated minutes vs actual logged focus minutes.
  - Estimation Accuracy Metric: Gauge showing percentage accuracy of planned durations.
  - Blocker Tracker: Active issues categorized by `External`, `Technical`, `Energy`, `Scope`.
  - Daily Reflection Flow: Multi-step guided modal:
    1. *Wins*: What went well today?
    2. *Challenges*: What caused friction or distraction?
    3. *Tomorrow*: Top commitments for tomorrow.
    4. *Mood & Energy*: 1-5 slider ratings.
  - Energy vs Output Correlation Chart: Scatter/line chart plotting energy ratings against completed tasks.
- **States**:
  - *Empty Analytics*: "Complete your first focus sessions and tasks to unlock productivity insights."
- **Implementation Status**: **Planned (Milestone 5)**

---

### Screen 12: Settings, Data Export and Local Backup
- **Purpose**: System configuration, database backup/export, theme adjustments, and privacy sovereignty controls.
- **Reference Image**: Settings gear link in `docs/design-reference/dashboard-reference.png`.
- **Primary User Actions**:
  - Create immediate SQLite database snapshot backup.
  - Export all data (Tasks, Goals, Habits, Notes, Reviews) to JSON or Markdown bundle.
  - Configure Pomodoro intervals (work duration, short/long break).
  - Inspect local database file path and storage statistics.
  - View local AI audit logs and clear history.
- **Key Components**:
  - Settings Tabs: `General`, `Focus Timer`, `Data & Backup`, `Local AI`, `Privacy & Audit`.
  - Backup Card: One-click "Export SQLite Database" and "Export Everything to JSON".
  - Storage Stats: Database size, total task count, focus hours logged.
- **States**:
  - *Export Success*: Download toast with file size and save destination.
- **Implementation Status**: **Planned (Milestone 4 & 5)**

---

### Screen 13: Optional AI Upgrade / "Want to level up?"
- **Purpose**: Non-intrusive entry point introducing the user to the optional, 100% local AI coach without requiring cloud accounts.
- **Reference Image**: Bottom card in left sidebar of `docs/design-reference/dashboard-reference.png`:
  - Glowing translucent dark card with multi-color geometric artwork in top-right corner.
  - Title: "Want to level up?"
  - Subtitle: "Add a local AI coach to get personalized insights and plans."
  - Right-arrow button `->`.
- **Primary User Actions**:
  - Click promo card or navigate from Settings to explore optional local AI capabilities.
  - Review local AI privacy guarantees (100% on-device, zero cloud, read-only suggestions).
  - Dismiss card from sidebar if user prefers zero-AI experience.
- **Key Components**:
  - Sidebar Promo Card: Translucent gradient card with dismiss button.
  - Feature Explainer Modal: Overview of local task deconstruction, milestone planning, and daily reflection synthesis.
  - Clear Call-to-Action: "Launch Local AI Setup Wizard" and "Dismiss (Keep Zero-AI)".
- **States**:
  - *Dismissed State*: Card is hidden from sidebar; user can re-enable anytime via Settings.
- **Implementation Status**: **Planned (Milestone 6)**

---

### Screen 14: Local AI Setup Wizard
- **Purpose**: Transparent, step-by-step onboarding guide for running Ollama with Gemma 2 2B locally on the user's machine.
- **Reference Image**: Derived from modal standards in `docs/design-reference/dashboard-reference.png`.
- **Primary User Actions**:
  - Test local hardware compatibility (RAM, CPU/GPU detection).
  - Inspect verified model details (Gemma 2 2B: 1.6 GB download size, ~2.5 GB RAM required).
  - Verify local Ollama runtime status (`http://127.0.0.1:11434`).
  - Run one-click connection test or follow manual troubleshooting steps.
- **Key Components**:
  - Step 1: **Hardware & Compatibility Check**: Displays verified RAM and CPU architecture (differentiating verified hardware from estimates).
  - Step 2: **Ollama Installation Guide**: Instructions to install Ollama with local download link and command `ollama run gemma2:2b`.
  - Step 3: **Live Connection Probe**: Real-time ping to `/api/v1/ai/status` checking daemon and model presence.
  - Step 4: **Permission & Audit Preview**: Reaffirms that AI has zero autonomous write authority and all interactions are audited locally.
  - Troubleshooting Drawer: Step-by-step resolution for common issues (port conflict, firewall, model download timeout).
- **States**:
  - *Ollama Detected & Ready*: Green checkmark badge with model tag `gemma2:2b verified ready`.
  - *Ollama Offline*: Clear instruction card: "Ollama daemon not detected on port 11434. Start Ollama and click Retry."
  - *Model Missing*: Yellow badge: "Ollama running, but gemma2:2b model not found. Run `ollama run gemma2:2b` in terminal."
- **Implementation Status**: **Planned (Milestone 6)**

---

## 5. Unresolved Design Decisions & Notes

- **`[OPEN-004] Visual Design Reference Asset Placement`**:
  - Status: **UNRESOLVED (OPEN)**.
  - Note: Visual design details have been fully analyzed from the user-provided prompt screenshot. The physical file remains to be placed manually in `docs/design-reference/dashboard-reference.png`.
- **`[OPEN-006] Sidebar "Want to Level Up?" Dismissal Behavior`**:
  - Decision: Provide an explicit close (`x`) icon on the sidebar promo card so users who prefer a pure zero-AI core can dismiss it permanently without entering Settings.
