# k3vaceo

Công cụ làm việc nhóm cho Nhóm 6, khoá K03 (VCCI × Đại học Andrews). Cloudflare
Pages (tệp tĩnh) + Cloudflare Worker (API) + D1 (SQLite). Không build step,
không framework — xem `SRS v1.0` mục 8.

Trạng thái hiện tại: **Đợt 1** xong — nhận diện qua link mời, hồ sơ tự sửa,
cơ cấu nhóm có lịch sử, Kho liên kết, Hôm nay — tất cả chạy API thật trên D1,
có giao diện thật, đã kiểm thử bằng Playwright trên trình duyệt thật. Đợt 2
(bài 8 phần, đăng nhập lại bằng email) và Đợt 3 (quỹ, passkey) chưa tới.

## Cấu trúc

```
public/                Cloudflare Pages — tệp tĩnh
  index.html, app.css, app.js    giao diện thật (không framework)
  _redirects                     SPA fallback, phục vụ cả /i/:token
worker/                 Cloudflare Worker — API
  src/index.js            router tay
  src/auth.js              token mời, phiên cookie
  src/permissions.js       ma trận quyền mục 2.2 SRS + audit_log/activity
  src/lib/                 http, crypto (băm token, sinh token)
  src/routes/              home, members, officers, links, wizard, session
migrations/             Schema + dữ liệu D1, áp theo đúng thứ tự file
scripts/                Công cụ nhập liệu + sinh lời mời đầu tiên
```

## Triển khai lần đầu

Cần: tài khoản Cloudflare, domain `maychudev.com` đã thêm vào tài khoản đó
(để sau này trỏ subdomain `k3vaceo.maychudev.com`), Node.js 18+.

```bash
npm install                 # cài wrangler + xlsx (chỉ dùng để phát triển, không đóng gói vào sản phẩm)
npx wrangler login          # đăng nhập tài khoản Cloudflare thật của bạn
```

### 1. Tạo D1 và áp schema + dữ liệu

```bash
npx wrangler d1 create k3vaceo
# Lệnh trên in ra database_id — dán vào worker/wrangler.toml, thay REPLACE_WITH_REAL_DATABASE_ID

cd worker
npx wrangler d1 migrations apply k3vaceo --remote
cd ..
```

Ba migration áp theo thứ tự:

- `0001_init.sql` — toàn bộ bảng theo mục 3 SRS.
- `0002_seed_roster.sql` — 134 người/10 nhóm từ danh sách gốc (sinh tự động, xem bên dưới).
- `0003_seed_group6.sql` — kích hoạt thật Nhóm 6: 14 thành viên, cơ cấu có lịch sử, bài 8 phần, tâm đắc, Kho, nhật ký.

### 2. Deploy Worker

```bash
cd worker
npx wrangler deploy
cd ..
```

Kiểm tra: mở `https://<tên-worker>.<subdomain>.workers.dev/api/health` — phải
trả về `{"ok":true,"roster_total":134,"groups_total":10,"group6_members":14,"group6_truong_nhom":"Ngô Phú Cường"}`.

### 3. Deploy Pages

```bash
npx wrangler pages deploy public --project-name=k3vaceo
```

### 4. Trỏ domain thật

Trong Cloudflare Dashboard (zone `maychudev.com`):

1. Gắn custom domain `k3vaceo.maychudev.com` vào project Pages `k3vaceo`.
2. Thêm Worker Route: pattern `k3vaceo.maychudev.com/api/*` → worker `k3vaceo-api`
   (mở comment tương ứng trong `worker/wrangler.toml` rồi `wrangler deploy` lại).

Domain này **cố định vĩnh viễn** kể từ khi passkey (Đợt 3) đi vào hoạt động —
đổi domain sau đó làm chết toàn bộ passkey đã đăng ký (mục 4.3 SRS).

### 5. Đăng nhập lần đầu

Chưa ai có link mời cả (kể cả trưởng nhóm) — cần tự tay tạo một link để vào lần đầu:

```bash
node scripts/bootstrap-invite.mjs "Ngô Phú Cường"
```

In ra một lệnh `wrangler d1 execute --remote` (chạy lệnh đó) và một đường link
`/i/...` (mở đường link đó). Sau khi trưởng nhóm vào được, mở **Hôm nay**, bấm
sửa hồ sơ hay cơ cấu bình thường — 13 người còn lại nhận link mời qua nút
"Phát link mời" gọi `/api/wizard/invites` (thêm nút này khi ráp giao diện cho
trưởng nhóm, hoặc gọi thẳng bằng `curl`/Postman kèm cookie phiên trong lúc chờ).

## Kiểm thử cục bộ (không cần tài khoản Cloudflare)

```bash
cd worker
npx wrangler d1 migrations apply k3vaceo --local
```

