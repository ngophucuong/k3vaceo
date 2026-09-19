# Bộ kiểm

Trước 27/8 các bộ kiểm nằm ở thư mục scratchpad của phiên và **mất khi hết
phiên**. Nay commit vào đây, vì thứ đắt nhất trong chúng không phải mã mà là
những **phép đối chứng** — mỗi cái ứng với một lỗi đã trả giá để tìm ra. Viết
lại từ đầu thì phần lớn sẽ bị viết thành phép kiểm không có răng.

Đây không phải bộ test tự động chạy trong CI. Chúng cần một máy chủ cục bộ và
đôi khi cần gieo dữ liệu; đọc phần đầu mỗi tệp trước khi chạy.

## Chạy thế nào

```bash
cd worker
cp .dev.vars.example .dev.vars        # đặt RP_ID=localhost
# mở comment khối [assets] cuối wrangler.toml để phục vụ cả giao diện
npx wrangler d1 migrations apply k3vaceo --local
npx wrangler dev --port 8787 --local
```

**Đừng chạy `wrangler d1 execute --local` trong lúc `wrangler dev` đang chạy** —
kể cả lệnh chỉ ĐỌC cũng làm dev server chết. Mọi việc chạm D1 phải làm xong
trước khi gọi HTTP đầu tiên, hoặc kill server → chạm D1 → khởi động lại.

**Đo được, đừng đoán:** `wrangler dev` giữ khoá tệp SQLite **từ lúc khởi
động**, không phải từ request đầu tiên. Chờ server lên bằng một tệp tĩnh thay
vì `/api/health` cũng không cứu được — đã thử, vẫn treo.

Hệ quả cho `pw-thongke.mjs` và `pw-tulieu-buoi.mjs`: hai tệp này gieo dữ liệu
bằng `wrangler d1 execute` ở đầu tệp rồi mới gọi HTTP, nên **phải chạy khi
server đang TẮT**, và server phải lên kịp trước lời gọi HTTP đầu tiên:

```bash
pkill -f "wrangler dev"; pkill -f workerd; sleep 2
node scripts/kiem/pw-thongke.mjs &
# Bước gieo mất HƠN BỐN PHÚT ở sandbox này: mỗi lệnh `npx wrangler` tốn khoảng
# 13 giây khởi động, mà tệp có mười mấy lệnh. Chờ tới khi không còn tiến trình
# `npm exec wrangler d1` nào rồi hẵng dựng server.
while pgrep -f "npm exec wrangler d1" >/dev/null; do sleep 5; done
(cd worker && npx wrangler dev --port 8787 --local &)
```

Đừng canh bằng `pgrep -f "wrangler d1 execute"`: **dòng lệnh của chính cái
vòng canh cũng chứa chuỗi ấy**, nên `pgrep` khớp vào chính nó và vòng lặp chờ
mãi không thoát. Viết `"npm exe[c] wrangler"` — dấu ngoặc vuông làm mẫu regex
khác hẳn chuỗi nằm trong dòng lệnh, đúng mẹo `[p]w-` quen thuộc của `ps | grep`.

Và **`pkill -f workerd` phải chạy TRỌN VẸN**, nếu không còn một `workerd` mồ
côi giữ cổng 8787: wrangler mới báo `Address already in use` rồi chết, mà
`pgrep -f wrangler` lại chẳng thấy gì — trông như cổng trống trong khi nó
không trống. Tìm thủ phạm thật bằng inode của socket:

```bash
python3 -c "
import glob, os
for l in open('/proc/net/tcp'):
    p = l.split()
    if len(p) > 3 and p[1].endswith(':2253') and p[3] == '0A':   # 0x2253 = 8787
        for fd in glob.glob('/proc/[0-9]*/fd/*'):
            try:
                if os.readlink(fd) == f'socket:[{p[9]}]': print(fd.split('/')[2])
            except Exception: pass"
```

Treo mà không in dòng nào, không báo lỗi gì, là triệu chứng của đúng chuyện
khoá D1: `execFileSync` đang đợi khoá mà không bao giờ lấy được. Đừng nhầm với
bộ kiểm hỏng.

**Nhớ `git checkout worker/wrangler.toml` trước khi commit** — khối `[assets]`
bật lên là của môi trường cục bộ, production là Pages tách riêng.

## Từng tệp

| Tệp | Kiểm gì |
|---|---|
| `pw-lich.mjs` | trang `/lich` công khai + tệp `.ics` + đối chứng N6 |
| `kiem-ics.py` | tệp `.ics` đúng RFC 5545, đối chiếu múi giờ bằng `zoneinfo` |
| `kiem-gap.mjs` | riêng phép gấp dòng của `lib/ics.js` — xem bên dưới |
| `pw-thongke.mjs` | biểu đồ tiến độ thu, ma trận ai-thấy-gì |
| `pw-tulieu-buoi.mjs` | tư liệu gắn vào buổi, một dòng hai màn |
| `pw-vao-nhanh.mjs` | luồng `/vao` rút gọn: số điện thoại vào thẳng + passkey |
| `reset-vao.sh` | trả hồ sơ thử về "chưa ai nhận" cho `pw-vao-nhanh.mjs` |
| `kiem-tanso.mjs` | giới hạn tần suất — cả lớp cùng một WiFi có vào được không |
| `kiem-danhba.mjs` | danh bạ lớp — số thật KHÔNG lọt ra ở người chưa đăng nhập, và bốn dòng hồ sơ chỉ hiện cho người đã đăng nhập |
| `kiem-moi.mjs` | link mời xuyên nhóm cho Ban cán sự lớp (`POST /api/danh-ba/:id/moi`), **kể cả người đã đăng nhập** — đối chứng xác nhận lại số điện thoại, hạn mức đoán, và ca hồ sơ KHÔNG có số nào phải NHẬN LẠI được (không kẹt vĩnh viễn) |
| `pw-nhanlai.mjs` | giao diện của phát lại link cho người đã đăng nhập — ô điện thoại phải RỖNG, không lộ số thật; và hồ sơ không có số thì không bị bắt gõ số |
| `kiem-tulieu-text.mjs` | Tư liệu dạng Text: bắt buộc content_md, đếm công khai, layTuLieuTheoBuoi |
| `pw-tulieu-text.mjs` | **an toàn XSS của `mdSafe()`** — bốn ca độc + bốn ca thuận + giao diện |
| `kiem-tulieu-bai.mjs` | tư liệu gắn vào PHẦN BÀI (links.section_id): plan.js/links.js, **N6** qua nhóm khác |
| `pw-tulieu-bai.mjs` | giao diện: sheet phần bài ↔ Gắn Tư liệu ↔ tab Tư liệu, "một dòng, ba màn" |
| `pw-thongbao.mjs` | thông báo: URL dán thẳng thành link bấm được, sửa lại được, thanh B/I/gạch đầu dòng, **đính kèm Ghi chú** (migration 0034) và thanh định dạng ở CHÍNH sheet Sửa ghi chú/Gắn Tư liệu — và **N6 ở đường sửa trả 404 chứ không phải 403** |
| `kiem-thongbao-ghichu.mjs` | đính kèm Ghi chú vào thông báo: đúng phạm vi N6, đúng loại TEXT (không phải mọi tư liệu), sửa/gỡ đính kèm đúng khuôn merge-not-overwrite |
| `reset-thongbao.sh` | dựng phiên + một thông báo Nhóm 6 có URL dán thẳng + một thông báo của NHÓM KHÁC cho phép kiểm N6 + bốn Ghi chú/liên kết fixture cho phép kiểm đính kèm |
| `kiem-mail-thongbao.mjs` | **thư khi có thông báo mới**: ma trận phạm vi phải trùng khít đường đẩy, không gửi ngược người đăng, công tắc của chính chủ giảm đúng một người, và SỬA thì không gửi lại |
| `reset-mail-thongbao.sh` | dựng HAI phiên (cần phiên thứ hai vì không ai tắt hộ được — N5) và đọc sẵn mẫu số ra `mail-mau-so.json` |
| `pw-mobile.mjs` | cảm giác ứng dụng: chừa chỗ thanh trạng thái, khoá zoom, ô nhập 16px — và **số điện thoại vẫn copy được** |
| `reset-tanso.sh` | dọn sổ tần suất và gieo lời mời cho `kiem-tanso.mjs` |
| `reset-moi.sh` | dựng hai phiên + ba hồ sơ thử cho `kiem-moi.mjs`/`pw-nhanlai.mjs`, gồm một hồ sơ giả không có số điện thoại |
| `reset-tulieu-text.sh` | dựng phiên Ngô Phú Cường cho `kiem-tulieu-text.mjs` / `pw-tulieu-text.mjs` |
| `reset-tulieu-bai.sh` | như trên, cộng seed một `plan_sections` của NHÓM KHÁC cho phép kiểm N6 |
| `gieo-coso.mjs` · `gieo-moi.mjs` | sinh dữ liệu đối chứng, hai reset tự gọi |
| `kiem-ghep.mjs` | thuật toán ghép giao thương + danh mục ngành — **chạy thẳng, không cần máy chủ** |
| `pw-giao-thuong.mjs` | tab Giao thương, trang `/giao-thuong`, hai mức lộ |
| `gieo-giao-thuong.sh` | gieo bốn gian hàng ở bốn nhóm cho `pw-giao-thuong.mjs` |
| `pw-nav.mjs` | thanh nav sáu tab ở sáu khổ màn hình — xem cảnh báo dưới đây |
| `kiem-doi-nhom.mjs` | xin đổi nhóm: ai duyệt, đơn trùng, **N6 qua officer nhóm thứ ba**, nhả phần bài |
| `pw-doi-nhom.mjs` | giao diện xin đổi nhóm — hai phiên trong một trình duyệt (người xin và officer nhóm đích) |
| `reset-doi-nhom.sh` | dựng bốn phiên + hai officer giả cho hai bộ kiểm trên, và **trả group_id của người xin về Nhóm 6** |
| `kiem-tro-ly.mjs` | Trợ lý KHKD: **lệch nền tri thức D1 ↔ giao-trinh.js**, **lệch số hiệu phần bài trợ lý ↔ giao diện**, N6 bốn route, hai tầng trần lượt, công tắc tắt, và `hong_o_buoc` của nhánh gọi hỏng |
| `pw-tro-ly.mjs` | giao diện hội thoại trợ lý — **XSS trên chữ do MÔ HÌNH sinh ra**, khung cuộn riêng, và ô nhập giữ nguyên chữ khi gửi hỏng |
| `reset-tro-ly.sh` | gieo ba phiên có sẵn tin nhắn (kể cả bốn ca độc), một phần bài của Nhóm 7, và hai hồ sơ 40/39 lượt; `… tat` để kiểm công tắc tắt |
| `kiem-totnghiep.mjs` | zone Lễ tốt nghiệp: **danh sách cả lớp không cookie phải 401**, ba phần lưu độc lập, chốt UNIQUE có răng, **mã lĩnh vực lạ → coi như chưa chọn chứ không 422**, **`khkd_luc` nhả ra khi xoá trắng**, **chữ "Ngành khác" bị gỡ theo khi bỏ chip**, **CSV không bao giờ có chữ "đã đóng"**, **đường công khai khai BỔ SUNG được mà không xoá được ô nào đang có chữ**, và **rủ người cùng làm đề tài: người GỬI không tự duyệt được, chủ bài không gỡ được ai, một người đứng tên được nhiều bài** |
| `pw-totnghiep.mjs` | giao diện `/totnghiep` — ba khối gập, **lưu một phần không gập mất khối đang cần**, chip phí phải CAM chứ không xanh, nhánh dự phòng khi mã QR không tải được, **khai xong là mã QR biến mất**, **không mục lĩnh vực nào bị cắt chữ**, **form công khai để TRỐNG ô ngày sinh/điện thoại**, và **sheet rủ cùng làm: ô tìm giữ tiêu điểm, người đã có quan hệ hiện MỜ chứ không biến mất, công tắc hai vế gửi đúng `bai_cua`** |
| `reset-totnghiep.sh` | dựng ba phiên (uỷ viên lớp / người thường / người Nhóm 7), seed hồ sơ `members` cho Vũ Thị Ngân cho giống bản thật, **trả bảng đăng ký về gốc**, và **đếm lại số phiên sau khi seed** — xem phép 30 |
| `kiem-anh.mjs` | soi ảnh bằng **magic bytes** + nối thân multipart ở mức BYTE — **chạy thẳng, không cần máy chủ**; phần DUY NHẤT của đường Drive mà sandbox chứng minh được |
| `kiem-anh-route.mjs` | `POST /api/totnghiep/anh` — **không cookie phải 401** (đường này NHẬN TỆP), magic bytes thắng content-type, trần 2MB, và `hong_o_buoc` của nhánh gọi hỏng |
| `kiem-deploy-yml.mjs` | **không nháy đơn nào trong khối `node -e` của deploy.yml** — chạy thẳng, không cần máy chủ, xem mục dưới |
| `pw-banmoi.mjs` | băng "Có bản mới" + phép soi bản lúc mở trang — **đếm số lượt nạp tài liệu**, vì hàm này gọi `location.reload()` trên đường khởi động của mọi người dùng |

