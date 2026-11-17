/**
 * Cookie-based session backed by [`iron-webcrypto`](https://github.com/vadimdemedes/iron-webcrypto)
 * (the same primitive `iron-session` uses internally, but without the
 * `uncrypto` peer-dep that doesn't bundle cleanly inside Workers).
 *
 * Algorithm (`seal` = AES-256-GCM with PBKDF2-derived key + HMAC-SHA-256
 * integrity). Output: `iv.encrypted.mac` all base64url-encoded.
 *
 * Cookie attrs:
 *   `HttpOnly; SameSite=Lax; Secure` (when not on http://localhost dev)
 *   `Path=/; Max-Age=604800`
 */
import { seal as ironSeal, unseal as ironUnseal, defaults as ironDefaults } from "iron-webcrypto";
import type { IncomingMessage, ServerResponse } from "http";

export interface SessionData {
  userId?: string;
  email?: string;
  isAdmin?: boolean;
  displayName?: string | null;
}

type SessionEnv = {
  DB: D1Database;
  SESSION_PASSWORD: string;
  NEXT_PUBLIC_SITE_URL: string;
};

interface SessionRow {
  user_id: string;
  email: string;
  display_name: string | null;
  is_admin: number;
  expires_at: number;
}

const COOKIE_NAME = "vux_session";
const TTL_SECONDS = 60 * 60 * 24 * 7;
const MAX_SESSIONS_PER_USER = 5;

const isProd = (env: { NEXT_PUBLIC_SITE_URL: string }): boolean =>
  env.NEXT_PUBLIC_SITE_URL.startsWith("https://");

