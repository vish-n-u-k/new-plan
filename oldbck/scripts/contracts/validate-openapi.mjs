import path from 'node:path';
import { assert, hasFile, listModuleDirs, readJson } from './lib.mjs';

const moduleDirs = listModuleDirs();
assert(moduleDirs.length > 0, '[OPENAPI_INVALID] No module folders found in contract_output/modules', 1);

for (const moduleDir of moduleDirs) {
  const openapiPath = path.join(moduleDir, 'openapi.json');
  assert(hasFile(openapiPath), `[OPENAPI_INVALID] Missing openapi.json in ${moduleDir}`, 1);

  const doc = readJson(openapiPath);
  assert(typeof doc.openapi === 'string' && doc.openapi.startsWith('3.'), `[OPENAPI_INVALID] openapi version missing/invalid in ${openapiPath}`, 1);
  assert(doc.paths && typeof doc.paths === 'object', `[OPENAPI_INVALID] paths missing in ${openapiPath}`, 1);

  const paths = Object.entries(doc.paths);
  assert(paths.length > 0, `[OPENAPI_INVALID] paths empty in ${openapiPath}`, 1);

  for (const [pathValue, ops] of paths) {
    assert(pathValue.startsWith('/api/'), `[OPENAPI_INVALID] path must start with /api/: ${pathValue}`, 1);
    assert(ops && typeof ops === 'object', `[OPENAPI_INVALID] invalid operations object for ${pathValue}`, 1);
  }
}

console.log('contract:validate:openapi passed');