Hai tệp `coso.json` và `moi-tanso.json` **tự sinh, không commit** — chúng chỉ
đúng với dữ liệu đang nằm trong D1 cục bộ. Trước 27/8 `coso.json` nằm ở thư mục
scratchpad, nên `pw-vao-nhanh.mjs` commit vào repo **không chạy nổi**: thiếu
đúng một tệp mà không ai biết lấy ở đâu. Nay `reset-vao.sh` sinh lại nó.

## Sáu mươi tư phép đối chứng đáng giữ nhất

Mỗi cái dưới đây từng bắt được một phép kiểm **đậu giả**. Đừng gỡ.

1. **`kiem-gap.mjs` phải dựng chuỗi riêng để ép vào nhánh cắt-giữa-ký-tự.**
   Dữ liệu lịch thật không ép được (điểm gấp tình cờ không rơi giữa ký tự nào),
   nên đối chứng đầu tiên — gỡ phép lùi ranh giới UTF-8 ra — vẫn đậu. Và
   `TextDecoder` KHÔNG ném lỗi khi cắt giữa ký tự, nó lặng lẽ thay bằng `�`,
   nên phép kiểm "giải mã UTF-8 có được không" là vô dụng. Phải mở gấp dòng ra
   rồi so từng ký tự với chuỗi gốc.

2. **Mọi bộ kiểm giao diện mở đầu bằng phép khẳng định ứng dụng THẬT SỰ nạp
   được.** Có lần bộ kiểm báo "không lỗi JS: sạch" trên một trang chưa hề nạp —
   quên bật `[assets]` nên `/` trả JSON, mà trang không có JS thì tất nhiên
   không có lỗi JS.

3. **Bộ kiểm phải chạy lại được nhiều lần.** `pw-tulieu-buoi.mjs` từng đổi tên
   một tư liệu ở bước sau rồi bước trước tìm theo tên cũ — lần hai là đỏ. Nay
   nó đổi trả về như cũ. `pw-vao-nhanh.mjs` cần `reset-vao.sh` chạy trước.

4. **`kiem-ics.py` tính lại múi giờ bằng `zoneinfo` của Python**, không dùng
   lại công thức của `lib/ics.js`. Tự kiểm bằng chính công thức mình viết thì
   sai giống hệt nhau và test vẫn xanh.

5. **`kiem-tanso.mjs` phải có phép chứng minh kẻ dò VẪN chết nhanh.** Cả bộ
   kiểm ấy hỏi "cả lớp ngồi chung một WiFi thì vào được không", mà câu hỏi ấy
   xanh hết chỉ bằng cách gỡ sạch giới hạn tần suất đi. Vì vậy nửa sau của nó
   đo chiều ngược lại: dò số của một người phải chết trong 8 lần, quét rải
   nhiều người phải chết trong 30 lần đoán, `/check` và `/vao` không được cộng
   lượt cho nhau, dò token lời mời vẫn phải chết ở 20 lần đúng như mục 8 SRS,
   và người cầm link THẬT mà gõ nhầm email thì không được tính là đoán token.
   Bỏ chúng đi thì bộ kiểm này chỉ còn là cái máy bảo "nới ra là xanh".

   Một cái bẫy trong chính phép đối chứng ấy: **đếm lần ĐOÁN, đừng đếm vòng
   lặp.** Bản đầu của phép "quét rải" đếm số hồ sơ đã chạm rồi báo đỏ ở con số
   47 — nhưng 44/134 người chưa có số nào trong danh sách gốc, gọi vào họ trả
   `phone_missing_in_roster` chứ không phải "sai số". Hồ sơ không có gì để đoán
   thì không tính vào sổ là ĐÚNG.

6. **`kiem-danhba.mjs` phải đọc số THẬT từ D1 rồi tìm nguyên văn nó trong
   phúc đáp JSON.** Che ở máy chủ và che ở giao diện trông y hệt nhau khi nhìn
   màn hình — nhưng một trong hai cách vẫn gửi số thật xuống, và mở tab Network
   là đọc được. Phép kiểm nào chỉ xem chuỗi hiển thị có dấu sao hay không thì
   ĐẬU cả hai, mà một trong hai là trao chìa khoá vào hồ sơ người ta cho cả lớp.

   Kèm hai phép chống-rỗng: phải có ít nhất một người ĐÃ đăng nhập để chứng
   minh phúc đáp không rỗng, và phải có ít nhất một email của người chưa đăng
   nhập — không thì "0 email đều bị che" xanh mà chẳng chứng minh gì.
   `reset-tanso.sh` gieo sẵn ca ấy (roster 58).

7. **`pw-tulieu-text.mjs` phải chứng minh mã độc bị VÔ HIỆU HOÁ, không phải bị
   ÂM THẦM XOÁ MẤT.** Một hàm chỉ biết `.replace(/<[^>]*>/g,'')` cũng "an
   toàn" theo nghĩa không cho `<script>` chạy — nhưng nó xoá luôn nội dung hợp
   lệ có dấu `< >`, và phép kiểm nào chỉ xem "còn `<script>` không" thì ĐẬU cả
   hai cách. Mỗi ca độc (4 ca: `<script>`, `onerror` qua `<img>`, link
   `javascript:`, chèn thuộc tính qua chữ trong `[chữ](url)`) phải kiểm CẢ
   HAI vế: không cho một biến đánh dấu chạy được, VÀ chuỗi độc vẫn còn nguyên
   trong `.textContent`. Kèm bốn ca THUẬN (`#`, `**`, `-`, link https hợp lệ)
   để chắc các quy tắc chặn XSS không vô tình chặn luôn markdown đúng.

8. **`kiem-moi.mjs` phải chứng minh CẢ chiều đúng lẫn chiều sai của phát lại
   link mời cho người đã đăng nhập (mở rộng 5/9).** Tính năng này sửa một lỗ
   hổng thật: trước bản sửa, `postInviteClaim` không đòi gì ngoài một email tự
   chọn, nên ai cầm được link phát lại — kể cả link phát nhầm người, kể cả
   link lỡ lộ — là đăng nhập thẳng vào tài khoản người khác. Phép kiểm "phát
   lại được, không còn 409" một mình sẽ ĐẬU cả bản có lỗ hổng lẫn bản đã vá,
   vì cả hai đều trả 200. Phải kiểm thêm: số sai bị chặn (401), số thiếu
   không bị TÍNH vào hạn mức đoán (422, khác nhánh), và đoán đủ 8 lần thì lần
   9 phải 429 — CÙNG hạn mức với `/vao`, không phải một cửa dò số miễn phí
   thứ hai. `pw-nhanlai.mjs` kiểm thêm phía giao diện: ô "Điện thoại" ở màn
   nhận link phải RỖNG khi đăng nhập lại — nếu giao diện lỡ điền sẵn số thật
   vào đó thì chốt chặn ở máy chủ coi như không tồn tại, vì bất kỳ ai mở link
   cũng đọc được số ngay trên màn hình rồi gõ y nguyên.

