-- Trương Thị Ngọc Anh — Nhóm 4, KHÔNG có trong danh sách gốc "Ban tổ chức
-- 15/8" (134 người, migration 0002). Ngô Phú Cường xác nhận ngày 4/9 từ một
-- tệp khác của Ban tổ chức (cột STT riêng của tệp đó, seq=15 trong tệp — SỐ
-- NÀY KHÔNG DÙNG LẠI được vì roster.seq=15 của ta đã thuộc về người khác từ
-- migration 0002; hai tệp đánh số độc lập nhau). Gán seq=135, nối tiếp ngay
-- sau người thứ 134 — roster.seq không được code dùng để tra cứu (chỉ hiển
-- thị), khoá thật là roster.id.
--
-- Cùng công ty + địa chỉ với Nguyễn Trung Đức (seq 51, Nhóm 4) — "71 Nguyễn
-- Chí Thanh, phường Giảng Võ, Hà Nội" — củng cố đây là người thật, không phải
-- lỗi đánh máy trong tệp nguồn.
--
-- SỐ ĐIỆN THOẠI THIẾU 1 CHỮ SỐ trong tệp gốc (086689856 — 9 số, cần 10) —
-- CÙNG DẠNG LỖI đã gặp với Lê Trung Đức (mục "Việc còn treo" CLAUDE.md). Ghi
-- nguyên văn, không đoán số còn thiếu — người này sẽ không tự vào được ở
-- /vao cho tới khi có số đúng.
INSERT INTO roster (cohort_id, seq, group_label, full_name, dob, title, company, address, phone, source)
SELECT (SELECT id FROM cohorts WHERE code = 'K03'), 135, 'Nhóm 4', 'Trương Thị Ngọc Anh', '1994',
       'Manager', 'Công ty CP Trường học MindX',
       '71 Nguyễn Chí Thanh, phường Giảng Võ, Hà Nội', '086689856',
       'Ban tổ chức, bổ sung 4/9'
 WHERE NOT EXISTS (SELECT 1 FROM roster WHERE full_name = 'Trương Thị Ngọc Anh' AND seq = 135);
