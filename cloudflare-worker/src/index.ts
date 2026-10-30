export { MongoGateway } from "./db";
import { apiRoute } from "./routes";

export interface Env {
  /** Secrets are configured only at publication time; never commit their values. */
  MONGO_URL: string;
  DB_NAME: string;
  JWT_SECRET: string;
  FRONTEND_URL: string;
  PILOT_RETURN_RESET_TOKEN?: string;
  APP_ENV?: string;
  /** HTTPS endpoint of the chosen transactional-email adapter. */
  RESET_EMAIL_WEBHOOK_URL?: string;
  RESET_EMAIL_WEBHOOK_TOKEN?: string;
  /** Optional HTTPS endpoint of the transactional-email adapter for invitations. */
  INVITE_EMAIL_WEBHOOK_URL?: string;
  INVITE_EMAIL_WEBHOOK_TOKEN?: string;
  /** Versioned pilot documents shown and accepted by users. */
  PILOT_LEGAL_VERSION?: string;
  PILOT_CONTROLLER_NAME?: string;
  PILOT_PRIVACY_EMAIL?: string;
  /** Comma-separated HTTPS room-link host allowlist (exact hosts or subdomains). */
  ROOM_LINK_ALLOWED_HOSTS?: string;
  MONGO_GATEWAY: DurableObjectNamespace;
  ASSETS?: Fetcher;
  TEST_MODE?: string;
  TEST_SEED_SECRET?: string;
  TEST_GATEWAY_URL?: string;
}

function allowedOrigin(request: Request, env: Env) {
  const origin = request.headers.get("origin");
  // This deployment serves the frontend and API from the same Worker origin.
  // Comparing against the request origin also avoids a trailing-slash or
  // missing-variable mismatch in dashboard configuration.
  return origin === new URL(request.url).origin ? origin : undefined;
}

function hasAccessCookie(request: Request) {
  return request.headers.get("cookie")?.split(";").some((part) => part.trim().startsWith("access_token=")) ?? false;
}

const edgeRateBuckets = new Map<string, { count: number; resetAt: number }>();
const rateRule = (request: Request) => {
  if (["GET", "HEAD", "OPTIONS"].includes(request.method)) return undefined;
  const path = new URL(request.url).pathname;
  if (path === "/api/auth/register") return ["register", 10] as const;
  if (path === "/api/auth/forgot-password") return ["forgot", 5] as const;
  if (path === "/api/auth/reset-password") return ["reset", 10] as const;
  if (path.startsWith("/api/auth/invite/") && path.endsWith("/accept")) return ["invite-accept", 10] as const;
  if (path === "/api/students/me/requests") return ["student-request", 20] as const;
  if (path.startsWith("/api/students/me/sessions/") && path.endsWith("/feedback")) return ["feedback", 20] as const;
  if (path === "/api/auth/me/export" || path === "/api/auth/me/deletion-request") return ["rights", 10] as const;
  if (path.startsWith("/api/admin/") || path.startsWith("/api/institutions/me/professionals")) return ["admin-mutation", 20] as const;
  return undefined;
};

function rateLimitFailure(request: Request): Response | undefined {
  const rule = rateRule(request); if (!rule) return undefined;
  const ip = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const key = `${rule[0]}:${ip}`;
  const nowMs = Date.now();
  const existing = edgeRateBuckets.get(key);
  const bucket = !existing || existing.resetAt <= nowMs ? { count: 0, resetAt: nowMs + 60_000 } : existing;
  bucket.count += 1; edgeRateBuckets.set(key, bucket);
  if (bucket.count <= rule[1]) return undefined;
  return new Response(JSON.stringify({ detail: "Muitas solicitações. Tente novamente mais tarde." }), { status: 429, headers: { "content-type": "application/json; charset=utf-8", "retry-after": String(Math.ceil((bucket.resetAt - nowMs) / 1000)) } });
}

function csrfFailure(request: Request, env: Env) {
  // Cookie-authenticated mutations must come from the configured application
  // origin. Bearer-authenticated API clients are unaffected by this browser
  // CSRF guard because they do not automatically attach cookies.
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(request.method) || !hasAccessCookie(request)) return false;
  return request.headers.get("origin") !== new URL(request.url).origin;
}

function withSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set("cache-control", "no-store");
  headers.set("x-content-type-options", "nosniff");
  headers.set("x-frame-options", "DENY");
  headers.set("referrer-policy", "strict-origin-when-cross-origin");
  headers.set("permissions-policy", "camera=(), microphone=(), geolocation=()");
  headers.set("content-security-policy", "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; form-action 'self'; upgrade-insecure-requests");
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function withCors(response: Response, origin?: string): Response {
  const secured = withSecurityHeaders(response);
  const headers = new Headers(secured.headers);
  // API responses can carry personal data. Keep them out of intermediary
  // caches and attach browser protections independent of CORS.
  if (origin) {
    headers.set("access-control-allow-origin", origin);
    headers.set("access-control-allow-credentials", "true");
    headers.append("vary", "Origin");
  }
  return new Response(secured.body, { status: secured.status, statusText: secured.statusText, headers });
}

function corsPreflight(request: Request, env: Env) {
  const origin = allowedOrigin(request, env);
  if (!origin) return new Response(null, { status: 403 });
  return new Response(null, { status: 204, headers: {
    "access-control-allow-origin": origin, "access-control-allow-credentials": "true",
    "access-control-allow-headers": "authorization, content-type",
    "access-control-allow-methods": "GET, POST, PUT, DELETE, OPTIONS",
    "access-control-max-age": "86400", vary: "Origin",
  } });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") return corsPreflight(request, env);
    const url = new URL(request.url);
    if (!url.pathname.startsWith("/api")) return withSecurityHeaders(env.ASSETS ? await env.ASSETS.fetch(request) : new Response("Not found", { status: 404 }));
    const limited = rateLimitFailure(request); if (limited) return withCors(limited, allowedOrigin(request, env));
    if (csrfFailure(request, env)) return withCors(Response.json({ detail: "Origem não autorizada" }, { status: 403 }), allowedOrigin(request, env));
    try {
      return withCors(await apiRoute(request, env, url.pathname), allowedOrigin(request, env));
    } catch {
      console.error("Unhandled API error");
      return withCors(Response.json({ detail: "Erro interno do serviço" }, { status: 500 }), allowedOrigin(request, env));
    }
  },
} satisfies ExportedHandler<Env>;

