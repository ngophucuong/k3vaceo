-- k3vaceo — tệp 1/15: dọn phần nạp dở (chạy đầu tiên)
-- Dán cả tệp vào Console D1 rồi Execute. Chạy lại nhiều lần vẫn đúng.
-- Sinh tự động bởi scripts/build-d1-parts.mjs — đừng sửa tay.

DELETE FROM activity;
DELETE FROM links;
DELETE FROM insights;
DELETE FROM plan_sections;
DELETE FROM plans;
DELETE FROM plan_template_sections;
DELETE FROM plan_templates;
DELETE FROM officers;
DELETE FROM member_profile;
DELETE FROM members;
DELETE FROM roster;
UPDATE groups SET status = 'unclaimed', claimed_by = NULL, claimed_at = NULL
 WHERE cohort_id = (SELECT id FROM cohorts WHERE code = 'K03');
