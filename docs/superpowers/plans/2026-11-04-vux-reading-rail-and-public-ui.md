# vux Reading Rail & Public UI — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xóa vùng chết 256–1040px bên phải mọi trang public, thay bằng reading rail (TOC + progress + meta + latest) chỉ ở `/post/[slug]`, và đưa 6 trang còn lại về cùng một ngôn ngữ thị giác.

**Architecture:** `MainContent` thành container giữa duy nhất (`max-w-[1216px]`, bỏ `lg:mr-64`); trang bài viết tự owns grid 2 cột vì `Layout` do `_app.tsx` render nên page không thể truyền node ngược lên. TOC + reading time tính ở build time trong `getStaticProps` từ HTML Quill, dùng lại đúng bộ parse attribute mà `utils/images/content.ts` đã chứng minh trong repo.

**Tech Stack:** Next.js 15.5 Pages Router, React 19, TypeScript strict, Tailwind 3.4 (token tùy biến trong `tailwind.config.js`), Cloudflare D1 qua `@opennextjs/cloudflare`, `node --experimental-strip-types` cho script kiểm chứng.

**Spec:** `docs/superpowers/specs/2026-11-04-vux-reading-rail-and-public-ui-design.md`

---

## Ràng buộc chung

- **Không thêm dependency.** Không jest/vitest/testing-library → task logic thuần dùng `node:assert/strict`; task React dùng `yarn lint` + `yarn build` + đo bằng `scripts/measure-page.ts` (Chrome/CDP, có sẵn trong repo).
- Chạy build/lint bằng yarn: `yarn lint`, `yarn build`. Dev server cho verification: `yarn dev` (port 3000).
- `scripts/` và `seeds/` nằm ngoài `tsconfig.exclude` check của `next build` → script chạy bằng node trực tiếp, không qua Next.
- Import file nội bộ **có đuôi `.ts`** (`allowImportingTsExtensions: true`), theo đúng `fetcher/post.ts:16`.
- Token màu chỉ dùng nhóm có trong `tailwind.config.js` (`primary`, `canvas`, `ink`, `muted`, `hairline`, `surface-*`, `on-dark*`). **Không** dùng `neutral-*`, `primary-50`, `primary-900`.
- `primary` (coral) chỉ cho CTA và marker active — `Design.md` Do's/Don'ts.
- Commit message theo style repo: `feat(post): ...`, `fix(layout): ...`, `refactor(html): ...`.

---

# PHASE A — Layout nền + reading rail

## Task A1: Snapshot hành vi `annotateContentImages` trước khi refactor

**Files:**
- Create: `scripts/html-snapshot.ts`
- Reference: `utils/images/content.ts` (hàm `annotateContentImages`, `collectImageSrcs`)

Bước này tạo b neo để chứng minh A2 refactor không đổi output. Không có b neo thì không phân biệt được "refactor sạch" và "refactor làm hỏng thuộc tính `loading`/`fetchpriority` của 47 bài".

- [ ] **Step 1: Viết script snapshot**

`scripts/html-snapshot.ts`:

```ts
#!/usr/bin/env node
/**
 * Freezes annotateContentImages input/output pairs so the utils/html.ts
 * extraction in Task A2 can be proven to be a pure refactor.
 * run: node --experimental-strip-types scripts/html-snapshot.ts <out.json>
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { argv, exit } from "node:process";
import { annotateContentImages, collectImageSrcs } from "../utils/images/content.ts";

const out = argv[2] ? resolve(argv[2]) : null;
if (!out) {
  console.error("usage: html-snapshot.ts <out.json>");
  exit(2);
}

const posts = JSON.parse(
  readFileSync(resolve(import.meta.dirname, "../seeds/posts.json"), "utf8"),
);
const list = Array.isArray(posts) ? posts : Object.values(posts);
const stubResolver = () => ({ width: 1200, height: 800 });

const cases = list
  .map((p: any) => p.publishContent ?? "")
  .filter((html: string) => html.includes("<img"))
  .map((html: string) => ({
    srcs: collectImageSrcs(html),
    annotated: annotateContentImages(html, stubResolver),
  }));

writeFileSync(out, JSON.stringify({ count: cases.length, cases }, null, 2));
console.log(`snapshot: ${cases.length} bodies with <img> -> ${out}`);
```

- [ ] **Step 2: Chạy và kiểm tra kết quả**

Run: `node --experimental-strip-types scripts/html-snapshot.ts /tmp/html-before.json`
Expected: `snapshot: <N> bodies with <img> -> /tmp/html-before.json` với N > 20 (41/47 bài có `thumbImage`, nhiều bài có ảnh trong body).

Run: `node -e "const j=require('/tmp/html-before.json');console.log(j.count, j.cases[0].annotated.slice(0,160))"`
Expected: chuỗi có `width="1200" height="800"`, `decoding="async"`, `loading="eager"` cho ảnh đầu và `loading="lazy"` cho ảnh sau.

- [ ] **Step 3: Commit**

```bash
git add scripts/html-snapshot.ts
git commit -m "test(html): snapshot image annotation output before extraction"
```

---

## Task A2: `utils/html.ts` — tách bộ parse attribute dùng chung

**Files:**
- Create: `utils/html.ts`
- Modify: `utils/images/content.ts` (xóa `parseAttrs`, `escapeAttr`, `ATTR_RE`; import lại)

- [ ] **Step 1: Viết `utils/html.ts`**

```ts
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
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: "\u00A0",
};

/** The few named entities Quill emits. Decoded only after tags are stripped. */
export function decodeEntities(text: string): string {
  return text.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (whole, body: string) => {
    if (body[0] === "#") {
      const hex = body[1].toLowerCase() === "x";
      const code = parseInt(hex ? body.slice(2) : body.slice(1), hex ? 16 : 10);
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
```

`decodeEntities` không có trong bản draft: 5 heading trong corpus chứa `&amp;`/`&nbsp;`, mà label TOC được React render dưới dạng text thuần nên entity sẽ hiện nguyên văn (`A &amp; B`). Giải mã **sau khi** đã cắt tag để `&lt;` không thể biến thành markup.

- [ ] **Step 2: Sửa `utils/images/content.ts` dùng lại**

Xóa `const ATTR_RE`, hàm `parseAttrs`, hàm `escapeAttr`, và đoạn dựng chuỗi trong `annotateTag`. Thêm import ở đầu file và thay 2 chỗ dùng:

```ts
import { parseAttrs, serializeTag } from "../html.ts";
import type { AttrMap } from "../html.ts";
```

`parseAttrs(tag: string): Map<string, { value: string; quote: string }>` → `parseAttrs(tag): AttrMap` (giữ nguyên body, chỉ bỏ định nghĩa local).
Cuối `annotateTag`, thay khối `const rebuilt = ...; return \`<img ${rebuilt}>\`;` bằng `return serializeTag("img", attrs);`.

- [ ] **Step 3: Type-check**

Run: `yarn lint`
Expected: không error mới. Nếu báo `AttrMap` unused thì bỏ import type đó.

- [ ] **Step 4: Chứng minh refactor là thuần**

Run: `node --experimental-strip-types scripts/html-snapshot.ts /tmp/html-after.json`
Run: `diff /tmp/html-before.json /tmp/html-after.json && echo IDENTICAL`
Expected: `IDENTICAL`. Nếu khác, đây là bug thật của bước 2 — sửa cho tới khi khớp, **không** cập nhật b neo.

- [ ] **Step 5: Commit**

