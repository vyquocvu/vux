import { expect, test } from "@playwright/test";
import { trackPageErrors } from "./helpers/browser";

const MULTI_HEADING_POST =
  "/post/tu-dien-dev-jargon-spaghetti-code-magic-number-coupling-nghia-la-gi.W8XdQNQBQ7FzyEfIOi6a";

test("article detail, reading rail, TOC anchor scroll, and 404", async ({ page }) => {
  const errors = trackPageErrors(page);

  await test.step("render article and desktop reading rail", async () => {
    await page.goto(MULTI_HEADING_POST);
    await expect(page.locator("h1.post-title")).toBeVisible();
    await expect(page.locator(".post-content")).toBeVisible();

    const rail = page.locator("aside");
    await expect(rail).toBeVisible();
    const tocLinks = rail.locator('nav[aria-label="Mục lục"] a[href^="#"]');
    expect(await tocLinks.count()).toBeGreaterThanOrEqual(2);
  });

  await test.step("click TOC anchor and clear sticky bar without overlap", async () => {
    const tocLinks = page.locator('aside nav[aria-label="Mục lục"] a[href^="#"]');
    const targetLink = tocLinks.nth(5);
    const href = await targetLink.getAttribute("href");
    expect(href).toBeTruthy();
    const targetId = decodeURIComponent(href!.slice(1));

    await targetLink.click();

    await expect(async () => {
      const top = await page.evaluate((id) => {
        const el = document.getElementById(id);
        return el ? el.getBoundingClientRect().top : -1;
      }, targetId);
      expect(top).toBeGreaterThanOrEqual(64);
      expect(top).toBeLessThan(300);
    }).toPass({ timeout: 5000 });
  });

  await test.step("switch to mobile viewport and expand collapsible TOC", async () => {
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.locator("aside")).toBeHidden();

    const summary = page.locator("details summary", { hasText: "Mục lục" });
    await expect(summary).toBeVisible();
    await summary.click();
    await expect(page.locator("details[open]")).toBeVisible();
  });

  errors.assertClean();

  await test.step("return 404 for unknown post slug", async () => {
    const res = await page.goto("/post/missing-post.e2e-nonexistent-000");
    expect(res?.status()).toBe(404);
  });
});
