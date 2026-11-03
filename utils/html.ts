/**
 * Attribute-level HTML rewriting for post bodies stored as Quill HTML.
 *
 * Quill emits flat, well-formed markup, so parsing one tag's attribute string
 * is enough — no parser dependency, and unknown attributes survive a rewrite.
 * Extracted from `utils/images/content.ts`, which was the only caller.
 */
export type AttrMap = Map<string, { value: string; quote: string }>;

const ATTR_RE = /([\w-]+)\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/g;

/** Parse one opening tag's attributes into a mutable, insertion-ordered map. */
export function parseAttrs(tag: string): AttrMap {
  const attrs: AttrMap = new Map();
  let m: RegExpExecArray | null;
  ATTR_RE.lastIndex = 0;
  while ((m = ATTR_RE.exec(tag))) {
    const quote = m[2].startsWith('"') ? '"' : m[2].startsWith("'") ? "'" : "";
    attrs.set(m[1].toLowerCase(), { value: m[3] ?? m[4] ?? m[5] ?? "", quote });
  }
  return attrs;
}

export const escapeAttr = (v: string): string =>
  v.replace(/&/g, "&amp;").replace(/"/g, "&quot;");

/** Rebuild an opening tag. Attribute order is preserved; quotes become `"`. */
export function serializeTag(name: string, attrs: AttrMap): string {
  const body = [...attrs.entries()]
    .map(([k, a]) => `${k}="${escapeAttr(a.value)}"`)
    .join(" ");
  return body ? `<${name} ${body}>` : `<${name}>`;
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: "\u00A0",
};

/** The few named entities Quill emits. Decoded only after tags are stripped. */
export function decodeEntities(text: string): string {
  return text.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (whole, body: string) => {
    if (body[0] === "#") {
      const code = parseInt(
        body[1].toLowerCase() === "x" ? body.slice(2) : body.slice(1),
        body[1].toLowerCase() === "x" ? 16 : 10,
      );
      return Number.isFinite(code) && code > 0 && code < 0x10ffff
        ? String.fromCodePoint(code)
        : whole;
    }
    return NAMED_ENTITIES[body.toLowerCase()] ?? whole;
  });
}

/** Text content only, entities decoded — callers render the result as plain text. */
export function stripTags(html: string): string {
  return decodeEntities(
    html
      .replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, " ")
      .replace(/<[^>]+>/g, " "),
  ).replace(/\s+/g, " ").trim();
}
