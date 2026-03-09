# Manual Multi-Agent Implementation Guide (Sequential, No Orchestrator)

This folder defines a **manual** 3-agent workflow for implementation:
1. DB Agent
2. BE Agent
3. FE Agent

You will run them manually in sequence. No orchestrator agent is used.

---

## Files in this folder

- `01_db_agent.md` → Database implementation prompt (run first per module)
- `02_be_agent.md` → Backend implementation prompt (run second per module)
- `03_fe_agent.md` → Frontend implementation prompt (run third per module)
- `implementation_status.json` → Single shared orchestration log/status file
- `implementation_red_flags.json` → Single shared red-flag register (assumptions, bypasses, conflicts, tech debt, optimization/security concerns)
- `implementation_contract_deltas.json` → Single shared delta register for out-of-contract change requests and reconciliation status

### Canonical state file location (mandatory)

Use workspace-relative discovery; never hardcode absolute machine paths.

Resolution rules:
1. Find the active `implementation_status.json` used for the run.
2. Canonical red-flag file is the sibling file in the same directory: `./implementation_red_flags.json`.
3. If multiple `implementation_red_flags.json` files exist in workspace, only the sibling of active status file is writable; others are read-only historical/legacy unless explicitly migrated.
4. If status file cannot be located, run must be marked `blocked` with reason `state_file_unresolved`.

Recommended environment variables for manual runs:
- `IMPLEMENTATION_STATUS_PATH` (workspace-relative)
- `IMPLEMENTATION_RED_FLAGS_PATH` (workspace-relative; defaults to sibling of status path)

All 3 agents must read and update:
- `implementation_status.json`
- `implementation_red_flags.json`
- `implementation_contract_deltas.json`

---

## Core Rules

1. **Global-first, then modules**
   - First complete global foundation phases:
     - DB global foundation
     - BE global foundation
     - FE global foundation
   - Only then start module loop.

2. **Sequential only**
   - For each module run: DB → BE → FE.
   - Do not run BE before DB completion for the same module.
   - Do not run FE before BE completion for the same module.

3. **Priority-driven modules**
   - Use `architect_output/module_priority_sequence.json`.
   - Follow `buildSequenceFlat` in order.
   - This setup is incremental: module records are added to status JSON when module work starts.

4. **Three mandatory outputs per agent run**
   - Output 1: code changes
   - Output 2: `implementation_status.json` update
   - Output 3: `implementation_red_flags.json` update (when any red flag is detected)

5. **Testing is mandatory phase**
   - Each agent must perform testing at end of its run.
   - Each agent must write testing status to `implementation_status.json` (`tested`, `passed`, `failed`, `skipped`, plus details).

6. **Decisions precedence**
   - If module files contain stale `pending/unresolved` entries, treat these as resolved when global decisions exist in:
     - `architect_output/gaps_questions.json`
     - `architect_output/conflicts_questions.json`

7. **Iterative idempotency is mandatory**
   - Before any implementation, each agent must read existing codebase artifacts for the target scope.
   - Never recreate what already exists (tables, indexes, triggers, enums, routes, services, hooks, components, pages, seed records).
   - Prefer additive, idempotent updates and safe merges over duplication.

8. **Global pattern enforcement is mandatory**
   - Security policies, indexes, retention jobs, middleware ordering, service registry patterns, navigation/sitemap constraints, and module priority constraints must be enforced.

9. **No automatic UI framework installation in FE runs**
   - FE agent must not install or initialize UI kits/frameworks by default.
   - FE must reuse existing components/tokens unless user explicitly requests a UI framework install/migration in the active run.
   - Repeated generator/install commands for UI libraries without explicit request are treated as workflow violations.

10. **Unified API contract is mandatory for BE runs**
   - BE must maintain one canonical OpenAPI/Swagger artifact at `contract_output/global/openapi_unified.json` (or explicit path override).
   - This artifact is created/updated by the BE agent during BE execution; do not pre-create it manually outside the BE run.
   - Any added/changed BE endpoint must update this unified contract in the same run.
   - BE testing must verify runtime route behavior and OpenAPI method/path/status/content-type parity.

11. **Red-flag reporting is mandatory**
   - Any assumption, critical bypass, standards conflict, tech debt, optimization requirement, security concern, or operational/performance/data-integrity risk must be logged in `implementation_red_flags.json`.
   - Use the standard schema and enums in that file.
   - If a high/critical unresolved red flag is blocking progress, the agent must mark run/module status as `blocked` in `implementation_status.json`.

