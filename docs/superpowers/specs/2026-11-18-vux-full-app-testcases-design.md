# vux — Full-app test cases & e2e coverage · design spec

Ngày: 2026-11-18 · Person: vyquocvu · Trạng thái: chờ duyệt

Tài liệu này là design cho bộ test case toàn app. Nguồn sự thật về hành vi mong đợi là
[`docs/verification/feature-map.md`](../../verification/feature-map.md) (7 nhóm tính năng).
Skill `/verify` ([`.agents/skills/verify/SKILL.md`](../../../.agents/skills/verify/SKILL.md)) và
`scripts/verify-smoke.ts` giữ nguyên vai trò smoke gate, không sửa (Protected Check Rule).

---

## 1. Vấn đề

Hiện repo có 7 test Playwright (`tests/e2e/01–06`, 547 dòng) và 6 check smoke. So với
feature-map, phần lớn **negative path, boundary, quyền hạn và hợp đồng HTTP** chưa có test
tự động:

- Chưa test nào các ngưỡng thật đã đọc trong code: login 8/900s, signup 5/3600s,
  comment 5/60s, clap 50/IP/post (không có cửa sổ thời gian), comment 2..2000 ký tự.
- Chưa test quy tắc session: tối đa 5 session/user (xua session cũ), cờ cookie
  `HttpOnly; SameSite=Lax; Path=/; Max-Age=604800`, 302 SSR khi đã đăng nhập mà vào `/login|/signup`.
- Chưa test `POST /api/upload` (403/405/400 prefix/`..`/2-segment/400 type/413/200) và
  **toàn bộ §7 media middleware** trong e2e (hiện chỉ có trong smoke script).
- Chưa test các trang tĩnh §5: `/about`, `/projects`, `/contact` (Formspree), `/sitemap.xml`.
- Chưa test luồng tạo bài **qua UI editor** (`/admin/post/new`), nút `Publish`, màn hình lỗi
  `Không tải được bài viết (HTTP {status}).` + nút `Thử lại`.
- Không có unit test runner (quyết định: không thêm — xem §6).

## 2. Quyết định đã chốt

| # | Quyết định | Lý do |
|---|---|---|
| D-1 | Deliverable gồm **2 tầng**: ma trận test case dạng tài liệu + code e2e tự động | Người cần cả artefact review được lẫn regression chạy lại được |
| D-2 | **Chỉ dùng Playwright** cho tự động hoá (không thêm vitest/jest) | Không có runner sẵn; `request` fixture phủ được tầng API; tránh hạ tầng mới |
| D-3 | Fixture ghi thẳng vào D1/R2 local, mọi bản ghi mang prefix `e2e-`, dọn bằng `cleanupE2E()` ở `beforeEach`/`afterEach` | Theo đúng flow `helpers/d1.ts` hiện có; giữ corpus seed 48 bài cho test feed/sitemap |
| D-4 | Mỗi § của feature-map tương ứng một spec file; TC ID xuất hiện trong tên test | Truy vết 2 chiều tài liệu ↔ code, không phải tổ chức lại file đang green |
| D-5 | Test chia nhãn `@api` (dùng `request`) và `@ui` (dùng `page`) | ~60 TC chỉ cần hợp đồng HTTP, chạy nhanh hơn nhiều; `@ui` dành cho hành vi trình duyệt |
| D-6 | Giữ `workers: 1` | Rate limit định danh theo IP; `requestIp()` chỉ đọc `cf-connecting-ip` nên mọi request local dùng chung bucket `unknown` |
| D-7 | TC gặp defect đã ghi nhận (§5) thì viết `test.fixme()` kèm ID defect | Không âm thầm assert hành vi sai, cũng không làm đỏ suite của người khác |

## 3. Artefact & interface

### 3.1 `docs/verification/test-cases.md` (mới)

Ma trận, mỗi dòng một TC:

```
| ID | Tiền điều kiện | Bước | Expected | Loại | § | Spec | Trạng thái |
```

- `ID` = `TC-<AREA>-<nn>`, AREA ∈ {FEED, POST, CMT, CLAP, AUTH, NAV, PAGE, ADMIN, ED, UP, MED, SEO}.
- `Loại` ∈ {`@api`, `@ui`}. `Trạng thái` ∈ {`green`, `fixme-D#`, `gap`}.
- Cột `Spec` trỏ thẳng `tests/e2e/<file>.ts:<line>` để mở được từ terminal.
- Sinh theo lô cùng kỳ implement; thứ tự bảng = thứ tự feature-map.

