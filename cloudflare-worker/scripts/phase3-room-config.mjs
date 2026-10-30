import assert from "node:assert/strict";

const base = process.env.PHASE2_BASE_URL || "http://127.0.0.1:8798";
const seedSecret = process.env.PHASE2_SEED_SECRET || "phase2-local-seed";
const expectedRoomStatus = Number(process.env.EXPECTED_ROOM_STATUS || 422);
async function call(path, { method = "GET", body, cookie, headers = {} } = {}) {
  const response = await fetch(`${base}${path}`, { method, headers: { ...(body ? { "content-type": "application/json" } : {}), ...(cookie ? { cookie } : {}), ...(cookie && method !== "GET" ? { origin: base } : {}), ...headers }, body: body ? JSON.stringify(body) : undefined });
  const text = await response.text(); let json = null; try { json = text ? JSON.parse(text) : null; } catch {}
  return { response, json };
}
const fixture = { institutions: [{ id: "rc-inst", name: "Instituição RC Sintética", code: "RC-A" }], users: [
  { id: "rc-admin", name: "Admin RC", email: "rc-admin@example.test", password: "rc-admin-pass-123", role: "admin" },
  { id: "rc-pro", name: "Profissional RC", email: "rc-pro@example.test", password: "rc-pro-pass-123", role: "professional", institution_id: "rc-inst", profile_id: "rc-pro-profile" },
] };
assert.equal((await call("/api/test/seed", { method: "POST", headers: { "x-test-seed-secret": seedSecret }, body: fixture })).response.status, 200);
const login = await call("/api/auth/login", { method: "POST", body: { email: "rc-pro@example.test", password: "rc-pro-pass-123" } }); assert.equal(login.response.status, 200);
const student = await call("/api/auth/register", { method: "POST", body: { name: "Estudante RC", email: "rc-student@example.test", password: "rc-student-pass-123", institution_code: "RC-A", age_band: "adult", consent: true, terms_accepted: true, privacy_accepted: true } }); assert.equal(student.response.status, 200);
const slot = (await call("/api/professionals/me/availability", { method: "POST", cookie: login.response.headers.get("set-cookie")?.split(";")[0], body: { date: "2099-12-04", times: ["10:00"] } })).json[0]; assert.ok(slot?.id);
const studentCookie = student.response.headers.get("set-cookie")?.split(";")[0];
const request = await call("/api/students/me/requests", { method: "POST", cookie: studentCookie, body: { availability_id: slot.id, reason_code: "conversar" } }); assert.equal(request.response.status, 201);
assert.equal((await call(`/api/professionals/me/requests/${request.json.id}/accept`, { method: "POST", cookie: login.response.headers.get("set-cookie")?.split(";")[0] })).response.status, 200);
const room = await call(`/api/professionals/me/requests/${request.json.id}/room-link`, { method: "POST", cookie: login.response.headers.get("set-cookie")?.split(";")[0], body: { room_link: "https://meet.example.test/rc" } });
assert.equal(room.response.status, expectedRoomStatus, `expected ${expectedRoomStatus}, got ${room.response.status}`);
console.log(JSON.stringify({ ok: true, room_status: room.response.status, expected: expectedRoomStatus }));
