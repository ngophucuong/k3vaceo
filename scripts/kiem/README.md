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
| `kiem-tro-ly.mjs` | Trợ lý KHKD: **lệch nền tri thức D1 ↔ giao-trinh.js**, N6 bốn route, hai tầng trần lượt, công tắc tắt, và `hong_o_buoc` của nhánh gọi hỏng |
| `pw-tro-ly.mjs` | giao diện hội thoại trợ lý — **XSS trên chữ do MÔ HÌNH sinh ra**, khung cuộn riêng, và ô nhập giữ nguyên chữ khi gửi hỏng |
| `reset-tro-ly.sh` | gieo ba phiên có sẵn tin nhắn (kể cả bốn ca độc), một phần bài của Nhóm 7, và hai hồ sơ 40/39 lượt; `… tat` để kiểm công tắc tắt |

Hai tệp `coso.json` và `moi-tanso.json` **tự sinh, không commit** — chúng chỉ
đúng với dữ liệu đang nằm trong D1 cục bộ. Trước 27/8 `coso.json` nằm ở thư mục
scratchpad, nên `pw-vao-nhanh.mjs` commit vào repo **không chạy nổi**: thiếu
đúng một tệp mà không ai biết lấy ở đâu. Nay `reset-vao.sh` sinh lại nó.

## Hai mươi hai phép đối chứng đáng giữ nhất

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


## Chạy `kiem-tanso.mjs`

```bash
bash scripts/kiem/reset-tanso.sh && node scripts/kiem/kiem-tanso.mjs
```

Nó giả lập địa chỉ IP bằng header `cf-connecting-ip` — đúng thứ `clientIp()`
đọc trên bản thật — nên một tiến trình đóng được cả vai "cả lớp chung một
WiFi" lẫn vai kẻ dò ngồi chỗ khác. Địa chỉ lấy trong dải tài liệu RFC 5737.

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
