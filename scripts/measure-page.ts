#!/usr/bin/env node
/**
 * Measure layout-shift / paint metrics for a Vux page with real Chrome over
 * CDP. No third-party dependency: Node 22+ ships fetch and WebSocket.
 *
 *   node --experimental-strip-types scripts/measure-page.mjs <url> [out.json]
 */
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { argv, exit } from "node:process";

const CHROME =
  process.env.CHROME_PATH ??
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const url = argv[2];
if (!url) {
  console.error(
    "usage: measure-page.ts <url> [out.json]\n" +
      "  env: VW VH DSF (viewport), WARM=1 (keep HTTP cache), SETTLE_MS, DEV_PORT, CHROME_PATH",
  );
  exit(2);
}
const outFile = argv[3] ? resolve(argv[3]) : null;
// A fixed port lets a leaked Chrome from a previous run answer the handshake,
// which silently serves every measurement from its warm HTTP cache.
const PORT = Number(process.env.DEV_PORT ?? 9300 + ((Date.now() % 400) | 1));
const COLD = process.env.WARM !== "1";
const VIEWPORT = {
  width: Number(process.env.VW ?? 1280),
  height: Number(process.env.VH ?? 900),
  dsf: Number(process.env.DSF ?? 1),
};
// Let the page settle (external scripts, comment widget) before reading metrics.
const SETTLE_MS = Number(process.env.SETTLE_MS ?? 4000);

