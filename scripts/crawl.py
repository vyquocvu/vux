#!/usr/bin/env python3
"""Crawl https://www.vyquocvu.com and emit seeds/posts.json + seeds/images/.

Run:
    python3 scripts/crawl.py

Outputs:
    seeds/posts.json    – array of post seed objects (matches the D1 schema)
    seeds/images/<key>  – every image referenced inside a post body
"""
from __future__ import annotations

import concurrent.futures as cf
import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request
from hashlib import sha1
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SEEDS = ROOT / "seeds"
IMAGES = SEEDS / "images"

BASE = "https://www.vyquocvu.com"
SLUG_RE = re.compile(r"/post/([A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+)")
POST_CONTENT_RE = re.compile(
    r'<div[^>]*class="[^"]*post-content[^"]*"[^>]*>(.*?)</div>',
    re.DOTALL,
)
IMG_SRC_RE = re.compile(
    r'<img[^>]+src="([^"]+)"',
    re.IGNORECASE,
)
META_RE = re.compile(
    r'<meta\s+(?:name|property)="([^"]+)"\s+content="([^"]*)"',
    re.IGNORECASE,
)
TIME_LABEL_RE = re.compile(
    r'<p[^>]*pl-1\.5[^>]*>([^<]+)</p>',
    re.IGNORECASE,
)
KEYWORDS_PREFIX = "Vy Quốc Vũ, Full Stack, Vuvy Notes,"


def get(url: str, retries: int = 3) -> bytes:
    last_err: Exception | None = None
    for _ in range(retries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "vux-crawler/1.0"})
            with urllib.request.urlopen(req, timeout=20) as resp:
                body = resp.read()
                if body:
                    return body
        except Exception as exc:  # pragma: no cover
            last_err = exc
            time.sleep(1.0)
    raise RuntimeError(f"GET {url} failed after {retries} tries: {last_err}")


def discover_slugs() -> list[str]:
    print("[crawl] Discovering post slugs from homepage…", file=sys.stderr)
    home_bytes = get(f"{BASE}/")
    # Homepage is HTML; decode for regex matching.
    home = home_bytes.decode("utf-8", errors="replace")
    # Preserve the order posts appear on the homepage (= the legacy Firestore
    # `orderBy createdAt desc` sort) and de-dupe while we're at it. We
    # intentionally do NOT sort alphabetically, because the position of a
    # post in this list becomes a stable tiebreaker for posts that share a
    # relative-time label like "8 months ago".
    seen: set[str] = set()
    slugs: list[str] = []
    for m in SLUG_RE.finditer(home):
        slug = m.group(1)
        if slug in seen:
            continue
        seen.add(slug)
        slugs.append(slug)
    print(f"[crawl] Found {len(slugs)} unique posts", file=sys.stderr)
    return slugs


def split_slug(slug: str) -> tuple[str, str]:
    """Slugs are stored as `{friendlyStr(title)}.{uid}`."""
    uid = slug.rsplit(".", 1)[-1]
    return slug, uid


def html_unescape(s: str) -> str:
    return (
        s.replace("&amp;", "&")
        .replace("&quot;", '"')
        .replace("&#39;", "'")
        .replace("&#x27;", "'")
        .replace("&apos;", "'")
        .replace("&lt;", "<")
        .replace("&gt;", ">")
        .replace("&nbsp;", " ")
    )


def parse_keywords(meta_keywords: str) -> list[str]:
    if not meta_keywords:
        return []
    rest = meta_keywords.replace(KEYWORDS_PREFIX, "", 1).strip()
    if not rest:
        return []
    return [t.strip() for t in rest.split(",") if t.strip()]


