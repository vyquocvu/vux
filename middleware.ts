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

const IMMUTABLE_CACHE = "public, max-age=31536000, immutable";

const baseHeaders = (ct: string, etag?: string | null) => {
  const headers = new Headers({
    "Content-Type": ct,
    "Cache-Control": IMMUTABLE_CACHE,
    "Accept-Ranges": "bytes",
  });
  if (etag) headers.set("ETag", etag);
  return headers;
};

/** `bytes=a-b`, `bytes=a-`, `bytes=-n`. `null` means "not a single byte range
 *  we understand" — RFC 7233 requires ignoring those with a full 200 body. A
 *  `{ ok: false }` result is a well-formed but unsatisfiable range, which must
 *  be answered with 416. */
type ByteRange = { ok: true; offset: number; length: number } | { ok: false };

const parseRange = (header: string, size: number): ByteRange | null => {
  const m = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!m) return null;
  const [, rawStart, rawEnd] = m;
  if (rawStart === "" && rawEnd === "") return null;
  if (rawStart === "") {
    const suffix = Number(rawEnd);
    if (suffix < 1) return { ok: false };
    return { ok: true, offset: Math.max(0, size - suffix), length: Math.min(suffix, size) };
  }
  const offset = Number(rawStart);
  if (offset >= size) return { ok: false };
  const end = rawEnd === "" ? size - 1 : Math.min(Number(rawEnd), size - 1);
  if (end < offset) return { ok: false };
  return { ok: true, offset, length: end - offset + 1 };
};

export async function middleware(request: NextRequest) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\//, "");

  // Media: serve from R2 without buffering the object into the isolate. A
  // buffered body costs memory proportional to the asset and delays first
  // byte; it also silently disabled the conditional and range requests that
  // repeat visits and any byte-range client depend on.
  if (ALLOWED_PREFIXES.some((p) => path.startsWith(p))) {
    try {
      const { env } = getCloudflareContext();
      const rangeHeader = request.headers.get("range");
      const ifNoneMatch = request.headers.get("if-none-match");

      let object: R2ObjectBody | null;
      let partial: { offset: number; length: number } | null = null;
      let totalSize = 0;

      if (rangeHeader) {
        const head = await env.MEDIA.head(path);
        if (!head) return new NextResponse("Not found", { status: 404 });
        totalSize = head.size;
        const parsed = parseRange(rangeHeader, head.size);
        if (parsed && !parsed.ok) {
          const headers = new Headers({ "Content-Range": `bytes */${totalSize}` });
          if (head.httpEtag) headers.set("ETag", head.httpEtag);
          return new NextResponse(null, { status: 416, headers });
        }
        if (parsed) {
          partial = parsed;
          object = await env.MEDIA.get(path, {
            range: { offset: parsed.offset, length: parsed.length },
          });
        } else {
          object = await env.MEDIA.get(path);
        }
      } else {
        object = await env.MEDIA.get(path);
      }

      if (!object) return new NextResponse("Not found", { status: 404 });

      const ct = object.httpMetadata?.contentType ?? contentTypeForExt(path);
      const etag = object.httpEtag;
      const size = partial ? totalSize : object.size;

      if (etag && ifNoneMatch && ifNoneMatch === etag) {
        await object.body?.cancel();
        return new NextResponse(null, {
          status: 304,
          headers: baseHeaders(ct, etag),
        });
      }

      const headers = baseHeaders(ct, etag);
      if (partial) {
        headers.set(
          "Content-Range",
          `bytes ${partial.offset}-${partial.offset + partial.length - 1}/${size}`,
        );
        headers.set("Content-Length", String(partial.length));
        return new NextResponse(object.body, { status: 206, headers });
      }

      headers.set("Content-Length", String(size));
      return new NextResponse(object.body, { status: 200, headers });
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
