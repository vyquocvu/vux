import { expect, test } from "@playwright/test";
import { cleanupE2E, createTestPost } from "./helpers/d1";
import { trackPageErrors } from "./helpers/browser";

test.describe("auth and comments lifecycle", () => {
  test.beforeEach(() => {
    cleanupE2E();
  });

  test.afterEach(() => {
    cleanupE2E();
  });

  test("signup, comment create/persist/delete, logout, and login", async ({ page }) => {
    const errors = trackPageErrors(page);
    const post = createTestPost({ title: "E2E Auth Comment Post" });
    const email = `e2e-reader-${Date.now()}@vux.local`;
    const password = "Password123!";
    const displayName = "E2E Reader";

    await test.step("sign up new reader account", async () => {
      await page.goto("/signup");
      await expect(page.locator("#email")).toBeFocused();

      await page.locator("#displayName").fill(displayName);
      await page.locator("#email").fill(email);
      await page.locator("#password").fill(password);

      const signupRes = page.waitForResponse(
        (r) => r.url().endsWith("/api/auth/signup") && r.request().method() === "POST",
      );
      await page.getByRole("button", { name: "Create account" }).click();
      expect((await signupRes).status()).toBe(201);
      await expect(page).toHaveURL(/\/$/);

      const cookiesInDoc = await page.evaluate(() => document.cookie);
      expect(cookiesInDoc).not.toContain("vux_session");

      const meRes = await page.request.get("/api/auth/me");
      expect(meRes.status()).toBe(200);
      const meJson = await meRes.json();
      expect(meJson.authUser).toMatchObject({ email, displayName, isAdmin: false });
    });

    await test.step("post a comment and verify persistence across reload", async () => {
      await page.goto(`/post/${post.slug}`);
      const textarea = page.getByPlaceholder("Viết bình luận...");
      await expect(textarea).toBeVisible();

      const commentText = `[e2e] Comment from ${displayName}`;
      await textarea.fill(commentText);

      const postRes = page.waitForResponse(
        (r) =>
          r.url().includes(`/api/posts/${post.uid}/comments`) &&
          r.request().method() === "POST",
      );
      await page.getByRole("button", { name: "Gửi", exact: true }).click();
      expect((await postRes).status()).toBe(201);

      await expect(page.getByText(commentText)).toBeVisible();
      await page.reload();
      await expect(page.getByText(commentText)).toBeVisible();

      // Duplicate comment must be rejected with 400
      errors.allowHttpStatus(400);
      await textarea.fill(commentText);
      const dupRes = page.waitForResponse(
        (r) =>
          r.url().includes(`/api/posts/${post.uid}/comments`) &&
          r.request().method() === "POST",
      );
      await page.getByRole("button", { name: "Gửi", exact: true }).click();
      expect((await dupRes).status()).toBe(400);
      await expect(page.getByText("Duplicate comment")).toBeVisible();
    });

    await test.step("delete own comment and verify removal after reload", async () => {
      const commentCard = page.locator("div.group", { hasText: "[e2e] Comment from" });
      await commentCard.hover();
      const delBtn = commentCard.getByRole("button", { name: "Xoá bình luận" });
      const delRes = page.waitForResponse(
        (r) => r.url().includes("/api/comments/") && r.request().method() === "DELETE",
      );
      await delBtn.click({ force: true });
      expect((await delRes).status()).toBe(200);

      await expect(commentCard).toHaveCount(0);
      await page.reload();
      await expect(page.getByText("Chưa có bình luận nào.")).toBeVisible();
    });

    await test.step("logout and verify invalid vs valid login", async () => {
      const logoutRes = await page.request.post("/api/auth/logout");
      expect(logoutRes.status()).toBe(200);

      await page.goto("/login");
      await expect(page.locator("#email")).toBeFocused();

      errors.allowHttpStatus(401);
      await page.locator("#email").fill(email);
      await page.locator("#password").fill("WrongPass999!");
      const badLogin = page.waitForResponse(
        (r) => r.url().endsWith("/api/auth/login") && r.request().method() === "POST",
      );
      await page.getByRole("button", { name: "Log In" }).click();
      expect((await badLogin).status()).toBe(401);
      await expect(page.locator('form [role="alert"]')).toContainText("Invalid credentials");

      await page.locator("#password").fill(password);
      const goodLogin = page.waitForResponse(
        (r) => r.url().endsWith("/api/auth/login") && r.request().method() === "POST",
      );
      await page.getByRole("button", { name: "Log In" }).click();
      expect((await goodLogin).status()).toBe(200);
      await expect(page).toHaveURL(/\/$/);
    });

    errors.assertClean();
  });
});
