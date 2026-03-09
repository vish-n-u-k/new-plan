# Contract Pipeline (No Orchestrator)

This pipeline defines a strict **artifact-driven handshake** between FE, BE, and DB agents without a coordinator/orchestrator agent.

## Objective

Produce implementation-ready specs in this order, module-by-module:

1. FE Agent → `fe_details.{module}.json` + `zod_patch.{module}.json`
2. BE Agent → `openapi.{module}.json`
3. DB Agent → `prisma_contract.{module}.json`

The system is valid only when all contract gates pass.

---

## Canonical Truth & Ownership

- **Canonical schema truth**: `zod_patch.{module}.json` (owned by FE, reviewed by BE)
- **Transport/API truth**: `openapi.{module}.json` (owned by BE)
- **Data model truth**: `prisma_contract.{module}.json` (owned by DB)
- **UI intent truth**: `fe_details.{module}.json` (owned by FE)

Ownership prevents silent drift.

---

## Required Folder Layout

```txt
contract_output/
  index.json
  modules/
    {module_id}/
      fe_details.json
      zod_patch.json
      openapi.json
      prisma_contract.json
      validation_report.json
```

---

## Module State Machine

Each module must move through these states in order:

- `fe_draft` → `fe_agreed`
- `be_draft` → `be_agreed`
- `db_draft` → `db_agreed`
- `frozen`

Rules:
- DB cannot start unless FE+BE are `agreed`.
- Once `frozen`, any change requires `contractVersion` bump.
- Breaking change requires explicit `breakingChange: true` and reason.

---

## Mandatory Metadata (all artifacts)

```json
{
  "moduleId": "string",
  "contractVersion": "v1.0.0",
  "status": "draft|agreed|frozen",
  "changeType": "none|non_breaking|breaking",
  "owners": {
    "fe": "string",
    "be": "string",
    "db": "string"
  },
  "updatedAt": "ISO-8601"
}
```

---

## Validation Contract (must fail CI on violation)

1. **Schema validity**
   - Validate FE JSON / OpenAPI / Prisma contract against JSON schemas.
2. **Parity checks**
   - Every FE proposed endpoint exists in OpenAPI (`path+method`).
   - Every FE request/response schema ref exists in Zod patch.
   - OpenAPI request/response refs map to Zod schema IDs.
3. **Policy checks**
   - Status code conventions (e.g. create=201, fetch=200).
   - Error envelope conventions.
   - Auth/role declarations present where required.
4. **Breaking change checks**
   - Compare current OpenAPI with baseline and fail on unapproved break.

---

## Recommended Commands

- `npm run contract:validate:fe`
- `npm run contract:validate:openapi`
- `npm run contract:validate:db`
- `npm run contract:check:parity`
- `npm run contract:check:breaking`
- `npm run contract:ready`

---

## Why this works without an orchestrator

Consensus is not based on chat. It is based on:
- deterministic files,
- deterministic ownership,
- deterministic CI gates.

If checks pass, contract is accepted. If checks fail, owners fix their side.