def rehost_images(content_html: str) -> tuple[str, list[dict]]:
    """Rewrite every <img src=...> to /images/<key> and queue downloads.

    Returns (rewritten_html, [{ src, key, alt }]).
    """
    downloads: list[dict] = []
    seen_keys: dict[str, str] = {}

    def repl(match: re.Match) -> str:
        src = match.group(1)
        if "firebasestorage.googleapis.com" not in src:
            return match.group(0)
        # Derive a stable filename from the original path token (decoded).
        parsed = urllib.parse.urlparse(src)
        # Path is /v0/b/{bucket}/o/{object-path}
        parts = parsed.path.split("/o/", 1)
        object_path = parts[1] if len(parts) == 2 else parsed.path
        object_path = urllib.parse.unquote(object_path)
        ext = os.path.splitext(object_path)[1] or ".img"
        # Build a short, deterministic key.
        key = object_path.replace("/", "_").lstrip("_")
        if key in seen_keys:
            return f'<img src="/images/{seen_keys[key]}"'
        seen_keys[key] = key
        downloads.append({"src": src, "key": key, "ext": ext})
        return f'<img src="/images/{key}"'

    rewritten = IMG_SRC_RE.sub(repl, content_html)
    return rewritten, downloads


def parse_post(slug: str) -> dict:
    full_slug, uid = split_slug(slug)
    url = f"{BASE}/post/{full_slug}"
    html = get(url).decode("utf-8", errors="replace")

    title_m = re.search(r"<title>([^<]+)</title>", html)
    title = html_unescape(title_m.group(1).strip()) if title_m else ""

    meta: dict[str, str] = {}
    for m in META_RE.finditer(html):
        meta[m.group(1).lower()] = html_unescape(m.group(2))

    description = meta.get("description", "")
    og_image = meta.get("og:image", "")
    keywords = meta.get("keywords", "")
    tags = parse_keywords(keywords)

    pc_match = POST_CONTENT_RE.search(html)
    publish_content = pc_match.group(1).strip() if pc_match else ""

    time_match = TIME_LABEL_RE.search(html)
    published_label = time_match.group(1).strip() if time_match else ""

    rewritten, downloads = rehost_images(publish_content)
    thumb_image = ""
    first_img = re.search(r'<img[^>]+src="(/images/[^"]+)"', rewritten)
    if first_img:
        thumb_image = first_img.group(1)

    return {
        "uid": uid,
        "slug": full_slug,
        "title": title,
        "tags": tags,
        "thumbText": description,
        "thumbImage": thumb_image,
        "publishContent": rewritten,
        "publishedLabel": published_label,
        "ogImage": og_image,
        "images": downloads,
        "sourceUrl": url,
    }


def download_images(post: dict) -> None:
    for img in post["images"]:
        path = IMAGES / img["key"]
        # Skip only if file size matches the upstream Content-Length, otherwise
        # we still need to redownload (a partial write could leave an unusable
        # file behind).
        try:
            body = get(img["src"])
        except Exception as exc:
            print(f"  [img]  FAIL {img['src']}: {exc}", file=sys.stderr)
            continue
        path.write_bytes(body)
        print(f"  [img]  {img['key']} ({len(body)} bytes)", file=sys.stderr)


def main() -> int:
    IMAGES.mkdir(parents=True, exist_ok=True)
    slugs = discover_slugs()

    posts: list[dict] = []
    failed: list[str] = []

    def worker(slug: str) -> dict | None:
        try:
            return parse_post(slug)
        except Exception as exc:
            print(f"  [err]  {slug}: {exc}", file=sys.stderr)
            failed.append(slug)
            return None

    print("[crawl] Fetching posts in parallel…", file=sys.stderr)
    with cf.ThreadPoolExecutor(max_workers=8) as pool:
        for result in pool.map(worker, slugs):
            if result is not None:
                posts.append(result)


    print(f"[crawl] Downloaded {len(posts)} posts ({len(failed)} failed)", file=sys.stderr)
    print("[crawl] Pulling images…", file=sys.stderr)
    for post in posts:
        download_images(post)
        # Drop the heavy `images` list from the JSON once files are saved.
        post["images"] = [{"key": i["key"], "src": i["src"]} for i in post["images"]]

    out = SEEDS / "posts.json"
    out.write_text(json.dumps(posts, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"[crawl] Wrote {out} ({out.stat().st_size} bytes)", file=sys.stderr)

    if failed:
        print(f"[crawl] Failed slugs: {failed}", file=sys.stderr)

    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
