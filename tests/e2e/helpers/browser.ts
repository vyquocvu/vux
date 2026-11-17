import { expect, type Page } from "@playwright/test";

export function trackPageErrors(page: Page) {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  const serverErrors: string[] = [];
  const allowedStatuses = new Set<number>();

  page.on("pageerror", (err) => {
    pageErrors.push(err.message);
  });

  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    if (text.includes("`legacyBehavior` is deprecated")) return;
    const httpMatch = /Failed to load resource: the server responded with a status of (\d+)/.exec(text);
    if (httpMatch && allowedStatuses.has(Number(httpMatch[1]))) return;
    consoleErrors.push(text);
  });

  page.on("response", (res) => {
    const url = res.url();
    if (url.includes("127.0.0.1") && res.status() >= 500) {
      serverErrors.push(`${res.status()} ${url}`);
    }
  });

  return {
    allowHttpStatus(...statuses: number[]) {
      for (const s of statuses) allowedStatuses.add(s);
    },
    assertClean() {
      expect(pageErrors, "uncaught page errors").toEqual([]);
      expect(consoleErrors, "console.error messages").toEqual([]);
      expect(serverErrors, "HTTP 5xx responses").toEqual([]);
    },
  };
}
