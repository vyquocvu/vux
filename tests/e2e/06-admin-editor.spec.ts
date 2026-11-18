import { expect, test } from "@playwright/test";
import { cleanupE2E, createTestUser, createTestPost } from "./helpers/d1";

/**
 * Regression guard for the "content editor won't load" bug.
 *
 * The editor used to boot Quill + image-resize + highlight.js from three
 * runtime CDN <script>s with no fallback: if any was blocked or slow, the
 * #editor stayed `hidden` behind an endless spinner, and Quill threw an
 * uncaught "Syntax module requires highlight.js" from the load-order race.
 *
 * We now bundle those deps locally, so the editor must initialize even when
 * every CDN URL is unreachable, and without leaking uncaught errors.
 */
const EDITOR_CDNS = [
  "**://cdnjs.cloudflare.com/**/quill*/**",
  "**://cdnjs.cloudflare.com/**/highlight*/**",
  "**://cdn.jsdelivr.net/**/quill-image-resize-module*/**",
];

test("admin editor loads with all CDN scripts blocked", async ({ page }) => {
  test.setTimeout(60_000);
  cleanupE2E();

  const adminEmail = `e2e-editor-${Date.now()}@vux.local`;
  await createTestUser({
    email: adminEmail,
    password: "AdminPassword123!",
    displayName: "Admin",
    isAdmin: true,
  });

  const post = createTestPost({
    title: "Editor Loads Offline",
    content:
      '<p>Intro</p><picture><source type="image/webp" srcset="/images/x.webp">' +
      '<img src="/images/x.png"></picture><h2>H</h2><pre><code>const a = 1;</code></pre>',
  });

  // Log in first (auth flow does not need the editor CDNs).
  await page.goto("/login");
  await page.locator("#email").fill(adminEmail);
  await page.locator("#password").fill("AdminPassword123!");
  await page.getByRole("button", { name: "Log In" }).click();
  await expect(page).toHaveURL(/\/admin$/, { timeout: 20_000 });

  const pageErrors: string[] = [];
  page.on("pageerror", (e) => pageErrors.push(e.message));

  // Now make every editor CDN unreachable before navigating to the editor.
  for (const pattern of EDITOR_CDNS) {
    await page.route(pattern, (route) => route.abort());
  }

  await page.goto(`/admin/post/${post.slug}`);

  // Editor surface must initialize despite the blocked CDNs.
  await expect(page.locator("#editor .ql-editor")).toBeVisible({ timeout: 20_000 });
  await expect(page.locator(".ql-toolbar")).toBeVisible();

  // And it must not throw the old highlight.js load-order race or any other
  // uncaught error.
  expect(
    pageErrors.filter((m) => !/legacyBehavior/.test(m)),
    "uncaught editor errors",
  ).toEqual([]);

  cleanupE2E();
});

/**
 * Regression guard for the "update post error" bug.
 *
 * Every seeded post stores `author_id = NULL`. The admin GET projects that to
 * `author: ""`, the editor echoes it back on save, and the upsert then tried to
 * write an empty string into the `posts.author_id` foreign key ->
 * "D1_ERROR: FOREIGN KEY constraint failed" and a 500 on every edit.
 */
test("saving a draft from the editor updates an existing post", async ({ page }) => {
  test.setTimeout(60_000);
  cleanupE2E();

  const adminEmail = `e2e-editor-save-${Date.now()}@vux.local`;
  await createTestUser({
    email: adminEmail,
    password: "AdminPassword123!",
    displayName: "Admin",
    isAdmin: true,
  });

  const post = createTestPost({
    title: "Editor Saves Draft",
    content: "<p>Original body</p>",
    isPublished: false,
  });

  await page.goto("/login");
  await page.locator("#email").fill(adminEmail);
  await page.locator("#password").fill("AdminPassword123!");
  await page.getByRole("button", { name: "Log In" }).click();
  await expect(page).toHaveURL(/\/admin$/, { timeout: 20_000 });

  await page.goto(`/admin/post/${post.uid}`);
  await expect(page.locator("#editor .ql-editor")).toBeVisible({ timeout: 20_000 });

  const edited = "<p>Original body edited by admin</p>";
  await page.locator("#editor .ql-editor").fill(edited);

  const save = page.waitForResponse(
    (r) => r.url().includes(`/api/admin/posts/${post.uid}`) && r.request().method() === "PUT",
  );
  await page.getByRole("button", { name: /Save Draft/i }).click();
  const res = await save;

  expect(res.status()).toBe(200);

  const saved = await page.request.get(`/api/admin/posts/${post.uid}`);
  expect(saved.status()).toBe(200);
  const { draftContent } = (await saved.json()) as { draftContent: string };
  expect(draftContent).toContain("edited by admin");

  cleanupE2E();
});
