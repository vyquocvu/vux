/**
 * Helpers around the Cloudflare `DB` binding for user CRUD.
 *
 * These helpers are intentionally small: in Workers' `nodejs_compat` mode we
 * don't get the full `better-sqlite3` surface, but the D1 REST API (via the
 * `env.DB.prepare(...).bind(...).first()` / `.all()` / `.run()`) is enough.
 */

export interface User {
  id: string;
  email: string;
  password_hash: string;
  display_name: string | null;
  is_admin: number;
  created_at: number;
  updated_at: number;
}

export interface PublicUser {
  id: string;
  email: string;
  displayName: string | null;
  isAdmin: boolean;
}

const publicShape = (u: User): PublicUser => ({
  id: u.id,
  email: u.email,
  displayName: u.display_name,
  isAdmin: u.is_admin === 1,
});

export async function getUserByEmail(env: CloudflareEnv, email: string): Promise<User | null> {
  const row = await env.DB
    .prepare("SELECT * FROM users WHERE email = ?1 COLLATE NOCASE LIMIT 1")
    .bind(email)
    .first<User>();
  return row ?? null;
}

export async function getUserById(env: CloudflareEnv, id: string): Promise<User | null> {
  const row = await env.DB
    .prepare("SELECT * FROM users WHERE id = ?1 LIMIT 1")
    .bind(id)
    .first<User>();
  return row ?? null;
}

export async function createUser(
  env: CloudflareEnv,
  user: { email: string; passwordHash: string; displayName?: string; isAdmin?: boolean },
): Promise<User> {
  const id = crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);
  await env.DB
    .prepare(
      `INSERT INTO users (id, email, password_hash, display_name, is_admin, created_at, updated_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?6)`,
    )
    .bind(
      id,
      user.email.toLowerCase(),
      user.passwordHash,
      user.displayName ?? null,
      user.isAdmin ? 1 : 0,
      now,
    )
    .run();
  const created = await getUserById(env, id);
  if (!created) throw new Error("createUser: insert succeeded but row not found");
  return created;
}

export { publicShape as toPublicUser };
