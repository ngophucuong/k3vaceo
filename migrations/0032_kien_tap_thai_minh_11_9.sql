-- Buổi kiến tập Nhà máy Dược Thái Minh Hi-Tech, Thứ Sáu 11/9/2026.
-- Ngô Phú Cường gửi thư mời chính thức của Ban tổ chức ngày 6/9.
--
-- Dòng lich_hoc cho 11/9 ĐÃ CÓ từ trước (id 5) nhưng còn là bản tạm: chủ đề
-- "Tham quan kiến tập", giờ 13:30 không có căn cứ, ghi chú "Dời từ lịch cũ
-- sang". Nay có thư mời với giờ giấc và địa điểm cụ thể thì điền cho đủ.
--
-- SỬA TẠI CHỖ (UPDATE) chứ không xoá-tạo-lại, đúng khuôn migration 0019: giữ
-- nguyên `id` để tư liệu lỡ gắn vào buổi này không treo tham chiếu, và để
-- UID trong tệp .ics không đổi — đổi UID thì lịch điện thoại của 146 người
-- có HAI buổi 11/9 thay vì một buổi được cập nhật.
--
-- Guard theo chu_de = bản tạm: nếu Ban cán sự lớp đã tự sửa dòng này trong
-- ứng dụng trước khi migration chạy thì không đè lên bản sửa tay của họ.
UPDATE lich_hoc
   SET tu_gio  = '07:30',
       den_gio = '13:30',
       chu_de  = 'Kiến tập Nhà máy Dược Thái Minh Hi-Tech',
       -- ghi_chu đi thẳng vào DESCRIPTION của tệp .ics, nên đây là chỗ DUY
       -- NHẤT nói được điểm đón cho người xem lịch trên ĐIỆN THOẠI mà không
       -- mở ứng dụng — và lúc 7 giờ sáng thì "đứng ở đâu" là thứ duy nhất
       -- người ta cần.
       --
       -- PHẢI NGẮN. Ảnh chụp bản đầu cho thấy vì sao: giao diện in ghi_chu
       -- vào dòng đầu thẻ buổi học, kiểu CHỮ HOA cỡ 11px, cùng dòng với ngày
       -- và giờ. Bản đầu ghi đủ cả địa chỉ, tên Ban Lãnh đạo và nguồn chi phí
       -- → bốn dòng chữ hoa đè lên chính tên buổi học. Không phép kiểm chuỗi
       -- nào thấy được chuyện ấy. Chi tiết còn lại nằm trong ghi chú Text
       -- gắn ngay dưới, cách đúng một cú chạm.
       --
       -- giang_vien để TRỐNG: thư mời không nêu giảng viên nào, và lib/ics.js
       -- in ra "Giảng viên: …" — điền Ban Lãnh đạo Thái Minh vào đó là nói
       -- sai vai trò của họ.
       ghi_chu = 'Xe đón 7h30 tại Số 3 Liễu Giai · KCN Thạch Thất, Hòa Lạc',
       updated_at = datetime('now')
 WHERE ngay = '2026-09-11'
   AND chu_de = 'Tham quan kiến tập'
   AND cohort_id = (SELECT id FROM cohorts WHERE code = 'K03');

-- Toàn văn thư mời, dạng "Nội dung Text" (migration 0025) gắn vào đúng buổi
-- ấy — một dòng dữ liệu, hiện ở cả tab Hôm nay, tab Lịch lẫn tab Tư liệu.
--
-- scope='class': đây là thư mời của Ban tổ chức cho cả khoá, không phải ghi
-- chép riêng Nhóm 6.
--
-- CỐ Ý KHÔNG thêm một dòng lich_hoc thứ hai cho buổi giao lưu 13h30–16h00:
-- thư mời ghi rõ "nội dung chương trình cụ thể sẽ được thông báo sau" và chi
-- phí do người tham gia tự chia. Đưa một buổi chưa chốt vào tệp .ics là ghi
-- vào lịch điện thoại của 146 người một cuộc hẹn chưa chắc có. Nó nằm ở mục
-- "Lưu ý" trong ghi chú dưới đây, đúng chỗ của nó.
INSERT INTO links (cohort_id, scope, group_id, buoi_id, title, kind, tag, content_md, created_by, created_at)
SELECT c.id, 'class', NULL, b.id,
       'Thư mời — Kiến tập Nhà máy Dược Thái Minh Hi-Tech (11/9)', 'TEXT', 'buoi',
