import http from "node:http";
import fs from "node:fs/promises";

const args = new Map(process.argv.slice(2).map((value) => { const [key, ...rest] = value.split("="); return [key, rest.join("=")]; }));
const port = Number(args.get("--port") || 8799);
const file = args.get("--file") || ".wrangler/phase2-gateway.json";
let state = {};
try { state = JSON.parse(await fs.readFile(file, "utf8")); } catch { state = {}; }
const docs = (collection) => state[collection] || (state[collection] = []);
const matches = (doc, filter) => Object.entries(filter || {}).every(([key, expected]) => {
  const actual = doc[key];
  if (expected && typeof expected === "object" && !Array.isArray(expected)) {
    if ("$in" in expected && !expected.$in.includes(actual)) return false;
    if ("$exists" in expected && (key in doc) !== Boolean(expected.$exists)) return false;
    if ("$gt" in expected && !(actual !== undefined && actual > expected.$gt)) return false;
    return true;
  }
  return actual === expected;
});
const project = (doc, projection) => {
  if (doc === null || doc === undefined) return doc;
  if (!projection) return { ...doc };
  const included = Object.entries(projection).filter(([, value]) => value === 1).map(([key]) => key);
  if (included.length) return Object.fromEntries(included.filter((key) => key in doc).map((key) => [key, doc[key]]));
  const excluded = new Set(Object.entries(projection).filter(([, value]) => value === 0).map(([key]) => key));
  return Object.fromEntries(Object.entries(doc).filter(([key]) => !excluded.has(key)));
};
async function save() { await fs.mkdir(new URL(".", `file:///${file.replaceAll("\\", "/")}`).pathname, { recursive: true }).catch(() => {}); await fs.writeFile(file, JSON.stringify(state, null, 2)); }
async function handle(body) {
  const { op, collection, filter = {}, projection, options = {}, update = {}, value, upsert = false, many = false, field } = body;
  const list = docs(collection);
  if (op === "findOne") return project(list.find((doc) => matches(doc, filter)) || null, projection);
  if (op === "findMany") { let result = list.filter((doc) => matches(doc, filter)); if (options.sort) { const [[key, direction]] = Object.entries(options.sort); result.sort((a, b) => String(a[key] ?? "").localeCompare(String(b[key] ?? "")) * direction); } return result.slice(0, options.limit ?? result.length).map((doc) => project(doc, options.projection)); }
  if (op === "insert") { list.push({ ...value }); await save(); return null; }
  if (op === "count") return list.filter((doc) => matches(doc, filter)).length;
  if (op === "distinct") return [...new Set(list.filter((doc) => matches(doc, filter)).map((doc) => String(doc[field])).filter(Boolean))];
  if (op === "remove") { let removed = 0; state[collection] = list.filter((doc) => { if (matches(doc, filter) && (many || removed === 0)) { removed++; return false; } return true; }); await save(); return removed; }
  if (op === "update" || op === "findOneAndUpdate") {
    const index = list.findIndex((doc) => matches(doc, filter));
    if (index < 0) { if (!upsert || op === "findOneAndUpdate") return null; state[collection].push({ ...filter, ...(update.$set || {}) }); await save(); return 1; }
    const before = project(list[index], projection); const next = { ...list[index], ...(update.$set || {}) }; for (const key of Object.keys(update.$unset || {})) delete next[key]; list[index] = next; await save(); return op === "findOneAndUpdate" ? before : 1;
  }
  throw new Error(`unsupported operation: ${op}`);
}
const server = http.createServer(async (request, response) => {
  try {
    if (request.method === "GET") { response.writeHead(200, { "content-type": "application/json" }); response.end(JSON.stringify({ ok: true, persistent_file: file })); return; }
    let raw = ""; for await (const chunk of request) raw += chunk; const result = await handle(JSON.parse(raw)); response.writeHead(200, { "content-type": "application/json" }); response.end(JSON.stringify(result));
  } catch (error) { console.error("phase2 gateway error", error); response.writeHead(500, { "content-type": "application/json" }); response.end(JSON.stringify({ error: String(error) })); }
});
server.listen(port, "127.0.0.1", () => console.log(`phase2 gateway listening on http://127.0.0.1:${port} file=${file}`));
