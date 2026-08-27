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

## Bốn phép đối chứng đáng giữ nhất

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

## Hai chỗ môi trường này không kiểm được

- **`/api/passkey/register/verify`.** `wrangler dev` có mục `routes` nên báo
  `request.url` mang hostname production, trong khi trình duyệt ở `localhost`.
  `verifyRegistrationResponse` so hai thứ ấy rồi từ chối. Đổi host kiểu gì cũng
  vướng. Trên tên miền thật hai bên trùng. Kiểm được tới đâu thì khẳng định tới
  đó: options trả 200, trình duyệt tạo khoá thật, bấm xong rời màn `/vao`.
- **Gửi thư.** Không có máy chủ thư, nên `502 mail_send_failed` là kết quả
  ĐÚNG ở đây — nó chứng tỏ route chạy hết đường tới bước gửi. Đòi 2xx là đòi
  thứ môi trường không làm được, rồi sẽ phải nới ra, mà nới thì hết răng.
