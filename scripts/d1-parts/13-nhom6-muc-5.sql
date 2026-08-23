-- k3vaceo — tệp 13/15: kích hoạt Nhóm 6, mục 5
-- Dán cả tệp vào Console D1 rồi Execute. Chạy lại nhiều lần vẫn đúng.
-- Sinh tự động bởi scripts/build-d1-parts.mjs — đừng sửa tay.

DELETE FROM plan_sections;
DELETE FROM plans;
DELETE FROM plan_template_sections;
DELETE FROM plan_templates;

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
