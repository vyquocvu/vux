import type { NextApiRequest, NextApiResponse } from "next";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getUserByEmail } from "utils/auth/d1";
import { verifyPassword } from "utils/auth/password";
import { login as writeSession } from "utils/auth/session";


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "private, no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body ?? {};
  const { email, password } = body as { email?: string; password?: string };
  if (!email || !password) {
    return res.status(400).json({ error: "Missing email or password" });
  }
  try {
    const { env } = await getCloudflareContext({ async: true });
    const user = await getUserByEmail(env, email);
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const ok = await verifyPassword(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    await writeSession(req, res, env, {
      userId: user.id,
      email: user.email,
      isAdmin: user.is_admin === 1,
      displayName: user.display_name,
    });

    return res.status(200).json({
      status: true,
      authUser: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        isAdmin: user.is_admin === 1,
      },
    });
  } catch (error) {
    console.error("login error", error);
    return res.status(500).json({ error: "Internal error" });
  }
}
