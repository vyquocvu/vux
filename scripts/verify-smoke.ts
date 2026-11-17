#!/usr/bin/env node
/**
 * Self-contained smoke verification harness for Vux.
 * Starts `yarn dev` on an ephemeral port + headless Chrome over CDP, verifies
 * core public/media/auth/post-detail flows, prints structured evidence, and
 * tears down every spawned process group cleanly.
 *
 * Usage:
 *   node --experimental-strip-types scripts/verify-smoke.ts
 *   BASE_URL=http://127.0.0.1:3000 node --experimental-strip-types scripts/verify-smoke.ts
 */
import assert from "node:assert/strict";
import { spawn, type ChildProcess } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import net from "node:net";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { env, exit } from "node:process";

const CHROME_PATH =
  env.CHROME_PATH ??
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function getFreePort(): Promise<number> {
  return new Promise((res, rej) => {
    const srv = net.createServer();
    srv.unref();
    srv.on("error", rej);
    srv.listen(0, "127.0.0.1", () => {
      const addr = srv.address();
      if (!addr || typeof addr === "string") {
        srv.close(() => rej(new Error("failed to allocate port")));
        return;
      }
      const { port } = addr;
      srv.close(() => res(port));
    });
  });
}

function killGroup(child: ChildProcess | null, signal: NodeJS.Signals) {
  if (!child?.pid) return;
  try {
    process.kill(-child.pid, signal);
  } catch {
    try {
      child.kill(signal);
    } catch {
      /* already exited */
    }
  }
}

async function stopChild(child: ChildProcess | null, label: string) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return;
  killGroup(child, "SIGTERM");
  const deadline = Date.now() + 2500;
  while (Date.now() < deadline) {
    if (child.exitCode !== null || child.signalCode !== null) return;
    await sleep(50);
  }
  killGroup(child, "SIGKILL");
  const killDeadline = Date.now() + 1000;
  while (Date.now() < killDeadline) {
    if (child.exitCode !== null || child.signalCode !== null) return;
    await sleep(50);
  }
  console.warn(`[verify] warning: ${label} pid=${child.pid} did not confirm exit`);
}

async function waitForServer(baseUrl: string, child: ChildProcess, timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`dev server exited prematurely with code ${child.exitCode}`);
    }
    try {
      const res = await fetch(`${baseUrl}/api/auth/me`);
      if (res.status === 200) return;
    } catch {
      /* not listening yet */
    }
    await sleep(200);
  }
  throw new Error(`dev server did not become ready within ${timeoutMs}ms`);
}

interface CdpSession {
  ws: WebSocket;
  send: (method: string, params?: Record<string, unknown>) => Promise<any>;
  on: (cb: (ev: any) => void) => () => void;
}

async function waitForPageTarget(cdpPort: number, timeoutMs = 15_000): Promise<string> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`http://127.0.0.1:${cdpPort}/json/list`);
      const targets = (await res.json()) as Array<{ type: string; webSocketDebuggerUrl?: string }>;
      const page = targets.find((t) => t.type === "page" && t.webSocketDebuggerUrl);
      if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
    } catch {
      /* cdp not up yet */
    }
    await sleep(100);
  }
  throw new Error("chrome devtools page target never came up");
}

