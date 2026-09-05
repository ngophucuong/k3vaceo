-- Bảy người còn lại trong đợt rà soát sheet "DS lớp" (chữ ký buổi 21/8) của
-- tệp "Final_Danh_sách_ký_K03_15.08" — phần "chưa xử lý" ghi trong CLAUDE.md
-- sau migration 0028/0029. Ngô Phú Cường xác nhận trực tiếp 5/9 (hỏi qua
-- AskUserQuestion, chọn thêm cả bảy): sáu tên "chưa đủ căn cứ" trước đó, cộng
-- "Vương Quốc Chung" — xác nhận là NGƯỜI KHÁC với "Khương Quốc Chung" (seq 75,
-- Nhóm 6) đã có sẵn, vì Khương Quốc Chung vẫn xuất hiện riêng, đầy đủ ở một
-- dòng khác trong CHÍNH tệp này (không phải lỗi chép tên).
--
-- Nguyên tắc xuyên suốt: thiếu thông tin thì để trống, đừng bịa. Ai không có
-- số điện thoại trong tệp thì để NULL — sẽ vào bo-sung-dien-thoai.csv.
--
-- HAI người có SẴN số hợp lệ trong tệp (Nguyễn Thu Thảo, Nguyễn Tuấn Đạt) —
-- ghi thẳng luôn, họ tự vào được ở /vao ngay mà không cần chờ gì thêm.
--
-- seq nối tiếp ngay sau 139 (Nguyễn Tuấn Hùng, migration 0029).
--
-- CỐ Ý dùng bảy câu INSERT riêng, KHÔNG gộp bằng UNION ALL: D1 thật từ chối
-- câu lệnh có từ 6 nhánh UNION ALL trở lên khi chạy qua tệp migration
-- (SQLITE_ERROR: too many terms in compound SELECT) — bẫy đã ghi trong
-- CLAUDE.md, áp dụng y hệt ở đây với bảy người.

-- Nhóm 1.
INSERT INTO roster (cohort_id, seq, group_label, full_name, dob, title, company, address, phone, source)
SELECT (SELECT id FROM cohorts WHERE code = 'K03'), 140, 'Nhóm 1', 'Vương Quốc Chung', NULL,
       'Giám đốc dự án', NULL, NULL, NULL,
       'DS lớp chữ ký 21/8, bổ sung 5/9 theo yêu cầu Ngô Phú Cường'
 WHERE NOT EXISTS (SELECT 1 FROM roster WHERE full_name = 'Vương Quốc Chung' AND seq = 140);

INSERT INTO roster (cohort_id, seq, group_label, full_name, dob, title, company, address, phone, source)
SELECT (SELECT id FROM cohorts WHERE code = 'K03'), 141, 'Nhóm 1', 'Nguyễn Việt Anh', '1997',
       NULL, 'Hộ kinh doanh Nguyễn Việt Anh', NULL, NULL,
       'DS lớp chữ ký 21/8, bổ sung 5/9 theo yêu cầu Ngô Phú Cường'
 WHERE NOT EXISTS (SELECT 1 FROM roster WHERE full_name = 'Nguyễn Việt Anh' AND seq = 141);

-- Nhóm 2 — đã có số hợp lệ trong tệp, tự vào /vao được ngay.
INSERT INTO roster (cohort_id, seq, group_label, full_name, dob, title, company, address, phone, source)
SELECT (SELECT id FROM cohorts WHERE code = 'K03'), 142, 'Nhóm 2', 'Nguyễn Thu Thảo', '29/10/1995',
       'Quản lý cấp cao', NULL, NULL, '0989588534',
       'DS lớp chữ ký 21/8, bổ sung 5/9 theo yêu cầu Ngô Phú Cường'
 WHERE NOT EXISTS (SELECT 1 FROM roster WHERE full_name = 'Nguyễn Thu Thảo' AND seq = 142);

-- Nhóm 5.
INSERT INTO roster (cohort_id, seq, group_label, full_name, dob, title, company, address, phone, source)
SELECT (SELECT id FROM cohorts WHERE code = 'K03'), 143, 'Nhóm 5', 'Nguyễn Tùng Lâm', NULL,
       NULL, NULL, NULL, NULL,
       'DS lớp chữ ký 21/8, bổ sung 5/9 theo yêu cầu Ngô Phú Cường'
 WHERE NOT EXISTS (SELECT 1 FROM roster WHERE full_name = 'Nguyễn Tùng Lâm' AND seq = 143);

-- Nhóm 7 — đã có số hợp lệ trong tệp, tự vào /vao được ngay.
INSERT INTO roster (cohort_id, seq, group_label, full_name, dob, title, company, address, phone, source)
SELECT (SELECT id FROM cohorts WHERE code = 'K03'), 144, 'Nhóm 7', 'Nguyễn Tuấn Đạt', '2002',
       'Leader', 'Công ty CP Công nghệ Bảo Châu', NULL, '0961547806',
       'DS lớp chữ ký 21/8, bổ sung 5/9 theo yêu cầu Ngô Phú Cường'
 WHERE NOT EXISTS (SELECT 1 FROM roster WHERE full_name = 'Nguyễn Tuấn Đạt' AND seq = 144);

-- Nhóm 9 — số trong tệp thiếu số 0 đầu ("904580955", 9 chữ số), ghi nguyên
-- văn chứ không đoán, giữ nguyên tắc đã dùng cho Lê Trung Đức/Trương Thị
-- Ngọc Anh.
INSERT INTO roster (cohort_id, seq, group_label, full_name, dob, title, company, address, phone, source)
SELECT (SELECT id FROM cohorts WHERE code = 'K03'), 145, 'Nhóm 9', 'Lưu Thị Bích Ngọc', '1985',
       NULL, 'Cồng ty Cổ phần Nhân lực JIS', '164 Nguyễn Đổng Chi, Từ Liêm', '904580955',
       'DS lớp chữ ký 21/8, bổ sung 5/9 theo yêu cầu Ngô Phú Cường'
 WHERE NOT EXISTS (SELECT 1 FROM roster WHERE full_name = 'Lưu Thị Bích Ngọc' AND seq = 145);

-- Nhóm 10 — số trong tệp có ký tự "x" lẫn vào ("03845375x8"), lỗi nhập liệu
-- rõ ràng của Ban tổ chức; ghi nguyên văn, không đoán số thật.
INSERT INTO roster (cohort_id, seq, group_label, full_name, dob, title, company, address, phone, source)
SELECT (SELECT id FROM cohorts WHERE code = 'K03'), 146, 'Nhóm 10', 'Đặng Hùng', '10/04/1984',
       'Chủ tịch', 'Công ty Cổ phần Học viện Yoga VN', '20 - 120 Định Công, Hoàng Mai, Hà Nội', '03845375x8',
       'DS lớp chữ ký 21/8, bổ sung 5/9 theo yêu cầu Ngô Phú Cường'
 WHERE NOT EXISTS (SELECT 1 FROM roster WHERE full_name = 'Đặng Hùng' AND seq = 146);