```bash
git add utils/html.ts utils/images/content.ts
git commit -m "refactor(html): extract attribute parsing shared by post-body rewrites"
```

---

## Task A3: `utils/toc.ts` — sinh heading id + TOC + reading time

**Files:**
- Create: `utils/toc.ts`
- Create: `scripts/toc-check.ts`
- Test: chạy trên 47 bài thật trong `seeds/posts.json`

- [ ] **Step 1: Viết check thất bại**

`scripts/toc-check.ts`:

```ts
#!/usr/bin/env node
/**
 * TOC invariants over the real corpus. Exits non-zero on the first violation.
 * run: node --experimental-strip-types scripts/toc-check.ts
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { argv } from "node:process";
import assert from "node:assert/strict";
import { buildToc } from "../utils/toc.ts";

const posts = JSON.parse(
  readFileSync(resolve(import.meta.dirname, "../seeds/posts.json"), "utf8"),
);
const list = (Array.isArray(posts) ? posts : Object.values(posts)) as any[];

let withToc = 0;
let totalHeadings = 0;
const deep: string[] = [];

for (const p of list) {
  const { html, toc, minutes } = buildToc(p.publishContent ?? "");

  // ids must exist, be unique per post, and be present in the rewritten html
  assert.equal(new Set(toc.map((t) => t.id)).size, toc.length, `du id trong: ${p.title}`);
  for (const t of toc) {
    assert.ok(t.id.length > 0, `id rong trong: ${p.title}`);
    assert.ok(/^[a-z0-9-]+$/.test(t.id), `id khong hop le "${t.id}" trong: ${p.title}`);
    assert.ok(html.includes(`id="${t.id}"`), `id "${t.id}" thieu trong html: ${p.title}`);
    assert.ok(t.label.length > 0, `label rong trong: ${p.title}`);
    assert.ok(t.level >= 2 && t.level <= 4, `level ngoai pham vi: ${p.title}`);
  }
  assert.ok(minutes >= 1 && minutes < 400, `minutes vo ly "${minutes}" trong: ${p.title}`);

  // idempotent: a second pass must not add or change anything
  const again = buildToc(html);
  assert.equal(again.html, html, `buildToc khong idempotent: ${p.title}`);
  assert.deepEqual(again.toc.map((t) => t.id), toc.map((t) => t.id), `toc doi id: ${p.title}`);

  // escaped tags inside code samples must never become headings
  assert.ok(!/&lt;h[2-4]&gt;/.test(html.match(/id="[^"]*"[^>]*>&lt;/g)?.join("") ?? ""));

  if (toc.length >= 2) withToc += 1;
  totalHeadings += toc.length;
  if (toc.length >= 10) deep.push(`${p.title} (${toc.length})`);
}

console.log(`OK  posts=${list.length}  h2-h4=${totalHeadings}  bai co TOC(>=2)=${withToc}  bai >=10 heading=${deep.length}`);
if (argv[2] === "--verbose") deep.forEach((d) => console.log("   deep:", d));
```

- [ ] **Step 2: Chạy để xác nhận nó fail**

Run: `node --experimental-strip-types scripts/toc-check.ts`
Expected: FAIL — `Cannot find module '../utils/toc.ts'`.

- [ ] **Step 3: Viết `utils/toc.ts`**

```ts
/**
 * Build-time table of contents for article bodies stored as Quill HTML.
 *
 * Unlike `annotateContentImages` (write-time, persisted), this runs on read in
 * `getStaticProps`: no migration of the 47 existing posts, and a slug-algorithm
 * change only needs a revalidate. Idempotent — an `id` already in the content
 * wins and is never overwritten, so author deep links stay stable.
 */
import { parseAttrs, serializeTag, stripTags } from "./html.ts";

export interface TocEntry {
  id: string;
  label: string;
  level: 2 | 3 | 4;
}

const WORDS_PER_MINUTE = 200;

/** Vietnamese-aware slug. Keeps digits, which `friendlyStr` drops. */
export function headingSlug(text: string, seen: Set<string>): string {
  const base =
    text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase() || "section";

  let slug = base;
  let n = 2;
  while (seen.has(slug)) slug = `${base}-${n++}`;
  seen.add(slug);
  return slug;
}

export interface TocResult {
  html: string;
  toc: TocEntry[];
  minutes: number;
}

export function buildToc(html: string): TocResult {
  if (!html) return { html: "", toc: [], minutes: 1 };

  const seen = new Set<string>();
  const toc: TocEntry[] = [];

  const withIds = html.replace(
    /<(h[2-4])\b([^>]*)>([\s\S]*?)<\/\1>/gi,
    (whole, name: string, rawAttrs: string, inner: string) => {
      const tag = name.toLowerCase();
      const label = stripTags(inner);
      // An empty heading is a Quill artifact; leaving it alone keeps the body
      // byte-identical and the rail's `>= 2` filter never sees it.
      if (!label) return whole;

      const attrs = parseAttrs(`<${tag}${rawAttrs}>`);
      const existing = attrs.get("id")?.value;
      const id = existing || headingSlug(label, seen);
      if (existing) seen.add(existing);
      else attrs.set("id", { value: id, quote: '"' });

      toc.push({ id, label, level: Number(name[1]) as 2 | 3 | 4 });
      return `${serializeTag(tag, attrs)}${inner}</${tag}>`;
    },
  );

  const words = stripTags(withIds).split(" ").filter(Boolean).length;
  return {
    html: withIds,
    toc,
    minutes: Math.max(1, Math.ceil(words / WORDS_PER_MINUTE)),
  };
}
```

- [ ] **Step 4: Chạy check**

Run: `node --experimental-strip-types scripts/toc-check.ts`
Expected (đo lại lúc execute): `OK  posts=47  h2-h4=161  bai co TOC(>=2)=33  bai >=10 heading=3`. Khảo sát ban đầu đếm 168 thẻ mở `h2..h4`, nhưng 7 thẻ chỉ chứa `<br>` (artifact của Quill) bị bỏ qua vì label rỗng → 161 heading thực sự vào TOC.

- [ ] **Step 5: Kiểm tra thủ công 2 ca cực đoan**

Run: `node --experimental-strip-types scripts/toc-check.ts --verbose`
Expected: in ra đúng 3 bài có ≥10 heading.

Run: `node --experimental-strip-types -e "1" 2>/dev/null; node --experimental-strip-types --input-type=module -e "
import('./utils/toc.ts').then(({buildToc})=>{
  const a=buildToc('<h2>Giới thiệu</h2><p>x</p><h2>Giới thiệu</h2><h4>Đếm 123 số</h4><h2>&nbsp;</h2><h2 id=\"keep-me\">Sẵn</h2><pre>&lt;h2&gt;code&lt;/h2&gt;</pre>');
  console.log(JSON.stringify(a.toc,null,1)); console.log(a.html);
});"`
Expected: toc = `gioi-thieu`, `gioi-thieu-2`, `dem-123-so` (level 4), `keep-me`; heading rỗng (`&nbsp;` → strip ra rỗng sau `&nbsp;`? xem ghi chú dưới) **không** xuất hiện; `<pre>` không bị đụng.
Nếu `&nbsp;` được giữ lại thành label không rỗng thì thêm `.replace(/&nbsp;/gi, " ")` vào `stripTags` trong `utils/html.ts` và chạy lại Step 4.

- [ ] **Step 6: Commit**

```bash
git add utils/toc.ts scripts/toc-check.ts utils/html.ts
git commit -m "feat(post): build-time table of contents from Quill headings"
```

---

## Task A4: `components/Post/useActiveHeading.ts` — scrollspy dùng chung

