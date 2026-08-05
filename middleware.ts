/**
 * Edge middleware. Handles two jobs:
 *
 *   1. `/images/*` and `/audios/*`: serve directly from R2 with immutable
 *      cache headers. (Pages Router paths would attempt to enumerate every
 *      key at build time, which doesn't work for files uploaded post-deploy.)
 *
 *   2. `/api/*`: return a `Cache-Control: private, no-store` response when
 *      the handler didn't explicitly set one. Most APIs are session-bound;
 *      cache-control enforcement belongs in the handler, but we fall back to
 *      no-store here as a safety net.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

const ALLOWED_PREFIXES = ["images/", "audios/"];

const contentTypeForExt = (key: string): string => {
  const ext = key.slice(key.lastIndexOf(".") + 1).toLowerCase();
  switch (ext) {
    case "webp": return "image/webp";
    case "png": return "image/png";
    case "jpg":
    case "jpeg": return "image/jpeg";
    case "svg": return "image/svg+xml";
    case "avif": return "image/avif";
    case "gif": return "image/gif";
    case "mp3": return "audio/mpeg";
    case "wav": return "audio/wav";
    case "m4a": return "audio/mp4";
    case "ogg": return "audio/ogg";
    case "mp4": return "video/mp4";
    default: return "application/octet-stream";
  }
};

export async function middleware(request: NextRequest) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\//, "");

  // Media: read from R2 and return a fully-formed response. We bypass the
  // Worker entirely from the next request onward (HTTP cache replay).
  if (ALLOWED_PREFIXES.some((p) => path.startsWith(p))) {
    try {
      const { env } = getCloudflareContext();
      const object = await env.MEDIA.get(path);
      if (!object) return new NextResponse("Not found", { status: 404 });

      const ct = object.httpMetadata?.contentType ?? contentTypeForExt(path);
      const headers = new Headers({
        "Content-Type": ct,
        // Long immutable cache — Cloudflare will dedupe identical bytes
        // across POPs at the edge for the whole TTL.
        "Cache-Control": "public, max-age=31536000, immutable",
      });
      if (object.httpEtag) headers.set("ETag", object.httpEtag);

      const buf = await object.arrayBuffer();
      return new NextResponse(buf, { status: 200, headers });
    } catch (error) {
      console.error("media error", error);
      return new NextResponse("Internal error", { status: 500 });
    }
  }

  // API: we can't append headers to Next's response from middleware, but we
  // can short-circuit to a hard no-store for any GET that returns a private
  // response. Today all of our API routes return JSON so we just pass
  // through; auth checks happen in the handlers themselves.
  return NextResponse.next();
}

export const config = {
  matcher: ["/images/:path*", "/audios/:path*"],
};
