-- k3vaceo — tệp 12/15: kích hoạt Nhóm 6, mục 4
-- Dán cả tệp vào Console D1 rồi Execute. Chạy lại nhiều lần vẫn đúng.
-- Sinh tự động bởi scripts/build-d1-parts.mjs — đừng sửa tay.

DELETE FROM officers;

-- ── 4. Cơ cấu — giữ cả bản dự kiến lẫn bản thật, đúng cơ chế "lịch sử" ──
-- Dự kiến của Ban tổ chức (sheet "Trưởng, phó nhóm"), bị thay ngay trong buổi họp 15/8.
INSERT INTO officers (cohort_id, group_id, role, member_id, note, effective_from, recorded_by, created_at, superseded_at)
SELECT (SELECT id FROM cohorts WHERE code = 'K03'), g.id, 'truong_nhom',
  (SELECT id FROM members WHERE group_id = g.id AND full_name = 'Nguyễn Thị Thu Hương'),
  'danh sách dự kiến Ban tổ chức 15/8', '2026-08-15', NULL,
  '2026-08-15 08:00:00', '2026-08-15 18:00:00'
FROM groups g WHERE g.no = 6;

INSERT INTO officers (cohort_id, group_id, role, member_id, note, effective_from, recorded_by, created_at, superseded_at)
SELECT (SELECT id FROM cohorts WHERE code = 'K03'), g.id, 'pho_nhom',
  (SELECT id FROM members WHERE group_id = g.id AND full_name = 'Phan Thị Thanh Nga'),
  'danh sách dự kiến Ban tổ chức 15/8', '2026-08-15', NULL,
  '2026-08-15 08:00:00', '2026-08-15 18:00:00'
FROM groups g WHERE g.no = 6;

-- Bản đang hiệu lực, sau buổi họp nhóm cùng ngày.
INSERT INTO officers (cohort_id, group_id, role, member_id, note, effective_from, recorded_by, created_at, superseded_at)
SELECT (SELECT id FROM cohorts WHERE code = 'K03'), g.id, 'truong_nhom',
  (SELECT id FROM members WHERE group_id = g.id AND full_name = 'Ngô Phú Cường'),
  'cập nhật sau buổi họp nhóm 15/8', '2026-08-15',
  (SELECT id FROM members WHERE group_id = g.id AND full_name = 'Ngô Phú Cường'),
  '2026-08-15 18:00:00', NULL
FROM groups g WHERE g.no = 6;

INSERT INTO officers (cohort_id, group_id, role, member_id, note, effective_from, recorded_by, created_at, superseded_at)
SELECT (SELECT id FROM cohorts WHERE code = 'K03'), g.id, 'pho_nhom',
  NULL, 'chưa xác nhận', '2026-08-15',
  (SELECT id FROM members WHERE group_id = g.id AND full_name = 'Ngô Phú Cường'),
  '2026-08-15 18:00:00', NULL
FROM groups g WHERE g.no = 6;