'Ban tổ chức trân trọng kính mời Quý Anh/Chị học viên lớp CEO K3 – VCCI tham gia chuyến tham quan, kiến tập tại **Nhà máy Dược Thái Minh Hi-Tech**, theo kế hoạch học tập của lớp.

### Thông tin chung

- **Thời gian:** 7h30 – 13h30, Thứ Sáu ngày 11/09/2026 (đã gồm di chuyển và ăn trưa)
- **Địa điểm:** Nhà máy Thái Minh Hi-Tech, KCN Thạch Thất, Hòa Lạc, Hà Nội
- **Điểm đón:** Số 3 Liễu Giai — vị trí lớp học
- **Chi phí:** trích từ Quỹ lớp, gồm di chuyển, ăn trưa và quà tặng doanh nghiệp
- **Trưởng đoàn:** Lưu Minh Tiến — 0914.544.449

### Điểm nhấn chương trình

- **Tham quan, kiến tập tại Nhà máy Dược Thái Minh Hi-Tech.** Một trong những cơ sở sản xuất dược phẩm hiện đại bậc nhất Việt Nam, diện tích hơn 12.000m², đạt chuẩn GMP và ISO/IEC 17025, sở hữu dây chuyền tự động hóa 100% cùng hệ thống quản trị thông minh 4.0.
- **Học hỏi kinh nghiệm quản trị thực chiến từ Ban Lãnh đạo Thái Minh.** Đặc biệt là những chia sẻ từ anh Hiếu — học viên xuất sắc của K1 VCCI, người đã vận dụng thành công nhiều kiến thức từ chương trình vào công tác quản trị doanh nghiệp.

### Chương trình chi tiết

- **07h30 – 07h45** — Xe đón học viên tại Số 3 Liễu Giai (vị trí lớp học)
- **07h45 – 09h00** — Di chuyển đến Nhà máy Thái Minh Hi-Tech
- **09h00 – 09h45** — Đón tiếp và tham quan tổng thể nhà máy
- **09h45 – 11h45** — Giao lưu, chia sẻ cùng Ban Lãnh đạo Thái Minh và hỏi đáp cùng học viên
- **11h45 – 12h00** — Lời cảm ơn và chụp ảnh lưu niệm
- **12h00 – 13h30** — Ăn trưa và di chuyển về Số 3 Liễu Giai

### Nội dung phần giao lưu (09h45 – 11h45)

- Giới thiệu tổng quan Thái Minh Group: lịch sử hình thành và phát triển
- Mô hình kinh doanh và các sản phẩm, dịch vụ tiêu biểu
- Bài học quản trị từ những ngày đầu khởi nghiệp đến thành công hiện tại
- Kinh nghiệm đầu tư mở rộng sản xuất – kinh doanh, cả thành công và chưa đạt kỳ vọng
- Vận dụng kiến thức từ chương trình CEO – VCCI vào thực tiễn doanh nghiệp
- Phản hồi, hỏi đáp cùng học viên lớp K3 – VCCI

### Lưu ý

Ngay sau chương trình, từ **13h30 – 16h00**, lớp sẽ tiếp tục có buổi giao lưu, kết nối sâu rộng giữa các học viên K3. Chi phí buổi này được chia sẻ giữa các thành viên tham gia; nội dung chương trình cụ thể sẽ được thông báo sau.

Ban tổ chức rất mong nhận được sự tham dự đông đủ của Quý Anh/Chị để chương trình thêm phần trọn vẹn và ý nghĩa.',
       m.id, datetime('now')
  FROM cohorts c
  JOIN lich_hoc b ON b.cohort_id = c.id AND b.ngay = '2026-09-11'
  JOIN members m ON m.full_name = 'Ngô Phú Cường' AND m.is_active = 1
 WHERE c.code = 'K03'
   AND NOT EXISTS (SELECT 1 FROM links l
                    WHERE l.buoi_id = b.id AND l.kind = 'TEXT' AND l.removed_at IS NULL);
