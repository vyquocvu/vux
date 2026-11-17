import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { hashPassword } from "../../../utils/auth/password";
import { friendlyStr } from "../../../utils/common";

const esc = (s: string): string => s.replace(/'/g, "''");

export function execSql(sql: string): void {
  const file = join(tmpdir(), `vux-e2e-${randomUUID()}.sql`);
  writeFileSync(file, sql, "utf8");
  try {
    const res = spawnSync(
      "npx",
      ["wrangler", "d1", "execute", "vux", "--local", `--file=${file}`],
      { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
    );
    if (res.status !== 0) {
      throw new Error(`wrangler d1 execute failed:\n${res.stdout}\n${res.stderr}`);
    }
  } finally {
    try {
      unlinkSync(file);
    } catch {
      /* ignore */
    }
  }
}

export function createTestPost(opts: {
  title: string;
  content?: string;
  tags?: string[];
  isPublished?: boolean;
}) {
  const uid = `e2e-${randomUUID().slice(0, 12)}`;
  const slug = `${friendlyStr(opts.title)}.${uid}`;
  const now = Math.floor(Date.now() / 1000);
  const content =
    opts.content ??
    `<p>Intro paragraph for E2E verification.</p><h2>Section One</h2><p>Details one.</p><h2>Section Two</h2><p>Details two.</p>`;
  const published = opts.isPublished === false ? 0 : 1;
  const stmts = [
    `INSERT INTO posts (uid, slug, title, thumb_text, thumb_image, publish_content, draft_content, is_published, created_at, updated_at, position)
     VALUES ('${esc(uid)}', '${esc(slug)}', '${esc(opts.title)}', 'E2E summary text', '', '${esc(content)}', '${esc(content)}', ${published}, ${now}, ${now}, 0);`,
  ];
  for (const tag of opts.tags ?? []) {
    stmts.push(`INSERT OR IGNORE INTO tags (post_uid, tag) VALUES ('${esc(uid)}', '${esc(tag)}');`);
  }
  execSql(stmts.join("\n"));
  return { uid, slug, title: opts.title };
}

export async function createTestUser(opts: {
  email: string;
  password: string;
  displayName?: string;
  isAdmin?: boolean;
}) {
  const id = `e2e-user-${randomUUID().slice(0, 12)}`;
  const now = Math.floor(Date.now() / 1000);
  const hash = await hashPassword(opts.password);
  const nameSql = opts.displayName ? `'${esc(opts.displayName)}'` : "NULL";
  execSql(
    `INSERT INTO users (id, email, password_hash, display_name, is_admin, created_at, updated_at)
     VALUES ('${esc(id)}', '${esc(opts.email.toLowerCase())}', '${esc(hash)}', ${nameSql}, ${opts.isAdmin ? 1 : 0}, ${now}, ${now});`,
  );
  return { id, email: opts.email.toLowerCase() };
}

export function cleanupE2E(): void {
  execSql(`
    DELETE FROM comments WHERE post_uid LIKE 'e2e-%' OR content LIKE '[e2e]%';
    DELETE FROM claps WHERE post_uid LIKE 'e2e-%';
    DELETE FROM clap_limits WHERE post_uid LIKE 'e2e-%';
    DELETE FROM tags WHERE post_uid LIKE 'e2e-%';
    DELETE FROM posts WHERE uid LIKE 'e2e-%';
    DELETE FROM sessions WHERE user_id LIKE 'e2e-user-%' OR user_id IN (SELECT id FROM users WHERE email LIKE 'e2e-%@vux.local');
    DELETE FROM users WHERE id LIKE 'e2e-user-%' OR email LIKE 'e2e-%@vux.local';
    DELETE FROM auth_attempts;
  `);
}
