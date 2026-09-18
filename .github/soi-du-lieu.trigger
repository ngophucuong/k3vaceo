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

lần: 7 — vá chính phép kiểm vừa thêm: GLOB '0[0-9]*' chỉ soi hai ký tự đầu
nên số "03845375x8" (lẫn chữ x) lọt qua. Đo được: cách cũ đếm 3 số sai
khuôn, cách đúng đếm 4.

lần: 8 — soi Trương Thị Ngọc Anh trước khi đổi Nhóm 4 sang Nhóm 6: roster,
members (đã có hồ sơ hoạt động chưa), officers, plan_sections, id thật của
hai nhóm. Bước mới TỰ CHỨA, không gọi hàm soi() của bước khác — đúng bài
học lần 6 ở trên.

lần: 9 — lượt 8 tự vấp đúng lỗi đã ghi ở lần 3: dùng `$WRANGLER --command
... | tail -20` thay vì hàm soi() dùng jq, nên mọi khối chỉ còn "success"/
"meta", mất sạch "results". Sửa bằng cách copy hàm soi() vào trong chính
bước này (không gọi chéo bước khác, vẫn giữ bài học lần 6).

lần: 10 — chuẩn bị migration 0041 (zone Lễ tốt nghiệp). Bốn câu chặn:
collector_member_id của đợt thu phí Gala trỏ vào ai (migration 0027 cố ý
KHÔNG tạo members cho Vũ Thị Ngân, để phan-vai.yml làm — chưa biết đã chạy
chưa); đã có đợt thu 1.000.000đ nào chưa; roster.dob định dạng ra sao (cột
này chưa code nào từng đọc mà form sắp in ra cho học viên xác nhận); và
nhóm nào đã có dòng plans để gắn ban_nop_url.

lần: 11 — nghiệm thu migration 0041 (zone Lễ tốt nghiệp). Một câu quyết định:
collector_member_id của đợt thu phí Gala có trỏ đúng Vũ Thị Ngân không. Nó
tính bằng truy vấn con lồng hai tầng; trượt là đợt thu có người thu RỖNG — ai
cũng khai được mà KHÔNG AI XÁC NHẬN ĐƯỢC, và không chỗ nào báo lỗi. Đây là
đợt thu cấp lớp đầu tiên của dự án nên không có tiền lệ để so.

lần: 12 — Ngô Phú Cường hỏi "có cách nào phát link mời thuận tiện nhất
không". Đo con số quyết định câu trả lời: trong 77 người chưa nhận hồ sơ,
bao nhiêu người CÓ SỐ đúng khuôn trong danh sách gốc (tự vào được ở
/dangnhap, không cần ai phát gì) và bao nhiêu người thật sự cần phát link
tay. Kèm danh sách tên nhóm sau để chia việc.
