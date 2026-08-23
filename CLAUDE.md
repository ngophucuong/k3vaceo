# Bối cảnh dự án k3vaceo

Đọc tệp này trước khi làm gì. Nó ghi những thứ không đoán ra được từ code.

## Dự án là gì

Công cụ làm việc nhóm cho **Nhóm 6, lớp CEO K03** (VCCI × Đại học Andrews).
134 học viên, 10 nhóm, học 13 buổi từ 15/8 đến **26/9/2026** — kết thúc bằng
buổi bảo vệ kế hoạch kinh doanh theo nhóm. Người chịu trách nhiệm sản phẩm:
**Ngô Phú Cường**, trưởng nhóm 6 (cũng là người dùng đang trò chuyện).

Tên miền cố định: `k3vaceo.cuongngo.app` — **không đổi được** vì passkey neo
vào tên miền (mục 4.3 SRS).

Hai tài liệu gốc do người dùng cung cấp, không nằm trong repo:
- `SRSk3vaceov1.md` — đặc tả yêu cầu, **là nguồn chân lý về hành vi và quyền**
- `k3vaceov2.html` — bản mẫu chạy được, **là nguồn chân lý về bố cục và câu chữ**

Khi hai bên mâu thuẫn: SRS thắng về hành vi, HTML thắng về giao diện.

## Trạng thái: Đợt 1–4 đã xong

| Đợt | Nội dung | Hạn SRS |
|---|---|---|
| 1 | Link mời, hồ sơ tự sửa, cơ cấu có lịch sử, Kho, Hôm nay | 28/8 |
| 2 | Bài 8 phần, gợi ý phân công, tiến độ, tâm đắc, đăng nhập email | 4/9 |
| 3 | Quỹ hai cấp, QR VietQR, tự khai, sổ người thu, passkey | 11/9 |
| 4 | Wizard cho nhóm khác, xuất Word 8 phần, phân công thuyết trình | 20/9 |

Chưa làm: những thứ SRS mục 1.4 đã xếp ngoài phạm vi v1 (chat, thông báo đẩy,
điểm danh, đối soát sao kê tự động, ứng dụng gốc iOS/Android).

## Nguyên tắc bất di bất dịch (mục 1.3 SRS)

Vi phạm mấy điều này là sai bản chất sản phẩm, không phải sai kỹ thuật:

- **N1 — Zalo để bàn, ứng dụng để chốt.** Không chat, không thông báo đẩy.
- **N2 — Ứng dụng không giữ file.** Chỉ lưu URL. Không upload.
- **N3 — Ứng dụng không giữ tiền.** Tiền vào thẳng tài khoản người thu.
- **N4 — Tự giác là chính.** Không xác minh email, không OTP, không đối soát.
- **N5 — Chính chủ tự sửa được thông tin của mình**, không qua ai duyệt.
- **N6 — Dữ liệu nhóm cách ly.** Nhóm 8 không đọc được gì của nhóm 6.
- **N7 — Không dùng chữ viết tắt "BCS"** ở bất kỳ chuỗi hiển thị nào. Viết đủ
  "Ban cán sự lớp", kể cả trong log và email.

Thêm một ràng buộc câu chữ tuyệt đối (mục 6.4): trạng thái đóng quỹ **luôn** là
"đã tự khai", **không bao giờ** là "đã đóng". Chỉ khi người thu soi sao kê và
xác nhận mới thành "người thu đã nhận".

## Quy ước kỹ thuật đã chốt — đừng phá

1. **Mọi mốc thời gian do SQLite sinh và so sánh** (`datetime('now', ...)`).
   Tuyệt đối không dùng `Date.toISOString()` để ghi hạn rồi so bằng SQL: chuỗi
   ISO có `T` ở vị trí 11, SQLite dùng dấu cách, `'T'` (0x54) > `' '` (0x20)
   nên khi trùng ngày thì token đã hết hạn vẫn được coi là còn hạn. Lỗi này đã
   xảy ra một lần ở Đợt 1 và suýt giết magic link 15 phút của Đợt 2.

