import { expect, test } from "@playwright/test";
import { cleanupE2E, createTestUser } from "./helpers/d1";
import { trackPageErrors } from "./helpers/browser";

test.describe("admin gating and post CRUD lifecycle", () => {
  test.beforeEach(() => {
    cleanupE2E();
  });

  test.afterEach(() => {
    cleanupE2E();
  });

  test("non-admin blocked from /admin; admin creates draft, publishes, and deletes post", async ({
    page,
  }) => {
    const errors = trackPageErrors(page);
    const memberEmail = `e2e-member-${Date.now()}@vux.local`;
    const adminEmail = `e2e-admin-${Date.now()}@vux.local`;
    const password = "AdminPassword123!";

    await createTestUser({ email: memberEmail, password, displayName: "Member", isAdmin: false });
    await createTestUser({ email: adminEmail, password, displayName: "Admin", isAdmin: true });

    await test.step("unauthenticated /admin redirects to /login and API returns 403", async () => {
      await page.goto("/admin");
      await expect(page).toHaveURL(/\/login$/);
      const apiRes = await page.request.get("/api/admin/posts");
      expect(apiRes.status()).toBe(403);
    });

    await test.step("non-admin user cannot access /admin or admin API", async () => {
      await page.locator("#email").fill(memberEmail);
      await page.locator("#password").fill(password);
      await page.getByRole("button", { name: "Log In" }).click();
      await expect(page).toHaveURL(/\/$/);

      await page.goto("/admin");
      await expect(page).toHaveURL(/\/$/);
      const apiRes = await page.request.get("/api/admin/posts");
      expect(apiRes.status()).toBe(403);

      await page.request.post("/api/auth/logout");
    });

    await test.step("admin logs in and reaches /admin dashboard", async () => {
      await page.goto("/login");
      await page.locator("#email").fill(adminEmail);
      await page.locator("#password").fill(password);
      await page.getByRole("button", { name: "Log In" }).click();
      await expect(page).toHaveURL(/\/admin$/);
      await expect(page.locator(".post-list")).toBeVisible();
    });

    const uid = `e2e-crud-${Date.now()}`;
    const title = "E2E Admin Lifecycle Post";
    const slug = `e2e-admin-lifecycle-post.${uid}`;

    await test.step("admin creates draft (hidden from public feed, visible in /admin)", async () => {
      const createRes = await page.request.post("/api/admin/posts", {
        data: {
          uid,
          slug,
          title,
          thumbText: "Draft summary",
          thumbImage: "",
          draftContent: "<p>Draft body</p>",
          publishContent: "",
          isPublished: false,
          tags: ["typescript"],
        },
      });
      expect(createRes.status()).toBe(201);

      await page.reload();
      const adminCard = page.locator(".post-list > div", { hasText: title });
      await expect(adminCard).toBeVisible();
      await expect(adminCard.getByText("Draft", { exact: true })).toBeVisible();

      await page.goto("/");
      await expect(page.getByText(title)).toHaveCount(0);
    });

    await test.step("admin publishes post and verifies visibility on /", async () => {
      const pubRes = await page.request.put(`/api/admin/posts/${uid}`, {
        data: {
          uid,
          slug,
          title,
          thumbText: "Published summary",
          thumbImage: "",
          draftContent: "<p>Published body</p>",
          publishContent: "<p>Published body</p>",
          isPublished: true,
          tags: ["typescript"],
        },
      });
      expect(pubRes.status()).toBe(200);

      await page.goto("/");
      await expect(page.locator(".feed").getByText(title)).toBeVisible();
    });

    await test.step("admin deletes post via UI Delete button", async () => {
      await page.goto("/admin");
      const adminCard = page.locator(".post-list > div", { hasText: title });
      await expect(adminCard).toBeVisible();

      page.once("dialog", (d) => d.accept());
      const delPromise = page.waitForResponse(
        (r) => r.url().includes(`/api/admin/posts/${uid}`) && r.request().method() === "DELETE",
      );
      await adminCard.getByRole("button", { name: "Delete" }).click();
      expect((await delPromise).status()).toBe(200);

      await expect(page.locator(".post-list > div", { hasText: title })).toHaveCount(0);
    });

    errors.assertClean();
  });
});
