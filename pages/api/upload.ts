import type { NextApiRequest, NextApiResponse } from "next";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getSession } from "utils/auth/session";
import { readDimensions } from "utils/images/dims.ts";
import { normalizeMediaKey } from "utils/mediaKey";


const MAX_SIZE = 25 * 1024 * 1024; // 25 MiB

const ALLOWED_PREFIXES = ["images/", "audios/"];

const contentTypeForExt = (ext: string): string => {
  switch (ext) {
    case "webp": return "image/webp";
    case "png": return "image/png";
    case "jpg":
    case "jpeg": return "image/jpeg";
    case "avif": return "image/avif";
    case "gif": return "image/gif";
    case "mp3": return "audio/mpeg";
    case "wav": return "audio/wav";
    case "m4a": return "audio/mp4";
    case "ogg": return "audio/ogg";
    default: return "application/octet-stream";
  }
};

const extFor = (key: string): string => {
  const i = key.lastIndexOf(".");
  return i === -1 ? "" : key.slice(i + 1).toLowerCase();
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "private, no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { env } = await getCloudflareContext({ async: true });
    const session = await getSession(req, res, env);
    if (!session.isAdmin) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const path = (req.query.path as string | string[] | undefined);
    const rawKey = Array.isArray(path) ? path.join("/") : (path ?? "");
    const key = normalizeMediaKey(rawKey);
    if (!key || !ALLOWED_PREFIXES.some((p) => key.startsWith(p))) {
      return res.status(400).json({ error: "Invalid path" });
    }
    const ext = extFor(key);
    const mime = contentTypeForExt(ext);
    if (mime === "application/octet-stream" || ext === "svg" || ext === "html" || ext === "htm") {
      return res.status(400).json({ error: "File type not allowed" });
    }

    // OpenNext gives us access to the raw Web Request via `req.request`.
    // Fall back to building one from the URL + headers if not present.
    let webReq: Request | undefined = (req as any).request;
    if (!webReq || typeof webReq.formData !== "function") {
      // As a last-ditch attempt, inspect whatever body Next.js parsed for us.
      const body = (req as any).body;
      if (body && typeof body === "object") {
        const file = body.file;
        if (file && file.data) {
          await env.MEDIA.put(key, file.data, {
            httpMetadata: { contentType: mime },
          });
          return res.status(200).json({
            url: `https://${env.NEXT_PUBLIC_SITE_URL.replace(/^https?:\/\//, "")}/${key}`,
            key,
            size: file.size ?? file.data.byteLength ?? 0,
          });
        }
      }
      return res.status(400).json({ error: "Multipart upload not available in this runtime" });
    }
    const form = await webReq.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return res.status(400).json({ error: "Missing file" });
    if (file.size > MAX_SIZE) return res.status(413).json({ error: "File too large" });

    const body = await file.arrayBuffer();
    await env.MEDIA.put(key, body, {
      httpMetadata: { contentType: mime },
    });

    const dims = readDimensions(body);
    const host = (req.headers.host as string | undefined) ?? env.NEXT_PUBLIC_SITE_URL.replace(/^https?:\/\//, "");
    return res.status(200).json({
      url: `${req.headers["x-forwarded-proto"] ?? "https"}://${host}/${key}`,
      key,
      size: file.size,
      width: dims?.width ?? null,
      height: dims?.height ?? null,
    });
  } catch (error) {
    console.error("upload error", error);
    return res.status(500).json({ error: "Internal error" });
  }
}
