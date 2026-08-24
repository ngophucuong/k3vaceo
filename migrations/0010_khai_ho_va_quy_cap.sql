-- Đợt 6b: khai hộ, và tách "thu của ai" khỏi "tiền thuộc quỹ nào".

-- ══ 1. Tiền của đợt thu này thuộc quỹ nào ══
--
-- Trước nay cột scope gánh hai việc một lúc: vừa nói THU CỦA AI (cả lớp hay
-- một nhóm), vừa ngầm quyết định tiền vào SỔ NÀO. Thực tế lớp CEO K03 không
-- chạy như vậy: quỹ lớp được thu theo từng nhóm, mỗi trưởng nhóm đôn đốc 14
-- người của mình, nhưng tiền thì vào tài khoản thủ quỹ lớp và thuộc quỹ lớp.
--
-- Gộp hai việc vào một cột thì đợt "Lần 1: Quỹ lớp K3 VCCI" do trưởng Nhóm 6
-- mở sẽ cộng 7.000.000đ vào SỔ QUỸ NHÓM 6 — số dư sai hẳn, mà tiền thì nằm ở
-- tài khoản người khác.
--
-- Nên tách ra:
--   scope     = thu của ai      → quyết định ai nhìn thấy, ai phải đóng
--   thuoc_quy = tiền vào sổ nào → quyết định số dư của sổ nào thay đổi
ALTER TABLE fund_rounds ADD COLUMN thuoc_quy TEXT;

-- Các đợt đã có: suy từ scope, đúng như hành vi cũ.
UPDATE fund_rounds SET thuoc_quy = CASE WHEN scope = 'class' THEN 'lop' ELSE 'nhom' END
 WHERE thuoc_quy IS NULL;

-- ══ 2. Khai hộ ══
--
-- Nhiều học viên gửi ảnh chuyển khoản qua Zalo mà chưa từng mở ứng dụng. Trước
-- nay chỉ chính chủ tự khai được, nên trưởng nhóm không có cách nào ghi lại —
-- đành để trống, và bảng tiến độ báo cáo lên lớp thành sai.
--
-- Cột này ghi AI là người khai. Để trống = chính chủ tự khai. Có giá trị =
-- người ấy khai hộ, và giao diện nói rõ "do X khai hộ" chứ không giả vờ là
-- chính chủ — cùng tinh thần với "sửa hộ" ở mục 2.2 SRS.
--
-- Khai hộ vẫn chỉ là "đã tự khai", KHÔNG phải "người thu đã nhận" (mục 6.4).
-- Ảnh chụp là lời khai của người chuyển; chỉ người thu soi sao kê mới xác nhận
-- được tiền đã vào.
ALTER TABLE fund_declarations ADD COLUMN declared_by INTEGER REFERENCES members(id);
