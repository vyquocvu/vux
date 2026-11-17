import { expect, test } from "@playwright/test";
import { trackPageErrors } from "./helpers/browser";

test("home feed, tag filtering, and theme persistence", async ({ page }) => {
  const errors = trackPageErrors(page);

  const totalPosts = await test.step("load home feed and verify article cards", async () => {
    await page.goto("/");
    const articles = page.locator(".feed article");
    await expect(articles.first()).toBeVisible();
    const count = await articles.count();
    expect(count).toBeGreaterThanOrEqual(1);

    const firstLink = articles.first().locator('h2 a[href^="/post/"]');
    await expect(firstLink).toBeVisible();
    await expect(articles.first().getByRole("link", { name: /Đọc bài/ })).toBeVisible();
    return count;
  });

  await test.step("filter posts by tag on home toolbar and reset to All", async () => {
    const toolbar = page.getByRole("toolbar", { name: "Filter posts by tag" });
    await expect(toolbar).toBeVisible();
    const allBtn = toolbar.getByRole("button", { name: "All", exact: true });
    await expect(allBtn).toHaveAttribute("aria-pressed", "true");

    const firstTagBtn = toolbar.locator("button").nth(1);
    const tagLabel = (await firstTagBtn.textContent())?.trim() ?? "";
    expect(tagLabel.length).toBeGreaterThan(0);

    await firstTagBtn.click();
    await expect(firstTagBtn).toHaveAttribute("aria-pressed", "true");
    await expect(allBtn).toHaveAttribute("aria-pressed", "false");

    const filteredCount = await page.locator(".feed article").count();
    expect(filteredCount).toBeGreaterThanOrEqual(1);
    expect(filteredCount).toBeLessThanOrEqual(totalPosts);

    await firstTagBtn.click();
    await expect(allBtn).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator(".feed article")).toHaveCount(totalPosts);
  });

  await test.step("navigate to /tags and follow a tag to /post?tag=...", async () => {
    await page.locator('nav[role="navigation"] a[href="/tags"]').click();
    await expect(page).toHaveURL(/\/tags$/);
    await expect(page.getByRole("heading", { name: "Tags" })).toBeVisible();

    const tagLinks = page.locator('a[href^="/post?tag="]');
    const tagCount = await tagLinks.count();
    expect(tagCount).toBeGreaterThanOrEqual(1);

    await tagLinks.first().click();
    await expect(page).toHaveURL(/\/post\?tag=/);
    await expect(page.locator(".feed article").first()).toBeVisible();
  });

  await test.step("toggle dark mode and persist across reload", async () => {
    const toggle = page.getByRole("button", { name: "Toggle theme" });
    await expect(toggle).toBeVisible();
    await expect(page.locator("html")).not.toHaveClass(/\bdark\b/);

    await toggle.click();
    await expect(page.locator("html")).toHaveClass(/\bdark\b/);

    await page.reload();
    await expect(page.locator("html")).toHaveClass(/\bdark\b/);

    await toggle.click();
    await expect(page.locator("html")).not.toHaveClass(/\bdark\b/);
  });

  errors.assertClean();
});
