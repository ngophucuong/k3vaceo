-- Lịch buổi 5/9 vừa được CHỐT — khác hẳn bản tạm ở migration 0017/0018, không
-- chỉ thêm giờ mà đổi cả CHỦ ĐỀ lẫn GIẢNG VIÊN (bản tạm ghi ThS. Tuấn Hà /
-- Marketing; bản chốt là ThS. Hà Thu Thanh / Quản trị DN & rủi ro tài chính-
-- thuế). Ngô Phú Cường dán nguyên văn thông báo chốt lịch của Ban tổ chức.
--
-- Bản tạm gộp hai chủ đề vào MỘT dòng vì lúc ấy không có giờ để tách. Nay có
-- "Buổi sáng" / "Buổi chiều" rõ ràng (dù vẫn không có mốc giờ CỤ THỂ) nên tách
-- thành hai dòng — đúng khuôn đã dùng cho 28/8.
--
-- SỬA TẠI CHỖ dòng cũ (UPDATE) thay vì xoá rồi tạo lại: giữ nguyên id thì tư
-- liệu lỡ gắn vào buổi này (links.buoi_id) không bị treo tham chiếu. Chỉ đụng
-- dòng nếu NÓ VẪN LÀ bản tạm — nhận diện bằng chu_de cũ còn nguyên — để không
-- ghi đè lên sửa đổi thật nếu Ban cán sự lớp đã tự chỉnh bằng nút ✎.
UPDATE lich_hoc
   SET chu_de = 'Quản trị DN hiệu quả và bền vững - từ tư duy đến điều hành',
       giang_vien = 'ThS. Hà Thu Thanh — Phó Chủ tịch Hiệp hội nữ doanh nhân Việt Nam, Chủ tịch Viện Thành viên Hội đồng Quản trị Việt Nam (VIOD), nguyên Chủ tịch Deloitte Vietnam',
       ghi_chu = 'Buổi sáng',
       updated_at = datetime('now')
 WHERE cohort_id = (SELECT id FROM cohorts WHERE code = 'K03')
   AND ngay = '2026-09-05'
   AND chu_de = 'Quản trị Marketing trong Kỷ nguyên Số; Doanh nghiệp 1 thành viên (tự động hoá bằng AI)';

-- Buổi chiều là dòng MỚI — bản tạm chỉ có một dòng cho cả ngày.
INSERT INTO lich_hoc (cohort_id, ngay, tu_gio, den_gio, chu_de, giang_vien, ghi_chu)
SELECT c.id, '2026-09-05', NULL, NULL,
       'Quản trị rủi ro về tài chính và thuế',
       'ThS. Hà Thu Thanh — Phó Chủ tịch Hiệp hội nữ doanh nhân Việt Nam, Chủ tịch Viện Thành viên Hội đồng Quản trị Việt Nam (VIOD), nguyên Chủ tịch Deloitte Vietnam',
       'Buổi chiều'
  FROM cohorts c WHERE c.code = 'K03'
   -- Chạy lại không nhân đôi. Migration chỉ chạy một lần, nhưng câu này cũng
   -- có thể bị dán tay vào Console D1 — và ở đó không có gì chặn.
   AND NOT EXISTS (
     SELECT 1 FROM lich_hoc b WHERE b.cohort_id = c.id AND b.ngay = '2026-09-05'
       AND b.chu_de = 'Quản trị rủi ro về tài chính và thuế'
   );
