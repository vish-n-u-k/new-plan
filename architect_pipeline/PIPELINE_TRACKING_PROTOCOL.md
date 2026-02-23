# Pipeline Tracking Protocol (Generic, Runtime-Injected)

**Use this protocol with ANY agent.** Inject before running the agent prompt.

---

## Execution Flow (mandatory for all agents)

### Phase 0: Context Extraction
1. Extract `moduleId` from your input path or parameter
   - Example: `contract_output/modules/auth-onboarding/` → `moduleId = "auth-onboarding"`
2. Extract your `agentName` (normalize | fe_flow | be_policy | db_interaction | reconcile | decision_pack | fe_contract | be_contract | db_contract)
3. Determine `phaseName` based on agent:
   - FE/BE/DB contract agents → `phaseA: "contract_extraction"`
   - Architect agents (normalize → decision_pack) → `phaseB: "architect_synthesis"`
   - Future agents → `phaseC: "validation"` or similar

---

### Phase 1: Status Check (before any work)

1. Read `pipeline_tracking/_pipeline_status.json` (if exists)
2. Navigate: `status["phases"][phaseName]["modules"][moduleId][agentName]`
3. Check `.status` field:
   - `"completed"` → **Skip execution.** Agent already ran successfully.
   - `"in_progress"` → **Proceed with caution.** Previous run may have crashed; retry is safe.
   - `"failed"` → **Proceed.** Re-attempt this agent.
   - `"pending"` → **Proceed.** First run for this agent.
   - `"blocked"` → **Skip execution.** Review `.reason` field; wait for dependency.

---

### Phase 2: Startup Event Log

Before any work:

1. Generate timestamp in ISO 8601 format: `"2026-02-23T10:30:00Z"`
2. Create startup event JSON:
   ```json
   {
     "timestamp": "2026-02-23T10:30:00Z",
     "module": "auth-onboarding",
     "agent": "normalize",
     "event": "started",
     "phase": "architect_synthesis",
     "attempt": 1
   }
   ```
3. **Append as single line** to `pipeline_tracking/_pipeline_events.jsonl`
   - Do NOT overwrite; append only
   - Use newline-delimited JSON (JSONL) format

---

### Phase 3: Execute Agent Logic

Run your agent's core logic as designed. 

**During execution:**
- If you detect a dependency is not ready (e.g., fe_flow needs normalized.json), check status and emit a clear "blocked" reason.
- If you hit an error, log it and proceed to Phase 5 (Failure).

---

### Phase 4: Success Path

On successful completion:

1. Write all output files to their designated locations
   - Example: `architect_output/modules/auth-onboarding/normalized.json`
2. Create success event JSON:
   ```json
   {
     "timestamp": "2026-02-23T10:35:45Z",
     "module": "auth-onboarding",
     "agent": "normalize",
     "event": "completed",
     "phase": "architect_synthesis",
     "outputFiles": [
       "architect_output/modules/auth-onboarding/normalized.json"
     ],
     "duration_seconds": 345
   }
   ```
3. **Append** to `pipeline_tracking/_pipeline_events.jsonl`
4. **Regenerate** `pipeline_tracking/_pipeline_status.json` from events (see Phase 6)

---

### Phase 5: Failure Path

On error or inability to complete:

1. **Do NOT write output files** (incomplete work is worse than no work)
2. Create failure event JSON:
   ```json
   {
     "timestamp": "2026-02-23T10:45:00Z",
     "module": "auth-onboarding",
     "agent": "be_policy",
     "event": "failed",
     "phase": "architect_synthesis",
     "error": "DB query timeout while reading prisma_contract.json",
     "stackTrace": "..."
   }
   ```
3. **Append** to `pipeline_tracking/_pipeline_events.jsonl`
4. **Regenerate** `pipeline_tracking/_pipeline_status.json` with error state

---

### Phase 6: Regenerate Status File

After every execution (success or failure):