12. **Cross-agent red-flag resolution protocol is mandatory**
    - Every open red flag must have one `owner` and one `nextAction` recorded in status history/resume hints.
    - Resolve using this sequence:
       1) triage and classify (`severity`, `blocking`, `owner`)
       2) owner-layer fix (DB/BE/FE only in its boundary)
       3) dependent-layer adaptation (if needed)
       4) verification (tests + evidence links)
       5) close/update red flag (`mitigated`/`resolved`)
    - Do not use a free-form full-stack fixer for unresolved contract conflicts.
    - A full-stack fixer is allowed only for non-ambiguous, pre-approved, mechanical changes where contract decision is already finalized.

13. **Strict Git workflow is mandatory for every agent run**
   - Parent branch must be explicitly resolved for each run using precedence:
      1) `IMPLEMENTATION_PARENT_BRANCH`
      2) `gitPolicy.parentBranch` from active status file
      3) branch recorded at workflow start in status history
   - Never assume `main` or `master` implicitly.
   - If resolved parent is `main`/`master` through fallback (not explicit env override), run must be marked `blocked` (`git_workflow_violation`).
    - Agents must verify branch context before edits; if branch is invalid, create/switch to correct branch first.
    - Recommended branch prefix: `impl/`.
    - Branch naming strategy:
       - Global runs: `impl/global/<agent>` (examples: `impl/global/db`, `impl/global/be`, `impl/global/fe`)
       - Module runs (shared across DB→BE→FE for sequential flow): `impl/module/<moduleId>`
    - During each run, agent must:
       1) verify current branch matches expected pattern
       2) if currently on non-parent feature branch, switch to resolved parent branch first
       3) create/switch branch from parent when missing (never from non-parent branch)
       4) complete code + status + red-flag updates
       5) request explicit user approval before commit/push/merge actions
       6) after approval, commit with structured summary
       7) push branch to remote
    - Commit message must include explicit agent identity + scope + parent branch + status summary:
       - `feat(db-agent): <scope> | parent=<parentBranch> | status=<completed|blocked|failed> | tests=<passed|failed|skipped>`
       - `feat(be-agent): <scope> | parent=<parentBranch> | status=<completed|blocked|failed> | tests=<passed|failed|skipped>`
       - `feat(fe-agent): <scope> | parent=<parentBranch> | status=<completed|blocked|failed> | tests=<passed|failed|skipped>`
    - Commit body is mandatory and must include at minimum:
       - `Scope`, `Branch`, `Parent-Branch`, `Changes`, `Testing`, `Risks`
    - Merge rule:
       - Merge target must be the resolved parent branch for the run.
       - Merge module branch back to parent only after module status shows DB+BE+FE completed with testing recorded.
       - Merge global branch only after global phase completion criteria are satisfied.
       - Merge is never executed without explicit user approval in that run.
       - Any merge to `master`/`main` when different from resolved parent branch is a workflow violation and must be marked `blocked`.
    - If branch/remote/push checks cannot be completed safely, mark run `blocked` with reason `git_workflow_violation` and log red flag.

14. **Status-first run lock is mandatory**
   - Before git preflight or any code edits, agent must update `implementation_status.json` with run-start lock:
      - set `current.activeAgent`, `current.activeModule`, `current.phase`
      - set layer status to `in_progress` with `startedAt`
      - append run-start `history` entry with resolved state file paths
   - If status lock update fails, run must stop as `blocked` with reason `state_file_unresolved`.

13. **Fast Path mode (explicit user-confirmed only)**
   - Purpose: handle small out-of-contract requests (for example redirect fixes) without full pipeline churn.
   - Trigger condition (all required):
      1) user request is explicitly outside contract,
      2) agent presents delta summary and asks for confirmation,
      3) user explicitly confirms Fast Path before any code edits.
   - Fast Path eligibility:
      - FE-only/BE-only minor behavior correction,
      - no DB schema change,
      - no API method/path/response schema/security model change,
      - no cross-module dependency or priority impact.
   - Mandatory outputs in Fast Path:
      - code change,
      - status update,
      - red-flag update when applicable,
      - delta-log entry in `implementation_contract_deltas.json` with lifecycle: `proposed -> approved -> applied` (or `rejected/deferred`).
   - If eligibility fails, escalate to Full Path and do not proceed as Fast Path.

---

## Architecture File Coverage Map

All global files are used by at least one agent; many are shared across agents.

