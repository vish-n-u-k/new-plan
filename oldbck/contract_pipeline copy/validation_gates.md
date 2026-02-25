# Validation Gates (Script/CI Detection)

This defines strict, lint-like detection of contract failures.

## Gate 1: FE Artifact Schema Validation

- Input: `fe_details.json`, `zod_patch.json`
- Check: JSON schema validity, required keys, enum validity, duplicate IDs
- Fail code: `FE_SCHEMA_INVALID`

## Gate 2: OpenAPI Structural Validation

- Input: `openapi.json`
- Check: OpenAPI parse validity + style conventions
- Fail code: `OPENAPI_INVALID`

## Gate 3: FE↔OpenAPI Endpoint Parity

- Input: `fe_details.json`, `openapi.json`
- Check: exact match on `{method,path}` for all FE proposals
- Fail code: `ENDPOINT_PARITY_FAIL`

## Gate 4: Zod Ref Parity

- Input: `fe_details.json`, `zod_patch.json`, `openapi.json`
- Check:
  - all `requestSchemaRef` / `responseSchemaRef` exist in Zod patch
  - OpenAPI referenced schema names map to Zod IDs
- Fail code: `SCHEMA_REF_PARITY_FAIL`

## Gate 5: API Policy Conventions

- Input: `openapi.json`
- Check:
  - create endpoints use `201`
  - read endpoints use `200`
  - error responses include `400/401/403/404/500` where applicable
  - auth requirement present when FE `authRequired=true`
- Fail code: `API_POLICY_FAIL`

## Gate 6: DB Contract Traceability

- Input: `prisma_contract.json`, plus FE/BE artifacts
- Check:
  - each model field has `sourceRefs`
  - each `sourceRef` resolves to FE or Zod/OpenAPI elements
- Fail code: `DB_TRACEABILITY_FAIL`

## Gate 7: Breaking Change Control

- Input: previous `openapi.json` baseline + current
- Check: openapi diff
- Fail code: `BREAKING_CHANGE_UNAPPROVED`

---

## Standard Failure Output (`validation_report.json`)

```json
{
  "moduleId": "string",
  "contractVersion": "v1.0.0",
  "passed": false,
  "errors": [
    {
      "code": "ENDPOINT_PARITY_FAIL",
      "severity": "error",
      "message": "POST /api/projects missing in openapi",
      "owner": "be",
      "artifact": "openapi.json",
      "path": "$.paths"
    }
  ],
  "warnings": [],
  "generatedAt": "ISO-8601"
}
```

---

## Suggested NPM Scripts

```json
{
  "scripts": {
    "contract:validate:fe": "node scripts/contracts/validate-fe.mjs",
    "contract:validate:openapi": "node scripts/contracts/validate-openapi.mjs",
    "contract:validate:db": "node scripts/contracts/validate-db.mjs",
    "contract:check:parity": "node scripts/contracts/check-parity.mjs",
    "contract:check:breaking": "node scripts/contracts/check-breaking.mjs",
    "contract:ready": "npm run contract:validate:fe && npm run contract:validate:openapi && npm run contract:check:parity && npm run contract:validate:db && npm run contract:check:breaking"
  }
}
```

If any gate fails, exit with non-zero code.
