import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";

const routes = await readFile(new URL("../src/routes.ts", import.meta.url), "utf8");
const admin = await readFile(new URL("../../backend/app/routers/admin.py", import.meta.url), "utf8");
const auth = await readFile(new URL("../../backend/app/routers/auth.py", import.meta.url), "utf8");

assert.match(routes, /role: "institution", institution_id: institution\.id, active: false, invite_token/);
assert.doesNotMatch(routes, /active: Boolean\(adminPassword\)/);
assert.match(routes, /adminPassword !== undefined && adminPassword !== null && adminPassword !== ""/);
assert.match(admin, /A conta institucional deve ser ativada exclusivamente por convite/);
assert.match(admin, /"active": False/);
assert.match(auth, /payload\.terms_accepted/);
assert.match(auth, /payload\.privacy_accepted/);
assert.match(auth, /payload\.role_terms_accepted/);
console.log("phase2 static authorization checks: PASS");
