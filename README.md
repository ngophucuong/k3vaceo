# k3vaceo

Công cụ làm việc nhóm cho Nhóm 6, khoá K03 (VCCI × Đại học Andrews). Cloudflare
Pages (tệp tĩnh) + Cloudflare Worker (API) + D1 (SQLite). Không build step,
không framework — xem `SRS v1.0` mục 8.

Trạng thái hiện tại: **Đợt 1 và Đợt 2** xong.

- Đợt 1 — nhận diện qua link mời, hồ sơ tự sửa (và sửa hộ), cơ cấu nhóm có
  lịch sử, Kho liên kết, màn hình Hôm nay.
- Đợt 2 — bài 8 phần, gợi ý phân công tính ở máy chủ, tiến độ, tâm đắc, nhật
  ký đóng góp, đăng nhập lại bằng email qua SMTP cá nhân.
- Đợt 3 (quỹ, passkey) và Đợt 4 (wizard cho nhóm khác, xuất Word) chưa tới.

## Cấu trúc

```
public/                Cloudflare Pages — tệp tĩnh
  index.html, app.css, app.js    giao diện thật (không framework)
  _redirects                     SPA fallback, phục vụ cả /i/:token
worker/                 Cloudflare Worker — API
  src/index.js            router tay
  src/auth.js              link mời, magic link, phiên cookie
  src/mailer.js            SMTP qua TCP Socket API của Workers
  src/permissions.js       ma trận quyền mục 2.2 SRS + audit_log/activity
  src/lib/                 http, crypto, validate, ratelimit, suggest
  src/routes/              home, members, officers, plan, insights,
                           links, wizard, email-login, session
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

Bốn migration áp theo thứ tự:

- `0001_init.sql` — toàn bộ bảng theo mục 3 SRS.
- `0002_seed_roster.sql` — 134 người/10 nhóm từ danh sách gốc (sinh tự động, xem bên dưới).
- `0003_seed_group6.sql` — kích hoạt thật Nhóm 6: 14 thành viên, cơ cấu có lịch sử, bài 8 phần, tâm đắc, Kho, nhật ký.
- `0004_invite_kind_and_rate_limit.sql` — tách magic link khỏi link mời, thêm bảng đếm giới hạn tần suất.

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
`/i/...` (mở đường link đó). Sau khi trưởng nhóm vào được, ở màn hình **Hôm
nay** có nút **"Phát link mời cho người chưa vào"** — bấm là ra sẵn khối văn
bản 13 dòng để dán thẳng vào Zalo nhóm. Ai lỡ mất link thì vào tab **Nhóm**,
mở người đó ra, bấm **"Phát lại link mời cho người này"**.

### 6. Cấu hình gửi thư (cho đăng nhập lại bằng email — Đợt 2)

```bash
cd worker
npx wrangler secret put SMTP_HOST     # vd smtp.gmail.com
npx wrangler secret put SMTP_PORT     # 587 (STARTTLS) hoặc 465 (TLS)
npx wrangler secret put SMTP_SECURE   # starttls | tls
npx wrangler secret put SMTP_USER     # địa chỉ đăng nhập
npx wrangler secret put SMTP_PASS     # mật khẩu ứng dụng, KHÔNG phải mật khẩu thường
npx wrangler secret put MAIL_FROM     # Nhóm 6 K03 <ten@gmail.com>
```

Lưu ý:

- **Phải là mật khẩu ứng dụng.** Gmail và Outlook đều bắt bật xác minh 2 bước
  rồi mới tạo được mật khẩu ứng dụng; mật khẩu đăng nhập thường sẽ bị từ chối.
- **Cloudflare chặn cổng 25** ra ngoài. Dùng 587 hoặc 465.
- Chưa cấu hình thì màn đăng nhập bằng email báo lỗi rõ ràng, còn link mời
  vẫn dùng bình thường — không chặn gì của Đợt 1.

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

Muốn thử luôn cả đăng nhập bằng email mà không cần tài khoản SMTP thật: chép
`worker/.dev.vars.example` thành `worker/.dev.vars`, trỏ `SMTP_HOST=127.0.0.1`,
`SMTP_PORT=2525`, `SMTP_SECURE=plain`, rồi chạy một SMTP server giả ở cổng
2525 để đọc thư (`.dev.vars` đã nằm trong `.gitignore`).

## API đã có

```
GET  /api/health
GET  /api/invite/:token            → hồ sơ điền sẵn từ roster
POST /api/invite/:token/claim      { email, phone?, title?, company? }
POST /api/auth/email               { email }  → gửi link đăng nhập 15 phút
POST /api/auth/email/:token        → đổi link đăng nhập lấy phiên (một lần)
POST /api/auth/logout

GET   /api/home                    → việc cần làm, cơ cấu, nhật ký, tiến độ
GET   /api/members                 → thành viên cùng nhóm + so với bản gốc
GET   /api/members/:id             → một hồ sơ (form sửa đọc từ đây)
PATCH /api/members/:id             { title?, company?, phone?, email? }
PUT   /api/members/:id/profile     { sells_what?, sells_to?, needs?, offers? }
POST  /api/members/:id/invite      → phát lại link mời cho đúng người này
GET   /api/officers
PUT   /api/officers                { role, member_id, note? }

GET   /api/plan                    → 8 phần, gợi ý phân công, tâm đắc, đề tài
PATCH /api/plan/topic              { topic_product?, topic_customers? }
PATCH /api/plan/sections/:id       { owner_member_id?, pct?, note? }
POST  /api/insights                { body, speaker?, heard_on?, section_id? }
DELETE /api/insights/:id

GET    /api/links?tag=bai|buoi|lop
POST   /api/links                  { url, title?, kind?, tag? }
DELETE /api/links/:id
POST   /api/wizard/invites         → khối link mời cho người chưa nhận tên
```

Mọi route (trừ nhóm auth ở trên) cần cookie phiên hợp lệ; máy chủ tự kiểm tra
vai và phạm vi nhóm theo đúng ma trận mục 2.2 SRS, không tin giao diện.

Hai điểm cố ý khác DDL nguyên văn mục 3 SRS, đã ghi lý do trong migration
0004: cột `invites.kind` (tách link mời 14 ngày dùng nhiều lần khỏi magic
link 15 phút dùng một lần) và bảng `rate_events` (để làm được giới hạn 20
lần thử token mỗi IP mỗi giờ mà mục 8 SRS yêu cầu).

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
- **SMTP chưa chạy thử với hộp thư thật.** Client SMTP đã kiểm thử trọn giao
  thức (EHLO nhiều dòng, AUTH LOGIN, DATA, tiêu đề tiếng Việt mã hoá RFC 2047)
  nhưng bằng một SMTP server giả chạy cục bộ, chưa bắt tay TLS với máy chủ
  thật. Lần đầu cấu hình bằng tài khoản thật cần thử gửi một thư để chắc chắn.
- **Quỹ mới là màn "sắp có"** — bảng dữ liệu đã có trong D1 từ đầu, API đọc/ghi
  tới Đợt 3 mới thêm.
- **Đăng nhập lại bằng email (Đợt 2)** cần bạn cho biết SMTP cá nhân dùng nhà
  cung cấp nào (Gmail/Outlook/khác) — xem mục "Email" trong kế hoạch triển khai.
