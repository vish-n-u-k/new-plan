# Architect Flow Pipeline (JSON-first)

This pipeline generates an architect-level FE↔BE↔DB flow map from `contract_output/modules/*`.

## Why this exists

It creates deterministic, machine-consumable architecture artifacts for future agents:
- global cross-module graph
- per-module normalized flow files
- separate unresolved gaps/questions
- separate conflicts/questions (with OpenAPI-preferred recommendation)

## Source priority (conflict handling)

When FE, OpenAPI, and Prisma disagree:
1. **OpenAPI** is recommended source of truth (`recommendedSource: "openapi"`)
2. FE details
3. Prisma contract

Conflicts are never silently auto-resolved. They are emitted to `conflicts_questions.json` with selectable options.

## Scope covered

- FE: route, screen, component/action, interaction → API mapping
- BE: endpoint, auth mode, middleware chain, permission/role checks, validation strategy
- DB: models, relations, indexes, constraints, DB-native triggers, app events/jobs/webhooks
- End-to-end graph: screen action → API → middleware → DB entities/operations → side-effects

## Output artifacts

### Per-Module Outputs
- `architect_output/modules/{moduleId}/normalized.json`
- `architect_output/modules/{moduleId}/fe_flow.json`
- `architect_output/modules/{moduleId}/be_policy_flow.json`
- `architect_output/modules/{moduleId}/db_flow.json`
- `architect_output/modules/{moduleId}/module_flow.json`

### Global Pattern Outputs (NEW)
- `architect_output/global_services_registry.json` — Shared backend services across modules
- `architect_output/global_middleware_registry.json` — Deduplicated middleware definitions
- `architect_output/global_navigation.json` — Global nav patterns (header, sidebar, footer)
- `architect_output/sitemap.json` — Full site structure and route hierarchy
- `architect_output/global_db_patterns.json` — Common DB patterns (timestamps, soft delete, multi-tenant)
- `architect_output/global_enums.json` — All Prisma enums consolidated
- `architect_output/global_security_policies.json` — Auth strategy, error handling, rate limits, CORS
- `architect_output/global_integrations_catalog.json` — Third-party integrations (OAuth, email, APIs)
- `architect_output/environment_config_schema.json` — All required environment variables
- `architect_output/production_bootstrap.json` — System roles, permissions, RBAC matrix, super admin

### Global Graph Outputs
- `architect_output/global_flow.json` — Cross-module flow graph
- `architect_output/traceability.json` — Evidence links from flow nodes to contracts
- `architect_output/gaps_questions.json` — Unknowns + assumptions as MCQ
- `architect_output/conflicts_questions.json` — Cross-source conflicts as MCQ

## Agent Organization

### Per-Module Agents (`prompts/`)
- `normalize_agent.md`
- `fe_flow_agent.md`
- `be_policy_agent.md`
- `db_interaction_agent.md`
- `reconcile_agent.md`
- `decision_pack_agent.md`

### Global Pattern Agents (`prompts/global_patterns/`)
- `global_services_agent.md`
- `global_middleware_agent.md`
- `global_navigation_agent.md`
- `global_db_patterns_agent.md`
- `global_security_policies_agent.md`
- `global_integrations_agent.md`
- `global_env_config_agent.md`
- `production_bootstrap_agent.md`

## Execution sequence

### Phase 1: Per-Module Synthesis (run per module)
1. `prompts/normalize_agent.md` → canonical module facts
2. `prompts/fe_flow_agent.md` → component/action to endpoint edges (uses normalized.json)
3. `prompts/be_policy_agent.md` → middleware + auth/rbac/policy chains (uses normalized.json)
4. `prompts/db_interaction_agent.md` → entities, operations, triggers/events (uses normalized.json + be_policy_flow.json)

### Phase 2: Global Pattern Extraction (run once after all modules)
5. `prompts/global_patterns/global_services_agent.md` → Shared services registry
6. `prompts/global_patterns/global_middleware_agent.md` → Deduplicated middleware catalog
7. `prompts/global_patterns/global_navigation_agent.md` → Global nav + sitemap
8. `prompts/global_patterns/global_db_patterns_agent.md` → DB patterns + enums
9. `prompts/global_patterns/global_security_policies_agent.md` → Security policies (auth, errors, rate limits)
10. `prompts/global_patterns/global_integrations_agent.md` → Third-party integrations catalog
11. `prompts/global_patterns/global_env_config_agent.md` → Environment variable schema
12. `prompts/global_patterns/production_bootstrap_agent.md` → Production seed specification (roles, permissions, RBAC)

### Phase 3: Global Graph Assembly (run once after Phase 2)
13. `prompts/reconcile_agent.md` → Global graph + traceability (references Phase 2 outputs)
14. `prompts/decision_pack_agent.md` → Gaps/conflicts question packs (MCQ + custom option)

## Design choices

- Keep existing `contract_output` unchanged.
- Generate all architect artifacts as derived outputs.
- Use best-effort inference when data is missing; every inference gets confidence + evidence.
- Cleanly separate HTTP APIs from non-HTTP event flows using `flowType` key.

## Generic Runtime-Injectable Protocols

The following protocols are designed to be injected into any agent prompt at runtime:

### 1. Pipeline Tracking Protocol
**File:** `PIPELINE_TRACKING_PROTOCOL.md`

Provides state management and progress tracking for pipeline execution:
- **Append-only event log:** `architect_output/_pipeline_events.jsonl`
- **Regenerated status snapshot:** `architect_output/_pipeline_status.json`
- **Event types:** agent_started, agent_completed, agent_failed, user_decision
- **Agent states:** not_started, in_progress, completed, failed

Agents log events as they execute, enabling mid-pipeline interruption/resume and audit trail.

### 2. Architectural Insights Protocol
**File:** `ARCHITECTURAL_INSIGHTS_PROTOCOL.md`

Provides shared knowledge base for capturing and sharing discoveries across agents:
- **Append-only insights log:** `architect_output/_architectural_insights.jsonl`
- **8 categories:** services, middleware, navigation, db_patterns, security, integrations, env_config, production_bootstrap, general
- **5 insight types:** pattern, decision, constraint, assumption, requirement
- **Scoped reading:** Agents filter by category and `relevant_to` field

Enables early agents to document patterns (e.g., "GitService pattern") for later agents to consume.

### Protocol Integration

Both protocols should be injected into agent prompts at runtime:

```markdown
# Your Agent Task

[agent-specific instructions]

---

# Pipeline Tracking (Runtime Protocol)

[INSERT FULL PIPELINE_TRACKING_PROTOCOL.md HERE]

---

# Architectural Insights (Runtime Protocol)

[INSERT FULL ARCHITECTURAL_INSIGHTS_PROTOCOL.md HERE]

---

Now proceed with your analysis...
```

This ensures all agents have standardized tracking and knowledge-sharing capabilities without duplicating documentation.
