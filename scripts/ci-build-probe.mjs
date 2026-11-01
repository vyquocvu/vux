// Temporary instrumentation for the Cloudflare Workers Builds container.
// Prints the limits the build actually runs under, checks the SWC native
// binding in isolation, and reports what the restored build cache contained
// before discarding it. Never fails the build.
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const ROOT = process.cwd();
const log = (label, value) => console.log(`[ci-probe] ${label}=${value}`);

function readCgroup() {
  const files = [
    "memory.max",
    "memory.current",
    "memory.swap.max",
    "memory.events",
    "cpu.max",
    "pids.max",
  ];
  for (const name of files) {
    for (const dir of ["/sys/fs/cgroup", "/sys/fs/cgroup/memory"]) {
      const file = path.join(dir, name);
      if (!fs.existsSync(file)) continue;
      try {
        const text = fs.readFileSync(file, "utf8").trim().replace(/\n/g, "; ");
        log(`cgroup.${name}`, text);
      } catch (error) {
        log(`cgroup.${name}`, `unreadable: ${error.message}`);
      }
      break;
    }
  }
}

function readMounts() {
  const dirs = ["/", "/tmp", "/dev/shm", ROOT];
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue;
    try {
      const s = fs.statfsSync(dir);
      const total = s.bsize * s.blocks;
      const free = s.bsize * s.bavail;
      log(
        `statfs.${dir}`,
        `total=${Math.round(total / 2 ** 20)}MiB free=${Math.round(free / 2 ** 20)}MiB files=${s.files} ffree=${s.ffree}`,
      );
    } catch (error) {
      log(`statfs.${dir}`, `error: ${error.message}`);
    }
  }
}

function walk(dir, onEntry, limit = 200_000) {
  let seen = 0;
  const stack = [dir];
  while (stack.length && seen < limit) {
    const current = stack.pop();
    let entries;
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      seen++;
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else if (entry.isFile()) onEntry(full, entry);
    }
  }
  return seen;
}

function checkNativeBindings() {
  const swcRoot = path.join(ROOT, "node_modules", "@next");
  if (!fs.existsSync(swcRoot)) return log("swc.packages", "missing @next dir");
  const packages = fs
    .readdirSync(swcRoot)
    .filter((name) => name.startsWith("swc-"))
    .map((name) => {
      const dir = path.join(swcRoot, name);
      const nodes = [];
      walk(dir, (full) => {
        if (full.endsWith(".node")) {
          nodes.push(`${path.basename(full)}:${fs.statSync(full).size}B`);
        }
      });
      return `${name}[${nodes.join(",") || "NO .node"}]`;
    });
  log("swc.packages", packages.join(" "));

  const expected = `swc-${process.platform}-${process.arch}`;
  const variants = [`${expected}-gnu`, `${expected}-musl`, expected];
  for (const variant of variants) {
    const dir = path.join(swcRoot, variant);
    if (!fs.existsSync(dir)) continue;
    let binary = null;
    walk(dir, (full) => {
      if (!binary && full.endsWith(".node")) binary = full;
    });
    if (!binary) {
      log("swc.load", `${variant}: directory present but no .node file`);
      continue;
    }
    // dlopen in a child so a fault here is reported as a signal, not a crash
    // of the probe itself.
    const child = spawnSync(
      process.execPath,
      [
        "-e",
        `process.dlopen(module, ${JSON.stringify(binary)}); console.log('ok')`,
      ],
      { encoding: "utf8", timeout: 30_000 },
    );
    log(
      "swc.load",
      `${variant} status=${child.status} signal=${child.signal} out=${(child.stdout || "").trim()}${(child.stderr || "").trim().slice(0, 300)}`,
    );
    return;
  }
  log("swc.load", `no binding dir for ${process.platform}/${process.arch}`);
}

function checkBuildCache() {
  for (const dir of [".next", ".open-next"]) {
    const full = path.join(ROOT, dir);
    if (!fs.existsSync(full)) {
      log(`cache.${dir}`, "absent");
      continue;
    }
    let bytes = 0;
    let files = 0;
    let empty = 0;
    const packs = [];
    walk(full, (path_, entry) => {
      files++;
      const size = fs.statSync(path_).size;
      bytes += size;
      if (size === 0) empty++;
      if (path_.endsWith(".pack")) {
        packs.push(`${path.relative(ROOT, path_)}:${size}B`);
      }
    });
    log(
      `cache.${dir}`,
      `files=${files} bytes=${Math.round(bytes / 2 ** 20)}MiB empty=${empty} packs=${packs.slice(0, 8).join(",") || "none"}`,
    );
  }
}

try {
  log("node", process.version);
  log("platform", `${process.platform}-${process.arch}`);
  log("NODE_OPTIONS", process.env.NODE_OPTIONS || "(unset)");
  log("cpu.host", os.cpus().length);
  log("mem", `total=${Math.round(os.totalmem() / 2 ** 30)}GiB free=${Math.round(os.freemem() / 2 ** 30)}GiB`);
  readCgroup();
  readMounts();
  checkNativeBindings();
  checkBuildCache();

  // A restored cache from an earlier failed attempt is never rebuilt by
  // `next build`, so start each run from a known state.
  for (const dir of [".next", ".open-next"]) {
    try {
      fs.rmSync(path.join(ROOT, dir), { recursive: true, force: true });
    } catch (error) {
      log(`rm.${dir}`, `failed: ${error.message}`);
    }
  }
  log("done", "cache cleared");
} catch (error) {
  log("probe-error", error?.stack || String(error));
}
process.exit(0);