async function connectCdp(wsUrl: string): Promise<CdpSession> {
  const ws = new WebSocket(wsUrl);
  let nextId = 1;
  const pending = new Map<number, { res: (v: any) => void; rej: (e: any) => void }>();
  const listeners = new Set<(ev: any) => void>();

  ws.addEventListener("message", (ev) => {
    const msg = JSON.parse(String((ev as any).data));
    if (msg.id && pending.has(msg.id)) {
      const { res, rej } = pending.get(msg.id)!;
      pending.delete(msg.id);
      if (msg.error) rej(new Error(`CDP ${msg.error.message ?? JSON.stringify(msg.error)}`));
      else res(msg.result);
    } else if (msg.method) {
      for (const cb of listeners) cb(msg);
    }
  });

  await new Promise<void>((res, rej) => {
    ws.addEventListener("open", () => res(), { once: true });
    ws.addEventListener("error", () => rej(new Error("CDP WebSocket error")), { once: true });
  });

  return {
    ws,
    send: (method, params = {}) =>
      new Promise((res, rej) => {
        const id = nextId++;
        pending.set(id, { res, rej });
        ws.send(JSON.stringify({ id, method, params }));
      }),
    on: (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
  };
}

async function evalJson<T>(cdp: CdpSession, expr: string): Promise<T> {
  const { result, exceptionDetails } = await cdp.send("Runtime.evaluate", {
    expression: `JSON.stringify((() => { ${expr} })())`,
    returnByValue: true,
    awaitPromise: true,
  });
  if (exceptionDetails) {
    throw new Error(`Runtime.evaluate exception: ${JSON.stringify(exceptionDetails)}`);
  }
  return JSON.parse(result.value as string) as T;
}

async function waitForCondition<T>(
  cdp: CdpSession,
  expr: string,
  predicate: (val: T) => boolean,
  timeoutMs = 15_000,
): Promise<T> {
  const deadline = Date.now() + timeoutMs;
  let last: T | undefined;
  while (Date.now() < deadline) {
    last = await evalJson<T>(cdp, expr);
    if (predicate(last)) return last;
    await sleep(100);
  }
  throw new Error(`Condition timed out after ${timeoutMs}ms. Last value: ${JSON.stringify(last)}`);
}

async function navigateAndWait(cdp: CdpSession, url: string, origin: string) {
  const consoleErrors: string[] = [];
  const pageExceptions: string[] = [];
  const sameOriginFailures: string[] = [];
  const reqUrls = new Map<string, string>();

  let loadFired = false;
  const off = cdp.on((ev) => {
    if (ev.method === "Page.loadEventFired") loadFired = true;
    else if (ev.method === "Runtime.exceptionThrown") {
      pageExceptions.push(ev.params?.exceptionDetails?.text ?? "uncaught exception");
    } else if (ev.method === "Runtime.consoleAPICalled" && ev.params?.type === "error") {
      const args = (ev.params.args ?? []).map((a: any) => a.value ?? a.description ?? "").join(" ");
      // Next.js 15 dev mode logs a deprecation notice via console.error for existing `<Link legacyBehavior>` usages.
      if (!args.includes("`legacyBehavior` is deprecated")) {
        consoleErrors.push(args);
      }
    } else if (ev.method === "Network.requestWillBeSent") {
      reqUrls.set(ev.params.requestId, ev.params.request?.url ?? "");
    } else if (ev.method === "Network.responseReceived") {
      const rUrl: string = ev.params.response?.url ?? "";
      const status: number = ev.params.response?.status ?? 0;
      if (rUrl.startsWith(origin) && status >= 400) {
        sameOriginFailures.push(`${status} ${rUrl}`);
      }
    } else if (ev.method === "Network.loadingFailed") {
      const rUrl = reqUrls.get(ev.params.requestId) ?? "";
      if (rUrl.startsWith(origin) && !ev.params.canceled) {
        sameOriginFailures.push(`FAILED ${rUrl} (${ev.params.errorText})`);
      }
    }
  });

  try {
    await cdp.send("Page.navigate", { url });
    const deadline = Date.now() + 20_000;
    while (!loadFired && Date.now() < deadline) await sleep(50);
    if (!loadFired) throw new Error(`Page.loadEventFired timed out for ${url}`);
    // Wait until document.readyState is complete
    await waitForCondition<string>(
      cdp,
      "return document.readyState;",
      (s) => s === "complete",
      5_000,
    );
  } finally {
    off();
  }

  return { consoleErrors, pageExceptions, sameOriginFailures };
}

interface CheckResult {
  name: string;
  ok: boolean;
  ms: number;
  detail: string;
}

const results: CheckResult[] = [];

async function check(name: string, fn: () => Promise<string>) {
  const t0 = Date.now();
  try {
    const detail = await fn();
    const ms = Date.now() - t0;
    results.push({ name, ok: true, ms, detail });
    console.log(`PASS  ${name} (${ms}ms) — ${detail}`);
  } catch (err) {
    const ms = Date.now() - t0;
    const detail = err instanceof Error ? err.message : String(err);
    results.push({ name, ok: false, ms, detail });
    console.error(`FAIL  ${name} (${ms}ms) — ${detail}`);
  }
}

async function main() {
  const totalStart = Date.now();
  let devProc: ChildProcess | null = null;
  let chromeProc: ChildProcess | null = null;
  let cdp: CdpSession | null = null;
  const chromeProfile = mkdtempSync(resolve(tmpdir(), "vux-verify-chrome-"));
  let serverLogs = "";

  const cleanup = async () => {
    try {
      cdp?.ws.close();
    } catch {
      /* ignore */
    }
    await Promise.all([
      stopChild(chromeProc, "chrome"),
      stopChild(devProc, "next-dev"),
    ]);
    rmSync(chromeProfile, { recursive: true, force: true });
  };

  process.on("SIGINT", async () => {
    await cleanup();
    exit(130);
  });
  process.on("SIGTERM", async () => {
    await cleanup();
    exit(143);
  });

  try {
    let baseUrl = env.BASE_URL;
    if (!baseUrl) {
      const appPort = await getFreePort();
      baseUrl = `http://127.0.0.1:${appPort}`;
      devProc = spawn("yarn", ["dev", "-H", "127.0.0.1", "-p", String(appPort)], {
        detached: true,
        stdio: ["ignore", "pipe", "pipe"],
        env: { ...env, PORT: String(appPort) },
      });
      devProc.stdout?.on("data", (d) => {
        serverLogs += d.toString();
      });
      devProc.stderr?.on("data", (d) => {
        serverLogs += d.toString();
      });
      await check("boot:next-dev", async () => {
        await waitForServer(baseUrl!, devProc!);
        return baseUrl!;
      });
      if (!results[results.length - 1]?.ok) {
        if (serverLogs) {
          console.error("\n--- server logs (tail) ---\n" + serverLogs.slice(-1500));
        }
        process.exitCode = 1;
        return;
      }
    }

    const cdpPort = await getFreePort();
    chromeProc = spawn(
      CHROME_PATH,
      [
        "--headless=new",
        `--remote-debugging-port=${cdpPort}`,
        `--user-data-dir=${chromeProfile}`,
        "--no-first-run",
        "--no-default-browser-check",
        "--disable-gpu",
        "--disable-extensions",
        "--disable-background-networking",
        "--disable-sync",
        "--disable-component-update",
        "--mute-audio",
        "--remote-allow-origins=*",
        "about:blank",
      ],
      { detached: true, stdio: ["ignore", "ignore", "pipe"] },
    );

    const wsUrl = await waitForPageTarget(cdpPort);
    cdp = await connectCdp(wsUrl);
    await cdp.send("Page.enable");
    await cdp.send("Network.enable");
    await cdp.send("Runtime.enable");
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await cdp.send("Emulation.setEmulatedMedia", {
      features: [{ name: "prefers-color-scheme", value: "light" }],
    });

    let samplePostHref = "";
    let sampleUid = "";
    let sampleImagePath = "";

    await check("browser:home-feed", async () => {
      const nav = await navigateAndWait(cdp!, `${baseUrl}/`, baseUrl!);
      assert.deepEqual(nav.pageExceptions, [], `page exceptions: ${nav.pageExceptions.join("; ")}`);
      assert.deepEqual(nav.consoleErrors, [], `console errors: ${nav.consoleErrors.join("; ")}`);
      assert.deepEqual(nav.sameOriginFailures, [], `network failures: ${nav.sameOriginFailures.join("; ")}`);

      const dom = await waitForCondition<{
        articles: number;
        firstHref: string;
        brokenImgs: string[];
        firstImgSrc: string;
      }>(
        cdp!,
        `const articles = document.querySelectorAll(".feed article");
         const firstLink = document.querySelector('.feed article h2 a');
         const imgs = [...document.querySelectorAll('.feed img')];
         return {
           articles: articles.length,
           firstHref: firstLink ? firstLink.getAttribute('href') || '' : '',
           firstImgSrc: imgs[0] ? imgs[0].getAttribute('src') || '' : '',
           brokenImgs: imgs.filter(i => i.complete && i.naturalWidth === 0).map(i => i.getAttribute('src') || '?'),
         };`,
        (d) => d.articles > 0 && d.firstHref.startsWith("/post/"),
      );

      assert.ok(dom.articles >= 1, `expected >= 1 articles, got ${dom.articles}`);
      assert.deepEqual(dom.brokenImgs, [], `broken images: ${dom.brokenImgs.join(", ")}`);

      samplePostHref = dom.firstHref;
      sampleUid = samplePostHref.split(".").pop() ?? "";
      sampleImagePath = dom.firstImgSrc.startsWith("/images/") ? dom.firstImgSrc : "";
      assert.ok(sampleUid.length > 0, `could not extract uid from ${samplePostHref}`);
      return `articles=${dom.articles}, sample=${samplePostHref}`;
    });

    await check("browser:post-detail-and-rail", async () => {
      assert.ok(samplePostHref, "missing samplePostHref from home check");
      const nav = await navigateAndWait(cdp!, `${baseUrl}${samplePostHref}`, baseUrl!);
      assert.deepEqual(nav.pageExceptions, [], `page exceptions: ${nav.pageExceptions.join("; ")}`);
      assert.deepEqual(nav.consoleErrors, [], `console errors: ${nav.consoleErrors.join("; ")}`);
      assert.deepEqual(nav.sameOriginFailures, [], `network failures: ${nav.sameOriginFailures.join("; ")}`);

      const post = await waitForCondition<{
        title: string;
        contentLen: number;
        railVisible: boolean;
        tocLinks: number;
        missingTargets: string[];
        clapVisible: boolean;
        commentsLoaded: boolean;
        brokenImgs: string[];
      }>(
        cdp!,
        `const title = (document.querySelector('.post-title')?.textContent || '').trim();
         const content = document.querySelector('.post-content');
         const aside = document.querySelector('aside');
         const railVisible = !!aside && getComputedStyle(aside).display !== 'none';
         const tocAnchors = [...document.querySelectorAll('aside nav a[href^="#"]')];
         const missingTargets = tocAnchors
           .map(a => decodeURIComponent((a.getAttribute('href') || '').slice(1)))
           .filter(id => !document.getElementById(id));
         const clapVisible = !!document.querySelector('.post-applause button');
         const commentsText = document.body.innerText;
         const commentsLoaded = !commentsText.includes('Đang tải bình luận...');
         const imgs = [...document.querySelectorAll('.post-content img')];
         if (!sampleSrcFallback) {}
         return {
           title,
           contentLen: (content?.textContent || '').trim().length,
           railVisible,
           tocLinks: tocAnchors.length,
           missingTargets,
           clapVisible,
           commentsLoaded,
           brokenImgs: imgs.filter(i => i.complete && i.naturalWidth === 0).map(i => i.getAttribute('src') || '?'),
         };`.replace("if (!sampleSrcFallback) {}", ""),
        (d) => d.title.length > 0 && d.contentLen > 0 && d.commentsLoaded,
      );

      assert.ok(post.railVisible, "expected reading rail <aside> visible at 1440px");
      assert.deepEqual(post.missingTargets, [], `TOC links missing target ids: ${post.missingTargets.join(", ")}`);
      assert.ok(post.clapVisible, "expected ClapButton rendered");
      assert.deepEqual(post.brokenImgs, [], `broken post images: ${post.brokenImgs.join(", ")}`);

      if (!sampleImagePath) {
        const imgSrc = await evalJson<string>(
          cdp!,
          `const i = document.querySelector('.post-content img[src^="/images/"]'); return i ? i.getAttribute('src') || '' : '';`,
        );
        if (imgSrc) sampleImagePath = imgSrc;
      }

      return `title="${post.title.slice(0, 40)}", tocLinks=${post.tocLinks}, rail=${post.railVisible}`;
    });

    await check("http:public-routes", async () => {
      const routes = ["/tags", "/about", "/contact", "/login", "/signup", "/post"];
      const statuses: string[] = [];
      for (const r of routes) {
        const res = await fetch(`${baseUrl}${r}`, { redirect: "manual" });
        assert.equal(res.status, 200, `${r} returned ${res.status}`);
        const html = await res.text();
        assert.ok(html.length > 500, `${r} body unexpectedly short (${html.length})`);
        statuses.push(`${r}:${res.status}`);
      }
      return statuses.join(" ");
    });

    await check("http:media-middleware-r2", async () => {
      assert.ok(sampleImagePath, "no /images/* asset discovered on homepage or sample post");
      const full = await fetch(`${baseUrl}${sampleImagePath}`);
      assert.equal(full.status, 200, `GET ${sampleImagePath} -> ${full.status}`);
      const cc = full.headers.get("cache-control") ?? "";
      assert.ok(cc.includes("immutable"), `expected immutable Cache-Control, got "${cc}"`);
      const buf = new Uint8Array(await full.arrayBuffer());
      assert.ok(buf.byteLength > 32, `unexpectedly small image (${buf.byteLength}B)`);

      const partial = await fetch(`${baseUrl}${sampleImagePath}`, {
        headers: { Range: "bytes=0-15" },
      });
      assert.equal(partial.status, 206, `Range bytes=0-15 -> ${partial.status}`);
      const cr = partial.headers.get("content-range") ?? "";
      assert.ok(cr.startsWith("bytes 0-15/"), `unexpected Content-Range: ${cr}`);
      const pbuf = new Uint8Array(await partial.arrayBuffer());
      assert.equal(pbuf.byteLength, 16);
      assert.deepEqual(pbuf, buf.slice(0, 16), "206 byte range mismatch against full body");

      const oob = await fetch(`${baseUrl}${sampleImagePath}`, {
        headers: { Range: `bytes=${buf.byteLength + 100}-` },
      });
      assert.equal(oob.status, 416, `OOB Range -> ${oob.status}`);

      const badKey = await fetch(`${baseUrl}/images/bad..key.png`);
      assert.equal(badKey.status, 400, `traversal key -> ${badKey.status}`);

      const missing = await fetch(`${baseUrl}/images/smoke-missing-000.webp`);
      assert.equal(missing.status, 404, `missing image -> ${missing.status}`);

      const etag = full.headers.get("etag");
      if (etag) {
        const notModified = await fetch(`${baseUrl}${sampleImagePath}`, {
          headers: { "If-None-Match": etag },
        });
        assert.equal(notModified.status, 304, `If-None-Match -> ${notModified.status}`);
      }

      return `${sampleImagePath} (${buf.byteLength}B) full=200 range=206 oob=416 bad=400 missing=404${etag ? " etag=304" : ""}`;
    });

    await check("http:api-auth-and-post-endpoints", async () => {
      const me = await fetch(`${baseUrl}/api/auth/me`);
      assert.equal(me.status, 200);
      assert.deepEqual(await me.json(), { authUser: null });

      const adminPosts = await fetch(`${baseUrl}/api/admin/posts`);
      assert.equal(adminPosts.status, 403, `unauth /api/admin/posts -> ${adminPosts.status}`);

      const upload = await fetch(`${baseUrl}/api/upload?path=images/smoke.webp`, { method: "POST" });
      assert.equal(upload.status, 403, `unauth /api/upload -> ${upload.status}`);

      const claps = await fetch(`${baseUrl}/api/posts/${sampleUid}/claps`);
      assert.equal(claps.status, 200);
      const clapsBody = (await claps.json()) as { count?: unknown };
      assert.equal(typeof clapsBody.count, "number", "claps.count must be number");

      const comments = await fetch(`${baseUrl}/api/posts/${sampleUid}/comments`);
      assert.equal(comments.status, 200);
      const commentsBody = (await comments.json()) as { comments?: unknown };
      assert.ok(Array.isArray(commentsBody.comments), "comments must be array");

      const postComment = await fetch(`${baseUrl}/api/posts/${sampleUid}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: "smoke test" }),
      });
      assert.equal(postComment.status, 401, `unauth POST comment -> ${postComment.status}`);

      return `me=200 admin=403 upload=403 claps=${clapsBody.count} comments=${(commentsBody.comments as any[]).length} unauthComment=401`;
    });

    const passed = results.filter((r) => r.ok).length;
    const failed = results.length - passed;
    console.log(`\n[verify] summary: ${passed}/${results.length} passed, ${failed} failed in ${Date.now() - totalStart}ms`);
    if (failed > 0) {
      if (serverLogs) {
        console.error("\n--- server logs (tail) ---\n" + serverLogs.slice(-1500));
      }
      process.exitCode = 1;
    }
  } finally {
    await cleanup();
  }
}

main().catch((err) => {
  console.error("[verify] fatal:", err);
  exit(1);
});
