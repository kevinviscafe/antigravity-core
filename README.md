# AG Kit Core — Master Template

This repository is a customized and pruned core master template designed to automate development pipelines using specialized AI agents, custom workflows, and human-in-the-loop checkpoint approvals. It serves as the base for constructing specific applications (like our CRM).

---

## ⚡ Quick Start: Workflow CLI

The development lifecycle is automated and enforced through a state-driven manager. You can interact with the workflow using the following npm commands:

### 1. Initialize a Pipeline
Initialize either a full cycle or a light feature cycle:
```bash
# Full Project Cycle (Conceptualization ➔ Design ➔ Extraction ➔ Build)
npm run workflow:init full

# Feature Lifecycle (Technical Analysis ➔ Design ➔ Extraction ➔ Build)
npm run workflow:init feature
```

### 2. View Stage Status and Deliverables Validation
Displays the active stage, verification of required files/headers, and checkpoints status:
```bash
npm run workflow:status
```

### 3. Approve a Checkpoint
Approves a pending checkpoint to allow transitioning (e.g., after human design review):
```bash
npm run workflow:approve checkpoint_1
```

### 4. Transition to the Next Stage
Validates deliverables and approvals of the current stage, and advances the workflow:
```bash
npm run workflow:next
```

### 5. Force Stage Transition (Bypass)
Forcefully sets the stage to skip deliverables check (useful for debugging):
```bash
npm run workflow:force <stage_name>
```

---

## 🏗️ Folder Structure

*   `workflows/`: Static pipeline schemas (`pipeline.json`), orchestrator transition logic (`orchestrator.js`), and user CLI (`workflow-cli.js`).
*   `templates/`: Guides for stage deliverables (`executive_report_template.md`, `design_spec_template.md`, `feature_spec_template.md`).
*   `.agents/`: AI agents rules and specialized skills.
    *   `agent/`: Custom stage-based AI profiles (`conception-agent`, `stitch-designer`, `mvp-builder`, `orchestrator`, `explorer-agent`).
    *   `skills/`: Reusable capability libraries (e.g., `stitch-loop`, `notebooklm`, `business-model`, `design-md`).
    *   `rules/`: Behavior guidelines (`GEMINI.md`).

---

## 🤖 Custom Stage Agents

AI agent profiles are customized and routed dynamically by the `orchestrator` based on the active stage:

| Active Stage | Responsibility | Agent Profile | Assigned Skills |
| :--- | :--- | :--- | :--- |
| **INVESTIGATION** | Conception and MVP Spec Planning | `conception-agent` | `notebooklm`, `business-model` |
| **TECHNICAL_ANALYSIS** | Light Feature Specs | `conception-agent` | `api-patterns` |
| **DESIGN** | UI Prototyping in Google Stitch | `stitch-designer` | `stitch-loop`, `ui-designer`, `grill-me`, `stitch-design-taste` |
| **EXTRACTION** | Spec Exporter (design.md & assets) | `stitch-designer` | `design-md` |
| **CONSTRUCTION** | Modular Coding and Compilation | `mvp-builder` | `clean-code`, `verify-changes`, `bash-linux`, `powershell-windows` |
