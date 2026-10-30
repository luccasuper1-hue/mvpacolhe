import assert from "node:assert/strict";

const base = process.env.PHASE2_BASE_URL || "http://127.0.0.1:8798";
const seedSecret = process.env.PHASE2_SEED_SECRET || "phase2-local-seed";
const seen = [];

async function call(path, { method = "GET", body, cookie, headers = {} } = {}) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: { ...(body ? { "content-type": "application/json" } : {}), ...(cookie ? { cookie } : {}), ...(cookie && method !== "GET" ? { origin: base } : {}), ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  let json = null; try { json = text ? JSON.parse(text) : null; } catch { /* non-JSON */ }
  seen.push({ method, path: path.replace(/\/invite\/[^/]+/g, "/invite/<token>").replace(/\/[0-9a-f]{8}-[0-9a-f-]{27,}(?=\/|$)/gi, "/<id>"), status: response.status });
  return { response, json, text, cookie: response.headers.get("set-cookie")?.split(";")[0] };
}
const expect = (result, status) => assert.equal(result.response.status, status, `${result.response.status} != ${status}`);
async function login(email, password) { const result = await call("/api/auth/login", { method: "POST", body: { email, password } }); expect(result, 200); return result.cookie; }

const fixture = {
  institutions: [{ id: "inst-a", name: "Instituição A", code: "OPS-A" }, { id: "inst-b", name: "Instituição B", code: "OPS-B" }],
  users: [
    { id: "admin-1", name: "Admin", email: "ops-admin@example.com", password: "admin-pass-123", role: "admin" },
    { id: "inst-a-user", name: "Gestor A", email: "ops-inst-a@example.com", password: "inst-a-pass-123", role: "institution", institution_id: "inst-a" },
    { id: "inst-b-user", name: "Gestor B", email: "ops-inst-b@example.com", password: "inst-b-pass-123", role: "institution", institution_id: "inst-b" },
    { id: "pro-a-user", name: "Pro A", email: "ops-pro-a@example.com", password: "pro-a-pass-123", role: "professional", institution_id: "inst-a", profile_id: "pro-a" },
    { id: "pro-b-user", name: "Pro B", email: "ops-pro-b@example.com", password: "pro-b-pass-123", role: "professional", institution_id: "inst-b", profile_id: "pro-b" },
  ],
};

expect(await call("/api/test/seed", { method: "POST", headers: { "x-test-seed-secret": seedSecret }, body: fixture }), 200);
const apiHealth = await call("/api"); expect(apiHealth, 200); assert.match(apiHealth.response.headers.get("content-security-policy") || "", /script-src 'self'/);
const assetHealth = await fetch(`${base}/`); assert.match(assetHealth.headers.get("content-security-policy") || "", /frame-ancestors 'none'/);
const bootAsset = await fetch(`${base}/boot.js`); assert.equal(bootAsset.status, 200, "CSP-compatible boot script must load");
const proA = await login("ops-pro-a@example.com", "pro-a-pass-123");
const proB = await login("ops-pro-b@example.com", "pro-b-pass-123");
const instA = await login("ops-inst-a@example.com", "inst-a-pass-123");
const studentA = (await call("/api/auth/register", { method: "POST", body: { name: "Aluno A", email: "ops-student-a@example.com", password: "student-a-pass-123", institution_code: "OPS-A", age_band: "adult", consent: true, terms_accepted: true, privacy_accepted: true } })).cookie;
const studentB = (await call("/api/auth/register", { method: "POST", body: { name: "Aluno B", email: "ops-student-b@example.com", password: "student-b-pass-123", institution_code: "OPS-A", age_band: "adult", consent: true, terms_accepted: true, privacy_accepted: true } })).cookie;

// 1. Two students racing for one slot: exactly one reservation may win.
const slot = (await call("/api/professionals/me/availability", { method: "POST", cookie: proA, body: { date: "2099-02-01", times: ["10:00"] } })).json[0];
const reservations = await Promise.all([studentA, studentB].map((cookie) => call("/api/students/me/requests", { method: "POST", cookie, body: { availability_id: slot.id, reason_code: "conversar" } })));
assert.equal(reservations.filter((r) => r.response.status === 201).length, 1, "one reservation must win");
assert.equal(reservations.filter((r) => r.response.status === 409).length, 1, "one reservation must lose");

// 2. One invite token consumed concurrently: one 200, one 404.
const invite = (await call("/api/institutions/me/professionals", { method: "POST", cookie: instA, body: { name: "Pro convidado", email: "ops-invite@example.com", crp_registration: "SYN-OPS" } })).json;
const inviteToken = invite.invite_path.split("/convite/")[1];
const accepts = await Promise.all([1, 2].map(() => call(`/api/auth/invite/${inviteToken}/accept`, { method: "POST", body: { password: "invite-pass-123", terms_accepted: true, privacy_accepted: true, role_terms_accepted: true } })));
assert.equal(accepts.filter((r) => r.response.status === 200).length, 1, "one invite acceptance must win");
assert.equal(accepts.filter((r) => r.response.status === 404).length, 1, "reused invite must fail");
const invitedCookie = accepts.find((r) => r.response.status === 200).cookie;
expect(await call("/api/professionals/me/availability", { cookie: invitedCookie }), 403);

