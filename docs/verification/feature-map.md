# Feature Map & Verification Rubric — Vux

> Tài liệu này liệt kê toàn bộ tính năng từ góc nhìn người dùng (route, điều hướng, focus/phím tắt, selector DOM, kết quả mong đợi). Đây vừa là hướng dẫn kiểm thử vừa là **rubric chấm điểm** để agent tự kiểm chứng công việc.

---

## 1. Public Feed & Tag Filtering

| Hạng mục | Chi tiết |
|---|---|
| **Routes** | `/` (SSG + ISR `revalidate: 120`), `/post` (SSR), `/post?tag=<tag>` (SSR filter), `/tags` (SSG + ISR `revalidate: 300`) |
| **Selectors chính** | `.feed`, `.feed article`, `.feed article h2 a[href^="/post/"]`, `[role="toolbar"][aria-label="Filter posts by tag"]`, `button[aria-pressed]`, `a:has-text("Đọc bài")`, `a[href^="/post?tag="]` (trên `/tags`) |
| **Luồng & Tương tác** | 1. Mở `/` → hiển thị danh sách bài viết đã publish (`is_published = 1`), kèm ngày (`DD/MM/YYYY`), thời gian tương đối, tiêu đề, excerpt 2 dòng (`thumbText`), thumbnail (trên `md:`), link `Đọc bài →`.<br>2. Nếu có tag, toolbar hiển thị chip `All` (`aria-pressed="true"`) và các chip tag sắp xếp alphabet.<br>3. Click chip tag trên `/` hoặc trong một `PostRow` → chip đó chuyển `aria-pressed="true"`, danh sách lọc đúng bài có tag đó; click lại lần nữa → bỏ lọc về `All`.<br>4. Trên `/tags` → hiển thị tổng số chủ đề và lượt gán, sắp xếp giảm dần theo số bài; click 1 tag → điều hướng sang `/post?tag=<tag>` và lọc sẵn theo tag đó.<br>5. Nếu filter không khớp bài nào → hiển thị `No posts tagged <tag>` và nút `Clear filter`. |
| **Tiêu chí Pass** | - `articles >= 1` trên `/` (với corpus seed hiện tại là 48 bài).<br>- Mọi link bài viết có dạng `/post/<friendly-slug>.<uid>`.<br>- Ảnh hiển thị trong viewport load thành công (`naturalWidth > 0`).<br>- Không có lỗi runtime hay response `>= 500`. |

---

## 2. Article Detail, Reading Rail & Table of Contents

| Hạng mục | Chi tiết |
|---|---|
| **Routes** | `/post/[slug]` (SSG + ISR `revalidate: 600`, `fallback: 'blocking'`), `/post/<slug>#<heading-id>` |
| **Selectors chính** | `.post-page-view`, `.post-sticky-bar a[href="/"]`, `h1.post-title`, `.post-content.ql-editor`, `aside` (Reading Rail trên `xl:` ≥ 1280px), `aside nav[aria-label="Mục lục"] a[href^="#"]`, `aside nav a[aria-current="true"]`, `details summary:has-text("Mục lục")` (TOC gập trên mobile/tablet) |
| **Luồng & Tương tác** | 1. Mở `/post/<friendly>.<uid>` → hiển thị nút quay lại `/` trong sticky bar, `h1.post-title`, metadata (`timeFromNow · X phút đọc`), nội dung bài viết (`.post-content`).<br>2. Ở viewport desktop `≥ 1280px`: `aside` Reading Rail hiển thị ngày cập nhật, số phút đọc, TOC (khi `toc.length >= 2`), Tags (khi có), và tối đa 3 bài "Mới nhất".<br>3. Click một mục trong TOC → cuộn tới heading có `id` tương ứng; `scroll-margin-top: 6rem` đảm bảo heading không bị sticky bar (`h-16` = 64px) che khuất (`rect.top >= 64`).<br>4. Cuộn trang qua các heading → `useActiveHeading` cập nhật đúng một link có `aria-current="true"`.<br>5. Mở `/post/khong-ton-tai.nonexistent-uid` → trả 404 (`notFound`). |
| **Tiêu chí Pass** | - 100% link `#id` trong TOC trỏ tới phần tử `#id` tồn tại trong DOM.<br>- Heading khi nhảy anchor nằm dưới sticky bar (`top >= 64`).<br>- Cân bằng layout (`CLS < 0.1`, code block/ảnh không tràn cột). |

