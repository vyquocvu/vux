# vux — Reading rail & public UI · design spec

Ngày: 2026-11-04 · Phạm vi: trang public, không đụng `/admin`, không thêm dependency.
Mockup tham chiếu: `docs/design-preview/a-reading-rail.html`

## 1. Vấn đề

`components/MainContent.tsx:9` đặt `lg:mr-64` (chừa 256px bên phải từ 1024px) nhưng không có
component nào render ở đó, và `:10` đặt `max-w-4xl` mà thiếu `mx-auto`. Cộng lại, khoảng trắng
dồn hết sang phải: 448px trống ở viewport 1280, 608px ở 1440, 1040px ở 2560 (~40% màn hình).
`GitHubCorner` (`fixed top-0 right-0`) nằm giữa vùng trống đó nên càng lệch.

## 2. Quyết định đã chốt

| # | Quyết định | Lý do |
|---|---|---|
| D1 | Rail **chỉ** ở `/post/[slug]`. 6 trang còn lại full-width `mx-auto`. | Rail chỉ đáng tồn tại khi có thứ để nói; TOC là thứ duy nhất nó làm tốt hơn khoảng trống. |
| D2 | Rail bật ở **`xl` (≥1280px)**, không phải `lg`. | `lg`: 1024 − 256 sidebar − 96 padding − 256 rail − 48 gap = **368px** cho cột chữ → code block vỡ. `xl`: 624px, tạm ổn. |
| D3 | Dưới `xl` và khi có ≥2 heading: TOC nằm trong `<details>` gọn ở đầu bài. | Tablet không bị mất hoàn toàn điều hướng. Cùng một component `PostToc`, chỉ khác chỗ đặt. |
| D4 | Rail gồm: progress ring + TOC (≥2 heading) + meta (ngày tuyệt đối + thời gian đọc) + tag (nếu có) + 3 bài mới nhất. | 17/47 bài không có tag nên "bài liên quan theo tag" sẽ trống; 47/47 đều có `updatedAt` nên "mới nhất" luôn chạy. Tag vốn **đang biến mất hoàn toàn** trên trang bài viết — rail bù lỗ hổng này. |
| D5 | TOC + reading time tính ở **build time** (`getStaticProps`), không phải client. | heading sâu nhất 14, TB 3.7; slug phải ổn định để deep-link; ISR đã revalidate 600s nên chi phí không đổi. |
| D6 | **Bỏ `GitHubCorner`** khỏi shell public. | Repo đã có trong sidebar socials (`config.js:19`); corner `fixed` sẽ đè lên rail ở `xl`. |
| D7 | Display font đổi sang **serif** (`EB Garamond`), body giữ Inter. | `Design.md:238` ghi "Don't use Inter for display headlines" và `:94` chỉ định EB Garamond là substitute — đây là đóng mâu thuẫn có sẵn trong repo, không phải sở thích mới. |
| D8 | Thêm `subsets: ['latin','vietnamese']` cho display font. | `Layout.tsx:12` chỉ tải `latin` → "Vy Quốc Vũ" (ố, ữ) rơi về fallback. Bug thật, sửa luôn. |
| D9 | `/projects` chỉ sửa empty state, **không** bịa nội dung. | Trang đang là "Coming soon...". |

Ràng buộc từ `Design.md` được giữ: coral `primary` chỉ dùng cho CTA chính và marker active
(`:236`), không bold display serif (`:239`), max content ~1200px (`:106`), code block scroll
ngang thay vì wrap (`:266`).

## 3. Đơn vị & interface

### 3.1 `utils/html.ts` + `utils/toc.ts` (mới, thuần, không DOM)

`utils/html.ts`: export lại `parseAttrs(tag)` và `escapeAttr(v)` nguyên văn từ
`utils/images/content.ts`, cùng `stripTags(html)` và `textOf(html)`; `content.ts` đổi sang import
từ đây.

```
type TocEntry = { id: string; label: string; level: 2 | 3 | 4 }
headingSlug(text: string, seen: Set<string>): string
buildToc(html: string): { html: string; toc: TocEntry[]; minutes: number }
```

- `headingSlug`: bỏ dấu tiếng Việt (NFD + strip combining, `đ → d`), **giữ chữ số**, thay
  khoảng trắng bằng `-`, xoá ký tự ngoài `[a-zA-Z0-9-]`, viết thường. Không dùng `friendlyStr`
  (`utils/common.ts:10`) vì nó xoá hết `[0-9]`.
