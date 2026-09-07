-- Gỡ số điện thoại TRÙNG khỏi hồ sơ Lê Minh Tiến (seq 102, Nhóm 8).
--
-- Bối cảnh: `0914544449` nằm trong roster của CẢ HAI người tên Tiến — Lưu Minh
-- Tiến (seq 65) và Lê Minh Tiến (seq 102) — từ lần nạp đầu, và đã được ghi vào
-- bo-sung-dien-thoai.csv nhóm "đang SAI" suốt từ Đợt 5 mà không biết số ấy là
-- của ai.
--
-- Nay biết: thư mời kiến tập 11/9 ngày 6/9 của Ban tổ chức ghi rõ **Lưu Minh
-- Tiến — trưởng đoàn — 0914.544.449**. Ngô Phú Cường xác nhận. Vậy số ấy là
-- của Lưu Minh Tiến, và bản sao nằm ở hồ sơ Lê Minh Tiến là một lỗi chép.
--
-- VÌ SAO PHẢI GỠ NGAY, không để đó chờ có số thật của Lê Minh Tiến:
-- `soHopLeTuHoSo()` (routes/onboard.js) nhận `roster.phone` làm bí mật mở cửa
-- `/vao`, và cửa ấy mở được hồ sơ CHƯA AI NHẬN. Lê Minh Tiến chưa nhận hồ sơ.
-- Nghĩa là bất kỳ ai đọc thư mời — tức cả lớp, vì thư vừa được phát — đều có
-- thể vào /vao, chọn tên Lê Minh Tiến, gõ đúng số ấy và chiếm hồ sơ của anh.
-- Trước ngày 6/9 số này chỉ nằm trong danh sách nội bộ; từ hôm nay nó nằm
-- trong một tờ thư mời gửi cho 146 người. Rủi ro đổi hẳn bậc.
--
-- Gỡ số đi thì anh Lê Minh Tiến không tự đăng nhập ở /vao được nữa — nhưng
-- anh vốn dĩ CŨNG KHÔNG NÊN vào bằng số của người khác. Đường vào của anh là
-- link mời: Ngô Phú Cường hoặc Lưu Minh Tiến phát trong một cú chạm ở
-- Danh bạ → Cả lớp (tính năng xuyên nhóm, 3/9).
--
-- KHÔNG đụng gì tới hồ sơ Lưu Minh Tiến (seq 65): số của anh đã đúng sẵn
-- trong cả `roster` lẫn `members` từ migration 0021, không cần điền lại.

-- Chỉ gỡ khi số VẪN LÀ bản trùng ấy (ai đó đã điền số thật của anh rồi thì
-- không đè lên), và chỉ khi anh CHƯA nhận hồ sơ — đã nhận thì /vao đóng vĩnh
-- viễn nên số không còn là chìa khoá, mà lại là bản ghi lịch sử nên giữ.
UPDATE roster
   SET phone = NULL
 WHERE cohort_id = (SELECT id FROM cohorts WHERE code = 'K03')
   AND seq = 102
   AND phone = '0914544449'
   AND NOT EXISTS (SELECT 1 FROM members m
                    WHERE m.roster_id = roster.id AND m.claimed_at IS NOT NULL);

-- Và bản đã đồng bộ sang members nếu có (hiện chưa có dòng nào, nhưng route
-- phát link mời tạo hồ sơ trước rồi mới cấp link — chạy sau thì dòng ấy có).
UPDATE members
   SET phone = NULL, updated_at = datetime('now')
 WHERE claimed_at IS NULL
   AND phone = '0914544449'
   AND roster_id = (SELECT id FROM roster
                     WHERE cohort_id = (SELECT id FROM cohorts WHERE code = 'K03')
                       AND seq = 102);
