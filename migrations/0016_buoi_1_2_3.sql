-- Ba buổi đã học trước khi có ứng dụng: 15/8 (khai giảng), 21/8 và 22/8.
-- NGÀY do Ngô Phú Cường cung cấp ngày 28/8.
--
-- Vì sao cần migration này: mười một tư liệu nạp ở migration 0013 mang chữ
-- "Buổi 1", "Buổi 2", "Buổi 3" trong TIÊU ĐỀ, nhưng cột links.buoi_id thì
-- trống — chúng ra đời TRƯỚC migration 0014 (cột buoi_id). Hệ quả đo được ở
-- tab Tư liệu: cả 11 mục cùng created_at của một lần migration nên xếp theo
-- thứ tự chèn, và thư mục của buổi 1 nằm cách năm tệp bên trong nó tám dòng.
-- Không gắn được vì lich_hoc chưa có dòng nào cho ba buổi ấy.
--
-- CHỦ ĐỀ đọc từ TÊN THƯ MỤC Drive của Ban tổ chức, không phải từ một thông báo
-- lịch. Nếu Ban tổ chức có tên chính thức khác thì sửa lại ở tab Hôm nay —
-- người thuộc Ban cán sự lớp bấm ✎ là đổi được, không cần migration.
--
-- Giờ học để TRỐNG: không có nguồn nào ghi, mà bịa giờ ra thì tệp .ics đổ vào
-- lịch điện thoại của 134 người một khung giờ sai (cùng quy ước migration 0011).

INSERT INTO lich_hoc (cohort_id, ngay, tu_gio, den_gio, chu_de, giang_vien, ghi_chu)
SELECT c.id, '2026-08-15', NULL, NULL,
       'Cách làm kế hoạch kinh doanh & Leadership', NULL, 'Khai giảng'
  FROM cohorts c WHERE c.code = 'K03'
   -- Chạy lại không nhân đôi. Migration chỉ chạy một lần, nhưng câu này cũng
   -- có thể bị dán tay vào Console D1 — và ở đó không có gì chặn.
   AND NOT EXISTS (SELECT 1 FROM lich_hoc b WHERE b.cohort_id = c.id AND b.ngay = '2026-08-15');

INSERT INTO lich_hoc (cohort_id, ngay, tu_gio, den_gio, chu_de, giang_vien, ghi_chu)
SELECT c.id, '2026-08-21', NULL, NULL, 'Founder khởi nghiệp', NULL, NULL
  FROM cohorts c WHERE c.code = 'K03'
   AND NOT EXISTS (SELECT 1 FROM lich_hoc b WHERE b.cohort_id = c.id AND b.ngay = '2026-08-21');

-- "Thái Hoà" đọc từ tên thư mục ("Digital, chuyển đổi số (Thái Hoà)") và từ
-- tiêu đề một tệp bên trong ("Thái Hoà — chuyển đổi số & Customer Delight").
-- Đặt vào ô giảng viên vì khuôn ấy là tên người, nhưng ĐÂY LÀ SUY RA chứ không
-- phải nguồn chính thức — sửa được bằng nút ✎ nếu sai.
INSERT INTO lich_hoc (cohort_id, ngay, tu_gio, den_gio, chu_de, giang_vien, ghi_chu)
SELECT c.id, '2026-08-22', NULL, NULL, 'Digital, chuyển đổi số', 'Thái Hoà', NULL
  FROM cohorts c WHERE c.code = 'K03'
   AND NOT EXISTS (SELECT 1 FROM lich_hoc b WHERE b.cohort_id = c.id AND b.ngay = '2026-08-22');

-- ── Gắn tư liệu vào đúng buổi ────────────────────────────────────────────
-- Gắn theo TIỀN TỐ "Buổi N ·" — đó là quy ước đặt tên của chính Ban tổ chức
-- trong thư mục Drive, nên nó là dữ liệu chứ không phải phỏng đoán.
--
-- Chỉ đụng dòng có buoi_id ĐANG TRỐNG: ai đã gắn tay vào buổi khác thì giữ
-- nguyên ý của họ.
--
-- KHÔNG đụng hai mục tag='lop' ("Danh sách học viên K03", "Lịch học K03"):
-- chúng là giấy tờ của cả khoá, không thuộc buổi nào. Gắn bừa vào buổi 1 thì
-- chúng biến mất khỏi tầm mắt ngay khi buổi 1 trôi qua.
UPDATE links
   SET buoi_id = (SELECT b.id FROM lich_hoc b JOIN cohorts c ON c.id = b.cohort_id
                   WHERE c.code = 'K03' AND b.ngay = '2026-08-15' LIMIT 1)
 WHERE scope = 'class' AND removed_at IS NULL AND buoi_id IS NULL
   -- Mục thứ hai không mang tiền tố nhưng nói rõ buổi 1 trong tên, và tag của
   -- nó vốn đã là 'buoi'. Bỏ lại là dựng lại đúng cảnh lộn xộn vừa sửa.
   AND (title LIKE 'Buổi 1 ·%' OR title = 'Tóm tắt buổi 1 — bản gỡ băng và ý chính');

UPDATE links
   SET buoi_id = (SELECT b.id FROM lich_hoc b JOIN cohorts c ON c.id = b.cohort_id
                   WHERE c.code = 'K03' AND b.ngay = '2026-08-21' LIMIT 1)
 WHERE scope = 'class' AND removed_at IS NULL AND buoi_id IS NULL
   AND title LIKE 'Buổi 2 ·%';

UPDATE links
   SET buoi_id = (SELECT b.id FROM lich_hoc b JOIN cohorts c ON c.id = b.cohort_id
                   WHERE c.code = 'K03' AND b.ngay = '2026-08-22' LIMIT 1)
 WHERE scope = 'class' AND removed_at IS NULL AND buoi_id IS NULL
   AND title LIKE 'Buổi 3 ·%';
