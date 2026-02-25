# Global Pattern Extraction Agents

This folder contains agents that extract **cross-module patterns** and **global architectural specifications** from per-module contract outputs.

## When to Run

**Run these agents AFTER all per-module agents (normalize, fe_flow, be_policy, db_interaction) have completed for ALL modules.**

These agents operate on the full set of module outputs to identify:
- Shared services and middleware used across modules
- Global navigation patterns and site structure
- Common database patterns and enums
- Security policies (auth, errors, rate limits)
- Third-party integrations
- Environment configuration requirements
- Production bootstrap data (roles, permissions, RBAC)

## Agents

### 1. global_services_agent.md
**Input:** All `be_policy_flow.json` and `db_flow.json` files  
**Output:** `architect_output/global_services_registry.json`  
**Extracts:** Shared backend services (authService, emailService, etc.)

### 2. global_middleware_agent.md
**Input:** All `be_policy_flow.json` files  
**Output:** `architect_output/global_middleware_registry.json`  
**Extracts:** Deduplicated middleware (request_id, auth_session, rate_limit, etc.)

### 3. global_navigation_agent.md
**Input:** All `fe_flow.json` and `fe_details.json` files  
**Output:** `architect_output/global_navigation.json`, `sitemap.json`  
**Extracts:** Global nav (header, sidebar, footer), full site structure

### 4. global_db_patterns_agent.md
**Input:** All `db_flow.json` and `prisma_contract.json` files  
**Output:** `architect_output/global_db_patterns.json`, `global_enums.json`  
**Extracts:** Common DB patterns (timestamps, soft delete, multi-tenant), all Prisma enums

### 5. global_security_policies_agent.md
**Input:** All `openapi.json` and `be_policy_flow.json` files  
**Output:** `architect_output/global_security_policies.json`  
**Extracts:** Auth strategy, error handling patterns, rate limits, CORS

### 6. global_integrations_agent.md
**Input:** All `openapi.json`, `db_flow.json`, `fe_details.json` files  
**Output:** `architect_output/global_integrations_catalog.json`  
**Extracts:** Third-party integrations (GitHub OAuth, email service, payment gateways)

### 7. global_env_config_agent.md
**Input:** `global_integrations_catalog.json`, `global_security_policies.json`, all `prisma_contract.json` and `openapi.json` files  
**Output:** `architect_output/environment_config_schema.json`  
**Extracts:** All required environment variables with types, descriptions, and validation rules

### 8. production_bootstrap_agent.md
**Input:** All `openapi.json` and `be_policy_flow.json` files  
**Output:** `architect_output/production_bootstrap.json`  
**Extracts:** System roles, permissions, RBAC matrix, super admin user specification (NOT faker test data)

## Execution Order

Run in this order (some can run in parallel):

```
5. global_services_agent
6. global_middleware_agent
7. global_navigation_agent
8. global_db_patterns_agent
9. global_security_policies_agent
10. global_integrations_agent
11. global_env_config_agent (depends on #9, #10)
12. production_bootstrap_agent
```

## Key Principle

These agents **extract and deduplicate**, not **infer per-module**. They identify patterns that appear across multiple modules and consolidate them into single, global specifications for implementation agents.
