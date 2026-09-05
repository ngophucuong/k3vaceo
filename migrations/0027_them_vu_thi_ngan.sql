-- Vũ Thị Ngân — Nhóm 1, KHÔNG có trong danh sách gốc 135 người (migration
-- 0002 + 0023). Ngô Phú Cường xác nhận ngày 5/9: đây là người khác hẳn với
-- "Vũ Thị Ngân Hà" (seq 84, Nhóm 7) đã có sẵn trong roster — hai cái tên chỉ
-- trùng phần đầu. scripts/data/phan-vai.csv trước đó gán thu_quy lớp cho seq
-- 84 làm tạm, kèm ghi chú còn treo rằng thông báo của lớp lại ghi tên ngắn
-- "Vũ Thị Ngân" ở Nhóm 1 — nay xác nhận đó đúng là một người khác, phải thêm
-- roster mới chứ không sửa lại seq của dòng cũ.
--
-- Chỉ có tên + số điện thoại (0975587586) — dob/chức vụ/công ty/địa chỉ để
-- trống, đúng nguyên tắc "thiếu thì để trống, đừng bịa" đã áp dụng cho Trương
-- Thị Ngọc Anh (migration 0023). seq=136, nối tiếp ngay sau người thứ 135.
--
-- CHỈ thêm roster ở đây — KHÔNG tạo members/officers. Bước gán thu_quy (và
-- supersede bản gán sai cho seq 84) để cho scripts/data/phan-vai.csv +
-- workflow phan-vai.yml làm, sau khi migration này đã áp xong và roster.seq
-- = 136 đã có thật — tránh việc hai workflow (deploy.yml áp migration, và
-- phan-vai.yml đọc CSV) chạy song song mà phan-vai.yml đọc phải roster chưa
-- kịp có dòng mới.
INSERT INTO roster (cohort_id, seq, group_label, full_name, dob, title, company, address, phone, source)
SELECT (SELECT id FROM cohorts WHERE code = 'K03'), 136, 'Nhóm 1', 'Vũ Thị Ngân', NULL,
       NULL, NULL, NULL, '0975587586',
       'Ngô Phú Cường, bổ sung 5/9'
 WHERE NOT EXISTS (SELECT 1 FROM roster WHERE full_name = 'Vũ Thị Ngân' AND seq = 136);
