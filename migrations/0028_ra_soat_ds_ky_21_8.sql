-- Ngô Phú Cường đưa tệp "Final_Danh_sách_ký_K03_15.08" (sheet "DS lớp", chữ ký
-- buổi 21/8, và sheet "Trưởng, phó nhóm", 15/8) sau khi hỏi "sao thiếu Vũ Thị
-- Ngân". Rà lại toàn bộ 143 dòng của DS lớp so với roster (136 người sau
-- migration 0027) lộ ra thêm ba việc, mỗi việc một mức chắc chắn khác nhau —
-- ghi rõ ở đây để không ai phải rà lại từ đầu.
--
-- 1. HAI NGƯỜI CÒN THIẾU, cùng kiểu bỏ sót như Vũ Thị Ngân — Ngô Phú Cường xác
--    nhận thêm cả hai ngày 5/9:
--    - Nguyễn Thị Hoa (Nhóm 1) — khớp TUYỆT ĐỐI ở CẢ HAI sheet của tệp (DOB,
--      công ty, số điện thoại giống hệt nhau giữa "DS lớp" và "Trưởng, phó
--      nhóm"), y hệt bằng chứng đã dùng cho Vũ Thị Ngân.
--    - Võ Thị Trang (Nhóm 6) — mười bốn người còn lại của Nhóm 6 trong DS lớp
--      khớp ĐÚNG THỨ TỰ với 14 người đã có trong roster (seq 66-74,76-79 +
--      Nguyễn Thị Tùng Vân); chỉ riêng người thứ 15 này là hoàn toàn vắng mặt.
--    seq nối tiếp ngay sau 136 (Vũ Thị Ngân, migration 0027) — không dùng lại
--    STT của tệp Excel vì đó là số của MỘT TỆP KHÁC, không phải khoá của ta.
--
-- 2. BỔ SUNG DỮ LIỆU cho Vũ Thị Ngân (migration 0027 để trống dob/title/
--    company/address vì lúc đó CHƯA có tệp này) — nay điền đủ từ đúng tệp gốc.
--    Guard bằng "dob IS NULL": chỉ đụng nếu còn đúng trạng thái để trống ban
--    đầu, không đè lên bất kỳ sửa tay nào có thể đã xảy ra sau đó.
--
-- 3. TÊN BỊ CỤT, không phải người thiếu — Đậu Huy Đại (seq 95, Nhóm 8): DS lớp
--    ghi đầy đủ là "Đậu Huy Đại Việt", khớp TUYỆT ĐỐI dob (09/10/2007), chức
--    vụ (Marketing), công ty ("(Tự do)"), số điện thoại (0386696998) với dòng
--    đã có trong roster — chắc chắn cùng một người, migration 0002 chỉ chép
--    thiếu chữ "Việt". Sửa cả `members.full_name` NẾU anh ấy đã tự nhận hồ sơ
--    trước khi tệp này được phát hiện, để không còn nơi nào hiển thị tên cụt.
--
-- CHƯA XỬ LÝ, cần thêm bằng chứng hoặc xác nhận riêng — không đưa vào migration
-- này: "Vương Quốc Chung" (DS lớp, Nhóm 1) rất giống "Khương Quốc Chung" (seq
-- 75) nhưng Khương Quốc Chung lại xuất hiện ĐẦY ĐỦ, riêng biệt ở Nhóm 5 trong
-- cùng tệp — nhiều khả năng là hai người khác nhau, không phải lỗi chép; và
-- bảy tên khác trong DS lớp không khớp ai, không có số điện thoại nào đối
-- chứng được, chưa đủ căn cứ để thêm hay bỏ qua.

-- 1a. Nguyễn Thị Hoa — Nhóm 1.
INSERT INTO roster (cohort_id, seq, group_label, full_name, dob, title, company, address, phone, source)
SELECT (SELECT id FROM cohorts WHERE code = 'K03'), 137, 'Nhóm 1', 'Nguyễn Thị Hoa', '12/09/1990',
       NULL, 'Công ty TNHH In Vạn Hải', NULL, '0968477073',
       'Ban tổ chức, DS lớp chữ ký 21/8, bổ sung 5/9'
 WHERE NOT EXISTS (SELECT 1 FROM roster WHERE full_name = 'Nguyễn Thị Hoa' AND seq = 137);

-- 1b. Võ Thị Trang — Nhóm 6 (đúng nhóm của Ngô Phú Cường).
INSERT INTO roster (cohort_id, seq, group_label, full_name, dob, title, company, address, phone, source)
SELECT (SELECT id FROM cohorts WHERE code = 'K03'), 138, 'Nhóm 6', 'Võ Thị Trang', NULL,
       'CEO', 'Học viện Yoga Việt Nam', NULL, '0376433498',
       'Ban tổ chức, DS lớp chữ ký 21/8, bổ sung 5/9'
 WHERE NOT EXISTS (SELECT 1 FROM roster WHERE full_name = 'Võ Thị Trang' AND seq = 138);

-- 2. Điền đủ dữ liệu Vũ Thị Ngân, nay đã có từ đúng tệp gốc.
UPDATE roster SET
  dob = '10/07/1991',
  title = 'Tổng Giám đốc',
  company = 'CÔNG TY TNHH TƯ VẤN VÀ DỊCH VỤ KẾ TOÁN VNCONNECT',
  address = 'Số 2a, ngõ 84 Chùa Láng, Phường Láng, TP Hà Nội, Việt Nam'
 WHERE full_name = 'Vũ Thị Ngân' AND seq = 136 AND dob IS NULL;

-- 3a. Sửa tên bị cụt trong roster.
UPDATE roster SET full_name = 'Đậu Huy Đại Việt'
 WHERE full_name = 'Đậu Huy Đại' AND seq = 95;

-- 3b. Nếu đã lỡ tự nhận hồ sơ bằng tên cụt trước khi phát hiện, sửa luôn cho
--     khớp — members.full_name là bản SAO chép lúc nhận, không tự đổi theo
--     roster.
UPDATE members SET full_name = 'Đậu Huy Đại Việt'
 WHERE full_name = 'Đậu Huy Đại'
   AND roster_id = (SELECT id FROM roster WHERE full_name = 'Đậu Huy Đại Việt' AND seq = 95);