**Files:**
- Create: `components/Post/useActiveHeading.ts`

- [ ] **Step 1: Viết hook**

```ts
import { useEffect, useState } from 'react';
import type { TocEntry } from 'utils/toc';

/** Line just below the sticky back-bar; a heading counts as read once it passes it. */
const OFFSET = 120;

/**
 * Returns the id of the heading currently in view. Scroll-driven rather than
 * IntersectionObserver so a 14-heading article picks one winner deterministically
 * instead of flickering between two intersecting sections.
 */
export const useActiveHeading = (toc: TocEntry[]): string => {
  const [active, setActive] = useState('');

  useEffect(() => {
    if (toc.length < 2) return;
    const read = () => {
      const line = window.scrollY + OFFSET;
      let winner = toc[0].id;
      for (const entry of toc) {
        const el = document.getElementById(entry.id);
        if (el && el.offsetTop <= line) winner = entry.id;
      }
      setActive((prev) => (prev === winner ? prev : winner));
    };
    read();
    window.addEventListener('scroll', read, { passive: true });
    window.addEventListener('resize', read);
    return () => {
      window.removeEventListener('scroll', read);
      window.removeEventListener('resize', read);
    };
  }, [toc]);

  return active;
};
```

- [ ] **Step 2: Type-check**

Run: `yarn lint`
Expected: sạch.

- [ ] **Step 3: Commit**

```bash
git add components/Post/useActiveHeading.ts
git commit -m "feat(post): add shared heading scrollspy hook"
```

---

## Task A5: `components/Post/PostToc.tsx`

**Files:**
- Create: `components/Post/PostToc.tsx`

- [ ] **Step 1: Viết component**

```tsx
import { FC } from 'react';
import type { TocEntry } from 'utils/toc';

type Props = {
  toc: TocEntry[];
  variant: 'rail' | 'details';
  activeId?: string;
};

const link =
  'block border-l-2 pl-3 font-body leading-snug transition-colors duration-200 ' +
  'border-hairline dark:border-surface-dark-elevated ' +
  'text-muted dark:text-on-dark-soft hover:text-primary';
const active =
  'border-primary text-primary dark:text-primary font-medium';

/**
 * `h4` is folded into the `h3` indent: three visible levels makes a 14-heading
 * article unreadable in a 16rem rail.
 */
const PostToc: FC<Props> = ({ toc, variant, activeId = '' }) => {
  if (toc.length < 2) return null;

  const list = (
    <ol className="space-y-1.5 max-h-[50vh] overflow-y-auto pr-1">
      {toc.map((entry) => (
        <li key={entry.id}>
          <a
            href={`#${entry.id}`}
            aria-current={activeId === entry.id ? 'true' : undefined}
            className={`${link} ${entry.level >= 3 ? 'ml-3 text-[12px]' : 'text-[13px]'} ${
              activeId === entry.id ? active : ''
            }`}
          >
            {entry.label}
          </a>
        </li>
      ))}
    </ol>
  );

  if (variant === 'details') {
    return (
      <details className="mb-8 rounded-md border border-hairline dark:border-surface-dark-elevated bg-surface-soft dark:bg-surface-dark-soft">
        <summary className="cursor-pointer select-none px-4 py-3 font-body text-[11px] uppercase tracking-widest text-muted dark:text-muted-soft font-medium">
          Mục lục · {toc.length} phần
        </summary>
        <div className="px-4 pb-4">{list}</div>
      </details>
    );
  }

  return (
    <nav aria-label="Mục lục">
      <p className="font-body text-[11px] uppercase tracking-widest text-muted-soft font-medium mb-3">
        Mục lục
      </p>
      {list}
    </nav>
  );
};

export default PostToc;
```

- [ ] **Step 2: Type-check**

Run: `yarn lint`
Expected: sạch. Component chưa được render ở đâu — build sẽ không type-check JSX của file chưa import, nên bắt buộc giữ `yarn lint` ở bước này.

- [ ] **Step 3: Commit**

```bash
git add components/Post/PostToc.tsx
git commit -m "feat(post): add PostToc with rail and collapsible variants"
```

---

## Task A6: `getLatestPosts` — 1 query, không N+1

**Files:**
- Modify: `interfaces/Post.ts` (thêm `LatestPost`)
- Modify: `fetcher/post.ts` (thêm hàm, cuối file)

- [ ] **Step 1: Thêm type**

Cuối `interfaces/Post.ts`:

```ts
export interface LatestPost {
  uid: string;
  slug: string;
  title: string;
  updatedAt: number;
}
```

- [ ] **Step 2: Thêm fetcher**

Cuối `fetcher/post.ts`. Import `LatestPost` vào dòng `import type { Post }` hiện tại:

```ts
import type { LatestPost, Post } from "interfaces/Post";
```

Hàm mới:

```ts
/**
 * Rail-only "reading next" list. Deliberately not `getPublishedPosts`: that
 * runs `loadTags` per row (47 round-trips), which inside every post page's
 * `getStaticProps` would be ~2.2k queries per full build. The rail needs no
 * tags, so this is one bounded query.
 */
export const getLatestPosts = async (limit = 3, excludeUid = ''): Promise<LatestPost[]> => {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const { results } = await env.DB
      .prepare(
        `SELECT uid, slug, title, updated_at FROM posts
         WHERE is_published = 1 AND uid != ?1
         ORDER BY updated_at DESC, position ASC
         LIMIT ?2`,
      )
      .bind(excludeUid, limit)
      .all<PostRow>();
    return (results ?? []).map((row: PostRow) => ({
      uid: row.uid,
      slug: row.slug,
      title: row.title,
      updatedAt: row.updated_at,
    }));
  } catch (error) {
    console.error("getLatestPosts failed", error);
    return [];
  }
};
```

- [ ] **Step 3: Type-check**

Run: `yarn build`
Expected: build pass. `position` có trong `PostRow` (`fetcher/post.ts:34`) nên không cần đổi select list — `SELECT uid, slug, title, updated_at` trả `position` là `undefined`, vẫn an toàn vì `ORDER BY` xử lý ở SQLite chứ không map vào object.

- [ ] **Step 4: Commit**

```bash
git add interfaces/Post.ts fetcher/post.ts
git commit -m "feat(post): add bounded latest-posts query for the reading rail"
```

---

## Task A7: `MainContent` — container giữa, bỏ `lg:mr-64`

**Files:**
- Modify: `components/MainContent.tsx:9-10`

- [ ] **Step 1: Đo trước**

Run: `yarn dev` (chạy nền), rồi
`VW=1440 node --experimental-strip-types scripts/measure-page.ts http://localhost:3000/ /tmp/gutter-before.json`
Expected: script chạy xong, in metrics. Ghi lại `docHeight`. (Measurement cụ thể nằm ở Task A10 — ở đây chỉ cần page render được sau các task sau.)

- [ ] **Step 2: Sửa file**

Toàn bộ `components/MainContent.tsx`:

```tsx
import type { ReactNode, FC } from 'react'

type Props = {
  children: ReactNode
}

/**
 * One centered container, and nothing else. The article page owns its own
 * two-column grid (it is the only page with a rail) because `Layout` is
 * rendered by `_app.tsx`, which leaves no path for a page to pass a node up.
 * `max-w-[1216px]` matches Design.md's ~1200px cap.
 */
const MainContent: FC<Props> = ({ children }) => {
  return (
    <div className="min-h-screen md:ml-64 p-8 md:p-12 bg-canvas dark:bg-surface-dark">
      <div className="mx-auto w-full max-w-[1216px]">{children}</div>
    </div>
  )
}

export default MainContent
```

