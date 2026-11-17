import type { NextApiRequest, NextApiResponse } from "next";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createUser, getUserByEmail } from "utils/auth/d1";
import { hashPassword } from "utils/auth/password";
import { login as writeSession } from "utils/auth/session";
import { clientHash, isRateLimited, requestIp } from "utils/auth/rate";

const MAX_NAME = 40;


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "private, no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body ?? {};
  const { email, password, displayName } = body as {
    email?: string;
    password?: string;
    displayName?: string;
  };

  const name = typeof displayName === "string" ? displayName.trim() : "";
  if (!email || !password) {
    return res.status(400).json({ error: "Missing email or password" });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters" });
  }
  if (name.length > MAX_NAME) {
    return res.status(400).json({ error: `Display name must be under ${MAX_NAME} characters` });
  }
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "Invalid email" });
  }

  try {
    const { env } = await getCloudflareContext({ async: true });
    const bucket = `signup:${await clientHash(env.SESSION_PASSWORD, requestIp(req))}`;
    if (await isRateLimited(env, bucket, 5, 60 * 60)) {
      return res.status(429).json({ error: "Too many signups. Try again later." });
    }

    const existing = await getUserByEmail(env, email);
    if (existing) return res.status(409).json({ error: "Email already in use" });

    const owner = env.OWNER_EMAIL?.trim().toLowerCase() ?? "";
    const isAdmin = owner.length > 0 && email.toLowerCase() === owner;
    const passwordHash = await hashPassword(password);
    const created = await createUser(env, { email, passwordHash, displayName: name || undefined, isAdmin });

    await writeSession(req, res, env, created.id);

    return res.status(201).json({
      status: true,
      authUser: {
        id: created.id,
        email: created.email,
        displayName: created.display_name,
        isAdmin: created.is_admin === 1,
      },
    });
  } catch (error) {
    console.error("signup error", error);
    return res.status(500).json({ error: "Internal error" });
  }
}
