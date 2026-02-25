import fs from 'node:fs';
import path from 'node:path';

export const ROOT = process.cwd();
export const CONTRACT_ROOT = path.join(ROOT, 'contract_output', 'modules');

export function listModuleDirs() {
  if (!fs.existsSync(CONTRACT_ROOT)) return [];
  return fs
    .readdirSync(CONTRACT_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(CONTRACT_ROOT, entry.name));
}

export function readJson(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

export function hasFile(filePath) {
  return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
}

export function fail(message, code = 1) {
  console.error(message);
  process.exit(code);
}

export function assert(condition, message, code = 1) {
  if (!condition) fail(message, code);
}

export function endpointKey(method, pathValue) {
  return `${String(method).toUpperCase()} ${pathValue}`;
}

export function collectOpenApiEndpoints(openapiDoc) {
  const endpoints = new Set();
  const paths = openapiDoc?.paths ?? {};

  for (const [pathValue, ops] of Object.entries(paths)) {
    if (!ops || typeof ops !== 'object') continue;
    for (const [method, op] of Object.entries(ops)) {
      if (!op || typeof op !== 'object') continue;
      const methodUpper = method.toUpperCase();
      if (!['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(methodUpper)) continue;
      endpoints.add(endpointKey(methodUpper, pathValue));
    }
  }

  return endpoints;
}

export function collectFeEndpoints(feDetails) {
  const endpoints = new Set();
  const screens = feDetails?.screens ?? [];
  for (const screen of screens) {
    const proposals = screen?.endpointProposals ?? [];
    for (const proposal of proposals) {
      endpoints.add(endpointKey(proposal.method, proposal.path));
    }
  }
  return endpoints;
}

export function collectZodSchemaIds(zodPatch) {
  const ids = new Set();
  for (const schema of zodPatch?.schemas ?? []) {
    if (schema?.schemaId) ids.add(schema.schemaId);
  }
  return ids;
}

export function zodRefToSchemaId(ref) {
  if (typeof ref !== 'string') return null;
  if (!ref.startsWith('zod://')) return null;
  return ref.slice('zod://'.length);
}
