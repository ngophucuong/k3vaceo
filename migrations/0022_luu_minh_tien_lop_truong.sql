-- Lưu Minh Tiến là LỚP TRƯỞNG (cấp lớp), không chỉ trưởng Nhóm 8 — Ngô Phú
-- Cường xác nhận trực tiếp ngày 4/9. Vai group_id IS NULL, role='lop_truong'
-- — mở khoá cả hai việc cấp lớp cùng lúc: phát link mời xuyên nhóm
-- (isClassCommittee, giống Ngô Phú Cường đang có) VÀ mở đợt thu/ghi sổ chi
-- quỹ lớp (isClassOfficer — lop_truong nằm trong VAI_DIEU_HANH, khác uy_vien
-- của Cường chỉ đọc). Vai truong_nhom của Nhóm 8 (migration 0021) GIỮ NGUYÊN
-- song song — hai bản ghi officers riêng, một group_id=8 một group_id NULL,
-- đúng khuôn "vai cấp lớp chia làm hai mức" đã ghi trong permissions.js.
--
-- Guard theo (group_id IS NULL, role='lop_truong', superseded_at IS NULL) chứ
-- không theo member_id: nếu D1 thật đã có ai giữ vai lớp trưởng cấp lớp rồi
-- (chưa từng xảy ra tính tới lúc viết migration này — chỉ Ngô Phú Cường giữ
-- uy_vien), migration không được đè lên người đó.
INSERT INTO officers (cohort_id, group_id, role, member_id, effective_from)
SELECT 1, NULL, 'lop_truong', m.id, date('now')
  FROM members m
 WHERE m.full_name = 'Lưu Minh Tiến'
   AND NOT EXISTS (
     SELECT 1 FROM officers o
      WHERE o.group_id IS NULL AND o.role = 'lop_truong' AND o.superseded_at IS NULL
   );
