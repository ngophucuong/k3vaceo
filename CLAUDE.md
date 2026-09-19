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

**MỚI NHẤT (19/9), chưa nằm trong danh sách đánh số bên dưới** — sáu mục
riêng ở giữa tệp, đọc trước nếu đang sửa đúng chỗ ấy:
- **"Rủ người CÙNG LÀM đề tài, và người kia phải ĐỒNG Ý"** (migration 0045) —
  thứ MỚI NHẤT, và là bảng quan hệ NHIỀU-NHIỀU đầu tiên của dự án. Đọc TRƯỚC
  khi đụng `khkd_cung_lam`, `getTotNghiep` hay `theo_linh_vuc`: màn Ban cán sự
  lớp nay đếm theo BÀI chứ không theo NGƯỜI, và `nguoi_gui_id` là chỗ sai được
  mà chỉ MỘT chiều của bộ kiểm bắt được.
- **Một LỖI CÓ THẬT đã vá cùng ngày:** `computeAction` viết `tn?.du_le !== 'co'`
  mà quên select cột `du_le`, nên đợt thu phí Gala **không bao giờ** hiện ở ô
  "Việc của bạn" cho bất kỳ ai — kể cả người đã trả lời "Có dự" và chưa chuyển
  tiền. Xem "Đính chính 19/9 (tối)" trong mục "Vá kèm: đừng mời người đã từ
  chối Gala…".
- **"Số khai ở `/totnghiep` nay MỞ ĐƯỢC cửa `/dangnhap`"** — hai lỗi chồng
  nhau trên đường đăng nhập, một trong hai là chỗ CHẠM VÀO CỘT ĐĂNG NHẬP nên
  có ba điều an toàn phải giữ. Đọc trước khi đụng `putHoSo` hay `boot()`.
- **"Màn Thống kê của Ban cán sự lớp: BA thẻ"** — tách đề tài khỏi việc tổ
  chức Lễ, và ba thứ thu từ 18/9 mà màn hình chưa từng hiện.
- **"Hai chỗ nhỏ cùng đợt"** — lối về ở đầu `/totnghiep`, và "Gala" thay
  "Dự Lễ".
- **"Màn VÀO — bốn chỗ sửa"** và **"Dải ba ô tiến độ thành THANH TAB"**
  (cùng 19/9, đã phát hành).

**Mười hai việc gần nhất, theo thứ tự nên đọc nếu tiếp nhận:**

1. **Zone Lễ tốt nghiệp `/totnghiep`** (18/9, migration 0041 → 0042 → 0043 —
   ba lượt trong MỘT ngày). Ngô Phú Cường đưa 15 câu Ban tổ chức muốn thu để
   chuẩn bị Lễ 26/9 rồi hỏi *"bạn xem cái gì có rồi cái gì chưa và đề xuất cho
   tôi một zone riêng cho việc này"*. Phát hiện quyết định cả hình dạng việc
   này: **6/15 câu D1 ĐÃ CÓ SẴN dữ liệu, 2 câu nữa có sẵn cả cỗ máy** — nên nó
   là màn XÁC NHẬN chứ không phải biểu mẫu 15 câu. Kèm **đợt thu cấp lớp ĐẦU
   TIÊN** của dự án (0041), **đường CÔNG KHAI cho 38 người không đăng nhập
   được** (0042), rồi **bỏ hẳn đường nộp theo NHÓM, chuyển sang LĨNH VỰC +
   cá nhân** (0043) vì lớp đổi cách nộp bài ngay chiều hôm ấy, cộng ô chữ
   "Ngành khác" (0044). Xem các mục riêng bên dưới trước khi đụng vào
   `worker/src/routes/tot-nghiep.js`.

   **Và cùng ngày, phần ẢNH CHỨNG CHỈ qua Google Drive** — thứ CLAUDE.md gọi
   là "Đợt 2, chưa viết dòng mã nào" lúc sáng. Ngô Phú Cường tự làm xong 12
   bước trên Google Cloud Console (vấp đúng một chỗ: phải hoàn thành Branding
   mới bấm Publish được, mà tôi đã hướng dẫn SAI — xem mục riêng), rồi đưa ba
   bí mật. Đây là lần đầu **byte của người dùng đi XUYÊN QUA Worker ra một
   dịch vụ ngoài**, và là cách đọc N2 đúng nhất: ứng dụng là **ống dẫn, không
   phải kho**. Đọc mục "Ảnh chứng chỉ qua Google Drive" TRƯỚC khi đụng vào
   `worker/src/lib/drive.js` hay `lib/anh.js` — ba chỗ sai được trong đó
   **Drive vẫn trả HTTP 200**.

   **Và ba yêu cầu nữa cùng tối 18/9**, mỗi cái một mục riêng bên dưới:
   (a) *"ép khai đủ những thông tin doanh nghiệp mới được submit"* — phần hồ
   sơ nay đòi đủ bảy ô, và `linh_vuc` khai ở đây ghi ngược sang
   `member_profile.nganh` để tab Giao thương thôi đứng trên dữ liệu rỗng;
   (b) *"làm nốt phần logo doanh nghiệp và ảnh chân dung"* — mở đường nộp ảnh
   cho cả 38 người KHÔNG đăng nhập được, tức đường đầu tiên trong dự án nhận
   TỆP từ người không có phiên; (c) *"3 phần này nên gập vào và chỉ hiển thị
   một phần"* cộng *"chưa chuyển khoản thì tự động expand mã QR"* — hai yêu
   cầu suýt cắn nhau, hoà bằng `tnKhoiMoDau()`.
2. **Trợ lý KHKD** (12/9, migration 0038) — thứ LỚN NHẤT từng thêm vào dự án
   này, và là lần đầu tiên nó **tốn tiền theo lượt dùng** cùng lần đầu **bỏ
   HAI nguyên tắc gốc cùng lúc (N1 và N2)**. Ngô Phú Cường đưa hai tài liệu
   của giảng viên rồi nói thẳng: *"Loại bỏ các rào cản N1, N2 bạn khảo sát và
   cung cấp một Agent hữu dụng cho học viên"*, và làm rõ phạm vi: *"Agent này
   sẽ phỏng vấn và dẫn dắt TỪ Ý TƯỞNG đến việc đặt các câu hỏi và (gợi ý) trả
   lời cho học viên khi xây dựng KHKD"*. Xem mục riêng bên dưới — đọc TRƯỚC
   khi đụng vào bất cứ thứ gì trong `worker/src/tro-ly/`.
3. **Xin đổi nhóm — tự phục vụ** (9/9, migration 0037). Ngay sau khi chuyển
   tay Trương Thị Ngọc Anh sang Nhóm 6 bằng migration 0036, Ngô Phú Cường hỏi
   thẳng "có thể thêm chức năng xin đổi nhóm không, ai là phê duyệt thì phù
   hợp" — muốn việc lặp lại tự chạy được, không phải chờ tôi viết migration
   tay mỗi lần. Trả lời qua AskUserQuestion: **TRƯỞNG/PHÓ NHÓM ĐÍCH duyệt**,
   không phải Ban cán sự lớp, không phải cả hai nhóm cùng đồng ý — nhóm ĐI
   chỉ CẦN BIẾT (qua "Hoạt động gần đây"), không cần ĐỒNG Ý. Xem mục riêng
   bên dưới.
4. **Đính kèm Ghi chú vào thông báo** (8/9, migration 0034), kèm thanh định
   dạng B/I/gạch đầu dòng và ô xem trước gắn thêm vào sheet Sửa ghi chú/Gắn
   Tư liệu (trước đó chỉ có ở sheet soạn thông báo). Phát hiện tình cờ một
   N6 THẬT có từ trước khi làm việc này: `GET /api/lich` trả về thông báo
   nội bộ của MỌI nhóm, không lọc phạm vi — đã vá cùng lúc. Xem mục riêng
   bên dưới.
5. **Thư khi có thông báo mới** (6/9, migration 0031) — đăng thông báo lên ứng
   dụng xong là gửi thư cho người trong phạm vi, kèm công tắc tắt của chính
   chủ ở tab Tài khoản. Lý do làm: đo trên D1 thật thì thông báo đẩy chỉ có
   **2/146 người bật và chưa gói tin nào từng đi** — xem mục riêng bên dưới.
6. **Giao thương** (5/9) — tab Giao thương + trang công khai `/giao-thuong`.
   Danh mục "bán gì, bán cho ai" của cả lớp, kèm ghép nối theo nhu cầu và
   một trang ai cũng mở được (Google index được). Chỗ DUY NHẤT dữ liệu người
   dùng ra khỏi tên miền, và chỉ của ai tự bật — xem mục riêng bên dưới.
7. **Phát lại link mời cho người ĐÃ ĐĂNG NHẬP — vá một lỗ hổng thật** (5/9).
   Ngô Phú Cường xin mở rộng quyền "phát lại link mời trong nhóm" (có từ Đợt
   1, chưa từng chặn người đã đăng nhập) ra cả lớp cho anh và lớp trưởng. Tra
   tới nơi thì lộ ra route ĐÓ đã luôn cho phép **chiếm tài khoản người khác**:
   bước nhận (`postInviteClaim`) không đòi gì ngoài một email tự chọn. Đã vá
   trước khi mở rộng: bước nhận nay đòi đúng số điện thoại khi hồ sơ đã có
   người nhận, cùng hạn mức đoán với `/vao` — xem mục riêng bên dưới.
8. **Tư liệu gắn vào PHẦN BÀI** (5/9). Bài↔Tư liệu là mắt xích còn thiếu của
   bộ ba Hôm nay/Bài/Tư liệu — Ngô Phú Cường hỏi thẳng "ba tab có liên thông
   với nhau không", tra ra `links.section_id` có cột từ đầu (migration 0001)
   nhưng CHƯA từng được nối dây (luôn ghi cứng NULL). Nay nối xong, đúng khuôn
   "một dòng, hai màn" đã dùng cho buổi học — xem mục riêng bên dưới. Điểm
   khác biệt phải nhớ: mỗi nhóm giữ một bộ tám phần RIÊNG, không dùng chung
   như buổi học, nên chốt N6 phải kiểm thêm "đúng nhóm" chứ không chỉ "có thật".
9. **Tư liệu dạng "Nội dung Text"** (5/9, migration 0025). Bên cạnh dán đường
   dẫn, nay gõ thẳng một ghi chú Markdown vào ứng dụng — lệch có chủ ý thứ hai
   với N2, xem mục riêng bên dưới. Điểm cần nhớ nhất: `mdSafe()` trong
   `public/app.js` ESC TRƯỚC rồi mới PARSE cú pháp markdown, không được đảo
   ngược thứ tự.
