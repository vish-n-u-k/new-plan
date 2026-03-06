# Cross-Agent Red-Flag Resolution Pattern (DB ↔ BE ↔ FE)

Use this when `implementation_red_flags.json` has open/deferred items.

## 1) Canonical files (must resolve first)

- Resolve active status path:
  - `IMPLEMENTATION_STATUS_PATH` if set
  - else active run's `implementation_status.json`
- Resolve active red-flags path:
  - `IMPLEMENTATION_RED_FLAGS_PATH` if set
  - else sibling of active status file
- If unresolved or ambiguous: stop and mark run/module `blocked` with reason `state_file_unresolved`.

## 2) Triage each open/deferred item

For each item with `status in ["open", "deferred", "blocked"]`:
- Reconfirm:
  - `severity`
  - `blocking`
  - `owner`
  - `targetPhase`
- Assign `nextAction` and `dueBy` in status history/resume hints.
- Classify ownership:
  - DB-owned: schema/enums/constraints/retention/indexes/seeds
  - BE-owned: contracts/validation/authz/routes/services/jobs
  - FE-owned: UI-state/guards/client mapping/fallback UX
  - Joint: contract mismatch across layers (must include primary + supporting owner)

## 3) Decision gate (for contract conflicts)

If cross-layer contract mismatch exists:
- Record one explicit decision object in status history:
  - `decisionId`
  - `conflictType`
  - `finalContract`
  - `owners`
  - `effectiveFrom`
- No layer implements speculative fixes before this decision is recorded.

## 4) Fix execution sequence

Apply in this order unless decision states otherwise:
1. Source-of-truth layer fix (usually DB schema or BE contract)
2. Dependent layer alignment (BE or FE)
3. Validation pass in each touched layer
4. Update red flag status (`mitigated` or `resolved`) with evidence

## 5) Evidence standard to close a flag

A flag can be `resolved` only if all exist:
- linked changed files
- test commands run
- test outcomes
- before/after contract/schema evidence
- status history ID references

If evidence is partial, use `mitigated` (not `resolved`).

## 6) Blocking policy

- `severity in ["high", "critical"]` + `blocking=true` => no handoff.
- Non-blocking medium/low flags can proceed only with:
  - explicit mitigation
  - owner and phase assignment
  - concrete follow-up action in resume hints

## 7) Full-stack fixer policy

Default: **Do not** use a full-stack fixer for unresolved conflicts.

Allowed only when all are true:
- contract decision already finalized
- change is mechanical (rename/mapping/wire-up)
- no security/policy/schema ambiguity
- owner approval captured in status history

## 8) Minimal runbook command pattern (manual)

At start of each agent run:
- load canonical state files
- list unresolved red flags for current scope (`global` or module)
- execute owner-layer fixes only
- run tests
- update status + red flags + resume hints in same run