---

## 3. Reader Engagement: Claps & Comments

| Hạng mục | Chi tiết |
|---|---|
| **Routes & APIs** | UI tại `/post/[slug]`; API: `GET/POST /api/posts/[uid]/claps`, `GET/POST /api/posts/[uid]/comments`, `DELETE /api/comments/[id]` |
| **Selectors chính** | **Clap:** `.post-applause button[aria-label^="Clap "]`, `.post-applause span.tabular-nums`<br>**Comment (chưa đăng nhập):** `a[href="/login"]:has-text("Đăng nhập")`<br>**Comment (đã đăng nhập):** `textarea[placeholder="Viết bình luận..."]`, `button[type="submit"]:has-text("Gửi")`, `button[aria-label="Xoá bình luận"]` |
| **Luồng & Tương tác** | 1. **Clap:** Click nút vỗ tay → gửi `POST /api/posts/[uid]/claps`, bộ đếm tăng `+1`, lưu `localStorage['claps:' + uid]`, reload trang vẫn giữ giá trị từ DB + localStorage. Đạt 50 claps/IP → trả `429` và disable nút.<br>2. **Comment khi chưa đăng nhập:** Hiển thị link "Đăng nhập để bình luận."; gọi trực tiếp `POST /api/posts/[uid]/comments` trả `401`.<br>3. **Comment khi đã đăng nhập:** Nhập nội dung `2..2000` ký tự → click `Gửi` (disabled khi rỗng/whitespace) → `201`, bình luận xuất hiện ngay kèm tên tác giả và thời gian; reload vẫn còn trong danh sách.<br>4. **Validation & Anti-spam:** Gửi bình luận trùng hệt bình luận liền trước của cùng user → `400 Duplicate comment`; gửi `< 2` hoặc `> 2000` ký tự → `400`; vượt 5 bình luận/60s → `429`.<br>5. **Xóa bình luận:** Chủ sở hữu bình luận hoặc Admin thấy nút `Xoá` (hover `.group`), click → `DELETE /api/comments/[id]` trả `200` và xóa khỏi danh sách; user khác xóa hộ → `403`. |
| **Tiêu chí Pass** | - Dữ liệu clap/comment bền vững qua reload (lưu D1 thật).<br>- Kiểm soát quyền (`401` unauth, `403` wrong owner) và rate-limit hoạt động chính xác. |

---

## 4. Authentication (Signup, Login, Logout, Session)

| Hạng mục | Chi tiết |
|---|---|
| **Routes & APIs** | `/signup`, `/login`; `POST /api/auth/signup`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me` |
| **Selectors & Focus** | `#displayName`, `#email` (auto-focus khi mount trang `/login` và `/signup`), `#password`, `button[type="submit"]`, `form [role="alert"]`, `button:has-text("Sign out")` |
| **Phím tắt** | `Enter` trong form input kích hoạt submit form. |
| **Luồng & Tương tác** | 1. **Signup:** Nhập `displayName` (≤ 40 ký tự), `email` hợp lệ, `password` (≥ 8 ký tự) → submit → `201`, đặt cookie `vux_session` (`HttpOnly`, `SameSite=Lax`), chuyển về `/` (hoặc `/admin` nếu khớp `OWNER_EMAIL`). Email trùng → `409` và hiện `[role="alert"]`.<br>2. **Login:** Sai mật khẩu/email → `401 Invalid credentials` và hiện `[role="alert"]`. Đúng thông tin → `200`, đặt cookie session mới (tối đa 5 session/user), điều hướng `/admin` (nếu `isAdmin`) hoặc `/`.<br>3. **SSR Redirect:** User đã có session hợp lệ vào `/login` hoặc `/signup` bị server redirect `302` về `/` hoặc `/admin`.<br>4. **Logout:** Click `Sign out` hoặc `POST /api/auth/logout` → xóa row session trong D1, clear cookie, `/api/auth/me` trả `{ authUser: null }`. |
| **Tiêu chí Pass** | - Cookie session không đọc được từ `document.cookie` (`HttpOnly`).<br>- Password sai không bao giờ đăng nhập được; rate limit trả `429` sau ngưỡng quy định (login: 8 lần/15p, signup: 5 lần/1h). |