10. **Link mời xuyên nhóm cho Ban cán sự lớp** (3/9, mở rộng 4/9 và 5/9). Ngô
   Phú Cường (uỷ viên) và Lưu Minh Tiến (lớp trưởng, migration 0022) phát được
   link mời cho BẤT KỲ ai ở bất kỳ nhóm nào, không chỉ nhóm của mình, kể cả
   người đã đăng nhập (mục #7 ở trên) — `POST /api/danh-ba/:roster_id/moi`,
   xem mục riêng bên dưới.
11. Tư liệu gắn vào buổi học — một dòng dữ liệu, hiện ở cả tab Lịch lẫn Tư liệu.
12. Bỏ OTP ở lần đăng nhập đầu — số điện thoại vào thẳng, rồi passkey.

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

**Chín việc cần làm tiếp, xếp theo mức chặn:**

1. **PHÁT LINK `k3vaceo.cuongngo.app/totnghiep` CHO CẢ LỚP — hạn 21h00 NGÀY
   19/9.** Gấp nhất, và không phải việc lập trình. **Một link là đủ cho cả
   146 người**, không phải phát gì thêm: ai đăng nhập được thì vào thẳng, ai
   không thì bấm "Tôi không đăng nhập được — điền thẳng ở đây" (migration
   0042). Khi phát nhớ nói rõ hai điều: (a) buổi bảo vệ chiều 26/9 là bắt
   buộc và KHÔNG thu phí, chỉ buổi tối mới có phí; (b) ai muốn dùng cả ứng
   dụng thì vào `/dangnhap` gõ tên + số điện thoại — **39 trong 77 người chưa
   đăng nhập làm được ngay**, không cần ai phát link.
2. **Mở `/totnghiep` trên điện thoại thật và quét thử mã QR phí Gala bằng app
   ngân hàng.** Đây là đợt thu cấp lớp ĐẦU TIÊN của dự án — chưa đồng nào từng
   đi qua đường này, và ảnh QR chưa hiển thị thật lần nào (sandbox không có
   mạng). Hỏng thì cả lớp chuyển tiền sai chỗ.
3. **GỬI MỘT ẢNH THẬT ở `/totnghiep` rồi mở Drive xem nó có ở đó không.** Đây
   là phép nghiệm thu DUY NHẤT của đường Google Drive, và sandbox không làm
   được: **chưa một tệp nào từng tới Drive từ đây**. Deploy #127 chỉ chứng
   minh được ba bí mật đã sang tới Worker (`"drive":{"bat":true}`), không
   chứng minh được khoá còn sống — khoá chết thì cờ vẫn `true`. Hỏng thì
   `hong_o_buoc` nói ngay hỏng ở bước nào (`lay_token` = khoá; `tai_len` =
   Drive từ chối). Lượt gửi ĐẦU TIÊN tự tạo thư mục **"k3vaceo — ảnh chứng
   chỉ CEO K03"**; link của nó hiện thẳng trên màn Ban cán sự lớp, đó là thư
   mục để chia sẻ cho Ban tổ chức.
4. **Gửi thử một ảnh qua ĐƯỜNG CÔNG KHAI nữa** (`/totnghiep` → "Tôi không
   đăng nhập được" → tìm tên → chọn ảnh). Đường này mở chiều 18/9 cho 38 người
   không đăng nhập được, và nó là đường DUY NHẤT của cả ứng dụng nhận tệp từ
   người không có phiên — xem mục riêng cho cái được và cái mất. Sau lượt gửi
   thật đầu tiên, mở bản xuất CSV soi cột "Điền qua": ảnh gửi đè lên bản của
   một người đã đăng nhập phải hiện thành "Tài khoản + link công khai".
5. **Mở một phiên Trợ lý KHKD THẬT trên tên miền** — đây là phép nghiệm thu
   duy nhất cho tính năng lớn nhất vừa thêm, và sandbox không làm được (xem
   mục riêng). Hỏng thì `hong_o_buoc` trong phúc đáp 502 nói ngay hỏng ở bước
   nào. Kèm theo: thêm `DEEPSEEK_API_KEY` vào **GitHub Secrets** (ngoài
   Cloudflare) để `deploy.yml` tự kiểm khoá còn sống mỗi lượt deploy.
6. **Điền 51 số điện thoại** vào `scripts/data/bo-sung-dien-thoai.csv` (45
   người chưa có số nào, 6 số sai hoặc trùng — đã điền được 4/44 người chưa có
   số nhờ tệp "Trưởng, phó nhóm" của Ban tổ chức, migration 0020; thêm một
   người mới migration 0023 vào thẳng nhóm "sai" vì số trong tệp gốc thiếu một
   chữ số). Chưa điền thì từng ấy người không tự vào được — đây là chỗ chặn số
   một, và nó không phải việc lập trình.
7. **Thử passkey trên điện thoại thật** ở `/vao`. Nay passkey là thứ giữ chỗ
   cho những lần đăng nhập sau, mà nó CHƯA từng chạy trọn vẹn trên tên miền
   thật lần nào. Hỏng thì đường vào lại chỉ còn mã email, tức chưa thật sự bỏ
   được OTP.
8. **Cấp lại `GOOGLE_REFRESH_TOKEN`** sau khi ảnh đã chạy xuôi: ba giá trị
   hiện tại đã đi qua khung chat. Không gấp, nhưng đó là thứ mở được Drive
   của Ban tổ chức. Đổi ở OAuth Playground rồi thay trong GitHub Secrets.
9. **Cloudflare → zone `cuongngo.app`**, hai việc trong bảng điều khiển,
   không sửa được trong repo: Caching → Browser Cache TTL → **"Respect
   Existing Headers"**; và Scrape Shield → **Email Address Obfuscation → Off**
   (đang che địa chỉ liên hệ trên `/rieng-tu`, mà Google đọc trang ấy để duyệt
   ứng dụng OAuth).

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
- `dang_ky_tot_nghiep` (migration 0041, mở rộng 0042, 0043 và 0044) — zone Lễ tốt
  nghiệp 26/9. SRS viết trước khi Ban tổ chức gửi 15 câu này. Ba cột
  `groups.ban_nop_*` của 0041 **đã GỠ ở 0043** khi lớp bỏ nộp bài theo nhóm;
  đề tài nay là `dang_ky_tot_nghiep.khkd_*`, xem mục riêng bên dưới.
- `khkd_cung_lam` (migration 0045) — rủ người cùng làm đề tài, và người kia
  phải ĐỒNG Ý. Bảng quan hệ NHIỀU-NHIỀU đầu tiên của dự án, nên không nhét cột
  vào `dang_ky_tot_nghiep` được (bảng ấy khoá `member_id UNIQUE`). Xem mục
  riêng bên dưới.

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

## Zone Lễ tốt nghiệp `/totnghiep` — màn XÁC NHẬN, không phải biểu mẫu 15 câu

Thêm 18/9 (migration 0041). Ngô Phú Cường đưa 15 câu Ban tổ chức muốn thu của
học viên rồi hỏi thẳng: *"bạn xem cái gì có rồi cái gì chưa và đề xuất cho tôi
một zone riêng cho việc này"*.

**Phát hiện quyết định cả hình dạng việc này: 6/15 câu D1 ĐÃ CÓ SẴN dữ liệu**
(họ tên, ngày sinh, điện thoại, doanh nghiệp, lĩnh vực, chức vụ), **và 2 câu
nữa có sẵn cả cỗ máy** (đề tài KHKD; quỹ + VietQR cho khoản phí). Nên đây
không phải dựng một biểu mẫu 15 câu từ đầu — mà là dựng một màn **XÁC NHẬN**
thứ đã biết, cộng đúng 5 câu thật sự mới. Học viên gõ ít hơn hẳn, và dữ liệu
không bị chẻ làm hai nguồn.

### Ba phần, ba nút Lưu — vì ba HẠN khác nhau

| | Nội dung | Hạn | Lưu vào |
|---|---|---|---|
| A · Hồ sơ & chứng chỉ | câu 1–9 | 26/9 | `dang_ky_tot_nghiep` |
| B · Đề tài KHKD | lĩnh vực + đề tài + link bài | 26/9 | `dang_ky_tot_nghiep` |
| C · Lễ & Gala | câu 11–15 | **21h00 ngày 19/9** | `dang_ky_tot_nghiep` |

Ngô Phú Cường hỏi "có nên tách các phần?" — nên, và vì lý do cụ thể chứ không
phải cho gọn: gộp một form 15 câu thì người muốn đăng ký Gala tối nay bị chặn
vì chưa có ảnh chân dung, tức mất đúng cái hạn gấp nhất. Mỗi phần đóng dấu một
mốc riêng (`ho_so_luc`, `khkd_luc`, `gala_luc`) nên câu Ban tổ chức thật sự
cần — "còn ai chưa xong phần nào" — trả lời được bằng một truy vấn.

Phần B sáng 18/9 nộp theo NHÓM và lưu vào `groups`; chiều cùng ngày lớp đổi
cách nộp nên nó chuyển sang cá nhân — xem mục "Đề tài nộp theo LĨNH VỰC" bên
dưới. Bảng trên đã là bản SAU khi đổi.

### Hai quyết định do SOI D1 THẬT bác bỏ phương án ban đầu

> **Đường nộp theo nhóm nói ở mục này ĐÃ GỠ HẲN chiều 18/9** (migration 0043,
> mục riêng bên dưới). Giữ nguyên mục vì HAI CON SỐ đo được ở đây vẫn đúng và
> vẫn phải nhớ — chín nhóm không có dòng `plans`, tám nhóm không có officer —
> chúng sẽ chặn bất kỳ tính năng nào khác định gác theo nhóm.

Kế hoạch ban đầu định đặt link bản nộp trên `plans` và gác bằng
`canManageGroup`. Cả hai đều SAI, và lượt soi ngày 18/9
(`.github/workflows/soi-du-lieu.yml`, bước tạm rồi xoá) cho con số:

1. **CHỈ NHÓM 6 CÓ DÒNG `plans`** (plan_id=1). Chín nhóm còn lại không có.
   `plans` chỉ sinh ra khi nhóm chạy wizard tạo kế hoạch. Đặt cột ở đó là chín
   nhóm KHÔNG CÓ CHỖ NÀO để nộp link, tám ngày trước buổi bảo vệ. Chữa bằng
   cách tự tạo dòng `plans` khi nộp thì tệ hơn: `getPlan()` sẽ thôi trả 404
   nên tab Bài của chín nhóm ấy mất màn "chưa có kế hoạch — tạo ngay", thay
   bằng một bài tám phần RỖNG. → Cột nằm trên **`groups`**, bảng luôn có đủ
   10 dòng.
2. **MỚI CÓ NHÓM 6 VÀ NHÓM 8 CÓ OFFICER.** Gác bằng `canManageGroup` là TÁM
   nhóm không ai nộp được link. → **Bất kỳ thành viên nào của nhóm cũng nộp
   được**, cố ý lệch với `patchTopic`. Đổi lại `ban_nop_boi` ghi ai nộp lần
   cuối và giao diện in tên ấy ra, nên nhóm tự thấy và tự sửa nhau được.

Bài học chung: **đừng suy ra hình dạng dữ liệu từ lược đồ.** Cột có trong DDL
không có nghĩa là dòng có trong bảng — cùng họ với bài học ngược của
`links.section_id` (cột nằm sẵn từ migration 0001 mà chưa từng được nối dây).

Một điều của bản cũ SỐNG SÓT nguyên vẹn sang bản mới và đáng giữ: **đường nộp
khoá chặt mà không cần kiểm gì.** Route không nhận id nào trong thân, nó ghi
thẳng vào `me.group_id` (bản cũ) / `me.id` (`putDeTai` nay). Không có id để
giả mạo — chốt chặn tốt nhất là chốt không tồn tại.

### Đề tài nộp theo LĨNH VỰC, theo cá nhân — không còn theo nhóm (0043)

Chiều 18/9, vài giờ sau khi phần B lên thật, Ngô Phú Cường gửi ảnh chụp một
lượt bình chọn Zalo (15 lĩnh vực, đã khoá) kèm quyết định của lớp: *"Các nhóm
hoạt động không hiệu quả nên lớp quyết định nộp đề tài tự do theo cá nhân hoặc
cùng lĩnh vực, không bắt buộc ai cũng phải nộp. Hình ảnh đính kèm là vote của
zalo nhưng rất khó để Ban cán sự lớp theo dõi. hãy điều chỉnh chức năng này
giúp tôi."*

**Vì sao một lượt bình chọn Zalo không thay được việc này** — nói rõ để lần
sau khỏi phải nghĩ lại: nó cho thấy avatar và tổng phiếu (14, 13, 8…) nhưng
**không nối được người với đề tài**, không chứa link bài, không xuất ra được,
và ai cũng sửa phiếu của mình bất cứ lúc nào mà không để lại dấu. Thứ Ban cán
sự lớp cần là một danh sách **có tên** — chính là thứ zone này đã có sẵn cả
màn hình lẫn nút xuất CSV.

Hai câu hỏi đã hỏi thẳng qua AskUserQuestion, cả hai đều chọn phương án hẹp:

- **Danh mục lĩnh vực: "đúng 15 mục, hết rồi"** — không có ô "khác", không tự
  thêm mục. Chép đúng 15 mục của lượt bình chọn.
- **Đường nộp theo nhóm: "bỏ hẳn, chỉ còn cá nhân"** — không giữ song song.

**Gỡ hẳn được vì đã soi D1 thật lúc 11h34 cùng ngày: cả 10 nhóm đều `(chưa
nộp)`**, không mất dữ liệu của ai. `DROP COLUMN` chạy được trên SQLite của D1
(đã kiểm cục bộ). Vì sao không giữ cả hai "cho chắc": hai chỗ nộp là hai nguồn
sự thật cho cùng một việc, và sẽ có ngày một người xuất hiện ở cả hai với hai
link khác nhau — Ban cán sự lớp không có cách nào biết cái nào đúng. "Giữ lại
phòng khi đổi ý" chính là cách lỗi ấy xảy ra.

**Ba cột mới đặt trên `dang_ky_tot_nghiep`, KHÔNG dựng bảng riêng**
(`khkd_linh_vuc`, `khkd_de_tai`, `khkd_url`, cộng mốc `khkd_luc`). Đây là cùng
một sự thật về cùng một người ở cùng một thời điểm — "tôi làm gì cho buổi
26/9" — và đặt ở đây thì được NGAY hai thứ mà một bảng riêng phải dựng lại từ
đầu: **đường công khai** (38 người không đăng nhập được vẫn khai lĩnh vực và
nộp link được, migration 0042), và **màn Ban cán sự lớp + xuất CSV** đã có.

#### `LINH_VUC_KHKD` KHÔNG phải `NGANH` — và tiền tố `lv-` là cố ý

`worker/src/lib/linh-vuc-khkd.js` là nguồn duy nhất của 15 mã. Đừng gộp nó
với `lib/nganh.js` (19 mã) dù nhìn na ná:

| | |
|---|---|
| `NGANH` | *"doanh nghiệp của bạn làm ngành gì"* — để GHÉP NỐI ở Giao thương. Sự thật về người ấy, còn giá trị sau 26/9. Tối đa **3**. |
| `LINH_VUC_KHKD` | *"bạn làm bài cuối khoá về lĩnh vực nào"* — để CHIA NHÓM LÀM BÀI. Hết hạn 26/9. Đúng **1**. |

Một người hoàn toàn có thể làm bài về lĩnh vực không phải ngành của mình. Hai
danh sách còn khác cả độ mịn: `NGANH` tách Y tế và Giáo dục làm hai mã, lượt
bình chọn của lớp gộp làm một.

**Mọi mã của danh sách mới mang tiền tố `lv-`** để không mã nào hợp lệ ở CẢ
HAI danh sách. Không có tiền tố thì `bat-dong-san` qua được `docNganh()` lẫn
`docLinhVucKhkd()`, nên một mã truyền nhầm từ bên này sang bên kia được nhận
**lặng lẽ** thay vì bị loại. **Mã đã vào D1 thì không đổi được nữa** (đổi mã
là mọi dòng cũ thành mồ côi, không chỗ nào báo lỗi); đổi NHÃN thì thoải mái.

Mã lạ → `null` (coi như chưa chọn) chứ **không** trả 422, đúng lý lẽ đã ghi
cho `docNganh()`: mã lạ chỉ tới được từ một giao diện cũ còn trong đệm trình
duyệt, mà chặn cả lượt lưu thì người dùng mất nguyên phần vừa gõ.

#### `khkd_luc` chỉ đóng dấu khi THẬT SỰ khai, và nhả ra khi xoá trắng

`coGi = !!(linhVuc || deTai || url)` — lưu một lượt rỗng thì mốc về `NULL`.
Lý do không phải sạch sẽ: màn Ban cán sự lớp đếm "đã khai" bằng chính mốc ấy,
mà con số đó là **cả lý do tính năng này tồn tại**. Đóng dấu cho một lượt bấm
Lưu hụt là đếm nhầm một người vào cột đã xong.

Cùng lẽ ấy, `logActivity` chỉ ghi **lần đầu** (`coGi && !cu?.khkd_luc`): sửa
lại một chữ mà đẩy thêm một dòng vào feed "Đang diễn ra" của cả nhóm thì feed
thành sổ nháp của một người.

#### Màn Ban cán sự lớp: hai thẻ, và 15 lĩnh vực LUÔN hiện đủ

`getDanhSachTotNghiep` trả thêm `theo_linh_vuc` — **cả 15 mục kể cả mục không
ai chọn**, mỗi mục kèm `so_nguoi`, `so_da_nop_link` và danh sách `nguoi[]`.
Lọc bỏ mục rỗng thì mất đúng câu hỏi Ban tổ chức hay hỏi nhất ("lĩnh vực nào
chưa ai làm"); mục rỗng hiện chữ "chưa ai chọn" ở 50% độ mờ, đọc lướt vẫn
phân biệt được ngay.

Thẻ thứ hai xếp theo NGƯỜI, và dưới cùng là khối **"Chưa chọn lĩnh vực (N)"**
kèm đúng một câu chú: *"Lớp đã chốt nộp tự do theo cá nhân hoặc cùng lĩnh vực,
không bắt buộc ai cũng nộp — nên danh sách 'chưa chọn' là để biết, không phải
để đòi."* Câu ấy có mặt là cố ý: một danh sách "chưa làm" mà không nói rõ điều
này sẽ bị đọc thành danh sách người lười, trong khi chính lớp đã quyết không
bắt buộc.

Thẻ đang mở (`DSTN_THE`) và tập lĩnh vực đang bung (`DSTN_MO`) giữ **ngoài**
hàm vẽ — cùng bài học `SOTHU`, `DANHBA_THE`, `TN_MO`.

#### Hai bẫy MỚI của bộ kiểm, cả hai đều im lặng

1. **`innerText` của Chrome trả về chữ ĐÃ ÁP `text-transform`.** Phép kiểm tìm
   `/Chưa chọn lĩnh vực/` đỏ dù chữ ấy có thật trên màn hình, vì `.eb` có
   `text-transform:uppercase` nên `innerText` trả `CHƯA CHỌN LĨNH VỰC`.
   (`textContent` thì KHÔNG áp — hai hàm cho hai kết quả khác nhau trên cùng
   một phần tử.) Nay so bằng regex không phân biệt hoa thường.
2. **Cột flex có `max-height` BÓP con xuống dưới chiều cao nội dung.** Tên
   lĩnh vực hai dòng ("Nông nghiệp - Lâm nghiệp - Thuỷ sản (trồng trọt & chăn
   nuôi)") bị **cắt mất dòng thứ hai**: `.dstnbox` là cột cuộn có `max-height`
   nên `flex-shrink` mặc định `1` bóp từng mục lại. Không lỗi JS, không phép
   kiểm chuỗi nào đỏ — **chỉ ảnh chụp mới thấy**. Chữa bằng `flex:0 0 auto`
   trên `.dstnlv`, và nay có phép kiểm so `scrollHeight > clientHeight` cho
   TỪNG mục để lần sau máy thấy trước người.

### Đợt thu cấp lớp ĐẦU TIÊN của dự án

Trước 18/9 `fund_rounds` chưa có một dòng `scope='class'` nào. Nay có đúng
một: **phí Gala 1.000.000đ/người, Vũ Thị Ngân (member 48), MB Bank
0975587586**, cú pháp `GALA {TEN} N{NHOM}`. Ba nguồn độc lập cùng chỉ một
người: thư mời Ban tổ chức (đã chép vào ghi chú migration 0040), số điện thoại
của chị trong roster seq 136, và vai `thu_quy` cấp lớp còn hiệu lực trên D1.

Viết bằng migration chứ không qua route vì **`postFund` đòi `isClassOfficer`,
mà Ngô Phú Cường là `uy_vien` nên KHÔNG tạo được đợt lớp** (uy_vien cố ý không
nằm trong `VAI_DIEU_HANH`). Chỉ Lưu Minh Tiến hoặc Vũ Thị Ngân tạo được.

**KHÔNG có trường nào tên "đã đóng phí" trong `dang_ky_tot_nghiep`.** Trạng
thái tiền đọc thẳng từ `fund_declarations`, và màn hình dùng LẠI chính
`shapeRound()` của `funds.js` (nay export) cùng đường ghi
`POST /api/funds/:id/declare` có sẵn — zone này **không có route tiền nào của
riêng nó**. Chép một cờ "đã đóng" vào đây là dựng nguồn sự thật thứ hai cho
tiền, thứ nguy hiểm nhất có thể làm. Câu 12 Ngô Phú Cường viết nguyên văn
*"Bạn đã đóng phí chưa? Rồi – Chưa?"* — đã sửa theo mục 6.4 SRS, và cả hai bộ
kiểm đều grep chuỗi "đã đóng" trong phúc đáp lẫn trên màn hình.

### `roster.dob` có dữ liệu thật, định dạng KHÔNG đồng nhất, chưa ai từng đọc

Đo trên D1 thật 18/9, **146 dòng**: 107 dạng `dd/mm/yyyy`, **28 dòng CHỈ CÓ
NĂM** (`'1966'`), 11 dòng trống, **0 dòng dạng lạ**. `grep -rn '\bdob\b'` trong
`worker/src/` và `public/` ra **0 kết quả** — cột này chưa code nào từng đọc,
nên chưa ai phát hiện.

In thẳng `'1966'` lên chứng chỉ là hỏng thật. Cách xử lý: điền sẵn **nguyên
văn**, gắn nhãn "Danh sách gốc chỉ có …, bổ sung đủ ngày/tháng/năm giúp nhé"
khi chuỗi không khớp `dd/mm/yyyy`, và lưu bản học viên xác nhận vào cột riêng
— **không ghi đè `roster.dob`** (bản ghi lịch sử của Ban tổ chức).

Cùng lý lẽ cho câu 9: `member_profile.needs` chỉ 80 ký tự mà câu hỏi đòi "cụ
thể". Không nới `needs` (nó đang hiện trong thẻ gọn ở Danh bạ và Giao thương,
nới ra là vỡ bố cục hai màn khác) — dùng cột riêng 500 ký tự, điền sẵn TỪ
`needs`.

### Nằm TRONG app.js, không phải thư mục rời — và không thêm tab thứ bảy

`/lich`, `/sotay`, `/giao-thuong` là thư mục rời vì chúng **phải chạy được khi
không có phiên**. Zone này thì ngược lại: chỉ học viên đã đăng nhập (Ngô Phú
Cường chọn, không mở cho khách ngoài lớp). Nằm trong ứng dụng thì nó thừa
hưởng sẵn phiên, `esc()`, `api()`, khuôn sheet, lề thanh trạng thái, khoá
zoom, băng "Có bản mới" — dựng lại từng thứ đó trong một tệp rời là chép lại
bốn tháng bài học.

Và **không phải sửa gì ngoài `app.js`/`app.css`**: `public/_redirects` vốn là
một luật vét `/*  /index.html  200` nên `/totnghiep` ĐÃ phục vụ ứng dụng, chỉ
cần thêm một nhánh `location.pathname` cạnh `/vao` và `/dangnhap`
(`app.js:4380-4392`). `_headers` cũng không đụng: `app.js`/`app.css` đã có
`Cache-Control: no-cache`, nên bẫy `/lich/lich.js` (bị quên nên dính
`max-age=14400`) không áp dụng.

**KHÔNG thêm tab thứ bảy** — `pw-nav.mjs` đã đo: nhãn "Giao thương" cần 75px
mà nút rộng nhất chỉ 69px ở khổ 430px. Thêm một tab nữa là mọi tab hẹp thêm,
cho một việc hết hạn 26/9. Thay vào đó là một thẻ ở đầu tab Hôm nay, **tự ẩn
sau 26/9 theo `HOME.hom_nay` của MÁY CHỦ** — không dùng ngày của máy người
dùng (bài học "đếm ngược lệch một ngày" 26/8), vì ở đây hậu quả nặng hơn: thẻ
có thể biến mất sớm một ngày với đúng người chưa kịp đăng ký.

### Hai lỗi THẬT chỉ bộ kiểm giao diện và ảnh chụp mới bắt được

1. **Lưu xong một phần thì khối tự gập, và MÃ QR BIẾN MẤT.** Bản đầu quyết
   mở/gập thuần theo "đã xong chưa". Bấm "Có, tôi dự" rồi Lưu → khối Gala
   thành "đã xong" → gập → mã QR và nút chuyển khoản mất, đúng giây người ta
   cần chúng nhất. Nay `TN_MO` giữ trạng thái NGOÀI hàm vẽ, đúng khuôn bộ lọc
   Sổ thu (`SOTHU`) và thẻ Danh bạ (`DANHBA_THE`).
2. **Quên nhánh dự phòng của mã QR.** Tab Quỹ có `img.onerror` thay mã hỏng
   bằng một ô giải thích (Đợt 3); màn này chép markup QR sang mà quên chép
   nhánh ấy. Không lỗi JS, không phép kiểm chuỗi nào đỏ — chỉ có một ô vỡ ảnh
   nằm giữa màn hình tiền nong. **Chỉ ảnh chụp 390px mới thấy.**

Kèm một bẫy của chính bộ kiểm: bấm `<summary>` là **TOGGLE**, không phải
"mở" — hai khối mở sẵn nên cú bấm của bộ kiểm ĐÓNG chúng lại, và triệu chứng
là "element is not visible" trên một phần tử vẫn nằm nguyên trong DOM.

### Xuất CSV: BOM UTF-8, và phép kiểm phải đọc BYTE

Ban tổ chức mở bằng Excel để ghép chứng chỉ, nên tệp bắt đầu bằng `﻿` và
xuống dòng CRLF — thiếu BOM thì Excel trên Windows đọc bằng bảng mã hệ thống
và mọi dấu tiếng Việt thành ký tự rác, tức mất cả công dụng của tệp.

**Phép kiểm phải đọc `arrayBuffer()`, không đọc `text()`.** Bản đầu viết
`csv.charCodeAt(0) === 0xFEFF` và ĐỎ dù BOM có thật (`od -tx1` cho ra
`ef bb bf`): bộ giải mã UTF-8 theo chuẩn WHATWG **nuốt BOM ở đầu dòng**, nên
mọi phép kiểm ở tầng chuỗi đều mù với đúng cái nó định canh. Cùng họ với bẫy
`TextDecoder` của `lib/ics.js`.

### Đường CÔNG KHAI cho 38 người không có số điện thoại (migration 0042)

Ngay sau khi phát hành, Ngô Phú Cường hỏi *"có cách nào tự động lấy link mời
không? sắp hết khoá học nên có thể nới rộng để đảm bảo mọi người đều có thể
input đủ thông tin"*.

**Soi D1 thật trước khi trả lời, và con số chia 77 người làm hai nửa gần đều:**

| | |
|---|---|
| **39 người TỰ VÀO ĐƯỢC** | có số đúng khuôn trong roster → `/dangnhap` gõ tên + số là xong. **Một tin Zalo cho cả lớp là giải quyết xong nhóm này**, không phát gì cả. |
| **38 người CẦN LỐI KHÁC** | roster không có số, hoặc số sai (`03845375x8`, `098778525`, `904580955`). Cửa `/dangnhap` đóng với họ. |

38 người ấy rải đều: Nhóm 1 và 6 mỗi nhóm 5, Nhóm 3/5/7/8 mỗi nhóm 4, Nhóm
2/4/9/10 mỗi nhóm 3.

**Ba cách nới đã đưa ra, Ngô Phú Cường chọn cách thứ nhất:**

1. **MỞ RIÊNG FORM TỐT NGHIỆP** ← đã làm. `/totnghiep` có thêm lối "Tôi không
   đăng nhập được — điền thẳng ở đây": tìm tên mình → điền → gửi. Một link duy
   nhất cho cả lớp, không phải phát gì.
2. Phát link hàng loạt (giữ nguyên an ninh, nhưng vẫn phải dán 10 lần).
3. ~~Nới cửa đăng nhập~~ — **bị loại, và ghi lại để khỏi bàn lại**: cho tự
   nhận hồ sơ bằng tên + email là **bỏ đúng cái bí mật duy nhất giữ cửa**, tức
   ai cũng chiếm được tài khoản của bất kỳ ai trong 38 người — mà vào được là
   đọc được danh bạ cả lớp kèm số điện thoại, sổ thu, bài, thông báo nội bộ.
   Đó đúng là lỗ hổng đã vá ngày 5/9. Đạt cùng một mục tiêu nhưng mở rộng hơn
   hẳn mức cần.

**Phân định đáng nhớ nhất của cả việc này: mục tiêu là ĐIỀN ĐƯỢC THÔNG TIN,
không phải ĐĂNG NHẬP ĐƯỢC.** Hai thứ ấy nới ra thì hậu quả cách nhau rất xa.

### Bốn điều làm đường công khai an toàn được

1. **KHÔNG cấp phiên.** Chỉ GHI được đúng một bản đăng ký. Không đọc được danh
   bạ/quỹ/bài/thông báo. Bốn route `totnghiep` còn lại vẫn nằm dưới dòng
   `getCurrentMember` và vẫn trả 401 khi không cookie — `deploy.yml` canh cả
   hai chiều trên tên miền thật.
2. **Form để TRỐNG, không điền sẵn.** `GET /api/totnghiep/cong-khai` không
   nhận tham số và không trả dữ liệu cá nhân của ai. Điền sẵn ngày sinh hay
   điện thoại ở đây là phát tán danh bạ cả lớp cho bất kỳ ai mở link — và đó
   là phép kiểm có răng nhất của `pw-totnghiep.mjs` (ô Ngày sinh và ô Điện
   thoại phải RỖNG). Bước tìm tên dùng LẠI `/api/wizard/roster/search`, đường
   vốn đã công khai và cố ý không bao giờ trả số điện thoại hay email.
3. **KHÔNG XOÁ ĐƯỢC gì của ai.** Bản đầu chặn bằng 409 `da_dien_tu_tai_khoan`
   khi gặp một dòng `nguon='phien'`; **đã nới ngày 18/9** thành ngữ nghĩa
   "khai bổ sung" — xem mục riêng ngay dưới. Điều phải giữ là chiều gốc: bất
   kỳ ai cầm link cũng KHÔNG được phá bản khai của 69 người đã đăng nhập —
   **đó mới là thiệt hại thật**, chứ không phải một dòng rác thêm vào.
4. **Hạn mức 400/IP/giờ**, trên sĩ số lớp (bài học 27/8).

**Một ngoại lệ có chủ ý cho điểm 2, Ngô Phú Cường yêu cầu ngày 18/9:** dòng
gian hàng in thẳng **số điện thoại anh Chử Minh Châu (0972182598)**, lấy từ
`roster` seq 27 — *"Ban tổ chức bố trí miễn phí. Liên hệ trực tiếp anh Chử
Minh Châu (…)"*. Đây là **lần đầu một số điện thoại có thật nằm trên một trang
mở được KHÔNG CẦN đăng nhập**, nên ghi rõ để đừng ai "sửa cho nhất quán" sau
này: nó là số liên hệ của một VAI trong sự kiện (như số tài khoản người thu đã
in sẵn trên thư mời), do Ban cán sự lớp chủ động công bố, chứ không phải dữ
liệu lấy ra từ danh bạ. Phép kiểm "không lộ số điện thoại của ai" vẫn nguyên
vẹn vì nó soi **phúc đáp JSON** của đường công khai — số này là chữ tĩnh trong
`app.js`. Muốn rút lại thì xoá đúng một cụm ở `tnckForm()` và giữ ở bản có
phiên (`veTotNghiep()`).

**KHÔNG đổi khoá của bảng — tự tạo dòng `members` thay vì thêm `roster_id`.**
Cách hiển nhiên là thêm cột `roster_id` rồi cho `member_id` NULL, nhưng thế là
bảng có HAI khoá và sinh ra một lỗi mất dữ liệu có thật: người điền form công
khai hôm nay, mai được phát link mời và đăng nhập, thì lượt đọc theo
`member_id` không thấy bản cũ — họ điền lại, và bảng có HAI dòng cho một
người. Nên đường công khai tự tạo dòng `members` (đúng nhóm trong roster,
`claimed_at` để TRỐNG), đúng khuôn `postDanhBaMoi` đã làm từ 3/9. Hệ quả tốt:
`claimed_at` vẫn trống nên cửa `/vao` KHÔNG đóng lại với họ, số điện thoại của
họ trong Danh bạ VẪN bị che, và khi họ đăng nhập thật thì vẫn là CÙNG MỘT dòng
— thấy ngay bản mình đã điền.

### Hai bẫy của chính bộ kiểm, cả hai đều im lặng

1. **Một dấu NHÁY KÉP trong chú thích SQL của `reset-totnghiep.sh` giết cả
   lượt reset.** Khối SQL nằm trong một chuỗi shell bọc bằng nháy kép, nên
   nháy kép thứ hai đóng chuỗi ngay tại đó; wrangler nhận phần còn lại làm
   THAM SỐ DÒNG LỆNH và chết bằng `Unknown arguments: tự, tạo, hồ, sơ …`.
   Triệu chứng ở đầu kia: bộ kiểm báo **401 cho một phiên vừa mới dựng**, và
   một tiến trình wrangler CŨ vẫn giữ cổng 8787 nên mọi thứ trông y như đã
   reset xong. Cùng họ với bẫy nháy đơn trong khối `node -e` của `deploy.yml`.
   Nay reset **đếm lại số phiên sau khi seed** và dừng ngay nếu thiếu.
2. **Thứ tự xoá trong reset là bắt buộc**: `dang_ky_tot_nghiep` và
   `fund_declarations` đều trỏ vào `members(id)`, xoá `members` trước là vỡ
   FOREIGN KEY và cả khối SQL không chạy dòng nào.

### Nới "tìm tên → điền → gửi" thành KHAI BỔ SUNG (18/9)

Ngô Phú Cường: *"Nới luật 'tìm tên → điền → gửi' khai báo bổ sung như phát
link riêng."* Tức đường công khai phải dùng được để **khai thêm phần còn
thiếu**, ngang với việc được phát một link riêng — chứ không phải chỉ dùng
được đúng một lần.

**Nới bằng cách đổi NGỮ NGHĨA, không phải bỏ chốt.** Chốt 409 sinh ra để chống
đúng một việc: ai cầm link cũng xoá được bản khai của người khác. Bỏ thẳng nó
là mở lại đúng lỗ ấy. Thay vào đó `postTotNghiepCongKhai` nay theo luật
**"lượt gửi công khai KHÔNG BAO GIỜ xoá trắng một ô đã có chữ"** — ô nào người
gửi để trống thì giữ nguyên giá trị cũ (`giuCu()`). Cùng một request rỗng vừa
là hình dạng của một lượt bổ sung thật vừa là hình dạng của một lượt phá hoại,
nên đáp án đúng cho cả hai là *không ô nào mất*.

Bốn chi tiết mà thiếu một cái là hỏng ngầm:

1. **`giuCu()` phải phủ CẢ BA phần.** Sót một ô là ô ấy bị xoá ở mọi lượt bổ
   sung — đúng cái vừa chống. Phần C và phần B dễ quên nhất vì mắt đổ dồn vào
   phần A.
2. **Hai ô đánh dấu (`gian_hang`, `van_nghe`) CỐ Ý không qua `giuCu`.** Hộp
   không tích gửi lên `0`, không phân biệt được với "không trả lời". Cho chúng
   ghi đè theo đúng thứ người gửi để lại, đổi lại người lỡ tích nhầm vẫn rút
   được — chặn luôn chiều ấy thì không còn đường nào bỏ đăng ký gian hàng.
3. **Ba mốc thời gian hỏi bản THÔ, không hỏi bản đã trộn.** Hỏi sau khi trộn
   thì một lượt chỉ điền Gala cũng đóng dấu `ho_so_luc`, và màn Ban cán sự lớp
   đếm nhầm người ấy vào cột đã xong — con số ấy là cả lý do màn ấy tồn tại.
   `ho_ten` không tính vào phép hỏi ấy: nó luôn có giá trị (rơi về tên trong
   danh sách gốc) nên tính vào là mốc nào cũng đóng ở mọi lượt.
4. **Khối phí đọc `du_le` ĐÃ TRỘN.** Đọc bản thô thì người đã khai "có dự" từ
   trước, nay quay lại bổ sung ngày sinh, nhận lại màn "không có khoản phí
   nào" — đúng lúc họ cần mã QR nhất.

**Cái giá của việc nới là phải NHÌN THẤY ĐƯỢC ai đi đường nào**, nên `nguon`
có giá trị thứ ba: `ca_hai`, xuất hiện đúng khi một bản do chính chủ điền
trong tài khoản về sau được bổ sung qua link công khai. Không cần migration —
cột `nguon` là TEXT không ràng buộc (0042). Và nó **đi vào CSV** thành cột
"Điền qua" (Tài khoản · Link công khai · Tài khoản + link công khai): nới luật
mà không cho Ban cán sự lớp chỗ soi lại thì mới là liều.

Câu chữ cũng phải đổi theo, và đây không phải trang trí: màn cuối nói "Đã cập
nhật" kèm *"những ô bạn để trống vẫn giữ nguyên nội dung cũ"* thay vì "Đã gửi
xong". Nói suông thì người quay lại lần hai tưởng mình vừa ghi đè sạch bản
khai của chính mình. Dòng "không sửa lại được, nhắn trưởng nhóm xin link đăng
nhập" ở màn cuối cũng **đã sai từ lúc này** — nay nói đúng: cứ mở lại trang,
tìm tên, gửi thêm lần nữa.

### Khai "đã chuyển khoản" là CẤT mã QR đi (18/9)

Ngô Phú Cường: *"Nếu khai đã chuyển tiền 1.000.000 thì ẩn phần mã QR đi."*
`tnVePhi()` nay có ba nhánh chứ không phải hai: chưa khai → mã QR + số tài
khoản + nút chép; **đã tự khai → cất cả ba**; người thu đã nhận → như cũ.

Đây là nguyên tắc "xong thì phải CẤT BỚT chứ không chỉ thêm dấu" đã ghi cho
tab Quỹ, nay áp **sớm hơn một nấc**: ở tab Quỹ mã chỉ biến mất khi người thu
xác nhận, ở đây biến mất ngay khi chính chủ tự khai. Lý do mạnh hơn ở đây vì
sandbox đã cho thấy đúng cảnh người dùng gặp lúc mạng yếu: mã không tải được
thì chỗ ấy thành một ô trống với dòng "Chưa hiện được mã" — nằm ngay dưới dòng
người ta vừa nói mình đã chuyển tiền xong, nên đọc lên như một lời báo hỏng.

(Đính chính 19/9: hai chỗ trong tệp này từng gọi ô ấy là "khối CAM". SAI —
`.qrw .ph` trong `app.css` là nền TRẮNG, viền xám `--line2`, chữ 12px `--ink3`.
Quyết định cất mã QR vẫn đúng, chỉ lý lẽ là nhẹ hơn bản ghi cũ.)

**Câu chữ mục 6.4 SRS KHÔNG đổi**: vẫn "đã tự khai", vẫn chip CAM, vẫn nói
người thu còn phải đối chiếu sao kê. Cất mã QR là bớt một lời mời trả tiền,
không phải tuyên bố đã thu xong. Và **đường lui phải nói ra**: chạm lại nút
là bỏ khai, mã hiện lại ngay — cất một thứ đi mà không nói cách lấy lại là
làm người ta sợ, nhất là người bấm nhầm.

**Tab Quỹ giữ NGUYÊN**, không sửa theo: ở đó người ta còn đang đi chuyển tiền
thật cho nhiều đợt, và quy ước hai mức của nó đã chạy từ Đợt 3.

### Thiếu "Logistics", và con số nói rằng danh mục ngành chưa ai từng dùng

Ngô Phú Cường 18/9: *"Trong phần khai Lĩnh vực hoạt động thiếu Logistics của
tôi, có thể rà soát những học viên đã khai báo để rà soát được không? Khác có
thể điền free text không?"*

**Vế Logistics không cần cột nào, cũng không cần thêm mã:** `van-tai` vốn đã
bao đúng ngành ấy, chỉ mang nhãn *"Vận tải · Kho vận"* nên người trong nghề
không nhận ra — họ gọi nó bằng từ tiếng Anh. Đổi nhãn thành **"Vận tải ·
Logistics · Kho vận"**, đúng luật ghi ở đầu `lib/nganh.js` (mã vào D1 thì
không đổi được, nhãn thì thoải mái). Bài học chung: **một mục có mặt mà không
ai nhận ra thì cũng bằng không có.**

**Vế "rà soát" cho một con số làm đổi hẳn câu trả lời** (soi D1 thật lượt 13,
14h51 ngày 18/9):

```
co_ho_so = 46  ·  da_chon_nganh = 0  ·  chon_nganh_khac = 0
cả 19 ngành đều = 0
```

**KHÔNG MỘT AI trong lớp từng bấm một chip ngành nào** — kể cả 46 người đã có
dòng `member_profile` (họ điền "bán gì / cần gì", không điền ngành). Nghĩa là
bộ lọc theo ngành ở tab Giao thương đang đứng trên dữ liệu rỗng, và danh mục
19 mã **chưa bao giờ được dùng thật**, nên không có bằng chứng nào nói nó
thiếu hay đủ. Vì vậy **không thêm/bớt mã nào theo phỏng đoán** — thứ đáng làm
là mở đường cho người không thấy mình trong danh sách TỰ NÓI ra, và đó cũng là
cách duy nhất để lần sau có dữ liệu mà rà.

`dang_ky_tot_nghiep` lúc ấy cũng RỖNG (`so_dong = 0`) — chưa ai mở form tốt
nghiệp. Cả hai con số cộng lại làm migration 0044 thành thứ rẻ nhất có thể:
thêm cột mà không đụng dòng nào của ai.

#### Ô chữ "Ngành khác": chốt chặn ở MÁY CHỦ, không ở chỗ ẩn ô đi

`dang_ky_tot_nghiep.linh_vuc_khac` (120 ký tự, migration 0044), hiện ra khi
bấm chip "Ngành khác" ở cả hai form. Ba điều cố ý:

1. **Đặt ở `dang_ky_tot_nghiep`, KHÔNG ở `member_profile`.** Cột này đi theo
   `linh_vuc` — bản ĐÃ XÁC NHẬN cho chứng chỉ. `putHoSo` cố ý không ghi ngược
   vào `member_profile`, nên đặt ở đó thì ô này không bao giờ được điền từ
   chính màn hình vừa sinh ra nó. **Giao thương giữ nguyên**, chip "Ngành
   khác" ở đó vẫn không có ô chữ: mở ra là chạm vào bộ lọc, trang công khai
   và thuật toán ghép nối — một quyết định KHÁC, chưa ai hỏi.
2. **`docLinhVucKhac()` trả `null` khi chip `khac` không còn được chọn.** Giao
   diện ẩn ô chữ, nhưng ẩn không phải chốt chặn (quy ước 6) — và cái giá rất
   cụ thể: bản xuất CSV sẽ in một ngành người ấy đã thôi khai, còn họ không
   thấy ô nào để sửa vì nó đang bị ẩn. Ẩn ô thì **không xoá chữ trong đó**,
   để bấm nhầm rồi bấm lại không mất đoạn vừa gõ.
3. **Cột "Lĩnh vực hoạt động" trong CSV nay in NHÃN**, không in chuỗi mã thô
   `van-tai,khac` — đúng dữ liệu mà không ai ngoài người viết mã đọc được, mà
   cả lý do tệp CSV tồn tại là để người khác đọc. Chữ tự do nối ngay sau nhãn
   ("Ngành khác: Logistics chuỗi lạnh").

### "Ép" khai đủ phần hồ sơ — và ngành khai ở đây đi thẳng sang Giao thương

Ngô Phú Cường 18/9: *"Khai đủ thông tin về doanh nghiệp và nhu cầu giao thương,
'ép' khai đủ những thông tin doanh nghiệp mới được submit."*

Lý do có yêu cầu này **đo được, không phải cảm tính**: soi D1 thật cùng ngày cho
`co_ho_so = 46` mà `da_chon_nganh = 0` — 46 người đã điền hồ sơ Giao thương,
**không một ai từng bấm một chip ngành nào**. Ô nào bỏ qua được thì phần lớn
người ta bỏ qua, và Ban tổ chức nhận về một bảng chứng chỉ thiếu chỗ này chỗ
kia mà không ai biết thiếu ai.

Bảy ô bắt buộc (`BAT_BUOC` trong `routes/tot-nghiep.js`): họ tên · ngày sinh ·
điện thoại · doanh nghiệp · chức vụ · lĩnh vực hoạt động · nhu cầu kết nối.
Chọn chip "Ngành khác" mà để trống ô chữ cũng tính là thiếu — bản xuất CSV in
ra đúng hai chữ "Ngành khác", không hơn gì việc không chọn gì, mà lại trông như
đã khai xong.

**RÀNG BUỘC CHỈ ÁP CHO PHẦN A, và đây là phần quan trọng nhất của cả quyết
định.** Phần C (Lễ & Gala, hạn **21h00 ngày 19/9**) và phần B (đề tài, lớp đã
chốt "không bắt buộc ai cũng phải nộp") không đụng tới. Buộc xong hồ sơ mới cho
đăng ký Gala là mất đúng cái hạn gấp nhất — chính cái bẫy mà thiết kế "ba phần,
ba nút Lưu" sinh ra để tránh. `kiem-totnghiep.mjs` có phép đối chứng riêng cho
đúng chiều này, vì phép "thiếu ô → 422" một mình vẫn xanh với một bản vá làm
hỏng nó.

Trên **đường công khai** thì hỏi thêm một câu nữa: chỉ đòi đủ khi lượt gửi có
động tới phần A (`coHoSo`). Bỏ điều kiện ấy thì một lượt gửi CHỈ để đăng ký
Gala cũng bị chặn.

#### `linh_vuc` nay GHI NGƯỢC sang `member_profile.nganh`

Trước 18/9 `putHoSo` **cố ý không** ghi ngược (bản trong `dang_ky_tot_nghiep` là
bản ĐÃ XÁC NHẬN cho chứng chỉ). Ràng buộc ở trên đổi bài toán: từ nay cả lớp
phải chọn ngành, nên để hai bên rời nhau là tự tay dựng hai nguồn sự thật —
`da_chon_nganh = 0` nghĩa là bộ lọc ngành ở tab Giao thương đang đứng trên dữ
liệu RỖNG, và nó sẽ rỗng mãi trong khi bảng bên này đầy dần.

Chỉ đụng **đúng một cột**, và chỉ vì nó là CÙNG một sự thật, cùng bộ mã, cùng
hàm `nganhRaChuoi()`. **KHÔNG chép `nhu_cau_ket_noi` sang `needs`**: ô ấy 80 ký
tự còn đây 500, mà `needs` đang hiện trong thẻ gọn ở Danh bạ lẫn Giao thương —
cắt cụt là vỡ bố cục hai màn khác, và cắt cụt trong im lặng thì người viết
không bao giờ biết câu của mình mất đuôi. N5 nguyên vẹn: dữ liệu của chính
người đang bấm Lưu, route không nhận `member_id` trong thân.

**Hệ quả với bộ kiểm, đã trả giá ngay:** `reset-totnghiep.sh` phải dọn thêm
`member_profile.nganh`. Không dọn thì lượt chạy sau mở form ra đã thấy chip
"Ngành khác" bật sẵn (do lượt trước để lại `nganh = khac,van-tai`) và hai phép
kiểm ô chữ đỏ ở một chỗ chẳng liên quan.

#### Giao diện: chặn trước ở form CÓ PHIÊN, KHÔNG chặn trước ở form CÔNG KHAI

Khác nhau có lý do, không phải quên. Form có phiên được điền sẵn từ chính bản
đã lưu, nên giá trị trên màn hình = giá trị máy chủ sẽ thấy → chặn trước là
đúng và tiết kiệm một lượt gọi. Form công khai thì **cố ý không biết gì về
người đang điền** (không điền sẵn ngày sinh hay điện thoại của ai), nên nó cũng
không biết những ô ấy ĐÃ CÓ trong D1 hay chưa — chặn trước ở đó là bắt người
quay lại **khai bổ sung** gõ lại cả ngày sinh lẫn điện thoại chỉ để thêm một
dòng, tức bóp chết đúng luồng vừa nới ra cùng ngày. Máy chủ hỏi trên bản ĐÃ
TRỘN nên nó biết; để nó quyết.

Không mất gì cho người dùng: nhánh `catch` chỉ hiện dòng lỗi, **không vẽ lại
màn**, nên mọi ô vừa gõ còn nguyên. `pw-totnghiep.mjs` canh đúng chỗ ấy.

Máy chủ trả `thieu_ten` — **tên ô còn trống**, không phải một câu "thiếu thông
tin". Form dài hơn một màn điện thoại; không nói rõ thiếu ô nào thì người ta
cuộn lên cuộn xuống rồi bỏ cuộc.

`TN_BAT_BUOC` trong `public/app.js` là **bản sao có chủ ý** của `BAT_BUOC`. Cách
gọn hơn (máy chủ đưa danh sách xuống) vướng đúng một chỗ: phúc đáp
`/api/totnghiep/cong-khai` có phép canh thô mà đắt giá — grep chuỗi `dien_thoai`
/ `ngay_sinh` / `email` trong nguyên văn JSON — và một danh sách schema mang
đúng những tên ấy làm nó đỏ. Nới phép canh thì mất một chốt bảo vệ danh bạ cả
lớp để đổi lấy một tiện nghi. Bản sao chịu được vì chỗ lệch nổ ra RẤT TO: 422
kèm `thieu_ten` đúng tên ô.

### Ba khối gập còn MỘT, và mã QR tự mở khi chưa chuyển phí

Hai yêu cầu của Ngô Phú Cường cùng ngày, và chúng **suýt cắn nhau**:

1. *"3 phần này nên gập vào và chỉ hiển thị một phần (2 phần còn lại thu gọn)
   cho gọn gàng."*
2. *"Câu hỏi đã chuyển khoản 1.000.000 chưa, nếu chưa thì sẽ tự động expand
   hình ảnh QR code."*

Gập cho gọn mà gập nhầm khối đang giữ mã QR thì người đã đăng ký dự Lễ nhưng
chưa chuyển tiền mở trang ra không thấy mã đâu — đúng người cần thấy nhất. Hoà
bằng `tnKhoiMoDau()`: thứ tự ưu tiên theo MỨC GẤP, không theo thứ tự trên màn
hình — còn phải chuyển phí → Gala; chưa trả lời Gala → Gala (hạn 21h 19/9);
chưa xong hồ sơ → Hồ sơ; chưa khai đề tài → Đề tài; xong hết → gập hết.

**Đây là một lỗ thật, không phải tinh chỉnh.** Lưu phần Gala xong là `gala_luc`
có giá trị, nên LẦN MỞ TRANG SAU khối ấy gập lại và mã QR nằm khuất. "Đã trả
lời xong" và "đã xong việc" là hai chuyện khác nhau, mà bản đầu chỉ hỏi câu thứ
nhất.

`TN_MO` đổi từ ba cờ độc lập thành **tên khối đang mở** (`'gala' | 'hoso' |
'detai' | null`) — ba cờ thì "mở cái này đóng hai cái kia" phải viết bằng ba
phép gán và sớm muộn sót một nhánh. Dùng `undefined` cho "chưa ai chạm tới", vì
`null` LÀ một giá trị hợp lệ (đã chạm, và đang gập hết).

**CỐ Ý KHÔNG dùng thuộc tính `name` của `<details>`** (accordion sẵn có của
trình duyệt): nó mới có từ Safari 17.2 và Chrome 120, mà lớp này 146 người đủ
loại máy — ai máy cũ sẽ thấy cả ba khối mở cùng lúc, đúng thứ vừa được yêu cầu
bỏ đi, và không có gì báo cho họ biết.

Kèm hai chi tiết câu chữ: câu hỏi nêu thẳng **con số** ("Bạn đã chuyển khoản
1.000.000 đ chưa?") thay vì hỏi trống không, và khi khối gập thì dòng phụ của
nó đổi thành "Còn phải chuyển 1.000.000 đ" — dòng duy nhất còn nhìn thấy được
lúc ấy. Không dùng chip màu: ✓ xanh trong sản phẩm này chỉ có MỘT nghĩa, người
thu đã nhận tiền.

**Một lỗi bố cục có thật lộ ra nhờ việc này**, và nó có từ trước: `.fc` có
`white-space:nowrap` — đúng cho hàng CUỘN NGANG, sai cho hàng `.fl.cuon` (xuống
dòng, không cuộn được). Nhãn lĩnh vực KHKD dài nhất đo được **416px ở khổ
390px**, tức tràn ngang cả trang và kéo mọi thứ lệch 42px. Phép đo tràn ngang
cũ không thấy vì nó đo lúc khối chứa hàng chip đang GẬP. Nay `.fl.cuon .fc` cho
`white-space:normal`.

### Chưa kiểm chứng được, và những việc còn lại

- **Chưa ai dùng zone này với dữ liệu thật.** Mọi phép kiểm chạy trên D1 cục
  bộ với ba phiên dựng tay.
- **Chưa ai khai lĩnh vực trên D1 thật.** Lớp đã bình chọn trên Zalo nhưng con
  số ấy CỐ Ý không gieo vào D1 (ảnh chụp chỉ có avatar, không cho biết ai chọn
  gì — gieo vào là dựng một bảng đếm không dò ngược được, đúng thứ đang phải
  chữa). Cả lớp khai lại trong ứng dụng, lần này mỗi phiếu có tên.
- ~~**Ảnh chân dung và logo (câu 7, 8) CHƯA làm**~~ → **ĐÃ LÀM 18/9**, qua
  Google Drive; cột `anh_url`/`logo_url` có sẵn trong bảng từ 0041 nên chỉ là
  cộng thêm, không đổi lược đồ. Xem mục riêng ngay dưới. **Vế còn treo lúc
  sáng — đường công khai không nhận ảnh — cũng đã xong chiều cùng ngày:** Ngô
  Phú Cường nói "làm nốt", nên 38 người không đăng nhập được nay nộp được ảnh
  ngay trong form công khai.
- ~~**Người đi đường công khai không sửa lại được**~~ → **đã nới 18/9**: mở
  lại trang, tìm tên, gửi thêm lần nữa là bổ sung được, và ô để trống giữ
  nguyên nội dung cũ. Xem mục "Nới … thành KHAI BỔ SUNG" ở trên. Thứ vẫn
  KHÔNG làm được: xoá trắng một ô đã có chữ — cố ý, và đó là chốt chặn.

## Rủ người CÙNG LÀM đề tài, và người kia phải ĐỒNG Ý (19/9, migration 0045)

Ngô Phú Cường: *"Thâm luồng: Phần chọn chung đề tài có thể chọn người cùng làm
và người đó đồng ý."*

**Cái hỏng nó chữa, nói bằng con số:** migration 0043 (chiều 18/9) chuyển đề
tài sang "nộp tự do theo cá nhân hoặc cùng lĩnh vực", nhưng phần B mới chỉ làm
được vế CÁ NHÂN — cơ chế "làm chung" hoàn toàn là quy ước xã hội, và giao diện
nói thẳng ra là *"cùng chọn một lĩnh vực và dán cùng một đường dẫn"*. Hệ quả:
ba người làm chung phải dán cùng một link BA LẦN, và màn Ban cán sự lớp đếm
thành **BA BÀI**. Đúng cái hỏng mà cả zone này sinh ra để chữa — lượt bình
chọn Zalo cũng cho con số mà không nối được người với đề tài.

Vế *"người đó đồng ý"* không phải chi tiết lịch sự. `putDeTai` **cố ý không
nhận `member_id` trong thân** (chính chủ tự khai, không ai khai hộ được). Cho A
nêu tên B là mở đúng chỗ ấy — và thứ giữ nguyên tắc N5 lại chính là bước B bấm
Đồng ý.

### Tám quyết định đã chốt, và hai cái cuối làm mô hình ĐƠN GIẢN ĐI

| | Chọn |
|---|---|
| "Cùng làm" nghĩa là gì | **Một bài CHUNG, chỉ người giữ bài sửa** |
| Rủ được ai | **Bất kỳ ai trong lớp**, xuyên nhóm |
| Báo tin | **Chỉ trong ứng dụng** — không thư, không đẩy |
| 38 người đi đường công khai | **Chỉ rủ được người ĐÃ ĐĂNG NHẬP** |
| Tối đa mấy người một bài | **Không giới hạn** |
| Ai gỡ người đã đồng ý | **Chỉ người cùng làm tự rời** |
| Bài chung lấy đề tài của ai | **Người gửi chọn lúc gửi** |
| Người đã có bài chung rồi | **Vẫn chọn được — đứng tên được nhiều bài** |

Hai dòng cuối là thay đổi so với bản kế hoạch đầu (Ngô Phú Cường bác bản ấy
bằng đúng một câu: *"Tôi có thể chọn người đã có đề tài"*), và chúng làm mô
hình **nhẹ hơn hẳn**, không phức tạp thêm — xem ngay dưới.

### Mô hình: bài NEO VÀO CHỦ, quan hệ là một dòng phẳng

Mỗi người có **đúng một bài của riêng mình** — chính là ba cột `khkd_*` trên
dòng `dang_ky_tot_nghiep` của họ. Bảng mới **không đụng tới chúng**. Ngoài ra
họ **đứng tên được trên bài của bất kỳ ai khác**, bao nhiêu bài cũng được.

Vì bài luôn neo vào **chủ** chứ không neo vào quan hệ, nên **không có chuỗi
lồng nhau, không có cây, không có vòng**, và **không có "bài hiệu lực", không
che gì cả** — đề tài riêng của mỗi người vẫn hiện và vẫn sửa được như cũ. Đó
là vấn đề lớn nhất của bản kế hoạch trước, và nó biến mất cùng với luật "một
người một bài".

### `nguoi_gui_id` — vì sao có cột này

Dòng luôn đọc là *"`ban` đứng tên trên bài của `chu`"*, và **người DUYỆT luôn
là người KHÔNG gửi**:

| Người gửi bấm | Dòng ghi ra | Ai duyệt |
|---|---|---|
| "Họ cùng làm **bài của tôi**" | `chu = tôi`, `ban = họ` | **họ** |
| "Tôi cùng làm **bài của họ**" | `chu = họ`, `ban = tôi` | **họ** |

Cả hai chiều đều do người kia đồng ý, đúng nguyên văn yêu cầu — và không cần
cột `huong` riêng. Thiếu cột này thì không phân biệt được "A rủ B" với "B xin
vào bài A", và **người gửi tự duyệt được đơn của chính mình**, tức vế ĐỒNG Ý
biến mất mà không chỗ nào báo lỗi. Đã chạy đối chứng: bỏ nó ra thì phép kiểm
của chiều `'toi'` VẪN XANH, chỉ chiều `'ho'` mới đỏ (README phép 60).

### `ux_cunglam_dang_song` — chỉ số MỘT PHẦN, và vì sao chỉ phủ hai trạng thái

`UNIQUE(chu, ban) WHERE trang_thai IN ('cho_duyet','da_dong_y')`. Chặn ở tầng
DB nên **không có khe hở giữa SELECT kiểm tra và INSERT** (bấm nhanh hai lần,
hai tab) — đúng khuôn `ux_doinhom_dang_cho`. Và vì nó chỉ phủ hai trạng thái
ĐANG SỐNG: **từ chối rồi vẫn rủ lại được ngay, rời ra rồi vẫn quay lại được**,
không phải xoá dòng cũ. Đổi ý là chuyện bình thường của người thật; bắt họ chờ
hết hạn một thứ không có hạn thì mới là lạ.

`da_huy` (người GỬI rút lời rủ khi còn chờ) và `da_roi` (người đã đồng ý tự
rời) **tách nhau** vì chúng là hai câu chuyện khác nhau, và bảng này là bản ghi
lịch sử của một thoả thuận giữa hai người.

### Năm route, và chỗ sai được ở từng route

| Route | Ai gọi được |
|---|---|
| `POST /api/totnghiep/cung-lam` | ai cũng được — `{doi_tac_member_id, bai_cua:'toi'｜'ho', loi_nhan}` |
| `…/:id/dong-y` · `…/:id/tu-choi` | **đúng người duyệt** (người KHÔNG gửi) |
| `…/:id/huy` | **người gửi**, khi còn `cho_duyet` |
| `…/:id/roi` | **chỉ `ban_member_id`** — chủ bài không gỡ được ai |

- **Sai người → 404, không phải 403** (quy ước 6): ở đây id ấy nói được cả hai
  người trong một thoả thuận riêng tư.
- **`INSERT` trước rồi bắt `String(err).includes('UNIQUE')` → 409**, không
  SELECT-rồi-INSERT.
- **Bước duyệt kiểm LẠI cả hai người còn `is_active`**, ngay trước khi ghi —
  phòng đua, vì một người có thể đã được cho ngừng tham gia SAU lúc gửi.
- **`logActivity` CHỈ khi ĐỒNG Ý.** Một lời rủ chưa phải chuyện đã xảy ra, và
  một lời TỪ CHỐI là chuyện riêng giữa hai người, không phải tin của cả nhóm.
- **Chỉ rủ được người `claimed_at IS NOT NULL`** — không phải chỗ quên: người
  kia phải bấm Đồng ý được, mà 38 người đi đường công khai không có phiên. Rủ
  họ chỉ để lại một lời rủ nằm chờ mãi mãi trên màn Ban cán sự lớp.
- **Đường CÔNG KHAI không đụng một dòng nào**, và có phép đối chứng riêng.

### `chon_duoc`: hiện MỜ, KHÔNG lọc ai ra

`getTotNghiep` trả thêm khối `cung_lam` gồm bốn danh sách (`bai_cua_toi` ·
`toi_tham_gia` · `cho_toi_duyet` · `toi_dang_cho`) cộng `chon_duoc` — **không
thêm route `GET` riêng**, giữ nếp "màn hình chỉ gọi MỘT lượt" của zone này.

`chon_duoc` liệt kê **đủ mọi người đã đăng nhập** trừ chính mình, và ba điều
cố ý:

1. **Chỉ id + tên + nhãn nhóm.** Không số điện thoại, không email — nên truy
   vấn thẳng `members`, KHÔNG dùng lại `/api/danh-ba` (payload nặng hơn, có số
   đã che, và ở đó `is_active` cố ý nằm trong JOIN nên người đã ngừng vẫn còn
   tên). `kiem-totnghiep.mjs` grep thô nguyên văn JSON để canh chỗ này.
2. **`trang_thai_voi_toi` chỉ nói quan hệ với NGƯỜI ĐANG XEM** (`null` ·
   `dang_cho` · `da_chung`). Không bao giờ hé lộ họ đang làm chung với ai khác
   — đó là việc riêng của họ.
3. **Người đã có quan hệ hiện MỜ, KHÔNG bị lọc khỏi danh sách.** Bỏ họ ra là
   lặp đúng lỗi vừa chữa sáng cùng ngày ở màn tìm tên: *"người không thấy tên
   mình sẽ kết luận Ban tổ chức bỏ sót họ"*.

### Giao diện: bốn phần trong khối Đề tài, và dòng phụ là mạng lưới an toàn

Xếp dọc, mỗi phần chỉ hiện khi có nội dung: **lời rủ đang chờ TÔI** (trên
cùng, khối `.tncl.cho` tô cam) → **đề tài của tôi** (ba ô như cũ, KHÔNG đổi gì)
cộng ai đang đứng tên bài tôi và lời rủ tôi đã gửi → **bài chung tôi đang tham
gia** (thẻ CHỈ ĐỌC + nút "Rời khỏi bài này") → nút **"Rủ người cùng làm"**.

Bốn điều cố ý:

1. **Lời rủ đặt TRÊN CÙNG.** Đây là việc của người khác đang chờ mình, và có
   hạn. Đặt dưới ba ô đề tài thì người mở khối ra để sửa một chữ sẽ không bao
   giờ cuộn tới.
2. **Dòng phụ `<summary>` thành "N người đang chờ bạn trả lời", tô `.con`
   (cam `--due`).** Dùng LẠI nguyên lớp CSS của khối Gala, **không dựng chấm
   đỏ mới**: `veChamDo()` khoá cứng `[data-v="nay"]` và đếm bảng `thong_bao`,
   mượn nó cho việc khác là làm hỏng nghĩa của nó.

   **Và đây là mạng lưới an toàn thật, không phải trang trí:** `tnKhoiMoDau()`
   xếp Gala LÊN TRƯỚC lời rủ (hạn 21h00 19/9 gấp hơn), nên người chưa trả lời
   Gala mở trang ra thấy khối Gala còn khối Đề tài GẬP. Dòng phụ cam ấy là thứ
   DUY NHẤT còn nhìn thấy được lúc ấy. `pw-totnghiep.mjs` có một phép riêng cho
   đúng cảnh đó.
3. **Chủ bài KHÔNG có nút gỡ ai**, và khối nói thẳng ra rằng muốn ai rời thì
   chính họ tự bấm. Nút "Rời" chỉ hiện ở màn NGƯỜI CÙNG LÀM.
4. **Sheet rủ dùng LẠI `.fdpick`** của bước chọn tên ở `/vao` (cả dòng là một
   `<button>` cao ≥56px, đo thật 63px). Ô tìm lọc **thẳng trên DOM** — vẽ lại
   sheet là ô tìm mất tiêu điểm và bàn phím điện thoại sập xuống sau MỖI chữ.
   Nút Gửi **không dùng `submitting()`**: lỗi ở đây là thứ cần ĐỌC KỸ ("người
   này đã cùng làm với bạn rồi") chứ không phải một dòng trôi qua trong ba
   giây, nên nhánh hỏng chỉ hiện dòng lỗi và KHÔNG đóng sheet — lời nhắn vừa
   gõ còn nguyên.

**Huy hiệu ✓ và ô tiến độ "Đề tài" phải TRÙNG KHÍT**, và cả hai nay tính CẢ
việc đứng tên bài người khác (`d.khkd_luc || cl.toi_tham_gia.length`): người
đã nhận lời làm chung thì ĐÃ CÓ chỗ trong bài cuối khoá, dù ô đề tài riêng còn
trống. Lệch một chút là dải ô nói "chưa điền" ngay trên một khối mang dấu ✓.
Cùng phân định ấy áp cho `chua_chon_linh_vuc` ở màn Ban cán sự lớp.

### Màn Ban cán sự lớp đếm theo BÀI, và giữ CẢ HAI con số

`theo_linh_vuc` đổi từ danh sách NGƯỜI sang danh sách BÀI, nhóm theo lĩnh vực
của **chủ bài**, mỗi bài kèm danh sách người cùng làm (thụt vào dưới chủ bài,
vạch trái — xếp ngang hàng thì màn hình lại đọc thành một danh sách người,
đúng cái vừa sửa).

- `so_bai` = số ĐỀ TÀI — thứ Ban tổ chức xếp lịch bảo vệ theo.
- `so_nguoi` = số LƯỢT ĐỨNG TÊN, chủ bài cộng người cùng làm — thứ thanh so
  sánh dùng (một lĩnh vực 2 bài 6 người "đông" hơn một lĩnh vực 3 bài 3 người).

Một người đứng nhiều bài thì **đếm nhiều lần**, và đó là sự thật màn hình phải
nói ra: nó là cái giá của quyết định "đứng tên được nhiều bài", và là lý do
CSV in **cả hai chiều** ("Ai cùng làm bài của tôi" · "Cùng làm bài của") — nếu
có ai đứng năm bài thì Ban cán sự lớp **nhìn thấy** chứ không phát hiện lúc
chấm. Mỗi người vẫn đúng một dòng CSV, và đọc dòng ấy là thấy hết.

**Dòng đầu thẻ Đề tài phải nói rõ ĐANG ĐẾM GÌ.** Bản đầu viết "N/21 người đã
chọn lĩnh vực" trống không, đọc lên như mâu thuẫn với các dòng dưới (ở đó
"người" gồm cả người cùng làm). Nay là "N bài · M đã nộp link · K/21 người tự
đứng tên một bài riêng". Hai chỗ nói hai chuyện về cùng một chữ là đúng loại
lỗi tệp này nhắc nhiều nhất — chỉ khác là lần ấy nó nằm gọn trong một câu.

### `computeAction`: bước MỚI chen giữa Gala và hồ sơ

*"Có người rủ bạn làm chung đề tài"* → `target: 'totnghiep'`, xếp **sau** hai
bước Gala/hồ sơ-gấp và **trước** bước hồ sơ. Lý do: đây là việc của NGƯỜI KHÁC
đang đứng chờ — không trả lời thì họ không biết đi tiếp thế nào — còn hồ sơ là
việc của riêng mình, hoãn một hôm không ai chờ.

Gác bằng chính `tn.con_ho_so` nên nó **tự tắt sau 26/9**, không để lại một việc
chết trong "Việc của bạn" suốt phần đời còn lại của ứng dụng. Truy vấn con thêm
vào CÙNG câu đã có, không `UNION ALL` (bẫy D1). Điều kiện `nguoi_gui_id <> ?`
là vế ĐỒNG Ý của cả tính năng: thiếu nó thì chính người vừa rủ lại được nhắc đi
trả lời lời rủ của mình — xem README phép 62 cho bài học về việc phép kiểm ấy
ban đầu KHÔNG có răng.

### Chưa kiểm chứng được, và điều CỐ Ý không làm

- **Chưa ai dùng với dữ liệu thật.** Mọi phép kiểm chạy trên D1 cục bộ với ba
  phiên dựng tay. Bằng chứng duy nhất đáng tin là hai người thật rủ nhau.
- **38 người không đăng nhập được KHÔNG vào bài chung được.** Họ vẫn nộp riêng
  như cũ. Đó là cái giá của việc đòi người kia bấm Đồng ý, không phải chỗ quên.
- **Chủ bài không gỡ được ai** (Ngô Phú Cường chọn). Ai bấm Đồng ý nhầm rồi
  biến mất thì chủ bài phải nhắn Zalo nhờ họ tự rời.
- **Không giới hạn số người một bài** (Ngô Phú Cường chọn, sau khi tôi nêu
  rằng hội đồng có thể không biết chấm bài nào). Không chặn ở máy chủ — màn Ban
  cán sự lớp và CSV in ra đủ để nhìn thấy.
- **KHÔNG gửi thư, KHÔNG đẩy** (anh chọn). `chonNguoiNhanMail()` cũng không
  dùng lại được: nó chỉ có hai phạm vi (cả lớp / cả nhóm), không gửi cho MỘT
  người, và lọc cứng `nhan_mail_thong_bao` — công tắc mà người dùng được nói là
  *"Thư khi có thông báo mới"*.
- **N1 vẫn nguyên vẹn.** Đây không phải chat người-với-người: đúng một lời nhắn
  200 ký tự kèm một lời rủ, không trả lời lại được, không chuỗi hội thoại. Bàn
  bạc vẫn ở Zalo.

## Tab Hôm nay thôi giục "đề tài nhóm" — và cách đọc màu của zone Lễ (19/9)

Ngô Phú Cường: *"ở Trang 'Hôm nay' vẫn có session 'Nhóm chưa có đề tài'. dù
chúng ta đã thay đổi luồng này rồi mà."*

Chuỗi thật là **"Nhóm chưa chốt đề tài"**, và nó sinh ở **MÁY CHỦ** —
`computeAction()` (`routes/home.js`), không phải ở giao diện. `drawNay()` chỉ
in thẳng `HOME.action.h/.p/.c` vào ô hero, không có một điều kiện nào. Ai đi
tìm chuỗi ấy trong `app.js` sẽ không thấy gì.

**Vì sao nó chỉ gõ cửa Nhóm 6, suốt từ Đợt 2:** migration 0003 gieo dòng
`plans` của Nhóm 6 với `topic_* = NULL`, và **Nhóm 6 là nhóm DUY NHẤT có dòng
`plans`** (chín nhóm kia chưa chạy wizard — con số đo được 18/9). Với họ
`if (plan)` là false nên bước này không bao giờ chạy. Hệ quả cho bộ kiểm: phép
canh chuỗi ấy **phải chạy bằng phiên Nhóm 6**, chạy bằng nhóm khác là xanh
giả.

Tệ hơn "lỗi thời": nó đứng ở **bước 2 của chuỗi ưu tiên** nên chặn mọi gợi ý
sau nó, và câu chữ còn tự xưng *"đây là việc chặn mọi việc khác"*.

### Phạm vi đã chốt: bỏ ở Hôm nay, LÀM MỀM ở tab Bài, GIỮ cỗ máy

Hỏi thẳng qua AskUserQuestion, Ngô Phú Cường chọn phương án hẹp. `plans.topic_*`
**GIỮ NGUYÊN**, cùng `PATCH /api/plan/topic`, wizard và xuất Word — vì nó còn
một người dùng thật: **giai đoạn `de_tai` của Trợ lý KHKD** (`routes/tro-ly.js`),
tức vế *"dẫn dắt TỪ Ý TƯỞNG"* chính anh yêu cầu ngày 12/9. Thứ hỏng chỉ là
**câu chữ** và **thứ tự ưu tiên**, không phải cột dữ liệu. `kiem-tro-ly.mjs`
chạy lại KHÔNG sửa gì và vẫn xanh — đó là bằng chứng cỗ máy không bị đụng.

### Bước tốt nghiệp xếp LÊN ĐẦU — lần đầu một việc CÓ HẠN chen trên mục 7.1 SRS

`computeAction()` nay mở đầu bằng việc tốt nghiệp của CHÍNH người đang xem, đọc
`dang_ky_tot_nghiep`. Hai nhánh, xếp theo mức gấp đúng khuôn `tnKhoiMoDau()`:
chưa trả lời Gala (hạn 21h00 19/9) → chưa xong hồ sơ chứng chỉ (hạn 26/9).

Xếp trên cả bước "bốn dòng hồ sơ" là cố ý: hai hạn này nằm **ngoài** ứng dụng
và hỏng thì mất chứng chỉ hoặc mất suất dự Lễ; bốn dòng Giao thương không có
hạn nào. Bước này **tự tắt sau 26/9** nên chuỗi của SRS trở lại nguyên vẹn —
không để lại một việc chết trong "Việc của bạn" suốt phần đời còn lại của ứng
dụng.

**Đề tài KHKD CỐ Ý không có nhánh nào ở đây.** Lớp đã chốt "không bắt buộc ai
cũng phải nộp"; đặt một việc không bắt buộc vào khối mang tên "Việc của bạn"
là nói sai bản chất — đúng cái sai vừa phải chữa.

Bốn chi tiết mà thiếu một cái là hỏng ngầm:

1. **HAI mốc, HAI điều kiện riêng.** Sau 21h00 19/9 nhánh Gala tự tắt, nhánh
   hồ sơ còn sống tới hết 26/9. Gộp một mốc thì hoặc nhắc Gala sau khi hết
   hạn, hoặc tắt hồ sơ sớm bảy ngày.
2. **`HAN_GALA`/`NGAY_LE` `export` từ `tot-nghiep.js`, KHÔNG chép sang.** Hai
   bản sao của một cái hạn thì sớm muộn lệch nhau, và triệu chứng là ô hero
   tắt sớm hoặc muộn một ngày mà không chỗ nào báo. `kiem-totnghiep.mjs` quét
   `home.js` tìm chuỗi `2026-09` và đòi ra **0 kết quả** — chốt duy nhất chặn
   được chuyện ấy.
3. **Mọi phép so ngày giờ do SQLite làm** (quy ước 1), trong MỘT truy vấn có
   hai truy vấn con trên chỉ mục UNIQUE. Không `UNION ALL` (bẫy D1).
4. **Thẻ 🎓 ở tab Hôm nay ẩn đi khi hero đã dẫn sang `/totnghiep`.** Hai khối
   liền nhau cùng một đường dẫn, cùng một câu, thì cái thứ hai chỉ làm loãng
   cái thứ nhất.

### Vá kèm: đừng mời người đã từ chối Gala chuyển 1.000.000 đ

Gỡ bước đề tài làm lộ ra một lỗi CÓ THẬT: bước "Có quỹ đang mở" không biết đợt
Gala là khoản **chỉ của người dự Lễ**, nên ai trả lời "Không" vẫn được mời "Mở
mã QR". Lỗi ấy đang sống với **chín nhóm** ngay hôm nay (họ không có dòng
`plans` nên vốn đã rơi thẳng xuống bước quỹ); chỉ Nhóm 6 được bước đề tài che
mất. Nay bước 5 bỏ qua đợt Gala khi `du_le <> 'co'`, nhận ra đợt ấy bằng
`(scope, amount, account_no)` chứ **không theo tiêu đề** — tiêu đề sửa được
bằng nút ✎ trong ứng dụng.

**Đính chính 19/9 (tối):** bản vá ấy viết `tn?.du_le !== 'co'` mà **QUÊN select
cột `du_le`** trong truy vấn ở đầu `computeAction` — nên `tn.du_le` luôn
`undefined`, vế ấy luôn đúng, và đợt Gala bị bỏ qua với **MỌI người, kể cả
người đã trả lời "Có dự" và chưa chuyển tiền**. Tức bản vá chữa quá tay đúng
thứ nó định chữa. Không lỗi, không cảnh báo; triệu chứng duy nhất là ô "Việc
của bạn" im lặng đúng lúc cần nhắc nhất, trong ngày chốt danh sách Gala. Đã vá
(commit riêng, đẩy trước tính năng cùng-làm), và `kiem-totnghiep.mjs` nay canh
**cả hai chiều**: phép một chiều ("có dự → fund") vẫn xanh với một bản vá thô
bạo bỏ luôn điều kiện `du_le`.

### Ba chỗ câu chữ nữa, cùng một luồng, ở ba tầng khác nhau

Sửa hero mà quên ba chỗ này thì chữ cũ vẫn còn, có chỗ **trên đúng màn hình
vừa chữa**:
- **`logActivity` ở `routes/plan.js`** ghi `summary: 'chốt đề tài của nhóm'` —
  dòng ấy chảy thẳng vào khối "Đang diễn ra" của CHÍNH tab Hôm nay. Nay là
  "ghi đề tài chung của nhóm".
- **Khối Đề tài ở tab Bài** thôi dùng chữ CAM `var(--due)` — cam trong sản
  phẩm này nghĩa là "còn phải làm gì đó", mà đề tài chung thôi là việc còn nợ.
  `pw-totnghiep.mjs` đọc màu THẬT bằng `getComputedStyle` rồi so với chính giá
  trị `--due` lấy từ stylesheet; ghi cứng mã màu là có ngày đổi biến mà phép
  kiểm vẫn xanh.
- **Bìa bản Word** (`routes/export.js`) — một lời kể trạng thái trên tài liệu
  đi ra ngoài, nay nói đúng rằng đề tài chung là tuỳ chọn.

**Một cái bẫy của chính phép kiểm, đã vấp:** regex `/chốt đề tài/` quét feed
"Đang diễn ra" bắt NHẦM chuỗi của đường CÁ NHÂN (`totnghiep.detai` ghi "chốt đề
tài KHKD: …"), tức bắt nhầm đúng thứ vừa dựng lên. Phải soi đúng chuỗi của
đường NHÓM.

**`deploy.yml` có một bước NGUỒN chạy trước khi deploy**, grep `worker/src` và
`public` tìm ba chuỗi đã bỏ. Kiểm ở tầng nguồn chứ không trên tên miền vì chuỗi
hero sinh ở máy chủ mà `/api/home` đòi phiên. Hệ quả cho người viết chú thích:
**không trích nguyên văn chuỗi cũ trong `worker/src` hay `public`**, kể cả
trong chú thích — một phép grep phải chừa ngoại lệ là một phép grep sẽ mục.
`migrations/` và CHÍNH tệp này thì phải nhắc lại, đó là chỗ ghi lịch sử.

### Zone `/totnghiep` nay có NHẬN DIỆN riêng — và vì sao là màu CHÀM

Ngô Phú Cường gửi ảnh chụp kèm ba yêu cầu: ba chip tiến độ bị rơi xuống hai
dòng, ba khối cần khai chưa nổi bật, và *"riêng phần tốt nghiệp bạn hãy trau
chuốt cho khác với giao diện hàng ngày một chút"*.

**Màu nhận diện là CHÀM (`--le` `#403A72`), và lý do là NGỮ NGHĨA chứ không
phải thẩm mỹ.** Trong sản phẩm này `--go` (xanh) có đúng một nghĩa (xong /
người thu đã nhận) và `--due` (cam) có đúng một nghĩa (còn phải làm gì đó).
Mượn một trong hai làm màu nhận diện là làm hỏng cả hai. Chàm là hướng duy
nhất còn trống, và nó tách xa cả hai trên **trục xanh lam** — trục mà người mù
màu đỏ-lục vẫn phân biệt được, khác hẳn cặp xanh-lá ↔ cam vốn đã sát nhau
(ΔE 7.7 protan, đo được ở khối biểu đồ tiến độ thu).

**LUẬT: `--le` CHỈ dùng cho khung sườn** — băng đầu trang, huy hiệu bước, viền
khối đang mở. Tuyệt đối không dùng nó để nói một trạng thái; trạng thái vẫn chỉ
có ba màu cũ: xanh xong, cam còn nợ, xám chưa tới.

Ba thay đổi, mỗi cái chữa đúng một điều anh chỉ ra:

1. **Băng đầu trang `.tnhead`** — nền đặc chàm chuyển sắc, chữ trắng, mũ tốt
   nghiệp chìm ở góc. Trên điện thoại người ta nhận ra một màn hình bằng MẢNG
   MÀU trước khi kịp đọc chữ, mà cả ứng dụng còn lại là thẻ trắng trên nền xám
   ấm. Áp cho CẢ đường công khai (`tnckShell`) — 38 người đi lối ấy phải thấy
   mình đang ở đúng chỗ.
2. **Ba ô tiến độ thành LƯỚI BA CỘT**, không còn `flex-wrap`. Wrap là ô thứ ba
   rơi xuống dòng hai ở khổ 390px, mà rơi dòng là mất đúng công dụng của dải
   này: ba mốc phải nhìn thấy CÙNG LÚC. Chữ trạng thái xuống dòng BÊN TRONG ô.
   `pw-totnghiep.mjs` đo bằng `offsetTop` — cùng hàng thì cả ba bằng nhau;
   phép đếm "có ba ô" một mình vẫn xanh khi chúng xếp thành ba dòng chồng nhau.
3. **Mỗi `<summary>` có HUY HIỆU BƯỚC** (số thứ tự → ✓ khi xong), tiêu đề
   15.5px, và **dòng hạn xuống dòng RIÊNG**. Nằm cạnh tiêu đề thì ở khổ 390px
   nó đẩy tiêu đề vỡ ra thành ba dòng so le — đúng cảnh trong ảnh chụp. Khối
   ĐANG MỞ có **dải chàm bên trái cộng nền đầu khối**: hai dấu hiệu chứ không
   một, vì ba khối giống hệt nhau thì không biết mình đang đứng ở đâu sau khi
   cuộn giữa một biểu mẫu dài.

**Một bẫy nhỏ của bộ kiểm kèm theo:** `h1` nay nằm TRONG băng nên
`.tncard > h1` thôi khớp — ba phép trong `pw-totnghiep.mjs` phải đổi sang
`.tncard h1`.

### Chưa kiểm chứng được

- **Chưa ai mở ô hero mới trên tên miền thật.** Sandbox không gọi vào
  `k3vaceo.cuongngo.app` được. Bằng chứng duy nhất là Ngô Phú Cường mở tab Hôm
  nay và đọc câu mới.
- **Hành vi sau 21h00 19/9 và sau 26/9** — không đẩy được đồng hồ của D1, nên
  hai nhánh tự-tắt chỉ chứng minh được ở tầng biểu thức.
- **Hai nửa của bản vá có hai tốc độ khác nhau:** chuỗi hero sinh ở máy chủ nên
  đúng ngay sau lượt deploy; câu chữ ở tab Bài nằm trong `app.js` nên có thể
  trễ tới 4 tiếng vì Browser Cache TTL cấp zone (xem mục "Làm mới").

## Hai LỖI vá trước khi phát link, và hai chỗ nới kèm (19/9)

Ngô Phú Cường xin tư vấn chủ động: *"UI mới khá ổn, bạn xem lại các chức năng
bên trong cần điều chỉnh UI như thế nào thì chủ động tư vấn cho tôi."* Soi bên
trong thì hai thứ hoá ra **không phải chuyện giao diện mà là lỗi**, và cả hai
nằm đúng trên đường 146 người sắp đi. Link chưa phát — nên còn đúng một cửa sổ
yên tĩnh để vá. Anh chọn vá cả hai ngay, cộng hai chỗ nới.

### Ô ĐIỀN SẴN vô hiệu hoá mọi luật "ô trống thì giữ bản cũ" đứng sau nó

**Đây là bài học đáng nhớ nhất của cả đợt.** Máy chủ hứa `giuCu()` — ô nào để
trống thì giữ nguyên giá trị cũ — và mục "Nới … thành KHAI BỔ SUNG" ở trên ghi
hẳn lý lẽ: *"lượt gửi công khai KHÔNG BAO GIỜ xoá trắng một ô đã có chữ"*.

Nhưng `tnckForm()` điền sẵn BA ô bằng dữ liệu **danh sách gốc 15/8** lấy từ
`/api/wizard/roster/search`: họ tên, doanh nghiệp, chức vụ. Ba ô ấy **không
bao giờ rỗng**, nên `giuCu()` không bao giờ nhìn thấy chúng trống — người đã
sửa doanh nghiệp trong tài khoản, hôm sau quay lại chỉ để thêm ngày sinh, bị
**trả ngược về bản 15/8**, im lặng, đúng lúc màn cuối đang hứa ngược lại.

Chữa bằng `placeholder=` thay `value=`: chữ mờ giữ đủ hai vế — vẫn nhìn thấy
bản gốc, mà để trống vẫn là "giữ bản đã lưu". Ba điều đã xác minh chứ không
suy đoán, vì nếu sai thì hỏng ở chỗ nguy nhất (ô bắt buộc):

- `doanh_nghiep` / `chuc_vu` đi qua `giuCu()`, vốn kiểm `moi === ''` tường minh.
- `ho_ten` đi qua chuỗi rơi lui **gõ → bản đã lưu → danh sách gốc**, và
  `cleanText('')` trả `null` nên `??` bắt đúng. Để trống không bao giờ ra tên rỗng.
- `BAT_BUOC` cố ý không xét `ho_ten`, nên để trống không sinh 422.

Kèm một dòng nói thẳng chữ mờ nghĩa là gì — không nói thì người ta tưởng ứng
dụng đã điền hộ rồi và bỏ qua ô cần sửa.

**Phép canh phải đi HAI TẦNG, mỗi tầng một mình đều mù:** giao diện kiểm
`value === ''` **và** `placeholder` có chữ (chỉ kiểm placeholder thì đổi ngược
về `value=` vẫn xanh — trên ảnh chụp hai thứ trông y hệt nhau); máy chủ phải
lưu `doanh_nghiep` một giá trị KHÁC bản gốc rồi bổ sung một ô khác, vì fixture
cũ chưa bao giờ sửa hai ô ấy trước khi bổ sung.

**Ghi kèm, CỐ Ý KHÔNG sửa:** hai ô `gian_hang` / `van_nghe` vẫn không qua
`giuCu` (lý lẽ ở mục trên: phải có đường rút đăng ký). Lý lẽ ấy đúng nhưng giả
định người ta NHÌN THẤY trạng thái hiện tại — form công khai thì luôn vẽ hai ô
chưa tích. Đây là một quyết định cần hỏi lại, không phải một bản vá lén.

### `gala_luc` đóng dấu vô điều kiện — làm sai chính con số chốt danh sách

`putGala` ghi `gala_luc = datetime('now')` kể cả khi `du_le` còn `null`. Khác
hẳn `putDeTai` ngay bên dưới, vốn có `coGi` kèm chú thích giải thích đúng cái
bẫy này; đường CÔNG KHAI cũng có (`coGala`). **`putGala` là chỗ DUY NHẤT quên.**

Hệ quả: bấm Lưu mà chưa chạm Có/Không thì ô "Dự Lễ" thành **✓ xong**, huy hiệu
khối 1 thành ✓, và `xong_gala` trên màn Ban cán sự lớp **đếm người ấy vào cột
đã trả lời** — trong khi Ban tổ chức không có câu trả lời nào. Con số ấy là cả
lý do màn kia tồn tại, và hạn dùng nó là 21h00 ngày 19/9.

Bản vá chép đúng câu chữ của `coGala` để hai đường không lệch nhau, và
`logActivity` cũng phải mang thêm vế `coGi` — thiếu nó thì một lượt Lưu rỗng
vẫn đẩy một dòng vào feed "Đang diễn ra" của cả nhóm.

**Phép canh đi CẢ HAI CHIỀU:** một bản vá chặn quá tay làm người trả lời
"Không dự" cũng không đóng được mốc, và họ biến mất khỏi danh sách y hệt.

### Nút chép SỐ TÀI KHOẢN — ở cả ba khối QR

Nút `.copy` cũ chỉ chép **cú pháp chuyển khoản**. Số tài khoản nằm trong
`.qrw .cap`: chữ thường 12.5px, không nút, không chép được. Mà nhánh dự phòng
lúc mã QR hỏng lại nói thẳng *"chuyển khoản tay theo số tài khoản bên dưới
cũng được"* — tức đường lui chính thức bắt người 50 tuổi đọc tay một dãy 10
chữ số ở cỡ chữ nhỏ thứ hai trên màn hình rồi gõ lại vào app ngân hàng. Gõ sai
một số là tiền đi nhầm người.

Áp cho **cả ba chỗ dựng `.qrw`**: `tnVePhi()`, màn cuối đường công khai
`tnckXong()`, và thẻ đợt thu ở **tab Quỹ**. Đây là chỗ DUY NHẤT của đợt này
chạm vào tab Quỹ — cộng thêm một nút, không đụng quy ước hai mức của Đợt 3.
Để hai màn tiền khác nhau là đúng chỗ người ta học sai thói quen.

Mỗi nút mang `data-nhan` để toast nói đúng thứ vừa chép, và một nhãn phụ
`.copy .nh` ("chép số TK" / "chép nội dung"). **Nhãn ấy phải khai font riêng:**
`.copy` dùng `var(--num)` (Space Grotesk) cho dãy số, mà font ấy thiếu glyph
tiếng Việt nên chữ có dấu rơi về monospace, đứng lệch hẳn.

### Bước tìm tên: bỏ cắt ẩn ở 12 người, và sửa lời khuyên ngược

`searchRoster` cắt cứng `.slice(0, 12)` và giao diện **không báo là đã cắt**.
Gõ `"nguyen"` khớp 26 người, `"ng"` khớp 74 — đều chỉ thấy 12. Người không
thấy tên mình sẽ kết luận Ban tổ chức bỏ sót họ, ngay ở bước ĐẦU TIÊN của lối
đi duy nhất dành cho 38 người không đăng nhập được. Tệ hơn, khi ra 0 kết quả
thì câu cũ khuyên **"Thử gõ ngắn hơn"** — ngược đúng chiều, vì gõ ngắn thì
càng nhiều người khớp và càng bị cắt.

Máy chủ trả thêm `tong_khop` cạnh danh sách đã cắt; giao diện in *"Còn N người
nữa cũng khớp — gõ thêm chữ (họ, tên đệm) cho danh sách ngắn lại"*, và câu khi
0 kết quả nay nói đúng chiều. Sửa ở **cả hai** màn dùng chung đường này:
`/totnghiep` và `/vao`.

**Chốt phải giữ:** `/api/wizard/roster/search` là đường CÔNG KHAI và cố ý không
bao giờ trả số điện thoại hay email. Chỉ được cộng thêm **một con số đếm**,
không thêm trường nào của ai, và phải là **khoá MỚI** chứ không đổi khoá cũ —
`/vao` và wizard dùng chung đường này. Phép canh có răng nhất là grep thô
nguyên văn phúc đáp: không `"phone"`, không `"email"`, không chuỗi 10 chữ số.

## Màn VÀO — bốn chỗ sửa sau khảo sát các màn cũ (19/9)

Ngô Phú Cường xin tư vấn chủ động về **giao diện cũ ở những chức năng ngoài
zone Lễ tốt nghiệp**. Ba khảo sát chạy song song (Hôm nay + Bài + Trợ lý ·
Danh bạ + Giao thương + Tư liệu · Quỹ + Tài khoản + đăng nhập + bốn trang
rời) ra khoảng 50 phát hiện; anh chọn làm **màn vào** trước, tức `/vao` và
`/dangnhap`. Những phần còn lại nằm ở mục "Đợt C — chưa chọn" cuối mục này.

**Vì sao anh chọn đúng chỗ này:** đây là màn của **77 người chưa vào được**,
và nó chưa ai đụng vào từ 27/8 — tức từ trước khi có Giao thương, Trợ lý, zone
Lễ. Mọi bài học về cỡ chữ và vùng chạm học được sau đó chưa từng quay lại đây.

### 1. Cả dòng tên bấm được — cú chạm quan trọng nhất của sản phẩm

Trước 19/9, bước chọn tên chỉ cho bấm vào chữ **"là tôi"**: `.lnk` 12px nằm
trong một ô cao **18px**, sát mép phải. Đó là cú chạm ĐẦU TIÊN của mọi người
chưa vào, và nó nhỏ hơn mọi nút khác trên màn hình.

Nay cả dòng là một `<button class="fdpick">` cao **≥ 56px** (đo thật: 62,8px).
Chữ "là tôi" **GIỮ LẠI** làm dấu hiệu bấm được — bỏ đi thì dòng trông như một
dòng chữ để đọc, và không ai biết là chạm được.

**`veDongChon()` dùng CHUNG giữa `/vao` và đường công khai `/totnghiep`.** Hai
bản sao thì sớm muộn lệch nhau, và chỗ lệch sẽ nằm đúng trên cú chạm đầu tiên
của hai nhóm người khó vào nhất (77 người chưa đăng nhập và 38 người không
đăng nhập được).

**Phép kiểm bấm vào CHÍNH CHỮ TÊN**, không bấm vào chữ "là tôi": bấm chỗ cũ
thì một bản vá chỉ nới chữ "là tôi" ra cũng xanh.

### 2. Khối báo lỗi thật, thay cho `.hintline` đổi màu chữ

Cả ba màn vào báo lỗi bằng `.hintline` — **11,5px màu `--ink3`, tức 2,7:1 trên
nền trắng** — rồi chỉ đổi MÀU CHỮ sang `--due` khi hỏng. Đó là thông điệp
**QUYẾT ĐỊNH BỎ CUỘC**, đặt ở đúng cỡ chữ nhỏ nhất và màu nhạt nhất của cả ứng
dụng, cho một lớp 35–55 tuổi đang đứng ở cửa.

`.vmsg` dùng lại **đúng cặp màu của `.claimcard .err`** (`--due` trên
`--due-bg` = **4,78:1**, đạt AA), 13,5px. Không thêm màu mới. Và **không có
nhánh xanh**: `--go`/`--go-bg` trong sản phẩm này có đúng một nghĩa (người thu
đã nhận tiền) — mượn nó cho "đã gửi mã mới" là làm hỏng nghĩa ấy. Tin báo
bình thường dùng nền xám trung tính (`.vmsg.tin`).

**Câu chữ tách làm hai dòng: câu CHÍNH ngắn, ĐƯỜNG RA xuống dòng riêng.** Bản
cũ của `phone_mismatch` nhồi cả nguyên nhân lẫn cách chữa vào **203 ký tự**
một câu. Nay là *"Số không khớp với số Ban tổ chức đang giữ."* (42 ký tự) +
*"Đã đổi số? Nhắn trưởng nhóm xin link đăng nhập, vào rồi tự sửa số trong tab
Tài khoản."* Một câu lỗi không nói được đường ra thì chỉ làm người ta đứng lại.

`.vmsg` áp cho cả **màn nhận link mời** (`renderClaim`, trước dùng `.errline`
11,5px) — đó là thông điệp quyết định của người vừa bấm vào link, tức người
chưa từng dùng ứng dụng lần nào.

### 3. Chỉ dấu bước — ba bước trước nay không có dấu hiệu nào

`vaoShell(title, sub, body, buoc)`. Bước nào cũng trông như bước cuối thì
không ai biết còn bao xa, mà "còn bao xa" là câu hỏi quyết định đi tiếp hay
đóng trang. Màn NGOÀI chuỗi (thiếu số, xong rồi) truyền `undefined` nên không
có dấu — chúng không phải bước 4.

**Phép kiểm đi HẾT ba số**: ghi cứng "Bước 1 / 3" ở mọi màn vẫn xanh với phép
hỏi một lần. Và so bằng `textContent` chứ không `innerText` — `.lb` có
`text-transform:uppercase` nên `innerText` của Chrome trả `BƯỚC 1 / 3`, đúng
cái bẫy đã ghi cho màn Ban cán sự lớp và vấp lại ngay lượt chạy đầu.

### 4. Hai chỗ nhỏ, mỗi chỗ một lý do

- **Chỗ giữ chỗ "đang tìm".** Debounce 350ms CỘNG một lượt gọi trên WiFi hội
  trường là vài giây màn hình đứng im — mà đứng im là thứ làm người ta gõ lại
  từ đầu hoặc bỏ cuộc. Phép kiểm phải **làm chậm lượt gọi** (`page.route`,
  900ms) mới nhìn thấy được; không làm gì thì nó xanh cả khi chỗ giữ chỗ không
  tồn tại.
- **Đường chuyển luồng thành NÚT.** "Đăng nhập bằng email" (ở `/vao`) và "tự
  nhận diện" (ở `/dangnhap`) là hai đường ra duy nhất khi đi nhầm luồng, mà
  chúng đang là liên kết 11,5px trong `.foot` màu `--ink3`. Ai đi nhầm luồng
  đúng là người ít kiên nhẫn nhất còn lại. `.vlink` cao 46px, **viền NHẠT hơn
  `.wide.ghost` và cách xa hơn** — nó là lối RẼ SANG LUỒNG KHÁC, không phải
  lựa chọn thứ ba ngang hàng; cùng độ đậm thì ba nút xếp chồng đọc thành ba
  việc như nhau.

Kèm: `<input disabled>` của ô Họ tên ở màn nhận link đổi thành một dòng chữ
(`.vdoc`) — một ô nhập mờ đi đọc lên như một ô **HỎNG**; và `.claimcard
.hintline` nâng lên 12,5px `--ink2`, **chỉ trong phạm vi ba màn vào**.

### Điều CỐ Ý KHÔNG làm trong đợt này

**`--ink3` và khoá zoom giữ nguyên toàn ứng dụng.** Khảo sát chỉ ra rằng
`--ink3` `#93999D` cho **2,7–2,9:1** trên nền trắng và đang tô mọi `label.f`,
`.hintline`, `.foot` ở 9,5–12,5px, trong khi `index.html` đặt `user-scalable=
no, maximum-scale=1` nên Android **không phóng to được** — tức chữ vừa dưới
ngưỡng đọc được vừa không phóng được. Đó là hai dòng sửa cả ứng dụng, nhưng
Ngô Phú Cường chưa chọn nó, nên **chỉ nâng trong phạm vi `.claimcard`**. Đừng
tự ý đổi biến chung: nó chạm mọi màn cùng lúc và cần anh quyết.

### Đợt C — phần CHƯA chọn, đã khảo sát xong

Ghi lại để khỏi khảo sát lại. Xếp theo ai bị thiệt:

- **Sổ thu 146 dòng ≈ 10.200px KHÔNG có ô tìm**, ba nút hành động cao 23px
  cách nhau 6px trong đó một nút tuyên bố "người thu đã nhận" (tiền thật), và
  xác nhận một người là **mất chỗ đang cuộn**.
- **Nút chép nằm trong `<button>` có `user-select:none`** (`app.css:53`), nên
  khi clipboard hỏng thì lời khuyên "chép tay giúp nhé" là **bất khả thi**.
- **Tab Tài khoản**: cửa duy nhất là một vòng tròn 34px không nhãn; nhánh
  iPhone-chưa-cài là chữ thuần 13,5px mô tả một nút không có nhãn trên iOS;
  `catch { box.textContent = '' }` làm cả ô biến mất, câm.
- **Trợ lý KHKD**: bàn phím bật là mất cả câu hỏi lẫn nút Gửi.
- **Tab Bài**: khối yêu cầu `.rub` tĩnh 272px đẩy mọi thứ bấm được xuống dưới
  màn.
- **Giao thương**: ô tìm 15px → iPhone **tự phóng to cả trang** và không thu
  lại (luật 16px đã ghi từ 5/9, sót đúng một chỗ).
- **Tư liệu**: 12 dòng trống chỉ người dùng vào một nút ✎ **không có** trên
  màn của họ.
- **`/sotay`**: 17 ảnh chụp thu còn **61%**, chữ trong ảnh 7–8px, không phóng
  được. **`/rieng-tu`** mồ côi, không trang nào trỏ tới.
- **`_headers` bỏ sót `/lich/*`, `/sotay/*`, `/rieng-tu/*`** nên ba trang ấy
  vẫn dính `max-age=14400` — đúng cái bẫy đệm mà chính chú thích trong tệp ấy
  cảnh báo.
- **Sĩ số 134 vs 146** còn sai ở `/sotay` và `/giao-thuong`.
- **`lib/ics.js` không phát `LOCATION:`** — có nó thì lịch iPhone/Android tự
  cho nút chỉ đường, không cần link Google Maps rút gọn nào. Cần một cột
  `dia_diem` trên `lich_hoc`.

## Dải ba ô tiến độ `/totnghiep` thành THANH TAB (19/9)

Ngô Phú Cường gửi ảnh chụp, khoanh đỏ dải ba ô **Hồ sơ · Đề tài · Dự Lễ**:
*"3 chip khoanh đỏ cũng bấm được nhé"*. Chúng vốn là ba `<span>` trần — muốn
mở một khối thì phải cuộn xuống tìm đúng `<summary>`. Mà dải ấy nằm ngay dưới
băng đầu trang và trông y như một thanh tab, nên chạm vào là chuyện đương
nhiên; chạm mà không gì xảy ra thì đọc lên như ứng dụng đơ.

### HAI DẢI XẾP NGƯỢC NHAU — chỗ sai được trong im lặng

| ô | nhãn | khối | vị trí khối |
|---|---|---|---|
| 0 | Hồ sơ | `hoso` | thứ **2** |
| 1 | Đề tài | `detai` | thứ **3** |
| 2 | Dự Lễ | `gala` | thứ **1** (mở sẵn vì hạn 21h 19/9 gấp nhất) |

Ánh xạ theo CHỈ SỐ thì chạm "Hồ sơ" mở ra Gala, và **không chỗ nào báo lỗi**.
Nên `tnOTienDo()` nhận `sec` làm tham số ĐẦU TIÊN và ba nơi gọi truyền khoá
tường minh. Phép kiểm cũng phải soi theo **tên `data-sec`**, tuyệt đối không
theo vị trí — một phép soi theo chỉ số sẽ xanh với đúng bản vá hỏng.

### Không viết lại accordion, và không vẽ lại màn

Listener sẵn có nghe **`toggle` của `<details>`**, không nghe `click`. Nên
handler của ô chỉ đặt `el.open = true` là việc gập hai khối kia và gán `TN_MO`
tự chạy theo — một nguồn sự thật, không có bản sao logic.

**TUYỆT ĐỐI không gọi `veTotNghiep()`** trong handler: hàm ấy vẽ lại toàn bộ
`#root`, tức xoá trắng mọi ô người ta đang gõ dở ở hai khối kia.

### Dấu "đang mở" đồng bộ trong listener `toggle`, KHÔNG trong handler của ô

`tnSonChip()` được gọi từ trong chính listener `toggle`. Đặt nó ở handler của
ô thì mở khối bằng `<summary>` — đường vốn có từ đầu — sẽ không làm dấu ấy
đổi, và hai chỗ nói hai chuyện ngay lần đầu có người chạm summary. Có phép
kiểm riêng cho đúng chiều ấy (bấm summary rồi soi dải ô).

### `outline` chứ không `box-shadow`, và vì sao chàm là đúng luật

Ô đã xong dùng `box-shadow` cho viền xanh `--go-line`; ghi đè bằng box-shadow
là mất viền ấy. `outline:2px solid var(--le); outline-offset:-2px` chồng lên
được và nằm trong ô nên không đội lưới. Đã chụp cả hai tổ hợp ở 390px —
ô-trắng-đang-mở và ô-xanh-đang-mở — cả hai đều đọc được.

Chàm `--le` ở đây là **nối tiếp ngôn ngữ đã có**, không phải màu mới:
`.tnsec[open]` vốn đã dùng đúng chàm ấy cho dải trái, viền và nền đầu khối. Ô
và khối nói cùng một chuyện ("bạn đang ở đây") nên phải cùng một màu — đúng vế
"viền khối đang mở" mà luật `--le` cho phép, và không phải một trạng thái.

### `toggle` là sự kiện KHÔNG ĐỒNG BỘ — và nói thẳng cái chưa chứng minh được

Gán `el.open = true` rồi cuộn ngay thì cú cuộn được tính TRƯỚC lúc accordion
gập hai khối kia, tức nhắm vào một toạ độ sắp không còn đúng. Handler vì vậy
chờ `toggle` (`{ once: true }`) rồi mới cuộn, và có nhánh riêng cho khối đang
mở sẵn — gán `open = true` lên khối đã mở thì **không bắn `toggle` nào cả**,
thiếu nhánh ấy là chạm vào ô của khối đang mở thì không có gì xảy ra.

**Nhưng phải ghi đúng sự thật: bản ngây thơ KHÔNG hỏng ở bố cục hiện nay.** Đã
gỡ bản vá ra chạy đối chứng và bộ kiểm vẫn xanh. Đo được lý do: gập khối Hồ sơ
làm trần cuộn tụt từ **2265px xuống 468px**, nên trình duyệt KẸP cú cuộn lại
đúng vào chỗ cần tới (đỉnh khối ở 15px so với 36px của bản có vá — mắt không
phân biệt được). Cú kẹp ấy chỉ cứu khi khối đích là khối CUỐI và khối vừa gập
là khối dài nhất nằm trên nó; thêm một khối thứ tư hoặc đổi thứ tự là mất. Giữ
cách chờ `toggle` để không phải nhớ điều kiện ấy — nhưng **đừng ghi nó vào sổ
như một lỗi đã bắt được**, và bộ kiểm cũng không phân biệt được hai bản.

### Chưa kiểm chứng được

Cảm giác chạm thật trên điện thoại. Bộ kiểm chứng minh được ánh xạ đúng khối,
vùng chạm 48px, dấu đồng bộ hai chiều và việc cuộn có xảy ra — không chứng
minh được cú cuộn mượt ấy dễ chịu hay chóng mặt với người thật.

## Số khai ở `/totnghiep` nay MỞ ĐƯỢC cửa `/dangnhap` (19/9)

Ngô Phú Cường: *"Một số người đã đăng nhập và đã điền số điện thoại email
nhưng tôi gửi link đăng nhập cho họ, họ lại không thấy hiện lên?"* — hỏi lại
thì triệu chứng là **"mở ra màn đòi số điện thoại"**, và cách phát là **"tôi
bảo họ tự vào `/dangnhap`"** (không phát link mời nào cả).

**Hai lỗi chồng lên nhau, và cả hai đều thật.** Tra tới nơi rồi dựng lại bằng
một trình duyệt có phiên sống, không suy đoán.

### Lỗi một: `/dangnhap` không hề hỏi máy này đã có phiên chưa

`boot()` (`public/app.js`) gọi thẳng `renderVao()` cho `/dangnhap`, `/vao` và
`renderLogin()` cho `/dangnhap/email` — **không nhánh nào kiểm phiên**. Dựng
lại được: một trình duyệt mà `/api/home` trả 200 với tên "Ngô Phú Cường" vẫn
nhận về màn *"BƯỚC 1 / 3 · Bạn là ai?"*.

Nay có một **BĂNG**, không phải một cú chuyển hướng. Ba quyết định:

- **Băng chứ không đá về `/`.** Người thật sự muốn đăng nhập bằng tài khoản
  khác — máy dùng chung, trưởng nhóm mở hộ — phải còn nguyên đường vào. Biểu
  mẫu vẫn nằm ngay dưới băng, không ai mất gì.
- **Không chặn lượt vẽ đầu.** `vaoDoPhien()` KHÔNG await: màn vào là màn của
  77 người chưa vào được, bắt họ chờ một lượt gọi mạng trước khi thấy ô nhập
  là đổi chỗ hỏng này lấy một chỗ hỏng khác. Vẽ trước, hỏi sau; người không có
  phiên không bao giờ thấy gì. (Cookie phiên là `HttpOnly` nên JS không đọc
  được — bắt buộc phải hỏi máy chủ, không có đường tắt.)
- **Đo MỘT lần cho cả ba bước.** `VAO_PHIEN` nằm ngoài hàm vẽ và `vaoShell()`
  sơn lại ở mỗi bước — đúng khuôn `SOTHU` / `DANHBA_THE` / `TN_MO`.

### Lỗi hai: số họ tự khai trong ứng dụng CHƯA BAO GIỜ tới được cửa đăng nhập

`soHopLeTuHoSo()` (`routes/onboard.js`) chỉ tin `roster.phone` — bản Ban tổ
chức nạp 15/8 — **trừ khi** chính chủ đã tự đặt số của mình
(`phone_self_set_at`). Mà trước 19/9 dấu ấy chỉ được ghi ở **đúng một chỗ**:
`patchMember` (`routes/members.js:101`, tab Tài khoản, tự sửa của chính mình).

`putHoSo` thì chỉ ghi `dang_ky_tot_nghiep.dien_thoai`. Nghĩa là cả lớp sắp gõ
số thật vào ô BẮT BUỘC của phần Hồ sơ, rồi sang `/dangnhap` gõ đúng số ấy và
nhận *"Số không khớp với số Ban tổ chức đang giữ"*. Đo thẳng trên D1 cục bộ để
chắc, không suy từ code: `members.phone = 0900000123` + `phone_self_set_at`
NULL + `roster.phone = 0911111111` → gõ số tự khai ra `phone_mismatch`, gõ số
trong danh sách gốc ra `ok`.

Nay `putHoSo` gọi `chepSoSangMembers()`. Cùng lý lẽ đã dùng cho `linh_vuc` →
`member_profile.nganh` ngày 18/9: để hai bên rời nhau là tự tay dựng hai nguồn
sự thật cho cùng một sự thật về cùng một người.

#### Ba điều làm nó an toàn — CẢ BA phải còn đúng

1. **Chỉ gọi từ `putHoSo`** — đường CÓ PHIÊN, ghi vào `me.id`, không nhận
   `member_id` trong thân. Đúng cùng mức tin cậy với `patchMember`. N5 nguyên
   vẹn: dữ liệu của chính người đang bấm Lưu.
2. **TUYỆT ĐỐI không gọi từ `postTotNghiepCongKhai`.** Đường ấy không có phiên
   — nó chỉ biết một `roster_id` gõ trong URL. Cho nó đặt dấu này là trao cho
   bất kỳ ai cầm link `/totnghiep` quyền đặt chìa khoá đăng nhập cho MỘT NGƯỜI
   KHÁC: tìm tên họ, gõ số của mình, rồi sang `/dangnhap` tự nhận hồ sơ của
   họ — mà vào được là đọc được danh bạ cả lớp kèm số điện thoại, sổ thu, bài,
   thông báo nội bộ. Đúng lỗ hổng đã vá ngày 5/9. Có chú thích ghi thẳng điều
   ấy ngay tại chỗ gọi `chepNganhSangHoSo` của đường công khai, để lần sửa sau
   không ai "cho nhất quán hai đường ghi".
3. **Chỉ nhận số ĐÚNG KHUÔN 10 chữ số** (`isValidVnPhone`). Ghi một số sai
   khuôn vào là dựng một chìa khoá không bao giờ mở được, mà lại che mất
   `roster.phone` đang dùng tốt — hỏng ngầm, không chỗ nào báo.

**Đã chạy đối chứng cả hai chiều** (xem README phép 56): gỡ lời gọi ở
`putHoSo` → phép "số tự khai mở được cửa" ĐỎ; thêm lời gọi vào đường công khai
→ phép an ninh ĐỎ, và kèm theo lộ ra rằng lượt ghi công khai còn **ĐÈ MẤT** số
chính chủ đã tự đặt.

Và ô Số điện thoại ở phần Hồ sơ nay có một dòng nói ra chuyện đó — không nói
thì người ta không biết mình vừa mở được cửa cho chính mình.

### Điều CỐ Ý không làm

**Không đụng `/i/:token`.** Link mời trỏ tới một người CỤ THỂ, nên một người
đang đăng nhập mở link mời của chính mình (hoặc của người khác trên máy dùng
chung) là ca hợp lệ — chặn ở đó là làm hỏng đúng đường vá ngày 5/9. Băng chỉ
đặt ở ba màn ĐĂNG NHẬP.

**Không chép `email` sang `members`.** `BAT_BUOC` của phần Hồ sơ cố ý không có
email, và `members.email` là cột UNIQUE trong cohort — một đường ghi thứ hai
vào đó là một nhánh 409 mới ở giữa biểu mẫu tốt nghiệp, cho một thứ không ai
xin.

## Màn Thống kê của Ban cán sự lớp: BA thẻ, và ba thứ chưa từng hiện (19/9)

Ngô Phú Cường: *"Điều chỉnh UI thông minh, logic hơn zone Thống kê dành cho
Lớp trưởng (người đã được phân quyền) xem số người đăng ký dự Gala, tài trợ,
tách thống kê đề tài."*

Bản cũ trộn hai việc khác hẳn nhau vào một sheet hai thẻ: danh mục **ĐỀ TÀI**
(việc của khoá học, hạn 26/9, lớp đã chốt KHÔNG bắt buộc ai cũng nộp) và việc
tổ chức **LỄ & GALA** (hạn 21h00 ngày 19/9, có tiền, phải gọi từng người). Hai
nhịp khác nhau, hai người hỏi khác nhau.

Và **ba thứ đã thu từ 18/9 mà màn hình chưa bao giờ hiện**: `tai_tro`,
`gian_hang`, `van_nghe`. Chúng chỉ nằm trong tệp CSV — tức muốn biết ai đăng
ký tiết mục văn nghệ thì phải tải tệp về rồi mở Excel, trong khi đó đúng là
câu hỏi người dựng chương trình hỏi nhiều nhất trong tuần cuối.

Nay ba thẻ: **Tổng quan · Đề tài · Từng người**, mặc định mở Tổng quan.

### ĐẾM Ở MÁY CHỦ, không đếm trong hàm vẽ

`getDanhSachTotNghiep` trả thêm khối `thong_ke`. Lý do không phải tiết kiệm
vài vòng lặp: thẻ "Từng người" nay có ô tìm và sẽ còn thêm bộ lọc, nên một
phép đếm viết trong hàm vẽ sẽ lặng lẽ đếm **theo bộ lọc đang bật** — con số
đúng với người đang gõ "nhóm 6" vào ô tìm lại là con số sai để báo Ban tổ
chức. Đếm một lần ở máy chủ thì nó luôn là con số của CẢ LỚP.

### Mẫu số của khối phí là NGƯỜI DỰ LỄ, không phải sĩ số

Khoản 1.000.000đ chỉ của người dự buổi tối. Lấy mẫu số 146 thì con số đọc lên
như cả lớp đang nợ tiền, mà phần lớn trong đó còn chưa trả lời có đi hay
không. Ba chi tiết đi kèm, mỗi cái một lý do:

- **Hai nhánh ĐÃ CÓ TIỀN đếm trên TOÀN BỘ danh sách**, không chỉ người dự Lễ:
  ai chuyển tiền rồi mới đổi ý không dự thì khoản ấy vẫn có thật trong tài
  khoản người thu — giấu đi là làm lệch sổ.
- **`chua_khai` thì chỉ đếm người DỰ LỄ**, vì đó là danh sách còn phải đi
  nhắc. "Cả lớp trừ đi số đã khai" ra một con số đúng mà vô nghĩa.
- **Nhãn theo mục 6.4 SRS**: "đã tự khai" / "người thu đã nhận", tuyệt đối
  không có chữ "đã đóng". `kiem-totnghiep.mjs` grep thô nguyên văn JSON của
  khối thống kê — đây là phúc đáp MỚI nói về tiền, tức đúng chỗ chữ ấy dễ lọt
  vào nhất.

### Ba việc tổ chức trả kèm TÊN, không chỉ con số

Tài trợ, gian hàng, văn nghệ đều phải liên hệ lại từng người (chốt hiện vật,
xếp chỗ standee, dựng chương trình). Một con số trần thì Ban cán sự lớp vẫn
phải mở CSV ra mới biết gọi cho ai — tức màn hình không giải quyết gì.

**Một chỗ câu chữ suýt sai NGƯỢC CHIỀU**, chỉ ảnh chụp mới thấy: bản đầu viết
*"1 người nhận tài trợ"*. Người khai ở ô ấy là người **ĐỨNG RA** tài trợ cho
chương trình, không phải người được nhận. Đọc ngược một chữ ở đây là Ban cán
sự lớp gọi điện sai vai.

### Màu: `--go` và `--due` giữ đúng một nghĩa

`.dstno.go` chỉ dùng cho "người thu đã nhận"; `.dstno.due` chỉ cho việc còn
phải làm (chưa trả lời Gala, đã tự khai chờ đối chiếu). Ô "có dự Gala" để
**trung tính** — nó là một câu trả lời, không phải một lời khen; tô xanh nó là
phá quy ước màu đã giữ từ Đợt 3. Có phép kiểm đọc `class` của ô ấy.

Ba ô số là **LƯỚI ba cột**, không `flex-wrap` — cùng lý do dải `.tnprog`: ba
con số của một câu hỏi phải nhìn thấy cùng lúc thì mới so được. Đo bằng
`offsetTop`, vì phép đếm "có ba ô" một mình vẫn xanh khi chúng xếp ba dòng.

### Ô tìm lọc THẲNG TRÊN DOM, không vẽ lại

146 dòng là khoảng 10.000px cuộn, mà màn này gần như luôn mở ra để tra MỘT
người. Vẽ lại sheet trong `oninput` thì ô tìm mất tiêu điểm và bàn phím điện
thoại sập xuống sau **mỗi chữ** gõ vào — nên phép kiểm có răng là
`document.activeElement?.id === 'dstnTim'` sau khi lọc, chứ không phải "lọc
đúng người" (phép ấy xanh với cả bản vá hỏng). So khớp bằng `boDau()` nên gõ
không dấu vẫn ra.

Kèm: `DSTN_CUON` nhớ chỗ đang cuộn qua các lượt vẽ lại (bung một lĩnh vực ở
cuối danh sách 15 mục vốn ném người ta ngược lên đầu — cùng bài học `SOTHU`),
nhưng **đổi THẺ thì về đầu**: nội dung khác hẳn, giữ chỗ cuộn cũ chỉ làm người
ta mở ra giữa chừng một danh sách chưa từng thấy.

## Hai chỗ nhỏ cùng đợt: lối về ở đầu `/totnghiep`, và "Gala" thay "Dự Lễ"

**Lối về ở ĐẦU trang.** Ngô Phú Cường: *"Ở phần tốt nghiệp thêm icon nút Back
(Trở về ứng dụng) ở phía trên (hiện tạo chỉ có ở dưới cùng)."* Biểu mẫu dài
hơn ba màn điện thoại, mà `body.noapp` đã bỏ thanh sáu tab — nên đường ra duy
nhất nằm tận chân trang, sau cả ba khối đang mở; trên iPhone đã cài lên màn
hình chính thì còn không có cả nút Back của trình duyệt. `.tnve` nằm trong
hàng `.lb` của băng chàm, nền trắng mờ (lối RA, không giành chú ý với ba khối
cần khai), vùng chạm 44px, `z-index:1` để nằm trên mũ 🎓 của `::after`.

**CHỈ ở bản CÓ PHIÊN.** Đường công khai là chuỗi ba bước cho 38 người KHÔNG
đăng nhập được — với họ "về ứng dụng" dẫn thẳng vào màn 401, tức một lối ra
dẫn vào ngõ cụt. Có phép đối chứng riêng, và nó soi ở màn ĐÃ dựng băng chàm
chứ không ở màn 401 ngay trước (màn ấy dùng `.claimcard`, đo ở đó thì xanh mà
vô nghĩa).

**"Gala" thay "Dự Lễ".** Ngô Phú Cường hỏi *"Nên thay Dự Lễ bằng Gala không
nhỉ"* — nên. Cùng ngày 26/9 có HAI việc, buổi bảo vệ chiều và Lễ & Gala tối,
nên chữ "Lễ" đứng một mình trong một ô rộng 114px đọc ra được cả hai — mà hai
việc ấy khác hẳn nhau: một bắt buộc và miễn phí, một tự nguyện và 1.000.000đ.
"Gala" không lẫn vào đâu, và đó cũng là từ cả lớp đang dùng. Đổi ở nhãn ô tiến
độ và thẻ trạng thái của màn thống kê; **cột CSV giữ nguyên** "Dự Lễ 17h-22h"
— nó đã có sẵn khung giờ nên không lẫn, và Ban tổ chức có thể đã ghép cột theo
tên ấy.

## Ảnh chứng chỉ qua Google Drive — ĐÃ LÀM (18/9)

Ngô Phú Cường hỏi *"nếu không dùng Google thì cloudflare có dịch vụ nào lưu
trữ ảnh không"*. Có, cả ba, và **cả ba đều vướng đúng chỗ CLAUDE.md đã ghi**:

| | Vướng |
|---|---|
| **R2** | miễn phí 10GB, nhưng **bật lên vẫn phải gắn thẻ thanh toán** — đúng lý do thứ ba khiến N2 được giữ ngày 26/8 |
| **Cloudflare Images** | **5 USD/tháng**, không có bậc miễn phí |
| **D1 (nhét ảnh vào DB)** | biến cơ sở dữ liệu giao dịch thành kho ảnh: mọi migration, mọi sao lưu nặng thêm vài trăm MB cho dữ liệu ghi một lần đọc một lần |

Và kể cả có tiền thì Drive vẫn hợp hơn cho **đúng việc này**: Ban tổ chức cần
lấy ảnh ra **hàng loạt** đưa người làm chứng chỉ — Drive là chọn-tất-cả-tải-về,
R2 là phải viết script. Ghi lại đây để khỏi bàn lại.

**Và đây KHÔNG phải bỏ N2 — nó là cách đọc N2 đúng nhất.** Ba lý do N2 tồn
tại: (1) *"file nằm ở Drive Ban tổ chức và sống lâu hơn ứng dụng"* — Drive
thoả ĐÚNG điều này, R2 thì ngược lại; (2) không phát tán tài sản người khác —
ảnh học viên tự nộp không thuộc diện ấy; (3) *"R2 đòi gắn thẻ thanh toán"* —
Drive API miễn phí. Ứng dụng là **ống dẫn, không phải kho**.

Thiết kế đã chốt, và **bản dựng 18/9 giữ đúng từng điều dưới đây** — giữ lại
nguyên văn vì mỗi gạch đầu dòng là một chỗ sai được mà không có gì báo lỗi:

- **Refresh token của Ban tổ chức, KHÔNG dùng service account.** Tài khoản
  dịch vụ **không có dung lượng Drive riêng** → `403 storageQuotaExceeded` khi
  đẩy vào thư mục Gmail thường; muốn chạy phải có Workspace + Shared Drive,
  tức phải trả tiền. Và tệp thuộc sở hữu của tài khoản dịch vụ: xoá dự án
  Google Cloud là ảnh cả lớp đi theo.
- **Hai cái bẫy im lặng của đường refresh token.** (a) Token cấp khi ứng dụng
  còn ở trạng thái "Testing" **chết sau ĐÚNG 7 NGÀY**, và xuất bản sau đó
  KHÔNG hồi sinh nó — phải **Publish TRƯỚC, lấy token SAU**. (b) `drive.file`
  là scope Drive DUY NHẤT không bị xếp "nhạy cảm" (nên xuất bản thẳng, không
  phải qua vòng thẩm định hàng tuần của Google), nhưng nó chỉ đụng được tệp
  **do chính ứng dụng tạo** → **thư mục đích phải do ứng dụng tạo**, dán id
  thư mục tạo tay thì Drive trả `404 File not found: <id>`.
- **Ba chỗ sai mà Drive vẫn trả HTTP 200:** thiếu tiền tố `/upload/` trong URL
  → tên tệp đúng, **nội dung 0 byte**; thiếu `fields=id,name,webViewLink` →
  `webViewLink` lặng lẽ `undefined`; dựng thân multipart bằng chuỗi mẫu → ảnh
  đi qua UTF-16 và hỏng. Thân phải nối ở **mức BYTE** (`Uint8Array.set`), ranh
  giới `\r\n`.
- **Hai subrequest mỗi tệp**, xa trần 50. Không đệm access token, không gộp
  hai ảnh vào một request.
- **Soi magic bytes**, không tin phần mở rộng: JPEG `FF D8 FF`, PNG
  `89 50 4E 47 0D 0A 1A 0A`. Nhận diện thêm HEIC/AVIF/WebP/PDF để **báo lỗi
  cho tử tế** — "ảnh gốc của iPhone là HEIC, mở ảnh lên rồi chọn Sao chép sẽ
  ra JPG" hữu ích hơn hẳn "tệp không hợp lệ", và iPhone là máy phần lớn lớp
  này dùng.
- **Phía trình duyệt, ba chỗ không dùng lại được đồ có sẵn:** KHÔNG gọi qua
  `api()` (`public/app.js:220` ép `content-type: application/json` cho mọi
  request có thân); xem trước phải dùng `FileReader.readAsDataURL` chứ KHÔNG
  `URL.createObjectURL` vì CSP là `img-src 'self' data: https://img.vietqr.io`
  — **không có `blob:`**; thu nhỏ ảnh bằng canvas thì **bỏ qua PNG** (canvas
  vẽ nền trong suốt thành ĐEN, mà logo doanh nghiệp phần lớn là PNG nền trong
  suốt) và phải `createImageBitmap(file, { imageOrientation: 'from-image' })`
  không thì ảnh chụp dọc bằng iPhone quay ngang 90°.
- `.dev.vars` trỏ đích Drive vào **cổng đóng 2527** (2525 SMTP, 2526 LLM) —
  trỏ thẳng `googleapis.com` thì request TREO chứ không hỏng.
- Mọi phúc đáp 502 mang `hong_o_buoc`: `chua_cau_hinh` · `lay_token` ·
  `token_tu_choi` · `tai_len` · `qua_lau` · `drive_tu_choi` · `phuc_dap_la`.

### Đã dựng xong 18/9 — ba tệp, và chỗ nào giữ luật gì

| Tệp | Giữ gì |
|---|---|
| `worker/src/lib/drive.js` | CHỈ chuyên chở. Không biết gì về chứng chỉ. |
| `worker/src/lib/anh.js` | Luật "tệp nào được nhận" + nối thân multipart ở mức BYTE. Tách ra để **Node gọi thẳng được** — đó là phần duy nhất của cả đường Drive mà sandbox chứng minh được. |
| `routes/tot-nghiep.js` → `postAnhTotNghiep` | CHÍNH SÁCH: ai gửi được, hạn mức, ghi kết quả vào đâu. |

`POST /api/totnghiep/anh?loai=anh|logo`, thân là **tệp nhị phân thô**. Năm chốt
chặn xếp theo GIÁ, rẻ nhất hỏi trước — chỉ khi cả năm qua mới tiêu một lượt
gọi ra Drive, đúng khuôn `congTacVaKhoa()` của trợ lý.

**Thư mục đích tạo LƯỜI ở lượt gửi đầu tiên, id nhớ vào `cai_dat`** — không
cần migration mới, và quan trọng hơn: **không còn bước tay nào.** Kế hoạch cũ
bắt chạy một lượt thủ công rồi dán id vào Secret; một bước tay là một bước
quên được, mà triệu chứng của việc quên là `404 File not found` — câu đọc lên
như thư mục bị xoá, nên rất dễ đi tìm nhầm chỗ. Đặt sẵn `DRIVE_FOLDER_ID`
trong Worker thì dùng cái đó, làm đường lui khi muốn ghim một thư mục cụ thể.

**Tên tệp: `chan-dung-ngo-phu-cuong-n6.jpg`** — không dấu, không dấu cách, do
`tenTepAnh()` dựng bằng chính `boDau()` của `lib/ghep.js` (KHÔNG viết bản sao
thứ ba; `vietqr.js` đã có một bản cho cú pháp chuyển khoản). Ngô Phú Cường xin
dạng này, và nó đúng vì một lý do cụ thể: Ban tổ chức tải cả thư mục về máy
Windows rồi giao cho người làm chứng chỉ — tên có dấu và có dấu cách thì qua
zip/giải nén hay ra ký tự rác.

Giữ THÊM hai phần so với ví dụ `ngo-phu-cuong.jpg`, mỗi phần một lý do đã đo
được, không phải phòng xa:
- **tiền tố loại** — không có thì ảnh chân dung và logo cùng người trùng tên
  khi cùng đuôi, mà **Drive CHO PHÉP trùng tên**: hai tệp y hệt trong một thư
  mục, không ai biết cái nào là cái nào.
- **số nhóm** — roster có **hai người cùng tên `Phan Thị Thanh Nga`**, một ở
  Nhóm 6 một ở Nhóm 9. Bỏ số nhóm là hai người ấy đè lên nhau.

**GỬI LẠI thì SỬA ĐÈ lên chính tệp cũ** (`PATCH /upload/drive/v3/files/{id}`),
không tạo tệp mới — cùng lý do trùng tên ở trên, và gửi lại là chuyện CHẮC
CHẮN xảy ra (chọn nhầm ảnh, cắt xấu). Lượt sửa đè thì `parents` **không được**
nằm trong thân; 404 ở nhánh này nghĩa là tệp cũ đã bị xoá tay, và route tự thử
lại bằng đường tạo mới thay vì bắt học viên hiểu chuyện ấy.

**Link thư mục hiện thẳng trên màn Ban cán sự lớp** (`drive_thu_muc_url`).
Thư mục do chính ứng dụng tạo nên nó nằm lẫn trong "Drive của tôi" cùng vài
trăm thứ khác — bắt người phụ trách đi lục tìm là thiết kế dở, và chia sẻ nhầm
một thư mục khác cho Ban tổ chức còn tệ hơn không chia sẻ gì.

`/api/health` trả thêm `drive: {bat}` — **một CỜ, không một mẩu nào của khoá**,
khác hẳn khối `push` (khoá VAPID công khai in 8 ký tự đầu được). Đây là chỗ duy
nhất trả lời được "ba bí mật đã sang tới Worker chưa" mà không phải thử gửi
một tệp, và `deploy.yml` đọc đúng nó.

### Ba chỗ giao diện KHÔNG dùng lại được đồ có sẵn

1. **KHÔNG gọi qua `api()`** — hàm ấy ép `content-type: application/json` cho
   mọi request có thân, nên tệp nhị phân đi qua nó là hỏng.
2. **Xem trước dùng `FileReader.readAsDataURL`, KHÔNG `URL.createObjectURL`** —
   CSP là `img-src 'self' data: https://img.vietqr.io`, **không có `blob:`**,
   nên ảnh xem trước bị chặn thẳng và không báo gì. (Cùng lý do
   `connect-src 'self'` khiến trình duyệt không tự đẩy lên Google được —
   đường "Worker làm ống dẫn" là đường DUY NHẤT CSP cho phép, không phải chọn
   cho vui.)
3. **Thu nhỏ bằng canvas nhưng BỎ QUA PNG.** Canvas vẽ nền TRONG SUỐT thành
   ĐEN, mà logo doanh nghiệp phần lớn là PNG nền trong suốt → in lên chứng chỉ
   ra một khối đen. Và phải `createImageBitmap(file, { imageOrientation:
   'from-image' })`, không thì ảnh chụp dọc bằng iPhone quay ngang 90° (EXIF)
   — **chỉ ảnh chụp mới thấy**.

Thêm một chi tiết nhỏ mà thiếu thì lộ ngay: `input.value = ''` NGAY sau khi
đọc tệp. Không xoá thì chọn lại đúng tệp vừa chọn không bắn sự kiện `change`,
và người vừa gửi hỏng bấm lại thấy không có gì xảy ra.

### Điều CHƯA kiểm chứng được

**Chưa một tệp nào từng tới Drive từ sandbox** — không ra được internet. Hai bộ
kiểm (`kiem-anh.mjs` chạy thẳng không cần máy chủ, `kiem-anh-route.mjs` cần
server) chứng minh mọi thứ đứng TRƯỚC lượt gọi ra ngoài, cộng nhánh hỏng của
chính nó: `.dev.vars` trỏ `GOOGLE_BASE_URL` vào **cổng đóng 2527** nên lượt gọi
hỏng ngay và đọc được `hong_o_buoc = lay_token`. Bằng chứng duy nhất đáng tin
là **mở thư mục Drive và thấy ảnh ở đó** — đúng bài học đường gửi thư 24/8.

### Đường CÔNG KHAI nay CŨNG nhận ảnh — quyết chiều 18/9

Tôi nêu chỗ này ra như một quyết định treo ("38 người không đăng nhập được thì
không nộp được ảnh, mà ảnh là thứ in lên chứng chỉ"). Ngô Phú Cường trả lời
bằng một câu: *"Làm nốt phần logo doanh nghiệp và ảnh chân dung."*

`POST /api/totnghiep/anh-cong-khai?loai=…&roster_id=…` — **đường DUY NHẤT của
cả ứng dụng nhận TỆP từ người không có phiên**, tức mức lộ cao nhất zone này
từng mở. Ghi thẳng cả hai vế:

**ĐƯỢC:** 38 người ấy có ảnh trên chứng chỉ. Không có đường này thì phải phát
link đăng nhập tay cho từng người — đúng cái rào mà migration 0042 vừa gỡ.

**MẤT:** ai cầm link `/totnghiep` cũng đổ được tệp vào Drive của Ban tổ chức,
và đổi được ảnh của người khác. Bốn thứ giữ cho mức ấy chịu được:

1. **Chỉ nhận ảnh THẬT** — magic bytes, không tin phần mở rộng, không tin
   content-type; trần 2MB cứng. Dùng CHUNG hàm `nhanAnh()` với đường có phiên,
   không viết bản sao: bản quên một chốt thì chốt dễ quên nhất lại là magic
   bytes, và bên quên nó nhận thẳng một tệp `.exe` mang tên một học viên.
2. **Hạn mức chặt hơn hẳn**: 6 lượt/người/ngày (đường có phiên là 20) và thùng
   IP 200/giờ (400). Con số IP vẫn TRÊN sĩ số lớp — dưới đó thì cả lớp ngồi
   chung WiFi hội trường là khoá oan nhau (bài học 27/8). Khoá theo
   **`roster_id`** chứ không theo `member_id`: đọc được ngay từ URL nên hạn mức
   chặn được TRƯỚC khi có bất kỳ lời ghi nào vào D1.
3. **Sửa đè đúng tệp cũ**, không đẻ tệp mới — một kẻ phá chỉ thay được ảnh,
   không làm đầy được Drive bằng hàng trăm tệp rác.
4. **Nhìn thấy được** — cột `nguon` chuyển sang `ca_hai` khi ảnh của một bản
   `phien` bị gửi đè qua link công khai, và cột ấy in ra CSV.

**Thứ tự các chốt là một bất biến, không phải sở thích.** Lời GHI đầu tiên (tự
tạo dòng `members` cho người chưa có hồ sơ) phải đứng SAU mọi phép kiểm rẻ hơn:
đặt lên trước thì ai gõ một URL cũng để lại một dòng `members` mà chưa cần gửi
nổi một byte ảnh hợp lệ nào — không lỗi, không cảnh báo, chỉ có một bảng phình
dần. `kiem-anh-route.mjs` đếm số dòng trước/sau một lượt gửi `.exe` để canh
đúng chỗ ấy.

**VÌ SAO KHÔNG chặn hẳn việc gửi đè bản đã có:** đó là ngõ cụt của chính người
dùng thật — gửi nhầm một tấm rồi không sửa lại được nữa. Đúng bài học "fail
closed không phải lúc nào cũng đúng" đã trả giá ngày 5/9 với `xacNhanLaiSo()`.

Giao diện: ô chọn ảnh trong `tnckForm()` dùng CHUNG `tnGanChonAnh()` với form
có phiên, chỉ khác đường gọi. **KHÔNG vẽ lại màn sau khi gửi** (form có phiên
thì có) — vẽ lại là xoá trắng mọi ô người ta đang gõ dở, mà ảnh xem trước đã đủ
nói rằng tệp đã đi. Và ô ảnh ở đây **không hé lộ người được chọn đã gửi ảnh hay
chưa**: hiện "✓ đã gửi" là trả lời một câu hỏi về người khác cho bất kỳ ai mở
link.

**Chưa kiểm chứng được:** cột `nguon` chỉ đổi sang `ca_hai` sau một lượt tải
lên THÀNH CÔNG, mà sandbox không ra được internet nên không lượt nào thành
công. Phải soi bằng bản xuất CSV trên tên miền thật sau lượt gửi ảnh đầu tiên.

**Mười hai bước Ngô Phú Cường ĐÃ tự làm trên Google Cloud Console 18/9**, thứ
tự quan trọng (bước 9 làm sau bước 10 thì token chết sau 7 ngày): tạo dự án →
bật Drive API → OAuth consent screen External → điền tên/email → thêm scope
`drive.file` (CHỈ scope này) → thêm test user → tạo OAuth client ID (Web
application) → redirect URI `https://developers.google.com/oauthplayground` →
**PUBLISH APP** → OAuth Playground đổi lấy refresh token → đặt ba giá trị vào
GitHub Secrets. **Bước mười hai của kế hoạch cũ ("chạy một lượt tạo thư mục
rồi ghim `DRIVE_FOLDER_ID`") đã BỎ HẲN** — thư mục nay tạo lười ở lượt gửi đầu
tiên, xem mục trên; một bước tay là một bước quên được.

**Ba bí mật đã sang tới Worker, đo được ở deploy #127 (18/9):** `/api/health`
trả `"drive":{"bat":true}` và `deploy.yml` in `✓ Worker đã thấy đủ ba bí mật
Google — đường nộp ảnh mở`. Đó là bằng chứng khoá ĐÃ TỚI, **không** phải bằng
chứng khoá còn sống — khoá chết thì cờ vẫn `true` và chỉ lộ ra ở
`hong_o_buoc = token_tu_choi` của lượt gửi đầu tiên.

**Ba giá trị ấy đã đi qua khung chat này, nên nên cấp lại một lượt refresh
token mới** sau khi mọi thứ chạy xong: vào OAuth Playground đổi lấy token
khác rồi thay `GOOGLE_REFRESH_TOKEN` trong GitHub Secrets. Không gấp, nhưng
đây là thứ mở được Drive của Ban tổ chức.

### Điều kiện để bấm được PUBLISH APP — tôi hướng dẫn SAI một lần (18/9)

Console mới của Google tách trang cũ "OAuth consent screen" thành **Google
Auth Platform** với bốn mục con: **Branding · Audience · Clients · Data
access**. Nút Publish nằm ở **Audience**, không nằm ở Branding.

Tôi dặn "để trống hết khối App domain" — **đúng khi ở Testing, SAI khi muốn
Publish.** Để xuất bản một app External, Google đòi thêm hai ô trong Branding:

| Ô | Điền gì |
|---|---|
| Application home page | `https://k3vaceo.cuongngo.app/` |
| Application privacy policy link | `https://k3vaceo.cuongngo.app/rieng-tu` |
| Authorized domains | `cuongngo.app` (tên miền gốc, KHÔNG phải subdomain) |

Application terms of service thì vẫn tuỳ chọn, để trống được.

**Và tôi đọc sai một dấu hiệu, ghi lại vì rất dễ lặp:** trên trang Branding
`Save` mờ **và** `Discard changes` cũng mờ — tôi kết luận "không còn gì chưa
lưu, tức là đã xong". Sai: Branding vẫn thiếu trường, chỉ là những trường ấy
không đánh dấu `*` vì chúng chỉ bắt buộc KHI XUẤT BẢN. Chỗ nói thật là dòng
chữ xám ngay dưới nút Publish ở trang **Audience**: *"To publish your app, you
must complete your configuration on the Branding page."* Đọc dòng ấy, đừng suy
từ trạng thái nút.

Hai ô CỐ Ý vẫn để trống, vì điền vào là tự chuốc thêm vòng thẩm định:
- **App logo** — chính Google ghi ngay tại đó: tải logo lên là app phải qua
  *brand verification*. Ứng dụng này có đúng một người dùng OAuth (chủ Drive),
  không cần logo.
- **Application terms of service** — không bắt buộc.

`Authorized domains` chỉ cần gõ vào, không phải xác minh qua Search Console —
xác minh chỉ đòi khi app PHẢI qua thẩm định, mà `drive.file` là scope không
nhạy cảm nên không phải.

## Trang `/rieng-tu` — chính sách riêng tư

Thêm 18/9. Sinh ra vì Google đòi một "Application privacy policy link" mới cho
publish app Drive, nhưng **giá trị của nó độc lập với Google**: ứng dụng giữ
dữ liệu cá nhân của 146 người mà tới 18/9 vẫn chưa có một trang nào nói ra là
giữ gì, ai xem được, gửi đi đâu.

Nội dung viết theo đúng thứ mã đang làm, không viết cho đẹp: bảng "ai xem được
gì" chép đúng ma trận N6 thật, bảng "gửi đi đâu" liệt kê đủ **sáu** nơi kể cả
hai chỗ nhỏ dễ giấu (`img.vietqr.io` nhận số tài khoản trong đường dẫn ảnh,
Google Fonts nhận địa chỉ IP của người đọc). Nói thẳng cả chỗ không lùi được:
gian hàng đã bật công khai thì gỡ khỏi D1 không gỡ được khỏi đệm của Google.

Ba điều kỹ thuật:
- **Thư mục rời trong `public/`, không phải một nhánh của app.js** — nó phải
  mở được khi không có phiên, và Google phải tải được nó.
- **Không một dòng JavaScript nào.** CSP `script-src 'self'` chặn script nội
  dòng (bài học `/sotay`); còn `style-src` có `'unsafe-inline'` nên CSS nội
  dòng chạy được. Trang chỉ để đọc, không JS thì không có gì hỏng được.
- **Luật vét `/*` KHÔNG nuốt `/rieng-tu`** — đã ĐO bằng
  `npx wrangler pages dev public` chứ không suy đoán: cả `/rieng-tu` lẫn
  `/rieng-tu/` đều ra đúng trang, y như `/sotay`.

**CỐ Ý không đặt `X-Robots-Tag: noindex`**, khác `/lich` và `/sotay`: hai trang
kia có tên và nơi công tác của cả lớp, còn trang này không có dữ liệu của ai —
và một chính sách riêng tư thì vốn dĩ nên tìm thấy được.

**Cloudflare CHE địa chỉ liên hệ trên trang này — đo được ở deploy #122.** Mã
nguồn có `ngophucuong@gmail.com` ở hai chỗ, mà HTML tải từ tên miền thì không
có chuỗi ấy: **Email Address Obfuscation** của Scrape Shield (cấp ZONE, không
sửa được trong repo) thay mọi `mailto:` và mọi chuỗi trông như email bằng
`/cdn-cgi/l/email-protection` cộng một script giải mã.

Hệ quả thật thì nhẹ hơn vẻ ngoài: script giải mã nằm **cùng origin** nên CSP
`script-src 'self'` cho qua, người đọc vẫn bấm được. Chỉ **trình đọc tự động**
— kể cả của Google khi soi trang chính sách — là chỉ thấy bản mã hoá. Tắt ở
Cloudflare → zone `cuongngo.app` → **Scrape Shield → Email Address
Obfuscation**. Phép kiểm vì vậy chỉ **cảnh báo**, đúng cách đã xử cho Browser
Cache TTL: đánh đỏ mọi lượt deploy vì một nút bấm ngoài repo chỉ dạy người ta
bỏ qua màu đỏ.

`deploy.yml` có phép kiểm riêng cho nó, và lý do không phải là cẩn thận thừa:
**Google đọc đường dẫn này để giữ app ở trạng thái đã xuất bản.** Trang hỏng
thì Google có thể gỡ trạng thái ấy, refresh token quay về kiếp 7 ngày, và
không chỗ nào kêu lên. Phép kiểm soi `<title>` và địa chỉ liên hệ chứ không
chỉ đếm mã 200 — luật vét `/*` trả giao diện ứng dụng kèm 200 cho cả đường dẫn
không tồn tại, đúng cái bẫy đã ghi cho `/sotay`.

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
  tài khoản" — một lời báo hỏng nằm trên một đợt đã xong. (Ô ấy là nền TRẮNG
  viền xám chứ không phải khối cam; xem đính chính 19/9 ở mục `/totnghiep`.)
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
- ~~**Quỹ lớp chưa tạo được**: chưa ai giữ vai cấp lớp trong dữ liệu~~ →
  **ĐÃ XONG, và đợt thu cấp lớp ĐẦU TIÊN đã có (18/9, migration 0041).** Soi
  D1 thật ngày 18/9: ba vai cấp lớp đều có người và còn hiệu lực từ 5/9 —
  `lop_truong` Lưu Minh Tiến (member 15), `thu_quy` Vũ Thị Ngân (member 48),
  `uy_vien` Ngô Phú Cường (member 6). Trước 18/9 bảng `fund_rounds` chưa có
  một dòng `scope='class'` nào; nay có đúng một: phí Gala 1.000.000đ.
- **Lịch nay có 21 DÒNG `lich_hoc`, ĐỦ tới hết khoá 26/9** (28/8, 5/9, 11/9 và 18/9 mỗi
  ngày chia hai-ba dòng vì nhiều chủ đề, nên "buổi" ở đây là buổi giảng chứ
  không phải ngày lịch — đừng lấy số dòng so thẳng với `cohorts.so_buoi = 13`):
  15/8, 21/8, 22/8 (migration 0016), 4/9 và 5/9 (0017), 5/9 CHỐT LẠI đè lên bản
  tạm (0019), 11/9 kiến tập (0032), tuần 11–12/9 (0035), 18–19/9 (0039), rồi
  26/9 (0040) — tất cả đều do Ngô Phú Cường dán lại thông báo của Ban tổ chức.

  **26/9 ĐÃ ĐIỀN (migration 0040)** — buổi BẢO VỆ và LỄ TỐT NGHIỆP & GALA, tức
  ngày kết thúc khoá theo `cohorts`. Ngô Phú Cường gửi thư mời chính thức
  ngay chiều 17/9, vài giờ sau khi tôi nêu chỗ trống này. Xem mục riêng
  "26/9 — hai dòng, và một bản sao trong .ics" bên dưới.

  **26/9 (migration 0040) — hai dòng, và một BẢN SAO trong `.ics` phải gỡ.**

  Thư mời chính thức của VCCI × Andrew School of Business, Ngô Phú Cường gửi
  17/9. Địa điểm Dolce by Wyndham Hanoi Golden Lake, Giảng Võ.

  **Giờ bắt đầu 13h30, KHÔNG phải 13h00 như thư mời in.** Thư mời ghi 13h00 ở
  HAI chỗ (băng đầu trang và khối đầu bảng chương trình); Ngô Phú Cường đính
  chính "26/9 là 13h30 đến 22h". Lấy theo anh vì anh là uỷ viên Ban cán sự lớp
  liên hệ trực tiếp Ban tổ chức — nhưng đã nói rõ với anh rằng đây là chỗ DUY
  NHẤT lệch với văn bản, và lệch về phía nguy hơn: ghi muộn 30 phút mà thật ra
  13h00 thì cả lớp tới trễ chính buổi thi cuối khoá, còn ghi sớm thì chỉ chờ
  thêm. Ghi chú Text cũng viết 13h30 cho khối đầu — hai cái đồng hồ nói hai
  giờ khác nhau trong cùng một ứng dụng là lỗi tệ hơn cả lệch giờ.

  **TÁCH HAI DÒNG** (13h30–17h00 bảo vệ · 17h00–22h00 lễ + gala) chứ không gộp
  "13h30–22h00" như thư mời, vì hai nửa là hai CAM KẾT khác hẳn: buổi chiều là
  kỳ thi bắt buộc của mọi học viên, buổi tối có phí **1.000.000đ/người** và
  phải đăng ký **trước 21h00 ngày 19/9**. Gộp một dòng thì người đọc lướt rất
  dễ hiểu là phải nộp tiền và đăng ký mới được bảo vệ bài — một hiểu nhầm có
  thể làm ai đó bỏ chính buổi thi. Ranh giới 17h00 lấy thẳng từ bảng chương
  trình của thư mời, không tự nghĩ ra. Năm khối tối (17h00/17h30/19h45/20h45/
  21h15) KHÔNG tách tiếp thành năm dòng: `/api/home` chỉ hiện 6 buổi sắp tới
  nên một tối sẽ chiếm sạch danh sách, và `.ics` đổ năm cuộc hẹn liên tiếp vào
  lịch điện thoại của 146 người. Chi tiết nằm trong ghi chú Text.

  **`ghi_chu` ĐI RA TRANG CÔNG KHAI `/lich`** (`docLichCongKhai` liệt kê nó
  trong danh sách trả về), nên số tài khoản người thu, số điện thoại và mức
  phí TUYỆT ĐỐI không được nhét vào đó — chúng nằm trong `content_md` của ghi
  chú Text, thứ đường công khai chỉ ĐẾM chứ không trả nội dung. Đã kiểm bằng
  cách grep từng chuỗi cấm trong phúc đáp `/api/lich/cong-khai`.

  **`ghi_chu` bản đầu lại quá dài, lại chỉ ảnh chụp mới thấy.** "Dolce by
  Wyndham Hanoi Golden Lake, Giảng Võ" (43 ký tự) thành BA dòng chữ hoa, nặng
  hơn cả tên buổi ngay dưới — đúng cái bẫy 0032 đã vấp. Rút còn "Dolce by
  Wyndham, Giảng Võ"; tên đầy đủ và địa chỉ nằm trong ghi chú Text.

  **Và một lỗi THẬT trong `lib/ics.js`, không phải trong migration.** Hàm
  `dungIcs()` phát thêm một sự kiện CẢ NGÀY từ `cohorts.defense_on`, với chú
  thích "để cả ngày vì chưa có giờ" — đúng từ 26/8 tới 17/9. Migration 0040
  làm câu ấy thành SAI: từ lúc có hai dòng thật cho 26/9, tấm băng cả ngày
  thành bản sao, và lịch điện thoại của 146 người nhận cùng một buổi bảo vệ
  HAI LẦN — một khối không nói mấy giờ có mặt, nằm cạnh khối nói đúng giờ.
  Không chỗ nào báo lỗi; chỉ lộ ra khi ĐẾM sự kiện trong tệp `.ics` gửi đi.
  Nay `dungIcs()` bỏ qua cột mốc ấy khi `buoi` đã có dòng cho đúng `defense_on`
  — lọc theo NGÀY chứ không theo tiêu đề (tên buổi Ban cán sự lớp sửa được
  bằng nút ✎, so tên là có ngày lệch mà không ai hay), và dòng đã HUỶ cũng
  tính là "đã có" vì khi ấy nó mang `STATUS:CANCELLED` và tự kể đúng chuyện.

  `kiem-ics.py` viết lại phần "Buổi bảo vệ" thành phép canh HAI CHIỀU: có dòng
  thì KHÔNG được có cột mốc, chưa có dòng nào thì PHẢI còn. Kèm phép đối chứng
  có răng nhất — đếm số sự kiện rơi vào ngày bảo vệ trong chính tệp `.ics`,
  phải khớp số dòng lịch. Đã thử ba ca bằng cách gọi thẳng `dungIcs()` từ
  Node: có dòng 26/9 → 2 sự kiện; không có dòng nào → 1 (giữ cột mốc, đúng
  mục đích gốc); chỉ có dòng NGÀY KHÁC → 2 (buổi ấy + cột mốc). Ca thứ ba là
  ca một bản vá cẩu thả (`if (buoi.length) bỏ qua`) sẽ làm hỏng.

  **18–19/9 (migration 0039) — sợi dây nối về một buổi từng bị xếp nhầm ngày.**
  Bản tạm 0017 ghi ĐÚNG hai chủ đề của ThS. Tuấn Hà vào 5/9; bản chốt 0019 thay
  dòng ấy bằng ThS. Hà Thu Thanh, tức buổi Tuấn Hà bị DỜI chứ không bị huỷ —
  nay về đúng chỗ ngày 18/9 với giờ cụ thể. Vì 0019 UPDATE tại chỗ chứ không
  chèn thêm dòng nên không còn tồn đọng gì phải dọn.

  Ba điều quyết trong 0039, mỗi điều một lý do:
  - **"Họp lớp" 9h00–9h30 là một DÒNG RIÊNG**, không nhét vào `ghi_chu` của
    buổi 9h30. Lý do nằm ở `.ics`: lịch nói ngày bắt đầu 9h30 thì cả lớp đến
    muộn nửa tiếng của cuộc họp bàn về BUỔI BẢO VỆ của chính họ. Tiền lệ cho
    một dòng không-phải-buổi-giảng: "Giao lưu, kết nối (không bắt buộc)" tối
    11/9 (0035). `giang_vien` để TRỐNG — thông báo không nêu ai chủ trì, mà
    `lib/ics.js` in ra "Giảng viên: …".
  - **19/9 để TRỐNG `tu_gio`/`den_gio`** — thông báo không có một mốc giờ nào,
    kể cả "buổi sáng"/"buổi chiều". Giao diện tự hiện "THỨ BẢY 19/9 · CẢ BUỔI"
    và `.ics` ra sự kiện cả ngày, cả hai đều đúng; bịa giờ mới là sai.
  - **Chốt trùng lặp của dòng 19/9 phải theo `chu_de`, không theo `tu_gio`**
    như ba dòng kia: `tu_gio` là NULL, mà `NULL = NULL` trong SQL không bao giờ
    đúng nên phép kiểm ấy không chặn được gì. Đã đối chứng bằng cách chạy lại
    nguyên migration: vẫn 3 + 1 dòng, không nhân đôi.

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
  trước khi chạy — có mục "sáu mươi lăm phép đối chứng đáng giữ nhất" và hai
  chỗ môi trường sandbox không kiểm được.
- **Nói thẳng cái chưa kiểm chứng được**, đừng để lẫn với cái đã chắc chắn.
- **Commit vào CẢ HAI nhánh** (Ngô Phú Cường quyết qua AskUserQuestion ngày
  9/9): nhánh phiên làm việc hiện tại, VÀ
  `claude/content-deployment-continuation-m2inni` — nhánh mà `deploy.yml` ghim
  ở `on.push.branches`. Đẩy thiếu nhánh thứ hai thì code vào repo mà tên miền
  không đổi gì, đúng cái bẫy đã ghi ở đầu tệp này. Không tạo PR trừ khi được
  yêu cầu.
