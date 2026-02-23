# Architectural Insights Protocol

## Purpose
This protocol provides a **shared knowledge base** for capturing and sharing architectural discoveries, patterns, decisions, and insights across agent executions. When included at runtime, agents can:
1. **Write** discoveries as they emerge during analysis
2. **Read** relevant insights from previous agents before starting their work

## Core Principles
- **Append-Only**: Insights are never deleted, only added or superseded
- **Categorized**: Each insight is tagged for easy filtering by relevant agents
- **Contextual**: Every insight includes why it matters and where it came from
- **Scoped**: Agents read only insights relevant to their domain

---

## File Location
```
architect_output/_architectural_insights.jsonl
```

---

## Insight Schema

Each line in `_architectural_insights.jsonl` is a valid JSON object:

```json
{
  "id": "unique-uuid",
  "timestamp": "2026-02-23T14:32:10.123Z",
  "source_agent": "normalize_agent",
  "category": "services",
  "insight_type": "pattern",
  "title": "Git Service Pattern",
  "description": "All git operations should be encapsulated in a dedicated GitService with methods: cloneRepo, createBranch, commitChanges, createPR. This service will be used by environments module, deployments module, and CI/CD workflows.",
  "context": "Discovered while analyzing environments module requirements - multiple modules need git operations but shouldn't duplicate logic",
  "relevant_to": ["global_services_agent", "be_policy_agent", "reconcile_agent"],
  "metadata": {
    "module_id": "environments",
    "priority": "high",
    "status": "active",
    "related_insights": ["uuid-of-related-insight"]
  }
}
```

### Field Definitions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✅ | Unique identifier (UUID v4) |
| `timestamp` | string | ✅ | ISO8601 timestamp when insight was recorded |
| `source_agent` | string | ✅ | Agent that discovered this insight |
| `category` | enum | ✅ | See Categories section below |
| `insight_type` | enum | ✅ | `pattern`, `decision`, `constraint`, `assumption`, `requirement` |
| `title` | string | ✅ | Brief descriptive title (max 80 chars) |
| `description` | string | ✅ | Detailed explanation of the insight |
| `context` | string | ✅ | Why this matters, where it came from |
| `relevant_to` | string[] | ✅ | List of agent IDs that should consume this |
| `metadata` | object | ❌ | Optional contextual data |
| `metadata.module_id` | string | ❌ | If insight is module-specific |
| `metadata.priority` | enum | ❌ | `high`, `medium`, `low` |
| `metadata.status` | enum | ❌ | `active`, `superseded`, `rejected` |
| `metadata.related_insights` | string[] | ❌ | IDs of related insights |

### Categories

```typescript
type Category = 
  | "services"           // Shared service patterns (GitService, NotificationService, etc.)
  | "middleware"         // Express middleware, auth guards, error handlers
  | "navigation"         // Routing patterns, nav structure, breadcrumbs
  | "db_patterns"        // Schema patterns, query optimization, relation strategies
  | "security"           // Auth policies, permission patterns, data isolation
  | "integrations"       // External API patterns, webhook handling
  | "env_config"         // Environment variables, feature flags, runtime config
  | "production_bootstrap" // Seed data, initial setup, default records
  | "general"            // Cross-cutting concerns that don't fit above
```

### Insight Types

- **pattern**: Reusable solution to common problem (e.g., "GitService pattern")
- **decision**: Architectural choice made during analysis (e.g., "Use middleware for auth instead of guards")
- **constraint**: Limitation or rule that affects design (e.g., "All queries must use soft-delete filter")
- **assumption**: Working assumption that needs validation (e.g., "Assuming single git provider per org")
- **requirement**: Discovered functional/non-functional requirement (e.g., "Must support webhook retry logic")

---

## Agent Instructions

### When to Write Insights

Write an insight when you discover:
- ✅ A pattern that multiple modules/agents will need (e.g., "GitService pattern")
- ✅ An architectural decision that affects other agents (e.g., "All auth via middleware")
- ✅ A cross-cutting requirement not in original specs (e.g., "Need webhook retry service")
- ✅ A constraint that limits design choices (e.g., "Must isolate data by orgId")
- ✅ An assumption that needs to be known by others (e.g., "Assuming Stripe for billing")

Don't write insights for:
- ❌ Module-specific implementation details (put in module output)
- ❌ Obvious requirements already in specs
- ❌ Temporary notes or TODOs

### How to Write Insights

**Example Writing Pattern:**

