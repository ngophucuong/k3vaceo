-- ══ Tư liệu lớp từ thư mục Drive "CEO_VCCI" của Ban tổ chức ══
--
-- Ngô Phú Cường gửi ảnh chụp thư mục ngày 25/8. Địa chỉ ba thư mục con đọc
-- được từ thanh URL trong ảnh nên điền thẳng vào đây; tên tám tệp bên trong
-- đọc được nhưng KHÔNG có đường dẫn riêng, nên `url` để trống chờ dán sau.
--
-- Migration này chỉ có nghĩa vì Đợt này vừa thêm PATCH /api/links/:id. Trước
-- đó, một mục tạo ra với url trống là trống VĨNH VIỄN — đúng số phận bốn mục
-- seed ở 0003, nằm trống từ Đợt 1 tới giờ vì không có đường nào điền vào.
--
-- KHÔNG dùng UNION ALL: D1 từ chối câu lệnh từ 6 nhánh trở lên khi chạy qua
-- tệp ("too many terms in compound SELECT"), và bản cục bộ cũng từ chối y hệt.
-- Danh sách VALUES với truy vấn con vô hạn nhánh — đúng lối migration 0003.

-- ── 1. Vai cấp lớp cho Ngô Phú Cường ──
-- Không có dòng này thì không ai đăng hay sửa được Tư liệu CẤP LỚP:
-- postLink/patchLink đều chặn sau isClassCommittee, mà bảng officers chưa có
-- một dòng cấp lớp nào (group_id IS NULL). Việc treo đã ghi ở mục 11 điểm #6.
--
-- Chọn 'uy_vien' — vai THẤP NHẤT trong bốn vai Ban cán sự lớp, và đúng vai
-- Ngô Phú Cường đang giữ ngoài đời. Nó mở tư liệu và thông báo cấp lớp, nhưng
-- KHÔNG mở quỹ lớp: tạo đợt thu cấp lớp đi qua isClassOfficer, chỉ nhận
-- lop_truong / lop_pho / thu_quy.
INSERT INTO officers (cohort_id, group_id, role, member_id, note, effective_from, created_at)
SELECT c.id, NULL, 'uy_vien', m.id,
       'uỷ viên Ban cán sự lớp — để đăng và sửa được tư liệu chung của lớp',
       date('now'), datetime('now')
  FROM cohorts c
  JOIN members m ON m.cohort_id = c.id AND m.full_name = 'Ngô Phú Cường' AND m.is_active = 1
 WHERE c.code = 'K03'
   AND NOT EXISTS (SELECT 1 FROM officers o
                    WHERE o.group_id IS NULL AND o.member_id = m.id
                      AND o.role = 'uy_vien' AND o.superseded_at IS NULL);

