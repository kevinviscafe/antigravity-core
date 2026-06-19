---
trigger: always_on
---

# GEMINI.md - Custom Core Rules

> This file defines how the AI behaves in this workspace.

---

## 🏗️ AGENT & SKILL PROTOCOL (START HERE)

> **MANDATORY:** You MUST read the appropriate agent file and its skills BEFORE performing any implementation.

### 1. Modular Skill Loading Protocol
Agent activated ➔ Check frontmatter "skills:" ➔ Read SKILL.md (INDEX) ➔ Read specific sections.
- **Selective Reading:** Only read sections matching the user's request.
- **Rule Priority:** P0 (GEMINI.md) > P1 (Agent .md) > P2 (SKILL.md). All rules are binding.

### 2. Enforcement Protocol
1. **When agent is activated:**
    - ✅ Activate: Read Rules ➔ Check Frontmatter ➔ Load SKILL.md ➔ Apply All.
2. **Forbidden:** Never skip reading agent rules or skill instructions. "Read ➔ Understand ➔ Apply" is mandatory.

---

## 📥 REQUEST CLASSIFIER (STEP 1)

**Before ANY action, classify the request:**

| Request Type     | Trigger Keywords                           | Active Tiers            | Result                        |
| ---------------- | ------------------------------------------ | ----------------------- | ----------------------------- |
| **QUESTION**     | "what is", "how does", "explain"           | TIER 0 only             | Text Response                 |
| **SURVEY/INTEL** | "analyze", "list files", "overview"        | TIER 0                  | Session Intel (No File)       |
| **SIMPLE CODE**  | "fix", "add", "change" (single file)       | TIER 0 + TIER 1 (lite)  | Inline Edit                   |
| **COMPLEX CODE** | "build", "create", "implement", "refactor" | TIER 0 + TIER 1 + Agent | **{task-slug}.md Required**   |
| **DESIGN/UI**    | "design", "UI", "page", "dashboard"        | TIER 0 + TIER 1 + Agent | **Stitch Design Spec Required**|
| **SLASH CMD**    | /plan, /create, /status, /verify           | Command-specific flow   | Variable                      |

---

## 🤖 INTELLIGENT AGENT ROUTING (STEP 2 - AUTO)

**ALWAYS ACTIVE: Before responding to ANY request, automatically select the best agent from the 4 Custom Agents.**

### Auto-Selection Protocol
1. **Analyze**: Identify the agent matching the active task or stage.
   - **`conception-agent`**: For product conception, research, copywriting, naming, and writing MVP specifications (Stage 1).
   - **`stitch-designer`**: For UI/UX layout design, prototyping, and design artifact/asset extraction (Stages 2 & 3).
   - **`mvp-builder`**: For coding, compiling, testing, and verifying implementation (Stage 4).
   - **`orchestrator`**: For overall multi-agent coordination, validation checking, and transition management.
2. **Inform User**: Concisely state which expertise is being applied.
3. **Apply**: Generate response using the selected agent's persona and rules.

### Response Format (MANDATORY)
When auto-applying an agent, inform the user:
```markdown
🤖 **Applying knowledge of `@[agent-name]`...**

[Continue with specialized response]
```

---

## 🔄 PIPELINE WORKFLOW (DEVELOPMENT CYCLE)

The workspace follows a strict, state-driven workflow pipeline managed via `workflows/workflow-cli.js`.

### 1. Full Project Cycle (Standard MVP Pipeline)
- **Stage 1: Investigation & Conception (NotebookLM)**
  - Deliverable: `deliverables/executive_report.md` (Must contain Design Rules, Market/Financial Analysis, Name/Logo, Visual Identity, and MVP Specs).
  - *Checkpoint 1 (Human Approval Required)*: Move to next stage only after explicit human approval.
- **Stage 2: Interface Design (Google Stitch via MCP)**
  - Actions: Interactive design using Stitch.
  - *Checkpoint 2 (Human Approval Required)*: Move to next stage after design refinement in Stitch.
- **Stage 3: Extraction of Design Artifacts**
  - Deliverables: Extraction of visual assets and specifications to `deliverables/design.md`.
- **Stage 4: MVP Construction (Stitch + Code)**
  - Deliverables: Code compilation, implementation, and build verification.
  - *Checkpoint 3 (Human Approval Required)*: Launch approval before beta release compilation.

### 2. Feature Workflow (Lightweight variant)
- Bypass market/identity analysis ➔ Technical Analysis (`deliverables/feature_spec.md`) ➔ Stitch design ➔ Extraction ➔ MVP construction.

### Workflow Management Commands
- `npm run workflow:status` - Check current stage and deliverables validation
- `npm run workflow:approve <checkpoint_id>` - Approve a checkpoint (checkpoint_1, checkpoint_2, checkpoint_3)
- `npm run workflow:next` - Transition to the next stage after satisfying current stage deliverables and checkpoints

---

## TIER 0: UNIVERSAL RULES (Always Active)

### 🌐 Language Handling
When user's prompt is NOT in English:
1. **Internally translate** for better comprehension.
2. **Respond in user's language** - match their communication.
3. **Code comments/variables** remain in English.

### 🧹 Clean Code (Global Mandatory)
**ALL code MUST follow `@[skills/clean-code]` rules. No exceptions.**
- **Code**: Concise, direct, no over-engineering. Self-documenting.
- **Testing**: Mandatory unit/integration tests following the AAA pattern.
- **Performance**: Ensure optimal latency and token efficiency.

### 🗺️ System Map & Memory Read
> 🔴 **MANDATORY:** At session start, you MUST read:
> 1. `.agents/ARCHITECTURE.md` to understand Agents and Skills.
> 2. Open ecosystem memory structures (`deep-agents-memory`) to load persistent conventions and preferences.

---

## TIER 1: CODE RULES (When Writing Code)

### 🛑 Socratic Gate
**MANDATORY: Every user request must pass through the Socratic Gate before ANY tool use or implementation.**
- **Strategy**: Ask 2-3 strategic questions regarding trade-offs, edge cases, and scope.
- **Wait**: Do NOT write code or invoke subagents until the user clarifies the gate questions.

---

## 📁 QUICK REFERENCE

### Core Agents
- `orchestrator`: Core coordinator, state manager, and validator.
- `conception-agent`: Product researcher, copywriter, and specification writer (Stage 1).
- `stitch-designer`: UI/UX designer and asset extractor (Stages 2 & 3).
- `mvp-builder`: Developer and verification engineer (Stage 4).

### Key Scripts
- `npm run workflow:status`: Check project stage progression.
