# Design System & Visual Specification: Gemini Dark Elegance

## 1. Visual Reference & Governance Status

> [!IMPORTANT]
> **Approved Primary Visual Source of Truth**:
> The primary visual benchmark for this application is **`dashboard-reference.png`**, located at:
> **`docs/design-reference/dashboard-reference.png`**
> 
> Detailed screen-by-screen layouts, component anatomies, and interactive states are documented in **[`UI.md`](file:///d:/SelfProductivityApp/UI.md)**.
> 
> *Current Workspace Status*: The physical image file is awaiting manual placement at `d:\SelfProductivityApp\docs\design-reference\dashboard-reference.png` (`[OPEN-004]`). Visual specifications have been aligned with the approved reference design.

---

## 2. Approved Visual Direction: "Gemini Dark Elegance"

1. **Near-Black Obsidian Surfaces**: Deep OLED-grade background base (`#0B0F17`) and canvas surfaces (`#111827`) provide extreme contrast without flat muddy grays.
2. **Refined Luminous Gradients**: Accent elements and active indicators use refined gradients inspired by Gemini sparkle artwork (`linear-gradient(135deg, #6366F1 0%, #A855F7 50%, #EC4899 100%)`).
3. **Glass-Like Cards**: Translucent elevated surfaces (`backdrop-blur-md bg-slate-900/60`) enclosed with crisp ultra-thin luminous borders (`rgba(255, 255, 255, 0.08)`).
4. **Colorful Geometric Artwork & Accents**: Rich visual iconography (such as the 4-petal geometric clover logo) and geometric header accents to delineate the four core pillars while maintaining high information density and breathing room.

---

## 3. Color Tokens & Palette

### 3.1 Background & Surface Tokens
| Token | Hex / Value | Usage |
| :--- | :--- | :--- |
| `--bg-base` | `#0B0F17` | Root desktop window background, canvas substrate |
| `--bg-elevated` | `#111827` | Navigation sidebar, top bar, modal headers |
| `--bg-card` | `#1E293B` | Task cards, goal cards, project panels, metric widgets |
| `--bg-glass` | `rgba(17, 24, 39, 0.75)` | Floating HUD, command palette backdrop, popovers |
| `--bg-input` | `rgba(30, 41, 59, 0.6)` | Search inputs, form controls, editor containers |

### 3.2 Border Tokens
| Token | Hex / Value | Usage |
| :--- | :--- | :--- |
| `--border-subtle` | `rgba(255, 255, 255, 0.08)` | Standard card borders, divider lines |
| `--border-medium` | `rgba(255, 255, 255, 0.16)` | Hovered cards, active tab separators |
| `--border-focus` | `rgba(99, 102, 241, 0.6)` | Focused inputs, selected items |

### 3.3 Text & Typography Tokens
| Token | Hex / Value | Usage |
| :--- | :--- | :--- |
| `--text-primary` | `#F8FAFC` | Primary headings, task titles, note text |
| `--text-secondary` | `#94A3B8` | Metadata, descriptions, timestamps |
| `--text-muted` | `#64748B` | Inactive icons, placeholder hints |
| `--text-inverse` | `#0B0F17` | Text on luminous accent buttons |

### 3.4 Pillar Identity & Semantic Colors
| Role | Hex | Tailwind Utility | Pillar Association |
| :--- | :--- | :--- | :--- |
| **Sparkle Gradient** | `linear-gradient(135deg, #6366F1, #A855F7, #EC4899)` | `from-indigo-500 via-purple-500 to-pink-500` | Global Brand & Primary Actions |
| **Electric Indigo** | `#6366F1` | `text-indigo-500`, `bg-indigo-500` | Pillar 1: Task Management |
| **Cyber Violet** | `#8B5CF6` | `text-violet-500`, `bg-violet-500` | Pillar 2: Goals and Projects |
| **Neon Cyan** | `#06B6D4` | `text-cyan-500`, `bg-cyan-500` | Pillar 3: Habits and Focus |
| **Emerald Success**| `#10B981` | `text-emerald-500`, `bg-emerald-500` | Pillar 4: Insights & Progress |
| **Amber Warning** | `#F59E0B` | `text-amber-500`, `bg-amber-500` | Blockers & Urgent Priorities |
| **Rose Alert** | `#F43F5E` | `text-rose-500`, `bg-rose-500` | Critical deadlines, errors |

---

## 4. Typography Scale

- **Primary UI Font**: `Inter`, `Outfit`, or system sans (`system-ui, -apple-system, sans-serif`).
- **Monospace Font**: `JetBrains Mono`, `Fira Code`, or system monospace (`ui-monospace, monospace`).

| Scale Step | Size | Line Height | Weight | Tailwind Class |
| :--- | :--- | :--- | :--- | :--- |
| **Display 1** | 30px (`1.875rem`) | 36px | Bold (700) | `text-3xl font-bold` |
| **Heading 2** | 24px (`1.5rem`) | 32px | SemiBold (600) | `text-2xl font-semibold` |
| **Heading 3** | 20px (`1.25rem`) | 28px | SemiBold (600) | `text-xl font-semibold` |
| **Body Large** | 16px (`1.0rem`) | 24px | Regular (400) | `text-base` |
| **Body Standard**| 14px (`0.875rem`)| 20px | Regular (400) | `text-sm` |
| **Caption / Small**| 12px (`0.75rem`)| 16px | Medium (500) | `text-xs font-medium` |
| **Micro** | 10px (`0.625rem`)| 14px | SemiBold (600) | `text-[10px] tracking-wide` |

---

## 5. View & Component Specifications (Four Core Pillars)

### 5.1 Pillar 1 Views: Task Management Canvas
- **Kanban Board**: Multi-column drag-and-drop board (`Draft`, `Todo`, `In Progress`, `Blocked`, `Done`). Glass cards with priority badges, deadline countdowns, cognitive energy pills (1-5), and recurring badges.
- **Task List View**: Dense, keyboard-navigable table with inline title/estimate editing.
- **Task History Drawer**: Slide-out audit ledger showing timestamped status transitions and edits.

### 5.2 Pillar 2 Views: Goals & Projects Canvas
- **Goal Cards**: Hero cards with colorful geometric accents, progress percentage bar, target horizon chip, and expandable milestones list.
- **Project Grid**: Deliverable containers displaying linked goal chips, task completion roll-ups (`12/18 tasks done`), and target dates.

### 5.3 Pillar 3 Views: Habits & Focus Dashboard
- **Habit Matrix**: Weekly checkoff calendar grid with current streak counter, best streak badge, and cadence indicator.
- **Focus Timer HUD**: High-impact circular SVG progress ring with neon cyan glowing stroke animation, monospace time display, active task chip, and interruption logger.
- **Energy Rating Dialog**: Minimalist pre/post-session 1-5 slider modal.

### 5.4 Pillar 4 Views: Insights & Reflection Canvas
- **Planned vs. Completed Workload**: Split-bar metric chart comparing estimated hours vs. actual logged deep work hours, with rollover count.
- **Blocker Board**: Categorized list of active and resolved friction points with resolution durations.
- **Daily Review Modal**: Guided end-of-day reflection form with wins, friction points, and tomorrow's top priorities.

### 5.5 Supporting Feature: Notes Drawer & Wikilinks
- Contextual slide-out markdown editor supporting project attachment, wikilinks (`[[Note]]`), and task checklist sync.
