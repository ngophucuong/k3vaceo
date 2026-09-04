-- Lưu Minh Tiến — Ngô Phú Cường xác nhận trực tiếp (3/9) là lớp trưởng của
-- Nhóm 8, kèm tệp "Trưởng, phó nhóm" của Ban tổ chức xác nhận cùng thông tin.
--
-- LỆCH VỚI roster.group_label: bản ghi gốc 15/8 (migration 0002) ghi anh ở
-- Nhóm 5, nhưng cả người dùng lẫn tệp Ban tổ chức đều xác nhận thực tế là
-- Nhóm 8 — cùng dạng lệch đã gặp với Nguyễn Thị Tùng Vân (ghi chú trong
-- routes/onboard.js doiChieu()). roster.group_label GIỮ NGUYÊN làm bản ghi
-- lịch sử; nhóm THẬT đặt trực tiếp vào members.group_id.
--
-- Anh ấy CHƯA từng đăng nhập (claimed_at để trống) — hồ sơ tạo trước, anh ấy
-- tự nhận bằng số điện thoại ở /vao như bình thường, không có gì đặc quyền
-- ở bước đó.
INSERT INTO members (cohort_id, group_id, roster_id, full_name, title, company, phone,
                      is_active, created_at, updated_at)
SELECT r.cohort_id, (SELECT id FROM groups WHERE cohort_id = r.cohort_id AND no = 8),
       r.id, r.full_name, r.title, r.company, r.phone, 1, datetime('now'), datetime('now')
  FROM roster r
 WHERE r.cohort_id = 1 AND r.full_name = 'Lưu Minh Tiến' AND r.seq = 65
   -- Chạy lại không nhân đôi, và không đụng nếu anh ấy đã tự đăng nhập rồi
   -- (auto-onboard tạo hồ sơ ở NHÓM anh ấy tự chọn — không được đè lên).
   AND NOT EXISTS (SELECT 1 FROM members m WHERE m.roster_id = r.id);

-- Vai trưởng nhóm 8. Guard NOT EXISTS theo (group_id, role, superseded_at) —
-- không theo tên: nếu Nhóm 8 ĐÃ có ai đó tự nhận trưởng nhóm qua wizard (một
-- trưởng nhóm khác, có thể trước cả tệp này), migration không được đè lên
-- người thật đã tự vận hành nhóm.
INSERT INTO officers (cohort_id, group_id, role, member_id, effective_from)
SELECT 1, g.id, 'truong_nhom', m.id, date('now')
  FROM groups g
  JOIN members m ON m.group_id = g.id AND m.full_name = 'Lưu Minh Tiến'
 WHERE g.no = 8
   AND NOT EXISTS (
     SELECT 1 FROM officers o
      WHERE o.group_id = g.id AND o.role = 'truong_nhom' AND o.superseded_at IS NULL
   );
