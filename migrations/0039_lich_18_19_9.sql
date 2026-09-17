-- Lịch học 18/9 và 19/9/2026 — Ngô Phú Cường dán lại thông báo của Ban tổ
-- chức, ngày 17/9. Hai ngày này TRƯỚC NAY CHƯA CÓ dòng nào trong lich_hoc
-- (đã soi: migration gần nhất chạm lịch là 0035, dừng ở 12/9), nên đây là
-- INSERT thuần, không có bản tạm nào để UPDATE đè lên như 0019/0032 đã làm.
--
-- MỘT SỢI DÂY NỐI VỀ MIGRATION 0017: buổi của ThS. Tuấn Hà từng được xếp
-- nhầm vào 5/9 — bản tạm 0017 ghi ĐÚNG hai chủ đề này, ĐÚNG giảng viên này,
-- gộp một dòng vì lúc ấy chưa có giờ. Bản chốt 0019 thay dòng ấy bằng ThS.
-- Hà Thu Thanh, tức buổi Tuấn Hà bị DỜI chứ không bị huỷ. Nay nó về đúng
-- chỗ với giờ cụ thể. Không còn dòng tồn đọng nào mang tên Tuấn Hà (0019
-- UPDATE tại chỗ chứ không chèn thêm), nên không phải dọn gì.
--
-- 18/9 tách BA dòng, 19/9 để MỘT dòng không giờ — lý do từng dòng ghi ngay
-- dưới đây.

-- ── 18/9, dòng 1: HỌP LỚP ────────────────────────────────────────────────
-- Đây KHÔNG phải buổi giảng, và vẫn phải là một dòng RIÊNG chứ không nhét
-- vào ghi_chu của buổi 9h30. Lý do nằm ở tệp .ics: nó đổ thẳng vào lịch
-- điện thoại của 146 người, và nếu lịch nói ngày 18/9 bắt đầu lúc 9h30 thì
-- cả lớp đến muộn đúng nửa tiếng của cuộc họp bàn về BUỔI BẢO VỆ của chính
-- họ. Giờ bắt đầu thật của ngày là 9h00.
--
-- Đã có tiền lệ cho một dòng không-phải-buổi-giảng: "Giao lưu, kết nối
-- (không bắt buộc)" tối 11/9 (migration 0035).
--
-- giang_vien để TRỐNG có chủ đích: thông báo không nêu ai chủ trì, mà
-- lib/ics.js in ra "Giảng viên: …" — điền Ban tổ chức vào đó là nói sai vai
-- trò của họ, đúng lỗi đã tránh ở migration 0032 với Ban Lãnh đạo Thái Minh.
INSERT INTO lich_hoc (cohort_id, ngay, tu_gio, den_gio, chu_de, giang_vien, ghi_chu)
SELECT c.id, '2026-09-18', '09:00', '09:30',
       'Họp lớp về buổi bảo vệ Kế hoạch kinh doanh và Lễ bế giảng', NULL, NULL
  FROM cohorts c WHERE c.code = 'K03'
   -- Chạy lại không nhân đôi. Migration chỉ chạy một lần, nhưng câu này cũng
   -- có thể bị dán tay vào Console D1 — và ở đó không có gì chặn.
   AND NOT EXISTS (SELECT 1 FROM lich_hoc b
                    WHERE b.cohort_id = c.id AND b.ngay = '2026-09-18' AND b.tu_gio = '09:00');

-- ── 18/9, dòng 2: buổi sáng ──────────────────────────────────────────────
-- Chủ đề giữ NGUYÊN VĂN cách viết của bản tạm 0017 (kể cả "Kỷ nguyên Số"
-- viết hoa như thông báo gốc) — cùng một buổi học thì cùng một cái tên, để
-- ai nhớ lịch cũ vẫn nhận ra.
INSERT INTO lich_hoc (cohort_id, ngay, tu_gio, den_gio, chu_de, giang_vien, ghi_chu)
SELECT c.id, '2026-09-18', '09:30', '12:00',
       'Quản trị Marketing trong Kỷ nguyên Số',
       'ThS. Tuấn Hà — Chủ tịch Vinalink Academy', NULL
  FROM cohorts c WHERE c.code = 'K03'
   AND NOT EXISTS (SELECT 1 FROM lich_hoc b
                    WHERE b.cohort_id = c.id AND b.ngay = '2026-09-18' AND b.tu_gio = '09:30');

-- ── 18/9, dòng 3: buổi chiều ─────────────────────────────────────────────
INSERT INTO lich_hoc (cohort_id, ngay, tu_gio, den_gio, chu_de, giang_vien, ghi_chu)
SELECT c.id, '2026-09-18', '13:30', '16:00',
       'Doanh nghiệp 1 thành viên (tự động hoá bằng AI)',
       'ThS. Tuấn Hà — Chủ tịch Vinalink Academy', NULL
  FROM cohorts c WHERE c.code = 'K03'
   AND NOT EXISTS (SELECT 1 FROM lich_hoc b
                    WHERE b.cohort_id = c.id AND b.ngay = '2026-09-18' AND b.tu_gio = '13:30');

-- ── 19/9: KHÔNG CÓ GIỜ, và không được bịa ra ─────────────────────────────
-- Thông báo chỉ ghi chủ đề và giảng viên, không một mốc giờ nào — kể cả
-- "buổi sáng"/"buổi chiều" như 5/9 từng có. Để trống tu_gio/den_gio, đúng
-- nguyên tắc đã áp cho 4/9, 5/9 và buổi tối 11/9: bịa giờ ra thì .ics ghi
-- sai một cuộc hẹn vào lịch điện thoại của 146 người, và sai kiểu ấy không
-- ai báo lại được vì trông y như thật.
--
-- ghi_chu cũng để TRỐNG chứ không viết "chưa có giờ": giao diện in ghi_chu
-- thành dòng CHỮ HOA ngay đầu thẻ buổi học, còn chỗ trống của tu_gio thì
-- tự nó đã nói lên điều đó rồi.
--
-- Chốt trùng lặp phải theo chu_de chứ không theo tu_gio như ba dòng trên:
-- tu_gio là NULL, mà `NULL = NULL` trong SQL không bao giờ đúng nên phép
-- kiểm ấy sẽ không chặn được gì cả.
INSERT INTO lich_hoc (cohort_id, ngay, tu_gio, den_gio, chu_de, giang_vien, ghi_chu)
SELECT c.id, '2026-09-19', NULL, NULL,
       'Phân tích báo cáo tài chính doanh nghiệp',
       'ThS. Đỗ Trung Kiên — Giám đốc Deloitte Vietnam, chi nhánh Hà Nội', NULL
  FROM cohorts c WHERE c.code = 'K03'
   AND NOT EXISTS (SELECT 1 FROM lich_hoc b
                    WHERE b.cohort_id = c.id AND b.ngay = '2026-09-19'
                      AND b.chu_de = 'Phân tích báo cáo tài chính doanh nghiệp');