### 3.2 Spec files (`tests/e2e/`)

| File | feature-map § | Test hiện có | TC thêm |
|---|---|---|---|
| `01-feed-and-tags.spec.ts` | §1 | 4 step | 3 |
| `02-article-reading-rail.spec.ts` | §2 | 4 step | 4 |
| `03-auth-and-comments.spec.ts` | §3 | 5 step | 18 |
| `04-claps-and-boundaries.spec.ts` | §3 | 1 test | 6 (clap cap 50, 404 draft, GET unknown=0, hệ quả D6) |
| `05-auth-throttles-and-sessions.spec.ts` (mới) | §4 | — | 12 |
| `06-admin-gating-and-crud.spec.ts` | §6 | 5 step | 6 |
| `07-admin-editor.spec.ts` (mới, tách từ `06-admin-editor`) | §6 | 2 test | 8 |
| `08-upload-and-media.spec.ts` (mới) | §6+§7 | — | 16 |
| `09-static-pages-seo.spec.ts` (mới) | §5 | — | 9 |

Tổng dự kiến ≈ **110 TC** (≈60 `@api`, ≈50 `@ui`). Đánh số file theo § của feature-map;
khi chèn `05` mới thì rename `05→06`, `06→07` để ánh xạ mục ↔ file không đứt.

### 3.3 Helpers mới (`tests/e2e/helpers/`)

| Helper | Interface | Vai trò |
|---|---|---|
| `session.ts` | `loginAs(page, {email, password})`, `apiKey(email, password): Promise<string>` | Login qua `POST /api/auth/login` rồi inject cookie `vux_session`, khỏi chờ UI |
| `throttle.ts` | `resetThrottles()`, `burnSignup(n)`, `burnLogin(n)` | Xóa `auth_attempts` theo bucket; dựng kịch bản 429 một cách tất định |
| `media.ts` | `putR2(key, file)`, `deleteR2(key)` (spawn `wrangler r2 object put/get/delete --local --preview vux-media`) | Có object R2 thật cho §7 mà không phụ thuộc luồng upload |
| `net.ts` | `blockExternalNoise(page)` | Chặn `googletagmanager.com`, `skillicons.dev`, `formspree.io` (stub có kiểm soát) |
| `d1.ts` (sửa) | `cleanupE2E()` mở rộng | Thêm `comments`, `clap_limits` theo `post_uid LIKE 'e2e-%'`; giữ nguyên API cũ |

## 4. Edge case cần có TC (rút từ code, không phải suy đoán)

- **Ngưỡng đóng/mở**: comment `2` và `2000` ký tự → 201; `1`, `2001` → 400. displayName `40`
  ký tự → 201, `41` → 400. password `8` ký tự → 201, `7` → 400. upload `26214400` bytes → pass,
  lớn hơn → 413 (chỉ ở nhánh multipart — xem D-4 §5).
- **Thứ tự kiểm tra**: `INVALID uid` 400 chạy *trước* gate admin ở `/api/admin/posts/[uid]`;
  comment thì 401 *trước* 404 post nháp; `DELETE /api/comments/[id]` 400 trước 405.
- **Rate limit tiêu tốn quota thế nào**: counter tăng *sau* validation field → request 400 không
  đốt quota, nhưng 409 `Email already in use` thì có. Login thành công **xóa** bucket.
- **Clap không có cửa sổ thời gian**: giới hạn 50 là vĩnh viễn theo `(post_uid, ip_hash)`;
  TC phải dọn `clap_limits` hoặc dùng post `e2e-` mới.
- **Media key**: chỉ `images/`+`audios/`, phần sau `/` khớp `^[a-zA-Z0-9][a-zA-Z0-9._-]*$`
  → `images/a/b.webp` 400, `images/_x.webp` 400, mọi key chứa `..` 400, `>512` ký tự 400;
  thân lỗi là **text thuần** `Bad request` / `Not found`, không phải JSON.
- **Range**: `bytes=0-999` trên object 50 byte → 206 `bytes 0-49/50`; `bytes=-0` → 416;
  `bytes=5-2` → 416; range nhiều khoảng/không parse được → **200 toàn vẹn** (RFC 7233 ignore).
- **ETag**: so sánh chuỗi strict, `W/"..."` và `*` không khớp → 200; 304 vẫn mang
  `Cache-Control: immutable`.
- **Sitemap**: ở non-production base URL hard-code `http://localhost:3001` → TC chỉ assert
  *đường dẫn tương đối* bên trong `<loc>`, không assert host. Chỉ bài `is_published=1`;
  `/tags`, `/projects` không có trong sitemap.
