-- Buổi 6 (4/9/2026) và buổi 7 (5/9/2026) — Ngô Phú Cường dán lại từ thông báo
-- Ban tổ chức gửi trong nhóm Zalo, 28/8/2026.
--
-- Buổi 7 gộp HAI chủ đề vào một chu_de bằng dấu chấm phẩy: thông báo gốc không
-- kèm mốc giờ để tách thành hai dòng riêng như đã làm với 28/8 (nơi có "Buổi
-- sáng" / "13:30–14:30" / "14:30–16:00" rõ ràng). Bịa giờ ra để tách dòng thì
-- tệp .ics đổ vào lịch điện thoại của 134 người một khung giờ sai — cùng quy
-- ước đã ghi ở migration 0011 và 0016.

INSERT INTO lich_hoc (cohort_id, ngay, tu_gio, den_gio, chu_de, giang_vien, ghi_chu)
SELECT c.id, '2026-09-04', NULL, NULL,
       'Quản trị tinh gọn (LEAN) trong kỷ nguyên Số',
       'ThS. Huỳnh Minh Quốc — CEO Công ty ISC', NULL
  FROM cohorts c WHERE c.code = 'K03'
   -- Chạy lại không nhân đôi. Migration chỉ chạy một lần, nhưng câu này cũng
   -- có thể bị dán tay vào Console D1 — và ở đó không có gì chặn.
   AND NOT EXISTS (SELECT 1 FROM lich_hoc b WHERE b.cohort_id = c.id AND b.ngay = '2026-09-04');

INSERT INTO lich_hoc (cohort_id, ngay, tu_gio, den_gio, chu_de, giang_vien, ghi_chu)
SELECT c.id, '2026-09-05', NULL, NULL,
       'Quản trị Marketing trong Kỷ nguyên Số; Doanh nghiệp 1 thành viên (tự động hoá bằng AI)',
       'ThS. Tuấn Hà — Chủ tịch Vinalink Academy', NULL
  FROM cohorts c WHERE c.code = 'K03'
   AND NOT EXISTS (SELECT 1 FROM lich_hoc b WHERE b.cohort_id = c.id AND b.ngay = '2026-09-05');