9. **Hồ sơ CHƯA TỪNG có số điện thoại nào phải NHẬN LẠI được, không kẹt vĩnh
   viễn (5/9 chiều).** Bản vá lỗ hổng ở mục 8 chặn cứng bước nhận lại khi
   không có số nào để đối chiếu — hợp lý trên giấy ("không có gì để soi thì
   an toàn hơn cho qua"), nhưng sai trên thực tế: đúng nhóm người không có số
   (44+ người, `bo-sung-dien-thoai.csv`) là nhóm phụ thuộc NHIỀU NHẤT vào
   đường phát lại link, mà họ lại là nhóm duy nhất không tài nào qua được chốt
   ấy — gõ gì cũng `phone_mismatch`. Lộ ra bằng ảnh chụp thật của Ngô Phú
   Cường (Đinh Khánh Toàn, Nhóm 9), không phải bộ kiểm tự bắt được, vì cả
   `kiem-moi.mjs` lẫn `pw-nhanlai.mjs` khi đó chỉ dựng ca "có số". Phép kiểm
   phải dựng riêng một hồ sơ giả KHÔNG có số (`reset-moi.sh`, "Kiểm Tra Không
   Số") rồi chứng minh: `has_phone_on_file: false`, và claim với số bậy hay
   không kèm số nào đều phải 200 — không phải "không còn 401" (đã có thể chỉ
   vì đọc nhầm hồ sơ), mà đúng luồng đi hết tới cấp phiên.

10. **`pw-mobile.mjs` phải chứng minh chữ NỘI DUNG vẫn copy được, không chỉ
    chứng minh khung sườn đã tắt bôi đen (5/9).** Đợt "cảm giác ứng dụng" tắt
    `user-select` cho đầu trang, thanh dưới và nút. Cách viết gọn nhất là đặt
    thẳng lên `body` — và màn hình sẽ trông **y hệt**, không lỗi JS, mọi phép
    kiểm khác vẫn xanh, chỉ mất đúng một thứ: chép số điện thoại trong Danh bạ,
    tức đúng việc danh bạ sinh ra để làm. Vì vậy phép đối chứng NGƯỢC (tìm
    `a[href^="tel:"]` rồi đọc `user-select` của nó) mới là phép đáng giữ, không
    phải phép thuận. Chọn người mẫu phải là người ĐÃ ĐĂNG NHẬP: số của người
    chưa đăng nhập bị che ở máy chủ và số đã che cố ý không bọc trong `tel:`,
    nên lấy nhầm người là phép kiểm đỏ vì lý do chẳng liên quan (đã vấp ngay
    lượt chạy đầu, dùng Đinh Khánh Toàn — người chưa đăng nhập ở D1 cục bộ).
    Phần safe-area thì đọc THẲNG luật trong stylesheet chứ không đọc computed
    style: Chromium trên máy chủ không có "tai thỏ" nên `env(safe-area-inset-*)`
    luôn bằng 0, computed style không phân biệt được "đã chừa chỗ" với "quên
    chừa" — đúng cái lỗi cần bắt.

11. **Bộ kiểm tự cắn vào chính nó qua NHẬT KÝ, không qua dữ liệu (5/9).**
    `pw-tulieu-text.mjs` dọn sạch mục Tư liệu nó tạo ra ở cuối mỗi lượt — nhưng
    chính việc dọn ấy ghi một dòng `gỡ liên kết "KIEMTULIEU_giaodien"` vào
    `activity`, và dòng đó hiện lại ở DÒNG HOẠT ĐỘNG tab Hôm nay của lượt SAU.
    `getByText(TIEU_DE).first()` không giới hạn phạm vi liền tóm đúng phần tử
    đang ẩn ấy rồi chờ 30 giây cho nó hiện ra. Triệu chứng đọc lên y như một
    lỗi giao diện vừa gây ra, nên suýt đổ oan cho bản sửa đang làm — phải
    `git stash` rồi chạy lại mới biết. Hai bài học: locator của bộ kiểm giao
    diện phải **giới hạn trong đúng khung đang xét** (`#v-kho`), và reset phải
    dọn **cả nhật ký**, không chỉ dọn bảng dữ liệu.

12. **`kiem-ghep.mjs` dựng lại bốn cách làm NGÂY THƠ rồi cho thấy chúng sai** ở
   đúng ca mà phép kiểm phía trên đang khẳng định — bỏ dấu thiếu bước `đ→d`,
   so từ đơn thay vì bigram, cắt từ phổ biến mà thiếu chốt "dưới 20 hồ sơ",
   và ngưỡng điểm hạ xuống 1. Không có chúng thì cả bộ vẫn đậu kể cả khi
   thuật toán ghép bị thay bằng một phép so chuỗi tầm thường.


13. **Phép hồi quy "form đọc lại từ máy chủ" trong `pw-giao-thuong.mjs` đã
   được đối chứng bằng tay**: gỡ dòng `GT = await apiGet(...)` trong
   `openGianHang` ra thì nó đỏ, lắp lại thì xanh. Đây là lỗi mất dữ liệu
   loại nguy nhất — bốn ô "bán gì / bán cho ai / cần gì / giúp được gì" dùng
   CHUNG giữa tab Nhóm và tab Giao thương, nên mở form từ bộ nhớ đệm rồi bấm Lưu
   là ghi đè bản mới bằng bản cũ, y hệt lỗi Đợt 1.


14. **`pw-nav.mjs` đo BỀ RỘNG CHỮ, không đo chiều cao nút.** Bản đầu đo chiều
   cao — đoán rằng nhãn dài sẽ xuống dòng và đội nút cao lên — và nó báo xanh
   ở mọi khổ từ 300px tới 430px, kể cả những khổ nhãn đang tràn thật. Vì
   `white-space:nowrap` khiến chữ TRÀN chứ không xuống dòng, còn `min-width:0`
   khiến phần tràn không đẩy thanh nav rộng ra: cả phép đo chiều cao lẫn phép
   đo `scrollWidth` của thanh nav đều mù. Phải so `lb.scrollWidth` với
   `nb.clientWidth`. Đây là phép kiểm **đậu giả** mới nhất bị bắt, 5/9.

15. **`kiem-mail-thongbao.mjs` đọc mẫu số từ D1, không hỏi chính API.** Hỏi
   `/api/thong-bao` "có bao nhiêu người nhận" rồi so với chính nó là một phép
   kiểm không có răng. Cùng lý do, phép "lớp nhiều hơn nhóm" so hai con số
   **API** trả về với nhau chứ không so hai mẫu số D1 với nhau — hai mẫu số D1
   lệch nhau là điều hiển nhiên, không mã nào làm nó sai được. Đã đối chứng:
   gỡ điều kiện phạm vi trong `chonNguoiNhanMail()` ra thì phép "thông báo
   NHÓM" đỏ ngay (30 thay vì 5), còn phép so-hai-mẫu-số vẫn xanh.

16. **Công tắc thư kiểm trong `pw-thongbao.mjs` phải chạy trong hoàn cảnh
   KHÔNG có thông báo đẩy.** Ô thư là ô RIÊNG, cố ý không nhét vào
   `veHopThongBao()` vì hàm ấy thoát sớm ở bốn nhánh — nhét chung thì đúng
   những người không nhận được thông báo đẩy (tức những người cần thư nhất)
   lại là người không bao giờ thấy công tắc. Chromium không cài lên màn hình
   chính và cục bộ không có khoá VAPID, nên bộ kiểm đang đứng đúng trong một
   trong bốn nhánh ấy: nó khẳng định `#pushNut` VẮNG MẶT rồi mới đòi
   `#mailNut` có mặt. Và nó đọc lại `/api/home` sau mỗi lần bấm — đổi chữ trên
   màn hình mà máy chủ không ghi nhận là đúng loại hỏng không ai thấy.

17. **Đính kèm Ghi chú vào thông báo phải kiểm ĐÚNG LOẠI, không chỉ đúng
   phạm vi.** `docGhiChuId()` chặn cả một liên kết KHÔNG PHẢI TEXT (kind
   DRIVE chẳng hạn) dù nó `scope='class'` và người soạn đọc được thoải mái —
   sai LOẠI khác hẳn sai PHẠM VI, và một phép kiểm chỉ hỏi "có bị chặn
   không" sẽ không phân biệt được hai nhánh lỗi ấy. `kiem-thongbao-ghichu.mjs`
   giữ ba fixture riêng (cấp lớp, riêng Nhóm 6, riêng Nhóm 7, và một DRIVE)
   để mỗi nhánh có đúng một ca kiểm. Đã đối chứng: gỡ điều kiện `kind='TEXT'`
   VÀ điều kiện phạm vi khỏi câu SQL của `docGhiChuId()` thì cả hai phép đối
   chứng 2 và 3 đỏ ngay (nhận 200 thay vì 404).

18. **Bốn cột `SELECT id, noi_dung, nguon, het_han FROM thong_bao WHERE
   cohort_id = ?` của `getLich()` THIẾU điều kiện phạm vi — phát hiện tình
   cờ khi thêm `ghi_chu_id`, không phải đi tìm.** Route `GET /api/lich`
   không gác theo vai (bất kỳ ai đăng nhập cũng gọi được), và câu này trả về
   TOÀN BỘ thông báo của khoá, kể cả thông báo nội bộ của nhóm khác — một
   N6 thật, có từ trước migration 0034. Giao diện không lộ ra vì
   `layLichDayDu()` (nơi duy nhất gọi route này) chỉ đọc `.lich_hoc`, chưa
   từng đọc `.thong_bao` — nhưng quy ước 6 (CLAUDE.md) là kiểm ở máy chủ,
   không tin giao diện im lặng ấy. Đã vá cùng lúc, thêm điều kiện
   `(group_id IS NULL OR group_id = ?)` khớp với `/api/home` và
   `postThongBaoDaXem`.

19. **`reset-thongbao.sh` từng vỡ FOREIGN KEY constraint ở chính lượt chạy
   lại thứ hai** khi thêm bốn fixture ghi chú cho tính năng đính kèm: một
   thông báo dựng thủ công bằng tay (không theo khuôn `KIEMTB\_%`) trong lúc
   chụp ảnh minh hoạ vẫn còn trỏ `ghi_chu_id` vào một fixture, nên
   `DELETE FROM links WHERE title LIKE 'KIEMTBGC\_%'` ở lượt sau chết ngay —
   D1 cục bộ enforce khoá ngoại (`thong_bao.ghi_chu_id REFERENCES
   links(id)`) còn D1 thật thì không, nên lỗi chỉ lộ ra đúng ở môi trường
   dùng để kiểm. Sửa bằng cách dọn CẢ hai chiều: xoá `thong_bao` trỏ vào
   fixture sắp xoá TRƯỚC khi xoá chính fixture ấy.

20. **`pw-tro-ly.mjs` kiểm XSS trên chữ do MỘT MÔ HÌNH sinh ra, không phải
   chữ người trong lớp gõ.** Mọi chỗ khác dùng `mdSafe()` đều nhận chữ của
   người trong lớp; câu trả lời của trợ lý là chỗ DUY NHẤT nhận chữ của một
   hệ thống ngoài rồi đưa thẳng vào `innerHTML`. Prompt có dặn nó đừng sinh
   HTML, nhưng "đã dặn rồi" không phải chốt chặn. Giữ nguyên cả HAI vế như
   `pw-tulieu-text.mjs`: mã độc không chạy, **và** chuỗi độc vẫn còn nguyên
   trong `.textContent` — bị vô hiệu hoá chứ không bị âm thầm xoá mất.
   Chính phép này bắt được một lỗi thật ngay lượt đầu: `mdSafe()` chỉ nhận
   tiêu đề tới `###`, mà mô hình dùng `####` thoải mái, nên một mục `####`
   rơi xuống thành dòng chữ có bốn dấu thăng lủng lẳng. Đọc code không thấy;
   phải chạy mới thấy.

21. **`.tlbox` phải có thanh cuộn RIÊNG, và phép kiểm phải NHỒI THÊM nội
   dung để hỏi cho đúng câu.** `veHoiThoai()` đẩy màn xuống cuối bằng
   `box.scrollTop = box.scrollHeight` sau mỗi lượt; không có `overflow-y`
   thì đó là một lệnh RỖNG và câu vừa gửi nằm ngoài tầm nhìn — học viên
   tưởng gửi hỏng. Phép kiểm nhồi 30 bong bóng độn trước khi đo, vì hỏi
   "hôm nay có đủ chữ để tràn không" là hỏi sai câu (cùng dạng sai lầm với
   phép đo chiều cao nút ở `pw-nav.mjs`).

22. **Hai bộ kiểm trợ lý dùng CHUNG một lượt reset, nên cái chạy trước không
   được đóng mất phiên của cái chạy sau.** `kiem-tro-ly.mjs` cố ý đóng phiên
   "chạm trần" chứ không phải phiên gắn phần bài, và có một phép cuối khẳng
   định phiên kia VẪN MỞ; `pw-tro-ly.mjs` chọn phiên theo TIÊU ĐỀ chứ không
   bấm "cái đầu tiên" (thứ tự danh sách theo `updated_at`, đổi tuỳ bộ nào vừa
   chạy). Bản đầu vi phạm cả hai và chết bằng một cú Playwright timeout 30
   giây không nói được gì — mất một lúc mới nhìn ra thủ phạm là chính bộ kiểm.

**Chỗ dễ rò nhất của cả sản phẩm, kiểm ở `pw-giao-thuong.mjs`:** trang
`/giao-thuong` là đường DUY NHẤT đưa dữ liệu người dùng ra internet. Hai phép
kiểm phải giữ nguyên răng — người CHƯA bật `cong_khai` phải vắng mặt hoàn
toàn, và số điện thoại của người TẮT `hien_lien_he` không được có trong HTML.
Cả hai lỗi đều im lặng: trang vẫn đẹp, chỉ thừa ra thứ không ai muốn đưa.

23. **`page.on('load')` KHÔNG bắn cho `location.reload()` ở môi trường này.**
   Bản đầu của `pw-banmoi.mjs` đếm lượt nạp bằng sự kiện `load` và đọc ra 0 ở
   đúng ba ca quan trọng nhất — trông y như mã không hề tải lại, và tôi suýt
   đi sửa một đoạn vốn đã đúng. Đo lại bằng cách đặt một dấu vào `window` thì
   thấy nó BIẾN MẤT sau khi tải lại, tức trang đã tải lại thật; Playwright chỉ
   bắn `framenavigated`. Nay đếm bằng `addInitScript` + `sessionStorage` —
   chạy lại ở MỌI lượt nạp tài liệu, không phụ thuộc sự kiện nào.
   Kèm một bẫy nhỏ cùng họ: `page.goto()` tới CÙNG một URL kèm hash là điều
   hướng trong-trang, `boot()` không chạy lại. Dùng `page.reload()`.

24. **`location.reload()` với `wrangler dev` + khối `[assets]` để lại MỘT
   TRANG TRẮNG** — tài liệu mới về nhưng thẻ `<script src="/app.js">` không
   chạy (`typeof window.mdSafe` là `undefined`). Phép đối chứng dứt điểm:
   `location.reload()` TRẦN, không kèm `fetch` gì, cũng trắng y hệt — nên đây
   là giới hạn của máy chủ dev, KHÔNG phải lỗi mã (băng "Có bản mới" đã chạy
   thật trên tên miền từ 25/8). Đúng vì vậy mà `soiBanLucMo()` được viết thành
   **chỉ hiện băng, không tự tải lại**: thứ không kiểm được thì đừng đặt nó
   vào đường khởi động của 146 người.

25. **Số hiệu phần bài phải khớp HAI CHIỀU — và một chiều là `public/app.js`.**
   `plan_sections.ord` chạy 0..7 với ord=0 là phần MỞ ĐẦU, nên giao diện in
   thẳng `s.ord`; trợ lý từng viết `ord + 1` và gọi "Phần 2" cho đúng cái ứng
   dụng gọi "Phần 1" (sửa 12/9). Phép 2b của `kiem-tro-ly.mjs` vì vậy không
   chỉ so `nhanPhan()` với hằng số trong `giao-trinh.js` — nó còn **grep chính
   biểu thức đánh số trong `public/app.js`**, để ai đổi cách đánh số ở giao
   diện thì bộ kiểm đỏ và hai bên cùng được sửa. Kèm một phép đối chứng có
   răng: công thức cũ `ord + 1` phải TRƯỢT.

26. **Đếm sự kiện trong CHÍNH tệp `.ics`, đừng chỉ kiểm từng sự kiện đúng
   khuôn.** `lib/ics.js` phát thêm một sự kiện CẢ NGÀY từ `cohorts.defense_on`
   làm cột mốc, với lý do "chưa có giờ" — đúng cho tới khi migration 0040 thêm
   hai dòng THẬT cho 26/9. Từ lúc ấy nó thành BẢN SAO: cùng một buổi bảo vệ
   vào lịch điện thoại của 146 người hai lần. Mọi phép kiểm cũ vẫn xanh — UID
   không trùng, giờ đổi múi đúng, khuôn RFC đủ — vì không phép nào hỏi "ngày
   này có mấy sự kiện". Nay `kiem-ics.py` canh HAI CHIỀU (có dòng thì không
   được có cột mốc; chưa có dòng nào thì phải còn) và đếm sự kiện rơi vào ngày
   bảo vệ, phải khớp số dòng lịch. Phép đối chứng của chính bản vá: gọi thẳng
   `dungIcs()` từ Node với ba bộ dữ liệu, trong đó ca "chỉ có dòng NGÀY KHÁC"
   là ca mà một bản vá cẩu thả (`if (buoi.length) bỏ qua`) sẽ làm hỏng.

27. **BOM UTF-8 phải kiểm ở tầng BYTE — `Response.text()` nuốt mất nó.** Tệp
   CSV của zone Lễ tốt nghiệp bắt đầu bằng `﻿` để Excel trên Windows đọc
   đúng dấu tiếng Việt; thiếu nó thì cả tệp thành ký tự rác, mà đó lại là cả
   công dụng của tệp. Phép kiểm bản đầu viết `csv.charCodeAt(0) === 0xFEFF`
   và **ĐỎ dù BOM có thật** (`od -tx1` cho ra `ef bb bf` ở ba byte đầu): bộ
   giải mã UTF-8 theo chuẩn WHATWG bỏ BOM ở đầu dòng, nên mọi phép kiểm ở tầng
   chuỗi đều mù với đúng cái nó định canh. Phải đọc `arrayBuffer()`. Cùng họ
   với bẫy `TextDecoder` ở phép số 1.

28. **Bấm `<summary>` là TOGGLE, không phải "mở" — và lưu xong không được gập
   mất khối đang cần.** `pw-totnghiep.mjs` lượt đầu chết với "element is not
   visible" trên một chip vẫn nằm nguyên trong DOM: hai khối mở SẴN, cú bấm
   của bộ kiểm đóng chúng lại. Nhưng lúc sửa thì lộ ra một lỗi THẬT sau nó:
   bản đầu quyết mở/gập thuần theo "đã xong chưa", nên bấm "Có, tôi dự" rồi
   Lưu → khối thành "đã xong" → tự gập → **mã QR và nút chuyển khoản biến
   mất**, đúng giây người ta cần chúng nhất. Trạng thái người dùng đang ở phải
   sống lâu hơn một lượt vẽ lại (`TN_MO` ngoài hàm vẽ), cùng bài học với bộ
   lọc Sổ thu và thẻ Danh bạ.

29. **Ảnh chụp bắt được nhánh dự phòng BỊ QUÊN, phép kiểm chuỗi thì không.**
   Tab Quỹ có `img.onerror` thay mã QR hỏng bằng một ô giải thích (Đợt 3);
   màn `/totnghiep` chép markup QR sang mà quên chép nhánh ấy. Không lỗi JS,
   không phép kiểm nào đỏ — chỉ có một ô vỡ ảnh nằm giữa màn hình tiền nong.
   Sandbox không ra được internet nên `img.vietqr.io` KHÔNG BAO GIỜ tải được,
   tức nhánh dự phòng luôn chạy ở đây: đó đúng bằng cảnh người dùng gặp lúc
   mạng yếu, nên hãy canh nó chứ đừng coi là nhiễu.

30. **Một dấu NHÁY KÉP trong chú thích SQL giết cả lượt reset, và nó im lặng.**
   `reset-totnghiep.sh` truyền khối SQL qua `--command "…"`, tức một chuỗi
   shell bọc bằng nháy kép — nên một dấu nháy kép thứ hai, kể cả nằm trong
   chú thích `--`, đóng chuỗi ngay tại đó. Wrangler nhận nguyên phần còn lại
   làm THAM SỐ DÒNG LỆNH và chết bằng `Unknown arguments: tự, tạo, hồ, sơ …`.
   Triệu chứng ở đầu kia không hề gợi ra chuyện đó: bộ kiểm báo **401 cho một
   phiên vừa mới dựng**. Và nó không đỏ ngay ở reset, vì `set -e` cho script
   thoát trong khi một tiến trình wrangler CŨ vẫn giữ cổng 8787 và trả lời
   bình thường — mọi thứ trông y như đã reset xong. Cùng họ với bẫy nháy đơn
   trong khối `node -e` của `deploy.yml`.

   Hai việc phải giữ: khối SQL **không được có một dấu nháy kép nào**, và
   reset **đếm lại số phiên sau khi seed** rồi dừng ngay nếu thiếu. Đừng tin
   `set -e` — nó bảo vệ script, không bảo vệ bộ kiểm.

31. **Thứ tự xoá trong reset là bắt buộc: dòng con trước, dòng cha sau.**
   `dang_ky_tot_nghiep.member_id` và `fund_declarations.member_id` đều trỏ vào
   `members(id)`, nên `DELETE FROM members` đứng trước là vỡ
   `FOREIGN KEY constraint failed` và **cả khối SQL không chạy dòng nào** —
   không phải chỉ dòng ấy hỏng. Cùng lỗi `reset-thongbao.sh` đã vấp (phép 19).

32. **`innerText` của Chrome trả chữ ĐÃ ÁP `text-transform` — `textContent`
   thì không.** Phép kiểm tìm `/Chưa chọn lĩnh vực/` trong màn Ban cán sự lớp
   ĐỎ, dù đúng chuỗi ấy nằm trên màn hình và ảnh chụp cho thấy rõ: nhãn dùng
   lớp `.eb` có `text-transform:uppercase`, nên `innerText` trả về
   `CHƯA CHỌN LĨNH VỰC`. Hai hàm cho **hai kết quả khác nhau trên cùng một
   phần tử**, và cái khác nhau ấy chỉ lộ ra ở những chuỗi có dấu tiếng Việt
   viết hoa — tức gần như mọi nhãn trong ứng dụng này.

   Luật từ nay: phép kiểm đọc `innerText` thì so **không phân biệt hoa
   thường**, hoặc đọc `textContent` nếu cần đúng từng ký tự. Đừng chữa bằng
   cách gỡ `text-transform` khỏi CSS — đó là sửa sản phẩm cho vừa bộ kiểm.

33. **Cột flex có `max-height` BÓP con xuống dưới chiều cao nội dung, và chữ
   bị cắt trong im lặng.** Màn Ban cán sự lớp liệt kê 15 lĩnh vực trong một
   khung cuộn (`.dstnbox`, `display:flex; flex-direction:column; max-height`).
   `flex-shrink` mặc định là **1**, nên khi tổng chiều cao các mục vượt
   `max-height` thì trình duyệt **bóp từng mục lại** thay vì cho khung cuộn —
   và mục có tên hai dòng ("Nông nghiệp - Lâm nghiệp - Thuỷ sản (trồng trọt &
   chăn nuôi)") **mất hẳn dòng thứ hai**.

   Không lỗi JS, không phép kiểm chuỗi nào đỏ: chuỗi VẪN nằm đủ trong DOM, chỉ
   là không nhìn thấy được. **Chỉ ảnh chụp mới thấy** — cùng họ với `ORDER BY
   scope` ngược và tiêu đề `/giao-thuong` rơi về monospace. Chữa bằng
   `flex:0 0 auto` trên từng mục. Nay `pw-totnghiep.mjs` so
   `scrollHeight > clientHeight` cho **từng mục một** rồi in số mục bị cắt, nên
   lần sau máy thấy trước người.

## Chạy `kiem-tanso.mjs`

```bash
bash scripts/kiem/reset-tanso.sh && node scripts/kiem/kiem-tanso.mjs
```

Nó giả lập địa chỉ IP bằng header `cf-connecting-ip` — đúng thứ `clientIp()`
đọc trên bản thật — nên một tiến trình đóng được cả vai "cả lớp chung một
WiFi" lẫn vai kẻ dò ngồi chỗ khác. Địa chỉ lấy trong dải tài liệu RFC 5737.

34. **Cất mã QR đi thì phải kiểm CẢ HAI hình dạng của nó, không thì phép kiểm
   đậu suông.** Ngô Phú Cường yêu cầu 18/9: khai "đã chuyển khoản" xong là ẩn
   mã QR, vì để nguyên là mời chuyển tiền thêm một lần nữa cho đúng người vừa
   nói mình đã chuyển. Phép kiểm hiển nhiên là đếm `img.qr` phải bằng 0 —
   **và nó xanh kể cả khi bản vá không tồn tại**, bởi sandbox không ra được
   internet nên `img.vietqr.io` KHÔNG BAO GIỜ tải được: `img.onerror` đã thay
   thẻ ảnh bằng ô dự phòng `.ph` từ trước, nên `img.qr` vốn đã là 0 ở mọi lượt
   chạy. Phải đếm cả `.ph` (và cả nút `[data-tncopy]`).

   Cùng lượt còn kiểm ĐƯỜNG LUI, vì cất một thứ đi mà không lấy lại được là
   một lỗi khác: bỏ khai thì ô dự phòng phải quay lại thật, và câu chữ phải
   nói ra điều đó. Bài học chung: khi nhánh dự phòng luôn chạy trong sandbox,
   mọi phép kiểm nhắm vào nhánh CHÍNH đều mù — hỏi đúng thứ người dùng nhìn
   thấy, đừng hỏi thứ lẽ ra phải hiện.

35. **Nới một chốt chặn thì phép kiểm phải xoay sang canh CHIỀU CÒN LẠI, chứ
   không phải xoá đi.** Đường công khai của zone Lễ tốt nghiệp ban đầu trả 409
   khi gặp bản do người đã đăng nhập tự điền; ngày 18/9 Ngô Phú Cường nới ra
   để khai bổ sung được. Cách làm SAI là xoá phép kiểm 409 rồi thay bằng "gửi
   lại → 200" — nó xanh với cả một bản vá xoá sạch dữ liệu người khác, tức
   chính cái mà chốt cũ sinh ra để chống.

   Phép kiểm đúng gửi một request **CỐ Ý gần như rỗng** — đúng hình dạng của
   một lượt bổ sung thật, và cũng đúng hình dạng của một lượt phá hoại — rồi
   đòi: ô vừa gửi ĐÃ vào, và bốn ô KHÔNG có trong lượt gửi (họ tên, du_le,
   lĩnh vực KHKD, mốc gala_luc) vẫn còn nguyên. Đã đối chứng bằng cách gỡ
   `giuCu()` khỏi route: **ba phép đỏ ngay**. Kèm một phép cho mốc thời gian
   (phần không khai ở lượt này thì mốc phải ĐỨNG YÊN, không đóng lại) và một
   phép cho `nguon = 'ca_hai'` — dấu duy nhất cho Ban cán sự lớp biết dòng nào
   đã đi cả hai đường.

36. **Phép kiểm "ảnh không hỏng" phải có một ĐỐI CHỨNG chứng minh cách SAI
   thật sự làm hỏng.** Drive nhận thân multipart dựng bằng chuỗi mẫu và vẫn
   trả **HTTP 200** — kèm một tệp mở ra là vỡ, vì mọi byte ≥ 0x80 đã đi qua
   UTF-16 của JavaScript và bị thay bằng ký tự thay thế. Không có lỗi nào để
   đọc, không có mã trạng thái nào để bắt.

   `kiem-anh.mjs` vì vậy làm hai việc: tìm lại đúng tám byte nhị phân trong
   thân do `thanMultipart()` dựng (phải còn NGUYÊN), **và** dựng lại cùng thân
   ấy bằng chuỗi mẫu rồi đòi tám byte đó KHÔNG còn. Thiếu vế thứ hai thì phép
   đầu xanh với cả một bản vá cẩu thả, và ta chỉ biết mình sai khi Ban tổ chức
   mở thư mục Drive ra xem.

   Cùng tinh thần ấy cho `kiem-anh-route.mjs`: nó khai `content-type:
   image/jpeg` cho một tệp chạy Windows (`MZ`) và đòi 422 — đổi tên tệp và
   sửa header là chuyện một dòng, chỉ magic bytes chặn được.

37. **Một BACKTICK trong chú thích SQL giết cả lượt reset, và nó giết trong
   im lặng.** `reset-totnghiep.sh` bọc khối SQL bằng một chuỗi NHÁY KÉP, mà
   trong nháy kép backtick là THAY THẾ LỆNH. Hai dòng chú thích viết theo nếp
   Markdown của repo — trong đó có đúng dòng đang mô tả cái bẫy nháy kép —
   khiến shell thật sự chạy `Unknown arguments: …` và `node -e`, rồi nhét kết
   quả rỗng vào giữa câu SQL. Lần ấy SQL sống sót vì hai dòng đó là chú thích
   `--`; cùng dòng chữ ấy nằm trong một câu INSERT thì nó sửa thầm dữ liệu
   seed và bộ kiểm đỏ ở một chỗ chẳng liên quan.

   `kiem-deploy-yml.mjs` nay quét cả `reset-*.sh`/`gieo-*.sh`. Cùng họ với luật
   "không một nháy đơn nào trong khối `node -e`", chỉ khác ký tự.

38. **Bộ kiểm nào ĐỔI một bảng thì reset phải trả CHÍNH bảng ấy về gốc —
   kể cả bảng của tính năng khác.** Từ 18/9 `putHoSo` ghi ngược `linh_vuc`
   sang `member_profile.nganh`. Reset không dọn cột ấy, nên lượt chạy sau mở
   form ra đã thấy chip "Ngành khác" BẬT SẴN (do lượt trước để lại
   `nganh = khac,van-tai`) và hai phép kiểm ô chữ đỏ lên — ở một chỗ không
   liên quan gì tới thứ chúng đang canh.

   Câu hỏi phải tự hỏi mỗi khi thêm một lời GHI: bảng vừa động tới có nằm
   trong phần dọn của reset chưa? Cùng bài học `reset-doi-nhom.sh`, lần này
   cho một bảng thuộc tính năng khác hẳn.

39. **Một id GHI CỨNG là một cái hẹn giờ.** `kiem-tulieu-text.mjs` ghi cứng
   `BUOI_ID = 5` (buổi 11/9) kèm nguyên một đoạn chú thích cảnh báo rằng buổi
   ấy phải CHƯA QUA, vì `/api/home` chỉ trả 6 buổi SẮP TỚI. Sang 12/9 buổi ấy
   thành quá khứ và hai phép đối chứng đỏ mỗi ngày kể từ đó. Nay hỏi máy chủ:
   lấy buổi đầu tiên trong `/api/home`, tức luôn đúng theo chính cái đồng hồ
   mà route ấy dùng để lọc.

40. **Đo TRÀN NGANG phải đo đúng lúc khối đang MỞ.** Nhãn lĩnh vực KHKD dài
   nhất rộng 416px ở khổ 390px — tràn cả trang — nhưng phép đo cũ chạy lúc
   khối chứa hàng chip đang GẬP nên báo 0px suốt. Chỉ khi thêm một phép đo
   trên chính trang form công khai (nơi hàng chip ấy luôn hiện) mới lộ ra 42px.
   `.fc` có `white-space:nowrap` — đúng cho hàng CUỘN NGANG, sai cho hàng
   `.cuon` (xuống dòng), vì ở đó không có gì để kéo tới.

41. **Phép "chuỗi cũ đã biến mất" một mình KHÔNG có răng.** Bỏ bước "Nhóm chưa
   chốt đề tài" khỏi tab Hôm nay (19/9): phép grep chuỗi ấy trong `/api/home`
   vẫn XANH với một bản vá chỉ xoá bước cũ mà quên thêm bước mới, và xanh cả
   với một bước mới không bao giờ TẮT. Phải đi hết BA trạng thái — chưa khai →
   khai Gala → khai nốt hồ sơ — rồi đòi bước ấy **rơi xuống một bước CŨ**.

42. **Phép canh phải chạy bằng phiên NHÓM 6.** Nhóm 6 là nhóm DUY NHẤT có dòng
   `plans`, nên chín nhóm kia không bao giờ chạy vào nhánh đề tài. Chạy bằng
   cookie của nhóm khác là xanh giả, và không có gì nói cho biết.

43. **Regex quét feed "Đang diễn ra" bắt NHẦM luồng MỚI.** `/chốt đề tài/`
   khớp luôn `"chốt đề tài KHKD: …"` của đường CÁ NHÂN (`totnghiep.detai`) —
   tức bắt nhầm đúng thứ vừa dựng lên. Soi đúng chuỗi của đường NHÓM.

44. **Chuỗi mốc ngày phải `import`, và phép canh là GREP NGUỒN.** `home.js`
   không được chứa chuỗi `2026-09` nào: hai bản sao của một cái hạn thì sớm
   muộn lệch nhau, và triệu chứng là ô hero tắt sớm hoặc muộn một ngày mà
   không chỗ nào báo lỗi. Không đo được bằng hành vi — sandbox không đẩy được
   đồng hồ của D1 — nên ghi thẳng: đây là phép GREP, không phải phép đo.

45. **Màu phải đọc bằng `getComputedStyle`, và so với BIẾN chứ không mã màu.**
   Khối Đề tài ở tab Bài thôi dùng cam `--due`; phép kiểm chuỗi một mình mù
   với chuyện ấy. Ghi cứng `#A8500E` thì đổi giá trị biến là phép kiểm vẫn
   xanh — phải lấy `--due` từ chính stylesheet rồi chuẩn hoá qua một phần tử
   thật. Cùng họ với mục 29 và 33.

   Kèm một bẫy nhỏ: đổi cấu trúc DOM là các bộ chọn `>` gãy trong im lặng.
   `h1` chuyển vào trong băng `.tnhead` làm `.tncard > h1` thôi khớp ở ba chỗ.

46. **Ô ĐIỀN SẴN vô hiệu hoá mọi luật "ô trống thì giữ bản cũ" đứng sau nó.**
   Máy chủ hứa `giuCu()`, nhưng `tnckForm()` điền sẵn họ tên / doanh nghiệp /
   chức vụ bằng bản danh sách gốc 15/8 — ba ô ấy KHÔNG BAO GIỜ trống, nên
   người đã sửa doanh nghiệp, hôm sau quay lại chỉ để thêm ngày sinh, bị trả
   ngược về bản 15/8. Im lặng, và đúng lúc màn cuối đang hứa ngược lại.

   Phép canh đi hai tầng, vì mỗi tầng một mình đều mù: ở giao diện phải kiểm
   `value === ''` **và** `placeholder` có chữ (chỉ kiểm placeholder thì đổi
   ngược về `value=` vẫn xanh — trên ảnh chụp hai thứ trông y hệt nhau); ở máy
   chủ phải lưu `doanh_nghiep` một giá trị KHÁC bản gốc rồi bổ sung một ô
   khác, vì fixture cũ chưa bao giờ sửa hai ô ấy trước khi bổ sung.

47. **Mốc thời gian phải có chốt `coGi`, và phải đi CẢ HAI CHIỀU.** `putGala`
   đóng `gala_luc` vô điều kiện, nên một lượt bấm Lưu hụt (chưa chạm Có/Không)
   vẫn làm ô "Dự Lễ" thành ✓ xong và `xong_gala` đếm người ấy vào cột ĐÃ TRẢ
   LỜI — trong khi Ban tổ chức không có câu trả lời nào, mà con số ấy là cả lý
   do màn Ban cán sự lớp tồn tại. `putDeTai` có chốt này từ đầu, đường công
   khai cũng có; `putGala` là chỗ DUY NHẤT quên.

   Chiều ngược cũng phải kiểm: một bản vá chặn quá tay làm người trả lời
   "Không dự" cũng không đóng được mốc, và họ biến mất khỏi danh sách y hệt.

48. **Đếm ĐÚNG HAI nút chép, và soi từng nút mang chuỗi nào.** Nhánh dự phòng
   lúc mã QR không tải được tự nói "chuyển khoản tay theo số tài khoản bên
   dưới cũng được" — mà số ấy từng là chữ thường 12.5px, không chép được. Phép
   `count() >= 1` vẫn xanh khi bản vá làm rụng mất nút số tài khoản, nên phải
   đếm chính xác hai và đọc `data-tncopy` của từng nút.

49. **Danh sách BỊ CẮT phải NÓI RA, và phúc đáp chỉ được cộng thêm một CON SỐ.**
   `searchRoster` cắt cứng ở 12 người: gõ `"nguyen"` khớp 26, chỉ thấy 12, và
   người không thấy tên mình kết luận Ban tổ chức bỏ sót họ — ngay ở bước đầu
   tiên của lối đi duy nhất dành cho 38 người không đăng nhập được. Câu cũ còn
   khuyên "thử gõ ngắn hơn", ngược đúng chiều.

   Đường này CÔNG KHAI, nên phép canh có răng nhất là grep thô nguyên văn
   phúc đáp: không `"phone"`, không `"email"`, không chuỗi 10 chữ số nào.

50. **Cú chạm quan trọng nhất của sản phẩm phải BẤM VÀO GIỮA DÒNG.** Bước
   chọn tên ở `/vao` (và ở đường công khai `/totnghiep`) trước 19/9 chỉ cho
   bấm vào chữ "là tôi": 12px trong một ô cao 18px, sát mép phải — nhỏ hơn
   mọi nút khác trên màn, ở đúng bước đầu tiên của 77 người chưa vào.

   Phép kiểm bấm vào **chính chữ tên** chứ không vào chữ "là tôi": bấm chỗ cũ
   thì một bản vá chỉ nới chữ "là tôi" ra cũng xanh. Kèm phép đo chiều cao
   dòng ≥ 44px, và phép đòi chữ "là tôi" CÒN ĐÓ — bỏ nó đi thì dòng trông như
   một dòng chữ để đọc, và không ai biết là bấm được.

51. **Khối báo lỗi của màn vào phải đo được, không chỉ "có hiện ra".** Ba màn
   vào trước nay báo lỗi bằng `.hintline` — 11,5px màu `--ink3` (2,7:1) — rồi
   chỉ đổi MÀU CHỮ khi hỏng. Đó là thông điệp quyết định bỏ cuộc, đặt ở cỡ
   chữ nhỏ nhất và màu nhạt nhất của cả ứng dụng.

   Bốn phép: cỡ chữ ≥ 13px (đọc bằng `getComputedStyle`), nền đúng cặp
   `--due-bg` (**lấy biến từ stylesheet rồi chuẩn hoá qua một phần tử thật**
   — ghi cứng mã màu thì đổi biến là phép kiểm vẫn xanh, cùng bài học mục
   45), câu chính ≤ 90 ký tự (bản cũ của `phone_mismatch` dài **203**), và
   phải có dòng "làm gì tiếp" — một câu lỗi không nói được đường ra thì chỉ
   làm người ta đứng lại.

52. **Chỉ dấu bước phải đi HẾT ba số.** Một bản vá ghi cứng "Bước 1 / 3" ở
   mọi màn vẫn xanh với phép hỏi một lần. Và so bằng `textContent`, KHÔNG
   `innerText`: `.lb` có `text-transform:uppercase` nên `innerText` của Chrome
   trả về `BƯỚC 1 / 3` — đúng cái bẫy đã ghi ở mục màn Ban cán sự lớp, vấp
   lại ngay lượt chạy đầu.

53. **Chỗ giữ chỗ "đang tìm" phải LÀM CHẬM lượt gọi mới nhìn thấy.** Trên
   localhost khoảng chờ trôi qua trong vài mili giây, nên phép kiểm không làm
   gì sẽ xanh cả khi chỗ giữ chỗ không tồn tại. `page.route` hoãn 900ms.

   Bẫy kèm theo, đã vấp: gỡ route bằng `unroute` làm lượt gọi ĐANG BAY chết
   với `Route is already handled`. Dùng một cờ, để route ở nguyên đó.

54. **Ánh xạ "chạm ô nào mở khối nào" phải soi theo TÊN, không theo chỉ số.**
   Dải ba ô tiến độ của `/totnghiep` xếp Hồ sơ · Đề tài · Dự Lễ, còn ba khối
   xếp gala · hoso · detai — **NGƯỢC NHAU**. Một bản vá ánh xạ theo vị trí thì
   chạm "Hồ sơ" mở ra Gala, và không chỗ nào báo lỗi. Phép kiểm đi hết cả ba
   ô, mỗi lượt đọc `data-sec` của khối đang mở rồi so với tên mong đợi; soi
   theo chỉ số thì chính nó cũng sai cùng một kiểu và vẫn xanh.

   Kèm hai vế nữa cho cùng dải ô: chiều cao ≥ 44px, và **mở bằng `<summary>`
   thì dấu "đang mở" trên dải ô cũng phải đổi** — vế thứ hai bắt đúng bản vá
   đồng bộ dấu trong handler của ô thay vì trong listener `toggle`.

55. **Nói thẳng phép kiểm KHÔNG phân biệt được cái gì.** Phép "chạm ô là cuộn
   tới" ở `pw-totnghiep.mjs` đo cả trước lẫn sau (chỉ đo "sau" thì nó xanh cả
   khi khối vốn đã nằm trong màn). Nhưng nó **không** phân biệt được "chờ
   `toggle` rồi mới cuộn" với "cuộn ngay": đã gỡ bản vá ấy ra chạy đối chứng
   và phép kiểm vẫn xanh, vì gập khối Hồ sơ làm trần cuộn tụt từ 2265px xuống
   468px nên trình duyệt kẹp cú cuộn lại đúng chỗ.

   Ghi lại vì đây là loại nhầm đắt nhất: tưởng mình vừa vá một lỗi và có phép
   kiểm canh nó, trong khi chưa lỗi nào được chứng minh và phép kiểm không có
   răng ở đúng chiều ấy. Chạy đối chứng trước khi tin.

