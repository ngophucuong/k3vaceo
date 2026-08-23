-- k3vaceo — tệp 11/15: kích hoạt Nhóm 6, mục 1, 2, 3
-- Dán cả tệp vào Console D1 rồi Execute. Chạy lại nhiều lần vẫn đúng.
-- Sinh tự động bởi scripts/build-d1-parts.mjs — đừng sửa tay.

DELETE FROM members;
DELETE FROM member_profile;

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
