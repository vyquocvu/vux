import { expect, test } from "@playwright/test";
import { cleanupE2E, createTestPost } from "./helpers/d1";
import { trackPageErrors } from "./helpers/browser";

test.describe("claps and unauthenticated boundaries", () => {
  test.beforeEach(() => {
    cleanupE2E();
  });

  test.afterEach(() => {
    cleanupE2E();
  });

  test("clap increments persist in D1 and localStorage; unauth comment rejected", async ({
    page,
  }) => {
    const errors = trackPageErrors(page);
    const post = createTestPost({ title: "E2E Claps Persistence Post" });

    await test.step("open post and confirm unauthenticated comment boundary", async () => {
      await page.goto(`/post/${post.slug}`);
      await expect(page.locator('a[href="/login"]', { hasText: "Đăng nhập" })).toBeVisible();

      const unauthPost = await page.request.post(`/api/posts/${post.uid}/comments`, {
        data: { content: "[e2e] should fail" },
      });
      expect(unauthPost.status()).toBe(401);
    });

    await test.step("clap twice and assert D1 + localStorage persistence", async () => {
      const counter = page.locator(".post-applause span.tabular-nums");
      await expect(counter).toHaveText("0");

      const clapBtn = page.locator('.post-applause button[aria-label^="Clap "]');
      for (const expected of ["1", "2"]) {
        const resPromise = page.waitForResponse(
          (r) => r.url().includes(`/api/posts/${post.uid}/claps`) && r.request().method() === "POST",
        );
        await clapBtn.click();
        expect((await resPromise).status()).toBe(200);
        await expect(counter).toHaveText(expected);
      }

      const stored = await page.evaluate((uid) => localStorage.getItem(`claps:${uid}`), post.uid);
      expect(stored).toBe("2");

      await page.reload();
      await expect(counter).toHaveText("2");
    });

    errors.assertClean();
  });
});
