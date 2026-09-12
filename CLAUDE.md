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

## Đang ở đâu (cập nhật 12/9)

Đã chạy thật trên `k3vaceo.cuongngo.app`. Nhánh mà `deploy.yml` ghim:
`claude/content-deployment-continuation-m2inni` — mọi thay đổi phải tới ĐÓ thì
tên miền mới đổi, xem cái bẫy ngay dưới danh sách này.

**Mười một việc gần nhất, theo thứ tự nên đọc nếu tiếp nhận:**

1. **Trợ lý KHKD** (12/9, migration 0038) — thứ LỚN NHẤT từng thêm vào dự án
   này, và là lần đầu tiên nó **tốn tiền theo lượt dùng** cùng lần đầu **bỏ
   HAI nguyên tắc gốc cùng lúc (N1 và N2)**. Ngô Phú Cường đưa hai tài liệu
   của giảng viên rồi nói thẳng: *"Loại bỏ các rào cản N1, N2 bạn khảo sát và
   cung cấp một Agent hữu dụng cho học viên"*, và làm rõ phạm vi: *"Agent này
   sẽ phỏng vấn và dẫn dắt TỪ Ý TƯỞNG đến việc đặt các câu hỏi và (gợi ý) trả
   lời cho học viên khi xây dựng KHKD"*. Xem mục riêng bên dưới — đọc TRƯỚC
   khi đụng vào bất cứ thứ gì trong `worker/src/tro-ly/`.
2. **Xin đổi nhóm — tự phục vụ** (9/9, migration 0037). Ngay sau khi chuyển
   tay Trương Thị Ngọc Anh sang Nhóm 6 bằng migration 0036, Ngô Phú Cường hỏi
   thẳng "có thể thêm chức năng xin đổi nhóm không, ai là phê duyệt thì phù
   hợp" — muốn việc lặp lại tự chạy được, không phải chờ tôi viết migration
   tay mỗi lần. Trả lời qua AskUserQuestion: **TRƯỞNG/PHÓ NHÓM ĐÍCH duyệt**,
   không phải Ban cán sự lớp, không phải cả hai nhóm cùng đồng ý — nhóm ĐI
   chỉ CẦN BIẾT (qua "Hoạt động gần đây"), không cần ĐỒNG Ý. Xem mục riêng
   bên dưới.
3. **Đính kèm Ghi chú vào thông báo** (8/9, migration 0034), kèm thanh định
   dạng B/I/gạch đầu dòng và ô xem trước gắn thêm vào sheet Sửa ghi chú/Gắn
   Tư liệu (trước đó chỉ có ở sheet soạn thông báo). Phát hiện tình cờ một
   N6 THẬT có từ trước khi làm việc này: `GET /api/lich` trả về thông báo
   nội bộ của MỌI nhóm, không lọc phạm vi — đã vá cùng lúc. Xem mục riêng
   bên dưới.
4. **Thư khi có thông báo mới** (6/9, migration 0031) — đăng thông báo lên ứng
   dụng xong là gửi thư cho người trong phạm vi, kèm công tắc tắt của chính
   chủ ở tab Tài khoản. Lý do làm: đo trên D1 thật thì thông báo đẩy chỉ có
   **2/146 người bật và chưa gói tin nào từng đi** — xem mục riêng bên dưới.
5. **Giao thương** (5/9) — tab Giao thương + trang công khai `/giao-thuong`.
   Danh mục "bán gì, bán cho ai" của cả lớp, kèm ghép nối theo nhu cầu và
   một trang ai cũng mở được (Google index được). Chỗ DUY NHẤT dữ liệu người
   dùng ra khỏi tên miền, và chỉ của ai tự bật — xem mục riêng bên dưới.
6. **Phát lại link mời cho người ĐÃ ĐĂNG NHẬP — vá một lỗ hổng thật** (5/9).
   Ngô Phú Cường xin mở rộng quyền "phát lại link mời trong nhóm" (có từ Đợt
   1, chưa từng chặn người đã đăng nhập) ra cả lớp cho anh và lớp trưởng. Tra
   tới nơi thì lộ ra route ĐÓ đã luôn cho phép **chiếm tài khoản người khác**:
   bước nhận (`postInviteClaim`) không đòi gì ngoài một email tự chọn. Đã vá
   trước khi mở rộng: bước nhận nay đòi đúng số điện thoại khi hồ sơ đã có
   người nhận, cùng hạn mức đoán với `/vao` — xem mục riêng bên dưới.
7. **Tư liệu gắn vào PHẦN BÀI** (5/9). Bài↔Tư liệu là mắt xích còn thiếu của
   bộ ba Hôm nay/Bài/Tư liệu — Ngô Phú Cường hỏi thẳng "ba tab có liên thông
   với nhau không", tra ra `links.section_id` có cột từ đầu (migration 0001)
   nhưng CHƯA từng được nối dây (luôn ghi cứng NULL). Nay nối xong, đúng khuôn
   "một dòng, hai màn" đã dùng cho buổi học — xem mục riêng bên dưới. Điểm
   khác biệt phải nhớ: mỗi nhóm giữ một bộ tám phần RIÊNG, không dùng chung
   như buổi học, nên chốt N6 phải kiểm thêm "đúng nhóm" chứ không chỉ "có thật".
8. **Tư liệu dạng "Nội dung Text"** (5/9, migration 0025). Bên cạnh dán đường
   dẫn, nay gõ thẳng một ghi chú Markdown vào ứng dụng — lệch có chủ ý thứ hai
   với N2, xem mục riêng bên dưới. Điểm cần nhớ nhất: `mdSafe()` trong
   `public/app.js` ESC TRƯỚC rồi mới PARSE cú pháp markdown, không được đảo
   ngược thứ tự.
