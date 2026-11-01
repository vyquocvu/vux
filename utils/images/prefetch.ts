/**
 * Dimension lookup against the `MEDIA` R2 bucket.
 *
 * Only the leading bytes of each object are read: every format `readDimensions`
 * understands carries its size near the start of the file, so a 64 KiB range
 * beats pulling a multi-megabyte original into the isolate on every save.
 */
import { readDimensions } from "./dims.ts";
import type { Dimensions } from "./dims.ts";

const HEADER_BYTES = 65_536;

export function r2KeyForSrc(src: string): string | null {
  const clean = src.split("?")[0].split("#")[0];
  return clean.startsWith("/images/") ? clean.slice(1) : null;
}

/** Resolve every `/images/...` src in one pass. Missing or unrecognised
 *  objects map to `null` rather than throwing — an unknown image is still
 *  renderable, it just cannot reserve layout. */
export async function prefetchDimensions(
  media: R2Bucket,
  srcs: Iterable<string>,
): Promise<Map<string, Dimensions | null>> {
  const keys = new Map<string, string>();
  for (const src of srcs) {
    const key = r2KeyForSrc(src);
    if (key) keys.set(src, key);
  }

  const out = new Map<string, Dimensions | null>();
  await Promise.all(
    [...keys].map(async ([src, key]) => {
      try {
        const object = await media.get(key, {
          range: { offset: 0, length: HEADER_BYTES },
        });
        out.set(src, object ? readDimensions(await object.arrayBuffer()) : null);
      } catch {
        out.set(src, null);
      }
    }),
  );
  return out;
}

/** Turn a prefetched map into the synchronous resolver `annotateContentImages`
 *  wants, falling back to a caller-provided source (e.g. seeded files on disk). */
export function resolverFromMap(
  map: Map<string, Dimensions | null>,
  fallback?: (src: string) => Dimensions | null,
): (src: string) => Dimensions | null {
  return (src) => map.get(src) ?? fallback?.(src) ?? null;
}
