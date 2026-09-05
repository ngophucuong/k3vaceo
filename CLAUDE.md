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

## Đang ở đâu (cập nhật 27/8)

Đã chạy thật trên `k3vaceo.cuongngo.app`, deploy #69 xanh. Nhánh làm việc:
`claude/content-deployment-continuation-m2inni`.

**Bảy việc gần nhất, theo thứ tự nên đọc nếu tiếp nhận:**

1. **Phát lại link mời cho người ĐÃ ĐĂNG NHẬP — vá một lỗ hổng thật** (5/9).
   Ngô Phú Cường xin mở rộng quyền "phát lại link mời trong nhóm" (có từ Đợt
   1, chưa từng chặn người đã đăng nhập) ra cả lớp cho anh và lớp trưởng. Tra
   tới nơi thì lộ ra route ĐÓ đã luôn cho phép **chiếm tài khoản người khác**:
   bước nhận (`postInviteClaim`) không đòi gì ngoài một email tự chọn. Đã vá
   trước khi mở rộng: bước nhận nay đòi đúng số điện thoại khi hồ sơ đã có
   người nhận, cùng hạn mức đoán với `/vao` — xem mục riêng bên dưới.
2. **Tư liệu gắn vào PHẦN BÀI** (5/9). Bài↔Tư liệu là mắt xích còn thiếu của
   bộ ba Hôm nay/Bài/Tư liệu — Ngô Phú Cường hỏi thẳng "ba tab có liên thông
   với nhau không", tra ra `links.section_id` có cột từ đầu (migration 0001)
   nhưng CHƯA từng được nối dây (luôn ghi cứng NULL). Nay nối xong, đúng khuôn
   "một dòng, hai màn" đã dùng cho buổi học — xem mục riêng bên dưới. Điểm
   khác biệt phải nhớ: mỗi nhóm giữ một bộ tám phần RIÊNG, không dùng chung
   như buổi học, nên chốt N6 phải kiểm thêm "đúng nhóm" chứ không chỉ "có thật".
3. **Tư liệu dạng "Nội dung Text"** (5/9, migration 0025). Bên cạnh dán đường
   dẫn, nay gõ thẳng một ghi chú Markdown vào ứng dụng — lệch có chủ ý thứ hai
   với N2, xem mục riêng bên dưới. Điểm cần nhớ nhất: `mdSafe()` trong
   `public/app.js` ESC TRƯỚC rồi mới PARSE cú pháp markdown, không được đảo
   ngược thứ tự.
