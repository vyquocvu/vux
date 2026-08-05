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

const COOKIE_NAME = "vux_session";
const TTL_SECONDS = 60 * 60 * 24 * 7;

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

export async function readSession(
  req: IncomingMessage | Request,
  res: ServerResponse | Response,
  env: { SESSION_PASSWORD: string; NEXT_PUBLIC_SITE_URL: string },
): Promise<SessionData> {
  const token = readRequestCookie(req);
  if (!token) return {};
  try {
    const sealed = await ironUnseal(crypto as any, token, passwordFor(env), ironDefaults);
    const parsed = typeof sealed === "string" ? JSON.parse(sealed) : (sealed as SessionData);
    return parsed ?? {};
  } catch {
    // Bad password or tampered cookie — clear it so the browser drops it.
    writeResponseCookie(res, cookieFor(env, "", { clear: true }));
    return {};
  }
}

export async function writeSession(
  req: IncomingMessage | Request,
  res: ServerResponse | Response,
  env: { SESSION_PASSWORD: string; NEXT_PUBLIC_SITE_URL: string },
  data: SessionData,
): Promise<void> {
  void req;
  const sealed = await ironSeal(crypto as any, JSON.stringify(data), passwordFor(env), {
    ...ironDefaults,
    ttl: TTL_SECONDS * 1000,
  });
  writeResponseCookie(res, cookieFor(env, sealed, { maxAge: TTL_SECONDS }));
}

export async function clearSession(
  req: IncomingMessage | Request,
  res: ServerResponse | Response,
  env: { NEXT_PUBLIC_SITE_URL: string; SESSION_PASSWORD: string },
): Promise<void> {
  void req;
  writeResponseCookie(res, cookieFor(env, "", { clear: true }));
}

/**
 * Convenience: returns `{ userId, email, isAdmin, displayName }` parsed out of
 * the cookie, or empty `{}` when there is no session.
 */
export async function getSession(
  req: IncomingMessage | Request,
  res: ServerResponse | Response,
  env: { SESSION_PASSWORD: string; NEXT_PUBLIC_SITE_URL: string },
): Promise<SessionData> {
  return readSession(req, res, env);
}

/** Aliases: keep the old `login`/`logout` shape. */
export const login = writeSession;
export const logout = clearSession;
