import type { NextApiRequest, NextApiResponse } from "next";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createUser, getUserByEmail } from "utils/auth/d1";
import { hashPassword } from "utils/auth/password";
import { login as writeSession } from "utils/auth/session";


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

  if (!email || !password) {
    return res.status(400).json({ error: "Missing email or password" });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters" });
  }

  try {
    const { env } = await getCloudflareContext({ async: true });
    const existing = await getUserByEmail(env, email);
    if (existing) return res.status(409).json({ error: "Email already in use" });

    const isAdmin = email.toLowerCase() === env.OWNER_EMAIL.toLowerCase();
    const passwordHash = await hashPassword(password);
    const created = await createUser(env, { email, passwordHash, displayName, isAdmin });

    await writeSession(req, res, env, {
      userId: created.id,
      email: created.email,
      isAdmin: created.is_admin === 1,
      displayName: created.display_name,
    });

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