56. **Một đường ghi MỚI vào cột đăng nhập thì phải kiểm CẢ HAI CHIỀU, bằng
   hai người gọi khác nhau.** Từ 19/9 `putHoSo` ghi ngược số điện thoại sang
   `members.phone` kèm dấu `phone_self_set_at` — tức số khai ở form tốt
   nghiệp thành số tự đăng nhập được ở `/dangnhap`.

   `kiem-totnghiep.mjs` kiểm bằng `POST /api/onboard/check`, ba phép:
   số khai qua đường CÓ PHIÊN mở được cửa (200); số khai qua LINK CÔNG KHAI
   thì KHÔNG (401); và số có phiên vẫn còn hiệu lực sau đó.

   **Phép thứ hai mới là phép đáng giữ.** Đường công khai không có phiên, nó
   chỉ biết một `roster_id` gõ trong URL — cho nó đặt dấu ấy là trao cho bất
   kỳ ai cầm link `/totnghiep` quyền đặt chìa khoá đăng nhập cho MỘT NGƯỜI
   KHÁC. Đã chạy đối chứng cả hai chiều: gỡ lời gọi ở `putHoSo` → phép 1 đỏ;
   thêm lời gọi vào `postTotNghiepCongKhai` → phép 2 VÀ phép 3 đỏ (lượt ghi
   công khai còn ĐÈ MẤT số chính chủ đã tự đặt).

   Và `reset-totnghiep.sh` phải trả `members.phone` + `phone_self_set_at` về
   bản danh sách gốc. Không trả thì lượt chạy sau mở đầu với dấu đã đặt sẵn,
   nên phép 1 XANH kể cả khi bản vá đã bị gỡ — cùng bài học của phép 3.

