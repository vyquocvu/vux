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
  assert.equal(new Set(toc.map((t) => t.id)).size, toc.length, `trùng id trong: ${p.title}`);
  for (const t of toc) {
    assert.ok(t.id.length > 0, `id rỗng trong: ${p.title}`);
    assert.ok(/^[a-z0-9-]+$/.test(t.id), `id không hợp lệ "${t.id}" trong: ${p.title}`);
    assert.ok(html.includes(`id="${t.id}"`), `id "${t.id}" thiếu trong html: ${p.title}`);
    assert.ok(t.label.length > 0, `label rỗng trong: ${p.title}`);
    assert.ok(t.level >= 2 && t.level <= 4, `level ngoài phạm vi: ${p.title}`);
  }
  assert.ok(minutes >= 1 && minutes < 400, `minutes vô lý "${minutes}" trong: ${p.title}`);

  // idempotent: a second pass must not add or change anything
  const again = buildToc(html);
  assert.equal(again.html, html, `buildToc không idempotent: ${p.title}`);
  assert.deepEqual(again.toc.map((t) => t.id), toc.map((t) => t.id), `toc đổi id: ${p.title}`);

  // escaped tags inside code samples must never become headings
  assert.ok(!/&lt;h[2-4]&gt;/.test(html.match(/id="[^"]*"[^>]*>&lt;/g)?.join("") ?? ""));

  if (toc.length >= 2) withToc += 1;
  totalHeadings += toc.length;
  if (toc.length >= 10) deep.push(`${p.title} (${toc.length})`);
}

console.log(`OK  posts=${list.length}  h2-h4=${totalHeadings}  bai co TOC(>=2)=${withToc}  bai >=10 heading=${deep.length}`);
if (argv[2] === "--verbose") deep.forEach((d) => console.log("   deep:", d));