4. **Link mời xuyên nhóm cho Ban cán sự lớp** (3/9, mở rộng 4/9 và 5/9). Ngô
   Phú Cường (uỷ viên) và Lưu Minh Tiến (lớp trưởng, migration 0022) phát được
   link mời cho BẤT KỲ ai ở bất kỳ nhóm nào, không chỉ nhóm của mình, kể cả
   người đã đăng nhập (mục #1 ở trên) — `POST /api/danh-ba/:roster_id/moi`,
   xem mục riêng bên dưới.
5. Tư liệu gắn vào buổi học — một dòng dữ liệu, hiện ở cả tab Lịch lẫn Tư liệu.
6. Bỏ OTP ở lần đăng nhập đầu — số điện thoại vào thẳng, rồi passkey.
7. **Giới hạn tần suất: đếm lần đoán, đừng đếm người.** Rà lại đợt trên thì lộ
   ra: cả lớp ngồi chung một WiFi hội trường là đường vào tự khoá lại — người
   thứ 11 vào lần đầu, lượt thứ 21 đăng nhập passkey, và link mời chết ngay từ
   lượt đầu vì dùng chung thùng với passkey. Đo được, không phải suy đoán.

**Một cái bẫy đã trả giá, đừng vấp lại:** `deploy.yml` ghim **tên nhánh** ở
`on.push.branches`. Đổi nhánh làm việc mà quên sửa dòng ấy thì mọi commit đẩy
lên đều **không deploy** — tab Actions im lặng, không lỗi, không cảnh báo, và
triệu chứng duy nhất là người dùng bảo "vào không thấy gì mới". Đã xảy ra ngày
28/8 với bốn commit liền.

`deploy.yml` nay tự trả lời câu ấy mỗi lượt: nó tải `/app.js` từ tên miền hai
lần (bình thường và ép làm mới) rồi **so băm với tệp trong repo**. Ép làm mới
vẫn khác thì Pages chưa xuất bản thật → đánh đỏ. Chỉ lượt tải bình thường khác
thì là đệm → cảnh báo. Trước 28/8 không phép kiểm nào hỏi câu này: chúng chỉ
hỏi "giao diện có trả về không" (có) và "API có chạy không" (có), nên deploy
xanh mà người dùng chạy mã cũ lọt qua sạch.

Cạnh nó là bẫy thứ hai: biến `NHANH_PAGES` trong cùng tệp **không phải nhánh
git** — nó là nhánh production của Cloudflare Pages. Pages chỉ coi một lượt
deploy là production khi `--branch` TRÙNG nhánh ấy; sửa nó theo nhánh git mới
thì deploy tụt xuống hạng "xem thử", workflow vẫn xanh mà tên miền vẫn chạy bản
cũ. Muốn đổi thật thì đổi trong bảng điều khiển Pages trước.

**Ba việc cần làm tiếp, xếp theo mức chặn:**

1. **Điền 46 số điện thoại** vào `scripts/data/bo-sung-dien-thoai.csv` (40
   người chưa có số nào, 6 số sai hoặc trùng — đã điền được 4/44 người chưa có
   số nhờ tệp "Trưởng, phó nhóm" của Ban tổ chức, migration 0020; thêm một
   người mới migration 0023 vào thẳng nhóm "sai" vì số trong tệp gốc thiếu một
   chữ số). Chưa điền thì từng ấy người không tự vào được — đây là chỗ chặn số
   một, và nó không phải việc lập trình.
2. **Thử passkey trên điện thoại thật** ở `/vao`. Nay passkey là thứ giữ chỗ
   cho những lần đăng nhập sau, mà nó CHƯA từng chạy trọn vẹn trên tên miền
   thật lần nào. Hỏng thì đường vào lại chỉ còn mã email, tức chưa thật sự bỏ
   được OTP.
3. **Cloudflare → zone `cuongngo.app` → Caching → Browser Cache TTL → "Respect
   Existing Headers"**. Không sửa được trong repo.

**Một việc nên làm ở buổi học đầu tiên có người dùng thật:** đứng cạnh xem
mươi người cùng đăng nhập trên WiFi hội trường. Giới hạn tần suất đã sửa và đã
kiểm bằng địa chỉ IP giả lập, nhưng **chưa ai chạy thử với người thật ngồi
cùng một phòng** — mà đó chính là tình huống làm hỏng bản trước.

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

- **N1 — Zalo để bàn, ứng dụng để chốt.** Không chat. ~~Không thông báo đẩy~~
  → **đã lệch có chủ ý ngày 24/8**, Ngô Phú Cường quyết sau khi được nêu rõ đây
  là đổi bản chất sản phẩm chứ không phải thêm tính năng. Phần "không chat" GIỮ
  NGUYÊN, và thông báo đẩy chỉ mang đúng một việc — "có tin mới, mở ứng dụng ra
  xem" — chứ không thành kênh nhắn tin thứ hai bên cạnh Zalo.
- **N2 — Ứng dụng không giữ file.** Chỉ lưu URL. Không upload. → **đã cân
  nhắc lại và GIỮ NGUYÊN ngày 26/8**, sau khi Ngô Phú Cường hỏi thẳng về upload
  lên Cloudflare R2 và được nêu rõ cả hai vế. Đừng mở lại cuộc bàn này nếu
  không có dữ kiện mới. Lý do quyết:
  - Khoá kết thúc 26/9. Link Drive thì file nằm ở Drive **Ban tổ chức** và sống
    lâu hơn ứng dụng; upload thì ứng dụng giữ một bản sao, nó tắt là mất.
  - Slide giảng viên là tài sản của họ. Ban tổ chức chia sẻ link là quyết định
    của chính họ, thu hồi được. Giữ một bản sao là thay họ quyết chuyện phát
    tán — trên tên miền mang tên người dùng, cho lớp của VCCI × Andrews.
  - R2 đòi gắn thẻ thanh toán vào tài khoản Cloudflare mới bật được, kể cả ở
    mức miễn phí.

  Lý lẽ ngược đã được nêu và vẫn không thắng: link Drive bị đặt hạn chế thì 134
  người bấm vào đều thấy "Yêu cầu quyền truy cập", tệ hơn không có link. Cách
  chữa là dặn Ban tổ chức mở quyền "ai có đường dẫn đều xem được", không phải
  đem file về máy chủ của mình.

  **Cập nhật 5/9: "Nội dung Text" (mục riêng bên dưới) KHÔNG phải mở lại cuộc
  bàn này.** Lý do N2 tồn tại là không tự ý phát tán TÀI SẢN CỦA NGƯỜI KHÁC
  (slide giảng viên). Ghi chú Markdown người trong lớp tự gõ không phải bản
  sao của ai — N2 vẫn nguyên vẹn cho việc không upload file/không giữ bản sao
  slide-PDF-ảnh, mục "Đường dẫn" không đổi gì.
- **N3 — Ứng dụng không giữ tiền.** Tiền vào thẳng tài khoản người thu.
- **N4 — Tự giác là chính.** Không xác minh email, không OTP, không đối soát.
- **N5 — Chính chủ tự sửa được thông tin của mình**, không qua ai duyệt.
- **N6 — Dữ liệu nhóm cách ly.** Nhóm 8 không đọc được gì của nhóm 6. → **đã lệch
  có chủ ý ngày 28/8** cho DANH BẠ, Ngô Phú Cường quyết. Phân định: N6 bảo vệ
  *việc của nhóm* — sổ thu, bài tám phần, thông báo nội bộ — chứ không phải danh
  tính cá nhân. Danh bạ không đụng thứ nào trong số đó. Mọi đường khác GIỮ
  NGUYÊN N6 nguyên vẹn; đừng lấy danh bạ làm tiền lệ để mở thêm.
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
- **Không gọi được cả vào `k3vaceo.cuongngo.app`.** Proxy trả 403 ở bước
  CONNECT (`curl: (56) CONNECT tunnel failed`), curl báo mã `000`. Đừng tưởng
  deploy hỏng. Muốn nhìn tên miền thật thì **thêm phép kiểm vào `deploy.yml`**
  rồi đọc log Actions — đó là con mắt duy nhất có.
- LibreOffice cài sẵn nhưng **hỏng**, không convert nổi cả `.txt`. Để kiểm file
  Word thì dùng bộ lược đồ OOXML chính thức:
  `PYTHONPATH=/root/.claude/skills/synced/xlsx/scripts python3 /root/.claude/skills/synced/xlsx/scripts/office/validate.py <tệp>.docx`
  cộng với `python-docx` để đọc lại nội dung. Dựng `.docx` thì dùng gói `docx`
  của npm — **chưa cài sẵn**, phải `npm install docx`. Muốn NHÌN nội dung tệp
  Word đã dựng thì `mammoth` đổi sang HTML rồi chụp bằng Chromium; chính phép
  nhìn ấy bắt được lỗi dấu sao `*nghiêng*` lồng trong `**đậm**` lọt nguyên văn
  ra tệp, thứ phép kiểm chuỗi không thấy.
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

## Thông báo đẩy (Đợt 7) — khoá VAPID ĐÃ CÓ

**Cập nhật 28/8: khoá đã được đặt.** `/api/health` trên tên miền thật trả
`push: {"bat": true, "khoa": "BMoZLBhm"}`, mà `pushCauHinh()` chỉ trả khác
`null` khi có ĐỦ cả `VAPID_PUBLIC_KEY` lẫn `VAPID_PRIVATE_KEY`. Đo được từ log
deploy #72, không phải suy đoán.

Nói chính xác điều ấy nghĩa là gì: **khoá đã cấu hình xong, giao diện đã mở nút
xin quyền**. Nhưng **chưa ai nhận được một thông báo đẩy thật nào trên điện
thoại thật** — đó là loại bằng chứng duy nhất đáng tin cho việc gửi tin, đúng
như bài học của đường gửi thư ngày 24/8 ("thư nằm trong hộp thư, không phải một
dòng log nói rằng nó đã đi"). Nhớ rằng **iPhone chỉ nhận khi ứng dụng ĐÃ cài
lên màn hình chính**.

Khoá sinh bằng:

```bash
node scripts/tao-khoa-vapid.mjs
```

rồi đặt `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` vào GitHub
Secrets — `deploy.yml` tự đồng bộ sang Worker mỗi lần deploy. Thiếu thì
`/api/push/khoa` trả `bat:false`, giao diện ẩn nút, mọi thứ khác chạy bình
thường.

**Đổi khoá về sau = mọi đăng ký hiện có chết**: trình duyệt gắn đăng ký với
đúng khoá công khai lúc đăng ký. Sinh một lần rồi giữ.

Ba lớp báo tin, xếp từ chắc chắn nhất:

1. **Chấm đỏ trên tab Hôm nay** — chạy trên mọi máy, không cần quyền, không
   cần cài gì. Đây là lớp thật sự đáng tin.
2. **PWA** (`manifest.webmanifest` + `sw.js`) — cài lên màn hình chính. Service
   worker CỐ Ý không cache gì: cache sai một lần là người dùng chạy bản cũ
   hàng tuần và cách chữa duy nhất là bảo họ xoá dữ liệu trình duyệt.
3. **Web Push** — tự viết trong `worker/src/lib/webpush.js`, không thêm thư
   viện (mọi thư viện web-push đều dựng cho Node chứ không cho Workers).

**iPhone chỉ nhận thông báo khi ứng dụng ĐÃ cài lên màn hình chính.** Mở trong
Safari thường thì xin quyền luôn bị từ chối, không kèm lý do — giao diện tự
nhận ra và nói trước thay vì để người dùng bấm vào chỗ chết.

Ba chỗ trong Web Push sai là "gửi đi mà không ai nhận", không báo lỗi:
- Thứ tự trong `info` của HKDF: khoá công khai TRÌNH DUYỆT trước, máy chủ sau.
- Chữ ký ES256 phải là `r||s` 64 byte, không phải DER. WebCrypto trả đúng dạng
  cần; bê mã từ Node sang thì hay dính DER.
- `aud` của JWT là ORIGIN của endpoint, không phải cả URL.

Vì vậy phép kiểm là **giải mã ngược**: đóng vai trình duyệt, giải gói ra và so
từng ký tự — cộng một phép đối chứng sai khoá phải hỏng, để chắc phép kiểm có
răng. Xem `scripts/tao-khoa-vapid.mjs` và bộ kiểm ở thư mục scratchpad.

## Làm mới: quay lại app là tự cập nhật

Trước 25/8 ứng dụng **không bao giờ tự làm mới** — không `visibilitychange`,
không `setInterval`. Mở lên rồi để đó, hôm sau quay lại vẫn thấy số liệu hôm
qua cho tới khi chạm vào một nút. Trên iPhone đã cài lên màn hình chính thì
càng rõ vì không ai đóng hẳn app bao giờ.

Nay quay lại app (`visibilitychange` + `focus`) là gọi lại `/api/home` và vẽ
lại đúng màn đang mở, **có chốt chặn 30 giây** để chuyển qua chuyển lại không
thành mưa request. **Cố ý không dùng `setInterval`**: gọi máy chủ đều đặn suốt
ngày cho 134 người là phí, và pin điện thoại trả giá.

`/api/home` trả thêm `ban` = `env.COMMIT_SHA`. Giao diện chụp lại lúc mở trang
(`BAN_LUC_MO`) rồi so mỗi lần quay lại; khác nhau là đã deploy trong lúc app
nằm im → hiện băng `.banmoi` "Có bản mới — chạm để tải lại". **Không tự tải
lại**: người ta có thể đang gõ dở một ô.

Service worker vẫn không cache gì nên nó chưa bao giờ là thủ phạm. Thủ phạm
thật là **đệm của Pages**, đo trên tên miền thật ngày 25/8:

| Đường dẫn | Mặc định của Pages |
|---|---|
| `/` | `public, max-age=0, must-revalidate` — luôn hỏi lại ✓ |
| `/app.js` `/app.css` `/sw.js` | `public, max-age=14400` — **bốn tiếng** |

`must-revalidate` **chỉ có hiệu lực sau khi hết hạn**, không ép hỏi lại khi còn
tươi. Nên suốt 4 tiếng sau deploy, người quay lại vẫn chạy mã cũ — và băng "Có
bản mới" thành cái bẫy: bấm xong `index.html` mới về mà `app.js` vẫn lấy từ
đệm nên băng hiện lại ngay.

Đã đặt `Cache-Control: no-cache` cho ba tệp ấy trong `public/_headers`.
Không dùng `?v=` vì mục 8 SRS cấm build step.

**Nhưng `_headers` KHÔNG thắng được.** Sau khi đặt, tên miền trả về
`max-age=14400` trơ trọi — mất cả `public` lẫn `must-revalidate` của bản mặc
định, tức header của ta có được áp rồi bị một lớp khác ghi đè. Gần như chắc
chắn là **Browser Cache TTL ở cấp zone** (Cloudflare → `cuongngo.app` →
Caching → Configuration): 14400 giây đúng bằng một mốc dựng sẵn của họ. Sửa
bằng bảng điều khiển, đổi sang **Respect Existing Headers** — không sửa được
trong repo.

Vì vậy nút của băng "Có bản mới" **tự nạp lại tài nguyên trước khi tải lại**:

```js
await Promise.all(['/app.js', '/app.css'].map(u =>
  fetch(u, { cache: 'reload' }).catch(() => {})));
location.reload();
```

`cache: 'reload'` buộc đi mạng VÀ ghi đè bản trong đệm HTTP, nên lượt tải lại
ngay sau đó nhận đúng mã mới — chạy được kể cả khi zone vẫn đang ghi đè.
`location.reload()` một mình thì không: index.html mới về mà app.js vẫn lấy từ
đệm, băng hiện lại ngay, bấm mãi không hết.

`deploy.yml` chỉ **cảnh báo** chứ không đánh hỏng job ở chỗ này: đánh đỏ mọi
lượt deploy vì một nút bấm ngoài repo chỉ dạy người ta bỏ qua màu đỏ.

## Lịch công khai `/lich` và tệp `.ics` — cửa trước cho người chưa tin

Thêm 26/8. Trước đó muốn xem lịch phải qua **năm bước** ở `/vao` (tên → điện
thoại → email → chờ thư → gõ 6 số): năm lần cho đi trước khi nhận được gì, và
người hoài nghi bỏ cuộc ở bước hai. Nay `k3vaceo.cuongngo.app/lich` mở là thấy,
**không đăng nhập, không hỏi gì**. Nhận trước, khai sau.

| Đường | Ai gọi được | Trả gì |
|---|---|---|
| `/lich/` | ai cũng được | trang tĩnh trong `public/lich/` |
| `GET /api/lich/cong-khai` | ai cũng được | CHỈ `lich_hoc` + vài trường `cohorts` |
| `GET /api/lich/k3vaceo.ics` | ai cũng được | tệp lịch tải về máy |

**Đường công khai TUYỆT ĐỐI không được kèm `thong_bao`** — thông báo có loại
nội bộ của từng nhóm, lọt ra là vỡ N6 mà không chỗ nào báo lỗi. `deploy.yml`
có phép kiểm quét tên các trường cấm trong phúc đáp trên tên miền thật.

Không đặt giới hạn tần suất: `allow()` tốn một SELECT cộng một INSERT, đắt hơn
chính truy vấn cần bảo vệ (13 dòng, một chỉ mục). Bao giờ bị lạm dụng thì dùng
Cache API, đừng dùng rate limit.

### Bốn chỗ sai được trong `.ics` mà không báo lỗi

Ghi trong `worker/src/lib/ics.js`, đã có phép kiểm cho từng chỗ:

1. **Xuống dòng phải là CRLF.** Chỉ `\n` thì vài ứng dụng lịch nuốt cả tệp.
2. **Gấp dòng đếm theo OCTET, không theo ký tự** — giới hạn 75, mà chữ Việt có
   dấu chiếm 2–3 byte. Và **phải lùi về ranh giới ký tự**: `TextDecoder`
   KHÔNG ném lỗi khi cắt giữa ký tự, nó lặng lẽ thay bằng `�`. Vì vậy
   phép kiểm "giải mã UTF-8 có được không" là **vô dụng** — phải mở gấp dòng
   ra rồi so từng ký tự với chuỗi gốc. Dữ liệu lịch thật không ép được vào
   nhánh này (điểm gấp tình cờ không rơi giữa ký tự nào), nên phải dựng chuỗi
   riêng để ép — xem `kiem-gap.mjs` ở scratchpad.
3. **UID cố định theo buổi + SEQUENCE tăng dần.** Nhờ đó tải lại tệp là buổi cũ
   được CẬP NHẬT chứ không nhân đôi — sống còn vì lịch lớp có dời buổi.
   `SEQUENCE` lấy `strftime('%s', updated_at)` từ D1.
4. **Buổi đã huỷ VẪN gửi đi**, kèm `STATUS:CANCELLED`. Bỏ hẳn khỏi tệp thì nó
   nằm lại trong lịch người ta mãi mãi và họ đến lớp vào ngày không có ai.

Thêm: giờ Việt Nam là UTC+7 quanh năm nên quy về UTC rồi ghi hậu tố `Z`, không
cần khối `VTIMEZONE`. Phải dùng `Date.UTC` để trừ 7 tiếng — 06:00 ngày 28 lùi
thành 23:00 ngày **27**, trừ tay là quên đổi ngày. Phép kiểm đối chứng bằng
`zoneinfo` của Python chứ không tính lại bằng chính công thức ấy.

### "Hôm nay" LUÔN là `date('now', '+7 hours')`

`datetime('now')` của SQLite là UTC, đi sau Việt Nam 7 tiếng, nên **từ 17h đến
nửa đêm giờ Việt Nam thì `date('now')` vẫn là hôm qua**. Ba hệ quả đã sửa ngày
26/8, không cái nào tự báo lỗi:

- buổi học của hôm nay còn nằm trong danh sách "sắp tới" thêm 7 tiếng
- thông báo hết hạn hôm nay còn hiện thêm 7 tiếng
- **đếm ngược tới buổi bảo vệ lệch một ngày** giữa ứng dụng và trang `/lich`

Chỗ thứ ba là thứ nguy nhất: ứng dụng lấy ngày của MÁY người dùng, trang công
khai lấy từ máy chủ. Điện thoại đặt đúng giờ Việt Nam thì trùng, đặt lệch thì
hai màn nói hai con số. Nay `/api/home` trả thêm `hom_nay` và giao diện dùng
nó; ngày của máy chỉ là đường lùi khi thiếu trường ấy.

## Bảo lưu / rời nhóm — "ngừng tham gia"

Không xoá dòng nào và không đụng `roster`. Chỉ hạ `members.is_active` về 0, vì
cờ ấy đã được kiểm ở hơn ba mươi truy vấn nên người ấy tự rụng khỏi đăng nhập,
phiên đang mở, passkey, thông báo đẩy, danh sách nhóm, danh sách nhận phần bài
và mọi phép đếm sĩ số.

`POST /api/members/:id/ngung` · `POST /api/members/:id/tham-gia-lai` ·
`GET /api/members/ngung` — cả ba chỉ trưởng và phó nhóm gọi được. Giao diện:
nút trong hồ sơ từng người, và mục "Đã ngừng tham gia" ở cuối tab Nhóm mà
người thường không thấy.

**Bốn chỗ đã phải vá, vì hạ cờ không thôi là hỏng ngầm** — không chỗ nào tự
báo lỗi, chỉ ra số sai:

1. **Người thu vĩnh viễn không xác nhận được.** `postVerify` chặn cứng
   `is_active = 1`, nên ai đóng tiền rồi mới nghỉ sẽ kẹt mãi ở "đã tự khai":
   tiền có thật trong tài khoản mà không đường nào vào số dư. Nay cho xác nhận
   nếu người ấy **đã khai đợt đó**.
2. **Sổ thu thôi khớp với số dư.** Truy vấn số dư không đụng bảng `members`
   nên tiền vẫn được cộng, nhưng sổ thu duyệt theo người đang hoạt động nên
   tên biến mất — người thu thấy một khoản không dò được. Nay sổ giữ lại người
   đã ngừng nếu họ đã khai, kèm cờ `da_ngung` để giao diện ghi nhãn.
3. **Mẫu số hụt.** Đếm sĩ số cũng phải cộng thêm người đã ngừng mà đã khai,
   không thì có lúc ra "9/8".
4. **Cơ cấu giữ tên người đã đi.** `getOfficers` cố ý không lọc `is_active`
   (giữ lịch sử), nên **chặn ở đầu vào**: đang giữ chức thì không cho ngừng,
   trả 409 `dang_giu_chuc_nhom` / `dang_giu_chuc_lop`. Phải thay người trước.

Ngoài ra: phần bài và suất thuyết trình được **nhả về "chưa ai nhận"** — một
phần mang tên người đã nghỉ trông như đã có người làm, tệ hơn để trống. Phiên
bị xoá, lời mời chưa dùng bị hết hạn, đăng ký thông báo đẩy bị tắt.

## Dấu ✓ cho trạng thái hoàn thành

Ngô Phú Cường yêu cầu ngày 25/8: xong thì phải nói bằng hình, đừng bắt đọc số
— "100%" và "80%" trông na ná nhau khi lướt. Quy ước: nền `--go-bg` chữ `--go`,
đúng cặp màu của vòng tròn hồ sơ đã điền đủ, để "xong" ở chỗ nào cũng một màu.
Lớp CSS là `.xong`. Đang dùng ở: phần bài 100%, tổng tám phần, dòng người thu
đã nhận trong sổ thu, và dòng tổng của đợt thu khi đã nhận đủ.

**Dấu ✓ xanh chỉ có MỘT nghĩa: người thu đã nhận tiền.** Không bao giờ dùng nó
cho "cả nhóm đã tự khai" — khai xong mà người thu chưa soi sao kê thì chưa đồng
nào là tiền thật (mục 6.4 SRS). Mốc "cả nhóm khai xong" có chip riêng
`.khaichip` màu **cam** của `--due`, kèm câu "còn chờ người thu đối chiếu sao
kê". Hai màu, hai nghĩa, không lẫn.

Với **đợt thu**, "xong" còn phải CẤT BỚT chứ không chỉ thêm dấu. Hai mức:
- người thu đã xác nhận tiền **của bạn** → cất hẳn mã QR, số tài khoản và nút
  chép nội dung. Để lại là mời chuyển tiền thêm lần nữa; tệ hơn, khi mạng yếu
  mã không tải được thì nhánh dự phòng hiện "Chưa hiện được mã. Kiểm tra lại số
  tài khoản" — một khối cam đọc lên y như cảnh báo trên một đợt đã xong.
- người thu đã nhận đủ của **tất cả** → chip `.xongchip` "✓ đã thu đủ" ở đầu
  thẻ, dòng tổng đổi thành "Đợt này xong".

## Sổ thu: lọc theo trạng thái, và cột nhóm cho thủ quỹ lớp

Bốn chip lọc (thêm 25/8): **Tất cả · Chưa khai · Mới tự khai · Người thu đã
nhận**, mỗi chip kèm số đếm. **Không có chip nào tên "đã đóng"** — mục 6.4 SRS.

`getLedger` trả thêm `group_no` / `group_label`. Cột nhóm và ô chọn nhóm chỉ
hiện khi sổ trải trên **nhiều hơn một nhóm**; đợt của nhóm thì mọi dòng cùng
một nhóm nên giấu đi.

Ba điều cố ý:

- **Lọc ở giao diện, không gọi lại máy chủ.** Danh sách nhiều nhất 134 dòng,
  đã tải sẵn — thêm một vòng mạng cho mỗi lần bấm chip là phí.
- **`SOTHU` giữ bộ lọc ngoài hàm vẽ.** Xác nhận một người xong sổ vẽ lại mà
  VẪN giữ nguyên bộ lọc. Không giữ thì thủ quỹ lọc "chưa khai" trong 134
  người, xác nhận một người là danh sách nhảy về đầu — đến người thứ ba là bỏ
  cuộc.
- **Hàng chip dùng `.fl.cuon` (xuống dòng), không cuộn ngang.** Lề âm `-16px`
  của `.fl` bị mép bảng trượt cắt mất, chip thứ tư lòi ra ngoài và không ai
  kéo tới được. Bốn con số phải nhìn thấy cùng lúc thì mới biết còn bao nhiêu
  người chưa khai.

## Biểu đồ tiến độ thu — vân chéo là bắt buộc, không phải trang trí

`GET /api/funds/thong-ke` + nút "Xem tiến độ thu" ở tab Quỹ (thêm 26/8). Cột
chồng ba đoạn cho mỗi đợt, và chia theo nhóm khi đợt trải trên nhiều nhóm.
Trả lời đúng một câu hỏi của thủ quỹ lớp: **nhóm nào chậm nhất**. Dãy chấm ở
thẻ đợt thu đọc được với 14 người, với 134 người thì thành một hàng chấm vô
nghĩa.

**Ba đoạn, ba nghĩa, không được gộp**: người thu đã nhận (xanh `--go`) · mới
tự khai (cam `--due`) · chưa khai (xám). Không có con số nào tên "tỉ lệ đóng
quỹ" và không có nhãn "đã đóng" — mục 6.4 SRS. Phần trăm in ở góc phải là tỉ
lệ **người thu đã nhận**, tức tiền thật, không phải tổng hai đoạn đầu.

**Vân chéo trên đoạn cam gánh phần đọc, gỡ đi là hỏng.** Chạy trình kiểm bảng
màu của kỹ năng dataviz trên đúng ba màu đang dùng:

- xanh `#146450` ↔ cam `#A8500E`: **ΔE 7.7 với người mù màu đỏ (protan)**.
  Dưới 8 là dải sàn, chỉ hợp lệ khi CÓ mã hoá thứ hai. Vân chéo chính là mã
  hoá thứ hai ấy — `repeating-linear-gradient` 45° trong `.tk-b`.
- xám `#D2D3CE` so với nền: **tương phản 1.47**, dưới 3:1. Bắt buộc phải có
  nhãn số đọc được bằng chữ, nên mỗi cột kèm một dòng "N người thu đã nhận ·
  N mới tự khai · N chưa khai · trên N" chứ không bắt ai đoán độ dài đoạn.

Trình kiểm ghi rõ nó chỉ xét bảng màu phân loại, mà đây là bảng màu trạng
thái nên hai cảnh báo trên không phải lỗi — nhưng nghĩa vụ kèm theo thì vẫn
áp dụng nguyên vẹn. Đổi màu về sau thì chạy lại trình kiểm, đừng ngắm bằng mắt.

**Ai thấy gì** dùng CHUNG ma trận với sổ thu (`mucXemSo`): người thu và Ban
cán sự lớp thấy phần chia theo nhóm của cả đợt; trưởng/phó nhóm chỉ thấy nhóm
mình. Con số TỔNG của đợt thì ai trong đợt cũng thấy — dãy chấm ở thẻ đợt thu
vốn đã công khai nó, giấu ở đây chỉ đẻ ra hai nguồn sự thật lệch nhau.

Điều kiện chọn thành viên trong truy vấn (`is_active = 1` HOẶC đã khai đợt ấy)
phải **trùng khít** với sổ thu và phép đếm sĩ số. Lệch một chút là biểu đồ nói
khác cái sổ, và không chỗ nào báo lỗi.

## Tư liệu: sửa được, và vai cấp lớp đã có người

`PATCH /api/links/:id` (thêm 25/8) sửa `url`, `title`, `kind`, `tag`. **Cố ý
không cho đổi `scope`**: biến liên kết của nhóm thành của lớp là đem dữ liệu
nhóm cho 134 người xem (N6) — muốn đổi thì gỡ rồi đăng lại để nhật ký ghi rõ.
Cho phép **xoá trắng** `url` trở lại: thà trống còn hơn một đường dẫn hỏng.
Sửa và gỡ dùng CHUNG `layLienKetSuaDuoc()`, không tách hai bản sao.

**Ngô Phú Cường nay có vai `uy_vien` cấp lớp** (migration 0013) — mở khoá việc
đăng và sửa Tư liệu cấp lớp cùng thông báo cấp lớp. Chọn `uy_vien` vì đó là vai
thật ngoài đời và là vai thấp nhất đủ dùng: nó **không** mở quỹ lớp, vì
`isClassOfficer` chỉ nhận `lop_truong` / `lop_pho` / `thu_quy`.

Migration 0013 nạp thư mục Drive `CEO_VCCI` của Ban tổ chức: 3 thư mục theo
buổi (có đường dẫn thật, đọc từ thanh URL trong ảnh chụp) và 8 tệp bên trong
(chỉ có tên, chờ dán link). **Không dùng `UNION ALL`** — D1 từ chối từ 6 nhánh
trở lên khi chạy qua tệp, và **bản cục bộ cũng từ chối y hệt**, không chỉ D1
thật như đã ghi ở mục trên.

## Tư liệu gắn vào buổi học — một dòng, hai màn

Thêm 26/8 (migration 0014). Một cột `links.buoi_id` trỏ về `lich_hoc(id)` —
đúng khuôn mẫu đã có sẵn của `links.section_id`, không phải cách làm mới.

**CỐ Ý không nhân đôi dòng và không có bảng "shortcut".** Vẫn đúng một dòng
trong `links`; tab Lịch và tab Tư liệu đọc nó bằng hai truy vấn khác nhau. Sửa
ở màn nào cũng là sửa chính nó, gỡ ở màn nào cũng biến mất khỏi cả hai. Hai bản
ghi thì sớm muộn cũng lệch nhau mà không chỗ nào báo lỗi.

Trước đó `tag = 'buoi'` chỉ là nhãn rời: nói "đây là tài liệu buổi học" mà
không nói buổi NÀO. `tag` vẫn giữ cho thứ chung chung chưa gắn được vào buổi.

Bốn điều đã trả giá hoặc suýt trả giá:

1. **Đường công khai `/lich` CHỈ trả `so_tu_lieu`, không bao giờ tên hay URL**
   (Ngô Phú Cường quyết 26/8). Con số nói "có thứ đáng lấy" mà không đưa gì ra
   cho người ngoài lớp, và biến chính tài liệu thành lý do đăng nhập. Con số
   đếm **chỉ tư liệu của lớp**: tư liệu nhóm là dữ liệu nhóm (N6), và một con
   số đổi theo người xem thì vô nghĩa trên trang ai cũng thấy cùng một bản.
   Danh sách trả về dựng bằng cách LIỆT KÊ TỪNG TRƯỜNG, không trải cả dòng —
   thêm cột vào `lich_hoc` về sau sẽ không lặng lẽ lọt ra công khai.
2. **`/api/home` và `/api/lich` dùng CHUNG `layTuLieuTheoBuoi()`.** Tách hai
   bản là có ngày một bên lọc khác bên kia, và cùng một liên kết hiện ở màn này
   mà mất ở màn kia.
3. **`ORDER BY scope` (ASC, không DESC).** `'class' < 'group'` nên ASC là slide
   Ban tổ chức đứng trên, ghi chép riêng của nhóm xuống dưới. Viết DESC một lần
   rồi, và chỉ NHÌN ảnh chụp mới thấy — phép kiểm chuỗi không thấy.
4. **`oChonBuoi()` luôn chèn thêm dòng cho buổi đang gắn.** `/api/home` chỉ trả
   6 buổi SẮP TỚI, nên tư liệu gắn vào buổi đã qua sẽ không có trong danh sách:
   mở sheet sửa ra là ô nhảy về "Không gắn buổi nào", bấm Lưu một phát là tư
   liệu bị gỡ khỏi buổi mà không ai định làm thế.

Một bài học về chính bộ kiểm: lần đầu nó báo **"không lỗi JS: sạch" trên một
trang chưa hề nạp** (quên bật `[assets]` nên `/` trả JSON — trang không có JS
thì tất nhiên không có lỗi JS). Mọi bộ kiểm giao diện nay mở đầu bằng một phép
khẳng định rằng ứng dụng THẬT SỰ nạp được.

## Tư liệu dạng "Nội dung Text" — lệch có chủ ý thứ hai với N2

Thêm 5/9 (migration 0025). Ngô Phú Cường hỏi có đưa được nội dung dạng text
(render Markdown) trực tiếp vào ứng dụng không, sau khi phải rút gọn bản tóm
tắt bài giảng LEAN buổi 4/9 thành một dòng ghi_chu ngắn vì lúc đó chưa có chỗ
nào chứa được cả bài. Trả lời: được, và đã làm — nút "Gắn Tư liệu" nay có hai
chế độ, **Đường dẫn** (như trước nay) và **Nội dung Text** (mới), chọn bằng
một cặp nút bấm ngay đầu sheet.

**Vì sao đây KHÔNG mâu thuẫn với N2** ("ứng dụng không giữ file, chỉ lưu URL,
không upload", đã cân nhắc và giữ nguyên hai lần, 24/8 và 26/8): lý do N2 được
lập ra là **không tự ý phát tán tài sản của người khác** — slide giảng viên,
tài liệu Ban tổ chức chia sẻ có điều kiện. Ghi chú Text ở đây là văn bản
**người trong lớp tự gõ** (tóm tắt bài giảng, ghi chép riêng), không phải bản
sao của ai. N2 vẫn đứng nguyên cho đúng việc nó bảo vệ: không upload file,
không giữ bản sao slide/PDF/ảnh — mục "Đường dẫn" không đổi gì cả.

### Cột và luồng dữ liệu

Một cột `links.content_md` (TEXT, để trống ở mọi dòng cũ). `kind='TEXT'` phân
biệt với năm loại URL cũ (DRIVE|SHEET|DOCX|PDF|WEB|XLSX): khi đó `url` để
NULL, `content_md` có giá trị — và ngược lại cho mọi loại còn lại, `postLink`/
`patchLink` giữ hai nhánh loại trừ nhau. Giới hạn **8.000 ký tự**, kiểm ở tầng
ứng dụng (`NOI_DUNG_MAX` trong `routes/links.js`) vì SQLite TEXT không khai
báo độ dài trong DDL — `cleanText()` cắt bớt phần dư, không báo lỗi.

**Hai chỗ đã có từ trước PHẢI sửa kèm, không thì tính năng "chạy" nhưng một
màn vẫn sai — cả hai đều không tự báo lỗi:**

1. `docLichCongKhai()` trong `routes/lich.js` đếm `so_tu_lieu` bằng
   `url IS NOT NULL`. Một ghi chú Text của lớp gắn vào buổi thì `url` là NULL,
   nên con số công khai báo "chưa có gì" trong khi rõ ràng có — sửa thành
   `url IS NOT NULL OR content_md IS NOT NULL`.
2. `layTuLieuTheoBuoi()` (dùng CHUNG cho `/api/home` và `/api/lich`, đúng
   khuôn "một dòng, hai màn" ở mục trên) liệt kê từng trường trong SELECT chứ
   không `SELECT *` — quên thêm `content_md` vào danh sách ấy thì Hôm nay hiện
   đúng tên ghi chú nhưng bấm vào không có gì để hiện.

### mdSafe() — ESC TRƯỚC, PARSE SAU

Hàm render Markdown nằm trong `public/app.js` (không thêm thư viện, đúng mục
8 SRS — cùng tinh thần tự viết ZIP+OOXML cho xuất Word). Nguyên tắc AN TOÀN
duy nhất cần nhớ: **`esc()` toàn bộ văn bản gốc TRƯỚC, rồi mới nhận diện cú
pháp markdown trên phần đã esc**. Một `<script>` gõ vào ghi chú thành
`&lt;script&gt;` — trơ lì — trước khi bất kỳ quy tắc `#`/`**`/`-`/`[]()` nào
chạy, nên các quy tắc ấy chỉ cần lo đúng cú pháp, không cần lo thoát ký tự nữa.
Làm ngược lại (parse rồi esc phần còn lại) mới là chỗ dễ hở, vì dễ quên một
nhánh — đây là bài học đã ghi cho `esc()` ở quy ước kỹ thuật mục 2, áp dụng
lại nguyên vẹn cho một hàm mới.

Ngoại lệ DUY NHẤT chèn lại một thuộc tính HTML (href) là cú pháp link
`[chữ](url)`: bắt buộc url khớp đúng `https://…`, đúng luật đang dùng cho mọi
URL khác trong ứng dụng. `javascript:`/`data:` đơn giản là không khớp cú pháp
link, giữ nguyên chữ thô — không có nhánh nào xử lý riêng, nên không có gì để
quên xử lý.

CỐ Ý KHÔNG hỗ trợ ảnh, bảng, `` ```code``` ``, tiêu đề lồng trong danh sách:
phạm vi chỉ cần đủ cho một ghi chú bài giảng. Ảnh đặc biệt bị bỏ có chủ ý —
`![alt](url)` sẽ mở lại đúng câu hỏi "ứng dụng có nên nhúng ảnh từ nguồn ngoài
không", một quyết định khác chưa ai hỏi.

**Bộ kiểm `pw-tulieu-text.mjs`** là bộ kiểm đáng giá nhất của tính năng này —
tương đương vai trò của `kiem-danhba.mjs` cho việc che số điện thoại. Phải
chạy bằng trình duyệt thật vì `mdSafe()` sống trong `app.js`, không cách nào
gọi từ Node thuần. Bốn ca độc (thẻ `<script>`, `onerror` qua `<img>`, link
`javascript:`, chèn thuộc tính qua chữ trong `[chữ](url)`) đều phải: (a) không
cho một biến đánh dấu chạy được, và (b) chuỗi độc vẫn còn nguyên trong
`.textContent` — chứng minh nó bị VÔ HIỆU HOÁ chứ không phải bị ÂM THẦM XOÁ
MẤT, vì một hàm chỉ biết `.replace(/<[^>]*>/g,'')` cũng "an toàn" theo nghĩa
không chạy mã, nhưng xoá luôn nội dung hợp lệ có dấu `< >` — `mdSafe()` không
được phép làm vậy. Kèm bốn ca THUẬN (`#`, `**`, `-`, link https hợp lệ) để
chắc các quy tắc chặn XSS không vô tình chặn luôn markdown đúng.

`kiem-tulieu-text.mjs` (không cần trình duyệt) kiểm phần máy chủ: tạo TEXT
không cần url nhưng bắt buộc content_md, hai chỗ sửa kèm ở trên, và giới hạn
8.000 ký tự.

### Bẫy thứ ba: ô chọn buổi không thấy buổi ĐÃ QUA

Phát hiện ngay hôm sau khi tính năng lên thật (5/9) — Ngô Phú Cường thử gắn
ghi chú LEAN vào đúng buổi 4/9 và báo "không gán được vì thiếu dữ liệu buổi".
Đây chính xác là đúng loại việc "Nội dung Text" sinh ra để làm — tóm tắt MỘT
BUỔI ĐÃ HỌC XONG — mà lại là trường hợp `oChonBuoi()` chưa từng xử lý đúng.

`oChonBuoi()` đọc `HOME.lich_hoc`, mà `/api/home` chỉ trả **6 buổi SẮP TỚI**.
Bẫy cũ ("`oChonBuoi()` luôn chèn thêm dòng cho buổi đang gắn", mục "Tư liệu
gắn vào buổi học" ở trên) chỉ cứu được màn SỬA một tư liệu đã gắn sẵn — không
cứu được màn TẠO MỚI, vì lúc đó chưa có `buoi_id` nào để chèn bù. Ngày 4/9 vừa
qua khỏi "hôm nay" (5/9) là lập tức rơi khỏi danh sách, và người dùng nhìn
thấy ô chọn thiếu đúng buổi mình cần mà không có lời giải thích nào.

Sửa bằng cách đổi nguồn dữ liệu: `oChonBuoi()` nay nhận thẳng danh sách ĐẦY ĐỦ
(hàm mới `layLichDayDu()`, gọi `GET /api/lich` — vốn đã trả toàn bộ 13 buổi
không lọc ngày, chỉ là trước nay không route nào trong giao diện gọi tới nó)
thay vì đọc `HOME.lich_hoc`. `openLinkAdd()`/`openLinkEdit()` phải chuyển
thành `async` để `await` được danh sách này trước khi dựng sheet. Không cache:
13 dòng một chỉ mục, rẻ hơn hẳn việc phải nhớ làm mới cache khi lịch đổi.

Kèm luôn theo dữ liệu thật: **migration 0026** dán nguyên văn bản tóm tắt LEAN
của Ngô Phú Cường vào đúng buổi 4/9 (`scope='class'` vì đây là bài giảng
chung cả khoá, không phải ghi chép riêng Nhóm 6) — để khỏi bắt gõ lại một khối
dán tay trên điện thoại sau khi vá xong.

`pw-tulieu-text.mjs` có thêm một phép đối chứng cho đúng bẫy này: ô chọn buổi
trong sheet "Gắn Tư liệu" phải liệt kê được một buổi ĐÃ QUA (4/9), không chỉ
buổi trong 6 ngày sắp tới.

## Tư liệu gắn vào PHẦN BÀI — mắt xích còn thiếu của bộ ba Hôm nay/Bài/Tư liệu

Thêm 5/9. Ngô Phú Cường hỏi thẳng: "Lịch, buổi học phải liên thông tư liệu với
nhau từ menu 'Hôm nay', 'Bài' và 'Tư liệu' phải không?" Tra ra Hôm nay↔Tư liệu
(qua `buoi_id`, mục trên) đã nối đủ, nhưng Bài↔Tư liệu thì KHÔNG: cột
`links.section_id` có từ migration 0001 — cũ hơn cả tính năng buổi học — nhưng
chưa từng được dùng. `postLink` ghi cứng `NULL`, `patchLink` không nhận
trường này, `getPlan()` không JOIN nó, và huy hiệu tư liệu ở tab Bài không tồn
tại. Cột nằm sẵn trong DDL từ đầu không có nghĩa là tính năng đã xong — đây là
bài học ngược lại của mọi "lệch có chủ ý" đã ghi trong tệp này.

**Vì sao KHÔNG thể copy nguyên khuôn buổi học sang đây:** `lich_hoc` dùng
CHUNG cho cả khoá — một `id` nghĩa là cùng một buổi với tất cả mọi người. Còn
`plan_sections` (phần bài) thì mỗi nhóm giữ một bộ TÁM DÒNG RIÊNG (qua
`plan_id → plans.group_id`): "Phần 1" của Nhóm 6 và "Phần 1" của Nhóm 7 là hai
dòng khác nhau trong D1. Vì vậy chốt chặn N6 ở đây không chỉ kiểm "phần này có
thật" mà còn phải kiểm "phần này thuộc ĐÚNG NHÓM của người gọi" —
`docSectionId()` (`routes/links.js`) làm việc đó bằng một JOIN
`plan_sections ps JOIN plans p ON p.id = ps.plan_id WHERE ps.id = ? AND
p.group_id = ?`. Thiếu điều kiện `p.group_id` thì Nhóm 6 gắn thẳng được tư
liệu vào Phần 1 của Nhóm 7 — vỡ N6 ngay ở khâu ghi, không đợi tới khâu đọc.

Một hệ quả tự nhiên của ranh giới nhóm này: **không có khái niệm "tư liệu cấp
lớp gắn vào một phần bài cụ thể".** `section_id` luôn trỏ về đúng một dòng của
MỘT nhóm, nên dù người đăng chọn phạm vi "Cả lớp", tư liệu ấy vẫn chỉ hiện
trong tab Bài của CHÍNH nhóm người đăng (vì `getPlan()` chỉ JOIN theo
`plan.id` của người xem) — các nhóm khác chỉ thấy nó ở tab Tư liệu chung, dưới
nhãn "Phần N · <tên phần>" (tên phần là nhãn mẫu dùng chung cho cả 10 nhóm,
không phải nội dung riêng của nhóm nào). Không chặn tổ hợp này: nó không lộ gì
nhạy cảm (tiêu đề phần là nhãn mẫu, nội dung là thứ người đăng đã chủ động chọn
công khai), và việc chặn thêm là một lớp phức tạp không ai cần tới.

Bốn chỗ đã sửa để khớp đúng khuôn "một dòng, hai/ba màn":

1. **`docSectionId()`** (`routes/links.js`, cạnh `docBuoiId()` đã có) — validate
   và chuẩn hoá `section_id` từ thân request, dùng chung cho cả `postLink` và
   `patchLink`, đúng khuôn `docBuoiId()`.
2. **`getPlan()`** (`routes/plan.js`) thêm một truy vấn `JOIN plan_sections ON
   ps.id = l.section_id WHERE ps.plan_id = ?` rồi gắn `tu_lieu` vào từng phần
   trả về — same pattern với `layTuLieuTheoBuoi()` nhưng không dùng chung hàm
   vì `getPlan` đã lọc theo `me.group_id` từ đầu, không cần lọc lại.
3. **`listLinks()`** (`routes/links.js`) thêm `LEFT JOIN plan_sections` vào
   `CHON`, trả kèm `section_ord`/`section_title` — dùng cho nhãn ở tab Tư liệu.
4. **Giao diện** (`public/app.js`): `veTuLieuBuoi()` → `veTuLieuGan()` và
   `nhanBuoi()` → `nhanGan()`, tổng quát hoá để dùng chung cho cả buổi lẫn
   phần (hai hàm này vốn đã chỉ đọc `.tu_lieu`/`.buoi_id`+`.section_id`, không
   cần viết hàm riêng). `oChonPhan()` là bản sinh đôi của `oChonBuoi()`, cùng
   giữ thói quen "chèn thêm dòng cho phần đang gắn nếu nó rơi khỏi danh sách
   vừa tải" để sheet sửa không bao giờ tự nhảy về "Không gắn phần nào" khi Lưu.
   Tab Bài (`drawBai`) hiện huy hiệu "📎 N tư liệu" trên mỗi phần có gắn; sheet
   sửa một phần (`openSectionEdit`) có nút "+ Gắn tư liệu cho phần này", gọi
   `openLinkAdd(sectionId)` — tham số mới `preSection` khiến sheet mở lên đã
   tự chọn sẵn tag='bai' và đúng phần đang xem, khỏi bắt chọn lại. Tab Tư liệu
   (`veTuLieuTheoBuoi`) thêm cụm riêng "Theo phần bài" — không dồn vào "Chưa
   gắn buổi học" vì các dòng ấy CÓ gắn, chỉ là gắn vào phần chứ không phải
   buổi, và nhãn "chưa gắn" cho một dòng đã gắn là sai.

`kiem-tulieu-bai.mjs` (API) và `pw-tulieu-bai.mjs` (giao diện, kể cả bấm nút
"+ Gắn tư liệu cho phần này" từ trong sheet phần bài) là hai bộ kiểm giữ đúng
chốt N6 và khuôn "một dòng, nhiều màn" này. `reset-tulieu-bai.sh` seed thêm
một `plan_sections` của MỘT NHÓM KHÁC (Nhóm 7) — thứ D1 cục bộ mới nạp không
có sẵn (chỉ Nhóm 6 được seed từ migration 0003, các nhóm khác chỉ có phần bài
sau khi chạy wizard) — vì phép kiểm N6 quan trọng nhất của tính năng này cần
một `section_id` THẬT của nhóm khác để chứng minh bị chặn, không phải một id
bịa ra (id bịa chỉ chứng minh nhánh "not found", không chứng minh nhánh
"đúng nhóm").

## Vai nhóm: ba, không phải hai

`truong_nhom` · `pho_nhom` · **`tieu_bieu`** ("thành viên tiêu biểu", thêm
25/8). Vai thứ ba **quyền ngang phó nhóm** — nó đi thẳng vào `isGroupOfficer`
nên làm được đúng mọi việc phó nhóm làm được: tạo đợt thu, mở sổ, thêm người,
cho ngừng tham gia, sửa cơ cấu, đăng thông báo, chia phần bài.

Danh sách vai nằm ở **bốn** chỗ, sửa một mà quên ba là hỏng ngầm — lần thêm
`tieu_bieu` đã vấp đúng chỗ thứ tư:

| Tệp | Việc |
|---|---|
| `permissions.js` `isGroupOfficer` | quyết định QUYỀN |
| `routes/officers.js` `getOfficers` | danh sách cho màn cơ cấu |
| `routes/officers.js` chốt chặn | không cho bỏ trống hết |
| `routes/home.js` | **chỗ dễ quên nhất** — `/api/home` dựng danh sách riêng |

Quên `home.js` thì quyền chạy đủ nhưng màn Hôm nay không hiện vai mới, và
`iAmOfficer()` ở giao diện trả sai → nút bấm biến mất dù máy chủ vẫn cho phép.

Chốt chặn "không bỏ trống hết" nay **đếm số vai còn người**, không so đôi một
như hồi hai vai — so đôi một với ba vai sẽ cho phép bỏ trống cả ba mà vẫn lọt.

## Sổ tay hướng dẫn — ba bản, một bản thảo

Bản thảo gốc là `so-tay.tpl.html` **ở thư mục scratchpad của phiên**, kèm 17
ảnh trong `anh-nen/`. Từ đó dựng ra ba bản:

| Bản | Ở đâu | Để làm gì |
|---|---|---|
| Tên miền | `public/sotay/` → `k3vaceo.cuongngo.app/sotay` | đưa cho cả lớp |
| Tệp rời | `So-tay-k3vaceo.html` 1,2 MB, ảnh nhúng base64 | gửi Zalo, đọc không cần mạng |
| Word | `So-tay-k3vaceo.docx` | in ra giấy |

**Chỉ bản tên miền nằm trong repo.** Bản thảo và ba script dựng ở scratchpad,
phiên mới là mất. Muốn sửa sổ tay thì sửa thẳng `public/sotay/index.html` —
HTML thường, CSS và JS để rời, đọc được và sửa được.

Ba điều đã trả giá để biết, đừng vấp lại:

- `public/_headers` đặt CSP `script-src 'self'` → **script nội dòng bị chặn
  thẳng**. Bản cho tên miền bắt buộc để CSS/JS ra tệp riêng, không thì mục lục
  chết mà không báo gì.
- Ảnh phải khai `width`/`height` hoặc `aspect-ratio`. Có `loading="lazy"` mà
  không chừa sẵn chỗ thì mỗi ảnh hiện ra lại đẩy nội dung nhảy xuống — đọc
  trên điện thoại giật liên tục.
- `_redirects` **không cần** luật riêng cho `/sotay`: Pages tự chuyển `/sotay`
  sang `/sotay/` bằng 308 TRƯỚC khi đọc `_redirects`, nên luật vét `/*` không
  nuốt mất. Đo bằng `npx wrangler pages dev ../public` chứ không phải suy đoán.

Số tài khoản trong ảnh mã QR **đã che bằng khối đặc** ở cả ba bản (Ngô Phú
Cường quyết ngày 25/8, sau khi được nêu rõ trang tên miền ai có đường dẫn cũng
mở được). Che bằng khối đặc chứ không làm mờ — ảnh mờ về lý thuyết còn dò
ngược được. Ảnh gốc chưa che nằm ở `anh/07-*.png` trong scratchpad, không phát
tán. `deploy.yml` có sẵn phép kiểm `/sotay` trên tên miền thật.

## Việc còn treo, cần người dùng quyết hoặc cung cấp

- **ĐÃ CHẠY THẬT trên https://k3vaceo.cuongngo.app (23/8).** Toàn bộ deploy đi
  qua GitHub Actions, không dùng Git integration của dashboard. Kiểm chứng bằng
  chính workflow, không phải đọc code:
  - `/api/health` → `{"ok":true,"roster_total":134,"groups_total":10,
    "group6_members":14,"group6_truong_nhom":"Ngô Phú Cường"}`
  - `/` → giao diện từ Pages; `/nhom` → 200 (luật `_redirects` ăn)
  - `/api/<đường dẫn lạ>` → JSON của Worker, chứng tỏ route phủ hết `/api/*`
  - Kiến trúc "Pages phục vụ giao diện + Worker Route cướp `/api/*` trên cùng
    một hostname" **đã được chứng minh chạy được**, không còn là giả định.
  - DNS: CNAME `k3vaceo.cuongngo.app` → `k3vaceo.pages.dev` (proxied). Bản ghi
    A `192.0.2.1` cũ đã xoá.
- **Điểm gợn duy nhất còn lại**: API token thiếu **Zone → Workers Routes →
  Edit** cho zone `cuongngo.app`, nên `wrangler deploy` đỏ ở bước hoà hợp
  route (`Authentication error [code: 10000]`) — dù mã Worker vẫn tải lên
  xong và route hiện có vẫn chạy. Hệ quả thật: **sửa `pattern` route trong
  `wrangler.toml` sẽ không có tác dụng** cho tới khi thêm quyền này. Workflow
  chỉ cảnh báo chứ không đánh hỏng job.
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
- **GỬI THƯ: ĐÃ CHẠY — qua Resend, xác nhận bằng hộp thư thật ngày 24/8.**
  Ngô Phú Cường nhận được thư mã 6 số tại `ngophucuong@gmail.com`. Đây là bằng
  chứng cuối cùng và là loại bằng chứng duy nhất đáng tin cho việc gửi thư:
  thư nằm trong hộp thư, không phải một dòng log nói rằng nó đã đi.

  Cấu hình đang chạy:
  - Đường gửi: **Resend** (API HTTP), địa chỉ gửi `info@cuongngo.cloud`.
  - Điều kiện đủ: tên miền `cuongngo.cloud` phải **verified** bên Resend. Thêm
    tên miền trong bảng điều khiển là CHƯA đủ — phải thêm ba bản ghi DNS họ đưa
    (DNS của tên miền này ở Hostinger) rồi bấm Verify. Chừng nào chưa verified,
    Resend trả 403 `domain is not verified` và không một lá thư nào đi được.
  - `/api/health` báo `mailer: resend` khi đang đi đường này.

  **SMTP tự viết từ Worker là ngõ cụt, giữ làm bánh xe dự phòng thôi.**
  Đo thật ngày 24/8, lượt 20 của `kiem-tra-email.yml`:

  ```
  Resend: HTTP 403 "The cuongngo.cloud domain is not verified"
  | SMTP:  mở kết nối tới <host>:<port> (tls)
  ```

  Vế SMTP là bằng chứng dứt điểm: `socket.opened` KHÔNG bao giờ giải quyết,
  tức Worker **không mở nổi kết nối TLS tới smtp.hostinger.com:465**. Không
  phải sai mật khẩu, không phải máy chủ từ chối thư — kết nối chưa từng dựng
  được. Đổi sang máy chủ SMTP khác (Gmail chẳng hạn) rất có thể vấp y hệt, và
  phải trả giá bằng một mật khẩu ứng dụng nằm trong bí mật của Worker.

  Ba niềm tin sai đã bị bác bỏ trong ngày, ghi lại để đừng tin lại:
  1. *"Log sạch nghĩa là gửi được."* Sai — `wrangler tail` im lặng suốt ngày,
     nhiều khả năng API token thiếu quyền Workers Tail. Đọc một cái đồng hồ
     chết. Mọi kết luận dựa trên nó đều vô giá trị, kể cả câu "lượt 4 đã bắt
     tay TLS thành công" từng ghi ở đây.
  2. *"`ctx.waitUntil` bị cắt giữa chừng là gốc rễ."* Đã bỏ waitUntil, chờ gửi
     xong mới trả lời — vẫn hỏng. Không phải gốc.
  3. *"Thư sai khuôn nên Gmail vứt."* Message-ID, quoted-printable, EHLO đúng
     tên miền — sửa cả ba, vẫn hỏng, vì thư chưa bao giờ rời khỏi Worker.

  Cách bắt lỗi nói thật, đừng gỡ đi:
  - `connect()` của Workers TRẢ VỀ NGAY, kết nối dựng sau. **Phải `await
    socket.opened`**, không thì lỗi mạng nổi lên ở lần `read()` đầu dưới dạng
    `"Stream was cancelled."` — một câu không cho biết gì. Mất một lượt chạy
    thật vì câu ấy.
  - Lỗi gửi thư mang theo `.buoc`, và ba chỗ trả 502 kèm `hong_o_buoc`. Đây là
    đường duy nhất đọc được sự thật khi log Worker câm.
  - `sendMail` thử Resend trước, hỏng thì lùi về SMTP; cả hai hỏng thì câu lỗi
    ghi cả hai vế. Giữ nhánh SMTP làm bánh xe dự phòng, không phải đường chính.

  Nếu về sau muốn đổi địa chỉ gửi sang `noreply@cuongngo.app`: phải xác minh
  thêm zone `cuongngo.app` bên Resend (zone này nằm trong Cloudflare nên thêm
  bản ghi dễ hơn). Không bắt buộc — bản hiện tại đã chạy.

  Cấu hình đã có (giữ nguyên, không mất khi deploy):
  - **Hai bộ tên đều dùng được**: `SMTP_USER`/`SMTP_PASS`/`MAIL_FROM` hoặc
    `SMTP_USERNAME`/`SMTP_PASSWORD`/`SMTP_FROM_EMAIL`. Đặt nhầm bộ cho triệu
    chứng y hệt như chưa đặt gì — 503 — nên rất khó đoán.
  - `wrangler deploy` ghi đè toàn bộ `vars` bằng đúng những gì có trong
    `wrangler.toml` (hiện chỉ `RP_ID`), nên **biến dạng plaintext đặt trên
    dashboard bị xoá sạch sau mỗi lần deploy**. Chỉ *Secret* (đã mã hoá) mới
    sống sót. Đặt bí mật SMTP dưới dạng Variable là mất.
  - **Cách chắc chắn nhất**: đặt giá trị vào GitHub Secrets, `deploy.yml` có
    sẵn bước đồng bộ sang Worker ở mỗi lần deploy — không bao giờ mất nữa.
  - Thử lại bằng `.github/workflows/kiem-tra-email.yml`: nó đổi email, tự dọn
    hạn mức của địa chỉ ấy, gọi thật, và in `hong_o_buoc` nổi bật.
  - **Phép đối chứng đã có**: thư gửi thẳng từ máy chủ GitHub bằng cùng tài
    khoản Hostinger thì TỚI hộp thư. Nên Hostinger và Gmail đều bình thường;
    chỗ hỏng nằm đúng ở đoạn Worker → cổng 465.
- **Email của Ngô Phú Cường nay là `ngophucuong@gmail.com`** (đổi 24/8, đã đọc
  lại từ D1 thật để xác nhận).
- **Ảnh QR chưa hiển thị thật lần nào** (sandbox không có mạng). Tiêu chí
  nghiệm thu "QR quét được bằng ba app ngân hàng" phải làm bằng điện thoại thật.
- **Danh mục 26 mã ngân hàng** trong `lib/vietqr.js` chép theo bộ BIN Napas
  nhưng chưa đối chiếu được với nguồn công bố.
- **Passkey chưa thử trên iPhone/Android thật** — cần domain thật vì rp.id.
- **Quỹ lớp chưa tạo được**: chưa ai giữ vai cấp lớp trong dữ liệu (mục 11
  điểm #6 SRS còn để ngỏ). Quyền đã viết sẵn, thêm dòng `officers` với
  `group_id IS NULL` là chạy.
- **Bảy buổi đã học được thêm vào lịch**, tính theo DÒNG `lich_hoc` (28/8 và 5/9
  mỗi ngày chia hai-ba dòng vì nhiều chủ đề, nên "buổi" ở đây là buổi giảng chứ
  không phải ngày lịch): 15/8, 21/8, 22/8 (migration 0016), 4/9 và 5/9 (migration
  0017), rồi 5/9 CHỐT LẠI đè lên bản tạm (migration 0019) — cả ba đều do Ngô Phú
  Cường dán lại từ thông báo Zalo của Ban tổ chức. `13 - 11 = 2`: lịch còn thiếu
  đúng 2 buổi nữa.

  **5/9 đổi CẢ chủ đề lẫn giảng viên, không chỉ thêm giờ** — dấu vết đáng nhớ
  nhất trong đợt này. Bản tạm (migration 0017/0018) ghi GV Tuấn Hà, chủ đề
  Marketing gộp một dòng vì thông báo đầu không có giờ. Bản CHỐT (migration
  0019) là GV Hà Thu Thanh hoàn toàn khác, tách buổi sáng/chiều với hai chuyên
  đề khác hẳn. Migration 0019 SỬA TẠI CHỖ (UPDATE) dòng cũ thay vì xoá-tạo-lại,
  giữ nguyên `id` để tư liệu lỡ gắn vào buổi này không treo tham chiếu — và chỉ
  đụng dòng khi `chu_de` VẪN LÀ bản tạm, để không đè lên sửa tay của Ban cán sự
  lớp nếu có.

  Nguyên tắc xuyên suốt cả ba migration: **thiếu thông tin thì để trống, đừng
  bịa** (Ngô Phú Cường xác nhận rõ ràng). Không giờ cụ thể cho 4/9, chỉ ghi
  "Buổi sáng"/"Buổi chiều" cho 5/9 chứ không suy ra khung giờ — bịa giờ ra thì
  tệp `.ics` ghi sai cho lịch điện thoại của 134 người.

  Chủ đề ba buổi đầu (15/8–22/8) ĐỌC TỪ TÊN THƯ MỤC Drive, còn 4/9 và 5/9 đọc
  thẳng từ nguyên văn thông báo; "Thái Hoà" của buổi 22/8 là suy ra từ khuôn
  tên — sai thì Ban cán sự lớp bấm ✎ sửa được, không cần migration. Nhờ ba buổi
  đầu, 12 tư liệu của migration 0013 gắn được vào đúng buổi và hết cảnh nằm rải
  rác ở tab Tư liệu.
- **Tư liệu của lớp có 12 mục còn trống `url`** — 4 mục seed từ Đợt 1 và 8 tệp
  của thư mục Drive `CEO_VCCI`. Nay điền được bằng nút ✎ ngay trong ứng dụng
  (`PATCH /api/links/:id`, thêm 25/8); trước đó tạo mục với url trống là trống
  vĩnh viễn, chỉ còn cách xoá đi tạo lại.
- **Số điện thoại Lê Trung Đức** trong roster là `098778525`, thiếu 1 số. Giữ
  nguyên trong `roster`, không đưa vào `members`. Cần hỏi lại.

## Danh bạ lớp — và vì sao số bị che

Thêm 28/8. Tab "Nhóm" đổi tên thành **Danh bạ**, bên trong hai thẻ: **Nhóm**
(nội dung cũ, không đổi) và **Cả lớp** (134 người). `GET /api/danh-ba`.

Mã trong nguồn vẫn là `nhom`, y như `kho` của Tư liệu — đổi id là vỡ đường dẫn
`#/nhom` mà cả lớp có thể đã lưu.

**Thẻ mặc định là Nhóm, chip "Nhóm" đứng trước.** Đó là chỗ có nút bấm (sửa hồ
sơ, phát link mời, thêm người, cho ngừng tham gia); danh bạ lớp chỉ để đọc. Đặt
mặc định ở thẻ mới thì mọi thao tác quen thuộc lùi sau một cú chạm.

**Thẻ đang mở giữ NGOÀI hàm vẽ** (`DANHBA_THE`) — cùng bài học với bộ lọc Sổ
thu: sửa hồ sơ xong màn vẽ lại, thẻ nằm trong hàm thì nó nhảy về Nhóm và người
đang đọc danh bạ bị đá ra.

### Che số điện thoại: chưa đăng nhập thì che

Đây là chỗ nghiêm túc nhất của cả tính năng. Số điện thoại là **bí mật duy nhất
giữ cửa `/api/onboard/vao`**, và cửa ấy chỉ mở được hồ sơ chưa ai nhận. Bày số
của người chưa đăng nhập ra cho cả lớp là trao chìa khoá vào hồ sơ của chính họ
— ai cũng nhận được chỗ của họ, kể cả chỗ của một trưởng nhóm (mở sổ thu, tạo
đợt thu, cho người khác ngừng tham gia).

Luật: **chưa đăng nhập thì che, đăng nhập rồi thì hiện đủ.** Nhận hồ sơ xong là
cửa `/vao` đóng vĩnh viễn, nên số thôi là chìa khoá.

`lib/che.js`: `0979755857` → `097****857`, email dùng chung hàm `cheEmail()` đã
có (`ng•••••••@gmail.com`). Hàm ấy trước nằm hai bản — một trong `onboard.js`,
một viết bằng regex nội dòng trong `home.js` — nay gộp về một chỗ.

**CHE Ở MÁY CHỦ, KHÔNG CHE Ở GIAO DIỆN.** Gửi số thật xuống rồi lấy CSS hay
JavaScript che đi thì mở tab Network là đọc nguyên vẹn. Phép kiểm đáng giữ nhất
của tính năng này là **grep số thật trong phúc đáp JSON** — số của người chưa
đăng nhập phải KHÔNG có mặt, và số của người đã đăng nhập phải CÓ.

**Con số phải nói thẳng:** che kiểu này giấu 4 chữ số, tức 10^4 khả năng. Với
hạn mức 8 lần đoán sai mỗi hồ sơ mỗi giờ thì dò cạn mất **khoảng 52 ngày** —
dài hơn phần còn lại của khoá học, nhưng KHÔNG phải là không thể. Muốn chặt hơn
thì đổi `SO_CUOI` trong `lib/che.js` từ 3 xuống 2: giấu 5 chữ số thành 10^5,
tức hơn 500 ngày, mà nhìn vẫn nhận ra đúng người.

### Bốn điều cố ý khác

1. ~~Không có bốn dòng hồ sơ (bán gì / bán cho ai / cần gì / giúp được gì)
   trong danh bạ lớp~~ — **đã mở ra cả lớp ngày 5/9**, xem mục riêng ngay dưới
   đây. Giữ hai dòng gạch này làm dấu vết: đây từng là quyết định cố ý, không
   phải một chỗ quên.
2. **Số đã che KHÔNG bọc trong `tel:`** — bấm vào là gọi một số không có thật,
   và nó gợi ý sai rằng số ấy dùng được.
3. **Người đã ngừng tham gia rụng khỏi danh bạ** bằng điều kiện `is_active = 1`
   đặt trong phép JOIN chứ không ở WHERE: để ở WHERE thì dòng `roster` của họ
   bị loại luôn và họ biến mất cả tên.
4. **Dòng chức vụ/đơn vị xuống hai dòng ở thẻ Cả lớp**, khác thẻ Nhóm. Lớp này
   có hàng chục người cùng làm ở "Công ty Cổ phần Hữu Nghị…", nên cắt một dòng
   là năm dòng liền giống hệt nhau và danh bạ mất đúng việc nó sinh ra để làm.
   Chỉ ảnh chụp mới thấy — phép kiểm chuỗi không thấy.

**Chưa làm, đã nêu và người dùng chọn cách khác:** cho chính chủ bật/tắt việc
hiện số của mình (opt-in). Luật hiện tại đơn giản hơn — đăng nhập rồi là hiện.
Bao giờ có người phàn nàn thì đó là chỗ sửa.

### Bốn dòng hồ sơ (bán gì / bán cho ai / cần gì / giúp được gì) mở ra cả lớp (5/9)

Ngô Phú Cường yêu cầu: "Mọi người trong lớp xem được thông tin cần mua, bán,…
của những người đã đăng nhập trong lớp." Đúng thứ mục trên từng gọi là "thứ
đáng giá thật với lớp CEO" — 134 chủ doanh nghiệp, và mạng lưới mới là cái còn
lại sau khi khoá kết thúc 26/9.

**Không phải chuyện N6.** Bốn dòng này là dữ liệu CÁ NHÂN về nhu cầu kinh
doanh của TỪNG NGƯỜI — không phải việc của nhóm (không sổ thu, không bài,
không thông báo nội bộ) — nên mở ra cả lớp đúng phân định đã dùng cho toàn bộ
Danh bạ từ 28/8, không phải một ngoại lệ mới cần bàn lại.

**Chỉ hiện cho người ĐÃ ĐĂNG NHẬP** — đúng nguyên văn yêu cầu, và cũng là lý do
mục trên từng chặn tính năng này lại: người chưa đăng nhập chưa có cách nào
điền được bốn ô này, hiện ra chỉ thấy một khối "chưa điền" cho gần một trăm
người, đúng cảnh CLAUDE.md từng cảnh báo. `getDanhBa()` (`routes/danh-ba.js`)
`LEFT JOIN member_profile` rồi gán `null` ở SERVER cho người chưa đăng nhập —
đúng quy ước 6 (không tin giao diện), và trùng khuôn `phone`/`email` đã che
theo `da_dang_nhap` ngay bên trên nó trong cùng hàm.

Giao diện (`veDongDanhBa`, `public/app.js`) hiện bốn dòng này trong panel mở
rộng của thẻ Cả lớp, **CÙNG nhãn** đã dùng ở thẻ Nhóm ("Bán gì", "Bán cho ai",
"Cần gì ở nhóm", "Giúp được gì") — cùng một cột dữ liệu (`member_profile`),
không viết hai bộ câu chữ cho cùng một thứ. Chỉ vẽ khối này khi
`p.da_dang_nhap`, khớp đúng điều kiện máy chủ đã gán `null`.

## Link mời xuyên nhóm — Ban cán sự lớp mới có

Thêm 3/9. Ngô Phú Cường (uỷ viên) cần phát link mời cho người CHƯA đăng nhập ở
BẤT KỲ nhóm nào, không chỉ Nhóm 6 của mình. Trước đó việc này khoá cứng vào
`canManageGroup(me, me.group_id)` — chỉ trưởng/phó của CHÍNH nhóm đó mời được
người trong nhóm đó.

`POST /api/danh-ba/:roster_id/moi` — nằm ở `routes/danh-ba.js`, không phải
`routes/wizard.js`. Nhận `roster_id` chứ không phải `member_id`: người chưa
đăng nhập có thể còn chưa có dòng `members` nào (73/134 người, tính lúc viết
mục này). Route tự tạo hồ sơ nếu chưa có — đúng NHÓM ghi trong danh sách gốc
của NGƯỜI NHẬN, không phải nhóm của người phát link — rồi cấp link mời.

**Cố ý KHÔNG đụng `canManageGroup`.** Hàm đó còn gác cơ cấu, phần bài, ngừng
tham gia — mọi thứ khác vẫn đóng nguyên với người ngoài nhóm. Chỉ riêng việc
PHÁT LINK MỜI mới mở, vì nó không đọc được việc của nhóm (không sổ thu, không
bài, không thông báo nội bộ) — cùng lý lẽ đã dùng cho N6 ở Danh bạ, không phải
một ngoại lệ mới cần bàn lại.

**Vai đủ điều kiện là `isClassCommittee`** (lop_truong/lop_pho/thu_quy/uy_vien),
không phải `isClassOfficer`: phát link mời không đụng tiền, nên uỷ viên — vai
thấp nhất cấp lớp — đã đủ, đúng tinh thần nó được lập ra (mục Tư liệu, migration
0013).

Ba chốt chặn đã kiểm bằng người thật trên D1 cục bộ:
1. Người thường (không phải Ban cán sự lớp) gọi route này nhận `forbidden` 403.
2. ~~Người ĐÃ nhận hồ sơ (`claimed_at` khác NULL) nhận `da_nhan_cho` 409~~ — đã
   **bỏ chặn này ngày 5/9**, xem mục riêng "Phát lại link mời cho người ĐÃ
   ĐĂNG NHẬP" ngay dưới đây. Chốt chặn thật giờ chuyển sang bước NHẬN.
3. Gọi lại lần hai cho cùng một người CHƯA nhận ra **token khác lần trước**,
   và link cũ trả `410 invite_invalid_or_expired` — `reissueInviteToken` tự
   vô hiệu link cũ trước khi cấp link mới, dùng chung với đường mời trong tab
   Nhóm, không viết lại logic.

Giao diện: nút "Tạo link mời" chỉ hiện trong thẻ Cả lớp của Danh bạ, và chỉ
khi `can_moi` (cờ trả về từ `/api/danh-ba`, tính theo NGƯỜI XEM chứ không
theo từng dòng) là true. Máy chủ vẫn kiểm lại trong `postDanhBaMoi` — giao
diện chỉ để khỏi bày nút bấm vào là 403. **Từ 5/9 nút này hiện cho MỌI
người**, không chỉ người chưa đăng nhập — đổi nhãn thành "Phát lại link đăng
nhập" khi người đó đã đăng nhập rồi, xem mục dưới đây.

### Phát lại link mời cho người ĐÃ ĐĂNG NHẬP — vá một lỗ hổng thật (5/9)

Ngô Phú Cường nói "tôi cũng có quyền phát lại link mời cho cả lớp, kể cả học
viên đã đăng nhập", rồi làm rõ: quyền anh ĐANG có "trong nhóm" (nút "Phát lại
link mời cho người này" ở tab Nhóm, `POST /api/members/:id/invite`,
`routes/wizard.js` — có từ Đợt 1, chưa từng chặn `claimed_at`) — anh muốn Cường
và lớp trưởng có quyền y hệt đó cho CẢ LỚP, không chỉ nhóm mình.

Tra tới tận nơi link đó dẫn tới thì lộ ra: `postInviteClaim` (bước NHẬN,
`routes/invite.js`) **không kiểm gì cả** khi hồ sơ đã có người nhận — chỉ cần
gõ một email tự chọn bất kỳ là được cấp phiên đăng nhập ngay lập tức, **kèm
ghi đè luôn email thật của người đó**. Nói cách khác: route ở `wizard.js` đã
âm thầm cho phép **chiếm tài khoản người khác** từ Đợt 1 tới giờ — ai cầm được
link phát lại (kể cả phát nhầm người, kể cả link lỡ lộ ra ngoài) đều đăng nhập
thẳng vào tài khoản đó, không cần biết số điện thoại, không cần passkey. Route
này an toàn ở Đợt 1 vì khi đó chưa có đường vào lại nào khác (chưa có OTP,
chưa có passkey) nên "phát lại = cấp lại chìa khoá" là hợp lý; từ Đợt 2/5 đã
có `/dangnhap` (mã 6 số qua email) và passkey nên cái lỗ ấy không còn cần
thiết nữa, chỉ còn là rủi ro treo lại — và mở rộng y nguyên nó ra cả lớp sẽ
tăng phạm vi từ "14 người Nhóm 6 mình biết mặt" lên "138 người toàn lớp".

**Không mở rộng y nguyên. Vá lỗ hổng trước, rồi mới mở rộng ra cả lớp** — đúng
kết quả Ngô Phú Cường muốn (cấp lại được link đăng nhập cho bất kỳ ai, cả lớp)
nhưng không kèm rủi ro chiếm tài khoản:

- **`xacNhanLaiSo()`** (`routes/invite.js`, hàm mới) — khi `member.claimed_at`
  đã có giá trị, `postInviteClaim` đòi thêm **đúng số điện thoại** trước khi
  cho ghi đè bất cứ gì, cùng bậc kiểm và **CÙNG hạn mức đoán** (`doan_so_ho_so`
  / `doan_so_ip`, export từ `onboard.js`) với lần đăng nhập đầu ở `/vao` — có
  chủ đích: không mở thêm một cửa dò số song song không bị khoá. Xác thực
  chạy TRƯỚC mọi việc khác (kể cả soi email đã dùng chưa).
- **`soHopLeTuHoSo(person, member)`** (`onboard.js`, tách ra từ `doiChieu()`)
  — "số nào được coi là đúng của một hồ sơ" giờ dùng CHUNG giữa `/vao` và bước
  nhận lại link mời, để sửa một bên mà quên bên kia là chuyện không xảy ra
  được nữa (đã từng là nguy cơ khi hai nơi có hai bản sao riêng).
- **`getInvite()`** (`routes/invite.js`) **giấu số điện thoại** khi
  `already_claimed` — trả `phone: null` thay vì số thật. Đây là chỗ DỄ QUÊN
  NHẤT: nếu vẫn trả số thật ra để "cho tiện sửa" thì ai mở link cũng đọc được
  số ngay trên màn hình rồi gõ y nguyên — chốt chặn vừa dựng coi như không
  tồn tại. `pw-nhanlai.mjs` có phép đối chứng riêng cho đúng chỗ này: ô Điện
  thoại ở màn nhận link phải RỖNG, không được điền sẵn.
- **`postDanhBaMoi`** (`routes/danh-ba.js`) bỏ hẳn chốt `da_nhan_cho` 409 —
  giờ phát lại được cho MỌI người, cả lớp, cả đã đăng nhập lẫn chưa. An toàn
  vì chốt thật đã chuyển sang bước nhận ở trên.
- **`postMemberInvite`** (`routes/wizard.js`, route CŨ của Đợt 1) tự động
  được vá theo, vì cả hai route đều đi qua chung `postInviteClaim` — không
  cần sửa route này, chỉ cập nhật lại chú thích cho đúng sự thật mới.

Giao diện (`public/app.js`): nút đổi nhãn "Tạo link mời" ↔ "Phát lại link đăng
nhập" theo `da_dang_nhap`, ở cả hai chỗ (tab Nhóm và Danh bạ → Cả lớp). Sheet
sau khi phát link nói rõ "người bấm vào link phải gõ ĐÚNG số điện thoại đã
đăng ký" khi tái cấp cho người đã đăng nhập, để Ban cán sự lớp biết đường dặn
trước. Màn nhận link (`renderClaim`) đổi phụ đề, KHÔNG điền sẵn ô điện thoại
khi `already_claimed`, và bắt buộc gõ trước khi cho bấm Lưu (chặn ngay trên
giao diện, khỏi tốn một lượt gọi máy chủ cho lỗi hiển nhiên).

`kiem-moi.mjs` viết lại hoàn toàn phần "người đã nhận hồ sơ": không còn kiểm
"409 bị chặn" mà kiểm CẢ HAI chiều — số sai bị chặn (401), số thiếu KHÔNG bị
tính vào hạn mức đoán (422, khác nhánh — đúng nguyên tắc "gõ hụt không phải
một lần đoán"), và đoán đủ 8 lần thì lần 9 phải 429 đúng hạn mức của `/vao`.
`reset-moi.sh` phải dọn thêm hai thùng `rate_events` (`doan_so_ho_so`/`r105`,
`doan_so_ip`/`203.0.113.90`) — thiếu bước này thì chạy lại bộ kiểm trong cùng
một giờ sẽ khoá SỚM một lượt vì cộng dồn từ lượt chạy trước, không phải do mã
sai (đã vấp và sửa ngay khi viết bộ kiểm này).

### Lưu Minh Tiến — lớp trưởng CẤP LỚP, và trưởng Nhóm 8 (migration 0021 + 0022)

Ngô Phú Cường xác nhận trực tiếp, kèm tệp "Trưởng, phó nhóm" Ban tổ chức gửi.
Có một cái bẫy suýt gán nhầm người: roster có **hai người tên đệm "Tiến"**,
cùng chức danh "Chủ tịch" — Lê Minh Tiến (Nhóm 8) và Lưu Minh Tiến (Nhóm 5) —
CLAUDE.md đã ghi từ Đợt 5 rằng hai người này còn dùng CHUNG một số điện thoại
sai (`0914544449`). Hỏi lại người dùng trước khi gán, đừng đoán theo tên.

Và **nhóm ghi trong `roster` sai**: bản 15/8 ghi Lưu Minh Tiến ở Nhóm 5, nhưng
cả người dùng lẫn tệp Ban tổ chức đều xác nhận thực tế là Nhóm 8 — cùng dạng
lệch nhóm đã gặp với Nguyễn Thị Tùng Vân. `roster.group_label` GIỮ NGUYÊN làm
bản ghi lịch sử; nhóm thật đặt trực tiếp vào `members.group_id`.

Anh ấy CHƯA từng đăng nhập — hồ sơ tạo trước (`claimed_at` để trống), tự nhận
bằng số điện thoại ở `/vao` như bình thường, không có gì đặc quyền ở bước đó.
Vai `truong_nhom` của Nhóm 8 gán kèm (migration 0021), guard theo `(group_id,
role)` chứ không theo tên — nếu Nhóm 8 đã có ai tự nhận trưởng nhóm qua wizard
thì migration không được đè lên người thật đã tự vận hành nhóm.

**Cập nhật 4/9: anh ấy còn là lớp trưởng CẤP LỚP**, không chỉ trưởng Nhóm 8 —
Ngô Phú Cường xác nhận rõ sau khi được hỏi lại (mục "Trưởng, phó nhóm" của tệp
Excel dùng nhãn "Lớp trưởng" cho NHIỀU nhóm khác nhau nên ban đầu tôi hiểu lầm
đó chỉ là tên gọi khác của "trưởng nhóm"; hỏi lại mới rõ Tiến giữ CẢ HAI).
Migration 0022 thêm một bản ghi `officers` riêng — `group_id NULL, role
'lop_truong'` — SONG SONG với bản ghi `truong_nhom, group_id=8` đã có, đúng
khuôn "vai cấp lớp tách khỏi vai cấp nhóm" đã dùng cho Ngô Phú Cường. Nhờ
`lop_truong` nằm trong `VAI_DIEU_HANH` (không phải `uy_vien` như Cường), Tiến
có thêm quyền `isClassOfficer` — mở đợt thu và ghi sổ chi quỹ LỚP — bên cạnh
`isClassCommittee` đã có (phát link mời xuyên nhóm, giống Cường).

### Việc còn treo: dữ liệu "Trưởng, phó nhóm" của 8 nhóm còn lại

Tệp Excel "Final_Danh_sách_ký_K03_15.08" Ban tổ chức gửi có sheet **"Trưởng,
phó nhóm"** ghi "Lớp trưởng"/"Lớp phó" cho gần hết 10 nhóm — nhưng đó là
trưởng/phó của TỪNG NHÓM (đúng tên sheet), không phải chức vụ cấp lớp; nhiều
nhóm có 1-2 người gắn nhãn "Lớp phó" mà không ai "Lớp trưởng", nên không đủ rõ
để tự động gán. Migration 0021 chỉ xử lý đúng ca đã được người dùng xác nhận
trực tiếp (Lưu Minh Tiến). Còn dữ liệu trưởng/phó của Nhóm 1, 2, 3, 4, 7, 9, 10
trong tệp ấy CHƯA áp — cần người dùng xác nhận từng người trước khi gán, vì sai
một vai cấp nhóm là mở nhầm quyền cơ cấu/phần bài/ngừng tham gia cho người
không đúng.

Sheet "DS lớp" cùng tệp (chữ ký buổi 21/8) ban đầu có 13 tên không khớp ai
trong roster — **đã rà từ 5/9** (migration 0028, rồi 0029): Nguyễn Thị Hoa và
Võ Thị Trang được thêm hẳn, "Đậu Huy Đại" hoá ra là tên bị cụt của một người
đã có sẵn (sửa thành "Đậu Huy Đại Việt"), và Nguyễn Tuấn Hùng (Nhóm 3) được
thêm theo yêu cầu trực tiếp của Ngô Phú Cường — xem mục "Người thứ 139" ngay
dưới. **Còn CHƯA xử lý**: "Vương Quốc Chung" (Nhóm 1, rất giống "Khương Quốc
Chung" seq 75 nhưng người đó lại xuất hiện đầy đủ, riêng biệt ở Nhóm 5 trong
cùng tệp — nhiều khả năng là hai người khác nhau, không phải lỗi chép) và sáu
tên khác: Nguyễn Việt Anh (Nhóm 1), Nguyễn Thu Thảo (Nhóm 2, có số
`0989588534` trong tệp), Nguyễn Tùng Lâm (Nhóm 5), Nguyễn Tuấn Đạt (Nhóm 7, có
số `0961547806`), Lưu Thị Bích Ngọc (Nhóm 9, số ghi `904580955` — thiếu số 0
đầu, chưa rõ có phải lỗi Excel làm rụng số 0 hay không), Đặng Hùng (Nhóm 10, số
ghi `03845375x8` — có ký tự "x" lẫn vào, rõ ràng lỗi nhập liệu của Ban tổ
chức). Cần người dùng xác nhận từng người trước khi thêm vào roster.

### Người thứ 135: Trương Thị Ngọc Anh, Nhóm 4 (migration 0023)

4/9, Ngô Phú Cường hỏi thẳng "Trương Thị Ngọc Anh Nhóm 4 có tồn tại không" —
tra thì KHÔNG có trong 134 người của roster gốc (migration 0002), kể cả tìm
theo họ "Trương" hay theo "Ngọc Anh" riêng lẻ. Người dùng dán lại nguyên dòng
dữ liệu của cô ấy từ một tệp Excel khác, đủ cả dob/chức vụ/công ty/địa chỉ/số
điện thoại — migration 0023 thêm thẳng vào `roster`, seq=135 (nối tiếp ngay
sau 134, không dùng lại STT=15 của tệp nguồn vì đó là số thứ tự của MỘT TỆP
KHÁC, không phải khoá của ta — `roster.seq` chỉ để hiển thị, không được code
dùng để tra cứu, khoá thật luôn là `roster.id`).

Có một điểm củng cố đáng ghi lại: công ty "Công ty CP Trường học MindX" và địa
chỉ "71 Nguyễn Chí Thanh, phường Giảng Võ, Hà Nội" TRÙNG KHỚP với Nguyễn Trung
Đức (seq 51, Nhóm 4) đã có sẵn trong roster từ đầu — hai đồng nghiệp cùng công
ty, cùng lớp, cùng nhóm. Đây là bằng chứng gián tiếp tốt rằng dữ liệu người
dùng cung cấp là thật, không phải lỗi đánh máy.

**Số điện thoại thiếu 1 chữ số trong tệp nguồn** (`086689856` — 9 số, cần 10)
— CÙNG DẠNG LỖI đã gặp với Lê Trung Đức. Ghi nguyên văn vào `roster.phone`,
không đoán số còn thiếu; đã thêm dòng cho cô ấy vào
`scripts/data/bo-sung-dien-thoai.csv` (nhóm "đang SAI", nay 6 dòng chứ không
còn 5) — cô ấy sẽ không tự vào được ở `/vao` cho tới khi có số đúng.

Chỉ thêm vào `roster` — KHÔNG tự tạo `members`. Người thật khớp mẫu này cần
Ban cán sự lớp phát link mời qua tính năng xuyên nhóm mới làm (mục "Link mời
xuyên nhóm" ở trên), hoặc cô ấy tự nhận ở `/vao` một khi có đúng số.

**Bẫy suýt vấp phải, đã sửa kèm**: `roster_total` từng bị `deploy.yml` VÀ ba
bộ kiểm (`kiem-tanso.mjs`, `kiem-danhba.mjs`, `kiem-moi.mjs`) ghi cứng thành
`=== 134` — thêm một người là bốn chỗ đó đỏ hết, đúng kiểu lỗi `group6_members`
đã vấp ngày 24/8. Sửa tất cả sang "không hụt đi" (`>= 134`), cùng khuôn với
cách `group6_members` đã được sửa. `scripts/build-phan-vai-sql.mjs` cũng có
một cận trên cứng `seq > 134` chặn gán vai — nâng lên 135 (`SEQ_TOI_DA`), kèo
theo sẽ phải nâng tiếp nếu roster còn thêm người. `scripts/verify-d1.sql` CỐ Ý
không sửa: nó xác nhận đúng bản nạp gốc 134 người, không phải trạng thái sống
của roster — chỉ dùng khi nạp lại từ đầu.

### Người thứ 139: Nguyễn Tuấn Hùng, Nhóm 3 (migration 0029)

5/9, Ngô Phú Cường yêu cầu trực tiếp: "thêm 'Nguyễn Tuấn Hùng'". Tên này nằm
trong danh sách "chưa xử lý" của đợt rà soát trước (mục ngay trên) — sheet "DS
lớp" ghi TT=14, Nhóm 3, đơn vị "Công ty CP Đầu tư GemVN", không có ngày sinh,
chức vụ, địa chỉ hay số điện thoại nào cho dòng này. Thêm nguyên vẹn những gì
có, để trống phần còn lại — đúng nguyên tắc "thiếu thông tin thì để trống, đừng
bịa". seq=139, nối tiếp ngay sau 138 (Võ Thị Trang, migration 0028).

Không có số điện thoại nên anh ấy không tự vào được ở `/vao` — đã thêm dòng
vào `scripts/data/bo-sung-dien-thoai.csv`. Nhưng khác các trường hợp trước:
lần này KHÔNG cần chờ điền số. Tính năng "phát lại link mời cho cả lớp" vừa
xong cùng ngày (mục "Phát lại link mời cho người ĐÃ ĐĂNG NHẬP" ở trên) mở ra
một đường vòng sẵn có — bước NHẬN của một hồ sơ CHƯA từng có ai nhận
(`postInviteClaim`, nhánh `!wasClaimed`) chỉ đòi email, không đòi số điện
thoại (chốt `xacNhanLaiSo` chỉ chạy khi `wasClaimed`). Ngô Phú Cường hoặc Lưu
Minh Tiến phát link cho anh ấy qua Danh bạ → Cả lớp là vào được ngay, không
phải chờ ai điền số.

Đây chính là lý do phù hợp để nói với Ngô Phú Cường: **toàn bộ danh sách trong
`bo-sung-dien-thoai.csv` (44 người chưa có số + 6 người số đang sai/trùng +
Nguyễn Tuấn Hùng vừa thêm = 51 dòng) đều có thể vào được NGAY bằng đường phát
link mời này**, không cần đợi điền số điện thoại nữa — điền số chỉ còn cần
thiết cho việc HỌ tự đăng nhập LẠI ở những lần sau nếu link mời bị mất hoặc hết
hạn (magic-link email vẫn dùng được, nhưng phát lại link mời là đường nhanh
nhất). Số điện thoại vẫn nên điền dần vì `/vao` là đường vào không cần Ban cán
sự lớp đứng ra mỗi lần, nhưng nó không còn là chỗ chặn duy nhất.

### Bốn số điện thoại điền được từ tệp Ban tổ chức (migration 0020)

Đối chiếu 44 người thiếu số trong roster với cả hai sheet của tệp trên (theo
TÊN, vì không có cột roster_id nào để khớp thẳng) — chỉ 4 người khớp được:
Trần Huy Tùng, Tạ Duy Hưng, Nguyễn Quang Huy, Lâm Ngọc Thảo. Bốn dòng ấy đã bị
xoá khỏi `scripts/data/bo-sung-dien-thoai.csv` vì đã xong, tránh double-work.
40 người còn lại trong CSV thì tệp Ban tổ chức này không có số của họ — vẫn
phải hỏi trực tiếp.

## Giới hạn tần suất: đếm lần đoán, đừng đếm người

Sửa 27/8, sau khi rà lại đợt "bỏ OTP". Câu hỏi làm lộ ra lỗi: **cả lớp 134
người ngồi chung một hội trường, cùng một WiFi, cùng mở ứng dụng lên — thì
đường vào có còn mở không?**

Câu trả lời là KHÔNG, và đo được chứ không suy đoán
(`scripts/kiem/kiem-tanso.mjs`, chạy trên bản chưa sửa):

| Cửa | Hạn mức cũ | Hỏng ở đâu |
|---|---|---|
| `/api/onboard/vao` | 10/IP/giờ | **người thứ 11** vào lần đầu → 429 |
| `/api/onboard/check` | 20/IP/giờ | người thứ 21 → 429 |
| `/api/wizard/roster/search` | 60/IP/giờ | người thứ 61 gõ tên mình → 429 |
| `/api/passkey/login/options` | 20/IP/giờ | **lượt thứ 21** đăng nhập → 429 |
| `/api/invite/:token` | 20/IP/giờ | dùng CHUNG thùng với passkey |
| `/api/auth/email` | 5/IP/giờ | người thứ 6 xin link → 429 |

Chỗ tệ nhất là dòng thứ năm: passkey và link mời **chung một thùng**
`invite_try`. Bộ kiểm bắt được cảnh 40 lượt passkey ăn sạch hạn mức, rồi link
mời **chết ngay từ lượt ĐẦU TIÊN** — trưởng nhóm phát link cho cả nhóm mà
không ai bấm vào được.

Gốc rễ không phải con số nào đặt thấp quá. Gốc rễ là **`allow()` tính cả lượt
THÀNH CÔNG**, mà sau NAT thì "mỗi IP mỗi giờ" nghĩa là "mỗi phòng mỗi giờ".
Nhà mạng di động Việt Nam cũng dùng NAT quy mô lớn, nên hai người lạ mặt vẫn
có thể chung một địa chỉ.

### Cách chữa: tách `allow()` làm đôi

`lib/ratelimit.js` nay có ba hàm — `conQuota()` chỉ đếm, `ghiNhan()` chỉ ghi,
`allow()` giữ nghĩa cũ cho những chỗ mà mỗi lượt gọi đều là một lần thử thật
(xin gửi thư chẳng hạn: gửi được cũng vẫn là một lá thư đi). Nhờ vậy chỗ gọi
tự quyết định lượt nào đáng tính:

| Cửa | Nay | Tính lượt nào |
|---|---|---|
| số điện thoại | **8/hồ sơ/giờ** + 30/IP/giờ | chỉ khi **sai số** |
| tìm tên | 400/IP/giờ | mọi lượt |
| passkey login | 300/IP/giờ, thùng riêng | mọi lượt |
| token lời mời | 20/IP/giờ (mục 8 SRS) | chỉ khi **mã 410** — token hụt |
| nhập mã 6 số | 20/IP/giờ | chỉ khi **nhập sai** |
| xin mã 6 số | 150/IP/giờ + 5/email/giờ | mọi lượt |
| xin link đăng nhập | 150/IP/giờ + 5/email/giờ | mọi lượt |

**Thùng theo hồ sơ mới là cửa thật.** Muốn dò số của ai thì phải nện vào đúng
`roster_id` của người ấy, mà 8 lần một giờ thì không đi tới đâu trước 10^8 khả
năng. Thùng theo IP chỉ để bắt máy quét rải mỏng — mỗi hồ sơ một phát nên thùng
kia không thấy.

Bốn điều cố ý, mỗi điều một lý do:

1. **`/check`, `/vao` và `/start` dùng CHUNG hạn mức**, và chỗ đếm nằm trong
   `doiChieu()` chứ không ở từng route. Ba đường soi cùng một bí mật; mỗi đường
   một sổ riêng thì kẻ dò gọi xen kẽ là được gấp ba số lần.
2. **Gõ hụt một chữ số KHÔNG tính là một lần đoán** (`phone_invalid`). Máy dò
   gửi số đủ khuôn; chỉ người thật mới gõ thiếu.
3. **Hồ sơ chưa có số trong danh sách gốc cũng không tính** — không có gì để
   đoán thì không có gì để chặn. Điều này làm phép kiểm "quét rải" đọc ra con
   số lạ: kẻ quét chạm được 47 hồ sơ nhưng chỉ tốn 30 lượt, vì 17 người trong
   khoảng ấy chưa có số.

   Cùng lý do, `thuToken()` chỉ tính **mã 410**, không tính mọi mã 4xx: bấm
   đúng link của mình mà gõ nhầm email trả 422 hoặc 409, mà đó có phải đoán
   token đâu — tính vào là bắt cả phòng chịu chung.
4. **Mọi con số theo IP phải TRÊN sĩ số lớp.** Con số nào thấp hơn 134 cũng chỉ
   bảo đảm được đúng một việc: khoá oan người thật. Đây là lý do nâng cả
   `roster_search` (60 → 400) lẫn `OTP_PER_HOUR` (40 → 150).

Cái mất, nói thẳng: `roster_search` nới ra là rút ngắn thời gian quét sạch danh
sách lớp — tên, nhóm, chức vụ, đơn vị. Chấp nhận được vì đây là 134 người vốn
đã biết nhau và phúc đáp **không bao giờ** có số điện thoại hay email. Bao giờ
bị lạm dụng thật thì chặn bằng Cloudflare, đừng siết con số xuống dưới sĩ số.

Giao diện cũng bớt gọi: gõ thêm chữ để **thu hẹp** một truy vấn đã trả về đủ
(dưới 12 người, tức không bị cắt) thì lọc ngay trên danh sách vừa nhận. Kết quả
đã bị cắt bớt thì KHÔNG giữ lại — thu hẹp trên một danh sách cụt sẽ giấu mất
người.

Và câu báo khoá: bản cũ viết "Bạn xin mã hơi nhiều lần rồi" ở mọi chỗ, đọc lên
vô nghĩa trên đường vào thẳng bằng số điện thoại — nơi không có mã nào được gửi
đi cả. Nay câu chung nói "Thử hơi nhiều lần rồi", còn riêng ô số điện thoại thì
nói đúng chuyện: "Số điện thoại đã nhập sai nhiều lần."

### Vá kèm: ngừng tham gia mà chưa kịp nhận hồ sơ

Hạ `is_active` về 0 rút được phiên, passkey và thông báo đẩy — nhưng **không
rút được `/vao`**, vì chốt chặn duy nhất ở đó là `claimed_at`, mà ai bị cho
ngừng TRƯỚC khi kịp nhận hồ sơ thì `claimed_at` vẫn còn trống.

Trước khi vá, họ vào được: máy chủ cấp cookie, đặt `claimed_at`, ghi cả một
dòng nhật ký — rồi `getCurrentMember` lọc `is_active` nên mọi lời gọi sau đó
rơi hết. Người dùng thấy "đã vào" xong bị đá ra, mà cửa `/vao` thì đóng vĩnh
viễn sau lưng. Nay trả 409 `da_ngung_tham_gia`, và chốt ấy đặt **sau** phép so
số: ai chưa biết số của người ta thì cũng không được biết người ta đã nghỉ.

### Bốn cái bẫy trong chính bộ kiểm

1. **Bộ kiểm "cả lớp vào được" tự nó không có răng** — gỡ sạch giới hạn tần
   suất đi là nó xanh hết. Vì vậy nửa sau của `kiem-tanso.mjs` đo chiều ngược
   lại, và bốn phép ấy là phần đáng giữ nhất.
2. **Đếm lần ĐOÁN, đừng đếm vòng lặp** — xem điểm 3 ở trên.
3. **`fuser -k -n tcp 8787` không giết nổi wrangler.** Nó đẻ một tiến trình
   `workerd` con giữ cổng; giết mỗi cái nghe cổng thì cái kia sống sót và lần
   khởi động sau chồng lên. Đã có lúc **chín** tiến trình cùng chạy, mỗi cái
   một bản D1 riêng — reset ở bản này rồi đọc kết quả ở bản kia, đỏ những phép
   đáng lẽ xanh, và mất một lúc mới nhìn ra. Hai script reset nay dùng `pkill
   -f "wrangler dev"` cộng `pkill -f workerd` rồi chờ cổng im hẳn.

4. **`pw-vao-nhanh.mjs` đọc `coso.json` — một tệp KHÔNG có trong repo.** Nó
   nằm ở thư mục scratchpad của phiên trước, nên bộ kiểm vừa được commit vào
   repo với lời hứa "nay không mất nữa" lại không chạy nổi ngay lượt đầu. Nay
   `gieo-coso.mjs` sinh lại từ D1 và `reset-vao.sh` tự gọi. Bài học chung: bộ
   kiểm commit vào repo thì mọi thứ nó ĐỌC cũng phải sinh lại được từ repo.

Thêm hai chỗ môi trường, cả hai đều làm bộ kiểm trông như máy chủ sập:

- **`.dev.vars` phải trỏ SMTP vào cổng ĐÓNG trên máy này** (`127.0.0.1:2525`).
  Để nguyên `smtp.gmail.com` như tệp mẫu thì `connect()` của Workers không bao
  giờ giải quyết, request treo tới khi workerd cắt kết nối, và bộ kiểm chết
  giữa chừng với `UND_ERR_SOCKET: other side closed`.
- **`wrangler dev` giữ khoá tệp SQLite từ lúc KHỞI ĐỘNG**, không phải từ
  request đầu tiên — đo được, đã thử chờ bằng tệp tĩnh và vẫn treo. Nên
  `pw-thongke.mjs` và `pw-tulieu-buoi.mjs`, vốn gieo dữ liệu bằng `wrangler d1
  execute` ở đầu tệp, **phải chạy khi server đang TẮT**, rồi dựng server lên
  kịp trước lời gọi HTTP đầu tiên. Mỗi lệnh `npx wrangler` tốn khoảng 13 giây
  ở sandbox này nên riêng bước gieo mất hơn ba phút; treo mà không in dòng nào
  là triệu chứng của đúng chuyện ấy, đừng nhầm với bộ kiểm hỏng.

## Bỏ OTP ở lần đầu — số điện thoại vào thẳng, rồi passkey

Đổi 27/8 sau khi học viên phản ánh lần đầu đăng nhập quá phức tạp. Ngô Phú
Cường quyết, sau khi được nêu rõ cái mất.

| | Trước | Nay |
|---|---|---|
| Lần đầu | tên → số → email → **chờ thư → gõ 6 số** | tên → số → email → **vào luôn** |
| Ngay sau đó | — | mời đặt **passkey** |
| Vào lại | mã 6 số / passkey | mã 6 số / passkey (**không** dùng lại số) |

`POST /api/onboard/vao`. Đường OTP cũ (`/api/onboard/start`, `/api/auth/otp`)
giữ nguyên làm dự phòng.

**Chốt chặn quan trọng nhất: chỉ mở được hồ sơ CHƯA AI NHẬN**
(`claimed_at IS NULL`). Nhận xong là cửa đóng vĩnh viễn, trả 409 `da_nhan_cho`.

Vì sao bắt buộc phải có chốt ấy: **số điện thoại không phải bí mật trong nội
bộ lớp.** Danh sách lớp kèm số rất có thể đã lưu hành, trong nhóm Zalo số
thường nhìn thấy được, và đây là lứa người trao danh thiếp. Nó chặn người
ngoài, không chặn bạn cùng lớp. Nếu để số dùng lại mãi thì ai có danh sách
cũng đăng nhập được vào chỗ bất kỳ ai, bất cứ lúc nào — kể cả trưởng nhóm, tức
mở được sổ thu, tạo đợt thu, cho người khác ngừng tham gia. Khoá vào
lần-đầu-duy-nhất thì cửa sổ ấy đóng ngay khi chính chủ vào lần đầu.

Giới hạn tần suất đường này là **10 lần/IP/giờ** (`VAO_PER_HOUR`), chặt hơn hẳn
các đường khác vì nay nó là cửa an ninh duy nhất.

N4 SRS viết nguyên văn "không xác minh email, không OTP" — nên bỏ OTP là quay
về đúng chuẩn gốc, không phải nới ra khỏi nó.

### Ba thứ phải sửa kèm, thiếu một cái là luồng gãy

1. **Chốt chặn passkey đã đổi**: `!me.email_verified_at` → `!me.claimed_at &&
   !me.email_verified_at` (lỗi đổi tên thành `chua_nhan_ho_so`). Không đổi thì
   passkey — thứ thay chỗ OTP — lại đòi đúng cái OTP vừa bỏ. `/api/home` trả
   thêm `da_nhan_ho_so` để giao diện mở nút.
2. **`email_verified_at` CỐ Ý để trống.** Email thật sự chưa kiểm chứng. Hệ
   quả: gõ nhầm một chữ là mất đường vào lại khi đổi máy. Vì vậy màn "Xong rồi"
   in lại địa chỉ vừa gõ kèm câu cảnh báo — đó là chỗ cuối cùng người ta còn
   nhìn thấy nó.
3. **Người chưa có số bị chặn NGAY sau khi chọn tên**, không phải sau khi gõ số
   (44/134 người). `searchRoster` trả cờ `co_so_doi_chieu` — **cờ thôi, không
   bao giờ trả số**, đường ấy ai gọi cũng được. Điều kiện của cờ phải trùng
   khít `doiChieu()` trong `onboard.js`; bộ kiểm đối chiếu cờ với luật cho cả
   134 người để hai bên không lệch.

### Hai chỗ chỉ lộ ra khi chạy thật

- **`register/verify` KHÔNG kiểm được ở máy cục bộ.** `wrangler dev` có mục
  `routes` nên báo `request.url` mang hostname production, còn trình duyệt ở
  `localhost` — `verifyRegistrationResponse` so hai thứ ấy rồi từ chối. Đổi
  host kiểu gì cũng vướng. Trên tên miền thật hai bên trùng. Kiểm được tới đâu
  thì khẳng định tới đó: options trả 200, trình duyệt tạo khoá thật, và bấm
  xong thì rời màn `/vao` chứ không kẹt.
- **Passkey vẫn CHƯA từng chạy trọn vẹn trên tên miền thật** — đây là chỗ hổng
  có từ trước, không phải do lần đổi này. Nay nó quan trọng hơn hẳn vì passkey
  là thứ giữ chỗ cho những lần sau.

## Đăng nhập (Đợt 5 viết lại) — không có vai "admin" riêng

Sản phẩm không có tài khoản quản trị. Quyền đến từ bảng `officers`; Ngô Phú
Cường là `truong_nhom` của Nhóm 6 — vai cao nhất hiện có (vai cấp lớp còn để
ngỏ, xem mục việc treo).

**Lối vào chính: tự nhận diện tại `/vao`, không cần ai gửi gì.**

1. Gõ tên (không dấu cũng ra) → chọn đúng mình trong 134 người của `roster`
2. Nhập **số điện thoại** để chứng minh đúng là mình. Ban tổ chức đã có sẵn số
   này — **KHÔNG gửi gì tới nó**, chỉ đối chiếu. Tên thì cả lớp ai cũng biết,
   số thì không, nên số đóng vai mật khẩu dùng một lần của bước này.
3. Khai **email** → nhận **mã 6 số** qua thư (không SMS, không tốn tiền)
4. Nhập mã → có phiên 90 ngày, `email_verified_at` được đặt
5. **Passkey chỉ hiện sau bước 4** — chặn cả ở giao diện lẫn máy chủ
   (`postRegisterOptions` trả 403 `email_chua_kiem_chung`)

Đăng nhập lại: `/dangnhap` → nhập email → mã 6 số. Hoặc passkey.

**Vì sao mã 6 số chứ không phải magic link**: bấm link trong app Gmail mở bằng
trình duyệt nội bộ của app, cookie phiên rơi vào đó chứ không vào trình duyệt
thật — người dùng quay lại Safari/Chrome thì vẫn chưa đăng nhập. Gõ 6 số thì
không dính. Magic link của Đợt 2 vẫn còn route, giữ làm đường phụ.

**Bảng `otp_codes` riêng, KHÔNG nhét vào `invites`**: `invites.token_hash` là
UNIQUE, mà mã 6 số chỉ có một triệu khả năng nên xin nhiều lần là có ngày trùng
mã → trùng hash → vỡ ràng buộc ngay giữa luồng đăng nhập. OTP còn cần đếm số
lần nhập sai, thứ `invites` không có.

Quy tắc an toàn đã cài: mã băm kèm `member_id`; tối đa 5 lần sai rồi mã chết;
xin mã mới là mã cũ chết; dùng một lần bằng `UPDATE ... WHERE used_at IS NULL`
rồi xét số dòng đổi; so hash hằng thời gian; email lạ trả lời **giống hệt**
email có thật; số điện thoại sai **không nói lệch chỗ nào**. Cửa an ninh nằm ở
`/api/onboard/start` chứ không ở `/api/onboard/check` — check chỉ để báo sớm.

**Ai vào bằng link mời** thì có phiên nhưng `email_verified_at` còn trống, nên
chưa mở được passkey. Tab Tài khoản có sẵn nút gửi mã để xác minh nốt
(`/api/me/verify-email` — dùng phiên, không nhận email trong thân, nên không có
chỗ nào để dò).

**Dữ liệu chặn luồng này** — 49 dòng, xem `scripts/data/bo-sung-dien-thoai.csv`:
- 44 người chưa có số nào (Nhóm 6: 6 người) → chưa tự nhận diện được
- Lê Trung Đức: `098778525` thiếu một chữ số
- `0914544449` dùng chung cho Lưu Minh Tiến (Nhóm 5) và Lê Minh Tiến (Nhóm 8)
- `0985981808` dùng chung cho **hai người cùng tên** Phan Thị Thanh Nga, một ở
  Nhóm 6 một ở Nhóm 9 — vì vậy CSV khoá theo `seq` chứ không theo tên

Điền cột `so_dien_thoai` rồi commit là workflow `bo-sung-dien-thoai.yml` tự nạp.
Nó chặn trước khi chạm D1 nếu có số sai khuôn hoặc hai người chung một số.

**Đường đăng nhập đã thông hết** từ 24/8: thư mã 6 số gửi được thật (xem mục
gửi thư ở dưới). **Vòng luẩn quẩn của lần đầu tiên** giờ chỉ còn với ai chưa
có số điện thoại trong danh sách gốc. `.github/workflows/phat-link-moi.yml` vẫn còn để phá vòng
đó khi cần (ghi thẳng lời mời vào D1, in link ra log Actions, hạn 120 phút, mỗi
lần chạy tự huỷ lời mời cũ chưa dùng của đúng người ấy).

## Cách làm việc mà người dùng đang mong đợi

Qua bốn đợt, cách làm đã thành nếp và người dùng không phàn nàn:

- Trả lời và viết mọi thứ **bằng tiếng Việt**, kể cả commit message, comment
  trong code, và tên biến trong chuỗi hiển thị.
- **Review lại đợt trước trước khi làm đợt sau** — lần review Đợt 1 tìm ra 20
  lỗi thật, trong đó 3 lỗi nghiêm trọng (mất dữ liệu, XSS, lệch thời gian).
- **Kiểm thử thật, không chỉ đọc code**: API bằng curl trên D1 thật, luồng
  người dùng bằng Playwright trên Chromium thật, và luôn viết test hồi quy cho
  đúng từng lỗi đã sửa. **Từ 27/8 các bộ kiểm nằm ở `scripts/kiem/` trong
  repo**, không còn ở scratchpad nữa: thứ đắt nhất trong chúng là các phép đối
  chứng, mỗi cái ứng với một lỗi đã trả giá để tìm ra, và viết lại từ đầu thì
  phần lớn sẽ thành phép kiểm không có răng. Đọc `scripts/kiem/README.md`
  trước khi chạy — có mục "bốn phép đối chứng đáng giữ nhất" và hai chỗ môi
  trường sandbox không kiểm được.
- **Nói thẳng cái chưa kiểm chứng được**, đừng để lẫn với cái đã chắc chắn.
- Commit vào nhánh `claude/read-content-deployment-plan-dpsv8m`, không tạo PR
  trừ khi được yêu cầu.