57. **Băng "máy này đang đăng nhập rồi" phải kiểm CẢ LÚC KHÔNG CÓ PHIÊN.**
   `/dangnhap` trước 19/9 gọi thẳng màn tự nhận diện mà không hỏi người đang
   mở đã có phiên chưa, nên người đã ở trong ứng dụng bấm vào link nhận được
   một màn "Bạn là ai?" rồi bị đòi số điện thoại.

   `pw-totnghiep.mjs` kiểm bằng HAI ngữ cảnh trình duyệt: phiên Cường thấy
   băng kèm ĐÚNG TÊN, ngữ cảnh không cookie thì KHÔNG thấy gì. Bỏ vế thứ hai
   thì một bản vá vẽ băng vô điều kiện vẫn xanh — và nó sẽ bảo 77 người chưa
   vào được rằng họ đang đăng nhập rồi, ở đúng màn của họ. Kèm một vế nữa:
   biểu mẫu phải CÒN NGUYÊN bên dưới, vì một bản vá `location.href = '/'`
   cũng làm phép đầu xanh mà lại chặn đường đăng nhập bằng tài khoản khác.

58. **Lối về ở đầu trang: đo VỊ TRÍ, đừng đếm phần tử.** Ngô Phú Cường xin
   nút Back ở đầu `/totnghiep` vì nó vốn chỉ có ở chân trang. `.tnve` phải
   nằm TRÊN khối `<details>` đầu tiên (so `getBoundingClientRect().top`) —
   một nút thứ hai đặt nhầm xuống cuối vẫn làm phép đếm xanh mà chẳng chữa
   được gì. Kèm phép đối chứng cho chỗ LỆCH CÓ CHỦ Ý: đường CÔNG KHAI phải
   KHÔNG có nút ấy (với 38 người không đăng nhập được thì "về ứng dụng" dẫn
   thẳng vào màn 401), và soi ở màn ĐÃ dựng băng chàm chứ không ở màn 401
   ngay trước — màn ấy dùng `.claimcard`, đo ở đó thì xanh mà vô nghĩa.