const cookieFor = (env: { NEXT_PUBLIC_SITE_URL: string }, value: string, opts: { maxAge?: number; clear?: boolean } = {}): string => {
  const prod = isProd(env);
  const maxAge = opts.maxAge ?? TTL_SECONDS;
  const pieces = [
    `${COOKIE_NAME}=${value}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    prod ? "Secure" : "",
    opts.clear ? "Max-Age=0" : `Max-Age=${maxAge}`,
  ].filter(Boolean);
  return pieces.join("; ");
};

const readRequestCookie = (req: IncomingMessage | Request): string | undefined => {
  let header = "";
  if (typeof (req as Request).headers?.get === "function") {
    header = (req as Request).headers.get("cookie") ?? "";
  } else {
    const c = (req as IncomingMessage).headers.cookie;
    header = Array.isArray(c) ? c.join("; ") : c ?? "";
  }
  if (!header) return undefined;
  const match = header.split(/;\s*/).find((c) => c.startsWith(`${COOKIE_NAME}=`));
  return match?.slice(COOKIE_NAME.length + 1);
};

const writeResponseCookie = (
  res: ServerResponse | Response,
  setCookie: string,
): void => {
  // OpenNext's Pages Router adapter exposes a Node-style ServerResponse even
  // in Workers-mode. Detect it first; fall back to a Web Headers interface.
  const r = res as ServerResponse;
  if (typeof (r as any).setHeader === "function") {
    const prev = (r as any).getHeader?.("Set-Cookie");
    if (Array.isArray(prev)) {
      (r as any).setHeader("Set-Cookie", [...prev, setCookie]);
    } else if (typeof prev === "string" && prev.length) {
      (r as any).setHeader("Set-Cookie", [prev, setCookie]);
    } else {
      (r as any).setHeader("Set-Cookie", setCookie);
    }
    return;
  }
  (res as unknown as Response).headers.append("Set-Cookie", setCookie);
};

const passwordFor = (env: { SESSION_PASSWORD: string }): string => env.SESSION_PASSWORD;

const sealSid = async (env: SessionEnv, sid: string): Promise<string> =>
  ironSeal(crypto as any, JSON.stringify({ sid }), passwordFor(env), {
    ...ironDefaults,
    ttl: TTL_SECONDS * 1000,
  });

const unsealSid = async (env: SessionEnv, token: string): Promise<string | null> => {
  const sealed = await ironUnseal(crypto as any, token, passwordFor(env), ironDefaults);
  const parsed = typeof sealed === "string" ? JSON.parse(sealed) : sealed;
  const sid = parsed && typeof parsed === "object" ? (parsed as { sid?: unknown }).sid : null;
  return typeof sid === "string" && sid ? sid : null;
};

/**
 * Cookie holds only a session id. Role and display name are read from D1 on
 * each request, so demoting a user or deleting the row takes effect immediately.
 * Cookies sealed with the old user payload (no `sid`) are dropped.
 */
export async function readSession(
  req: IncomingMessage | Request,
  res: ServerResponse | Response,
  env: SessionEnv,
): Promise<SessionData> {
  const token = readRequestCookie(req);
  if (!token) return {};
  let sid: string | null = null;
  try {
    sid = await unsealSid(env, token);
  } catch {
    writeResponseCookie(res, cookieFor(env, "", { clear: true }));
    return {};
  }
  if (!sid) {
    writeResponseCookie(res, cookieFor(env, "", { clear: true }));
    return {};
  }

  const now = Math.floor(Date.now() / 1000);
  const row = await env.DB
    .prepare(
      `SELECT s.user_id, s.expires_at, u.email, u.display_name, u.is_admin
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.id = ?1
       LIMIT 1`,
    )
    .bind(sid)
    .first<SessionRow>();

  if (!row || row.expires_at <= now) {
    await env.DB.prepare("DELETE FROM sessions WHERE id = ?1").bind(sid).run();
    writeResponseCookie(res, cookieFor(env, "", { clear: true }));
    return {};
  }

  return {
    userId: row.user_id,
    email: row.email,
    isAdmin: row.is_admin === 1,
    displayName: row.display_name,
  };
}

export async function writeSession(
  req: IncomingMessage | Request,
  res: ServerResponse | Response,
  env: SessionEnv,
  userId: string,
): Promise<void> {
  void req;
  const sid = crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);
  await env.DB.prepare("DELETE FROM sessions WHERE expires_at <= ?1").bind(now).run();
  const existing = await env.DB
    .prepare("SELECT id FROM sessions WHERE user_id = ?1 ORDER BY created_at ASC")
    .bind(userId)
    .all<{ id: string }>();
  const rows = existing.results ?? [];
  const drop = rows.length - (MAX_SESSIONS_PER_USER - 1);
  if (drop > 0) {
    for (let i = 0; i < drop; i++) {
      await env.DB.prepare("DELETE FROM sessions WHERE id = ?1").bind(rows[i].id).run();
    }
  }
  await env.DB
    .prepare(
      `INSERT INTO sessions (id, user_id, expires_at, created_at)
       VALUES (?1, ?2, ?3, ?4)`,
    )
    .bind(sid, userId, now + TTL_SECONDS, now)
    .run();
  const sealed = await sealSid(env, sid);
  writeResponseCookie(res, cookieFor(env, sealed, { maxAge: TTL_SECONDS }));
}

export async function clearSession(
  req: IncomingMessage | Request,
  res: ServerResponse | Response,
  env: SessionEnv,
): Promise<void> {
  const token = readRequestCookie(req);
  if (token) {
    try {
      const sid = await unsealSid(env, token);
      if (sid) await env.DB.prepare("DELETE FROM sessions WHERE id = ?1").bind(sid).run();
    } catch {
      // Cookie was already unusable; still clear it below.
    }
  }
  writeResponseCookie(res, cookieFor(env, "", { clear: true }));
}

/**
 * Returns the live user behind the session cookie, or `{}` when there is none.
 */
export async function getSession(
  req: IncomingMessage | Request,
  res: ServerResponse | Response,
  env: SessionEnv,
): Promise<SessionData> {
  return readSession(req, res, env);
}

/** Aliases: keep the old `login`/`logout` shape. `login` stores a session row. */
export const login = writeSession;
export const logout = clearSession;