- `buildToc`: duyệt tag `<h2>`/`<h3>`/`<h4>` và gắn `id` nếu chưa có; heading đã có `id` thì giữ
  nguyên (deep-link đã lưu trong content không bị đổi). `seen` suffix `-2`, `-3` khi trùng.
  `minutes = max(1, ceil(wordCount / 200))` trên text đã strip tag.
- **Không regex thô.** `utils/images/content.ts` đã có sẵn `parseAttrs` (giữ thứ tự và các
  attribute lạ) + `escapeAttr` cho đúng bài toán "sửa 1 tag trong HTML Quill". Hai hàm này tách
  sang `utils/html.ts`, `content.ts` import lại — DRY, và `buildToc` đi cùng khuôn với code đã
  được kiểm chứng trong repo.
- Khác biệt chủ đích: `annotateContentImages` chạy lúc **ghi** (`setPostById`) và kết quả được
  lưu vĩnh viễn; `buildToc` chạy lúc **đọc** trong `getStaticProps`. Vì vậy không phải migrate
  47 bài, và nếu thuật toán slug đổi thì chỉ cần revalidate.
- Chuỗi `<h2>` trong code sample không bị match vì nó đã escape thành `&lt;h2&gt;`, không tồn tại
  tag thật.
- `level: 4` được gom vào nhóm của `h3` khi render để rail không quá 2 cấp thụt đầu dòng.

### 3.2 `components/Post/PostToc.tsx` (mới)

`{ toc: TocEntry[]; variant: 'rail' | 'details' }`. Một component dùng cho cả rail (`xl`) và
`<details>` (`<xl`) — tránh nhân đôi scrollspy. Render `null` khi `toc.length < 2`.

### 3.3 `components/Post/ReadingRail.tsx` (mới)

```
{ toc: TocEntry[]; minutes: number; updatedAt: number; tags: string[];
  latest: { title: string; slug: string; updatedAt: number }[] }
```
Progress ring + `PostToc variant="rail"` + meta + tag chips + latest. Scrollspy đặt trong hook
`useActiveHeading(toc)` (`components/Post/useActiveHeading.ts`, scroll listener `passive`, chỉ
chạy client) để cả rail lẫn biến thể `<details>` dùng chung một cơ chế. Ring là `<div role="img"
aria-label="Tiến trình đọc">` với `aria-valuenow` cập nhật phía client — nó không chứa link nên
không cần focus semantics. Block nào thiếu dữ liệu thì ẩn; rail không bao giờ rỗng vì meta luôn có.

### 3.4 `components/MainContent.tsx` (sửa)
Chỉ còn trách nhiệm một container giữa:

```tsx
type Props = { children: ReactNode }
<div className="min-h-screen md:ml-64 p-8 md:p-12 bg-canvas dark:bg-surface-dark">
  <div className="mx-auto w-full max-w-[1216px]">{children}</div>
</div>
```

Bỏ `sm:mr-0 lg:mr-64` (nguồn gốc vùng chết), bỏ `max-w-4xl` không center. 1216px = 76rem, khớp
`Design.md:106` "~1200px centered". `min-w-0` do trang bài viết tự đặt trên cột của nó.

### 3.5 Vì sao KHÔNG có `rail` prop
`pages/_app.tsx:29` render `<Layout>` cho mọi page, nên page **không có đường** truyền một node
ngược lên `MainContent`. Luồng `page → Layout.rail → MainContent.rail` sẽ phải thêm context
tương tự `AuthUserInfoContext` chỉ để đặt 1 component — không đáng.
Quyết định: **trang bài viết tự owns grid 2 cột của nó**, `MainContent` không biết gì về rail.
`components/Layout.tsx` không đổi (chỉ đổi font subset, D8); `pages/_app.tsx` chỉ bỏ
`<GitHubCorner />` (D6). Trang nào cần bề rộng nhỏ hơn thì tự đặt `max-w-*` + `mx-auto` bên
trong — `/about`, `/contact`, `/tags` làm vậy.

### 3.6 `pages/post/[slug].tsx` (sửa)
Wrapper: `<div className="min-w-0 xl:grid xl:grid-cols-[minmax(0,1fr)_16rem] xl:gap-12">`, cột 1
là bài viết như hiện tại, cột 2 `<aside className="hidden xl:block"><div className="sticky top-12">…`
chứa `<ReadingRail/>`. Dưới `xl` rail ẩn và `<PostToc variant="details">` hiện ở đầu bài (D3).