59. **Ô tìm phải kiểm được rằng nó KHÔNG vẽ lại cả màn.** Màn thống kê có 146
   dòng nên phải có ô tìm, và nó lọc thẳng trên DOM. Phép "lọc đúng người"
   một mình vẫn xanh với một bản vá gọi `veDanhSachTotNghiep()` trong
   `oninput` — mà bản vá ấy làm ô tìm mất tiêu điểm và bàn phím điện thoại
   sập xuống sau MỖI CHỮ gõ vào. Phép có răng là
   `document.activeElement?.id === 'dstnTim'` sau khi lọc.

60. **Chiều `bai_cua: 'ho'` là phép DUY NHẤT bắt được việc bỏ quên
   `nguoi_gui_id`.** Rủ người cùng làm đề tài (migration 0045) ghi mỗi quan hệ
   thành một dòng phẳng "`ban` đứng tên trên bài của `chu`", và người DUYỆT
   luôn là người KHÔNG gửi — nhờ vậy cả hai chiều ("họ cùng làm bài của tôi" và
   "tôi cùng làm bài của họ") đều do người kia đồng ý, đúng nguyên văn yêu cầu.

   **Đã chạy đối chứng:** đổi `nguoiDuyet()` thành `r => r.ban_member_id` (tức
   bỏ quên `nguoi_gui_id`) thì phép "người GỬI tự bấm Đồng ý → 404" của chiều
   `'toi'` **VẪN XANH**, và chỉ hai phép của chiều `'ho'` mới đỏ. Bản vá hỏng
   ấy cho chính người vừa xin được tự duyệt đơn của mình — tức vế ĐỒNG Ý, cả
   lý do tính năng này tồn tại, biến mất mà không chỗ nào báo lỗi.

