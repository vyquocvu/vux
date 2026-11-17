/**
 * Seed a new admin account, or reset the password of an existing one,
 * directly in Cloudflare D1 (local by default, `--remote` for production).
 *
 * Usage:
 *   ADMIN_PASSWORD='s3cret!' node --experimental-strip-types scripts/seed-admin.ts [--remote]
 *   node --experimental-strip-types scripts/seed-admin.ts --remote --email=me@example.com --name=Me
 *
 * If no password is provided via ADMIN_PASSWORD or --password=, a random
 * one is generated and printed once. Existing sessions for the account are
 * revoked and login rate-limit counters are cleared so a locked-out admin
 * can sign in immediately with the new password.
 */
import { writeFileSync, unlinkSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { argv, exit, env } from "node:process";
import { randomBytes, randomUUID } from "node:crypto";
import { hashPassword, verifyPassword } from "../utils/auth/password.ts";

const flag = (name: string): string | undefined => {
  const prefix = `--${name}=`;
  const arg = argv.find((a) => a.startsWith(prefix));
  return arg?.slice(prefix.length);
};

const useRemote = argv.includes("--remote");
const email = (flag("email") ?? env.OWNER_EMAIL ?? "vyquocvu@gmail.com").trim().toLowerCase();
const displayName = flag("name")?.trim();
const providedPassword = env.ADMIN_PASSWORD ?? flag("password");

const escape = (s: string): string => s.replace(/'/g, "''");

const run = (cmd: string, args: string[]): void => {
  const result = spawnSync(cmd, args, { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] });
  if (result.status !== 0) {
    throw new Error(`${cmd} ${args.join(" ")} failed: ${result.stderr}`);
  }
};

const main = async () => {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    throw new Error(`Invalid email: ${email}`);
  }
  if (displayName && displayName.length > 40) {
    throw new Error("Display name must be under 40 characters");
  }

  const generated = !providedPassword;
  const password = providedPassword ?? randomBytes(12).toString("base64url");
  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }

  const passwordHash = await hashPassword(password);
  if (!(await verifyPassword(password, passwordHash))) {
    throw new Error("Hash self-check failed");
  }

  const id = randomUUID();
  const now = Math.floor(Date.now() / 1000);
  const nameSql = displayName ? `'${escape(displayName)}'` : "NULL";
  const sql = [
    `INSERT INTO users (id, email, password_hash, display_name, is_admin, created_at, updated_at)
     VALUES ('${id}', '${escape(email)}', '${escape(passwordHash)}', ${nameSql}, 1, ${now}, ${now})
     ON CONFLICT(email) DO UPDATE SET
       password_hash = excluded.password_hash,
       is_admin = 1,
       display_name = COALESCE(excluded.display_name, users.display_name),
       updated_at = excluded.updated_at;`,
    `DELETE FROM sessions WHERE user_id = (SELECT id FROM users WHERE email = '${escape(email)}');`,
    `DELETE FROM auth_attempts WHERE bucket LIKE 'login:%';`,
  ].join("\n");

  const sqlFile = join(tmpdir(), `vux-admin-${id}.sql`);
  writeFileSync(sqlFile, sql, "utf8");
  try {
    run("npx", ["wrangler", "d1", "execute", "vux", useRemote ? "--remote" : "--local", `--file=${sqlFile}`]);
  } finally {
    unlinkSync(sqlFile);
  }

  console.log(`[seed-admin] upserted admin ${email} (${useRemote ? "remote" : "local"})`);
  if (generated) {
    console.log(`[seed-admin] generated password: ${password}`);
    console.log("[seed-admin] save it now — it is not stored anywhere else");
  }
};

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  exit(1);
});