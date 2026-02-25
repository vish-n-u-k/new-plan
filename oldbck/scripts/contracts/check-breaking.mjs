import fs from 'node:fs';
import path from 'node:path';
import { assert, collectOpenApiEndpoints, hasFile, listModuleDirs, readJson } from './lib.mjs';

const baselineRoot = path.join(process.cwd(), 'contract_baseline', 'modules');
const moduleDirs = listModuleDirs();
assert(moduleDirs.length > 0, '[BREAKING_CHANGE_UNAPPROVED] No module folders found in contract_output/modules', 1);

for (const moduleDir of moduleDirs) {
  const moduleName = path.basename(moduleDir);
  const currentPath = path.join(moduleDir, 'openapi.json');
  assert(hasFile(currentPath), `[BREAKING_CHANGE_UNAPPROVED] Missing current openapi.json for ${moduleName}`, 1);

  const baselinePath = path.join(baselineRoot, moduleName, 'openapi.json');
  if (!fs.existsSync(baselinePath)) {
    continue;
  }

  const current = readJson(currentPath);
  const baseline = readJson(baselinePath);

  const currentEndpoints = collectOpenApiEndpoints(current);
  const baselineEndpoints = collectOpenApiEndpoints(baseline);

  for (const endpoint of baselineEndpoints) {
    assert(currentEndpoints.has(endpoint), `[BREAKING_CHANGE_UNAPPROVED] Removed endpoint: ${moduleName} -> ${endpoint}`, 1);
  }
}

console.log('contract:check:breaking passed');