9. **Link mời xuyên nhóm cho Ban cán sự lớp** (3/9, mở rộng 4/9 và 5/9). Ngô
   Phú Cường (uỷ viên) và Lưu Minh Tiến (lớp trưởng, migration 0022) phát được
   link mời cho BẤT KỲ ai ở bất kỳ nhóm nào, không chỉ nhóm của mình, kể cả
   người đã đăng nhập (mục #6 ở trên) — `POST /api/danh-ba/:roster_id/moi`,
   xem mục riêng bên dưới.
10. Tư liệu gắn vào buổi học — một dòng dữ liệu, hiện ở cả tab Lịch lẫn Tư liệu.
11. Bỏ OTP ở lần đăng nhập đầu — số điện thoại vào thẳng, rồi passkey.

**Một cái bẫy đã trả giá, đừng vấp lại:** `deploy.yml` ghim **tên nhánh** ở
`on.push.branches`. Đổi nhánh làm việc mà quên sửa dòng ấy thì mọi commit đẩy
lên đều **không deploy** — tab Actions im lặng, không lỗi, không cảnh báo, và
triệu chứng duy nhất là người dùng bảo "vào không thấy gì mới". Đã xảy ra ngày
28/8 với bốn commit liền.

**Bẫy thứ ba, trong CHÍNH `deploy.yml`, trả giá ở lượt deploy #111 (12/9):**
mọi khối `node -e '…'` trong workflow nằm trong một chuỗi shell bọc bằng NHÁY
ĐƠN, mà trong nháy đơn shell **không có cơ chế thoát nào cả** — gặp nháy đơn
thứ hai là đóng chuỗi ngay. Một dòng `console.log('::warning::…')` viết bằng
nháy đơn làm node nhận **2.225 byte thay vì 4.542** (đo bằng một `node` giả
đặt lên `PATH` để bắt đúng chuỗi truyền vào `-e`), và một dấu `(` lọt ra ngoài
thì cả bước kiểm chết bằng `syntax error near unexpected token (`. Mã Worker
lên hoàn toàn bình thường, migration áp xong, Pages xuất bản xong — chỉ phép
kiểm tự chết, nên deploy đỏ mà ứng dụng vẫn đúng.

Luật từ nay: **trong khối `node -e` không được có một nháy đơn nào**, kể cả
trong chú thích; nháy đơn trong DỮ LIỆU (câu SQL chẳng hạn) viết bằng `\u0027`.
`node scripts/kiem/kiem-deploy-yml.mjs` canh đúng luật này, chạy trong một
giây và không cần máy chủ — chạy nó mỗi khi đụng vào `deploy.yml`.

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

**Bốn việc cần làm tiếp, xếp theo mức chặn:**

1. **Mở một phiên Trợ lý KHKD THẬT trên tên miền** — đây là phép nghiệm thu
   duy nhất cho tính năng lớn nhất vừa thêm, và sandbox không làm được (xem
   mục riêng). Hỏng thì `hong_o_buoc` trong phúc đáp 502 nói ngay hỏng ở bước
   nào. Kèm theo: thêm `DEEPSEEK_API_KEY` vào **GitHub Secrets** (ngoài
   Cloudflare) để `deploy.yml` tự kiểm khoá còn sống mỗi lượt deploy.
2. **Điền 51 số điện thoại** vào `scripts/data/bo-sung-dien-thoai.csv` (45
   người chưa có số nào, 6 số sai hoặc trùng — đã điền được 4/44 người chưa có
   số nhờ tệp "Trưởng, phó nhóm" của Ban tổ chức, migration 0020; thêm một
   người mới migration 0023 vào thẳng nhóm "sai" vì số trong tệp gốc thiếu một
   chữ số). Chưa điền thì từng ấy người không tự vào được — đây là chỗ chặn số
   một, và nó không phải việc lập trình.
3. **Thử passkey trên điện thoại thật** ở `/vao`. Nay passkey là thứ giữ chỗ
   cho những lần đăng nhập sau, mà nó CHƯA từng chạy trọn vẹn trên tên miền
   thật lần nào. Hỏng thì đường vào lại chỉ còn mã email, tức chưa thật sự bỏ
   được OTP.
4. **Cloudflare → zone `cuongngo.app` → Caching → Browser Cache TTL → "Respect
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

- **N1 — Zalo để bàn, ứng dụng để chốt.** ~~Không chat.~~ ~~Không thông báo
  đẩy~~ → **đã lệch có chủ ý HAI LẦN**, Ngô Phú Cường quyết cả hai:
  - **24/8, thông báo đẩy.** Quyết sau khi được nêu rõ đây là đổi bản chất sản
    phẩm chứ không phải thêm tính năng. Thông báo đẩy chỉ mang đúng một việc —
    "có tin mới, mở ứng dụng ra xem" — chứ không thành kênh nhắn tin thứ hai
    bên cạnh Zalo.
  - **12/9, HỘI THOẠI với Trợ lý KHKD.** Đây là vế "không chat" — vế nặng hơn
    hẳn — và Ngô Phú Cường bỏ nó có chủ đích, sau khi tôi nêu rõ nó là một
    nguyên tắc gốc chứ không phải một chi tiết kỹ thuật: *"Loại bỏ các rào cản
    N1, N2 bạn khảo sát và cung cấp một Agent hữu dụng cho học viên."*

    **Phần N1 còn nguyên giá trị và PHẢI giữ:** ứng dụng vẫn KHÔNG có chat
    NGƯỜI-VỚI-NGƯỜI. Trợ lý là hội thoại giữa một học viên và một công cụ,
    không phải chỗ nhóm bàn bạc với nhau — không @ ai được, không nhóm nào
    đọc được phiên của nhóm khác, và bàn bạc vẫn ở Zalo. Bao giờ có người xin
    "cho cả nhóm cùng chat trong một phiên" thì đó là mở lại N1 thật sự, và
    là một quyết định KHÁC, phải hỏi lại.
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

  **Cập nhật 12/9: LẦN NÀY THÌ CÓ — Trợ lý KHKD giữ một bản sao hướng dẫn của
  giảng viên**, chép vào `worker/src/tro-ly/giao-trinh.js` và vào cột
  `plan_sections.requirement` của cả 10 nhóm. Ngô Phú Cường quyết sau khi tôi
  nêu rõ đúng vế này của N2. Ba điều làm nó khác hẳn chuyện upload slide, và
  **cả ba phải còn đúng thì quyết định này mới còn đúng**:
  - Chép **chữ**, không chép **tệp**. Không có file nào của giảng viên nằm
    trên máy chủ; thứ được chép là 1.698 ký tự YÊU CẦU (chữ đỏ trong bản Word)
    — thứ vốn dĩ phải nói cho học viên biết để họ làm bài, không phải tài sản
    giảng viên đem đi bán.
  - **KHÔNG chép case mẫu RiVita** (37.448 ký tự chữ đen) nguyên văn. Chỉ tám
    đoạn rút gọn làm ví dụ về HÌNH DẠNG một phần bài tốt. Đó mới là phần có
    thể coi là tài sản.
  - Bản sao ấy **hiện công khai cho chính học viên đọc** ở tab Bài, không nấp
    trong prompt. Học viên bị chấm bằng thước nào thì nhìn thấy đúng thước ấy
    — và `kiem-tro-ly.mjs` so từng ký tự hai bản để hai bên không lệch nhau.

  Mục "Đường dẫn" và việc **không upload file** vẫn KHÔNG đổi gì cả.
- **N3 — Ứng dụng không giữ tiền.** Tiền vào thẳng tài khoản người thu.
- **N4 — Tự giác là chính.** Không xác minh email, không OTP, không đối soát.
- **N5 — Chính chủ tự sửa được thông tin của mình**, không qua ai duyệt.
- **N6 — Dữ liệu nhóm cách ly.** Nhóm 8 không đọc được gì của nhóm 6. → **đã lệch
  có chủ ý HAI LẦN**, cùng một phân định, Ngô Phú Cường quyết cả hai:
  - **28/8, cho DANH BẠ.** N6 bảo vệ *việc của nhóm* — sổ thu, bài tám phần,
    thông báo nội bộ — chứ không phải danh tính cá nhân. Danh bạ không đụng thứ
    nào trong số đó.
  - **5/9, cho GIAO THƯƠNG.** *"Cơ hội giao thương công khai là thứ giá trị tồn
    tại sau khoá học. Nên bạn có thể bỏ qua các quy định trước (việc ghép nhóm
    chỉ để làm bài tập)."* Cùng lý lẽ, nối dài thêm một bước: bài tập hết hạn
    26/9, quan hệ làm ăn thì không. Và thêm một mức nữa mà danh bạ không có —
    ra khỏi tên miền, ai cũng đọc được — nên mức ấy phải chính chủ tự bật.

  Mọi đường khác GIỮ NGUYÊN N6 nguyên vẹn; đừng lấy hai chỗ này làm tiền lệ để
  mở thêm. Quỹ, bài 8 phần, thông báo nhóm, sổ thu, tư liệu nhóm — không đụng.
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
cp .dev.vars.example .dev.vars     # RP_ID=localhost; SMTP và LLM_BASE_URL trỏ loopback
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
- **`api.deepseek.com` cũng vậy** — log dev nói nguyên văn `HTTP 403 Host not
  in allowlist`. Nhưng khác `img.vietqr.io`, lượt gọi này **TREO** chứ không
  hỏng ngay: request treo tới khi workerd cắt kết nối và bộ kiểm chết với
  `UND_ERR_SOCKET: other side closed`. Vì vậy `.dev.vars` phải trỏ
  `LLM_BASE_URL` vào cổng ĐÓNG `127.0.0.1:2526` — cùng cách chữa đã dùng cho
  `SMTP_HOST`. **Hệ quả: không lượt hỏi đáp THẬT nào kiểm được ở đây.**
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
- `tro_ly_phien` / `tro_ly_tin` / `cai_dat` (migration 0038) — Trợ lý KHKD.
  SRS viết trước khi có tính năng này, và chính nó là chỗ lệch N1/N2 lớn nhất
  (xem mục riêng). `cai_dat` là bảng cấu hình chạy-thời-gian ĐẦU TIÊN của dự
  án: mọi tính năng trước đều miễn phí nên không cần công tắc tắt gấp.

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

**Cập nhật 6/9 — đo trên D1 thật, đây là con số quyết định:**
`so_dang_ky = 2 · da_tung_gui_ok = 0 · loi_gan_nhat = null`. Chỉ **2/146 người**
đã bật, `last_ok_at` của cả hai đều NULL, và không có lỗi nào — tức chưa lần
nào THỬ gửi, chứ không phải gửi rồi hỏng. Đường đẩy vẫn giữ (miễn phí, tức
thì), nhưng nó KHÔNG phải là thứ đang báo tin cho lớp và không nên chờ nó
thành như vậy. Đó là lý do có mục "Thư khi có thông báo mới" ở trên.

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

## Thư khi có thông báo mới — đường báo tin thật sự tới được người ta

Thêm 6/9 (migration 0031). Ngô Phú Cường nguyên văn: *"Một ứng dụng chết là có
thông báo mới được đăng trên App nhưng không có notify đến. Tôi muốn gửi mail
để thông báo việc này."*

**Con số làm nên quyết định, đo trên D1 thật ngày 6/9:** thông báo đẩy dựng
xong từ 28/8, khoá VAPID đã đặt, giao diện đã mở nút — mà chỉ **2/146 người
bật**, và `last_ok_at` của cả hai đều NULL: **chưa một gói tin nào từng đi**.
Không lỗi nào cả, chỉ là chưa ai từng kích hoạt. Nói cách khác đăng thông báo
lên ứng dụng xong là không ai biết, trừ khi họ tự mở ứng dụng ra xem. Chấm đỏ
trên tab Hôm nay vẫn chạy trên mọi máy, nhưng nó chỉ báo cho người ĐÃ mở ứng
dụng — mà đó chính là người không cần được báo.

Vẫn nằm trong **lệch có chủ ý của N1** đã chốt ngày 24/8 (thông báo đẩy): thư
này mang đúng một việc — "có tin mới, mở ứng dụng ra xem" — chứ không thành
kênh nhắn tin thứ hai bên cạnh Zalo. Không nút trả lời, không chuỗi hội thoại,
nội dung cắt còn 600 ký tự kèm đường dẫn mở ứng dụng.

### Mặc định BẬT, và vì sao phải có đường tắt

Cột `members.nhan_mail_thong_bao` mặc định `1`. Đây là quyết định có cân nhắc
chứ không phải mặc định cho tiện: **bắt 146 người tự đi bật thì tính năng báo
tin coi như không tồn tại** — đúng bài học của thông báo đẩy vừa đo được.

Nhưng phải có đường tắt, và lý do không phải là lịch sự: ai không tắt được sẽ
bấm **"Báo cáo spam"**, mà việc ấy đánh vào uy tín của CHÍNH tên miền đang gửi
thư **MÃ ĐĂNG NHẬP**. Mã đăng nhập mới là thứ sống còn. Mất đường ấy vì một
thông báo phiền là đổi một thứ thiết yếu lấy một thứ tiện lợi.

Công tắc là của **chính chủ** (N5): `PUT /api/me/mail-thong-bao`, dùng phiên,
không nhận `member_id` trong thân — không có chỗ nào để dò, và không ai tắt hộ
được. `/api/home` trả `me.mail_thong_bao` để tab Tài khoản vẽ đúng ngay lần mở
đầu.

### Ô RIÊNG trong tab Tài khoản, đừng nhét chung với ô thông báo đẩy

`veHopMail()` tách hẳn khỏi `veHopThongBao()`. Hàm sau **thoát sớm ở bốn
nhánh**: trình duyệt không hỗ trợ đẩy, máy chủ chưa có khoá VAPID, iPhone chưa
cài lên màn hình chính, và gọi hỏng. Nhét chung thì đúng những người KHÔNG
nhận được thông báo đẩy — tức đúng những người cần thư nhất — lại là người
không bao giờ nhìn thấy công tắc này.

### BCC theo lô, không gửi riêng từng lá

Worker có trần **50 lượt gọi ra ngoài mỗi request** (gói miễn phí), mà đường
đẩy đã ăn vào chính trần ấy. Một thông báo cả lớp là 66 người có email lúc
viết dòng này và sẽ thành 146 — gửi riêng từng lá là vượt trần rồi những người
CUỐI danh sách lặng lẽ không nhận được gì, đúng loại hỏng khó tìm nhất.

`MOI_LO = 40` chứ không phải 50: **Resend chặn ở 50 địa chỉ cho một lượt gọi**
(tính gộp to + cc + bcc), đặt đúng 50 là chạm mép — thêm một dòng ở ô To là cả
lô bị từ chối. Bcc đặt ở **tầng phong bì** (`RCPT TO` với SMTP, trường `bcc`
với Resend), **không** viết vào tiêu đề thư: viết vào tiêu đề là phát tán cả
sổ địa chỉ của lớp cho từng người nhận.

Ô "To" là chính hòm thư gửi (`MAIL_FROM`) — để trống ô To thì nhiều máy chủ từ
chối thẳng.

### SỬA thông báo thì KHÔNG gửi thư lại

Cùng lý do đã áp cho thông báo đẩy ở `patchThongBao` từ 5/9: sửa một dấu phẩy
mà 66 người nhận thư lần nữa thì lần sau họ tắt hết, và mất luôn cả đường báo
tin thật. `patchThongBao` không đụng gì tới đường thư — phúc đáp của nó KHÔNG
có trường `mail`, và `kiem-mail-thongbao.mjs` kiểm đúng chỗ ấy.

### Ma trận phạm vi phải TRÙNG KHÍT với `guiThongBaoDay()`

`chonNguoiNhanMail()` (`routes/thong-bao-mail.js`) và `guiThongBaoDay()`
(`routes/push.js`) phải chọn cùng một tập người: thông báo nhóm chỉ tới nhóm
ấy, thông báo lớp mới tới cả khoá, và không gửi ngược cho chính người đăng.
Lệch một chút là cùng một thông báo mà đường đẩy tới một nhóm người còn đường
thư tới nhóm khác — không chỗ nào báo lỗi, chỉ có người kêu "sao tôi không
nhận được".

Con số người nhận được chọn **đồng bộ** (một truy vấn có chỉ mục) để trả về
ngay trong phúc đáp — giao diện báo "Đã đăng — đang gửi thư cho N người", nên
người đăng biết thư có đi hay không thay vì phải tin suông. Việc GỬI thì chạy
nền trong `ctx.waitUntil`, như đường đẩy: người đăng không ngồi chờ, và gửi
hỏng cũng không làm hỏng việc đăng — thông báo đã nằm trong D1.

### Hai điều CHƯA kiểm chứng được

- **Chưa một lá thư thông báo nào tới hộp thư thật.** Cục bộ không có máy chủ
  thư, nên bộ kiểm chỉ chứng minh được ĐÚNG NGƯỜI được chọn, chưa chứng minh
  được thư ĐI TỚI. Bằng chứng duy nhất đáng tin vẫn là thư nằm trong hộp thư —
  đúng bài học của đường gửi thư ngày 24/8.
- **Resend đếm hạn mức 100 thư/ngày theo LƯỢT GỌI hay theo ĐỊA CHỈ NHẬN?** Nếu
  theo địa chỉ thì một thông báo cả lớp ăn 2/3 hạn mức ngày. Chỉ đo được bằng
  bảng điều khiển Resend sau lần gửi thật đầu tiên. Đây là chỗ VPS của Ngô Phú
  Cường sẽ có ích: đổi nhà cung cấp về sau chỉ là đổi `sendMail()` đi đường
  khác, phần chọn người nhận và chia lô không đụng tới.

## Cảm giác ứng dụng: khoá zoom và chừa chỗ cho thanh trạng thái

Sửa 5/9 sau khi Ngô Phú Cường chụp màn hình ứng dụng đã cài lên màn hình chính:
chữ **"Nhóm 6" nằm chồng lên đồng hồ "16:57"**, dòng "21 ngày đến bảo vệ" chồng
lên cột sóng và pin. Không phép kiểm nào bắt được — không lỗi JS, deploy xanh,
API đúng hết; chỉ thiếu đúng **một dòng CSS**.

**Gốc rễ là hai thẻ meta đánh nhau.** `apple-mobile-web-app-status-bar-style`
đang đặt `black-translucent`, nghĩa là "cho nội dung chui xuống DƯỚI thanh
trạng thái, và đổi chữ giờ/pin sang màu trắng". Cả hai vế đều sai với một ứng
dụng nền SÁNG: nội dung đè lên đồng hồ, mà chữ trắng trên nền sáng thì không
đọc được. Nay là `default`. Cùng lý do, `theme-color` đổi từ `#14161A` (tối)
sang `#F3F3F1` — trùng nền đầu trang, để trên Android thanh trạng thái không
còn là một vệt đen cắt ngang.

**Lề DƯỚI đã chừa từ đầu, chỉ lề TRÊN bị bỏ quên.** `env(safe-area-inset-bottom)`
có mặt ở bốn chỗ (thanh điều hướng, sheet, toast, băng "có bản mới") từ lâu,
nên không ai nghĩ tới việc lề trên chưa bao giờ được chừa. Nay
`header{padding-top:env(safe-area-inset-top)}` — đặt trên `header` chứ không
phải `body`, vì header dán dính (sticky): phần đệm phải đi theo nó thì lúc cuộn
nội dung mới trôi qua BÊN DƯỚI vùng mờ thay vì lòi lên trên thanh trạng thái.

### Khoá zoom: bịt phóng NHẦM quan trọng hơn cấm phóng CHỦ Ý

Ba lớp, xếp theo mức thật sự có tác dụng:

1. **Cỡ chữ ô nhập ≥ 16px** — con số của Apple, không phải thẩm mỹ. Ô nhỏ hơn
   16px thì Safari **tự phóng to cả trang** lúc chạm vào ô rồi KHÔNG tự thu
   lại. Đây là kiểu phóng nhầm khó chịu nhất và đường duy nhất bịt được nó là
   đổi cỡ chữ (15px → 16px). Chạy trên mọi máy.
2. **`touch-action:manipulation`** — bỏ cử chỉ chạm-hai-lần-để-phóng, và bỏ
   luôn 300ms trình duyệt phải chờ xem có cú chạm thứ hai không. Nút bấm nhạy
   hẳn lên; đây là thứ cảm nhận rõ nhất mà không ai gọi tên được. Chạy trên cả
   iOS lẫn Android.
3. **`user-scalable=no, maximum-scale=1`** — chỉ Android nghe. **iOS CỐ TÌNH bỏ
   qua** từ iOS 10 vì lý do trợ năng, không thẻ nào ép được. Trên iPhone chụm
   hai ngón vẫn phóng được — đó là hành vi đúng của hệ điều hành, đừng đi tìm
   cách lách. Muốn bỏ khoá hẳn thì xoá hai tham số này trong `index.html`, một
   dòng.

**Cố ý KHÔNG chặn cử chỉ chụm hai ngón bằng JavaScript** (`gesturestart`
preventDefault). Lớp này ứng dụng không cần: nó không thêm gì cho "cảm giác
ứng dụng" mà lấy mất cái van an toàn cuối cùng của người đọc chữ nhỏ — lớp có
134+ chủ doanh nghiệp tuổi 35–55, và giao diện còn nhiều chữ 10.5–13.5px.
**`/lich` và `/sotay` cũng CỐ Ý không khoá zoom**: đó là trang để ĐỌC, có ảnh
và bảng, phóng to là nhu cầu thật.

### Ba thứ còn lại làm nó thôi giống trang web

- **`overscroll-behavior-y:none`** — bỏ cú nảy cao su ở đầu/cuối trang, và bỏ
  "kéo xuống để tải lại" của Chrome Android. Kéo nhầm một cái là mất nguyên
  trạng thái màn đang mở, nên đây không chỉ là thẩm mỹ.
- **`user-select:none` CHỈ cho khung sườn** (đầu trang, thanh dưới, nút, nhãn).
  Chạm giữ mà bôi đen nhãn nút rồi hiện bảng "Sao chép / Tra cứu" là dấu hiệu
  trang web rõ nhất. **Tuyệt đối không đặt lên `body`**: số điện thoại và email
  trong Danh bạ phải copy được — đó đúng là việc danh bạ sinh ra để làm. Đây là
  phép đối chứng chính của `pw-mobile.mjs`, vì đặt nhầm lên `body` thì màn hình
  trông y hệt mà tính năng mất.
- **`dvh` thay `vh`** cho sheet (90dvh) và màn nhận link (100dvh), giữ `vh` khai
  trước làm đường lui. `vh` tính theo màn hình lúc thanh địa chỉ ĐANG ẨN, nên
  sheet 90vh tràn khỏi màn khi thanh hiện ra và nút Lưu ở đáy bị đẩy ra ngoài.
  Thêm `overscroll-behavior:contain` cho sheet để cuộn hết thì dừng, không kéo
  lây trang nền trôi theo.

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

### Băng chỉ hiện khi app ĐANG MỞ lúc deploy — lỗ hổng vá ngày 12/9

Ngô Phú Cường nhắc rằng anh vẫn cập nhật bằng cách bấm băng "Có bản mới". Tra
lại mã thì lộ ra băng ấy **chỉ hiện khi số hiệu bản đổi GIỮA CHỪNG**:
`refreshHome()` so `HOME.ban` với `BAN_LUC_MO`, mà `boot()` gán thẳng
`BAN_LUC_MO = HOME.ban` ngay lượt nạp đầu — nên mở trang mới thì hai bên không
bao giờ lệch.

Hệ quả: **"đóng app rồi mở lại" là việc DUY NHẤT không có tác dụng** — mà đó
đúng là việc ai cũng nghĩ tới đầu tiên. app.js vẫn là bản cũ trong đệm
(max-age=14400), máy chủ đã ở bản mới, lệch nhau suốt bốn tiếng mà không có gì
báo.

`soiBanLucMo()` vá bằng cách nhớ số hiệu bản ĐÃ CHẠY vào `localStorage`; lần mở
sau số hiệu máy chủ khác số đã nhớ thì hiện băng. Không cần build step.

**CỐ Ý CHỈ HIỆN BĂNG, KHÔNG TỰ TẢI LẠI.** Bản đầu tự gọi `location.reload()` ở
`boot()` — rồi tôi bỏ, vì hai lý do cộng lại: đường khởi động của 146 người mà
lỡ `location.reload()` cư xử lạ một lần là cả lớp nhìn màn hình trắng; và
**môi trường cục bộ KHÔNG kiểm được nhánh ấy** (xem ngay dưới). Thứ không kiểm
được thì đừng đặt vào chỗ nguy hiểm nhất. Băng thì người dùng đã quen, bấm hay
không là quyền họ, và không có nhánh nào tự điều hướng nên không thể lặp.

Sổ chỉ cập nhật ở HAI chỗ: lần đầu mở trên một máy, và lúc bấm băng. Chưa bấm
thì lần mở sau băng vẫn hiện — đúng, vì họ vẫn đang chạy mã cũ.

**Một chỗ môi trường cục bộ không kiểm được, nói thẳng:** `location.reload()`
chạy với `wrangler dev` + khối `[assets]` để lại **một trang trắng** — tài liệu
mới về nhưng thẻ `<script src="/app.js">` không chạy (`typeof window.mdSafe` là
`undefined`). Phép đối chứng dứt điểm: `location.reload()` TRẦN, không kèm
`fetch` gì, cũng trắng y hệt. Nên đây là giới hạn của máy chủ dev, không phải
lỗi mã — băng đã chạy thật trên tên miền từ 25/8. `pw-banmoi.mjs` vì vậy chỉ
khẳng định tới chỗ bấm được và đúng MỘT lượt điều hướng.

Kèm một sửa nhỏ trong `taiLaiVoiMaMoi()` (hàm tách ra để băng và phép soi dùng
chung): `fetch()` giải quyết khi nhận xong PHẦN ĐẦU, thân vẫn đang chảy — nên
phải `.then(r => r.text())` đọc hết thân trước khi `location.reload()`, không
thì lượt tải bị cắt ngang và bản đệm không kịp ghi xong.

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

## Trợ lý KHKD — thứ lớn nhất, và thứ đầu tiên tốn tiền

Thêm 12/9 (migration 0038). Ngô Phú Cường đưa hai tài liệu gốc của giảng viên
(`HD_XD_va_BV_KHKD_cuoi_khoa.pdf`, `Huong_dan_lap_KHKD.docx`) rồi mô tả đúng
thứ anh muốn: *"hỏi đáp phỏng vấn như một trợ lý hướng dẫn phân tích khoảng
trống, hướng dẫn trả lời theo nội dung học viên đưa vào, có thể lưu trữ phiên
hỏi đáp"*. Tôi nêu hai rào cản N1 và N2; anh trả lời: *"Loại bỏ các rào cản
N1, N2 bạn khảo sát và cung cấp một Agent hữu dụng cho học viên"*, rồi làm rõ
phạm vi: *"Agent này sẽ phỏng vấn và dẫn dắt TỪ Ý TƯỞNG đến việc đặt các câu
hỏi và (gợi ý) trả lời cho học viên khi xây dựng KHKD"*.

Xem mục N1 và N2 ở trên cho phần "vì sao được phép". Mục này ghi phần "làm
thế nào", và **những chỗ sai được mà không chỗ nào báo lỗi**.

### Nhà cung cấp là DeepSeek, khoá nằm trong Secret của Cloudflare

`DEEPSEEK_API_KEY`, Ngô Phú Cường tự đặt vào Worker `k3vaceo-api`. API tương
thích khuôn OpenAI nên một lượt `fetch` là đủ — **không thêm thư viện nào**,
đúng nếp đã dùng cho Resend và Web Push (mục 8 SRS). `worker/src/lib/llm.js`
chỉ lo chuyên chở, không biết gì về KHKD; đổi nhà cung cấp về sau là sửa đúng
tệp ấy.

**Tôi KHÔNG kiểm được khoá ấy còn sống hay không từ sandbox này**, và đó là
câu trả lời thẳng cho câu hỏi "test giúp tôi API key đó có work không". Hai
chặn độc lập, cả hai đều không lách được:
1. Sandbox không ra được internet — log dev nói nguyên văn `HTTP 403 Host not
   in allowlist: api.deepseek.com`.
2. Secret của Cloudflare là **ghi-một-chiều**: đặt vào được, đọc ra không.

Ba đường đã dựng để bản THẬT tự trả lời câu ấy, xếp theo mức chắc chắn:
- **`deploy.yml` → bước "Kiểm tra khoá DeepSeek còn sống không"** gọi thẳng
  DeepSeek với `max_tokens: 1` rồi phân loại 200 / 401 / 402 / 429. Bước này
  chỉ chạy khi `DEEPSEEK_API_KEY` **cũng có trong GitHub Secrets** — đặt ở
  Cloudflare thôi thì nó lặng lẽ bỏ qua. Muốn có câu trả lời dứt điểm mỗi
  lượt deploy thì thêm khoá vào GitHub Secrets nữa.
- **`/api/health` → `tro_ly`**: `bat` (khoá đã sang tới Worker chưa) và
  `cong_tac` (công tắc trong D1 có bật không) — **hai câu hỏi khác nhau nên
  hai trường khác nhau**, gộp một thì tắt trợ lý bằng một lệnh d1 mà deploy
  vẫn xanh. **Tuyệt đối không in một mẩu nào của khoá ra đây**, khác hẳn khối
  `push` (khoá VAPID công khai in 8 ký tự đầu được): khoá LLM là khoá TÍNH
  TIỀN. `kiem-tro-ly.mjs` quét chuỗi `sk-` trong phúc đáp để canh đúng chỗ này.
- **`hong_o_buoc` trong mọi phúc đáp 502** — `chua_cau_hinh` · `cau_hinh_sai`
  · `goi_api` · `qua_lau` · `api_tu_choi` · `phuc_dap_la` · `phuc_dap_rong`.
  Đây là đường duy nhất đọc được sự thật khi log Worker câm, đúng bài học đã
  trả giá ở đường gửi thư ngày 24/8. Giao diện in luôn tên bước vào câu báo
  lỗi (`errTroLy` trong `public/app.js`): "Không xong, thử lại" thì học viên
  không nói lại được gì cho tôi.

`LLM_BASE_URL` đổi được đích gọi, **chỉ nhận `https://` hoặc loopback** — chốt
chống GÕ NHẦM chứ không phải chống kẻ tấn công (ai sửa được biến môi trường
thì cũng sửa được chính tệp ấy): một `http://` ra ngoài là gửi khoá tính tiền
qua đường không mã hoá và không chỗ nào báo lỗi. `.dev.vars` trỏ nó vào **cổng
đóng 2526** — cùng lý do `SMTP_HOST` trỏ về loopback, xem mục bộ kiểm bên dưới.
**Bản thật phải để trống**; `kiem-tro-ly.mjs` có một phép canh `wrangler.toml`.

### Nền tri thức: 2.820 token, không RAG, không nhúng vector

Hai tài liệu cộng lại hơn 40.000 ký tự — nhưng **chữ ĐỎ trong bản Word tách
được bằng máy**, và khi tách ra thì phần YÊU CẦU chỉ có **1.698 ký tự** trên
**37.448 ký tự** ví dụ minh hoạ (case RiVita). Đó là phát hiện làm cả thiết kế
này khả thi: nhét trọn nền tri thức vào lời hệ thống, không cần RAG, không cần
cơ sở dữ liệu vector, không cần build step — đúng mục 8 SRS.

`worker/src/tro-ly/giao-trinh.js` giữ ba thứ: `THUOC_CHAM` (thước chấm, ba
lăng kính của ba thầy, **sáu cổng kiểm soát**, sáu lỗi mất niềm tin, kỷ luật
`[FACT]/[ASSUMPTION]/[TARGET]`), `YEU_CAU_PHAN` (yêu cầu tám phần), và
`VI_DU_PHAN` (tám đoạn RiVita **rút gọn**, chỉ để nêu HÌNH DẠNG một phần tốt
— xem mục N2 ở trên cho lý do không chép nguyên văn).

**Bảy phần đánh số của bản Word cộng phần mở đầu khớp ĐÚNG tám `plan_sections`
sẵn có** (migration 0003). Không phải trùng hợp may mắn cần khai thác cẩn thận
— nó có nghĩa là **không phải đổi khung bài 14 ngày trước buổi bảo vệ**, và
mọi thứ đã gắn vào phần bài (tư liệu, phân công, thuyết trình) đứng nguyên.

Năm phần có chữ đỏ chép **NGUYÊN VĂN**; ba phần còn lại (Sản phẩm/khách hàng,
Lộ trình, Rủi ro) bản Word KHÔNG có chữ đỏ nên yêu cầu **suy ra từ thước chấm
trong PDF**, và `giao-trinh.js` đánh dấu `nguyen_van: false` cho đúng ba phần
ấy — không trình bày suy luận của tôi như lời giảng viên.

**Migration 0038 ghi cùng những câu ấy vào `plan_sections.requirement` của cả
10 nhóm.** Việc này có giá trị ĐỘC LẬP: kể cả trợ lý không bao giờ chạy, cả
lớp vẫn đọc được yêu cầu đầy đủ thay vì bản tóm tắt một dòng có từ Đợt 2. An
toàn vì `patchSection` (`routes/plan.js`) **không có nhánh nào ghi vào cột
này** — chỉ nhận `owner_member_id`, `pct`, `note` — nên cập nhật hàng loạt
không đè lên sửa tay của ai.

**Hai bản ấy phải TRÙNG TỪNG KÝ TỰ**, và `kiem-tro-ly.mjs` so từng phần để
bắt lệch. Lý do không phải là sạch sẽ: lệch thì học viên đọc một thước trên
màn hình còn trợ lý chấm bằng một thước khác — bị chấm bằng một cái thước mình
không nhìn thấy, mà không chỗ nào báo lỗi, chỉ có lời khuyên sai.

### Prompt: phần TĨNH lên trước, vì tiền

`worker/src/tro-ly/prompt.js` xếp vai trò → luật cứng → nền tri thức (TĨNH)
rồi mới tới bối cảnh nhóm (ĐỘNG). DeepSeek **tự đệm phần đầu prompt** khi nó
lặp lại y hệt giữa các lượt; đảo thứ tự là mất đệm cho ~2.800 token ở MỌI lượt
của MỌI nhóm. `goiLLM()` trả `token_dem` (`prompt_cache_hit_tokens`) để kiểm
chứng bằng số thật chứ không tin suông — **chưa ai đọc con số ấy trên bản
thật, đó là việc của phiên đầu tiên chạy thật**.

Chín luật cứng, bốn luật đầu lấy thẳng từ tài liệu giảng viên chứ không phải
tôi nghĩ ra (trang 17–22 của PDF). Hai luật đáng nhớ nhất:

- **"MỖI LƯỢT HỎI ĐÚNG MỘT CÂU."** Người đang trả lời là chủ doanh nghiệp bận
  rộn gõ trên điện thoại. Bắn năm câu một lúc là họ trả lời câu đầu rồi bỏ.
- **"SAU MỖI CÂU HỎI, LUÔN KÈM MỘT GỢI Ý CÁCH TRẢ LỜI"** — Ngô Phú Cường yêu
  cầu thêm, và nó suýt mâu thuẫn với luật "không bao giờ tự sinh số liệu".
  Cách hoà: gợi ý là một **khung câu có chỗ trống** (`"Phân khúc của chúng tôi
  là [nhóm khách hàng], quy mô khoảng [số] khách, nguồn: [báo cáo nào]"`), và
  luật ghi thẳng **"TUYỆT ĐỐI KHÔNG điền sẵn con số vào chỗ trống"**. Điền sẵn
  thì học viên chép một con số không phải của mình vào bài đi bảo vệ — đúng
  lỗi "AI bịa nguồn" mà giảng viên xếp vào sáu lỗi làm hội đồng mất niềm tin.

Và luật **"TÌM LỖI VÀ MÂU THUẪN, KHÔNG KHEN BÀI"** là nguyên văn hướng dẫn
dùng AI của giảng viên (trang 19). Một trợ lý khen bài thì tệ hơn không có.

### Giai đoạn tự nhận ra từ D1, không bắt học viên tự khai

`nhanGiaiDoan()` (`routes/tro-ly.js`) đọc dữ liệu nhóm rồi chọn một trong ba
nhiệm vụ — đây chính là vế **"dẫn dắt TỪ Ý TƯỞNG"** của yêu cầu:

| Giai đoạn | Khi nào | Trợ lý làm gì |
|---|---|---|
| `de_tai` | nhóm chưa có `topic_product`/`topic_customers` | dẫn chọn đề tài, hỏi trong nhóm ai đang điều hành doanh nghiệp nào |
| `viet_phan` | mở từ trong một phần bài, hoặc tiến độ trung bình < 70% | lượt đầu SOI KHOẢNG TRỐNG theo sáu cổng, rồi phỏng vấn từng câu |
| `phan_bien` | tiến độ trung bình ≥ 70%, mở cho cả bài | đóng vai hội đồng, hỏi vặn |

Bắt học viên tự khai "tôi đang ở đâu" là bắt họ hiểu một khái niệm của tôi
trước khi nhận được gì — đúng thứ trang `/lich` công khai sinh ra để tránh
("nhận trước, khai sau").

### Bốn chốt chặn, xếp theo GIÁ, rẻ nhất hỏi trước

`congTacVaKhoa()` + `conLuot()` trong `routes/tro-ly.js`. Thứ tự là cố ý —
chỉ khi cả bốn qua mới tiêu tiền:

1. **Công tắc tắt** — `cai_dat.tro_ly_bat`. Bảng `cai_dat` sinh ra cho đúng
   việc này: `deploy.yml` mất khoảng hai phút, quá chậm khi cần dừng gấp. Một
   lệnh `wrangler d1 execute --remote` tắt được tức thì, không cần deploy.
   ```
   UPDATE cai_dat SET gia_tri = '0' WHERE khoa = 'tro_ly_bat';
   ```
2. **Có khoá chưa** — thiếu thì 503, giao diện ẩn HẲN thẻ trợ lý (không bày
   một nút bấm vào là 503).
3. **Trần mỗi người mỗi NGÀY** (40, đổi trong `cai_dat`). **Khoá theo
   `member_id`, KHÔNG theo IP** — cả lớp ngồi chung WiFi hội trường là chuyện
   thường xuyên ở đây (bài học 27/8), khoá theo IP thì người thứ hai trong
   phòng đã hết lượt. `conQuota()` nhận thêm tham số cửa sổ `'-1 day'`; mặc
   định `'-1 hour'` giữ nguyên cho mọi chỗ gọi cũ.
4. **Trần mỗi PHIÊN** (30) — chặn một phiên phình vô hạn, vì mỗi lượt gửi lại
   TOÀN BỘ lịch sử: lượt thứ 50 tốn gấp nhiều lần lượt đầu.

**`ghiNhan` đứng SAU `goi`**, nên một lượt gọi HỎNG không ăn mất lượt của học
viên. `postPhien` cũng ghi dòng phiên **sau** khi gọi xong — đảo lại là mỗi
lần mạng chập để lại một phiên rỗng trong danh sách của nhóm. Cả hai đều có
phép đối chứng riêng.

### N6 vẫn nguyên vẹn: phiên của nhóm khác trả 404, không phải 403

`docPhien()` lọc `group_id` ngay trong truy vấn, nên cả bốn route (đọc / hỏi /
chốt / đóng) trả **404** — 403 là xác nhận id đó có thật (quy ước 6). Và
`postPhien` kiểm `section_id` bằng JOIN `plan_sections → plans` theo
`group_id`: thiếu điều kiện ấy thì Nhóm 6 neo được phiên vào phần bài của
Nhóm 7 — vỡ N6 ngay ở khâu GHI, không đợi tới khâu đọc. Đúng khuôn
`docSectionId()` của Bài↔Tư liệu.

**Phiên là của NHÓM, không phải của cá nhân.** Cả nhóm đọc lại được phiên của
nhau và hỏi tiếp vào đó — bài là việc chung, mà nhóm nào cũng chia nhau viết.

### Chốt bản thảo: ghi thành GHI CHÚ, không ghi vào `plan_sections.note`

`postChot` dựng bản thảo từ chính câu trả lời của học viên rồi ghi một dòng
`links` `kind='TEXT'`, `tag='bai'`, `section_id=…`. **Không** ghi vào
`plan_sections.note`: cột ấy bị `cleanText(body.note, 500)` cắt còn 500 ký tự
và mang nghĩa "ghi chú tiến độ", không phải chỗ chứa một bản thảo. Ghi chú thì
có sẵn 8.000 ký tự, hiện ngay ở tab Bài dưới huy hiệu 📎, và sửa được bằng
thanh B/I đã có từ 8/9 — **không phải viết một màn hình mới nào**.

### Giao diện: bốn điều cố ý

`veHoiThoai()` trong `public/app.js`, CSS ở cuối `public/app.css`.

1. **Câu trả lời của mô hình đi qua CHÍNH `mdSafe()`**, không viết bộ dựng thứ
   hai. Đây là chỗ DUY NHẤT trong ứng dụng mà `innerHTML` nhận chữ của một hệ
   thống NGOÀI; prompt có dặn nó đừng sinh HTML, nhưng "đã dặn rồi" không phải
   chốt chặn — chốt chặn là `mdSafe()` **esc() TRƯỚC rồi mới parse**.
   `pw-tro-ly.mjs` gieo bốn ca độc vào đúng chỗ câu trả lời của trợ lý.
2. **`.tlbox` có thanh cuộn RIÊNG.** `veHoiThoai()` đẩy màn xuống cuối bằng
   `box.scrollTop = box.scrollHeight`; không có `overflow-y` thì đó là một
   lệnh RỖNG, câu vừa gửi nằm ngoài tầm nhìn, và học viên tưởng gửi hỏng.
3. **Nút Gửi khoá lại trong lúc chờ.** Một lượt gọi mất hàng chục giây; không
   khoá thì họ bấm ba lần và tốn ba lượt hạn mức cho một câu hỏi. Kèm chỗ giữ
   chỗ "Trợ lý đang nghĩ…" nhấp nháy — màn hình đứng im mới là thứ làm người
   ta bấm lại.
4. **Ô nhập KHÔNG tự xoá cho tới khi máy chủ nhận xong.** Gửi hỏng mà đã xoá
   thì học viên mất luôn đoạn vừa gõ — trên điện thoại đó là chuyện lớn. Đây
   là phép đối chứng quan trọng thứ hai của `pw-tro-ly.mjs`, và nó có răng
   thật: trong sandbox thì gửi LUÔN hỏng.

**Bong bóng người dùng dùng `--ink` đảo nền, KHÔNG dùng `--go-bg`/`--go`** —
cặp màu ấy trong sản phẩm này có đúng MỘT nghĩa: người thu đã nhận tiền.

### Một lỗi thật bắt được bằng ảnh chụp, không bằng đọc code

`mdSafe()` chỉ nhận tiêu đề tới `###` (`#{1,3}`) — mà **mô hình dùng `####`
thoải mái**, nên một mục `#### Khoảng trống ở cổng 02 SỐ` rơi xuống thành một
dòng chữ có bốn dấu thăng lủng lẳng. Không phép kiểm chuỗi nào thấy; chạy
`pw-tro-ly.mjs` mới thấy. Nay nhận tới `#{1,6}` và **KẸP** ở `h6`
(`Math.min(m[1].length + 3, 6)`) — `#`/`##`/`###` vẫn ra đúng h4/h5/h6 như cũ.

### Số hiệu phần bài lệch một nấc — lỗi thứ hai, bắt được khi dựng demo

Sửa 12/9, vài giờ sau khi phát hành. `plan_sections.ord` chạy 0..7 với **ord=0
là phần MỞ ĐẦU** ("Sản phẩm và khách hàng mục tiêu"), nên bảy phần ĐÁNH SỐ
trong bản Word của giảng viên là ord 1..7 — và giao diện in thẳng `s.ord`, bỏ
số ở ord=0 (`public/app.js`). Trợ lý thì viết `ord + 1` ở **ba chỗ**: tiêu đề
phiên (`routes/tro-ly.js`), nhãn tám phần trong bối cảnh nhóm và tên bản thảo
lượt chốt (`tro-ly/prompt.js`).

Hệ quả: học viên mở **"Phần 1 · Nghiên cứu Marketing"** ở tab Bài, trợ lý dẫn
dắt bằng **"Phần 2"**, và bản thảo chốt xuống Ghi chú cũng mang sai số hiệu.
Không chỗ nào báo lỗi — cùng họ với phép kiểm "D1 phải trùng từng ký tự với
`giao-trinh.js`": bị chấm bằng một cái thước mình không nhìn thấy.

Nay một hàm duy nhất `nhanPhan(ord, ten)` trong `tro-ly/prompt.js` giữ quy tắc
đánh số, cả ba chỗ gọi nó. `kiem-tro-ly.mjs` có phép 2b canh hai chiều: số của
trợ lý phải khớp số giao diện cho tám dòng THẬT trong D1, **và** `public/app.js`
phải vẫn in `s.ord` trần — đổi cách đánh số ở giao diện thì phép kiểm đỏ, để
hai bên cùng được sửa chứ không lệch nhau trong im lặng.

Phiên nào mở TRƯỚC lượt deploy này giữ nguyên tiêu đề cũ (chỉ là cái nhãn, nội
dung không sai) — không viết migration sửa lại vì bảng `tro_ly_phien` trên bản
thật lúc sửa vẫn chưa có phiên thật nào.

### Bộ kiểm — và điều nó KHÔNG chứng minh được

`kiem-tro-ly.mjs` (máy chủ) + `pw-tro-ly.mjs` (giao diện), mỗi bộ chạy hai
lượt: bình thường và `tat`. Xem `scripts/kiem/README.md`.

**Nói thẳng cái chưa kiểm chứng được:** sandbox không ra được internet, nên
**chưa một lượt hỏi đáp THẬT nào từng chạy**. Bộ kiểm chứng minh được mọi thứ
đứng TRƯỚC lượt gọi ra ngoài, cộng nhánh HỎNG của chính nó. Nó KHÔNG chứng
minh được rằng mô hình trả lời đúng, hay khoá còn tiền. Bằng chứng duy nhất
đáng tin là một phiên thật trên tên miền — đúng bài học của đường gửi thư
ngày 24/8 ("thư nằm trong hộp thư, không phải một dòng log nói rằng nó đã đi").

Vì vậy `.dev.vars` trỏ `LLM_BASE_URL` vào **cổng đóng 2526**: `fetch` tới
`api.deepseek.com` trong sandbox không hỏng, nó **TREO** — request treo tới
khi workerd cắt, bộ kiểm chết với `UND_ERR_SOCKET: other side closed`, và
không phép nào đọc được `hong_o_buoc`. Đúng cái bẫy đã ghi cho SMTP, đúng
cách chữa đã dùng ở đó.

### Ba việc phải làm trên bản thật, không làm được ở đây

1. **Mở một phiên thật và đọc nó** — đây là phép nghiệm thu duy nhất. Nếu 502
   thì `hong_o_buoc` nói ngay hỏng ở đâu.
2. **Thêm `DEEPSEEK_API_KEY` vào GitHub Secrets** (ngoài Cloudflare) để bước
   kiểm khoá trong `deploy.yml` chạy mỗi lượt deploy.
3. **Đọc `token_vao`/`token_ra`/`token_dem` trong bảng `tro_ly_phien`** sau
   vài phiên thật: biết đang tốn bao nhiêu, và biết việc xếp phần TĨNH lên
   trước có thật sự ăn đệm hay không. Trần 40 lượt/người/ngày đặt theo phỏng
   đoán, chưa theo số đo — chỉnh bằng một dòng `cai_dat`, không cần deploy.

## Xin đổi nhóm — tự phục vụ

Thêm 9/9 (migration 0037). Ngay sau khi chuyển tay Trương Thị Ngọc Anh sang
Nhóm 6 (migration 0036, Nhóm 4 → Nhóm 6 — viết migration thủ công vì chưa có
đường nào khác), Ngô Phú Cường hỏi thẳng: "Có thể thêm chức năng xin đổi nhóm
có được không, ai là phê duyệt thì phù hợp." Muốn việc lặp lại này tự chạy
được, không phải chờ tôi soi D1 rồi viết migration tay mỗi lần có người muốn
chuyển nhóm.

### Ai duyệt — đã hỏi trực tiếp, không tự đoán

Ba phương án đưa ra qua AskUserQuestion: Ban cán sự lớp duyệt, trưởng/phó nhóm
ĐÍCH duyệt, hay cần cả hai nhóm (đi lẫn đến) cùng đồng ý. Ngô Phú Cường chọn:
**TRƯỞNG/PHÓ NHÓM ĐÍCH DUYỆT**. Lý lẽ khớp với cách quyền đã phân trong toàn
bộ ứng dụng:

- Nhóm ĐÍCH là bên duy nhất chịu hậu quả thật — sĩ số đổi, phải chia lại phần
  bài, thêm một suất thuyết trình. Nhóm ĐI không mất gì mà cũng không có
  quyền giữ người ở lại (N5 — chính chủ tự quyết, không ai có quyền cấm một
  người muốn rời nhóm).
- Không cần Ban cán sự lớp: việc nội bộ giữa hai nhóm không cần leo lên cấp
  lớp mỗi lần, đúng tinh thần "trưởng/phó nhóm tự vận hành nhóm mình" xuyên
  suốt từ Đợt 1 (cơ cấu, phần bài, ngừng tham gia đều vậy).
- Không cần HAI nhóm đồng ý: thêm một bên duyệt là thêm một chỗ đơn có thể
  kẹt vô thời hạn nếu nhóm đi không màng trả lời. Nhóm đi chỉ CẦN BIẾT, không
  cần ĐỒNG Ý — `logActivity()` ghi vào feed "Hoạt động gần đây" của CẢ HAI
  nhóm khi duyệt xong, dùng lại nguyên hạ tầng có sẵn (`routes/home.js`),
  không dựng đường báo tin mới.

### Bảng `yeu_cau_doi_nhom` và chốt chặn ở tầng DB

`migrations/0037_yeu_cau_doi_nhom.sql`. `trang_thai` là `cho_duyet | da_duyet
| tu_choi | da_huy`; `tu_group_id` chụp lại nhóm hiện tại LÚC NỘP ĐƠN, dùng để
phát hiện đơn đã lỗi thời nếu group_id người xin đổi khác đi giữa lúc nộp và
lúc duyệt (`postDuyetDoiNhom` so `member.group_id` hiện tại với `yc.tu_group_id`,
lệch thì trả `nhom_hien_tai_da_doi` thay vì ghi đè lung tung).

`ux_doinhom_dang_cho` là UNIQUE INDEX MỘT PHẦN (`WHERE trang_thai =
'cho_duyet'`) — mỗi người chỉ một đơn CHỜ DUYỆT tại một thời điểm, chặn ở
tầng DB nên không có khe hở giữa lúc kiểm và lúc ghi (bấm nhanh hai lần, hay
hai tab). `postDoiNhom` bắt lỗi UNIQUE bằng `String(err).includes('UNIQUE')`,
đúng khuôn `postInviteClaim`/`patchMember` đã dùng cho `ux_member_email`.

Không lưu `cohort_id` riêng — `member_id`/`tu_group_id`/`den_group_id` đều đã
neo vào đúng một cohort qua `members`/`groups`, đúng khuôn `push_subscriptions`
(migration 0012) đã bỏ cột này vì lý do tương tự.

### Dùng LẠI `chucDangGiu()`, không viết bản sao — và kiểm HAI LẦN

`routes/members.js` xuất `chucDangGiu()` (trước chỉ dùng nội bộ cho
`postNgungThamGia`) để `routes/doi-nhom.js` import lại nguyên hàm — hai bản
sao thì sớm muộn lệch nhau, đúng bài học đã ghi nhiều lần trong tệp này cho
các hàm dùng chung khác (`cheEmail`, `soHopLeTuHoSo`).

Chốt chặn "đang giữ chức thì không xin đổi nhóm được" kiểm HAI LẦN: một lần ở
`postDoiNhom` (chặn sớm, giao diện không bày ra một form sẽ bị từ chối), một
lần NỮA ở `postDuyetDoiNhom` ngay trước khi ghi — phòng đua: ai đó có thể đã
gán chức cho người này SAU khi họ nộp đơn, trong lúc đơn còn chờ duyệt. Thiếu
lần kiểm thứ hai thì cơ cấu có thể đứng tên một người vừa rời nhóm, đúng lỗi
đã trả giá ở "ngừng tham gia" (mục trên), nay áp lại cho một đường ghi khác.

### N6: sai nhóm nhận 404, không phải 403 — giống hệt khuôn cũ

`postDuyetDoiNhom`/`postTuChoiDoiNhom` chỉ kiểm ĐÚNG một điều kiện đủ:
`isGroupOfficer(env, me.id, yc.den_group_id)`. Officer của một nhóm KHÁC (kể
cả chính nhóm ĐI) cố duyệt/từ chối một đơn không nhắm vào nhóm mình nhận
`404 not_found`, không phải 403 — 403 là xác nhận id đó có thật (quy ước 6
CLAUDE.md), đúng khuôn `docSectionId()`/`docGhiChuId()` đã dùng cho Bài↔Tư
liệu và đính kèm Ghi chú. `kiem-doi-nhom.mjs` đối chứng bằng một officer của
nhóm thứ ba, thử CẢ HAI route (thiếu điều kiện ở một trong hai là hở).

### Phần bài phải nhả ra — đúng lỗi cũ, đường ghi mới

Duyệt xong thì `plan_sections.owner_member_id`/`present_member_id` ở nhóm CŨ
phải về NULL, đúng nguyên khuôn `postNgungThamGia` — một phần mang tên người
đã sang nhóm khác trông như đã có người làm, tệ hơn để trống.
`reset-doi-nhom.sh` gán sẵn cho người xin giữ phần bài cuối (ord=7) của Nhóm
6 TRƯỚC khi nộp đơn, rồi `kiem-doi-nhom.mjs` xác nhận `nha_phan` trong phúc
đáp duyệt KHÔNG rỗng và phần ấy đã về `owner_member_id = null` qua
`GET /api/plan` — không chỉ tin suông vào con số trả về.

### `cua_toi` — trạng thái là lời báo, không cần cờ "đã xem" riêng

`GET /api/doi-nhom` trả `cua_toi` = đơn GẦN NHẤT của người gọi có
`trang_thai <> 'da_huy'` — cố ý loại `da_huy` vì đó là chuyện chính người này
vừa tự bấm, không có gì để nhắc lại. Hệ quả, đã kiểm chứ không suy đoán: huỷ
một đơn xong thì `cua_toi` KHÔNG lùi về `null` nếu còn một đơn `tu_choi`/
`da_duyet` cũ hơn — nó lùi về đúng đơn ấy, vì đó vẫn là trạng thái đáng nói
nhất. Không cần thêm cột "đã xem": chỉ cần loại đúng một giá trị khỏi diện
xét, giao diện luôn vẽ đúng theo `trang_thai` hiện có.

Sheet "Xin đổi nhóm" (`openXinDoiNhom()`, `public/app.js`) LUÔN đọc lại
`/api/doi-nhom` trước khi vẽ (quy ước 3 CLAUDE.md). Đơn đang chờ ưu tiên hiện
TRƯỚC "đang giữ chức": huỷ đơn (`postHuyDoiNhom`) không đòi hỏi gì về chức
vụ, nên nếu ai đó vừa được gán chức sau khi đã nộp đơn thì vẫn phải thấy
đường huỷ, không bị chặn đứng ở một màn chỉ có nút "Đã hiểu".

### Officer nhóm đích thấy đơn ở CHÍNH tab Nhóm, không phải sheet riêng

`veDonDoiNhomVao()` vẽ thẳng vào tab Nhóm (cạnh mục "Đã ngừng tham gia"),
cùng khuôn `drawJoinRequests()` đã dùng cho xin vào nhóm ở wizard: duyệt bấm
một phát, từ chối mở một sheet nhỏ để ghi lý do. Khác `join_requests` (người
xin CHƯA có phiên nên không có gì để đọc lại): người xin đổi nhóm đã đăng
nhập, nên `ly_do_tu_choi` được ghi lại và chính họ đọc được qua GET của
mình — không bắt chước máy móc "decideJoinRequest không nhắn gì khi từ chối".

### Bộ kiểm — một bẫy tự vấp ngay lượt chạy lại đầu tiên

`kiem-doi-nhom.mjs` (9 phép đối chứng, kể cả N6 và phần bài ở trên) và
`pw-doi-nhom.mjs` (giao diện, hai phiên trong cùng một trình duyệt: người xin
và officer nhóm đích) đều xanh ngay lượt đầu. Nhưng `reset-doi-nhom.sh` lúc
đầu KHÔNG trả `group_id` của người xin (Nguyễn Thị Thu Hương, mượn từ fixture
`reset-moi.sh`) về Nhóm 6 trước khi seed lại — bộ kiểm lượt MỘT thật sự
CHUYỂN NHÓM cô ấy sang Nhóm 7 (đúng điều nó kiểm), nên lượt HAI mở đầu với cô
ấy đã ở Nhóm 7, và mọi bước sau đó đổ domino: nộp lại "đến Nhóm 7" hoá ra là
"đang ở nhóm này rồi", "đến Nhóm 6" (nhóm cũ) lại thành hợp lệ. Đúng bài học
đã ghi ở mục 3 của "Mười chín phép đối chứng đáng giữ nhất"
(`scripts/kiem/README.md`): bộ kiểm phải chạy lại được nhiều lần, và một bộ
kiểm THẬT SỰ đổi trạng thái (không chỉ đọc) thì reset phải trả trạng thái ấy
về gốc, không chỉ dọn bảng phụ.

Hai officer dùng để duyệt (`Kiểm Đổi Nhóm Đích` ở Nhóm 7, `Kiểm Đổi Nhóm
Khác` ở Nhóm 8) đều dựng tay, không mượn ai có thật — kể cả Nhóm 8 vốn đã có
Lưu Minh Tiến (`truong_nhom` thật, migration 0021): phép kiểm N6 không nên
phụ thuộc "ai đang giữ vai gì" ngoài đời, vai thật có thể đổi bất cứ lúc nào
mà bộ kiểm không hay.

### Chưa kiểm chứng được

Chưa ai dùng tính năng này với dữ liệu thật. Nhóm 7 hiện chưa có officer
thật nào trong 10 nhóm (chỉ Nhóm 6 và Nhóm 8 có) — đơn đầu tiên xin vào Nhóm
7 ngoài đời sẽ không có ai duyệt được cho tới khi nhóm đó tự vận hành hoặc có
người được gán vai qua `PUT /api/officers`.

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

## Thông báo: link bấm được, sửa lại được, và thanh B/I/gạch đầu dòng

Thêm 5/9 sau khi Ngô Phú Cường gửi ảnh một thông báo của Nhóm 6 có dán nguyên
si đường dẫn Outline dài 66 ký tự: **đọc được mà bấm không được**, đăng rồi thì
không sửa lại được, và không có cách nào làm đậm hay xuống gạch đầu dòng.

**Không viết bộ dựng thứ hai.** Thông báo nay đi qua đúng `mdSafe()` đã có sẵn
cho Tư liệu dạng Text — cùng một hàm, cùng bộ kiểm XSS (`pw-tulieu-text.mjs`),
chỉ thêm lớp CSS `.mdview.nho` cho vừa thẻ nhỏ. Viết một bộ quy tắc riêng cho
thông báo là có ngày hai bên lệch nhau ở đúng chỗ nguy hiểm nhất.

### mdSafe() nay tự nhận URL dán thẳng — chỗ dễ hở nhất của cả hàm

Không ai gõ cú pháp `[chữ](url)` khi dán link vào thông báo. Nhưng đây là quy
tắc **DUY NHẤT dựng thuộc tính `href` từ chữ người dùng gõ mà không có cú pháp
bao quanh làm hàng rào**, nên ba điều phải giữ nguyên:

1. **`esc()` vẫn chạy TRƯỚC.** Nhờ vậy `"` đã thành `&quot;` từ lâu trước khi
   quy tắc này chạy: URL có dấu nháy kép nằm yên trong giá trị thuộc tính chứ
   không cắt ra ngoài được. Ca độc `https://x.example.com/a"onmouseover=…` có
   phép kiểm riêng, và phép kiểm ấy **kích sự kiện `mouseover` thật** — không
   kích thì nó xanh mà chẳng chứng minh được gì, vì mã độc nấp trong thuộc
   tính chỉ nổ khi có người rê chuột qua.
2. **Chỉ bắt `https://`.** `javascript:` dán thẳng không khớp cú pháp nên trơ
   như cũ — không có nhánh xử lý riêng thì không có gì để quên xử lý.
3. **Cú pháp `[chữ](url)` phải cất vào kho TRƯỚC, rồi mới quét URL trần.** Để
   nguyên thẻ `<a>` vừa dựng trong chuỗi thì bước quét sau tóm luôn địa chỉ nằm
   trong `href` rồi lồng `<a>` vào giữa `<a>`. Dùng dấu giữ chỗ `\u0000` — và
   vì thế phải quét sạch `\u0000` khỏi văn bản gốc ở đầu hàm, không thì người
   dùng chèn được HTML tuỳ ý qua chính dấu giữ chỗ ấy.

Thêm hai chi tiết nhỏ mà thiếu thì lộ ngay: **nhãn hiện ra rút gọn còn 38 ký
tự** (href giữ nguyên đường dẫn đầy đủ) — link Outline dài 66 ký tự để nguyên
là tràn thẻ; và **dấu câu cuối câu không được nuốt vào link**, "xem tại
https://x.vn/a." thì dấu chấm là của câu văn, nuốt vào là bấm ra 404. Không cắt
dấu `;` vì URL đã esc() mang `&amp;` ở cuối.

### Sửa thông báo: `PATCH /api/thong-bao/:id`

Trước đó chỉ có gỡ xuống rồi đăng lại — mà làm vậy thì mất "mới", chấm đỏ nổi
lên lần nữa, và ai bật thông báo đẩy lại bị báo thêm một lần cho cùng một tin.

Hai điều **CỐ Ý không cho**:
- **Đổi cấp (nhóm ↔ lớp)** — cùng lý do `PATCH /api/links/:id` không cho đổi
  `scope`: biến thông báo nội bộ thành của cả lớp là đem việc nhóm cho 146
  người đọc, mà nhật ký chỉ ghi "đã sửa" (N6). Giao diện cũng bỏ hẳn ô chọn.
- **Gửi lại thông báo đẩy** — sửa một dấu phẩy mà 134 điện thoại kêu lần nữa
  thì lần sau người ta tắt thông báo đẩy, mất luôn cả đường báo tin thật.

Chốt chặn N6 giống hệt `deleteThongBao`: lọc theo phạm vi ĐỌC trước, nên thông
báo của nhóm khác trả **404 chứ không phải 403** — 403 là xác nhận id ấy có
thật. `pw-thongbao.mjs` kiểm đúng con số 404 này, vì phép kiểm chỉ hỏi "có bị
chặn không" sẽ đậu cả với 403.

### Thanh định dạng: chèn dấu Markdown, KHÔNG dùng contenteditable

`ganThanhSoan()` (`public/app.js`) chèn `**`, `*`, `- `, `[chữ](url)` vào ô
`<textarea>`. **Thứ lưu xuống D1 phải là văn bản thuần** — đó chính là điều
kiện để `mdSafe()` esc() trước rồi mới dựng thẻ. Lưu HTML người dùng gõ ra là
mở lại đúng lỗ XSS mà cả bộ kiểm kia sinh ra để canh.

Gạch đầu dòng làm theo **DÒNG** chứ không theo vùng bôi đen: bôi giữa chừng hai
dòng rồi chèn `- ` vào đúng vị trí con trỏ thì ra dấu gạch nằm lửng giữa câu.

Kèm **ô xem trước dựng bằng chính `mdSafe()`** — không ai trong lớp biết
Markdown là gì, bấm B rồi thấy ngay chữ đậm hiện ra ở dưới thì không phải giải
thích cú pháp, và người soạn thấy đúng thứ người đọc sẽ thấy.

### Đính kèm Ghi chú vào thông báo (migration 0034)

Thêm 8/9. Ngô Phú Cường hỏi thẳng: "trong thông báo gán Ghi chú vào như thế
nào?" — tra ra CHƯA có đường nào. Soạn thông báo trước đó chỉ nhắc được bằng
**chữ thường** ("xem thêm ở tab Lịch, tên ghi chú là …"), không bấm được,
người đọc phải tự đi tìm — đúng cảnh vừa vá cho URL dán thẳng ở trên, chỉ khác
đối tượng là một Ghi chú nội bộ chứ không phải một địa chỉ https.

**Cột đặt ở phía `thong_bao` (`ghi_chu_id INTEGER REFERENCES links(id)`), không
phải thêm `links.thong_bao_id`.** Khác hẳn `links.buoi_id`/`links.section_id`
— hai cột ấy nói "dòng `links` này THUỘC VỀ buổi/phần nào" (sở hữu), còn cột
mới nói "thông báo này THAM CHIẾU ghi chú nào" (không sở hữu). Một Ghi chú có
thể đã gắn sẵn vào một buổi học từ trước, độc lập với việc có thông báo nào
trỏ tới nó hay không — và **CỐ Ý không hạn "chỉ ghi chú chưa gắn buổi/phần bài
nào"**: ca thật nhất sinh ra tính năng này là NGƯỢC LẠI, Thư mời kiến tập 11/9
(migration 0032) đã gắn sẵn vào buổi 11/9, và chính vì đã có sẵn ở đó nên mới
muốn thông báo cũng trỏ tới, không phải chép nội dung lần hai.

**`docGhiChuId()` (`routes/lich.js`) kiểm HAI thứ, không chỉ một:**
1. **Phạm vi (N6)** — `(scope = 'class' OR group_id = ?)` theo nhóm của NGƯỜI
   SOẠN. Đính kèm ghi chú của nhóm khác trả 404 chứ không phải 403, đúng chốt
   N6 đã dùng xuyên suốt.
2. **Loại** — `kind = 'TEXT'`. Một liên kết Drive/Sheet không phải Ghi chú,
   dù cùng `scope='class'` mà người soạn đọc được thoải mái, vẫn bị chặn vì
   sai LOẠI chứ không phải sai PHẠM VI — hai nhánh lỗi khác nhau, `kiem-
   thongbao-ghichu.mjs` giữ ca kiểm riêng cho từng nhánh.

**Đọc lại (`/api/home`) lọc theo phạm vi của NGƯỜI XEM, không phải người
đăng** — cùng nguyên lý `layTuLieuTheoBuoi()` đã dùng cho tư liệu gắn buổi.
Một thông báo cấp lớp đính kèm ghi chú riêng của Nhóm 6 là tổ hợp HỢP LỆ
(`docGhiChuId` không cấm — cùng lý lẽ đã dùng cho Bài↔Tư liệu cấp lớp): người
Nhóm 7 vẫn đọc được thông báo, chỉ riêng phần ghi chú đính kèm lặng lẽ không
hiện với họ. Không chặn tổ hợp này, giống hệt cách đã quyết cho phần bài.

**Giao diện dùng lại NGUYÊN `veTuLieuGan()`**, không viết bộ vẽ thứ hai:
`/api/home` định dạng lại `thong_bao[].tu_lieu` đúng khuôn dữ liệu mà hàm ấy
đã đọc cho buổi học/phần bài, nên ghi chú đính kèm hiện dưới thông báo bằng
đúng dòng "Ghi chú · <tên> ›" quen thuộc, bấm vào mở đúng sheet — không có
JS mới nào phải viết ở phía hiển thị.

**Thanh B/I/gạch đầu dòng và ô xem trước cũng gắn vào CHÍNH sheet Sửa ghi chú
và Gắn Tư liệu** (`openLinkEdit`/`openLinkAdd`, dùng lại `ganThanhSoan()`) —
trước đó chỉ có ở sheet soạn thông báo, còn ô soạn Ghi chú vẫn là textarea
trơn dù cùng dùng `mdSafe()` để hiển thị. Ngô Phú Cường hỏi riêng "Việc sửa
ghi chú có được không?" trước khi có tính năng này; trả lời khi đó là "được
nhưng chưa có thanh định dạng" — nay đã có, cùng một hàm cho cả ba nơi soạn
Markdown trong ứng dụng (thông báo, sửa ghi chú, tạo ghi chú mới).

**Một N6 thật, có từ trước, phát hiện tình cờ khi thêm cột này:** `getLich()`
(route `GET /api/lich`, không gác theo vai) trả về **toàn bộ** `thong_bao`
của khoá, thiếu điều kiện `(group_id IS NULL OR group_id = ?)` — bất kỳ ai
đăng nhập gọi thẳng route này cũng đọc được thông báo nội bộ của MỌI nhóm.
Giao diện không lộ ra vì `layLichDayDu()` (nơi duy nhất gọi route này, để
dựng ô chọn buổi cho sheet Gắn Tư liệu) chỉ đọc `.lich_hoc`, chưa từng đọc
`.thong_bao` — nhưng quy ước 6 là kiểm ở máy chủ, không tin sự im lặng ấy của
giao diện. Đã vá cùng lúc, khớp điều kiện với `/api/home` và
`postThongBaoDaXem`.

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

## Giao thương — chỗ duy nhất N6 được bỏ, và vì sao

Thêm 5/9 (migration 0016). Tab **Giao thương** trong ứng dụng, cộng trang công khai
`k3vaceo.cuongngo.app/giao-thuong`. Ngô Phú Cường quyết bỏ N6 cho riêng phạm vi
này: *"việc ghép nhóm chỉ để làm bài tập"* — mà bài tập hết hạn 26/9.

**Hạt giống đã nằm sẵn trong DB từ Đợt 1, không phải làm mới từ đầu.** Bảng
`member_profile` (migration 0001) đã có đúng bốn ô `sells_what` · `sells_to` ·
`needs` · `offers`, và vòng tròn 0–4 ở tab Nhóm chính là đếm chúng. Thứ thiếu
suốt bốn đợt chỉ là một màn tổng hợp: `listMembers` khoá cứng
`WHERE group_id = ?`, nên "bán gì" của 120 người ngoài nhóm là vô hình, và
ngay trong nhóm cũng phải bấm mở từng người mới thấy.

### Hai mức lộ, đừng bao giờ gộp làm một

| `cong_khai` | Ai xem được | Cần gì để bật |
|---|---|---|
| `0` (mặc định) | 134 người đã đăng nhập | không cần gì — đây là chỗ N6 được bỏ |
| `1` | cả internet, Google index được | **chính chủ tự bật**, không ai bật hộ |

Cột `hien_lien_he` là công tắc thứ hai, tách riêng: nhiều người muốn giới
thiệu việc mình làm nhưng chưa muốn số điện thoại nằm trên trang ai cũng tải
về được. Gộp hai thứ làm một thì phần lớn chọn "thôi không bật".

**Vì sao mức thứ hai vẫn phải xin phép, dù đã được bảo là bỏ quy định:** không
phải để giữ N6 — mà vì (1) không lùi được, gỡ khỏi D1 không gỡ được khỏi bộ
nhớ đệm của Google; (2) lý do sản phẩm mạnh hơn lý do nguyên tắc: 30 gian hàng
do chính chủ bật, số đúng, người đang chờ điện thoại reo — đáng giá hơn hẳn
134 gian hàng dựng từ dữ liệu cũ của Ban tổ chức mà chủ nhân không biết mình
đang ở đó. Người lạ gọi trúng số sai một lần là không quay lại trang nữa.

`/giao-thuong/` **CỐ Ý KHÔNG có `X-Robots-Tag: noindex`**, khác `/lich/` và
`/sotay/`. Đừng "sửa cho nhất quán" — cả lý do trang tồn tại là để người lạ
TÌM THẤY được. Điều kiện an toàn nằm ở chỗ khác và phải giữ: mặc định TẮT, và
ngay cạnh công tắc có đúng câu "Google tìm thấy được".

### Ghép nối: cơ học, không phải mô hình ngôn ngữ

`worker/src/lib/ghep.js`. Ba chiều, ba câu giải thích khác nhau — gợi ý không
nói được vì sao thì không ai bấm:

- `ho_can` — họ đang cần thứ bạn bán (chiều duy nhất bán được hàng ngay, nên
  xếp đầu khi bằng điểm)
- `toi_can` — họ có thứ bạn đang cần
- `dung_khach` — `sells_to` của bạn khớp với đơn vị/chức vụ của họ

Bốn điều đã trả giá hoặc suýt trả giá:

1. **So BIGRAM, không so từ đơn.** Tiếng Việt gần như mọi từ có nghĩa đều hai
   âm tiết; so từ đơn thì "tải app" khớp "vận tải" và gợi ý thành vô dụng.
   Có phép đối chứng riêng cho chỗ này trong `kiem-ghep.mjs`.
2. **Cắt từ khoá xuất hiện ở > 20% hồ sơ** (ý tưởng IDF). Nếu 60/134 người
   cùng viết "dịch vụ" thì cụm ấy khớp tất cả mọi người, giá trị bằng không.
   Tự đếm chứ không viết sẵn danh sách cụm chung: danh sách viết tay luôn
   thiếu đúng những cụm mà lớp NÀY hay dùng.
3. **Hai chốt an toàn cho phép cắt ấy**, thiếu một cái là hỏng ngầm khi dữ
   liệu còn thưa: dưới 20 hồ sơ thì không cắt gì (20% của 5 là 1, tức cắt
   sạch), và ngưỡng không bao giờ thấp hơn 5 hồ sơ.
4. **KHÔNG cộng điểm cho người cùng ngành.** Trực giác bảo cùng ngành thì liên
   quan, nhưng trong giao thương cùng ngành phần lớn là ĐỐI THỦ: người bán vật
   liệu cần gặp nhà thầu, không cần gặp người bán vật liệu khác. Ngành để đó
   cho người dùng tự lọc.

### Lần chạy thật đầu tiên bác bỏ hai giả định (5/9, ngay chiều hôm phát hành)

Ngô Phú Cường chụp màn tab Giao thương trên tên miền và hỏi **"đây là mock
data à"** — bốn gợi ý, cả bốn giải thích bằng đúng hai cụm vô nghĩa:
`cùng nhắc tới "thi truong"` và `cùng nhắc tới "xuat va"`. Dữ liệu là THẬT
(bốn người đều có trong roster gốc), nhưng lý do ghép đọc lên như bịa — mà
gợi ý không thuyết phục thì tệ hơn không có gợi ý.

**Giả định sai thứ nhất: "chỉ cần lọc TỪ ĐƠN là đủ".** Bigram được nhận vô
điều kiện, nên "xuất và nhập khẩu" sinh ra `"xuat va"` — nửa từ nửa liên từ.
Nay bigram chứa **từ nối** ở bất kỳ vế nào đều bị bỏ.

**Giả định sai thứ hai: "phép đếm tự động thay được danh sách viết tay".** Tôi
đã ghi hẳn lý lẽ ấy vào mục 2 ở trên — và nó đúng, nhưng chỉ đúng khi có dữ
liệu. Phép đếm CHỈ chạy từ 20 hồ sơ trở lên (chốt an toàn), mà ngày đầu chưa
đủ, nên "thị trường" thành lý do ghép cho bốn người liền. Nay có thêm
`CUM_CHUNG` — danh sách sàn ~20 cụm của giới kinh doanh, chạy cả khi thưa.
Hai thứ bổ sung nhau: danh sách lo lúc thưa, phép đếm lo lúc dày và bắt được
cụm tôi không đoán trước.

**Cái bẫy đắt nhất nằm ở bản vá, không nằm ở lỗi.** Danh sách từ nối bản đầu
có 40 mục và lập tức **cắt oan "vận tải"** — vì bỏ dấu xong `'tai'` vừa là
"tại" vừa là "tải". Bộ kiểm bắt ngay. Sau khi bỏ dấu, phần lớn từ nối tiếng
Việt trùng với một từ nội dung: `tu`→TƯ vấn, `cua`→CỬA hàng, `cho`→CHỢ,
`trong`→TRỒNG trọt, `khi`→KHÍ đốt, `duoc`→DƯỢC, `cung`→CUNG cấp, `chi`→CHI
phí, `da`→DA giày. Danh sách nay chỉ còn 16 mục. Thêm mục mới thì phải hỏi
đúng câu ấy: **bỏ dấu xong nó còn là từ gì nữa?**

Giới hạn còn lại, chấp nhận có ý thức: mảnh vỡ kiểu `"rong thi"` (từ "mở rộng
thị trường") vẫn lọt, vì `'thi'` phải giữ cho "THI công". Không chữa bằng cách
loại luôn bigram chứa `TU_CHUNG` — làm thế thì `'gia'` giết "GIA công" và
`'moi'` giết "MÔI trường", đắt hơn nhiều so với cái được.

**Tính ở máy chủ, cố ý làm ngược nếp "lọc ở giao diện" của sổ thu** — không có
build step nên `worker/src/lib/` không dùng lại được trong `public/app.js`,
mà chép thuật toán sang tệp thứ hai thì hai bản lệch nhau trong im lặng. Cái
giá bằng không: gợi ý không đổi khi bấm chip, nên tính một lần là đủ. Việc lọc
và tìm vẫn ở giao diện.

### Bốn chỗ đã phải sửa, không chỗ nào tự báo lỗi

1. **Form gian hàng phải ĐỌC LẠI từ máy chủ trước khi mở** (`openGianHang`
   gọi `/api/giao-thuong` chứ không dựng từ biến `GT`). Bốn ô đầu dùng CHUNG
   với hồ sơ ở tab Nhóm: sửa ở tab Nhóm rồi quay sang đây bấm Sửa, bấm Lưu là
   ghi đè bản mới bằng bản cũ. Đúng lỗi mất dữ liệu của Đợt 1, quy ước 3.
   `pw-giao-thuong.mjs` có phép hồi quy, và phép ấy **đã được đối chứng** —
   gỡ bản sửa ra thì nó đỏ.
2. **Chip "công khai" KHÔNG dùng lớp `.xong`.** Cặp màu `--go-bg`/`--go` có
   đúng một nghĩa trong sản phẩm này: người thu đã nhận tiền. Dùng cho việc
   khác là phá quy ước màu.
3. **`website` chỉ nhận `https://`**, kiểm ở CẢ máy chủ lẫn giao diện. Chuỗi
   này đi thẳng vào `href`, mà `javascript:` thì `esc()` không cứu được — nó
   không chứa ký tự HTML nào để thoát.
4. **Tiêu đề trang công khai không dùng `var(--num)`.** Space Grotesk thiếu
   glyph tiếng Việt nên "Giao thương" rơi về monospace dự phòng, đứng lệch hẳn
   với cả trang. Trang `/lich` không lộ ra vì tiêu đề của nó gần như không có
   dấu. **Chỉ nhìn ảnh chụp mới thấy** — phép kiểm chuỗi không thấy.

### Thanh nav sáu tab: tab đang mở giữ chữ, năm tab kia còn icon

Ngô Phú Cường quyết 5/9: giữ nguyên chữ "Giao thương", **chật thì bỏ chữ chứ
không đổi tên tab cho vừa**. Số đo được (`scripts/kiem/pw-nav.mjs`):

| khổ máy | nút rộng | "Giao thương" cần | |
|---|---|---|---|
| 320px | 49px | 75px | ✗ |
| 390px | 61px | 75px | ✗ iPhone 12–15 |
| 430px | 69px | 75px | ✗ kể cả Pro Max |
| 520px | 82px | 75px | ✓ máy tính bảng trở lên |

520px cũng chính là `--wrap`, bề rộng lớn nhất thanh nav từng đạt — trên nữa
không rộng thêm. Nên nhãn đầy đủ **không vừa trên bất kỳ điện thoại nào**.

Nhưng rụng chữ cả sáu tab thì lộ ra chuyện khác: **icon "Bài" và icon "Tư
liệu" đều là hình trang giấy**, bỏ chữ đi là hai tab ấy gần như không phân
biệt được. Vì vậy dưới 520px chỉ **tab đang mở** giữ chữ (`flex:1.8` để có chỗ),
năm tab kia còn icon. Bấm sang tab nào là chữ hiện ra ngay tại đó.

**Cạm bẫy của chính phép đo này — đã vấp một lần.** Bản đầu đo CHIỀU CAO nút,
đoán rằng nhãn dài sẽ xuống dòng và đội nút cao lên. Nó báo xanh ở mọi khổ từ
300px tới 430px, kể cả những khổ đang tràn thật. Lý do: `.lb` có
`white-space:nowrap` nên chữ **tràn ra ngoài chứ không xuống dòng**, nút không
cao lên; và `.nb` có `min-width:0` nên phần tràn cũng không đẩy `.navin` rộng
ra, tức `scrollWidth > clientWidth` của thanh nav cũng im lặng. **Hai phép kiểm
hiển nhiên nhất đều mù.** Phải so `lb.scrollWidth` với `nb.clientWidth`.

Mọi nút có `aria-label`: khi rụng chữ thì nút chỉ còn một hình, không có
aria-label là trình đọc màn hình đọc ra một nút trống.

Con số trên vẫn lệch với máy thật — sandbox không ra được internet nên Google
Fonts không tải, phép đo chạy trên font dự phòng của hệ thống. Font dự phòng
rộng hơn Be Vietnam Pro, nên đây là phép đo **bi quan**: máy thật chỉ có thể
rộng rãi hơn, không chật hơn.

### Hai điều chưa kiểm chứng được

- **Chưa ai bật công khai trên dữ liệu thật.** Mọi phép kiểm chạy trên bốn hồ
  sơ gieo sẵn ở máy cục bộ, không phải trên 134 người thật.
- **Mật độ là rủi ro sản phẩm, không phải rủi ro kỹ thuật.** Còn 21 ngày tới
  26/9 và 44 người vẫn chưa có số điện thoại để tự đăng nhập. Danh mục thưa
  thì trông như chợ chiều, tệ hơn không có. Trạng thái rỗng của trang công
  khai vì vậy được viết như một lời mời chứ không phải một thông báo lỗi.

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

**Cập nhật 12/9 — thêm mục "Trợ lý KHKD"** (`#troly`, mục 3 của sổ tay), gồm
một **cuộc hội thoại demo bảy lượt** dựng theo đúng luật cứng của trợ lý. Ngô
Phú Cường yêu cầu: *"bạn có thể thử một cuộc hội thoại để làm hướng dẫn demo
cho học viên hiểu chức năng không?"*

**Nói rõ trong chính trang đó rằng đây là bản DỰNG, không phải bản ghi một
phiên có thật** — sandbox không gọi được `api.deepseek.com` (mục trên), nên
không lượt hỏi đáp thật nào chạy được ở đây. Một trang hướng dẫn trình bày văn
bản do tôi viết như thể là câu trả lời của mô hình thì chính nó là lỗi "AI bịa
nguồn" mà cả tính năng sinh ra để chống. Bao giờ có phiên thật thì thay bằng
ảnh chụp phiên ấy, và bỏ dòng cảnh báo đi.

Demo cố ý dựng quanh một **mâu thuẫn số học có thật** (18 tỷ ↔ 6 nhà máy ↔ bếp
1.200 suất/ngày): thứ phân biệt trợ lý này với một ô chat thường không phải là
nó trả lời trôi chảy, mà là nó **bắt được chỗ hai phần bài nói ngược nhau**.
Một demo toàn câu hỏi lịch sự thì không ai hiểu để làm gì.

Ba chỗ sổ tay đã lỗi thời, sửa kèm (đọc lại `public/app.js` để đối chiếu, không
sửa theo trí nhớ): "Năm tab" → **Sáu tab** (Giao thương thêm 5/9), tiêu đề
"Nhóm" → **Danh bạ** (đổi tên 28/8) kèm hai thẻ Nhóm/Cả lớp và luật che số
điện thoại. Phần Giao thương **vẫn chưa có mục riêng** trong sổ tay — cần ảnh
chụp thật, chưa làm.

`deploy.yml` nay grep `id="troly"` trong `/sotay` tải về từ tên miền: Pages
xuất bản hụt một tệp thì trang vẫn trả 200 với bản CŨ và không chỗ nào kêu —
đúng cái bẫy đệm đã trả giá ngày 25/8 với `/app.js`.

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

  **Buổi 11/9 điền đủ ngày 6/9 (migration 0032)** — Ngô Phú Cường gửi thư mời
  chính thức của Ban tổ chức: kiến tập Nhà máy Dược Thái Minh Hi-Tech, 7h30–
  13h30, xe đón tại Số 3 Liễu Giai. Dòng `lich_hoc` cho 11/9 đã có từ trước
  nhưng còn là bản tạm ("Tham quan kiến tập", giờ 13:30 không căn cứ). Lại
  **UPDATE tại chỗ** như 0019, giữ nguyên `id` — đổi `id` là đổi UID trong tệp
  `.ics`, và lịch điện thoại của 146 người sẽ có HAI buổi 11/9 thay vì một
  buổi được cập nhật. Toàn văn thư mời đi vào một ghi chú "Nội dung Text" gắn
  vào đúng buổi ấy, `scope='class'`.

  **`ghi_chu` PHẢI NGẮN — chỉ ảnh chụp mới thấy.** Giao diện in `ghi_chu` vào
  dòng đầu thẻ buổi học, kiểu CHỮ HOA cỡ 11px, cùng dòng với ngày và giờ. Bản
  đầu của 0032 ghi đủ địa chỉ + tên Ban Lãnh đạo + nguồn chi phí → **bốn dòng
  chữ hoa đè lên chính tên buổi học**. Không phép kiểm chuỗi nào thấy được.
  Nay chỉ còn "Xe đón 7h30 tại Số 3 Liễu Giai · KCN Thạch Thất, Hòa Lạc" —
  lúc 7 giờ sáng thì "đứng ở đâu" là thứ duy nhất người ta cần, và nó cũng là
  thứ duy nhất người xem lịch trên ĐIỆN THOẠI đọc được (`ghi_chu` đi thẳng vào
  `DESCRIPTION` của `.ics`). Phần còn lại nằm trong ghi chú Text ngay dưới,
  cách đúng một cú chạm. `giang_vien` để TRỐNG: thư mời không nêu giảng viên,
  mà `lib/ics.js` in ra "Giảng viên: …" — điền Ban Lãnh đạo Thái Minh vào đó
  là nói sai vai trò của họ.

  **CỐ Ý KHÔNG thêm dòng `lich_hoc` cho buổi giao lưu 13h30–16h00** sau chương
  trình: thư mời ghi rõ "nội dung cụ thể sẽ được thông báo sau" và chi phí do
  người tham gia tự chia. Đưa một buổi chưa chốt vào `.ics` là ghi vào lịch
  điện thoại của 146 người một cuộc hẹn chưa chắc có. Nó nằm ở mục "Lưu ý"
  trong ghi chú Text, đúng chỗ của nó.

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

### Vá kèm: hồ sơ chưa từng có số thì kẹt vĩnh viễn ở bước NHẬN LẠI (5/9 chiều)

Đúng ngày phát hành tính năng trên, Ngô Phú Cường chụp lại màn hình thật: Đinh
Khánh Toàn (Nhóm 9, roster KHÔNG có số điện thoại nào — nằm trong danh sách
`bo-sung-dien-thoai.csv`) được phát lại link, mở lên gõ số điện thoại thật của
mình vào rồi bấm Lưu — nhận `phone_mismatch` mãi mãi. Không phải gõ sai: hồ sơ
này **chưa từng có số nào để đối chiếu**, nên `xacNhanLaiSo()` bản đầu (chỉ vài
giờ trước) chặn CỨNG bất kể gõ gì, với lý do ghi thẳng trong code lúc đó "không
có gì để soi thì an toàn hơn cho qua" — hoá ra đọc ngược: với ĐÚNG nhóm người
này, "chặn hẳn" nghĩa là khoá vĩnh viễn một cửa vốn dĩ họ có quyền dùng.

**Vì sao chặn hẳn là sai, không phải "an toàn hơn":** nhóm người không có số
trong roster (44+ người, xem `bo-sung-dien-thoai.csv`) vốn dĩ NHẬN LẦN ĐẦU
cũng không cần số — nhánh `!wasClaimed` chưa bao giờ gọi `xacNhanLaiSo()`. Bảo
vệ họ từ trước tới giờ chỉ là "token không đoán được", không hơn. Bắt họ ĐÃ
NHẬN xong rồi mới đòi một số không tồn tại là hạ THÊM một nấc — từ "vào được"
xuống "kẹt vĩnh viễn" — chứ không phải giữ nguyên mức bảo vệ cũ.

**Sửa**: `xacNhanLaiSo()` kiểm `soDoiChieu.length` TRƯỚC cả hạn mức đoán và
`isValidVnPhone` — không có số nào để soi thì `return null` (cho qua) ngay,
giống hệt nhánh nhận lần đầu. `getInvite()` trả thêm `has_phone_on_file`
(dùng chung `soHopLeTuHoSo()`) để giao diện biết đường: `renderClaim` chỉ bắt
buộc gõ số (`*`, chặn nút Lưu, hintline) khi `has_phone_on_file` là true; khi
false thì đổi hẳn phụ đề thành "chưa từng có số điện thoại lưu — không cần xác
nhận thêm" và cho để trống ô điện thoại.

**Bài học về việc "fail closed" không phải lúc nào cũng đúng nhất**: quyết
định ban đầu (chặn hẳn khi không có gì đối chiếu) hợp lý về LÝ THUYẾT an ninh
nhưng sai về THỰC TẾ sản phẩm — nó biến một tính năng vừa mở ra cho cả lớp
thành ngõ cụt cho đúng nhóm người cần nó nhất (người chưa có số, tức người
CHƯA có cách nào khác để tự đăng nhập lại ngoài đường này hoặc `/dangnhap`
bằng email). Chỉ lộ ra khi có người thật vấp phải, đúng bài học đã ghi nhiều
lần trong tệp này: bộ kiểm cũ (`kiem-moi.mjs`, `pw-nhanlai.mjs`) chỉ dựng ca
"có số" nên không bắt được — nay cả hai bộ kiểm có thêm ca "Kiểm Tra Không Số"
(hồ sơ giả, `reset-moi.sh`) đúng khuôn Đinh Khánh Toàn, kiểm cả máy chủ lẫn
giao diện thật.

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

### `0914544449` là của Lưu Minh Tiến — và vì sao phải gỡ ngay (migration 0033)

Số này nằm trong `roster` của CẢ HAI người tên Tiến từ lần nạp đầu, và đã nằm
trong `bo-sung-dien-thoai.csv` nhóm "đang SAI" suốt từ Đợt 5 mà không ai biết
nó là của ai. **Thư mời kiến tập 11/9** (Ban tổ chức, 6/9) phân định giúp: nó
ghi rõ **Lưu Minh Tiến — trưởng đoàn — 0914.544.449**. Ngô Phú Cường xác nhận
7/9.

**Việc cần làm hoá ra ngược với dự đoán ban đầu.** Tôi đã định "điền số cho
Lưu Minh Tiến" — nhưng đọc D1 thì số ấy ĐÃ có sẵn ở cả `roster.phone` lẫn
`members.phone` của anh từ migration 0021, `claimed_at` còn trống, tức anh tự
đăng nhập được từ lâu rồi. Cái hỏng không phải chỗ thiếu, mà là **bản sao nằm
ở hồ sơ Lê Minh Tiến**.

**Vì sao bản sao ấy phải gỡ NGAY, không chờ có số thật của Lê Minh Tiến:**
`soHopLeTuHoSo()` (`routes/onboard.js`) nhận `roster.phone` làm bí mật mở cửa
`/vao`, và cửa ấy mở được hồ sơ CHƯA AI NHẬN — Lê Minh Tiến chưa nhận. Trước
6/9 số này chỉ nằm trong danh sách nội bộ; từ 6/9 nó nằm trong **một tờ thư
mời phát cho 146 người**. Nghĩa là bất kỳ ai đọc thư mời đều vào được `/vao`,
chọn tên Lê Minh Tiến, gõ đúng số ấy và chiếm hồ sơ của anh. Cùng dạng lỗ hổng
đã vá ở `postInviteClaim` ngày 5/9, chỉ khác là chìa khoá lần này vừa được
chính Ban tổ chức in ra và phát đi.

Gỡ số thì anh Lê Minh Tiến không tự vào `/vao` được nữa — nhưng anh vốn dĩ
cũng không nên vào bằng số của người khác. Đường vào của anh là link mời, một
cú chạm ở Danh bạ → Cả lớp.

Migration 0033 gỡ có guard hai lớp: chỉ động khi số VẪN LÀ bản trùng ấy (ai đó
đã điền số thật thì không đè lên), và chỉ khi anh CHƯA nhận hồ sơ — đã nhận thì
`/vao` đóng vĩnh viễn nên số thôi là chìa khoá, mà lại là bản ghi lịch sử nên
giữ. Hồ sơ Lưu Minh Tiến KHÔNG đụng tới.

Sau migration này, `roster` còn đúng **một** số bị hai người dùng chung:
`0985981808` của hai người CÙNG TÊN Phan Thị Thanh Nga (Nhóm 6 và Nhóm 9) —
chưa có bằng chứng nào phân định được, vẫn treo.

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
trong roster. **Đã rà xong toàn bộ, chia làm ba đợt**: migration 0028 (Nguyễn
Thị Hoa, Võ Thị Trang thêm hẳn; "Đậu Huy Đại" hoá ra là tên bị cụt, sửa thành
"Đậu Huy Đại Việt"), migration 0029 (Nguyễn Tuấn Hùng, Nhóm 3), và migration
0030 (5/9, cùng ngày — Ngô Phú Cường xác nhận thêm cả bảy người còn lại qua
AskUserQuestion, kể cả "Vương Quốc Chung": tuy rất giống "Khương Quốc Chung"
seq 75 nhưng người đó lại xuất hiện đầy đủ, riêng biệt ở Nhóm 5 trong cùng
tệp — xác nhận là hai người khác nhau, không phải lỗi chép — xem mục "Bảy
người còn lại" ngay dưới).

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

**Cập nhật 9/9 — chuyển sang Nhóm 6 (migration 0036).** Giữa 4/9 và 9/9 cô ấy
đã có hồ sơ `members` (id 43) và tự nhận qua email `anhttn@mindx.com.vn` chỉ
MỘT NGÀY sau khi được thêm vào roster — nhanh hơn nhiều so với việc chờ ai đó
sửa số điện thoại sai, nên gần như chắc chắn đi qua đường phát link mời xuyên
nhóm chứ không phải `/vao`. Ngô Phú Cường yêu cầu chuyển cô ấy sang Nhóm 6.

Đây là loại migration **đầu tiên** đổi `group_id` của một hồ sơ ĐANG HOẠT
ĐỘNG — không giống 0021/0022 (vụ Lưu Minh Tiến), cả hai đều là sửa nhóm ngay
LÚC TẠO hồ sơ, không phải chuyển một người đã tồn tại. Không có route nào làm
việc này: `patchMember` không nhận trường `group_id`, nó chỉ ghi một lần lúc
tạo hồ sơ rồi khoá cứng.

Trước khi viết migration, phải soi D1 THẬT trả lời hai câu — thiếu một trong
hai là để lại rác không chỗ nào báo lỗi:
1. **Đang giữ chức ở Nhóm 4 không?** Nếu có mà không supersede vai đó, quyền
   quản lý Nhóm 4 (sổ thu, cơ cấu, cho người khác ngừng tham gia) vẫn dính
   sau khi chuyển — người không còn là thành viên Nhóm 4 mà vẫn điều hành nó.
2. **Đang giữ phần bài hay suất thuyết trình ở Nhóm 4 không?** Nếu có mà
   không nhả về "chưa ai nhận" (đúng cách "ngừng tham gia" đã làm), một phần
   vẫn đứng tên cô ấy mà `GET /api/plan` lọc theo `group_id` mới nên cô ấy
   không còn thấy để cập nhật.

Soi bằng cách thêm tạm một bước vào `.github/workflows/soi-du-lieu.yml` (workflow
"chỉ đọc" đã có sẵn cho đúng việc này), xoá ngay sau khi đọc được kết quả —
đúng nếp mỗi lần dùng workflow ấy: chỉnh nội dung cho câu hỏi hiện tại, không
để lại cruft của lần trước. **Lượt soi đầu tự vấp đúng bẫy đã ghi ngay trong
chính tệp đó** ("lần: 3"): dùng `$WRANGLER --command ... | tail -20` thay vì
hàm `soi()` (dùng `--json` rồi lọc qua `jq`), nên mọi khối chỉ còn `"success"`/
`"meta"`, mất sạch `"results"` — bốn truy vấn đều trông như trống trơn dù
`rows_read` > 0. Sửa bằng cách copy hàm `soi()` vào TRONG CHÍNH bước đó (không
gọi chéo sang bước "Soi cả lớp" ở trên — mỗi `run:` là một shell riêng, bài
học "lần: 6" của cùng tệp).

Kết quả soi lại: **cả hai câu đều là KHÔNG** — không giữ chức, không giữ phần
bài/suất thuyết trình nào ở Nhóm 4. Đây là ca đơn giản nhất có thể: migration
0036 chỉ một câu `UPDATE members SET group_id = ...`, khoá chặt điều kiện
`WHERE id = 43 AND roster_id = 135 AND group_id = <Nhóm 4>` (không chỉ theo
`full_name` — tên trùng nhau không hiếm trong roster này). `roster.group_label`
GIỮ NGUYÊN 'Nhóm 4' làm bản ghi lịch sử, đúng quy ước đã dùng cho mọi lần lệch
nhóm trước.

**Nếu về sau lặp lại việc này cho người khác — mẫu chung, không riêng ca
này**: LUÔN soi lại officers và plan_sections trước, đừng giả định "chắc cũng
đơn giản như lần trước". Một người đang giữ chức hoặc đang giữ phần bài thì
đổi `group_id` suông để lại quyền/phần việc dính vào nhóm cũ, im lặng.

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
`bo-sung-dien-thoai.csv` đều có thể vào được NGAY bằng đường phát link mời
này**, không cần đợi điền số điện thoại nữa — điền số chỉ còn cần thiết cho
việc HỌ tự đăng nhập LẠI ở những lần sau nếu link mời bị mất hoặc hết hạn
(magic-link email vẫn dùng được, nhưng phát lại link mời là đường nhanh nhất).
Số điện thoại vẫn nên điền dần vì `/vao` là đường vào không cần Ban cán sự lớp
đứng ra mỗi lần, nhưng nó không còn là chỗ chặn duy nhất.

### Bảy người còn lại của đợt rà soát 21/8 (migration 0030)

5/9, cùng ngày với migration 0029 — hỏi lại Ngô Phú Cường qua AskUserQuestion
về đúng bảy tên "chưa đủ căn cứ" liệt kê ở mục trên, anh xác nhận thêm cả bảy.
seq nối tiếp 140-146, ngay sau 139 (Nguyễn Tuấn Hùng).

**"Vương Quốc Chung" là NGƯỜI KHÁC "Khương Quốc Chung"** (seq 75, Nhóm 6),
không phải lỗi chép tên — Ngô Phú Cường chọn đúng phương án này, khớp với
bằng chứng trong tệp (Khương Quốc Chung xuất hiện đầy đủ, riêng biệt ở một
dòng khác của cùng sheet).

**Hai người (Nguyễn Thu Thảo — Nhóm 2, Nguyễn Tuấn Đạt — Nhóm 7) đã có SẴN số
điện thoại hợp lệ trong tệp** (`0989588534`, `0961547806`) — ghi thẳng vào
`roster.phone`, KHÔNG đưa vào `bo-sung-dien-thoai.csv`: hai người này tự vào
được ở `/vao` ngay lập tức, không cần ai phát link mời hộ.

**Năm người còn lại thêm vào `bo-sung-dien-thoai.csv`**: Vương Quốc Chung,
Nguyễn Việt Anh (Nhóm 1), Nguyễn Tùng Lâm (Nhóm 5) — tệp không ghi số nào —
vào nhóm "chưa có số" (nay 44 dòng, không phải 40 như trước, vì cộng thêm
Nguyễn Tuấn Hùng của migration 0029 và ba người này). Lưu Thị Bích Ngọc
(Nhóm 9, số ghi `904580955` — thiếu số 0 đầu) và Đặng Hùng (Nhóm 10, số ghi
`03845375x8` — lẫn ký tự "x") — ghi NGUYÊN VĂN số sai vào `roster.phone`,
không đoán số thật, đúng nguyên tắc đã dùng cho Lê Trung Đức và Trương Thị
Ngọc Anh; vào nhóm "đang SAI" (nay 8 dòng). Tổng CSV nay 52 dòng.

**Migration dùng BẢY câu `INSERT` riêng, không gộp bằng `UNION ALL`** — đúng
bẫy D1 đã ghi ở mục "Cạm bẫy của D1 thật": từ 6 nhánh `UNION ALL` trở lên bị
từ chối khi chạy qua tệp migration. Migration 0028 làm đúng vậy với ba việc;
0030 tiếp tục đúng khuôn với bảy người.

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
- ~~`0914544449` dùng chung cho Lưu Minh Tiến (Nhóm 5) và Lê Minh Tiến (Nhóm 8)~~
  → **đã phân định 7/9, xem mục riêng bên dưới**: số ấy là của Lưu Minh Tiến;
  bản sao ở hồ sơ Lê Minh Tiến đã gỡ (migration 0033)
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
  trước khi chạy — có mục "hai mươi hai phép đối chứng đáng giữ nhất" và hai
  chỗ môi trường sandbox không kiểm được.
- **Nói thẳng cái chưa kiểm chứng được**, đừng để lẫn với cái đã chắc chắn.
- **Commit vào CẢ HAI nhánh** (Ngô Phú Cường quyết qua AskUserQuestion ngày
  9/9): nhánh phiên làm việc hiện tại, VÀ
  `claude/content-deployment-continuation-m2inni` — nhánh mà `deploy.yml` ghim
  ở `on.push.branches`. Đẩy thiếu nhánh thứ hai thì code vào repo mà tên miền
  không đổi gì, đúng cái bẫy đã ghi ở đầu tệp này. Không tạo PR trừ khi được
  yêu cầu.