2. **`esc()` trong `public/app.js` phải thoát cả `"` và `'`.** Chuỗi được nhúng
   vào trong thuộc tính HTML; bỏ sót dấu nháy là mở lỗ XSS lưu trữ — đã từng
   xảy ra qua liên kết trong Kho.

3. **Form sửa hồ sơ luôn đọc từ máy chủ trước khi mở** (`GET /api/members/:id`).
   Lấy từ bộ nhớ đệm sẽ có lúc đệm rỗng và bấm Lưu xoá trắng dữ liệu thật —
   lỗi mất dữ liệu đã từng xảy ra ở Đợt 1.

4. **Không build step, không framework** (mục 8 SRS). HTML/CSS/JS thuần. Hai
   ngoại lệ có lý do, cả hai vẫn deploy bằng đúng một lệnh `wrangler deploy`:
   `@simplewebauthn/server` (không tự viết WebAuthn) và cờ runtime
   `nodejs_compat` mà nó cần. Xuất Word thì **tự viết** ZIP + OOXML trong
   `worker/src/lib/docx.js`, không thêm thư viện.

5. **Thứ tự phần tử con của `w:pPr` trong OOXML là bắt buộc**: spacing → jc →
   outlineLvl. Xếp sai thì XML vẫn hợp lệ nhưng Word từ chối mở.

6. **Phân quyền kiểm ở máy chủ, không tin giao diện.** Người nhóm khác phải
   nhận 404 chứ không phải 403 — 403 là xác nhận id đó có thật.

## Cách chạy và kiểm thử cục bộ

```bash
cd worker
cp .dev.vars.example .dev.vars     # đặt RP_ID=localhost
# mở comment khối [assets] cuối wrangler.toml để phục vụ cả giao diện
rm -rf .wrangler/state && npx wrangler d1 migrations apply k3vaceo --local
npx wrangler dev --port 8787 --local
```

**Cạm bẫy đã mất thời gian, đừng vấp lại:**

- Xoá `.wrangler/state` **trong lúc server đang chạy** không có tác dụng —
  server giữ inode cũ. Phải kill server → xoá → khởi động lại.
- Giới hạn tần suất 20 lần thử token/IP/giờ là thật. Chạy bộ test API hai lần
  liên tiếp mà không reset DB sẽ hỏng hàng loạt với lỗi 401.
- Bộ test dùng `INSERT OR IGNORE` cho invite để chạy lại được nhiều lần.

**Môi trường sandbox này không làm được gì:**

- Không ra được internet → `img.vietqr.io` không tải được ảnh QR bao giờ.
  Giao diện có nhánh dự phòng và test kiểm nhánh đó.
- LibreOffice cài sẵn nhưng **hỏng**, không convert nổi cả `.txt`. Để kiểm file
  Word thì dùng bộ lược đồ OOXML chính thức:
  `PYTHONPATH=/root/.claude/skills/synced/xlsx/scripts python3 /root/.claude/skills/synced/xlsx/scripts/office/validate.py <tệp>.docx`
  cộng với `python-docx` để đọc lại nội dung.
- Playwright dùng `/opt/pw-browsers/chromium-1194/chrome-linux/chrome` với
  `--no-sandbox`. Passkey test được bằng virtual authenticator qua CDP.

## Lệch có chủ ý so với DDL nguyên văn mục 3 SRS

Ba chỗ, đều ghi lý do ngay trong migration tương ứng:
- `invites.kind` — tách link mời 14 ngày dùng nhiều lần khỏi magic link 15 phút
  dùng một lần. Không tách thì "dùng một lần" chỉ có trên giấy.
- `rate_events` — để làm được giới hạn tần suất mục 8 yêu cầu (không có KV).
- `webauthn_challenges` — chỗ giữ challenge giữa hai chặng của passkey.
- `plan_sections.present_member_id` / `present_minutes` — phân công thuyết
  trình; tách bảng riêng chỉ để giữ hai cột là thừa.