- [ ] **Step 3: Build**

Run: `yarn build`
Expected: pass. Sau bước này `/`, `/tags`, `/about` đã hết vùng chết (chưa đẹp, nhưng không lệch).

- [ ] **Step 4: Commit**

```bash
git add components/MainContent.tsx
git commit -m "fix(layout): center content and drop the unused right gutter"
```

---

## Task A8: `ReadingRail`

**Files:**
- Create: `components/Post/ReadingRail.tsx`

- [ ] **Step 1: Viết component**

```tsx
import { FC } from 'react';
import Link from 'next/link';
import { timeFromNow } from 'utils/common';
import type { LatestPost } from 'interfaces/Post';
import type { TocEntry } from 'utils/toc';
import PostToc from './PostToc';
import { useActiveHeading } from './useActiveHeading';
import TagChip from './TagChip';

type Props = {
  toc: TocEntry[];
  minutes: number;
  updatedAt: number;
  tags: string[];
  latest: LatestPost[];
};

const label =
  'font-body text-[11px] uppercase tracking-widest text-muted-soft font-medium';

const formatDate = (second: number): string => {
  const d = new Date(second * 1000);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
};

/**
 * Fills the xl gutter. Every block hides itself when it has no data: 7 posts
 * have no headings and 17 have no tags, so the rail must degrade without
 * leaving a hole. Meta is always present, so the rail is never empty.
 */
const ReadingRail: FC<Props> = ({ toc, minutes, updatedAt, tags, latest }) => {
  const activeId = useActiveHeading(toc);

  return (
    <div className="sticky top-12 pt-2 space-y-7">
      <div className="text-right">
        <p className={`${label} mb-1.5`}>Đọc</p>
        <p className="font-body text-sm text-ink dark:text-on-dark">{formatDate(updatedAt)}</p>
        <p className="font-body text-xs text-muted dark:text-on-dark-soft">{minutes} phút</p>
      </div>

      {toc.length >= 2 && <PostToc toc={toc} variant="rail" activeId={activeId} />}

      {tags.length > 0 && (
        <div className="border-t border-hairline dark:border-surface-dark-elevated pt-5">
          <p className={`${label} mb-3`}>Tag</p>
          <div className="flex flex-wrap gap-1.5 justify-end">
            {tags.map((tag) => <TagChip key={tag} label={tag} />)}
          </div>
        </div>
      )}

      {latest.length > 0 && (
        <div className="border-t border-hairline dark:border-surface-dark-elevated pt-5">
          <p className={`${label} mb-3`}>Mới nhất</p>
          <ul className="space-y-3">
            {latest.map((post) => (
              <li key={post.uid}>
                <Link
                  href={`/post/${post.slug}`}
                  className="block font-body text-[13px] leading-snug text-ink dark:text-on-dark hover:text-primary"
                >
                  {post.title}
                  <span className="block text-muted-soft text-[11px] mt-0.5">
                    {timeFromNow(post.updatedAt)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ReadingRail;
```

- [ ] **Step 2: Type-check**

Run: `yarn lint`
Expected: sạch.

- [ ] **Step 3: Commit**

```bash
git add components/Post/ReadingRail.tsx
git commit -m "feat(post): add reading rail with TOC, meta, tags, latest"
```

---

## Task A9: Nối rail vào `/post/[slug]`

**Files:**
- Modify: `pages/post/[slug].tsx:9-13` (imports), `:29-31` (props type + destructure), `:80-104` (markup), `:150-175` (`getStaticProps`)

- [ ] **Step 1: Thêm import**

Sau `import { Post } from 'interfaces/Post';` thêm:

```ts
import type { LatestPost } from 'interfaces/Post';
import type { TocEntry } from 'utils/toc';
import { buildToc } from 'utils/toc';
import ReadingRail from 'components/Post/ReadingRail';
import PostToc from 'components/Post/PostToc';
import { getLatestPosts, getPostById, getPublishedPosts } from "fetcher/post";
```

Dòng `getLatestPosts` thay cho import `fetcher/post` hiện tại (`pages/post/[slug].tsx:11`), không để hai dòng import cùng module.

- [ ] **Step 2: Đổi props**

```ts
type PostProps = {
  post: Post;
  toc: TocEntry[];
  minutes: number;
  latest: LatestPost[];
}

const PostPage = ({ post, toc, minutes, latest }: PostProps) => {
```

Thay `const PostPage = (props: { post: Post }) => {` và `const { post } = props;` (`:29-31`).

- [ ] **Step 3: Grid 2 cột + TOC details + nút back sticky**

Thay khối từ `:80` (`<div className={'post-page-view ...'}>`) tới hết `post-reading-column` (`:96`) bằng:

```tsx
      <div className={'post-page-view h-full flex flex-col'}>
        <div className="min-w-0 xl:grid xl:grid-cols-[minmax(0,1fr)_16rem] xl:gap-12">
          <div className="post-reading-column ql-snow min-w-0">
            <div className="w-full py-3 h-16 sticky top-0 z-20 -ml-6 bg-canvas dark:bg-surface-dark border-b border-hairline dark:border-surface-dark-elevated">
              <Link
                href="/"
                className="border border-hairline dark:border-surface-dark-elevated hover:border-primary dark:hover:border-primary rounded-full inline-flex items-center justify-center cursor-pointer w-9 h-9 transition-colors duration-200"
              >
                <Image priority width={36} height={36} src="/icons/left_arrow.svg" alt="left" />
              </Link>
            </div>
            <h1 className="post-title font-display flex text-[2rem] md:text-[2.75rem] font-normal -ml-2 pb-2 text-ink dark:text-on-dark leading-[1.15] tracking-tight">
              {post.title}
            </h1>
            <p className="pl-1.5 font-body text-xs uppercase tracking-widest text-muted dark:text-muted-soft font-medium mb-3">
              {timeFromNow(post.updatedAt)} · {minutes} phút đọc
            </p>
            <PostToc toc={toc} variant="details" />
            <article className="pb-5 post-content ql-editor font-body text-body dark:text-on-dark-soft leading-relaxed" dangerouslySetInnerHTML={{ __html: post.publishContent || '' }} />
          </div>
          {toc.length + post.tags.length + latest.length > 0 && (
            <aside className="hidden xl:block">
              <ReadingRail
                toc={toc}
                minutes={minutes}
                updatedAt={post.updatedAt}
                tags={post.tags || []}
                latest={latest}
              />
            </aside>
          )}
        </div>
```

Ba điểm cần đúng: `sticky` thay `fixed` (bar `fixed w-full` sẽ đè lên rail); `PostToc variant="details"` tự trả `null` khi <2 heading nên tablet không có TOC rỗng; `min-w-0` trên cả grid track lẫn column để `pre { white-space: pre }` không đẩy vỡ cột.

`<div className="post-applause ...">` giữ nguyên khối đóng `</div>` tương ứng — thêm một `</div>` đóng grid, tổng số `</div>` của block tăng 1.

- [ ] **Step 4: `getStaticProps`**

```ts
export const getStaticProps = async ({ params }: any) => {
  try {
    if (typeof params.slug != 'string') return {};
    const id = params.slug.split(".").pop() || "";
    const post = await getPostById(id);
    const { html, toc, minutes } = buildToc((post as Post).publishContent || '');
    const latest = await getLatestPosts(3, (post as Post).uid);
    return {
      props: {
        post: { ...post, publishContent: html },
        toc,
        minutes,
        latest,
      },
      // Post pages are read-mostly; cache at the edge for 10 minutes,
      // serve stale up to 24 h. Edits made via /admin will land within
      // the 10-min revalidation window.
      revalidate: 600,
    };
  } catch (error) {
    return {
      props: { post: {}, toc: [], minutes: 1, latest: [] },
    };
  }
}
```