| Global file | DB | BE | FE |
|---|---:|---:|---:|
| `architect_output/module_priority_sequence.json` | ✅ | ✅ | ✅ |
| `architect_output/global_db_patterns.json` | ✅ | ✅ | ✅ |
| `architect_output/global_enums.json` | ✅ | ✅ | ✅ |
| `architect_output/global_flow.json` | ✅ | ✅ | ✅ |
| `architect_output/global_integrations.json` | ✅ | ✅ | ✅ |
| `architect_output/global_middleware_registry.json` | ✅ | ✅ | ✅ |
| `architect_output/global_navigation.json` | ✅ | ✅ | ✅ |
| `architect_output/global_security_policies.json` | ✅ | ✅ | ✅ |
| `architect_output/global_services_registry.json` | ✅ | ✅ | ✅ |
| `architect_output/environment_config_schema.json` | ✅ | ✅ | ✅ |
| `architect_output/production_bootstrap.json` | ✅ | ✅ | ✅ |
| `architect_output/sitemap.json` | ✅ | ✅ | ✅ |
| `architect_output/traceability.json` | ✅ | ✅ | ✅ |
| `architect_output/gaps_questions.json` | ✅ | ✅ | ✅ |
| `architect_output/conflicts_questions.json` | ✅ | ✅ | ✅ |

---

## Manual Execution Flow

### A) Initialize
- Open `implementation_status.json`.
- Confirm `workflow.mode = "sequential_manual"`.
- Confirm `workflow.gitWorkflowRequired = true` and `gitPolicy` templates before starting run.
- Acquire status-first run lock before any git preflight or code edits.

### B) Global Foundation Phase
Run in this order:
1. DB Agent (global foundation)
2. BE Agent (global foundation)
3. FE Agent (global foundation)

Each must mark its corresponding global phase completed in status JSON.

### C) Module Loop (incremental)
For each next module from priority sequence:
1. DB Agent for module
2. BE Agent for module
3. FE Agent for module

Each agent updates module-specific status + test status + run log.

Before each module run, each agent must do preflight checks:
- read existing code artifacts for target module
- detect already-implemented resources
- apply only missing/delta changes
- log idempotency and duplicate-prevention results in status notes/history

When module work starts, create `modulesProgress[{moduleId}]` with this shape:

```json
{
   "status": "in_progress",
   "layer": 0,
   "db": {
      "status": "not_started",
      "startedAt": null,
      "completedAt": null,
      "notes": "",
      "git": {
         "deliveryStatus": "not_started",
         "approvalStatus": "pending",
         "approvalRequestedAt": null,
         "approvalGrantedAt": null,
         "approvedBy": null,
         "branch": null,
         "parentBranch": null,
         "commitHash": null,
         "pushed": false,
         "mergeReady": false,
         "merged": false,
         "updatedAt": null,
         "notes": ""
      },
      "testing": {
         "status": "not_run",
         "summary": "",
         "commands": [],
         "updatedAt": null
      }
   },
   "be": {
      "status": "not_started",
      "startedAt": null,
      "completedAt": null,
      "notes": "",
      "git": {
         "deliveryStatus": "not_started",
         "approvalStatus": "pending",
         "approvalRequestedAt": null,
         "approvalGrantedAt": null,
         "approvedBy": null,
         "branch": null,
         "parentBranch": null,
         "commitHash": null,
         "pushed": false,
         "mergeReady": false,
         "merged": false,
         "updatedAt": null,
         "notes": ""
      },
      "testing": {
         "status": "not_run",
         "summary": "",
         "commands": [],
         "updatedAt": null
      }
   },
   "fe": {
      "status": "not_started",
      "startedAt": null,
      "completedAt": null,
      "notes": "",
      "git": {
         "deliveryStatus": "not_started",
         "approvalStatus": "pending",
         "approvalRequestedAt": null,
         "approvalGrantedAt": null,
         "approvedBy": null,
         "branch": null,
         "parentBranch": null,
         "commitHash": null,
         "pushed": false,
         "mergeReady": false,
         "merged": false,
         "updatedAt": null,
         "notes": ""
      },
      "testing": {
         "status": "not_run",
         "summary": "",
         "commands": [],
         "updatedAt": null
      }
   },
   "moduleCompletedAt": null
}
```

Git delivery status values used in per-agent `git.deliveryStatus`:
- `not_started`
- `in_progress`
- `completed`
- `blocked`
- `failed`

Git approval status values used in per-agent `git.approvalStatus`:
- `pending`
- `requested`
- `approved`
- `rejected`

Mark module-level `status = "completed"` only when `db`, `be`, and `fe` are all completed.

### D) Resume After Session Loss
Use only `implementation_status.json` to resume:
- `current.activeModule`
- `modulesProgress`
- `history`
- `resumeHints`

Also review `implementation_red_flags.json` before resuming to pick up unresolved risks and deferred actions.

---

## Success Criteria (overall)

- Global phases completed (`db`, `be`, `fe`).
- All modules in priority sequence completed with DB→BE→FE.
- Every run has testing result captured.
- No module is marked complete without status evidence and test metadata.
- Red flags are tracked in standard format with severity, decision, and mitigation metadata.
- `implementation_status.json` is internally consistent and append-only in history.
