-- Ngô Phú Cường yêu cầu trực tiếp 5/9: thêm Nguyễn Tuấn Hùng, Nhóm 3.
-- Đúng khuôn rà soát đã dùng cho migration 0028: tên này nằm trong sheet "DS
-- lớp" (chữ ký buổi 21/8) của tệp "Final_Danh_sách_ký_K03_15.08" nhưng KHÔNG
-- khớp bất kỳ ai trong 138 người của roster lúc đó — TT=14, Nhóm 3, đơn vị
-- "Công ty CP Đầu tư GemVN". Sheet không ghi ngày sinh/chức vụ/địa chỉ/điện
-- thoại cho dòng này — để trống, đúng nguyên tắc "thiếu thông tin thì để
-- trống, đừng bịa" đã dùng xuyên suốt các migration roster trước.
--
-- seq nối tiếp ngay sau 138 (Võ Thị Trang, migration 0028) — không dùng lại
-- TT=14 của tệp Excel vì đó là số thứ tự của MỘT TỆP KHÁC, không phải khoá
-- của ta (roster.seq chỉ để hiển thị).
--
-- Không có số điện thoại nên anh ấy KHÔNG tự vào được ở /vao — đã thêm dòng
-- tương ứng vào scripts/data/bo-sung-dien-thoai.csv. Cách vào ngay bây giờ:
-- Ban cán sự lớp phát link mời qua Danh bạ → Cả lớp (route xuyên nhóm, mục
-- "Link mời xuyên nhóm" trong CLAUDE.md) — bước NHẬN của người CHƯA từng nhận
-- hồ sơ chỉ đòi email, không đòi số điện thoại (xem postInviteClaim), nên
-- thiếu số không chặn được đường này.
INSERT INTO roster (cohort_id, seq, group_label, full_name, dob, title, company, address, phone, source)
SELECT (SELECT id FROM cohorts WHERE code = 'K03'), 139, 'Nhóm 3', 'Nguyễn Tuấn Hùng', NULL,
       NULL, 'Công ty CP Đầu tư GemVN', NULL, NULL,
       'Ban tổ chức, DS lớp chữ ký 21/8, bổ sung 5/9 theo yêu cầu Ngô Phú Cường'
 WHERE NOT EXISTS (SELECT 1 FROM roster WHERE full_name = 'Nguyễn Tuấn Hùng' AND seq = 139);