Giữ nguyên `revalidate: 600` và comment hiện có. `getPostById` có thể trả `{}` — nên `buildToc('')` cho `toc: []`, và `props.post.uid` rỗng sẽ rơi vào nhánh "Post not found" sẵn có ở `:38`.

- [ ] **Step 5: Build + xem thực tế**

Run: `yarn build`
Expected: 47 trang `/post/*` prerender pass, không lỗi type.
Run: `yarn dev` rồi mở 3 bài: bài nhiều heading (`/post/van-de-debug-talk-is-cheap-show-me-the-number.*`), bài 0 heading, bài 0 tag. Ở 1440px: rail hiện, click TOC nhảy đúng chỗ, marker bám khi scroll. Ở 1024px: rail ẩn, `<details>` Mục lục hiện.

- [ ] **Step 6: Commit**

```bash
git add pages/post/\[slug\].tsx
git commit -m "feat(post): mount the reading rail on article pages"
```

---

## Task A10: Bỏ GitHubCorner + đo vùng chết bằng số

**Files:**
- Modify: `pages/_app.tsx:6` và `:24`
- Delete: `components/shared/GitHubCorner.tsx`
- Modify: `scripts/measure-page.ts` (thêm measurement `gutter` vào `INSTRUMENT`)

- [ ] **Step 1: Xác nhận GitHubCorner chỉ dùng ở `_app`**

Run: `grep -rn "GitHubCorner" pages components`
Expected: chỉ 2 dòng trong `pages/_app.tsx`. Nếu còn chỗ khác thì dừng, không xoá file.

- [ ] **Step 2: Gỡ và xoá**

Xóa `import GitHubCorner from 'components/shared/GitHubCorner';` (`:6`) và `<GitHubCorner repoUrl={config.repo} />` (`:24`).
Run: `git rm components/shared/GitHubCorner.tsx`
Lý do: repo đã có trong sidebar (`config.js:19`); `fixed top-0 right-0` sẽ đè lên rail ở `xl`.

- [ ] **Step 3: Thêm số đo gutter vào harness có sẵn**

Trong `INSTRUMENT` của `scripts/measure-page.ts`, ngay trước dòng `window.__vux.docHeight = ...`, chèn:

```js
    const shell = document.querySelector('[data-shell="content"]');
    const box = (shell || document.body).getBoundingClientRect();
    const area = (shell ? shell.parentElement : document.body).getBoundingClientRect();
    window.__vux.gutter = {
      left: Math.round(box.left - area.left),
      right: Math.round(area.right - box.right),
      contentWidth: Math.round(box.width),
      rail: (() => {
        const a = document.querySelector("aside");
        return !!a && getComputedStyle(a).display !== "none";
      })(),
    };
```

và trong `window.__vux = {...}` khai báo thêm `gutter: null,`.

Ba chỉnh sửa so với draft, đều do số đo đầu tiên nói dối:
- `MainContent` xuất hiện `data-shell="content"` — chọn class `.max-w-[1216px]` buộc phải escape dấu ngoặc trong chuỗi JS nằm trong template literal.
- So với **parent có padding**, không so với viewport: sidebar `fixed` là vùng đã dùng chứ không phải vùng chết, nên đo theo viewport luôn trả `left - right = 256` dù layout đúng.
- `rail` phải kiểm tra `display` vì `<aside>` luôn tồn tại trong DOM nhưng `hidden xl:block`.
- Thêm cờ `DARK=1` (Emulation.setEmulatedMedia `prefers-color-scheme: dark`) để bắt nửa tối của ma trận — `ThemeProvider` đọc media query khi chưa có theme nào trong localStorage.

- [ ] **Step 4: Đo**

Run (dev server đang chạy — xem ghi chú port bên dưới):
```bash
for w in 1024 1280 1440 1920; do
  VW=$w node --experimental-strip-types scripts/measure-page.ts http://localhost:3210/ /tmp/g-$w.json >/dev/null
  node -e "const j=require('/tmp/g-$w.json');console.log('$w', JSON.stringify(j.gutter))"
done
```
Expected: `left` và `right` bằng nhau (≤ 8px), `contentWidth` không vượt 1216.

Kết quả đo được: `/` và `/post/[slug]` đều `imbalance = 0` ở 1024/1280/1440/1920; `contentWidth` = 672 / 928 / 1088 / 1216. Rail: `false` ở 1024, `true` từ 1280 — đúng D2.

Cẩn thận port: `:3000` có thể đã bị project khác giữ. `next dev` vẫn in ra "Local: http://localhost:3000" trong khi `curl` trả HTML của app khác → mọi số đo đều vô nghĩa. Kiểm chứng bằng `curl -s <url> | grep data-shell` trước khi đo, hoặc chạy `yarn dev -p 3210`.

- [ ] **Step 5: Commit**

```bash
git add pages/_app.tsx scripts/measure-page.ts
git commit -m "refactor(layout): drop the GitHub corner banner, measure gutters"
```

---

# PHASE B — Hệ type & surface

## Task B1: Display serif + subset tiếng Việt

**Files:**
- Modify: `components/Layout.tsx:9-21`

- [ ] **Step 1: Sửa font**

`next/font/google` export theo tên từng family (`import { Inter }` đã dùng ở `Layout.tsx:3`; `EB_Garamond` có trong `node_modules/next/dist/compiled/@next/font/dist/google/index.d.ts`). Đổi dòng import và chỉ đổi `displayFont`:

```tsx
import { EB_Garamond, Inter } from "next/font/google";

const displayFont = EB_Garamond({
  weight: ['400', '500'],
  display: 'swap',
  subsets: ['latin', 'vietnamese'],
  variable: '--font-display',
});
```

`bodyFont` giữ nguyên `Inter` (`:16-21`). Hai biến vẫn đặt class CSS variable lên wrapper (`:35`), không đổi markup.

Hệ quả cần biết: `styles/globals.css:19-22` áp `--font-display` cho **mọi** `h1..h4`, kể cả heading trong nội dung bài và trong `/admin` — đây là hành vi chủ đích của spec, không phải tai nạn.

- [ ] **Step 2: Build**

Run: `yarn build`
Expected: pass, log font cho thấy `eb_garamond` + `inter` với 2 subset.

- [ ] **Step 3: Kiểm tra glyph tiếng Việt**

Run: `yarn dev`, mở `/` ở 1440px dark + light.
Expected: "Vy Quốc Vũ" và title bài tiếng Việt render cùng một serif, không có ký tự rơi về system fallback (so sánh hình dáng `ố`/`ữ` với `y`).

- [ ] **Step 4: Commit**

```bash
git add components/Layout.tsx
git commit -m "feat(fonts): use serif display with Vietnamese subsets"
```

---

## Task B2: Cho serif vào token + bỏ serif bold

**Files:**
- Modify: `tailwind.config.js:15`
- Modify: `styles/globals.css:19-22`
- Modify: `pages/tags.tsx:7`, `pages/login.tsx:50`, `pages/signup.tsx:48`

`Design.md`: "Don't bold serif display weight — the system stays at 400". `globals.css:19-22` áp `--font-display` cho **mọi** `h1..h4`, nên sau B1 các heading không có `font-normal` sẽ thành serif bold.

