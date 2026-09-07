Sửa tệp này rồi đẩy lên là chạy "Soi dữ liệu thật".
Không ghi gì, không gửi thư — chỉ đọc.

lần: 3 — đọc kết quả bằng jq thay vì tail (tail cắt mất bảng tổng quan),
và đo thêm MẪU SỐ: bao nhiêu người thật sự có thể nhận được thư.

lần: 4 — Ngô Phú Cường hỏi "có notify cho thông báo này không". Đếm xem thực
tế bao nhiêu người đã bật thông báo đẩy, và đã có gói tin nào gửi đi thành công.

lần: 5 — xác nhận trên D1 THẬT rằng migration 0033 đã gỡ đúng: số
0914544449 nay chỉ còn ở một hồ sơ (Lưu Minh Tiến), và đếm xem cả roster
còn bao nhiêu số bị hai người dùng chung.

lần: 6 — lượt 5 đỏ vì "soi: command not found": hàm soi() định nghĩa ở bước
"Soi cả lớp", còn ba phép đo mới bị chèn vào bước "Đọc" — mỗi `run:` là một
shell riêng nên hàm không đi theo sang bước sau. Đã chuyển vào đúng bước.
