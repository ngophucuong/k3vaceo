-- Lịch học tuần 11–12/9/2026. Ngô Phú Cường gửi "THÔNG BÁO LỊCH HỌC TUẦN NÀY"
-- của Ban tổ chức, ngày 9/9.
--
-- SỬA buổi kiến tập đã có (id 5, migration 0032): giờ kết thúc đổi từ 13:30
-- xuống 12:00. Thư mời gốc (6/9) tính cả ăn trưa và di chuyển về tới 13h30;
-- thông báo mới (9/9) rút gọn buổi sáng còn 7h30–12h để dành chỗ cho một
-- buổi học chính thức lúc 14h — không phải một chỗ mâu thuẫn, mà là lịch đã
-- được Ban tổ chức SẮP XẾP LẠI. Chỉ sửa den_gio, giữ nguyên tu_gio/chu_de/
-- ghi_chu (điểm đón không đổi).
--
-- Guard theo den_gio CŨ = '13:30': nếu Ban cán sự lớp đã tự sửa giờ này
-- trong ứng dụng trước khi migration chạy thì không đè lên sửa tay của họ.
UPDATE lich_hoc
   SET den_gio = '12:00',
       updated_at = datetime('now')
 WHERE ngay = '2026-09-11'
   AND chu_de = 'Kiến tập Nhà máy Dược Thái Minh Hi-Tech'
   AND den_gio = '13:30'
   AND cohort_id = (SELECT id FROM cohorts WHERE code = 'K03');

-- 11/9 buổi chiều — buổi học chính thức, KHÔNG có trong thông báo trước (thư
-- mời 6/9 chỉ nói "giao lưu, kết nối, chưa chốt" cho khung giờ này). Ban tổ
-- chức nhấn mạnh riêng: "thời gian học buổi chiều thứ Sáu sẽ bắt đầu lúc
-- 14h" — ghi lại đúng câu ấy vào ghi_chu vì đây là điều họ chủ động lưu ý,
-- không phải suy diễn của ta.
INSERT INTO lich_hoc (cohort_id, ngay, tu_gio, den_gio, chu_de, giang_vien, ghi_chu)
SELECT id, '2026-09-11', '14:00', '16:00', 'Phát triển năng lực lãnh đạo cho CEO',
       'TS. Đỗ Tiến Long — Viện QTKD&CN FSB', 'Lưu ý: bắt đầu đúng 14h'
  FROM cohorts WHERE code = 'K03'
   AND NOT EXISTS (SELECT 1 FROM lich_hoc
                    WHERE ngay = '2026-09-11' AND tu_gio = '14:00'
                      AND cohort_id = (SELECT id FROM cohorts WHERE code = 'K03'));

-- 11/9 buổi tối — không bắt buộc, không có giờ cụ thể trong thông báo. Để
-- trống tu_gio/den_gio đúng nguyên tắc "thiếu thông tin thì để trống, đừng
-- bịa" đã áp dụng xuyên suốt (buổi 4/9, 5/9). "(Không bắt buộc)" nằm ngay
-- trong chu_de vì đây là thứ người xem lịch cần biết ngay, không phải chi
-- tiết phụ để giấu vào ghi_chu.
INSERT INTO lich_hoc (cohort_id, ngay, tu_gio, den_gio, chu_de, ghi_chu)
SELECT id, '2026-09-11', NULL, NULL, 'Giao lưu, kết nối (không bắt buộc)', 'Buổi tối'
  FROM cohorts WHERE code = 'K03'
   AND NOT EXISTS (SELECT 1 FROM lich_hoc
                    WHERE ngay = '2026-09-11' AND chu_de = 'Giao lưu, kết nối (không bắt buộc)'
                      AND cohort_id = (SELECT id FROM cohorts WHERE code = 'K03'));

-- 12/9 buổi sáng — tiếp nối buổi chiều 11/9, cùng giảng viên.
INSERT INTO lich_hoc (cohort_id, ngay, tu_gio, den_gio, chu_de, giang_vien)
SELECT id, '2026-09-12', '09:00', '12:00', 'Phát triển năng lực lãnh đạo cho CEO (tiếp)',
       'TS. Đỗ Tiến Long — Viện QTKD&CN FSB'
  FROM cohorts WHERE code = 'K03'
   AND NOT EXISTS (SELECT 1 FROM lich_hoc
                    WHERE ngay = '2026-09-12' AND tu_gio = '09:00'
                      AND cohort_id = (SELECT id FROM cohorts WHERE code = 'K03'));

-- 12/9 buổi chiều.
INSERT INTO lich_hoc (cohort_id, ngay, tu_gio, den_gio, chu_de, giang_vien)
SELECT id, '2026-09-12', '13:30', '16:00', 'Quản trị các vấn đề pháp lý trong doanh nghiệp',
       'ThS. LS. Dương Thị Mai Hoa — Giám đốc điều hành Công ty Luật TNHH Việt Ấn (I-V Legal), giảng viên thỉnh giảng Học viện Tư pháp và chuyên gia tư vấn luật cho doanh nghiệp'
  FROM cohorts WHERE code = 'K03'
   AND NOT EXISTS (SELECT 1 FROM lich_hoc
                    WHERE ngay = '2026-09-12' AND tu_gio = '13:30'
                      AND cohort_id = (SELECT id FROM cohorts WHERE code = 'K03'));

-- Ghi chú Text đính kèm buổi kiến tập (migration 0032) có một đoạn "Lưu ý"
-- nói khung 13h30–16h00 là "giao lưu, chưa chốt, sẽ thông báo sau" — thông
-- báo mới đã CHỐT khác hẳn (14h-16h là buổi học, tối mới là giao lưu không
-- bắt buộc). Để nguyên đoạn cũ thì ai mở ghi chú này ra đọc thấy hai lịch
-- mâu thuẫn nhau ngay trong cùng một buổi. Thay bằng câu trỏ về lịch thật.
UPDATE links
   SET content_md = REPLACE(content_md,
         '### Lưu ý

Ngay sau chương trình, từ **13h30 – 16h00**, lớp sẽ tiếp tục có buổi giao lưu, kết nối sâu rộng giữa các học viên K3. Chi phí buổi này được chia sẻ giữa các thành viên tham gia; nội dung chương trình cụ thể sẽ được thông báo sau.',
         '### Lưu ý

Lịch chiều và tối 11/9 đã CHỐT LẠI theo thông báo mới nhất của Ban tổ chức (9/9): **14h00 – 16h00** là buổi học "Phát triển năng lực lãnh đạo cho CEO" (GV: TS. Đỗ Tiến Long, Viện QTKD&CN FSB); buổi tối có chương trình giao lưu, kết nối — không bắt buộc tham gia. Xem đủ trong tab Lịch.')
 WHERE title = 'Thư mời — Kiến tập Nhà máy Dược Thái Minh Hi-Tech (11/9)'
   AND kind = 'TEXT' AND removed_at IS NULL
   AND content_md LIKE '%tiếp tục có buổi giao lưu%';
