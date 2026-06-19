# Custom Agentic Workflow Architecture

> Stage-Driven Agent & Open Ecosystem Skills Core — 2026.6.19

---

## 📋 Overview

This repository has been configured with a stage-driven development workflow tailored for custom developments (such as CRM projects). It contains zero files from the original AG Kit except for configuration schemas. All core agents and skills have been replaced with specialized open-ecosystem integrations:

- **4 Custom Specialist Agents** - Built to handle specific stages of the development cycle.
- **14 Selected Skills** - Installed from the open ecosystem (`skills.sh`) to support planning, Stitch design, and MVP builds.

---

## 🏗️ Directory Structure

```plaintext
.agents/
├── ARCHITECTURE.md          # This file
├── agent/                   # 4 Custom Specialist Agents
├── skills/                  # 14 Open-Ecosystem Skills (core replaced)
└── rules/                   # Global Rules (GEMINI.md behavior)
```

---

## 🤖 Custom Stage Agents

Custom AI personas mapped directly to the development lifecycle stages:

| Agent | Target Stage | Core Focus | Skills Used |
| :--- | :--- | :--- | :--- |
| `orchestrator` | All Stages | Multi-agent coordination and pipeline transition supervisor. | workflow-orchestrator, deep-agents-memory |
| `conception-agent` | Stage 1 | Conceptualization, market/financial analysis, visual identity, and software specification. | notebooklm, business-model, deep-agents-memory, claude-api, clean-code |
| `stitch-designer` | Stage 2 & 3 | Layout design, component prototyping in Google Stitch, and specification/asset extraction. | stitch-loop, ui-designer, design-md, stitch-design-taste, grill-me, deep-agents-memory |
| `mvp-builder` | Stage 4 | Translation of design specs and report requirements into clean, modular code. | clean-code, terminal-ops, claude-api, deep-agents-memory |

---

## 🧩 Active Skills (14)

Specialized capabilities and libraries installed in the workspace.

### Core Orchestration & Memory
*   `workflow-orchestrator`: Advanced orchestration guidelines and task delegation.
*   `deep-agents-memory`: Persistent state management and context recall engines.
*   `find-skills`: CLI helper tool to search for new skills.

### Stage 1: Conception & Planning
*   `notebooklm`: Interface tools for Google NotebookLM.
*   `business-model`: Competitor benchmarking, market analysis, and monetization structures.

### Stage 2 & 3: UI/UX Design & Extraction (Google Stitch)
*   `stitch-loop`: Multi-turn design loop manager for Google Stitch.
*   `ui-designer`: Comprehensive layouts, margins, typography, and web design guidelines.
*   `design-md`: Exporter tool to compile design files and extract Stitch layout assets.
*   `stitch-design-taste`: Aesthetic taste rules (glassmorphism, color harmony, visual depth).
*   `grill-me`: Interactive discovery dialogs to align UX expectations.

### Stage 4: Code & Verification
*   `clean-code`: Clean coding practices, self-documenting code, avoiding over-engineering.
*   `terminal-ops`: Shell execution engines, command running, and diagnostics.
*   `claude-api`: Reference library for prompt construction, caching, and model specifications.
*   `git-workflow-and-versioning`: Structures git commit discipline, trunk-based development, and worktree separation.

---

## 📊 Statistics

| Metric | Value |
| :--- | :--- |
| **Total Agents** | 4 |
| **Total Skills** | 15 |
| **Total Workflows** | 0 (Slash commands replaced by custom scripts) |
| **Workflow Engine** | State-driven pipeline with 3 human checkpoints |