---

## 5. Global Navigation, Theme Toggle & Static Pages

| Hạng mục | Chi tiết |
|---|---|
| **Routes** | Sidebar hiển thị ở mọi trang (`md:` ≥ 768px): `/`, `/tags`, `/about`, `/contact`, plus `/projects`, `/sitemap.xml` |
| **Selectors chính** | `nav[role="navigation"] a`, `button[aria-label="Toggle theme"]`, `html.dark`, `/contact`: `#name`, `#email`, `#message`, `button[type="submit"]:has-text("Gửi")` |
| **Luồng & Tương tác** | 1. Sidebar điều hướng đúng tới `/`, `/tags`, `/about`, `/contact`.<br>2. Click `button[aria-label="Toggle theme"]` → toggle class `dark` trên `<html>`, lưu `localStorage.theme` (`'light' | 'dark'`), reload trang vẫn giữ nguyên theme đã chọn.<br>3. `/about` render thông tin cá nhân & bảng metadata; `/projects` render empty state + link repo; `/contact` render form và kênh liên hệ trực tiếp.<br>4. `/sitemap.xml` trả `Content-Type: text/xml` chứa `<urlset>` với các trang tĩnh và tất cả bài viết đã publish. |
| **Tiêu chí Pass** | - Dark mode giữ trạng thái qua reload.<br>- Sitemap parse XML hợp lệ và chứa URL bài viết. |

---

## 6. Admin Dashboard & Post Lifecycle (CRUD)

| Hạng mục | Chi tiết |
|---|---|
| **Routes & APIs** | `/admin`, `/admin/post/new`, `/admin/post/[id]`; `GET/POST /api/admin/posts`, `GET/PUT/DELETE /api/admin/posts/[uid]`, `POST /api/upload` |
| **Selectors chính** | `.post-list`, `a[href="/admin/post/new"]`, `span:has-text("Draft")`, `button:has-text("Delete")`, `input[name="title"]`, `#editor`, `button:has-text("Save Draft")`, `button:has-text("Publish")` |
| **Luồng & Tương tác** | 1. **Gating:** Chưa đăng nhập vào `/admin*` → `302` về `/login`; user thường (`isAdmin = false`) vào `/admin*` → `302` về `/`; gọi API admin hoặc `/api/upload` không phải admin → `403 Forbidden`.<br>2. **Danh sách Admin:** `/admin` gọi `GET /api/admin/posts` và hiển thị cả bài published lẫn `Draft`.<br>3. **Tạo / Sửa / Xuất bản / Xóa:** Admin tạo bài nháp (không xuất hiện ở `/` public feed), cập nhật & publish (hoặc qua UI/API), sau đó xóa bài (UI có `window.confirm`, `DELETE /api/admin/posts/[uid]`). |
| **Tiêu chí Pass** | - Boundary `403` cho non-admin trên cả SSR lẫn API.<br>- Bài nháp (`isPublished: false`) ẩn trên `/` nhưng thấy trên `/admin`.<br>- Xóa bài gỡ khỏi cả `/admin` và D1. |

---

## 7. Media Edge Middleware (R2 Streaming)

| Hạng mục | Chi tiết |
|---|---|
| **Routes** | `/images/*`, `/audios/*` ([middleware.ts](file:///Users/vyquocvu/Develop/vux/middleware.ts)) |
| **Luồng & Tương tác** | 1. Request hợp lệ tới object có trong R2 → `200`, `Cache-Control: public, max-age=31536000, immutable`, `Accept-Ranges: bytes`, `X-Content-Type-Options: nosniff`.<br>2. `Range: bytes=0-15` → `206 Partial Content` với `Content-Range: bytes 0-15/<total>` và đúng 16 bytes.<br>3. `Range` vượt quá kích thước → `416`.<br>4. `If-None-Match` khớp `ETag` → `304 Not Modified`.<br>5. Key không hợp lệ (`..`, ký tự lạ, ký tự đầu không phải alphanumeric) → `400 Bad request`; key hợp lệ nhưng không có trong R2 → `404 Not found`. |
| **Tiêu chí Pass** | - Toàn bộ status code `200/206/304/400/404/416` và byte payload chính xác. |
