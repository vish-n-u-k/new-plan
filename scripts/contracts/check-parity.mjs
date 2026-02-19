import path from 'node:path';
import {
  assert,
  collectFeEndpoints,
  collectOpenApiEndpoints,
  collectZodSchemaIds,
  hasFile,
  listModuleDirs,
  readJson,
  zodRefToSchemaId,
} from './lib.mjs';

const moduleDirs = listModuleDirs();
assert(moduleDirs.length > 0, '[ENDPOINT_PARITY_FAIL] No module folders found in contract_output/modules', 1);

for (const moduleDir of moduleDirs) {
  const fePath = path.join(moduleDir, 'fe_details.json');
  const zodPath = path.join(moduleDir, 'zod_patch.json');
  const openapiPath = path.join(moduleDir, 'openapi.json');

  assert(hasFile(fePath), `[ENDPOINT_PARITY_FAIL] Missing fe_details.json in ${moduleDir}`, 1);
  assert(hasFile(zodPath), `[SCHEMA_REF_PARITY_FAIL] Missing zod_patch.json in ${moduleDir}`, 1);
  assert(hasFile(openapiPath), `[ENDPOINT_PARITY_FAIL] Missing openapi.json in ${moduleDir}`, 1);

  const fe = readJson(fePath);
  const zod = readJson(zodPath);
  const openapi = readJson(openapiPath);

  const feEndpoints = collectFeEndpoints(fe);
  const beEndpoints = collectOpenApiEndpoints(openapi);

  for (const endpoint of feEndpoints) {
    assert(beEndpoints.has(endpoint), `[ENDPOINT_PARITY_FAIL] Missing endpoint in openapi: ${endpoint}`, 1);
  }

  const zodIds = collectZodSchemaIds(zod);

  for (const screen of fe.screens ?? []) {
    for (const proposal of screen.endpointProposals ?? []) {
      const refs = [proposal.requestSchemaRef, proposal.responseSchemaRef, proposal.errorSchemaRef];
      for (const ref of refs) {
        if (ref === null || ref === undefined) continue;
        const schemaId = zodRefToSchemaId(ref);
        assert(schemaId !== null, `[SCHEMA_REF_PARITY_FAIL] Invalid zod ref format: ${String(ref)}`, 1);
        assert(zodIds.has(schemaId), `[SCHEMA_REF_PARITY_FAIL] Missing schema in zod_patch: ${schemaId}`, 1);
      }
    }
  }
}

console.log('contract:check:parity passed');
