# k3vaceo

Công cụ làm việc nhóm cho Nhóm 6, khoá K03 (VCCI × Đại học Andrews). Cloudflare
Pages (tệp tĩnh) + Cloudflare Worker (API) + D1 (SQLite). Không build step,
không framework — xem `SRS v1.0` mục 8.

Trạng thái hiện tại: phần **Chuẩn bị** — schema đầy đủ, dữ liệu thật của Nhóm 6
và toàn bộ danh sách 134 người/10 nhóm đã sẵn sàng ở dạng migration. Chưa có
API thật (chỉ có `/api/health` để kiểm tra) và chưa có giao diện thật (đó là
việc của Đợt 1 — xem kế hoạch triển khai).

## Cấu trúc

```
public/        Cloudflare Pages — tệp tĩnh
worker/        Cloudflare Worker — API (router tay, worker/src/index.js)
migrations/    Schema + dữ liệu D1, áp theo đúng thứ tự file
scripts/       Công cụ nhập liệu từ file Excel gốc
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
