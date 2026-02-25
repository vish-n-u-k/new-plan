import path from 'node:path';
import { assert, hasFile, listModuleDirs, readJson } from './lib.mjs';

const moduleDirs = listModuleDirs();
assert(moduleDirs.length > 0, '[DB_TRACEABILITY_FAIL] No module folders found in contract_output/modules', 1);

for (const moduleDir of moduleDirs) {
  const dbPath = path.join(moduleDir, 'prisma_contract.json');
  assert(hasFile(dbPath), `[DB_TRACEABILITY_FAIL] Missing prisma_contract.json in ${moduleDir}`, 1);

  const contract = readJson(dbPath);
  assert(Array.isArray(contract.models) && contract.models.length > 0, `[DB_TRACEABILITY_FAIL] models must be non-empty in ${dbPath}`, 1);

  for (const model of contract.models) {
    assert(Array.isArray(model.fields) && model.fields.length > 0, `[DB_TRACEABILITY_FAIL] model fields must be non-empty for ${model.model}`, 1);
    for (const field of model.fields) {
      assert(Array.isArray(field.sourceRefs) && field.sourceRefs.length > 0, `[DB_TRACEABILITY_FAIL] field sourceRefs required for ${model.model}.${field.name}`, 1);
    }
  }
}

console.log('contract:validate:db passed');
