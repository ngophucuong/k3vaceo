-- Bổ sung 4 số điện thoại đọc từ tệp "Final_Danh_sách_ký_K03" (chữ ký buổi
-- 21/8 + danh sách trưởng/phó nhóm) Ngô Phú Cường gửi ngày 3/9. Đối chiếu 44
-- người thiếu số trong roster với tên trong tệp: chỉ 4 người khớp được số.
--
-- CHỈ CẬP NHẬT THÔNG TIN CÒN THIẾU (Ngô Phú Cường yêu cầu rõ) — điều kiện
-- COALESCE(phone,'')='' vừa để không đè số đã có, vừa để migration chạy lại
-- không đổi gì lần hai.
UPDATE roster SET phone = '0906141957' WHERE seq = 21 AND full_name = 'Trần Huy Tùng' AND COALESCE(phone,'') = '';
UPDATE roster SET phone = '0387432172' WHERE seq = 47 AND full_name = 'Tạ Duy Hưng' AND COALESCE(phone,'') = '';
UPDATE roster SET phone = '0986145995' WHERE seq = 63 AND full_name = 'Nguyễn Quang Huy' AND COALESCE(phone,'') = '';
UPDATE roster SET phone = '0969668844' WHERE seq = 126 AND full_name = 'Lâm Ngọc Thảo' AND COALESCE(phone,'') = '';
