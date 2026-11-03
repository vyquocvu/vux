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
