#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const ROOT = path.resolve(process.cwd(), process.env.AGENT_ROOT || ".");
const SCHEMA_DIR = path.join(ROOT, "schemas");
const CACHE_DIR = path.join(ROOT, ".cache");
const AJV_BUNDLE_FILE = path.join(CACHE_DIR, "ajv2020-8.17.1.bundle.js");
const AJV_CDN_URL = "https://cdn.jsdelivr.net/npm/ajv-dist@8.17.1/dist/ajv2020.bundle.js";

function stableSort(arr) {
  return [...arr].sort((a, b) => String(a).localeCompare(String(b)));
}

function listFiles(dirPath) {
  return fs.readdirSync(dirPath).filter((name) => fs.statSync(path.join(dirPath, name)).isFile());
}

function parseJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function isAgentFile(name) {
  return /^\d{2}[a-z]?-.+_agent\.md$/i.test(name);
}

function idPrefix(fileName) {
  const m = fileName.match(/^(\d{2}[a-z]?)-/i);
  return m ? m[1].toLowerCase() : null;
}

function parseOutputsFromPrompt(filePath) {
  const text = fs.readFileSync(filePath, "utf8");
  const lines = text.split(/\r?\n/);
  const out = [];
  let inOutputSection = false;

  for (const raw of lines) {
    const line = raw.trim();
    if (/^##\s+Output(s)?\b/i.test(line)) {
      inOutputSection = true;
      continue;
    }
    if (inOutputSection && /^##\s+/.test(line)) {
      break;
    }
    if (inOutputSection) {
      const bullet = line.match(/^[-*]\s+`([^`]+)`/);
      if (bullet?.[1]) out.push(bullet[1]);
    }
  }

  return stableSort(out);
}

function buildSchemaMap(schemaFiles) {
  const map = new Map();
  let sharedPrd = null;

  for (const file of schemaFiles) {
    if (file === "01-03-prd-shared-output.schema.json") {
      sharedPrd = file;
      continue;
    }
    const id = idPrefix(file);
    if (id) map.set(id, file);
  }

  return { map, sharedPrd };
}

function resolveSchemaForAgent(agentFile, schemaMap, sharedPrd) {
  const id = idPrefix(agentFile);
  if (!id) return null;
  if (schemaMap.has(id)) return schemaMap.get(id);
  if (sharedPrd && ["01", "02", "03", "03a"].includes(id)) return sharedPrd;
  return null;
}

async function ensurePinnedAjvBundle() {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  if (!fs.existsSync(AJV_BUNDLE_FILE)) {
    const res = await fetch(AJV_CDN_URL);
    if (!res.ok) {
      throw new Error(`Unable to download pinned AJV bundle from CDN: ${AJV_CDN_URL}`);
    }
    const code = await res.text();
    fs.writeFileSync(AJV_BUNDLE_FILE, code, "utf8");
  }
}

function loadAjv2020Class() {
  const code = fs.readFileSync(AJV_BUNDLE_FILE, "utf8");
  const context = {
    module: { exports: {} },
    exports: {},
    globalThis: {},
    self: {},
    window: {}
  };
  vm.createContext(context);
  vm.runInContext(code, context, { timeout: 3000 });

  const candidate =
    context.module.exports ||
    context.exports ||
    context.globalThis.Ajv2020 ||
    context.globalThis.ajv2020 ||
    context.self.Ajv2020 ||
    context.window.Ajv2020;

  if (typeof candidate !== "function") {
    throw new Error("Failed to load Ajv2020 constructor from pinned CDN bundle.");
  }
  return candidate;
}

async function getAjvInstance() {
  await ensurePinnedAjvBundle();
  const Ajv2020 = loadAjv2020Class();
  return new Ajv2020({ allErrors: true, strict: false, validateFormats: false });
}

async function runPreflight() {
  const agents = stableSort(listFiles(ROOT).filter(isAgentFile));
  const schemas = stableSort(listFiles(SCHEMA_DIR).filter((f) => f.endsWith(".schema.json")));
  const { map, sharedPrd } = buildSchemaMap(schemas);

  const ajv = await getAjvInstance();
  const schemaCheck = [];
  for (const schemaFile of schemas) {
    const schemaPath = path.join(SCHEMA_DIR, schemaFile);
    let status = "pass";
    let error = null;
    try {
      const schemaJson = parseJson(schemaPath);
      ajv.compile(schemaJson);
    } catch (e) {
      status = "fail";
      error = String(e.message || e);
    }
    schemaCheck.push({ schemaFile, status, error });
  }

  const steps = [];
  for (const agentFile of agents) {
    const outputs = parseOutputsFromPrompt(path.join(ROOT, agentFile));
    const jsonOutputs = outputs.filter((o) => o.toLowerCase().endsWith(".json"));
    const jsonDriven = jsonOutputs.length > 0;
    const mappedSchema = resolveSchemaForAgent(agentFile, map, sharedPrd);

    steps.push({
      agentFile,
      jsonDriven,
      outputCount: outputs.length,
      jsonOutputCount: jsonOutputs.length,
      mappedSchema: mappedSchema || null,
      status: !jsonDriven ? "non_json_ignored" : mappedSchema ? "ready" : "missing_schema"
    });
  }

  const result = {
    mode: "preflight",
    ok: schemaCheck.every((s) => s.status === "pass") && steps.every((s) => s.status !== "missing_schema"),
    root: ROOT,
    counts: {
      agents: steps.length,
      jsonDrivenAgents: steps.filter((s) => s.jsonDriven).length,
      nonJsonAgents: steps.filter((s) => !s.jsonDriven).length,
      missingSchemaAgents: steps.filter((s) => s.status === "missing_schema").length,
      schemaFiles: schemas.length,
      schemaCompileFailures: schemaCheck.filter((s) => s.status === "fail").length
    },
    schemaCheck,
    steps
  };

  console.log(JSON.stringify(result, null, 2));
  process.exit(result.ok ? 0 : 1);
}

async function runValidate(agentFileArg, outputPathArg) {
  if (!agentFileArg || !outputPathArg) {
    console.error("Usage: validate --agent <agentFile> --output <jsonOutputPath>");
    process.exit(2);
  }

  const schemaFiles = stableSort(listFiles(SCHEMA_DIR).filter((f) => f.endsWith(".schema.json")));
  const { map, sharedPrd } = buildSchemaMap(schemaFiles);
  const mappedSchema = resolveSchemaForAgent(agentFileArg, map, sharedPrd);

  if (!mappedSchema) {
    console.log(JSON.stringify({ mode: "validate", ok: false, error: "schema_not_found", agentFile: agentFileArg }, null, 2));
    process.exit(1);
  }

  const outputAbs = path.resolve(process.cwd(), outputPathArg);
  if (!fs.existsSync(outputAbs)) {
    console.log(JSON.stringify({ mode: "validate", ok: false, error: "output_not_found", outputPath: outputAbs }, null, 2));
    process.exit(1);
  }

  let outputJson;
  try {
    outputJson = parseJson(outputAbs);
  } catch (e) {
    console.log(JSON.stringify({ mode: "validate", ok: false, error: "output_not_json", detail: String(e.message || e) }, null, 2));
    process.exit(1);
  }

  const schemaPath = path.join(SCHEMA_DIR, mappedSchema);
  const schemaJson = parseJson(schemaPath);

  const ajv = await getAjvInstance();
  const validate = ajv.compile(schemaJson);
  const passed = Boolean(validate(outputJson));

  const result = {
    mode: "validate",
    ok: passed,
    agentFile: agentFileArg,
    outputPath: outputAbs,
    schemaFile: mappedSchema,
    errors: passed ? [] : (validate.errors || []).map((e) => ({
      instancePath: e.instancePath,
      schemaPath: e.schemaPath,
      keyword: e.keyword,
      message: e.message
    }))
  };

  console.log(JSON.stringify(result, null, 2));
  process.exit(passed ? 0 : 1);
}

async function main() {
  const [mode, ...args] = process.argv.slice(2);

  if (mode === "preflight") {
    await runPreflight();
    return;
  }

  if (mode === "validate") {
    let agentFile = null;
    let outputPath = null;
    for (let i = 0; i < args.length; i += 1) {
      if (args[i] === "--agent") agentFile = args[i + 1];
      if (args[i] === "--output") outputPath = args[i + 1];
    }
    await runValidate(agentFile, outputPath);
    return;
  }

  console.error("Usage:\n  node scripts/validate_agent_json.mjs preflight\n  node scripts/validate_agent_json.mjs validate --agent <agentFile> --output <jsonOutputPath>");
  process.exit(2);
}

main().catch((err) => {
  console.error(String(err?.stack || err));
  process.exit(1);
});