// 3. Cancellation race: one transition and one conflict.
const cancelSlot = (await call("/api/professionals/me/availability", { method: "POST", cookie: proA, body: { date: "2099-02-02", times: ["10:00"] } })).json[0];
const pending = (await call("/api/students/me/requests", { method: "POST", cookie: studentA, body: { availability_id: cancelSlot.id, reason_code: "conversar" } })).json;
const cancellations = await Promise.all([1, 2].map(() => call(`/api/students/me/requests/${pending.id}/cancel`, { method: "POST", cookie: studentA })));
assert.equal(cancellations.filter((r) => r.response.status === 200).length, 1, "one cancellation must win");
assert.equal(cancellations.filter((r) => r.response.status === 409).length, 1, "duplicate cancellation must conflict");

// 4. Room-link authorization and lifecycle.
const linkSlot = (await call("/api/professionals/me/availability", { method: "POST", cookie: proA, body: { date: "2099-02-03", times: ["10:00"] } })).json[0];
const linkReq = (await call("/api/students/me/requests", { method: "POST", cookie: studentA, body: { availability_id: linkSlot.id, reason_code: "conversar" } })).json;
const pendingView = await call("/api/students/me/requests", { cookie: studentA });
assert.equal(pendingView.json.find((r) => r.id === linkReq.id).room_link, undefined, "pending request must not expose a room link");
expect(await call("/api/students/me/requests"), 401);
expect(await call(`/api/professionals/me/requests/${linkReq.id}/room-link`, { method: "POST", cookie: proA, body: { room_link: "https://meet.example.test/before" } }), 409);
expect(await call(`/api/professionals/me/requests/${linkReq.id}/room-link`, { method: "POST", cookie: proB, body: { room_link: "https://meet.example.test/foreign" } }), 404);
const accepted = await call(`/api/professionals/me/requests/${linkReq.id}/accept`, { method: "POST", cookie: proA }); expect(accepted, 200);
for (const malicious of ["http://meet.example.test/cleartext", "https://meet.example.test.evil.test/redirect", "https://meet.example.test@evil.test/credential", "https://evilmeet.example.test/lookalike", "https://meet.example.test/fragment#token"]) {
  expect(await call(`/api/professionals/me/requests/${linkReq.id}/room-link`, { method: "POST", cookie: proA, body: { room_link: malicious } }), 422);
}
expect(await call(`/api/professionals/me/requests/${linkReq.id}/room-link`, { method: "POST", cookie: proA, body: { room_link: "https://meet.example.test/room" } }), 200);
const own = await call("/api/students/me/requests", { cookie: studentA }); assert.equal(own.json.find((r) => r.id === linkReq.id).room_link, "https://meet.example.test/room");
const foreign = await call("/api/students/me/requests", { cookie: studentB }); assert.equal(foreign.json.some((r) => r.id === linkReq.id), false, "other student must not see this request");
expect(await call(`/api/professionals/me/sessions/${accepted.json.id}/complete`, { method: "POST", cookie: proA }), 200);
expect(await call(`/api/professionals/me/requests/${linkReq.id}/room-link`, { method: "POST", cookie: proA, body: { room_link: "https://meet.example.test/reuse" } }), 409);
expect(await call(`/api/professionals/me/requests/${linkReq.id}/room-link`, { method: "POST", cookie: proB, body: { room_link: "https://meet.example.test/foreign2" } }), 404);

// 5. Negative consent and pending authorization checks.
expect(await call("/api/auth/register", { method: "POST", body: { name: "Sem termos", email: "ops-no-terms@example.com", password: "student-pass-123", institution_code: "OPS-A", age_band: "adult", consent: true, terms_accepted: false, privacy_accepted: true } }), 422);
expect(await call("/api/auth/register", { method: "POST", body: { name: "Menor sem responsável", email: "ops-minor@example.com", password: "student-pass-123", institution_code: "OPS-A", age_band: "minor", consent: true, terms_accepted: true, privacy_accepted: true } }), 422);
const pendingInvite = (await call("/api/institutions/me/professionals", { method: "POST", cookie: instA, body: { name: "Pro pendente", email: "ops-pending@example.com", crp_registration: "SYN-PENDING" } })).json;
const pendingToken = pendingInvite.invite_path.split("/convite/")[1];
expect(await call(`/api/auth/invite/${pendingToken}/accept`, { method: "POST", body: { password: "pending-pass-123", terms_accepted: true, privacy_accepted: false, role_terms_accepted: true } }), 422);

// 6. Authentication throttling: fifth failure is 401, next attempt is 429.
const failures = [];
for (let i = 0; i < 6; i++) failures.push((await call("/api/auth/login", { method: "POST", body: { email: "ops-pro-a@example.com", password: "wrong-password" } })).response.status);
assert.deepEqual(failures.slice(0, 5), [401, 401, 401, 401, 401]);
assert.equal(failures[5], 429);
const resetFailures = [];
for (let i = 0; i < 11; i++) resetFailures.push((await call("/api/auth/reset-password", { method: "POST", body: { token: "invalid-privacy-token", password: "wrong-reset-pass" } })).response.status);
assert.deepEqual(resetFailures.slice(0, 10), Array(10).fill(400));
assert.equal(resetFailures[10], 429);

console.log(JSON.stringify({ ok: true, assertions: 30, results: seen }, null, 2));