61. **Chỉ số MỘT PHẦN phải kiểm cả chiều "làm lại được".** `ux_cunglam_dang_song`
   chỉ phủ `('cho_duyet','da_dong_y')`, nên từ chối rồi vẫn rủ lại được ngay và
   rời ra rồi vẫn quay lại được. Phép "rủ hai lần → 409" một mình vẫn xanh với
   một chỉ số ĐẦY ĐỦ (phủ mọi trạng thái) — mà bản ấy bắt người đổi ý phải chờ
   hết hạn một thứ không có hạn.

   **Và một chỉ số `UNIQUE(ban_member_id)` thì chỉ phép "đứng được NHIỀU bài"
   mới bắt.** Đã chạy đối chứng bằng cách tạo đúng chỉ số ấy trên D1 cục bộ:
   SQLite **từ chối tạo** vì dữ liệu bộ kiểm vừa sinh ra đã vi phạm — đó tự nó
   là bằng chứng; xoá bảng rồi tạo lại thì phép ấy đỏ, và chỉ mình nó đỏ.

62. **Phép hero chỉ có răng khi nó TỚI ĐƯỢC bước đang canh.** `computeAction`
   xét Gala ở bước 1, lời rủ cùng làm ở bước 2. Phiên chưa trả lời Gala thì
   rơi ngay ở bước 1, nên phép "người GỬI KHÔNG bị nhắc trả lời lời rủ của
   chính mình" xanh vì một lý do chẳng liên quan.

   **Đã chạy đối chứng và thấy đúng vậy:** gỡ hẳn điều kiện `nguoi_gui_id <> ?`
   ra khỏi `home.js` mà cả hai phép vẫn xanh. Nay bộ kiểm trả lời Gala cho
   phiên ấy TRƯỚC, và còn khẳng định thẳng rằng nó đã qua được bước 1 — gỡ bản
   vá ra thì phép đỏ đúng chỗ.

   Cùng họ, ở tầng giao diện: `innerText` của Chrome trả về **RỖNG** cho nội
   dung nằm trong `<details>` đang đóng. Nên một phép so chuỗi trên khối đang
   gập không đỏ vì "chuỗi sai" mà vì "chuỗi rỗng", và câu báo lỗi trỏ sai chỗ
   hoàn toàn. `pw-totnghiep.mjs` trả lời Gala trước khi soi khối Đề tài, và có
   một phép RIÊNG cho cảnh khối ấy đang gập: dòng phụ CAM ở `<summary>` phải
   vẫn báo có người đang chờ — đó là thứ DUY NHẤT còn nhìn thấy được lúc ấy.