```markdown
I've discovered that multiple modules (environments, deployments, CI/CD) need git operations. Rather than duplicating this logic, I'm documenting a GitService pattern for the global_services_agent to implement.

**Writing to architectural insights log:**

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "timestamp": "2026-02-23T14:32:10.123Z",
  "source_agent": "normalize_agent",
  "category": "services",
  "insight_type": "pattern",
  "title": "GitService Pattern",
  "description": "All git operations should be encapsulated in a dedicated GitService with methods: cloneRepo, createBranch, commitChanges, createPR. This service will be used by environments module (template cloning), deployments module (deploy tracking), and CI/CD workflows.",
  "context": "Discovered while analyzing environments module requirements. Multiple modules need git operations but shouldn't duplicate logic. Centralizing in a service ensures consistent error handling, auth, and webhook integration.",
  "relevant_to": ["global_services_agent", "be_policy_agent", "reconcile_agent"],
  "metadata": {
    "module_id": "environments",
    "priority": "high",
    "status": "active"
  }
}
```
```

### How to Read Insights

**At the start of your execution**, read insights relevant to your domain:

```markdown
**Reading architectural insights log:**

Found 3 relevant insights:

1. **GitService Pattern** (by normalize_agent, category: services)
   - Multiple modules need git ops, centralize in GitService
   - High priority, active

2. **Webhook Retry Service** (by be_policy_agent, category: services)
   - External webhooks need retry logic with exponential backoff
   - Medium priority, active

3. **Service Error Handling Standard** (by global_middleware_agent, category: services)
   - All services must throw AppError with code/message/statusCode
   - High priority, active

I will incorporate these patterns into my analysis...
```

**Filtering by Category:**

- `global_services_agent` → Read `category: "services"`
- `global_middleware_agent` → Read `category: "middleware"`
- `global_security_policies_agent` → Read `category: "security"`
- `reconcile_agent` → Read ALL categories (cross-cutting view)

**Filtering by relevance:**

Only read insights where `relevant_to` includes your agent ID or is empty (applies to all).

---

## Review Mode vs Write Mode

- **Review Mode**: You can read insights, but write operations should be shown to user as "WOULD WRITE" (no file modifications)
- **Write Mode**: After user confirmation, append insights to the file

**Review Mode Example:**
```markdown
**WOULD WRITE (Review Mode):**

📝 Appending to `_architectural_insights.jsonl`:

[JSON object here]

---
Proceed to Write Mode? (yes/no)
```

**Write Mode Example:**
```markdown
✅ Appended insight to `_architectural_insights.jsonl`
```

---

## File Operations

### Appending Insights (Write Mode)

```bash
echo '{"id":"...","timestamp":"..."}' >> architect_output/_architectural_insights.jsonl
```

### Reading Insights

Since this is a JSONL file (one JSON object per line), read the entire file and parse line-by-line:

```bash
cat architect_output/_architectural_insights.jsonl
```

Then filter in your processing logic by:
- `category` matching your domain
- `relevant_to` including your agent ID
- `metadata.status === "active"`

### Superseding Insights

If an insight becomes outdated:
1. Append a NEW insight with updated info
2. Set `metadata.status: "superseded"` in the new record
3. Reference the old insight ID in `metadata.related_insights`
4. The old insight remains in the log but is filtered out by status

---

## Lifecycle

```
┌─────────────────┐
│  Agent starts   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│ Read _architectural_        │
│ insights.jsonl              │
│ Filter by category &        │
│ relevant_to                 │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ Perform analysis            │
│ Discover patterns/decisions │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ Write new insights          │
│ (Review Mode: show user)    │
│ (Write Mode: append to file)│
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ Generate module outputs     │
│ incorporating insights      │
└─────────────────────────────┘
```

---

## Example Integration

**In your agent prompt (runtime injection):**

```markdown
# Architectural Insights

You have access to a shared knowledge base where agents record discoveries.

[INSERT FULL ARCHITECTURAL_INSIGHTS_PROTOCOL.md HERE]

---

**Your Task:**

1. **Read** insights from `architect_output/_architectural_insights.jsonl` filtered by:
   - Category: "services" (your domain)
   - relevant_to: includes "global_services_agent"
   - status: "active"

2. **Analyze** [your specific task]

3. **Write** any new patterns/decisions you discover for other agents

4. **Generate** your output incorporating insights
```

---

## Benefits

✅ **Knowledge Continuity**: Insights from early agents available to later agents  
✅ **Avoid Duplication**: Agents coordinate without manual intervention  
✅ **Audit Trail**: Full history of architectural decisions  
✅ **Scope Control**: Agents only see relevant insights  
✅ **Versioning**: Superseded insights remain for reference  
✅ **Flexibility**: Works across any pipeline phase or agent type  

---

## Notes

- File is created when first insight is written (doesn't need to exist beforehand)
- Empty file is valid (agents handle gracefully)
- Agents should validate JSON schema when reading (skip malformed lines)
- Timestamps use ISO8601 with milliseconds for precise ordering
- UUIDs prevent ID collisions across agents
