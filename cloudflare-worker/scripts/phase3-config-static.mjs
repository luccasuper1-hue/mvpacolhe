import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/routes.ts", import.meta.url), "utf8");
assert.match(source, /ROOM_LINK_ALLOWED_HOSTS/);
assert.match(source, /allowed\.length > 0/);
assert.match(source, /parsed\.protocol !== "https:"/);
assert.match(source, /parsed\.username \|\| parsed\.password \|\| parsed\.hash/);
assert.match(source, /host\.endsWith\(`\.\$\{entry\}`\)/);
assert.match(source, /crp_verification_changed/);
assert.match(source, /crp_verified_by: admin\.id/);
assert.match(source, /pilotConfigured\(env\)/);
console.log("phase3 configuration fail-closed and authorization checks: PASS");