const INSTRUMENT = `
window.__vux = {
  cls: 0, shifts: [], lcp: 0, lcpEl: "", inp: 0, fcp: 0, ttfb: 0,
  imgs: [], images: [], longTasks: [], scripts: [], errs: [], gutter: null, anchor: null, sticky: null
};
(() => {
  try {
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) {
        if (e.hadRecentInput) continue;
        window.__vux.cls += e.value;
        window.__vux.shifts.push({
          v: +e.value.toFixed(5),
          t: Math.round(e.startTime),
          nodes: (e.sources || []).slice(0, 3).map((s) => {
            const n = s.node;
            if (!n) return "?";
            const tag = n.tagName || "?";
            const src = tag === "IMG" ? (n.getAttribute("src") || "").split("/").pop() : "";
            return tag + (src ? ":" + src : "");
          }),
        });
      }
    }).observe({ type: "layout-shift", buffered: true });
  } catch (e) { window.__vux.errs.push("cls:" + e); }
  try {
    new PerformanceObserver((l) => {
      const es = l.getEntries();
      const e = es[es.length - 1];
      if (!e) return;
      window.__vux.lcp = Math.round(e.startTime);
      const el = e.element;
      window.__vux.lcpEl = el
        ? (el.tagName || "?") + (el.tagName === "IMG" ? ":" + (el.getAttribute("src") || "").split("/").pop() : "")
        : "?";
      window.__vux.lcpBreakdown = {
        size: e.size,
        ttfb: Math.round(e.renderStart - (performance.getEntriesByType("navigation")[0] || {}).responseStart || 0),
        loadStart: Math.round(e.loadStart || 0),
        loadTime: Math.round(e.loadTime || 0),
        renderTime: Math.round(e.renderTime || 0),
        renderStart: Math.round(e.renderStart || 0),
      };
    }).observe({ type: "largest-contentful-paint", buffered: true });
  } catch (e) { window.__vux.errs.push("lcp:" + e); }
  try {
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) {
        if (e.firstContentfulPaint) window.__vux.fcp = Math.round(e.firstContentfulPaint);
      }
    }).observe({ type: "paint", buffered: true });
  } catch (e) { window.__vux.errs.push("paint:" + e); }
  try {
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) {
        if (e.duration > 50) window.__vux.longTasks.push({ dur: Math.round(e.duration), start: Math.round(e.startTime) });
      }
    }).observe({ type: "longtask", buffered: true });
  } catch (e) { window.__vux.errs.push("longtask:" + e); }
  window.addEventListener("load", () => {
    const nav = performance.getEntriesByType("navigation")[0];
    if (nav) window.__vux.ttfb = Math.round(nav.responseStart);
    window.__vux.imgs = [...document.querySelectorAll(".post-content img")].map((i) => ({
      key: (i.getAttribute("src") || "").split("/").pop(),
      widthAttr: i.getAttribute("width"),
      heightAttr: i.getAttribute("height"),
      loading: i.getAttribute("loading"),
      decoding: i.getAttribute("decoding"),
      fetchpriority: i.getAttribute("fetchpriority"),
      natural: i.naturalWidth + "x" + i.naturalHeight,
      box: Math.round(i.getBoundingClientRect().width) + "x" + Math.round(i.getBoundingClientRect().height),
    }));
    window.__vux.images = performance
      .getEntriesByType("resource")
      .filter((r) => r.name.includes("/images/") || r.name.includes("/audios/"))
      .map((r) => ({
        key: r.name.split("/").pop(),
        start: Math.round(r.startTime),
        dur: Math.round(r.duration),
        bytes: Math.round(r.encodedBodySize),
        transfer: Math.round(r.transferSize),
      }));
    window.__vux.scripts = performance
      .getEntriesByType("resource")
      .filter((r) => r.initiatorType === "script" || r.name.indexOf(".js") >= 0)
      .map((r) => ({
        url: (r.name.split("//")[1] || r.name).slice(0, 70),
        start: Math.round(r.startTime),
        end: Math.round(r.responseEnd),
        dur: Math.round(r.duration),
        bytes: r.transferSize,
      }));
    window.__vux.imgGeom = [...document.querySelectorAll(".post-content img")].map((i) => {
      const r = i.getBoundingClientRect();
      const ar = i.naturalWidth && i.naturalHeight ? i.naturalHeight / i.naturalWidth : null;
      // With object-fit: contain, the painted rectangle is the largest
      // intrinsic-ratio box that fits the frame; the remainder is the CSS
      // placeholder showing through as a grey band.
      const contentH = ar ? Math.min(r.height, r.width * ar) : r.height;
      const contentW = ar ? Math.min(r.width, r.height / ar) : r.width;
      return {
        key: (i.getAttribute("src") || "").split("/").pop(),
        frame: Math.round(r.width) + "x" + Math.round(r.height),
        painted: Math.round(contentW) + "x" + Math.round(contentH),
        greyBandV: Math.round(r.height - contentH),
        inInitialViewport: r.top < window.innerHeight && r.bottom > 0,
        distanceFromTop: Math.round(r.top + scrollY),
        hasPlaceholderBg: getComputedStyle(i).backgroundImage.startsWith("url("),
        // Source pixels delivered vs pixels actually needed at this DPR.
        sourceW: i.naturalWidth,
        neededW: Math.round(r.width * devicePixelRatio),
      };
    });
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
    window.__vux.docHeight = Math.round(document.documentElement.scrollHeight);
    // A fragment URL is the cheapest way to prove the anchor lands below the
    // sticky bar: Chrome honours scroll-margin-top when it scrolls to the hash.
    const target = location.hash
      ? document.getElementById(decodeURIComponent(location.hash.slice(1)))
      : null;
    window.__vux.anchor = target ? Math.round(target.getBoundingClientRect().top) : null;
    // The sticky bar has to paint across the reading column's fluid padding on
    // both sides; a non-zero gap means its background/border stops short.
    const bar = document.querySelector(".post-sticky-bar");
    const col = document.querySelector(".post-reading-column");
    if (bar && col) {
      const b = bar.getBoundingClientRect();
      const c = col.getBoundingClientRect();
      window.__vux.sticky = {
        left: Math.round(b.left - c.left),
        right: Math.round(c.right - b.right),
      };
    }
  });
})();
`;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function waitForPageTarget(retries = 60) {
  for (let i = 0; i < retries; i++) {
    try {
      const targets = (await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()) as any[];
      const page = targets.find((t) => t.type === "page");
      if (page) return page.webSocketDebuggerUrl as string;
    } catch {
      /* devtools endpoint not up yet */
    }
    await sleep(250);
  }
  throw new Error("chrome devtools page target never came up");
}

