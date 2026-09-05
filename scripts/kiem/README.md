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
| `kiem-moi.mjs` | link mời xuyên nhóm cho Ban cán sự lớp (`POST /api/danh-ba/:id/moi`), **kể cả người đã đăng nhập** — đối chứng xác nhận lại số điện thoại và hạn mức đoán |
| `pw-nhanlai.mjs` | giao diện của phát lại link cho người đã đăng nhập — ô điện thoại phải RỖNG, không lộ số thật |
| `kiem-tulieu-text.mjs` | Tư liệu dạng Text: bắt buộc content_md, đếm công khai, layTuLieuTheoBuoi |
| `pw-tulieu-text.mjs` | **an toàn XSS của `mdSafe()`** — bốn ca độc + bốn ca thuận + giao diện |
| `kiem-tulieu-bai.mjs` | tư liệu gắn vào PHẦN BÀI (links.section_id): plan.js/links.js, **N6** qua nhóm khác |
| `pw-tulieu-bai.mjs` | giao diện: sheet phần bài ↔ Gắn Tư liệu ↔ tab Tư liệu, "một dòng, ba màn" |
| `reset-tanso.sh` | dọn sổ tần suất và gieo lời mời cho `kiem-tanso.mjs` |
| `reset-moi.sh` | dựng hai phiên + hai hồ sơ thử cho `kiem-moi.mjs` |
| `reset-tulieu-text.sh` | dựng phiên Ngô Phú Cường cho `kiem-tulieu-text.mjs` / `pw-tulieu-text.mjs` |
| `reset-tulieu-bai.sh` | như trên, cộng seed một `plan_sections` của NHÓM KHÁC cho phép kiểm N6 |
| `gieo-coso.mjs` · `gieo-moi.mjs` | sinh dữ liệu đối chứng, hai reset tự gọi |

Hai tệp `coso.json` và `moi-tanso.json` **tự sinh, không commit** — chúng chỉ
đúng với dữ liệu đang nằm trong D1 cục bộ. Trước 27/8 `coso.json` nằm ở thư mục
scratchpad, nên `pw-vao-nhanh.mjs` commit vào repo **không chạy nổi**: thiếu
đúng một tệp mà không ai biết lấy ở đâu. Nay `reset-vao.sh` sinh lại nó.

## Tám phép đối chứng đáng giữ nhất

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

## Chạy `kiem-tanso.mjs`

```bash
bash scripts/kiem/reset-tanso.sh && node scripts/kiem/kiem-tanso.mjs
```

Nó giả lập địa chỉ IP bằng header `cf-connecting-ip` — đúng thứ `clientIp()`
đọc trên bản thật — nên một tiến trình đóng được cả vai "cả lớp chung một
WiFi" lẫn vai kẻ dò ngồi chỗ khác. Địa chỉ lấy trong dải tài liệu RFC 5737.

## Hai chỗ môi trường này không kiểm được

- **`/api/passkey/register/verify`.** `wrangler dev` có mục `routes` nên báo
  `request.url` mang hostname production, trong khi trình duyệt ở `localhost`.
  `verifyRegistrationResponse` so hai thứ ấy rồi từ chối. Đổi host kiểu gì cũng
  vướng. Trên tên miền thật hai bên trùng. Kiểm được tới đâu thì khẳng định tới
  đó: options trả 200, trình duyệt tạo khoá thật, bấm xong rời màn `/vao`.
- **Gửi thư.** Không có máy chủ thư, nên `502 mail_send_failed` là kết quả
  ĐÚNG ở đây — nó chứng tỏ route chạy hết đường tới bước gửi. Đòi 2xx là đòi
  thứ môi trường không làm được, rồi sẽ phải nới ra, mà nới thì hết răng.

  **Nhưng `.dev.vars` phải trỏ SMTP vào một cổng ĐÓNG trên máy này**, ví dụ
  `SMTP_HOST=127.0.0.1` / `SMTP_PORT=2525`. Để nguyên `smtp.gmail.com` như tệp
  mẫu thì trong sandbox `connect()` của Workers không bao giờ giải quyết (xem
  mục gửi thư trong CLAUDE.md), request treo tới khi workerd cắt kết nối, và
  bộ kiểm chết giữa chừng với `UND_ERR_SOCKET: other side closed` — trông y
  như máy chủ sập chứ không giống lỗi cấu hình.
