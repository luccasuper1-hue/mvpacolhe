import assert from "node:assert/strict";
const base = process.env.PHASE2_BASE_URL || "http://127.0.0.1:8798";
async function call(path, options = {}) {
  const response = await fetch(`${base}${path}`, { ...options, headers: { ...(options.body ? { "content-type": "application/json" } : {}), ...(options.cookie ? { cookie: options.cookie, origin: base } : {}) }, body: options.body ? JSON.stringify(options.body) : undefined });
  const text = await response.text(); let json = null; try { json = JSON.parse(text); } catch {}
  return { response, json, cookie: response.headers.get("set-cookie")?.split(";")[0] };
}
const status = await call("/api"); assert.equal(status.json.pilot_enabled, false); assert.equal(status.response.status, 200);
const login = await call("/api/auth/login", { method: "POST", body: { email: "inst.a@example.com", password: "inst-a-pass-123" } });
assert.equal(login.response.status, 200); assert.ok(login.cookie);
const blocked = await call("/api/institutions/me/professionals", { method: "POST", cookie: login.cookie, body: { name: "Bloqueado", email: "blocked@example.com", crp_registration: "SYN-BLOCK" } });
assert.equal(blocked.response.status, 503); assert.match(blocked.json.detail, /habilitado/i);
console.log(JSON.stringify({ ok: true, pilot_status: status.response.status, authenticated_login: login.response.status, protected_mutation: blocked.response.status }));
