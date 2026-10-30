import assert from "node:assert/strict";

const base = process.env.PHASE2_BASE_URL || "http://127.0.0.1:8798";
const seedSecret = process.env.PHASE2_SEED_SECRET || "phase2-local-seed";
const results = [];

async function call(path, { method = "GET", body, cookie, headers = {}, expected } = {}) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: { ...(body ? { "content-type": "application/json" } : {}), ...(cookie ? { cookie } : {}), ...(cookie && method !== "GET" ? { origin: base } : {}), ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  let json = null; try { json = text ? JSON.parse(text) : null; } catch { /* non-JSON */ }
  if (expected !== undefined) { assert.equal(response.status, expected, `${method} ${path}: expected ${expected}, got ${response.status}`); }
  const safePath = path
    .replace(/\/invite\/[^/]+/g, "/invite/<token>")
    .replace(/\/[0-9a-f]{8}-[0-9a-f-]{27,}(?=\/|$)/gi, "/<id>")
    .replace(/\/[0-9a-f]{20,}(?=\/|$)/gi, "/<id>");
  results.push({ method, path: safePath, status: response.status });
  const setCookie = response.headers.get("set-cookie");
  return { response, json, setCookie, text };
}

function cookieOf(result) {
  assert.ok(result.setCookie, "expected an auth cookie");
  return result.setCookie.split(";")[0];
}

async function login(email, password) {
  return cookieOf(await call("/api/auth/login", { method: "POST", body: { email, password }, expected: 200 }));
}

const fixture = {
  institutions: [
    { id: "inst-a", name: "Instituição Sintética A", code: "SYN-A", contact_email: "a@example.com" },
    { id: "inst-b", name: "Instituição Sintética B", code: "SYN-B", contact_email: "b@example.com" },
  ],
  users: [
    { id: "admin-1", name: "Admin Sintético", email: "admin@example.com", password: "admin-pass-123", role: "admin" },
    { id: "inst-user-a", name: "Gestor A", email: "inst.a@example.com", password: "inst-a-pass-123", role: "institution", institution_id: "inst-a" },
    { id: "inst-user-b", name: "Gestor B", email: "inst.b@example.com", password: "inst-b-pass-123", role: "institution", institution_id: "inst-b" },
    { id: "pro-user-a", name: "Profissional A", email: "pro.a@example.com", password: "pro-a-pass-123", role: "professional", institution_id: "inst-a", profile_id: "pro-a" },
    { id: "pro-user-b", name: "Profissional B", email: "pro.b@example.com", password: "pro-b-pass-123", role: "professional", institution_id: "inst-b", profile_id: "pro-b" },
    { id: "expired-user", name: "Convite Expirado", email: "expired@example.com", password: "ignored-pass-123", role: "institution", institution_id: "inst-a", invite_token: "expired-synthetic-token", invite_expires_at: "2000-01-01T00:00:00.000Z" },
  ],
};

await call("/api/test/seed", { method: "POST", headers: { "x-test-seed-secret": seedSecret }, body: fixture, expected: 200 });
const admin = await login("admin@example.com", "admin-pass-123");
const instA = await login("inst.a@example.com", "inst-a-pass-123");
const instB = await login("inst.b@example.com", "inst-b-pass-123");
const proA = await login("pro.a@example.com", "pro-a-pass-123");
const proB = await login("pro.b@example.com", "pro-b-pass-123");

await call("/api/auth/register", { method: "POST", body: { name: "Aluno A", email: "student.a@example.com", password: "student-a-pass-123", institution_code: "SYN-A", age_band: "adult", consent: true, terms_accepted: true, privacy_accepted: true }, expected: 200 });
const studentA = cookieOf(await call("/api/auth/login", { method: "POST", body: { email: "student.a@example.com", password: "student-a-pass-123" }, expected: 200 }));
await call("/api/auth/register", { method: "POST", body: { name: "Aluno B", email: "student.b@example.com", password: "student-b-pass-123", institution_code: "SYN-B", age_band: "adult", consent: true, terms_accepted: true, privacy_accepted: true }, expected: 200 });
const studentB = cookieOf(await call("/api/auth/login", { method: "POST", body: { email: "student.b@example.com", password: "student-b-pass-123" }, expected: 200 }));

const slot = (await call("/api/professionals/me/availability", { method: "POST", cookie: proA, body: { date: "2099-01-01", times: ["10:00"] }, expected: 201 })).json[0];
const requestA = (await call("/api/students/me/requests", { method: "POST", cookie: studentA, body: { availability_id: slot.id, reason_code: "conversar", reason_note: "nota sintética" }, expected: 201 })).json;
await call("/api/students/me/requests", { cookie: studentB, expected: 200 }).then((r) => assert.equal(r.json.length, 0));
const sessionA = (await call(`/api/professionals/me/requests/${requestA.id}/accept`, { method: "POST", cookie: proA, expected: 200 })).json;
await call(`/api/professionals/me/sessions/${sessionA.id}/complete`, { method: "POST", cookie: proA, expected: 200 });
await call(`/api/professionals/me/sessions/${sessionA.id}/referral`, { method: "POST", cookie: proA, body: { status: "orientacao", note: "encaminhamento sintético" }, expected: 201 });
await call(`/api/students/me/sessions/${sessionA.id}/feedback`, { method: "POST", cookie: studentA, body: { score: 5, comment: "avaliação sintética" }, expected: 201 });

