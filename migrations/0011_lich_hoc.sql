-- Đợt 6c: lịch học của lớp.
--
-- Tab "Hôm nay" từ trước tới nay chỉ có việc của bạn, cơ cấu nhóm và nhật ký —
-- không có chỗ nào trả lời câu hỏi đơn giản nhất: "tuần này học gì, ai dạy".
-- Ban tổ chức gửi lịch qua Zalo mỗi tuần, và tin nhắn ấy trôi mất sau hai ngày.
-- Đúng cái nguyên tắc N1 muốn tránh: Zalo để bàn, ứng dụng để chốt.
--
-- KHÔNG phải điểm danh (mục 1.4 SRS xếp điểm danh ngoài phạm vi v1). Đây chỉ
-- là bảng lịch đọc, ai cũng xem được, Ban cán sự lớp cập nhật.

CREATE TABLE lich_hoc (
  id          INTEGER PRIMARY KEY,
  cohort_id   INTEGER NOT NULL REFERENCES cohorts(id),
  ngay        TEXT    NOT NULL,          -- YYYY-MM-DD
  tu_gio      TEXT,                      -- '13:30', để trống nếu chưa rõ
  den_gio     TEXT,
  chu_de      TEXT    NOT NULL,
  giang_vien  TEXT,
  ghi_chu     TEXT,
  huy_luc     TEXT,                      -- khác NULL = đã huỷ/dời, vẫn giữ để lần lại
  created_by  INTEGER REFERENCES members(id),
  created_at  TEXT DEFAULT (datetime('now')),
  updated_at  TEXT
);
CREATE INDEX ix_lich_ngay ON lich_hoc(cohort_id, ngay);

-- Thông báo chung của lớp — thứ không gắn vào một buổi cụ thể, ví dụ "chương
-- trình kiến tập dời sang 11/9". Để riêng vì nó không có giờ giấc, và vì dán
-- nó vào ghi_chu của một buổi nào đó thì sai chỗ.
CREATE TABLE thong_bao (
  id          INTEGER PRIMARY KEY,
  cohort_id   INTEGER NOT NULL REFERENCES cohorts(id),
  noi_dung    TEXT    NOT NULL,
  nguon       TEXT,                      -- ai phát: 'Ban tổ chức', 'Ban cán sự lớp'...
  het_han     TEXT,                      -- YYYY-MM-DD, quá ngày thì thôi hiện
  created_by  INTEGER REFERENCES members(id),
  created_at  TEXT DEFAULT (datetime('now'))
);
CREATE INDEX ix_thongbao ON thong_bao(cohort_id, het_han);

-- ══ Lịch tuần 3, theo thông báo Ban tổ chức gửi ngày 24/8/2026 ══
-- Thông báo chỉ ghi buổi sáng/buổi chiều với hai mốc giờ cụ thể, nên chỗ nào
-- không có giờ thì để trống và ghi rõ buổi ở ghi_chu, đừng bịa giờ ra.
INSERT INTO lich_hoc (cohort_id, ngay, tu_gio, den_gio, chu_de, giang_vien, ghi_chu) VALUES
  ((SELECT id FROM cohorts WHERE code = 'K03'), '2026-08-27', NULL, NULL,
   'Chính sách thuế và quản trị rủi ro thuế',
   'TS. Nguyễn Văn Phụng — nguyên Cục trưởng Cục quản lý thuế doanh nghiệp lớn', NULL),
  ((SELECT id FROM cohorts WHERE code = 'K03'), '2026-08-28', NULL, NULL,
   'Quản trị chiến lược kinh doanh',
   'TS. Nguyễn Việt Anh — Giám đốc Đại học Andrews tại Việt Nam', 'Buổi sáng'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), '2026-08-28', '13:30', '14:30',
   'Quản trị chiến lược kinh doanh (tiếp chủ đề buổi sáng)',
   'TS. Nguyễn Việt Anh — Giám đốc Đại học Andrews tại Việt Nam', NULL),
  ((SELECT id FROM cohorts WHERE code = 'K03'), '2026-08-28', '14:30', '16:00',
   'Hướng dẫn lập Kế hoạch kinh doanh',
   'TS. Trần Đoàn Kim — Giám đốc Trung tâm Phát triển Tiềm năng Việt, VCCI', NULL),
  -- Kiến tập đã dời, ghi thẳng vào lịch để không ai còn nhớ nhầm ngày cũ.
  ((SELECT id FROM cohorts WHERE code = 'K03'), '2026-09-11', '13:30', NULL,
   'Tham quan kiến tập', NULL, 'Dời từ lịch cũ sang');

INSERT INTO thong_bao (cohort_id, noi_dung, nguon, het_han) VALUES
  ((SELECT id FROM cohorts WHERE code = 'K03'),
   'Chương trình tham quan kiến tập chuyển sang chiều thứ Sáu 11/9/2026 để công tác chuẩn bị được tốt hơn.',
   'Ban tổ chức', '2026-09-12');