63. **Phép "chủ bài không gỡ được ai" phải soi ĐÚNG MÀN, và vai ở đây ngược
   với trực giác.** Lượt gửi trong `pw-totnghiep.mjs` chọn `bai_cua: 'ho'`
   (Cường XIN vào bài của Nhóm Bảy), nên NHÓM BẢY là chủ bài còn CƯỜNG là
   người cùng làm — ngược hẳn thứ tự hai phiên xuất hiện trong tệp. Soi nhầm
   màn thì cả hai phép đỏ ở một chỗ chẳng liên quan gì tới thứ chúng đang canh.

   Kèm một phép từng KHÔNG THỂ ĐỎ và đã bị thay: `locator('.tncl [data-clgo]')
   .count() === 0` — không có bộ chọn nào tên `data-clgo` ở bất kỳ đâu trong mã,
   nên nó xanh vĩnh viễn. Nay hỏi câu đúng: màn CHỦ BÀI phải có **0** nút
   `[data-clroi]`, màn người cùng làm phải có **đúng 1**.

64. **`\b` của regex coi dấu chấm là ranh giới từ — đổi tên biến hàng loạt làm
   hỏng cả một URL.** Khi thêm khối mới vào `kiem-totnghiep.mjs`, tôi đổi tên
   các biến trùng bằng `re.sub(r'\bcsv\b', 'clCsv', ...)` — và nó sửa luôn
   chuỗi `'/api/totnghiep/xuat.csv'` thành `'/api/totnghiep/xuat.clCsv'`, nên
   ba phép CSV đỏ với một lý do không có trong mã sản phẩm. Đổi tên biến bằng
   regex thì phải soi lại các chuỗi hằng, hoặc chọn tên không trùng một mẩu
   nào của đường dẫn.

## Chạy bộ kiểm đường nộp ảnh (Google Drive)

```bash
node scripts/kiem/kiem-anh.mjs          # chạy thẳng, không cần máy chủ
bash scripts/kiem/reset-totnghiep.sh && node scripts/kiem/kiem-anh-route.mjs
```

**`.dev.vars` phải có `GOOGLE_BASE_URL=http://127.0.0.1:2527`** — một CỔNG
ĐÓNG, cùng lý do `SMTP_HOST` và `LLM_BASE_URL` trỏ về loopback. `fetch` tới
`googleapis.com` trong sandbox không hỏng, nó **TREO** tới khi workerd cắt, bộ
kiểm chết bằng `UND_ERR_SOCKET: other side closed`, và không phép nào đọc được
`hong_o_buoc`. Cổng đóng thì lỗi nổi lên trong vài mili giây, và phép kiểm
khẳng định được nó hỏng ở đúng bước `lay_token` (subrequest đầu tiên).

**Điều hai bộ này KHÔNG chứng minh được, nói thẳng:** không một tệp nào từng
tới Drive từ đây. Chúng chứng minh mọi thứ đứng TRƯỚC lượt gọi ra ngoài, cộng
nhánh hỏng của chính nó. Bằng chứng duy nhất đáng tin là mở thư mục Drive và
thấy ảnh ở đó — đúng bài học của đường gửi thư ngày 24/8.

## Chạy bộ kiểm zone Lễ tốt nghiệp

**MỖI BỘ MỘT LƯỢT RESET RIÊNG** — khác hẳn bộ kiểm Trợ lý ngay dưới, nơi hai
bộ dùng chung một lượt:

```bash
bash scripts/kiem/reset-totnghiep.sh && node scripts/kiem/kiem-totnghiep.mjs
bash scripts/kiem/reset-totnghiep.sh && node scripts/kiem/pw-totnghiep.mjs
```

Lý do: cả hai bộ đều **THẬT SỰ GHI** vào `dang_ky_tot_nghiep` của cùng một
người (Ngô Phú Cường). Chạy nối đuôi không reset thì `pw-` mở màn với ba phần
đã điền sẵn từ lượt `kiem-` vừa xong, và **sáu tới bảy phép đỏ** — chúng hỏi
"chip còn *chưa điền* không", "khối Gala có mở sẵn không", "bấm chip thứ tư có
bị chặn không", toàn những câu chỉ đúng trên một bảng trắng. Đã vấp thật.

Triệu chứng dễ đọc nhầm nhất: **số phép đỏ đổi giữa hai lượt chạy liên tiếp**
(7 rồi 6). Bộ kiểm hỏng thì đỏ đều; con số nhảy là dấu hiệu của trạng thái
tồn đọng, không phải của mã sai.

## Chạy bộ kiểm Trợ lý KHKD

Hai lượt, vì công tắc tắt nằm trong D1 mà chạm D1 lúc server đang chạy là
server chết:

```bash
bash scripts/kiem/reset-tro-ly.sh                                  \
  && node scripts/kiem/kiem-tro-ly.mjs                             \
  && node scripts/kiem/pw-tro-ly.mjs        # hai bộ dùng CHUNG một lượt reset

bash scripts/kiem/reset-tro-ly.sh tat                               \
  && node scripts/kiem/kiem-tro-ly.mjs tat                          \
  && node scripts/kiem/pw-tro-ly.mjs tat
```

**`.dev.vars` phải có `LLM_BASE_URL=http://127.0.0.1:2526/chat/completions`** —
cùng lý do `SMTP_HOST` trỏ về loopback (xem mục cuối trang). `fetch` tới
`api.deepseek.com` trong sandbox không hỏng, nó TREO: request treo tới khi
workerd cắt, bộ kiểm chết với `UND_ERR_SOCKET: other side closed`, và không
phép nào đọc được `hong_o_buoc`. Một cổng ĐÓNG thì lỗi nổi lên trong 20ms.
`.dev.vars.example` đã ghi sẵn dòng ấy; **bản thật phải để trống** (bộ kiểm có
một phép canh `wrangler.toml` đúng chỗ này).

Điều bộ kiểm này **KHÔNG** chứng minh được: một câu trả lời thật của mô hình.
Sandbox không ra được internet, nên mọi lượt gọi đều đi vào nhánh hỏng. Bằng
chứng duy nhất đáng tin vẫn là một phiên thật trên tên miền — đúng bài học của
đường gửi thư ngày 24/8.

## `kiem-deploy-yml.mjs` — một dòng luật, và vì sao nó đáng một tệp riêng

```bash
node scripts/kiem/kiem-deploy-yml.mjs      # không cần máy chủ, chạy trong 1 giây
```

Luật: **trong một khối `node -e '…'` của `deploy.yml` không được có một dấu
nháy đơn nào** — kể cả trong chuỗi JS, kể cả trong chú thích.

Trong nháy đơn, shell KHÔNG có cơ chế thoát nào cả: gặp nháy đơn thứ hai là nó
ĐÓNG chuỗi ngay, phần tiếp theo rơi ra ngoài cho shell đọc như mã lệnh. Hai
kiểu hỏng, và kiểu thứ nhất mới là kiểu nguy:

1. **Số nháy đơn CHẴN, phần lọt ra không có ký tự đặc biệt** → shell ghép lại
   thành một chuỗi và mọi thứ *trông như* vẫn chạy. Nhưng mọi dấu `"` trong
   phần lọt ra bị ĂN MẤT, nên **node nhận một chuỗi KHÁC hẳn thứ đọc thấy
   trong tệp**. Không có gì báo lỗi.
2. **Có `(` hay `)` trong phần lọt ra** → `syntax error near unexpected token`,
   cả bước kiểm chết.

Cả hai đã xảy ra thật ở lượt deploy **#111** (12/9, commit Trợ lý KHKD): mã
Worker lên bình thường, migration áp xong, Pages xuất bản xong — chỉ bước
"Kiểm tra tên miền thật" tự chết. Đo lại bằng cách đặt một `node` GIẢ lên
`PATH` để bắt đúng chuỗi shell truyền vào `-e`: **tệp có 4.542 byte, node chỉ
nhận được 2.225.** Tức là chuỗi ấy đã hỏng từ trước cả lúc nó chết hẳn.

Cách viết thay thế, cho cả ba loại nội dung:

| Cần gì | Viết thế nào |
|---|---|
| chuỗi JS | nháy kép `"…"` hoặc backtick `` `…` `` |
| nháy đơn trong DỮ LIỆU (câu SQL) | `\u0027` — thoát của JS, tệp không có ký tự nháy đơn thật |
| chú thích | viết lại cho không có dấu nháy đơn |

Bộ kiểm này **đã được đối chứng**: nhét lại đúng dòng cũ thì nó đỏ ngay, và
chỉ đỏ đúng khối có lỗi.

## Hai chỗ môi trường này không kiểm được

- **`/api/passkey/register/verify`.** `wrangler dev` có mục `routes` nên báo
  `request.url` mang hostname production, trong khi trình duyệt ở `localhost`.
  `verifyRegistrationResponse` so hai thứ ấy rồi từ chối. Đổi host kiểu gì cũng
  vướng. Trên tên miền thật hai bên trùng. Kiểm được tới đâu thì khẳng định tới
  đó: options trả 200, trình duyệt tạo khoá thật, bấm xong rời màn `/vao`.
- **Gửi thư.** Không có máy chủ thư, nên `502 mail_send_failed` là kết quả
  ĐÚNG ở đây — nó chứng tỏ route chạy hết đường tới bước gửi. Đòi 2xx là đòi
  thứ môi trường không làm được, rồi sẽ phải nới ra, mà nới thì hết răng.

  **Và một bẫy mới của chính bộ kiểm thư (6/9):** đừng gọi `wrangler d1
  execute --local` GIỮA CHỪNG một bộ kiểm đang chạy để lấy mẫu số. `wrangler
  dev` giữ khoá tệp SQLite từ lúc khởi động, nên lượt gọi ấy cắt ngang kết nối
  HTTP đang mở và bộ kiểm chết với `UND_ERR_SOCKET: other side closed` — trông
  y hệt máy chủ sập, mà `curl` ngay sau đó vẫn trả 200. Đọc trước, lúc server
  còn TẮT, rồi ghi ra tệp (`reset-mail-thongbao.sh` → `mail-mau-so.json`).

  **Nhưng `.dev.vars` phải trỏ SMTP vào một cổng ĐÓNG trên máy này**, ví dụ
  `SMTP_HOST=127.0.0.1` / `SMTP_PORT=2525`. Để nguyên `smtp.gmail.com` như tệp
  mẫu thì trong sandbox `connect()` của Workers không bao giờ giải quyết (xem
  mục gửi thư trong CLAUDE.md), request treo tới khi workerd cắt kết nối, và
  bộ kiểm chết giữa chừng với `UND_ERR_SOCKET: other side closed` — trông y
  như máy chủ sập chứ không giống lỗi cấu hình.