- [ ] **Step 1: Token**

`tailwind.config.js` dòng `display:` đổi thành:

```js
      display: ['var(--font-display)', 'EB Garamond', 'Georgia', 'Cambria', 'Times New Roman', 'serif'],
```

`body` và `mono` giữ nguyên.

- [ ] **Step 2: Fix heading bold không chủ đích**

`pages/tags.tsx:7`:
`text-5xl font-bold text-neutral-900 dark:text-neutral-100` → `font-display text-5xl font-normal text-ink dark:text-on-dark tracking-tight`

`pages/login.tsx:50` và `pages/signup.tsx:48`:
`text-3xl font-bold text-neutral-900 mb-6 text-center` → `font-display text-3xl font-normal text-ink mb-6 text-center tracking-tight`

- [ ] **Step 3: Build + scan còn sót**

Run: `yarn build`
Run: `grep -rn "h[1-4][^\"]*font-bold\|font-display[^\"]*font-bold" pages components | grep -v /admin/`
Expected: không có kết quả.

- [ ] **Step 4: Đối chiếu `Design.md`**

Mở `/`, `/post/[slug]`, `/about` ở 1440px.
Expected: display là serif 400/500; UI label (nav, tag chip, date) vẫn Inter; coral chỉ ở CTA/marker active.

- [ ] **Step 5: Commit**

```bash
git add tailwind.config.js pages/tags.tsx pages/login.tsx pages/signup.tsx
git commit -m "feat(fonts): register serif display token and drop bold display headings"
```

---

# PHASE C — Các trang public

## Task C1: `PostRow` — thumbnail, clamp tĩnh, ngày tuyệt đối

**Files:**
- Modify: `components/Post/PostRow.tsx` (viết lại toàn file)

- [ ] **Step 1: Viết lại**

```tsx
import { FC } from 'react';
import Link from 'next/link';
import Image from 'next/image';

import { friendlyStr, timeFromNow } from 'utils/common';
import { Post } from 'interfaces/Post';
import TagChip from './TagChip';

type Props = {
  data: Post;
  onTagClick?: (tag: string) => void;
};

const formatDate = (second: number): string => {
  const d = new Date(second * 1000);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
};

const PostRow: FC<Props> = ({ data, onTagClick }) => {
  const { title, updatedAt, thumbText, thumbImage, tags = [] } = data;
  const slug = `${friendlyStr(title)}.${data.uid}`;

  return (
    <article className="group border-b border-hairline dark:border-surface-dark-elevated py-7 last:border-b-0">
      <div className={thumbImage ? 'md:grid md:grid-cols-[minmax(0,1fr)_11rem] md:gap-6' : ''}>
        <div className="min-w-0">
          <p className="font-body text-[11px] uppercase tracking-widest text-muted dark:text-muted-soft font-medium">
            <time dateTime={new Date(updatedAt * 1000).toISOString()}>{formatDate(updatedAt)}</time>
            <span className="text-muted-soft"> · {timeFromNow(updatedAt)}</span>
          </p>

          <h2 className="mt-2 font-display text-2xl md:text-[1.75rem] font-normal tracking-tight leading-[1.2]">
            <Link href={`/post/${slug}`} className="text-ink dark:text-on-dark transition-colors duration-200 group-hover:text-primary">
              {title}
            </Link>
          </h2>

          {tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <TagChip
                  key={tag}
                  label={tag}
                  variant={onTagClick ? 'filter' : 'inline'}
                  onClick={onTagClick ? () => onTagClick(tag) : undefined}
                />
              ))}
            </div>
          )}

          {thumbText && (
            <p className="mt-3 font-body text-sm text-body dark:text-on-dark-soft leading-relaxed line-clamp-2">
              {thumbText}
            </p>
          )}

          <Link
            href={`/post/${slug}`}
            className="mt-3 inline-flex items-center gap-1 font-body text-sm font-medium text-primary hover:text-primary-active transition-colors duration-200"
          >
            Đọc bài <span aria-hidden>→</span>
          </Link>
        </div>

        {thumbImage && (
          <div className="hidden md:block overflow-hidden rounded-md border border-hairline dark:border-surface-dark-elevated">
            <Image
              src={thumbImage}
              alt=""
              width={448}
              height={280}
              unoptimized
              className="w-full h-full object-cover aspect-[16/10]"
            />
          </div>
        )}
      </div>
    </article>
  );
};

export default PostRow;
```

Bốn thay đổi có chủ đích so với bản cũ (`components/Post/PostRow.tsx:53-77`): `line-clamp-2` tĩnh thay cho hack `max-h-12 → max-h-40` (link "Read" cũ `opacity-0` nên không tappabel trên mobile); ngày tuyệt đối + relative; `unoptimized` vì `thumbImage` là `/images/*.webp` nội bộ đã tối ưu, tránh `next/image` rewrite qua remote loader trên edge; ô ảnh nằm trong track cố định nên bài **không có** `thumbImage` (6/47) giữ nguyên bề rộng cột text.

- [ ] **Step 2: `next.config.js` allow webp nội bộ**

Run: `cat next.config.js`
Expected/kiểm tra: nếu `images:` chưa có `types: ['image/webp']` thì **không cần đổi** — `unoptimized` bỏ qua pipeline ảnh hoàn toàn. Chỉ ghi chú lại nếu có `remotePatterns` chặn path local.

- [ ] **Step 3: Build + xem**

Run: `yarn build`
Run: `yarn dev`, mở `/` và `/post` ở 1440 / 768 / 390.
Expected: 5 hàng đầu có ảnh ở `md+`, hàng không có ảnh không bị tụt chiều rộng; excerpt luôn 2 dòng; không có ảnh nào vỡ khung.

- [ ] **Step 4: Commit**

```bash
git add components/Post/PostRow.tsx
git commit -m "feat(feed): add thumbnails, stable excerpt clamp, absolute dates"
```

---

## Task C2: `/post` dùng chung archetype với `/`

**Files:**
- Modify: `pages/post/index.tsx:3`, `:13`
- Modify: `components/Post/Feed.tsx:70-101` (chỉ phần rỗng)

`List.tsx` **không bị xoá** — admin đang dùng (`pages/admin/index.tsx:4`).

- [ ] **Step 1: Đổi import và render**

`pages/post/index.tsx:3`: `import PostList from "components/Post/List";` → `import Feed from 'components/Post/Feed';`
`:13`: `return <PostList items={posts} />;` → `return <Feed items={posts} />;`
Trong `shapedPosts` (`:25-35`) thêm `tags: post.tags || [],` để `Feed` lọc tag được (`/post?tag=…` hiện truyền bài không có tags nên chip lọc trống).

- [ ] **Step 2: Feed giữ `?tag=` mặc định**

`Feed` lọc client-side theo `activeTag`. Để `/post?tag=javascript` vẫn đúng khi tải lần đầu, thêm prop khởi điểm:

```tsx
type Props = {
  items: Post[];
  initialTag?: string | null;
};

const Feed: FC<Props> = ({ items = [], initialTag = null }) => {
  const [activeTag, setActiveTag] = useState<string | null>(initialTag);
```

và trong `pages/post/index.tsx` render `<Feed items={posts} initialTag={tag} />` (biến `tag` đã có ở `:18`).

- [ ] **Step 3: Build + xem**

Run: `yarn build`
Run: `yarn dev`, mở `/post?tag=javascript`.
Expected: chip `javascript` active ngay lần tải đầu, chỉ bài có tag hiện ra; mở `/` vẫn "All".

