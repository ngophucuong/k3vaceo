-- k3vaceo — tệp 14/15: kích hoạt Nhóm 6, mục 6, 7
-- Dán cả tệp vào Console D1 rồi Execute. Chạy lại nhiều lần vẫn đúng.
-- Sinh tự động bởi scripts/build-d1-parts.mjs — đừng sửa tay.

DELETE FROM insights;
DELETE FROM links;

-- ── 6. Hai câu tâm đắc đã ghi, gắn vào phần 2 (Kế hoạch Marketing) ──
INSERT INTO insights (group_id, section_id, body, speaker, heard_on, is_proxy, created_by, created_at)
SELECT g.id,
  (SELECT ps.id FROM plan_sections ps JOIN plans pl ON pl.id = ps.plan_id WHERE pl.group_id = g.id AND ps.ord = 2),
  'Doanh nghiệp không chết vì thiếu cơ hội. Chết vì đuổi theo quá nhiều cơ hội cùng lúc.',
  'Giảng viên buổi 3', '2026-08-21', 1,
  (SELECT id FROM members WHERE group_id = g.id AND full_name = 'Ngô Phú Cường'),
  '2026-08-21 20:00:00'
FROM groups g WHERE g.no = 6;

INSERT INTO insights (group_id, section_id, body, speaker, heard_on, is_proxy, created_by, created_at)
SELECT g.id,
  (SELECT ps.id FROM plan_sections ps JOIN plans pl ON pl.id = ps.plan_id WHERE pl.group_id = g.id AND ps.ord = 2),
  'Khách hàng tốt nhất của tôi là khách cũ quay lại. Vậy mà cả năm ngân sách đổ hết vào tìm khách mới.',
  'Phạm Thế Nam', '2026-08-22', 1,
  (SELECT id FROM members WHERE group_id = g.id AND full_name = 'Ngô Phú Cường'),
  '2026-08-22 20:00:00'
FROM groups g WHERE g.no = 6;

-- ── 7. Kho — 4 tài nguyên đã biết tên/loại, CHƯA có url thật (xem ghi chú README) ──
INSERT INTO links (cohort_id, scope, group_id, section_id, url, title, kind, tag, created_by, created_at)
VALUES
  ((SELECT id FROM cohorts WHERE code = 'K03'), 'class', NULL, NULL, NULL,
    'Hướng dẫn lập kế hoạch kinh doanh — bản của giảng viên', 'DOCX', 'bai', NULL, '2026-08-22 10:00:00'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 'class', NULL, NULL, NULL,
    'Tóm tắt buổi 1 — bản gỡ băng và ý chính', 'DRIVE', 'buoi',
    (SELECT m.id FROM members m JOIN groups g ON g.id = m.group_id WHERE g.no = 6 AND m.full_name = 'Bùi Thị Huyền Trang'),
    '2026-08-20 15:00:00'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 'class', NULL, NULL, NULL,
    'Danh sách học viên K03 · 134 người, 10 nhóm', 'XLSX', 'lop', NULL, '2026-08-15 09:00:00'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 'class', NULL, NULL, NULL,
    'Lịch học K03 — 13 buổi đến 26/9', 'PDF', 'lop', NULL, '2026-08-15 09:00:00');