-- ── 2. Ba thư mục theo buổi — CÓ đường dẫn thật, dùng được ngay ──
-- ── 3. Tám tệp bên trong — tên đọc từ ảnh, đường dẫn để TRỐNG ──
-- Mở tab Tư liệu, bấm ✎ trên từng dòng là dán được đường dẫn vào.
INSERT INTO links (cohort_id, scope, group_id, section_id, url, title, kind, tag, created_by, created_at)
VALUES
  ((SELECT id FROM cohorts WHERE code='K03'), 'class', NULL, NULL,
   'https://drive.google.com/drive/folders/1ceEeQCOCQvfhmqPHD2eU2XEfUWD5qcuQ',
   'Buổi 1 · Cách làm kế hoạch kinh doanh & Leadership — cả thư mục', 'DRIVE', 'buoi',
   (SELECT id FROM members WHERE full_name='Ngô Phú Cường' AND is_active=1 LIMIT 1), datetime('now')),
  ((SELECT id FROM cohorts WHERE code='K03'), 'class', NULL, NULL,
   'https://drive.google.com/drive/folders/1kn1H2dLLhYNa1731c-cyeefSNwjF5XDD',
   'Buổi 2 · Founder khởi nghiệp — cả thư mục', 'DRIVE', 'buoi',
   (SELECT id FROM members WHERE full_name='Ngô Phú Cường' AND is_active=1 LIMIT 1), datetime('now')),
  ((SELECT id FROM cohorts WHERE code='K03'), 'class', NULL, NULL,
   'https://drive.google.com/drive/folders/1ymKw3lKv_-cgt_lC2KPA_gmzcDNxLqEv',
   'Buổi 3 · Digital, chuyển đổi số (Thái Hoà) — cả thư mục', 'DRIVE', 'buoi',
   (SELECT id FROM members WHERE full_name='Ngô Phú Cường' AND is_active=1 LIMIT 1), datetime('now')),

  ((SELECT id FROM cohorts WHERE code='K03'), 'class', NULL, NULL, NULL,
   'Buổi 1 · Leadership — tóm tắt bài giảng', 'DRIVE', 'buoi',
   (SELECT id FROM members WHERE full_name='Ngô Phú Cường' AND is_active=1 LIMIT 1), datetime('now')),
  ((SELECT id FROM cohorts WHERE code='K03'), 'class', NULL, NULL, NULL,
   'Buổi 1 · Tóm tắt bài giảng Quản trị doanh nghiệp', 'DOCX', 'buoi',
   (SELECT id FROM members WHERE full_name='Ngô Phú Cường' AND is_active=1 LIMIT 1), datetime('now')),
  ((SELECT id FROM cohorts WHERE code='K03'), 'class', NULL, NULL, NULL,
   'Buổi 1 · Hướng dẫn lập kế hoạch kinh doanh', 'DOCX', 'buoi',
   (SELECT id FROM members WHERE full_name='Ngô Phú Cường' AND is_active=1 LIMIT 1), datetime('now')),
  ((SELECT id FROM cohorts WHERE code='K03'), 'class', NULL, NULL, NULL,
   'Buổi 1 · Hướng dẫn xây dựng và bảo vệ kế hoạch kinh doanh cuối khoá', 'DRIVE', 'buoi',
   (SELECT id FROM members WHERE full_name='Ngô Phú Cường' AND is_active=1 LIMIT 1), datetime('now')),
  ((SELECT id FROM cohorts WHERE code='K03'), 'class', NULL, NULL, NULL,
   'Buổi 1 · Phễu doanh nghiệp 5h — thuật quản trị, dụng nhân (2/4/2025)', 'PDF', 'buoi',
   (SELECT id FROM members WHERE full_name='Ngô Phú Cường' AND is_active=1 LIMIT 1), datetime('now')),
  ((SELECT id FROM cohorts WHERE code='K03'), 'class', NULL, NULL, NULL,
   'Buổi 2 · 2026 THE FOUNDER', 'PDF', 'buoi',
   (SELECT id FROM members WHERE full_name='Ngô Phú Cường' AND is_active=1 LIMIT 1), datetime('now')),
  -- Tên tệp này bị cắt trong ảnh ("Tai_lieu_Hoc_tap_Doi_moi_sang_tao_Chuyen…"),
  -- phần đuôi là suy đoán — sửa lại bằng nút ✎ nếu sai.
  ((SELECT id FROM cohorts WHERE code='K03'), 'class', NULL, NULL, NULL,
   'Buổi 3 · Tài liệu học tập — đổi mới sáng tạo, chuyển đổi số', 'DRIVE', 'buoi',
   (SELECT id FROM members WHERE full_name='Ngô Phú Cường' AND is_active=1 LIMIT 1), datetime('now')),
  ((SELECT id FROM cohorts WHERE code='K03'), 'class', NULL, NULL, NULL,
   'Buổi 3 · Thái Hoà — chuyển đổi số & Customer Delight', 'PDF', 'buoi',
   (SELECT id FROM members WHERE full_name='Ngô Phú Cường' AND is_active=1 LIMIT 1), datetime('now'));