- [ ] **Step 4: Commit**

```bash
git add pages/post/index.tsx components/Post/Feed.tsx
git commit -m "feat(feed): share one list archetype between / and /post"
```

---

## Task C3: `/tags` — token thật, sắp xếp theo đếm

**Files:**
- Modify: `pages/tags.tsx:5-30`

- [ ] **Step 1: Viết lại phần render**

```tsx
const TagsPage = ({ tags }: { tags: { [key: string]: number } }) => {
  const entries = Object.entries(tags).sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
  );

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-5xl font-normal text-ink dark:text-on-dark mb-3 tracking-tight">
        Tags
      </h1>
      <p className="font-body text-sm text-muted dark:text-on-dark-soft mb-8">
        {entries.length} chủ đề · {entries.reduce((n, [, c]) => n + c, 0)} lượt gán
      </p>
      <div className="flex flex-wrap gap-2.5">
        {entries.map(([tag, count]) => (
          <Link key={tag} href={`/post?tag=${encodeURIComponent(tag)}`} legacyBehavior>
            <a className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-pill border border-hairline dark:border-surface-dark-elevated bg-canvas dark:bg-surface-dark-soft hover:border-primary dark:hover:border-primary transition-colors duration-200">
              <span className="font-body text-sm text-ink dark:text-on-dark">{tag}</span>
              <span className="font-mono text-[11px] text-muted dark:text-muted-soft">{count}</span>
            </a>
          </Link>
        ))}
      </div>
    </div>
  );
};
```

Chip giữ cùng cỡ chữ thay vì scale theo độ phổ biến: `Design.md` không định expressive type cho UI label.
`bg-neutral-100`, `dark:bg-neutral-800`, `primary-50`, `primary-900/30` **không tồn tại** trong `tailwind.config.js` (`primary` là màu phẳng, không có scale) → state hover trước đó chưa từng render.

- [ ] **Step 2: Build + xem**

Run: `yarn build`
Run: `yarn dev`, mở `/tags` light + dark, bấm 1 tag.
Expected: chip bo góc pill, đếm thẳng hàng, hover viền coral, link tới `/post?tag=…` có lọc đúng.

- [ ] **Step 3: Commit**

```bash
git add pages/tags.tsx
git commit -m "fix(tags): use real design tokens and sort by post count"
```

---

## Task C4: `/about` + `/projects`

**Files:**
- Modify: `pages/about.tsx:10-28`
- Modify: `pages/projects.tsx:3-7`

- [ ] **Step 1: About 2 cột**

```tsx
const About = () => {
  const techStack = [
    'javascript,typescript,nodejs',
    'react,redux,nextjs,vue,sass,tailwindcss',
    'ruby,rails,mongodb,postgresql,mysql,gcp,docker',
  ];
  const rows: [string, React.ReactNode][] = [
    ['Email', <a key="email" className="text-primary hover:text-primary-active underline underline-offset-2" href="mailto:vyquocvu@gmail.com">vyquocvu@gmail.com</a>],
    ['Skype', <a key="skype" className="text-primary hover:text-primary-active underline underline-offset-2" href="skype:live:vyquocvu?chat">live:vyquocvu</a>],
    ['Work', 'Web development, backend to frontend'],
    ['Graduate', <a key="oisp" className="text-primary hover:text-primary-active underline underline-offset-2" href="https://oisp.hcmut.edu.vn/en/study-programs/bachelor-degree/computer-science">Bachelor of Computer Science</a>],
  ];

  return (
    <div className="mx-auto max-w-3xl lg:max-w-none">
      <h1 className="font-display text-5xl font-normal text-ink dark:text-on-dark mb-8 tracking-tight">About</h1>
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)] lg:gap-12">
        <div>
          <p className="font-body text-body dark:text-on-dark-soft leading-relaxed mb-6">
            <span className="font-medium text-ink dark:text-on-dark">Vy Quốc Vũ</span> — Software Engineer.
          </p>
          <dl className="divide-y divide-hairline dark:divide-surface-dark-elevated border-y border-hairline dark:border-surface-dark-elevated">
            {rows.map(([k, v]) => (
              <div key={k} className="py-3 grid grid-cols-[7rem_minmax(0,1fr)] gap-4">
                <dt className="font-body text-[11px] uppercase tracking-widest text-muted-soft font-medium pt-1">{k}</dt>
                <dd className="font-body text-sm text-body dark:text-on-dark-soft">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="mt-10 lg:mt-0">
          <p className="font-body text-[11px] uppercase tracking-widest text-muted-soft font-medium mb-4">Stack</p>
          <Image width={375} height={50} alt="skills" src={`https://skillicons.dev/icons?i=${techStack.join(',')}&perline=8`} />
        </div>
      </div>
    </div>
  );
};
```

Cần `import type { ReactNode } from 'react';` nếu project không có global `React` type (Pages Router + `jsx: preserve` → nên import tường minh, dùng `ReactNode` thay `React.ReactNode`).

- [ ] **Step 2: Projects empty state**

```tsx
const Projects = () => (
  <div className="mx-auto max-w-2xl py-12 text-center">
    <h1 className="font-display text-5xl font-normal text-ink dark:text-on-dark tracking-tight">Projects</h1>
    <p className="mt-4 font-body text-sm text-muted dark:text-on-dark-soft leading-relaxed">
      Chưa có gì để giới thiệu ở đây. Mã nguồn của site này công khai.
    </p>
    <a
      href="https://github.com/vyquocvu/vux"
      className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-on-primary font-body text-sm font-medium hover:bg-primary-active transition-colors duration-200"
    >
      github.com/vyquocvu/vux
    </a>
  </div>
);
```

Không bịa danh sách project (D9). Trang vẫn không có trong nav `config.js:13` — giữ nguyên, chỉ sửa nội dung.

- [ ] **Step 3: Build + xem**

Run: `yarn build`
Run: `yarn dev`, mở `/about` ở 1440 (2 cột) và 768 (1 cột), `/projects`.
Expected: `/about` không còn khối text một cột; `/projects` không còn "Coming soon...".

- [ ] **Step 4: Commit**

```bash
git add pages/about.tsx pages/projects.tsx
git commit -m "feat(about): two-column about layout and a real projects empty state"
```

---

## Task C5: `/contact` — form có style thật

**Files:**
- Modify: `pages/contact.tsx:29-70`

Input/textarea/button hiện **không có một dòng style nào** (`className="mb-4"`), và `w-128` (32rem) là hardcoded width.

- [ ] **Step 1: Viết lại JSX form**

```tsx
const field =
  'w-full mb-5 px-3.5 py-2.5 rounded-md bg-canvas dark:bg-surface-dark-soft ' +
  'border border-hairline dark:border-surface-dark-elevated ' +
  'font-body text-sm text-ink dark:text-on-dark placeholder:text-muted-soft ' +
  'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ' +
  'transition-shadow duration-200';

