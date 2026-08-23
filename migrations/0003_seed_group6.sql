-- k3vaceo — kích hoạt thật Nhóm 6 (14 người), khớp trạng thái k3vaceo-v2.html
-- Không sinh tự động — đây là hiểu biết thật về Nhóm 6 sau buổi họp 15/8, không
-- suy ra được từ file Excel. Chạy sau 0002_seed_roster.sql.

-- ── 1. Members: copy nguyên trạng từ roster, trừ vài ngoại lệ đã biết ──
-- Ngô Phú Cường đã tự xác nhận hồ sơ (chức vụ/đơn vị anh tự biên tập lại,
-- có email). Lê Trung Đức: roster giữ số điện thoại thô '098778525' (thiếu 1
-- số — xem scripts/import-report.md) nhưng KHÔNG copy số sai đó vào hồ sơ
-- thành viên; để trống chờ hỏi lại.
INSERT INTO members (cohort_id, group_id, roster_id, full_name, title, company, phone, email, claimed_at, is_active, created_at, updated_at)
SELECT
  r.cohort_id,
  (SELECT id FROM groups WHERE cohort_id = r.cohort_id AND no = 6),
  r.id,
  r.full_name,
  CASE WHEN r.full_name = 'Ngô Phú Cường' THEN 'Giám đốc' ELSE r.title END,
  CASE WHEN r.full_name = 'Ngô Phú Cường' THEN 'CTCP Hữu Nghị Xuân Cương' ELSE r.company END,
  CASE WHEN r.full_name = 'Lê Trung Đức' THEN NULL ELSE r.phone END,
  CASE WHEN r.full_name = 'Ngô Phú Cường' THEN 'cuong@xuancuong.vn' END,
  CASE WHEN r.full_name = 'Ngô Phú Cường' THEN '2026-08-23 09:00:00' END,
  1, datetime('now'), datetime('now')
FROM roster r
WHERE r.group_label = 'Nhóm 6'
  AND r.cohort_id = (SELECT id FROM cohorts WHERE code = 'K03');

-- ── 2. Nhóm 6 chuyển sang active, người nhận là Cường ──
UPDATE groups
SET status = 'active',
    claimed_by = (SELECT id FROM members WHERE full_name = 'Ngô Phú Cường' AND group_id = groups.id),
    claimed_at = '2026-08-23 09:00:00'
WHERE no = 6 AND cohort_id = (SELECT id FROM cohorts WHERE code = 'K03');

-- ── 3. Hồ sơ mở rộng của Cường (bán gì / bán cho ai / cần gì / giúp được gì) ──
INSERT INTO member_profile (member_id, sells_what, sells_to, needs, offers, updated_at, updated_by)
SELECT m.id,
  'Phần mềm quản trị và tự động hoá vận hành',
  'Doanh nghiệp sản xuất và logistics, 20–300 người',
  'Số liệu thị trường cho phần 1',
  'Dựng công cụ, xử lý dữ liệu, gỡ băng tự động',
  datetime('now'), m.id
FROM members m JOIN groups g ON g.id = m.group_id
WHERE g.no = 6 AND m.full_name = 'Ngô Phú Cường';

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

-- ── 5. Khung bài mặc định — 8 phần theo hướng dẫn giảng viên ──
INSERT INTO plan_templates (name, is_default) VALUES ('Khung 8 phần theo hướng dẫn giảng viên', 1);

INSERT INTO plan_template_sections (template_id, ord, title, requirement) VALUES
  ((SELECT id FROM plan_templates WHERE is_default = 1), 0, 'Sản phẩm và khách hàng mục tiêu',
    'Nêu sản phẩm hoặc dịch vụ của đề tài và các nhóm khách hàng mục tiêu. Bản mẫu của giảng viên dựng quanh một sản phẩm mới, không bắt buộc phải là công ty có sẵn.'),
  ((SELECT id FROM plan_templates WHERE is_default = 1), 1, 'Nghiên cứu Marketing',
    'Quy mô phân khúc mục tiêu, tốc độ tăng trưởng những năm tới, nhu cầu và hành vi khách hàng, phân tích cạnh tranh.'),
  ((SELECT id FROM plan_templates WHERE is_default = 1), 2, 'Kế hoạch Marketing',
    'Vì sao khách hàng chọn mình mà không chọn đối thủ. Kèm chỉ tiêu doanh thu và ngân sách marketing khả thi.'),
  ((SELECT id FROM plan_templates WHERE is_default = 1), 3, 'Kế hoạch Nhân sự',
    'Đủ nhân sự chủ chốt, hoặc phương án xây đội ngũ khả thi trong ngân sách.'),
  ((SELECT id FROM plan_templates WHERE is_default = 1), 4, 'Kế hoạch Sản xuất và Tác nghiệp',
    'Công nghệ, nhà xưởng, thiết bị, chuỗi cung ứng, quản lý chất lượng, logistics.'),
  ((SELECT id FROM plan_templates WHERE is_default = 1), 5, 'Kế hoạch Tài chính',
    'Doanh thu, lợi nhuận, tỷ suất, tổng vốn đầu tư và phương án huy động vốn.'),
  ((SELECT id FROM plan_templates WHERE is_default = 1), 6, 'Lộ trình thực hiện',
    'Chia giai đoạn theo năm, mỗi giai đoạn một mục tiêu đo được.'),
  ((SELECT id FROM plan_templates WHERE is_default = 1), 7, 'Kế hoạch Dự phòng rủi ro',
    'Rủi ro thị trường, chuỗi cung ứng, niềm tin, pháp lý — mỗi rủi ro một giải pháp.');

INSERT INTO plans (group_id, template_id, topic_product, topic_customers, updated_at)
SELECT g.id, (SELECT id FROM plan_templates WHERE is_default = 1), NULL, NULL, datetime('now')
FROM groups g WHERE g.no = 6;

INSERT INTO plan_sections (plan_id, ord, title, requirement, owner_member_id, pct, note, updated_at, updated_by)
SELECT p.id, ts.ord, ts.title, ts.requirement, NULL, 0, NULL, datetime('now'), NULL
FROM plan_template_sections ts
JOIN plan_templates t ON t.id = ts.template_id AND t.is_default = 1
JOIN plans p ON p.group_id = (SELECT id FROM groups WHERE no = 6);

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