Muốn xem cả giao diện lẫn API trên một cổng giống domain thật, mở tạm comment
khối `[assets]` cuối `worker/wrangler.toml`, rồi:

```bash
npx wrangler dev --port 8787 --local
```

`http://localhost:8787` chạy được toàn bộ ứng dụng. Vì chưa có link mời nào,
tự thêm một cái bằng tay (thay `TOKEN_HASH` bằng SHA-256 của một chuỗi bạn tự
chọn, ví dụ tính bằng `node -e "console.log(require('crypto').createHash('sha256').update('chuoi-bat-ky').digest('hex'))"`):

```bash
npx wrangler d1 execute k3vaceo --local --command "INSERT INTO invites (member_id, token_hash, expires_at, created_at) VALUES (6, 'TOKEN_HASH', datetime('now','+14 days'), datetime('now'));"
```

rồi mở `http://localhost:8787/i/chuoi-bat-ky`. Nhớ **comment lại** khối
`[assets]` trước khi deploy thật — production là Pages tách riêng.

## API đã có (Đợt 1)

```
GET  /api/health
GET  /api/invite/:token            → hồ sơ điền sẵn từ roster
POST /api/invite/:token/claim      { email, phone?, title?, company? }
POST /api/auth/logout

GET   /api/home                    → việc cần làm, cơ cấu, nhật ký, tiến độ
GET   /api/members                 → thành viên cùng nhóm + so với bản gốc
PATCH /api/members/:id             { title?, company?, phone?, email? }
PUT   /api/members/:id/profile     { sells_what?, sells_to?, needs?, offers? }
GET   /api/officers
PUT   /api/officers                { role, member_id, note? }
GET    /api/links?tag=bai|buoi|lop
POST   /api/links                  { url, title?, kind?, tag? }
DELETE /api/links/:id
POST /api/wizard/invites           → sinh/lấy lại link mời cho người chưa nhận
```

Mọi route (trừ 3 route đầu) cần cookie phiên hợp lệ; máy chủ tự kiểm tra vai
và phạm vi nhóm theo đúng ma trận mục 2.2 SRS, không tin giao diện.

## Nhập lại danh sách khi có bản mới

```bash
npm run import:roster -- "đường-dẫn-tới-file.xlsx"
```

Sinh lại `migrations/0002_seed_roster.sql` + `scripts/import-report.md` (các
chỗ cần kiểm tra lại: lỗi chính tả đã tự sửa, số điện thoại bất thường) +
`scripts/data/truong-pho-nhom-du-kien.json` (dữ liệu tham khảo cho wizard Đợt
4, chưa dùng ở phần Chuẩn bị). Không tự động chạy migration — kiểm tra file
sinh ra rồi tự áp bằng `wrangler d1 migrations apply`.

## Còn thiếu, biết trước

- **Kho chưa có URL thật** — 4 mục trong `0003_seed_group6.sql` mới có tên/loại,
  `url = NULL`. Cần điền đường dẫn Drive/Doc thật trước khi tính năng này dùng được.
- **Số điện thoại của Lê Trung Đức** trong roster là `098778525` (thiếu 1 số) —
  giữ nguyên trong `roster` để tra lại nguồn, nhưng không đưa vào hồ sơ thành
  viên. Cần hỏi lại số đúng.
- **6 thành viên Nhóm 6 chưa có số điện thoại** trong danh sách gốc (Ban tổ
  chức không thu được) — không chặn gì, chỉ ảnh hưởng lúc phát link mời qua
  điện thoại (vẫn phát được qua Zalo/email khi có).
- **9 nhóm còn lại** mới có `roster` + `groups` (status `unclaimed`) — cố ý
  chưa tạo `members`, đúng thiết kế mục 5 SRS: mỗi nhóm tự tạo thành viên khi
  nhóm đó chạy wizard (Đợt 4). Dữ liệu trưởng/phó nhóm dự kiến của họ nằm ở
  `scripts/data/truong-pho-nhom-du-kien.json` để wizard dùng làm gợi ý sau này.
- **Chưa có nút "Phát link mời" trên giao diện** — `/api/wizard/invites` đã
  chạy được (trưởng/phó nhóm gọi được ngay), chỉ chưa có nút bấm trong Hôm nay.
  Thêm nút này là việc nhỏ, để dành khi ráp màn hình wizard ở Đợt 4 cho tiện
  làm một thể — trong lúc chờ, gọi thẳng bằng `curl`/Postman kèm cookie phiên.
- **Bài và Quỹ mới là màn "sắp có"** — dữ liệu (8 phần, quỹ) đã có trong D1,
  API đọc/ghi thật tới Đợt 2 (bài) và Đợt 3 (quỹ) mới thêm.
- **Đăng nhập lại bằng email (Đợt 2)** cần bạn cho biết SMTP cá nhân dùng nhà
  cung cấp nào (Gmail/Outlook/khác) — xem mục "Email" trong kế hoạch triển khai.