1. Read all lines from `pipeline_tracking/_pipeline_events.jsonl`
2. For each module+agent pair, find the **last event**
3. Build status structure:
   ```json
   {
     "lastUpdated": "2026-02-23T10:45:00Z",
     "phases": {
       "contract_extraction": {
         "status": "in_progress",
         "modules": {
           "auth-onboarding": {
             "fe_contract": { "status": "completed", "timestamp": "..." },
             "be_contract": { "status": "completed", "timestamp": "..." },
             "db_contract": { "status": "pending", "timestamp": null }
           }
         }
       },
       "architect_synthesis": {
         "status": "in_progress",
         "modules": {
           "auth-onboarding": {
             "normalize": { "status": "completed", "timestamp": "..." },
             "fe_flow": { "status": "completed", "timestamp": "..." },
             "be_policy": { "status": "failed", "timestamp": "...", "error": "..." },
             "db_interaction": { "status": "blocked", "reason": "be_policy incomplete" },
             "reconcile": { "status": "pending" },
             "decision_pack": { "status": "pending" }
           }
         }
       }
     }
   }
   ```
4. **Overwrite** `pipeline_tracking/_pipeline_status.json` with this structure
   - This file is always regenerated from the source-of-truth events log
   - Safe to overwrite because it's deterministic

---

## File Locations (Fixed)

```
pipeline_tracking/
├── _pipeline_events.jsonl      (append-only, source of truth)
└── _pipeline_status.json       (regenerated per run)
```

---

## Usage at Runtime

**When you fire an agent:**

1. Copy this protocol into your prompt
2. Then paste the agent prompt (e.g., normalize_agent.md)
3. Call the combined prompt with context:
   ```
   [PIPELINE_TRACKING_PROTOCOL.md content]
   
   [MODULE_CONTEXT]
   moduleId: "auth-onboarding"
   agentName: "normalize"
   phaseName: "architect_synthesis"
   
   [AGENT_PROMPT]
   [normalize_agent.md content]
   
   [INPUT]
   contract_output/modules/auth-onboarding/
   ```

The agent will automatically:
- Check status on startup
- Log events
- Update tracking files
- Handle retries and failures

---

## Key Principles

1. **Idempotent operations** — Running the same agent twice on same module is safe (second run skips)
2. **Append-only events** — Never delete/modify events; only append
3. **Deterministic status** — Status is always regenerated from events (no inconsistency)
4. **Independent agents** — Each agent works alone; no coordination needed
5. **Concurrent-safe** — Append and regenerate are safe under concurrent writes
6. **Audit trail** — Full history preserved in events log for debugging

---

## Example: Running normalize_agent for auth-onboarding

```
PIPELINE_TRACKING_PROTOCOL.md:
  Extract moduleId → "auth-onboarding"
  Extract agentName → "normalize"
  Extract phaseName → "architect_synthesis"
  
  Phase 1: Read status → "pending"
  Phase 2: Append startup event
  
  normalize_agent.md: [run normalization logic]
  
  Phase 4: Write normalized.json
  Phase 4: Append success event
  Phase 6: Regenerate status
  
Result:
  ✓ architect_output/modules/auth-onboarding/normalized.json created
  ✓ _pipeline_events.jsonl appended with 2 lines (start + completed)
  ✓ _pipeline_status.json shows "completed" for auth-onboarding/normalize
```

Next time you run the same agent:
```
  Phase 1: Read status → "completed"
  Result: ✓ Skip (already done)
```

---

## Integration with Your Workflow

1. **Before firing any agent**, prepend this protocol
2. **Provide module context** (moduleId, agentName, phaseName)
3. **Append the agent prompt** (normalize_agent.md, etc.)
4. **Agent executes** with full tracking
5. **Status updates automatically** — no manual intervention
6. **Query status anytime** — read `_pipeline_status.json`
7. **Retry failed agents** — just fire them again; automatic retry with full audit trail