function connect(wsUrl: string) {
  const ws = new WebSocket(wsUrl);
  let nextId = 1;
  const pending = new Map<number, { res: (v: any) => void; rej: (e: any) => void }>();
  const events: ((e: any) => void)[] = [];
  ws.addEventListener("message", (ev) => {
    const msg = JSON.parse(String((ev as any).data));
    if (msg.id && pending.has(msg.id)) {
      const { res, rej } = pending.get(msg.id)!;
      pending.delete(msg.id);
      msg.error ? rej(new Error(JSON.stringify(msg.error))) : res(msg.result);
    } else if (msg.method) {
      for (const cb of events) cb(msg);
    }
  });
  const open = new Promise<void>((r, j) => {
    ws.addEventListener("open", () => r());
    ws.addEventListener("error", () => j(new Error("ws error")));
  });
  const send = (method: string, params: any = {}) =>
    new Promise<any>((res, rej) => {
      const id = nextId++;
      pending.set(id, { res, rej });
      ws.send(JSON.stringify({ id, method, params }));
    });
  const on = (cb: (e: any) => void) => events.push(cb);
  return { ws, send, open, on };
}

const main = async () => {
  const profile = mkdtempSync(resolve(tmpdir(), "vux-chrome-"));
  const cleanup = () => {
    try {
      // Negative pid kills the whole process group; Chrome spawns helpers that
      // survive a signal to the parent alone and keep the debug port bound.
      process.kill(-chrome.pid!, "SIGKILL");
    } catch {
      chrome.kill("SIGKILL");
    }
    rmSync(profile, { recursive: true, force: true });
  };
  process.on("exit", cleanup);
  process.on("uncaughtException", (e) => {
    console.error(e);
    cleanup();
    exit(1);
  });
  const chrome = spawn(
    CHROME,
    [
      "--headless=new",
      `--remote-debugging-port=${PORT}`,
      `--user-data-dir=${profile}`,
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
    { stdio: ["ignore", "ignore", "pipe"], detached: true },
  );
  let stderr = "";
  chrome.stderr.on("data", (c) => (stderr += c.toString()));
  chrome.on("exit", (code) => {
    if (code && code !== 0) console.error(`chrome exited ${code}\n${stderr.slice(0, 800)}`);
  });

  const session = connect(await waitForPageTarget());
  await session.open;
  const t = session.send;

  await t("Page.enable");
  await t("Network.enable");
  await t("Network.setCacheDisabled", { cacheDisabled: COLD });
  const blocked = (process.env.BLOCK ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  if (blocked.length) {
    await t("Network.setBlockedURLs", { urls: blocked });
    console.log(`blocking ${blocked.join(", ")}`);
  }
  await t("Emulation.setDeviceMetricsOverride", {
    width: VIEWPORT.width,
    height: VIEWPORT.height,
    deviceScaleFactor: VIEWPORT.dsf,
    mobile: VIEWPORT.dsf !== 1,
  });
  // ThemeProvider falls back to prefers-color-scheme when nothing is stored.
  // Headless Chrome inherits the host appearance, so the value must be pinned
  // for both modes — leaving it unset silently captured light runs as dark.
  await t("Emulation.setEmulatedMedia", {
    features: [
      {
        name: "prefers-color-scheme",
        value: process.env.DARK === "1" ? "dark" : "light",
      },
    ],
  });
  await t("Page.addScriptToEvaluateOnNewDocument", { source: INSTRUMENT });

  const loaded = new Promise<void>((r) => {
    session.on((e) => {
      if (e.method === "Page.loadEventFired") r();
    });
  });

  const started = Date.now();
  await t("Page.navigate", { url });
  await loaded;
  await sleep(SETTLE_MS);

  const { result } = await t("Runtime.evaluate", {
    expression: `(() => {
      if (!window.__vux) return JSON.stringify({ observersMissing: true });
      const v = window.__vux || {};
      v.cls = +(v.cls || 0).toFixed(5);
      v.wallMs = ${Date.now() - started};
      return JSON.stringify(v);
    })()`,
    returnByValue: true,
  });
  const metrics = JSON.parse(result.value as string);
  if (!metrics || metrics.observersMissing) {
    throw new Error("instrument script did not run in the page — metrics are unusable");
  }
  if ((metrics.errs || []).length) {
    console.error("observer errors:", metrics.errs.join(" | "));
  }

  // Total bytes pulled for media on this page load.
  metrics.mediaBytes = (metrics.images || []).reduce((a: number, r: any) => a + (r.bytes || 0), 0);
  metrics.lastImageDone = (metrics.images || []).reduce(
    (a: number, r: any) => Math.max(a, r.start + r.dur),
    0,
  );
  const bytesByKey = new Map((metrics.images || []).map((r: any) => [r.key, r.bytes || 0]));
  const belowFold = (metrics.imgGeom || []).filter((g: any) => !g.inInitialViewport);
  metrics.belowFoldRequests = belowFold.length;
  metrics.belowFoldBytes = belowFold.reduce((a: number, g: any) => a + (bytesByKey.get(g.key) || 0), 0);
  metrics.greyBandMax = (metrics.imgGeom || []).reduce(
    (a: number, g: any) => Math.max(a, g.greyBandV || 0),
    0,
  );
  if (COLD && metrics.mediaBytes === 0 && (metrics.images || []).length) {
    console.error("WARNING: cold run reported 0 media bytes — cache was not actually disabled");
  }

  console.log(`URL   ${url}   [${COLD ? "cold" : "warm"}]`);
  console.log(`CLS   ${metrics.cls}   (${(metrics.shifts || []).length} shifts)`);
  console.log(`LCP   ${metrics.lcp}ms  element=${metrics.lcpEl}  size=${metrics.lcpBreakdown?.size}  breakdown=${JSON.stringify(metrics.lcpBreakdown)}`);
  console.log(`FCP   ${metrics.fcp}ms  TTFB=${metrics.ttfb}ms  docHeight=${metrics.docHeight}`);
  console.log(`gutter ${JSON.stringify(metrics.gutter)}  anchor=${metrics.anchor}  sticky=${JSON.stringify(metrics.sticky)}`);
  console.log(`media ${metrics.images.length} requests, ${(metrics.mediaBytes / 1024).toFixed(1)} KiB, last done ${metrics.lastImageDone}ms`);
  console.log(`      below-fold fetched: ${metrics.belowFoldRequests} (${(metrics.belowFoldBytes / 1024).toFixed(1)} KiB wasted if unread), max grey band ${metrics.greyBandMax}px`);
  for (const s of metrics.shifts || []) console.log(`  shift ${s.v} @${s.t}ms  ${s.nodes.join(",")}`);
  for (const i of metrics.imgs || []) {
    console.log(`  img ${i.key} attrs=${i.widthAttr}x${i.heightAttr} loading=${i.loading} natural=${i.natural} box=${i.box}`);
  }
  for (const g of metrics.imgGeom || []) {
    console.log(`  geom ${g.key} frame=${g.frame} painted=${g.painted} greyBand=${g.greyBandV}px inViewport=${g.inInitialViewport} atY=${g.distanceFromTop} placeholderBg=${g.hasPlaceholderBg}`);
    console.log(`       over-delivery: source ${g.sourceW}px for ${g.neededW}px needed = ${(g.sourceW / Math.max(1, g.neededW)).toFixed(2)}x`);
  }
  const lt = metrics.longTasks || [];
  console.log(`longtasks ${lt.length}, total ${lt.reduce((a: number, t: any) => a + t.dur, 0)}ms, longest ${Math.max(0, ...lt.map((t: any) => t.dur))}ms`);
  for (const s of metrics.scripts || []) {
    console.log(`  script ${s.url} ${s.start}\u2192${s.end}ms (${s.dur}ms, ${(s.bytes / 1024).toFixed(1)} KiB)`);
  }
  if ((metrics.errs || []).length) console.log("  observers:", metrics.errs);

  if (outFile) {
    writeFileSync(outFile, JSON.stringify(metrics, null, 2));
    console.log(`written ${outFile}`);
  }

  const shot = resolve(`${outFile ?? "/tmp/measure"}.png`);
  // Scroll the first content image into frame so the screenshot shows the
  // letterbox/grey-band behaviour rather than the headline.
  await t("Runtime.evaluate", {
    expression: `(() => { const i = document.querySelector(".post-content img"); if (i) window.scrollTo(0, Math.max(0, i.getBoundingClientRect().top + scrollY - 80)); return 1; })()`,
  });
  await sleep(600);
  const png = await t("Page.captureScreenshot", { format: "png" });
  writeFileSync(shot, Buffer.from(png.data, "base64"));
  console.log(`screenshot ${shot}`);

  try {
    await t("Browser.close");
  } catch {
    /* socket may already be gone */
  }
  session.ws.close();
  await sleep(300);
  cleanup();
};

main().catch((e) => {
  console.error(e);
  exit(1);
});