const channels = [
  { label: 'Email', value: 'vyquocvu@gmail.com', href: 'mailto:vyquocvu@gmail.com' },
  { label: 'GitHub', value: '@vyquocvu', href: 'https://github.com/vyquocvu' },
  { label: 'LinkedIn', value: 'in/vyquocvu', href: 'https://linkedin.com/in/vyquocvu' },
];

  return (
    <div className="mx-auto max-w-3xl lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,16rem)] lg:gap-12">
      <div className="post-page-view">
        <Link href="/" legacyBehavior>
          <span className="mb-6 border border-hairline dark:border-surface-dark-elevated hover:border-primary dark:hover:border-primary rounded-full inline-flex items-center justify-center cursor-pointer w-9 h-9 transition-colors duration-200">
            <Image priority width={36} height={36} src="/icons/left_arrow.svg" alt="left" />
          </span>
        </Link>

        {status === 'SUCCESS' ? (
          <div className="mt-2 rounded-lg border border-success/40 bg-surface-soft dark:bg-surface-dark-soft p-8">
            <h3 className="font-display text-2xl font-normal text-ink dark:text-on-dark">
              Đã gửi. Cảm ơn bạn!
            </h3>
            <p className="mt-2 font-body text-sm text-muted dark:text-on-dark-soft">
              Tôi sẽ trả lời qua email bạn vừa nhập.
            </p>
          </div>
        ) : (
          <form onSubmit={submitForm} action="https://formspree.io/f/xvovgjzr" method="POST" className="mt-2">
            <h3 className="font-display text-3xl font-normal text-ink dark:text-on-dark mb-6 tracking-tight">
              Để lại lời nhắn
            </h3>
            <label htmlFor="name" className="block font-body text-[11px] uppercase tracking-widest text-muted dark:text-on-dark-soft font-medium mb-1.5">Tên</label>
            <input type="text" id="name" name="name" required placeholder="Tên của bạn" className={field} />
            <label htmlFor="email" className="block font-body text-[11px] uppercase tracking-widest text-muted dark:text-on-dark-soft font-medium mb-1.5">Email</label>
            <input type="email" id="email" name="email" required placeholder="you@example.com" className={field} />
            <label htmlFor="message" className="block font-body text-[11px] uppercase tracking-widest text-muted dark:text-on-dark-soft font-medium mb-1.5">Nội dung</label>
            <textarea id="message" name="message" required placeholder="Viết gì đó…" className={`${field} h-28 resize-y`} />
            {status === 'ERROR' && (
              <p className="font-body text-sm font-medium text-error -mt-2 mb-3">Gửi thất bại, thử lại sau nhé.</p>
            )}
            <button
              type="submit"
              className="px-5 py-2.5 rounded-md bg-primary text-on-primary font-body text-sm font-medium hover:bg-primary-active transition-colors duration-200"
            >
              Gửi
            </button>
          </form>
        )}
      </div>

      <aside className="mt-12 lg:mt-0">
        <p className="font-body text-[11px] uppercase tracking-widest text-muted-soft font-medium mb-4">Hoặc liên hệ trực tiếp</p>
        <ul className="space-y-3">
          {channels.map((c) => (
            <li key={c.label}>
              <a href={c.href} className="block font-body text-sm text-ink dark:text-on-dark hover:text-primary">
                {c.label}
                <span className="block text-muted-soft text-xs">{c.value}</span>
              </a>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
```

`required` mới: Formspree hiện nhận post rỗng nên user có thể gửi message trống. Bỏ nút "Thanks!" trùng nhánh (`:57-61`) vì `status === 'SUCCESS'` đã chặn cả form.

- [ ] **Step 2: Build + gửi thử**

Run: `yarn build`
Run: `yarn dev`, mở `/contact`: input cao ~40px theo `Design.md`, focus có ring coral, gửi thử 1 lần với email thật của bạn và xác nhận nhánh SUCCESS render.
Expected: không còn input trần; gửi lỗi thì hiện `.text-error` và form vẫn còn dữ liệu.

- [ ] **Step 3: Commit**

```bash
git add pages/contact.tsx
git commit -m "feat(contact): style the form and add direct contact channels"
```

---

## Task C6: Kiểm chứng cuối

- [ ] **Step 1: Static checks**

Run: `node --experimental-strip-types scripts/toc-check.ts`
Expected: `OK  posts=47  h2-h4=161  bai co TOC(>=2)=33  bai >=10 heading=3`
Run: `yarn lint && yarn build`
Expected: cả hai pass.

Lưu ý đo được lúc verify: `next build` đọc D1 **local** qua miniflare proxy, và proxy này thỉnh thoảng trả `D1_ERROR: Failed to parse body as JSON`. Fetcher ăn `try/catch` nên build vẫn exit 0, nhưng vài trang `/post/*` bị prerender thành "Post not found". Đã chạy baseline (commit trước khi sửa code) để loại trừ: baseline cũng lỗi 3–5 query/47 trang, vậy đây là flakiness của môi trường local (trên máy có nhiều `workerd` của project khác đang chạy), không phải do plan này. Build thật trên Cloudflare dùng remote D1. Khi cần số tin cậy, verify từng trang qua `yarn dev` (một request một lần) thay vì dựa vào số trang prerender.

- [ ] **Step 2: Đo gutter hết chết**

Chạy `yarn dev` rồi lặp lại lệnh đo ở Task A10 Step 4.
Expected: mọi viewport `|left - right| ≤ 8`; `/post/[slug]` ở 1440 có `rail: true`, ở 1024 có `rail: false`.

- [ ] **Step 3: Ma trận thủ công**

| Trang | 1920 | 1440 | 1280 | 1024 | 768 | 390 | light | dark |
|---|---|---|---|---|---|---|---|---|
| `/` (nhiều ảnh) | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| `/` (bài 0 tag, 0 ảnh) | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| `/post?tag=javascript` | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| `/post/[slug]` 14 heading | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| `/post/[slug]` 0 heading | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| `/tags` | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| `/about` | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| `/contact` | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |

Checklist riêng cho trang bài viết, từng ô viewport:
- [ ] TOC click nhảy đúng heading, không bị sticky bar che (`scroll-margin-top` đã có ở `globals.css` chỉ áp cho `.post-page-view` — xác nhận bằng mắt).
- [ ] Marker active bám theo scroll, không nhảy ngược khi scroll lên.
- [ ] Code block dài scroll ngang, **không** đẩy vỡ cột.
- [ ] Ảnh trong bài không tràn ra rail.
- [ ] Comment Cusdis + applause button vẫn render và không đè rail.
- [ ] Không có heading nào trong bài bị mất id (mở DevTools, đếm `h2[id], h3[id], h4[id]` ≥ số mục TOC).

- [ ] **Step 4: Commit nếu còn sửa**

```bash
git add -A && git commit -m "fix(ui): apply verification pass corrections"
```

---

## Self-review của plan

**1. Spec coverage** — D1→A7/A9 · D2→A9 (grid `xl:`) · D3→A5/A9 (`variant="details"`) · D4→A8 · D5→A3 · D6→A10 · D7→B1/B2 · D8→B1 · D9→C4. §3.1→A2/A3 · §3.2→A5 · §3.3→A8 · §3.4→A7 · §3.5→A7 (comment) · §3.6→A9 · §3.7→C1/C2 · §3.8→C3 · §3.9→C4/C5. §4 edge case→A3 Step 5, A8, C1. §5→A1/A2 (snapshot), A3 (toc-check), A10 + C6 (measure + ma trận). Không còn gap.

**2. Placeholder** — không còn "TBD"/"tương tự Task N"; mỗi bước sửa code đều có code. Task C6 Step 3 là checklist thủ công, đó là hình thức verification của plan này (không có test runner) nên giữ nguyên, không phải placeholder.

**3. Type consistency** — `TocEntry{id,label,level:2|3|4}` dùng chung ở A3/A4/A5/A8/A9. `LatestPost{uid,slug,title,updatedAt}` khớp A6 (fetcher) và A8 (props). `buildToc → {html,toc,minutes}` khớp A3/A9. `useActiveHeading(toc): string` khớp A4/A8. `serializeTag/parseAttrs/stripTags` khớp A2/A3.
