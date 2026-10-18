# Local AI Governance, Privacy & Permission Policy

## 1. Core Foundational Principle

> [!IMPORTANT]
> **Zero-AI Offline Sovereign Core**:
> The core application **must function completely without AI or an active internet connection**. 
> No cloud accounts, remote API keys, or proprietary AI subscriptions are permitted or required for any of the Four Core Pillars (Task Management, Goals & Projects, Habits & Focus, Insights & Reflection).
> The AI layer is an **optional, strictly local enhancement** introduced in Milestone 6.

---

## 2. Model Baseline & Local Inference Architecture

- **Inference Runtime**: **Ollama** running locally on the user's workstation (`http://127.0.0.1:11434`).
- **Initial Candidate Model**: **Gemma 2 2B** (`gemma2:2b`).
  - Audited as already downloaded and available on the local workstation.
  - Low memory footprint (~1.6 GB VRAM/RAM), fast token generation, and excellent instruction-following capabilities on consumer hardware.
- **Zero Cloud Leakage**:
  - All prompt construction and inference execution happens strictly on `127.0.0.1`.
  - No network packets leave the machine during AI operations.
  - No remote model fallback is permitted (no calls to OpenAI, Google Cloud Vertex, Anthropic, or external endpoints).

---

## 3. Pillar-Specific AI Capabilities (Read-and-Suggest Only)

The local AI engine supports assistive workflows across the core pillars strictly in **read-only suggestion mode**:
1. **Pillar 1 (Task Management)**:
   - Deconstructing complex, high-level tasks into actionable subtasks.
   - Suggesting time estimates based on task description complexity.
2. **Pillar 2 (Goals and Projects)**:
   - Decomposing broad strategic goals into sequential milestone checkpoints.
3. **Pillar 4 (Insights and Reflection)**:
   - Synthesizing daily completed tasks and logged friction into an initial evening reflection summary draft.

---

## 4. Human-in-the-Loop & Permission Boundaries

### 4.1 Strict Suggest-Only Operation
The AI system is strictly **read-and-suggest**. It possesses **zero autonomous write authority** over the user's SQLite database.
- The AI **cannot** unilaterally create, update, reorder, or delete tasks or goals.
- The AI **cannot** modify habit streaks or completed focus logs.
- The AI **cannot** silently overwrite or append to existing notes or daily reviews.

### 4.2 "Review & Apply" Interaction Pattern
Whenever the user triggers an AI capability:
1. The backend queries Ollama and generates a candidate output schema.
2. The UI displays an interactive **Review Modal** showing the generated suggestions with checkable items.
3. The user can:
   - Edit individual suggested items.
   - Deselect specific items they do not want.
   - Click **"Apply Selected"** to commit the changes to SQLite.
   - Click **"Discard"** to cancel without modifying any data.
4. The database is updated **only** upon the user's explicit click of "Apply Selected".

---

## 5. Mandatory Local Audit Trail

Every interaction with the local AI engine is recorded in the local SQLite table `ai_audit_logs`.

### 5.1 Audit Record Data Points
- `id`: Unique UUIDv4.
- `workspace_id`: Active workspace.
- `action_type`: Context (`task_breakdown`, `goal_milestones`, `reflection_synthesis`).
- `model_name`: Explicit model tag (`gemma2:2b`).
- `prompt_hash`: SHA-256 hash of the input prompt for integrity verification.
- `prompt_text`: Full verbatim prompt dispatched to Ollama.
- `response_text`: Verbatim raw text returned by the model.
- `user_decision`: User outcome (`applied`, `rejected`, `dismissed`).
- `execution_time_ms`: Local latency in milliseconds.

### 5.2 User Audit Control
The user maintains total ownership of the audit log:
- Can inspect all prompts and completions in the Settings panel.
- Can export the audit trail to JSON.
- Can purge the audit table with a single click.

---

## 6. Graceful Degradation & System Resilience

1. **Service Disconnected**: If the Ollama daemon is not running on port 11434, the UI displays a clean status indicator (`AI: Offline (Ollama not running)`). Core functionality remains completely unimpacted.
2. **Model Missing**: If Ollama is active but `gemma2:2b` is not installed, the application presents a non-intrusive instruction: `ollama run gemma2:2b`.
3. **Execution Timeout**: Any local inference request exceeding **30 seconds** is automatically cancelled to prevent local CPU/GPU resource exhaustion.
4. **Context Window Protection**: Prompts enforce strict token limits (maximum 2,048 tokens context window) to ensure predictable RAM/VRAM utilization.
