-- k3vaceo — tệp 15/15: kích hoạt Nhóm 6, mục 8
-- Dán cả tệp vào Console D1 rồi Execute. Chạy lại nhiều lần vẫn đúng.
-- Sinh tự động bởi scripts/build-d1-parts.mjs — đừng sửa tay.

DELETE FROM activity;

-- ── 8. Nhật ký hoạt động — 3 dòng đầu tiên của Nhóm 6 ──
INSERT INTO activity (cohort_id, group_id, actor_member_id, verb, object_type, object_id, summary, created_at)
SELECT (SELECT id FROM cohorts WHERE code = 'K03'), g.id,
  (SELECT id FROM members WHERE group_id = g.id AND full_name = 'Ngô Phú Cường'),
  'plan.init', 'plan', (SELECT id FROM plans WHERE group_id = g.id),
  'tạo khung tám phần theo hướng dẫn của giảng viên', '2026-08-23 08:30:00'
FROM groups g WHERE g.no = 6;

INSERT INTO activity (cohort_id, group_id, actor_member_id, verb, object_type, object_id, summary, created_at)
SELECT (SELECT id FROM cohorts WHERE code = 'K03'), g.id,
  (SELECT id FROM members WHERE group_id = g.id AND full_name = 'Ngô Phú Cường'),
  'members.import', 'group', g.id,
  'nhập hồ sơ 14 thành viên từ danh sách lớp', '2026-08-23 08:45:00'
FROM groups g WHERE g.no = 6;

INSERT INTO activity (cohort_id, group_id, actor_member_id, verb, object_type, object_id, summary, created_at)
SELECT (SELECT id FROM cohorts WHERE code = 'K03'), g.id,
  (SELECT id FROM members WHERE group_id = g.id AND full_name = 'Bùi Thị Huyền Trang'),
  'links.add', 'link',
  (SELECT id FROM links WHERE title = 'Tóm tắt buổi 1 — bản gỡ băng và ý chính'),
  'gắn bản tóm tắt buổi 1 vào Kho', '2026-08-22 16:00:00'
FROM groups g WHERE g.no = 6;