`getStaticProps`: `const { html, toc, minutes } = buildToc(post.publishContent)` → props `toc`,
`minutes`, `publishContent = html`.
`latest` dùng fetcher **mới** `getLatestPosts(limit, excludeUid)` trong `fetcher/post.ts`:
`SELECT uid, slug, title, updated_at ... ORDER BY updated_at DESC LIMIT ?` — **không** join tag.
Lý do: `getPublishedPosts()` chạy `loadTags()` cho từng bài (N+1, 47 round-trip); gọi nó trong
`getStaticProps` của 47 trang bài viết ≈ 2.209 query cho một lần build full. `getLatestPosts` là
1 query, và rail không cần tag của bài khác.
Nút back: bỏ `fixed ... w-full` (sẽ đè rail), đổi thành `sticky top-0` trong cột bài viết.

### 3.7 `components/Post/PostRow.tsx` + `Feed.tsx` (sửa — S3)
Bỏ hack `max-h-12 → max-h-40` trên excerpt (dùng `line-clamp-2` tĩnh), ngày absolute
`dd/MM/yyyy` kèm relative, thumbnail `16:10` bên phải ở `md+` khi `thumbImage` tồn tại và
**không** đổi bề rộng cột text khi bài thiếu ảnh, `Read →` luôn hiện (bỏ `opacity-0`).
`pages/post/index.tsx` chuyển từ `List` sang `Feed` để hai trang list dùng một archetype.
`components/Post/List.tsx` **giữ nguyên** — nó không phải bản trùng: admin dùng nó qua
`pages/admin/index.tsx:4` với `isAdmin` và FAB "+ New Post". Chỉ đổi chỗ dùng, không xoá file.

### 3.8 `pages/tags.tsx` (sửa — S3)
`bg-neutral-100 dark:bg-neutral-800` và `primary-50` / `primary-900/30` **không tồn tại** trong
`tailwind.config.js` (`primary` là màu phẳng, không có scale) → hover hiện tại chết. Đổi sang
token có sẵn. Sắp xếp theo số bài, có đếm.

### 3.9 `pages/about.tsx`, `pages/contact.tsx` (sửa — S3)
`/about`: 2 cột ở `lg` (giới thiệu | tech stack + skillicons). `/contact`: input/textarea/button
**đang không có một dòng style nào** (`className="mb-4"`), dựng form token đúng `Design.md`
(40px chiều cao, `rounded-md`, `border-hairline`, focus `ring-primary`); thêm kênh liên hệ trực
tiếp bên cạnh để trang không chỉ là form.

## 4. Edge case

| Trường hợp | Hành vi |
|---|---|
| 7 bài có 0 heading, 5 bài có 1 heading | Không render TOC ở đâu cả; rail vẫn còn progress + meta + latest. |
| 3 bài có ≥10 heading | `PostToc` `max-h-[50vh] overflow-y-auto`. |
| 17 bài có 0 tag | Block tag ẩn, rail co lại, các block khác không nhảy. |
| 6 bài không có `thumbImage` | Ô ảnh không render, cột text giữ nguyên bề rộng. |
| Heading đã có sẵn `id` | Giữ nguyên id, không ghi đè. |
| Trùng slug heading | `-2`, `-3`. |
| `<h4>` | Vào TOC, thụt cấp 1 như `h3`. |
| JS tắt | TOC vẫn là anchor link thường, hoạt động; chỉ progress ring không cập nhật. |
| `prefers-reduced-motion` | Tắt `transition` trên ring và hover-translate của TOC. |

## 5. Kiểm chứng

Không có test runner trong repo (`package.json`), nên:
1. `yarn lint` + `yarn build` (bắt lỗi type/SSG).
2. Unit-check riêng cho `utils/toc.ts` bằng `node --experimental-strip-types` trên nội dung thật:
   xác nhận 47 bài sinh slug hợp lệ, không rỗng, không trùng trong cùng bài, và `minutes` trong
   khoảng hợp lý.
3. Chạy `yarn dev`, xem thủ công ở 1440 / 1280 / 1024 / 768 / 390, cả light + dark, trên:
   `/`, `/post?tag=javascript`, 1 bài có 14 heading, 1 bài 0 heading, 1 bài 0 tag,
   `/tags`, `/about`, `/contact`.
4. Đo lại không còn vùng chết: cột chữ sát mép phải như sát mép trái.

## 6. Ngoài phạm vi

`/admin`, `/api`, schema D1, R2, deps mới, content của `/projects`, auth, comment system (Cusdis
giữ nguyên), applause button giữ nguyên.
