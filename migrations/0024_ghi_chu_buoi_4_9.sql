-- Buổi 4/9 (LEAN, GV Huỳnh Minh Quốc) — Ngô Phú Cường gửi bản tóm tắt chi
-- tiết nội dung bài giảng (Ngôi nhà Lean, 5S, quản trị trực quan, Kaizen,
-- 8 lãng phí, phân tích nguyên nhân gốc rễ, chuyển đổi số theo nền Lean).
--
-- CỐ Ý không lưu nguyên văn: bản gửi dài nhiều phần, mà ghi_chu là ô hiển thị
-- NGẮN trong tab Lịch, và mục Tư liệu chỉ nhận URL chứ không nhận nội dung
-- trực tiếp (N2 — không giữ file/nội dung, chỉ lưu đường dẫn). Người dùng đã
-- được hỏi và chọn rút gọn thành ghi chú ngắn thay vì mở tính năng lưu nội
-- dung dài (việc đó cần làm mới, chưa có trong ứng dụng).
UPDATE lich_hoc
   SET ghi_chu = 'Tổng hợp: Ngôi nhà Lean (5S, quản trị trực quan, JIT/Jidoka), Kaizen & 8 lãng phí, phân tích nguyên nhân gốc rễ 6M+TID, chuyển đổi số dựa trên nền tảng Lean',
       updated_at = datetime('now')
 WHERE cohort_id = (SELECT id FROM cohorts WHERE code = 'K03')
   AND ngay = '2026-09-04'
   -- Chỉ đụng dòng CHƯA có ghi_chu: Ban cán sự lớp có thể đã tự sửa bằng nút ✎
   -- và migration chạy lại (dán tay vào Console) không được đè lên sửa đổi
   -- thật của con người — cùng khuôn migration 0018 đã dùng cho buổi 5/9.
   AND ghi_chu IS NULL;