## Cạm bẫy của D1 thật — trả giá bằng bốn lần chạy hỏng

Bốn điều dưới đây **không lộ ra khi chạy `wrangler d1 execute --local`**, chỉ
lộ khi chạm D1 thật. Đừng vấp lại.

1. **`--remote --file` KHÔNG trả về kết quả SELECT.** Nó đi qua đường "import"
   của D1 và chỉ trả bản tóm tắt (`Total queries executed` / `Rows read` /
   `Rows written`). Truy vấn có chạy thật, nhưng không lấy được dòng nào.
   Muốn đọc kết quả thì phải dùng `--command`. Ngược lại, muốn nạp tệp lớn thì
   phải dùng `--file` — đường import mới là chỗ tự cắt lô.

2. **D1 thật có 24 bảng, không phải 23.** Bảng thứ 24 là của Cloudflare, bản
   cục bộ không có. Nên `verify-d1.sql` đếm theo **danh sách tên bảng** của dự
   án chứ không đếm tất cả bảng khác `sqlite_%`.

3. **D1 từ chối câu lệnh có từ 6 nhánh `UNION ALL` trở lên khi chạy qua tệp** —
   `SQLITE_ERROR: too many terms in compound SELECT`. Qua `--command` thì 16
   nhánh vẫn chạy. Đo được, không phải suy đoán. Vì vậy `verify-d1.sql` gộp
   thành một dòng bằng truy vấn con, tuyệt đối không dùng `UNION ALL`.

4. **Console D1 trên dashboard nghẹn với câu lệnh dài.** Câu INSERT 134 học
   viên dài 35 KB, dán vào là chạy dở dang **mà vẫn báo thành công** — đã một
   lần làm roster có 154 dòng (134 đủ + 20 dòng trùng của mẻ đầu). Đừng tin
   console; nạp bằng workflow rồi đọc phần kiểm tra.

## Nạp dữ liệu lên D1 từ nay về sau

`.github/workflows/nap-du-lieu.yml`. Hai cách kích hoạt:

- Tab **Actions → Nạp dữ liệu vào D1 → Run workflow** (cần quyền
  `actions:write`; token của phiên Claude Code **không** có, sẽ nhận 403).
- Sửa `.github/nap-du-lieu.trigger` rồi đẩy lên. Chỉ đúng tệp đó kích hoạt,
  nên đẩy code bình thường không bao giờ vô tình nạp lại dữ liệu.

Bí mật đã đặt sẵn trong repo: `CLOUDFLARE_API_TOKEN` (quyền D1:Edit) và
`CLOUDFLARE_ACCOUNT_ID`. Workflow tự kiểm tra và **đánh hỏng job** nếu kết quả
không phải ĐÚNG HẾT.

## Việc còn treo, cần người dùng quyết hoặc cung cấp

- **Trạng thái deploy thật (23/8)** — tất cả chạy qua GitHub Actions, không
  dùng Git integration của dashboard:
  - ✅ **D1** dựng và nạp xong. `database_id` thật trong `worker/wrangler.toml`.
    Kiểm tra ra ĐÚNG HẾT: 134 học viên, 10 nhóm, 90 số điện thoại, Nhóm 6 đủ 14
    thành viên và 8 phần bài, trưởng nhóm Ngô Phú Cường.
  - ✅ **Pages** `k3vaceo` đã tạo và deploy.
  - ✅ **Worker** `k3vaceo-api` đã tải mã lên, có binding D1 và biến `RP_ID`.
    (Lần đầu wrangler cảnh báo đè lên bản placeholder tạo bằng dashboard —
    đúng như mong đợi.)
  - ❌ **Worker Route** `k3vaceo.cuongngo.app/api/*` CHƯA tạo được. API token
    thiếu quyền **Zone → Workers Routes → Edit** cho zone `cuongngo.app`
    (`Authentication error [code: 10000]`). `Zone → Zone → Read` thì đã có —
    wrangler tra được zone id rồi mới chết ở bước tạo route.
  - ❌ **Custom domain của Pages** chưa gắn. Chỗ này **bắt buộc làm tay trên
    dashboard**, wrangler không có lệnh. Nó cũng chính là chỗ sinh ra bản ghi
    DNS cho `k3vaceo.cuongngo.app`, mà không có bản ghi đó thì Worker Route có
    tạo được cũng không ai gọi tới.