const proBRequests = await call("/api/professionals/me/requests", { cookie: proB, expected: 200 }); assert.equal(proBRequests.json.length, 0);
const proBSessions = await call("/api/professionals/me/sessions", { cookie: proB, expected: 200 }); assert.equal(proBSessions.json.length, 0);
await call(`/api/students/me/sessions/${sessionA.id}/feedback`, { method: "POST", cookie: studentB, body: { score: 1 }, expected: 404 });
await call(`/api/professionals/me/sessions/${sessionA.id}/referral`, { method: "POST", cookie: proB, body: { status: "orientacao" }, expected: 404 });
const instBStudents = await call("/api/institutions/me/students", { cookie: instB, expected: 200 }); assert.equal(instBStudents.json.length, 1);
const instBPros = await call("/api/institutions/me/professionals", { cookie: instB, expected: 200 }); assert.equal(instBPros.json.length, 1);
const instBMetrics = await call("/api/institutions/me/metrics", { cookie: instB, expected: 200 }); assert.equal(instBMetrics.json.requests_total, 0);
await call("/api/metrics/global", { cookie: admin, expected: 200 });
const adminUsers = await call("/api/admin/users", { cookie: admin, expected: 200 });
assert.ok(adminUsers.json.every((entry) => !("password_hash" in entry) && !("invite_token" in entry) && !("invite_expires_at" in entry)));
await call("/api/admin/professionals/pro-a/crp-verification", { method: "POST", cookie: proA, body: { verified: false, source: "self" }, expected: 403 });
await call("/api/admin/professionals/pro-a/crp-verification", { method: "POST", cookie: instA, body: { verified: false, source: "institution" }, expected: 403 });
const crpVerification = await call("/api/admin/professionals/pro-a/crp-verification", { method: "POST", cookie: admin, body: { verified: false, source: "synthetic-registry-check" }, expected: 200 });
assert.equal(crpVerification.json.crp_verified, false);
assert.equal(typeof crpVerification.json.crp_verified_at, "string");
assert.equal(crpVerification.json.crp_verified_by, "admin-1");
await call("/api/admin/professionals/pro-a/crp-verification", { method: "POST", cookie: admin, body: { verified: true, source: "synthetic-registry-check" }, expected: 200 });

await call("/api/institutions/me/professionals", { method: "POST", cookie: studentA, body: { name: "Invitado indevido", email: "bad@example.com", crp_registration: "SYN-999" }, expected: 403 });
const directPassword = await call("/api/admin/institutions", { method: "POST", cookie: admin, body: { name: "Direta", code: "SYN-DIRECT", admin_email: "direct@example.com", admin_password: "direct-pass-123" }, expected: 422 });
assert.match(directPassword.json.detail, /convite/i);
const invite = (await call("/api/institutions/me/professionals", { method: "POST", cookie: instA, body: { name: "Profissional Convidado", email: "invite@example.com", crp_registration: "SYN-INVITE" }, expected: 201 })).json;
const inviteToken = invite.invite_path.split("/convite/")[1];
await call(`/api/auth/invite/${inviteToken}/accept`, { method: "POST", body: { password: "invite-pass-123", terms_accepted: true, privacy_accepted: true, role_terms_accepted: true }, expected: 200 });
await call(`/api/auth/invite/${inviteToken}`, { expected: 404 });
await call("/api/auth/invite/expired-synthetic-token", { expected: 410 });
await call(`/api/auth/invite/expired-synthetic-token/accept`, { method: "POST", body: { password: "expired-pass-123", terms_accepted: true, privacy_accepted: true, role_terms_accepted: true }, expected: 410 });

const forgot = await call("/api/auth/forgot-password", { method: "POST", body: { email: "student.a@example.com" }, expected: 200 });
assert.ok(forgot.json.reset_token);
await call("/api/auth/reset-password", { method: "POST", body: { token: forgot.json.reset_token, password: "student-a-new-123" }, expected: 200 });
await call("/api/auth/reset-password", { method: "POST", body: { token: forgot.json.reset_token, password: "student-a-new-456" }, expected: 400 });
await call("/api/auth/reset-password", { method: "POST", body: { token: "invalid-synthetic-token", password: "student-a-new-789" }, expected: 400 });

console.log(JSON.stringify({ ok: true, assertions: results.length, results }, null, 2));
