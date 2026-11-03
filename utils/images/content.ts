/**
 * Annotate the `<img>` tags Quill stores inside `publish_content` /
 * `draft_content` so the browser can reserve layout before bytes arrive.
 *
 * Quill's ImageResize module writes a display `width` (and sometimes an inline
 * `style` width) but never a `height`, which is the worst case for layout
 * shift: the browser guesses, then reflows on load. This helper fills in the
 * intrinsic pair — honouring any display width already present — and pins lazy
 * decoding.
 */
import type { Dimensions } from "./dims.ts";
import { parseAttrs, serializeTag } from "../html.ts";
import type { AttrMap } from "../html.ts";

export type DimensionResolver = (src: string) => Dimensions | null | undefined;

const serializedWidth = (attrs: AttrMap): number | null => {
  const styleWidth = /(?:^|;)\s*width\s*:\s*(\d+(?:\.\d+)?)px/i.exec(attrs.get("style")?.value ?? "");
  if (styleWidth) return Number(styleWidth[1]);
  const w = attrs.get("width")?.value;
  if (w && /^\d+(\.\d+)?$/.test(w.trim())) return Number(w.trim());
  return null;
};

/** Rewrite a single `<img>` tag, preserving attribute order and unknown attrs. */
function annotateTag(tag: string, resolver: DimensionResolver, eager: boolean): string {
  const attrs = parseAttrs(tag);
  const src = attrs.get("src")?.value;
  if (!src) return tag;

  const intrinsic = resolver(src) ?? null;

  // `width`/`height` here are layout hints, not a crop: the aspect ratio stays
  // intrinsic because the stylesheet keeps `height: auto`.
  if (intrinsic) {
    const display = serializedWidth(attrs);
    const width = display && display > 0 ? Math.round(display) : intrinsic.width;
    const height = Math.max(1, Math.round((width * intrinsic.height) / intrinsic.width));
    if (!attrs.get("width") || Number(attrs.get("width")!.value) !== width) {
      attrs.set("width", { value: String(width), quote: '"' });
    }
    if (!attrs.get("height") || Number(attrs.get("height")!.value) !== height) {
      attrs.set("height", { value: String(height), quote: '"' });
    }
  }

  if (!attrs.get("decoding")) attrs.set("decoding", { value: "async", quote: '"' });
  // Only the leading image is a plausible LCP element; the rest are deferred so
  // the browser stops fetching a long article's screenshots up front.
  if (!attrs.get("loading")) {
    attrs.set("loading", { value: eager ? "eager" : "lazy", quote: '"' });
  }
  // The first image of an article is a frequent LCP element; hint its fetch,
  // but never override an author's explicit `loading` choice.
  if (eager && !attrs.get("fetchpriority")) {
    attrs.set("fetchpriority", { value: "high", quote: '"' });
  }

  return serializeTag("img", attrs);
}

/**
 * @param html  stored post body
 * @param resolver  looks up intrinsic size for a `src`
 * @returns annotated HTML. Idempotent: running it twice changes nothing.
 */
export function annotateContentImages(
  html: string,
  resolver: DimensionResolver,
): string {
  if (!html || !html.includes("<img")) return html;
  let index = -1;
  return html.replace(/<img\b[^>]*>/gi, (tag) => {
    index += 1;
    // Self-closing XHTML form is normalised away by the rebuild.
    const cleaned = tag.replace(/\s*\/>$/, ">");
    return annotateTag(cleaned, resolver, index === 0);
  });
}

/** True when at least one tag would change — used to skip needless DB writes. */
export function needsAnnotation(html: string): boolean {
  if (!html || !html.includes("<img")) return false;
  return /<img\b(?![^>]*\bheight\s*=)[^>]*>/i.test(html)
    || /<img\b(?![^>]*\bloading\s*=)[^>]*>/i.test(html);
}

/** Every distinct `src` in the body, so a caller can warm an async dimension
 *  lookup before handing `annotateContentImages` a synchronous resolver. */
export function collectImageSrcs(html: string): string[] {
  if (!html || !html.includes("<img")) return [];
  const srcs = new Set<string>();
  for (const tag of html.matchAll(/<img\b[^>]*>/gi)) {
    const src = parseAttrs(tag[0]).get("src")?.value;
    if (src) srcs.add(src);
  }
  return [...srcs];
}
