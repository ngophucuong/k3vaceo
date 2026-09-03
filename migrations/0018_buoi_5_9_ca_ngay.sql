-- Buổi 5/9 gộp hai chủ đề vào một dòng vì thông báo gốc không kèm mốc giờ
-- (migration 0017). Ngô Phú Cường nói thêm: "Có thể là học cả ngày" — hợp lý,
-- vì cả hai chủ đề cùng một giảng viên (ThS. Tuấn Hà). Ghi rõ vào ghi_chu để
-- ai xem lịch cũng hiểu vì sao một dòng lại mang hai chủ đề, thay vì bỏ trống.
--
-- Vẫn KHÔNG bịa giờ vào tu_gio/den_gio: "có thể" là suy đoán hợp lý chứ không
-- phải xác nhận, và bịa giờ ra thì tệp .ics ghi sai khung giờ cho 134 người —
-- cùng quy ước đã ghi ở migration 0011, 0016, 0017.
UPDATE lich_hoc
   SET ghi_chu = 'Có thể học cả ngày — hai chủ đề cùng giảng viên',
       updated_at = datetime('now')
 WHERE cohort_id = (SELECT id FROM cohorts WHERE code = 'K03')
   AND ngay = '2026-09-05'
   -- Chỉ đụng dòng CHƯA có ghi_chu: Ban cán sự lớp có thể đã tự sửa bằng nút ✎
   -- sau khi migration 0017 chạy, và migration chạy lại (dán tay vào Console)
   -- không được ghi đè lên sửa đổi thật của con người.
   AND ghi_chu IS NULL;
