import path from 'node:path';
import { assert, hasFile, listModuleDirs, readJson } from './lib.mjs';

const moduleDirs = listModuleDirs();
assert(moduleDirs.length > 0, '[FE_SCHEMA_INVALID] No module folders found in contract_output/modules', 1);

for (const moduleDir of moduleDirs) {
  const fePath = path.join(moduleDir, 'fe_details.json');
  const zodPath = path.join(moduleDir, 'zod_patch.json');

  assert(hasFile(fePath), `[FE_SCHEMA_INVALID] Missing fe_details.json in ${moduleDir}`, 1);
  assert(hasFile(zodPath), `[FE_SCHEMA_INVALID] Missing zod_patch.json in ${moduleDir}`, 1);

  const fe = readJson(fePath);
  const zod = readJson(zodPath);

  assert(typeof fe.moduleId === 'string' && fe.moduleId.length > 0, `[FE_SCHEMA_INVALID] Invalid moduleId in ${fePath}`, 1);
  assert(Array.isArray(fe.screens), `[FE_SCHEMA_INVALID] screens must be array in ${fePath}`, 1);
  assert(typeof zod.moduleId === 'string' && zod.moduleId.length > 0, `[FE_SCHEMA_INVALID] Invalid moduleId in ${zodPath}`, 1);
  assert(Array.isArray(zod.schemas) && zod.schemas.length > 0, `[FE_SCHEMA_INVALID] schemas must be non-empty array in ${zodPath}`, 1);

  for (const screen of fe.screens) {
    assert(['static', 'api_driven', 'input_driven'].includes(screen.type), `[FE_SCHEMA_INVALID] Invalid screen type in ${fePath}`, 1);
    assert(Array.isArray(screen.endpointProposals), `[FE_SCHEMA_INVALID] endpointProposals must be array in ${fePath}`, 1);
  }
}

console.log('contract:validate:fe passed');