- Zone `cuongngo.app` đã có trong Cloudflare. README
  có ba đường: Cách A làm hết trên dashboard (Cloudflare tự kéo code từ
  GitHub), Cách B dùng GitHub Actions, Cách C chạy wrangler tay. Người dùng
  nghiêng về Cách A vì không muốn dùng terminal.
  - Cách A vướng đúng một chỗ: `database_id` bắt buộc phải nằm trong
    `worker/wrangler.toml` (Cloudflare đọc tệp này khi deploy), nên phải sửa
    một dòng — sửa được bằng trình soạn thảo web của GitHub.
  - Cách A **không tự chạy migration mới**. Có migration mới thì dán vào tab
    Console của D1, hoặc chạy `node scripts/build-setup-sql.mjs` để sinh lại
    `scripts/setup-d1.sql` (tệp gộp cả sáu migration, có sẵn phần ghi vào
    `d1_migrations` để wrangler sau này không áp đè).
- **SMTP cá nhân**: người dùng chọn dùng SMTP riêng nhưng chưa cho biết nhà
  cung cấp/host/tài khoản. Client SMTP đã kiểm thử trọn giao thức bằng server
  giả, chưa bắt tay TLS với máy chủ thật.
- **Ảnh QR chưa hiển thị thật lần nào** (sandbox không có mạng). Tiêu chí
  nghiệm thu "QR quét được bằng ba app ngân hàng" phải làm bằng điện thoại thật.
- **Danh mục 26 mã ngân hàng** trong `lib/vietqr.js` chép theo bộ BIN Napas
  nhưng chưa đối chiếu được với nguồn công bố.
- **Passkey chưa thử trên iPhone/Android thật** — cần domain thật vì rp.id.
- **Quỹ lớp chưa tạo được**: chưa ai giữ vai cấp lớp trong dữ liệu (mục 11
  điểm #6 SRS còn để ngỏ). Quyền đã viết sẵn, thêm dòng `officers` với
  `group_id IS NULL` là chạy.
- **Kho của Nhóm 6 có 4 mục `url = NULL`** — cần đường dẫn Drive thật.
- **Số điện thoại Lê Trung Đức** trong roster là `098778525`, thiếu 1 số. Giữ
  nguyên trong `roster`, không đưa vào `members`. Cần hỏi lại.

## Cách làm việc mà người dùng đang mong đợi

Qua bốn đợt, cách làm đã thành nếp và người dùng không phàn nàn:

- Trả lời và viết mọi thứ **bằng tiếng Việt**, kể cả commit message, comment
  trong code, và tên biến trong chuỗi hiển thị.
- **Review lại đợt trước trước khi làm đợt sau** — lần review Đợt 1 tìm ra 20
  lỗi thật, trong đó 3 lỗi nghiêm trọng (mất dữ liệu, XSS, lệch thời gian).
- **Kiểm thử thật, không chỉ đọc code**: API bằng curl trên D1 thật, luồng
  người dùng bằng Playwright trên Chromium thật, và luôn viết test hồi quy cho
  đúng từng lỗi đã sửa. Các bộ test nằm ở thư mục scratchpad của phiên, không
  commit vào repo — phiên mới cần viết lại nếu muốn chạy.
- **Nói thẳng cái chưa kiểm chứng được**, đừng để lẫn với cái đã chắc chắn.
- Commit vào nhánh `claude/read-content-deployment-plan-dpsv8m`, không tạo PR
  trừ khi được yêu cầu.