- **Editor**: `#editor` mount sẵn HTML nháp, `PostEditor` là `dynamic(ssr:false)` → mọi TC
  phải chờ `#editor .ql-editor` + `.ql-toolbar`; `Publish` redirect `/admin` sau 1000 ms;
  `Delete` ở `/admin` gọi `location.reload()` thật (không phải `router.push`).
- **Đường dẫn admin**: `/admin/post/[id]` lấy `String(query.id).split(".").pop()` → cả
  `/admin/post/<uid>` và `/admin/post/<slug>.<uid>` đều hợp lệ; TC phủ cả hai dạng.
- **Hợp đồng lạ cần ghi nhận**: `PUT /api/admin/posts/<uid>` là upsert (uid lạ → **tạo** bài);
  `DELETE` uid không tồn tại → 200; `/api/auth/me` không chặn method (405 bất khả thi);
  `GET /api/posts/<uid>/comments` trả 404 cho bài nháp (không phân biệt với không tồn tại).

## 5. Defect register (phát hiện khi khảo sát — chỉ ghi nhận, không sửa trong đợt này)

| ID | Defect | Hệ quả với test |
|---|---|---|
| **D1** | `react-toast-notifications` kéo `react-transition-group@4.4.5` gọi `ReactDOM.findDOMNode` (đã bỏ ở React 19) → `addToast` ném lỗi, toast không bao giờ render | Mọi TC assert text toast (`Save post successfully!`, `Create post successfully!`) để `fixme-D1`; assert thành công qua API/DB/DOM thay thế |
| **D2** | `PostEditor.onSave` gọi `quill.getContents()` **trước** guard `if (quill)` → TypeError nếu bấm Save trước khi editor init | TC `fixme-D2`: click Save ngay khi trang hiện |
| **D3** | `PUT /api/admin/posts/[uid]` upsert → update uid lạ tạo bài mới thay vì 404 | TC assert hành vi hiện tại + chú thích "documenting current contract" |
| **D4** | `POST /api/upload` chỉ check 25 MiB ở nhánh `formData`; nhánh `req.body.file` bỏ qua | TC 413 chỉ chạy trên nhánh multipart; ghi rõ giới hạn runtime dev |
| **D5** | `signup`/`login` `JSON.parse(req.body)` nằm ngoài `try` → body hỏng là 500 HTML không JSON | TC `fixme-D5` cho hợp đồng `{error}`; hiện assert 500 |
| **D6** | `clap_limits` không có FK → row mồ côi sau khi xóa bài | TC assert sự tồn tại của row mồ côi, ghi chú D6 |
| **D7** | Feature-map drift: `No posts tagged`/`Clear filter` không tới được (`/post?tag=bogus` → `No posts yet.`); sidebar không có `/projects`; sitemap không phát `/tags` | TC assert hành vi thật; mục "cần sửa doc" list ở §7 |

## 6. Kiểm chứng

Chạy theo đúng trình tự project đang dùng, không tự chế bước mới:

```sh
npx tsc --noEmit && yarn lint && node --experimental-strip-types scripts/toc-check.ts
node --experimental-strip-types scripts/verify-smoke.ts   # qua skill /verify
npx playwright test
npx playwright test --grep @api                            # rerun nhanh tầng hợp đồng
```

Tiêu chí pass: cả 4 lệnh exit 0; `verify-smoke` in `6/6 passed`; Playwright không có test đỏ
ngoài nhóm `test.fixme` đã khai báo ở §5; bằng chứng báo cáo là stdout của từng lệnh.
Ước lượng thời gian: `@api` < 90 s, full suite < 12 phút với `workers: 1`.

## 7. Ngoài phạm vi

- Không sửa `scripts/verify-smoke.ts` hay `.agents/skills/verify/SKILL.md`.
- Không sửa app để test chạy được: D1–D7 chỉ được document; muốn sửa phải mở một cycle
  spec/plan riêng (riêng D-FK đã sửa xong ở commit `fix(post): ...`).
- Không test ISR/`revalidate`/`fallback: 'blocking'` vì `next dev` không lộ các hành vi đó.
- Không thêm unit test runner, không đo coverage, không thêm CI workflow.
- Không assert nội dung corpus seed (48 bài) ngoài các bất biến đã có trong `toc-check.ts`.
- Việc cần làm *sau* cycle này (ghi lại để khỏi quên): cập nhật `feature-map.md` theo D7.
