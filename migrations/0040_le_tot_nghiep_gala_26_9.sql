-- Buổi 26/9/2026 — BẢO VỆ KẾ HOẠCH KINH DOANH và LỄ TỐT NGHIỆP & GALA.
-- Ngô Phú Cường gửi thư mời chính thức của Ban tổ chức (VCCI × Andrew School
-- of Business), ngày 17/9.
--
-- Đây là ngày kết thúc khoá theo `cohorts` (end_date = 2026-09-26) và là thứ
-- CLAUDE.md đã ghi là CÒN TRỐNG sau migration 0039: "CHƯA CÓ DÒNG NÀO cho
-- 26/9 — chính buổi BẢO VỆ và LỄ BẾ GIẢNG". Nay điền xong. Trớ trêu đúng như
-- đã ghi: cuộc họp 9h00 ngày 18/9 (0039) chính là cuộc họp bàn về ngày này.
--
-- ── GIỜ BẮT ĐẦU: 13h30, KHÔNG phải 13h00 như thư mời in ──────────────────
-- Thư mời ghi 13h00 ở HAI chỗ (băng "13h00 – 22h00" và khối đầu chương trình
-- "13h00–17h00 Business Plan Defense"). Ngô Phú Cường — uỷ viên Ban cán sự
-- lớp, người liên hệ trực tiếp Ban tổ chức — đính chính: "26/9 là 13h30 đến
-- 22h". Lấy theo lời anh, và áp CHỈ cho khối đầu; năm khối sau (17h00, 17h30,
-- 19h45, 20h45, 21h15, 22h00) giữ nguyên giờ của thư mời vì chúng khớp nhau.
--
-- Ghi chú Text bên dưới cũng viết 13h30 cho khối đầu, KHÔNG để lệch với thẻ
-- buổi học — hai cái đồng hồ nói hai giờ khác nhau trong cùng một ứng dụng là
-- đúng loại lỗi CLAUDE.md đã ghi ở mục "Hôm nay LUÔN là date('now','+7 hours')".
-- Nếu về sau xác minh lại là 13h00 thì sửa CẢ HAI chỗ, hoặc Ban cán sự lớp
-- bấm nút ✎ sửa thẳng trong ứng dụng.

-- ── HAI DÒNG cho một ngày, không phải một ────────────────────────────────
-- Thư mời gộp cả ngày thành "13h00 – 22h00", nhưng hai nửa là HAI cam kết
-- khác hẳn nhau:
--   • Buổi chiều là KỲ THI — bảo vệ Kế hoạch kinh doanh, thứ cả khoá học 13
--     buổi dồn vào, và là việc bắt buộc của mọi học viên.
--   • Buổi tối là LỄ + GALA — có phí 1.000.000đ/học viên và phải đăng ký
--     trước 21h00 ngày 19/9.
-- Gộp một dòng thì học viên đọc lướt rất dễ hiểu là phải nộp 1 triệu và đăng
-- ký trước 19/9 mới được bảo vệ bài của mình — một hiểu nhầm có thể làm ai đó
-- bỏ chính buổi thi cuối khoá. Tách đôi thì mỗi dòng nói đúng một việc.
-- Ranh giới 17h00 lấy thẳng từ bảng chương trình của thư mời, không tự nghĩ ra.

-- ── 26/9, dòng 1: BẢO VỆ KẾ HOẠCH KINH DOANH ─────────────────────────────
-- ghi_chu chỉ có ĐỊA ĐIỂM, và phải NGẮN: giao diện in nó thành dòng CHỮ HOA
-- 11px ngay đầu thẻ buổi học, bản đầu của migration 0032 ghi dài quá thành
-- bốn dòng chữ hoa đè lên chính tên buổi.
--
-- Bản đầu của chính migration này ghi đủ "Dolce by Wyndham Hanoi Golden Lake,
-- Giảng Võ" (43 ký tự) và ảnh chụp 390px cho thấy nó thành BA dòng chữ hoa,
-- nặng hơn cả tên buổi ngay dưới. Rút còn "Dolce by Wyndham, Giảng Võ" —
-- vẫn đủ nhận ra khách sạn và khu vực, tên đầy đủ cùng địa chỉ nằm trong ghi
-- chú Text cách đúng một cú chạm. Lại một lỗi chỉ ảnh chụp mới thấy.
--
-- Và quan trọng hơn: `ghi_chu` ĐI RA TRANG CÔNG KHAI `/lich` (docLichCongKhai
-- liệt kê nó trong danh sách trả về), nên tuyệt đối không nhét số tài khoản,
-- số điện thoại người thu hay mức phí vào đây. Những thứ ấy nằm trong ghi chú
-- Text bên dưới — `content_md` chỉ được ĐẾM ở đường công khai, không trả nội
-- dung.
--
-- giang_vien để TRỐNG: thư mời không nêu thành phần hội đồng chấm, mà
-- lib/ics.js in ra "Giảng viên: …" — điền bừa vào đó là nói sai vai trò của
-- người ta, đúng lỗi đã tránh ở 0032 với Ban Lãnh đạo Thái Minh và ở 0039 với
-- buổi họp lớp.
INSERT INTO lich_hoc (cohort_id, ngay, tu_gio, den_gio, chu_de, giang_vien, ghi_chu)
SELECT id, '2026-09-26', '13:30', '17:00',
       'Bảo vệ Kế hoạch kinh doanh cuối khoá', NULL,
       'Dolce by Wyndham, Giảng Võ'
  FROM cohorts WHERE code = 'K03'
   -- Chạy lại không nhân đôi. Migration chỉ chạy một lần, nhưng câu này cũng
   -- có thể bị dán tay vào Console D1 — và ở đó không có gì chặn.
   AND NOT EXISTS (SELECT 1 FROM lich_hoc
                    WHERE ngay = '2026-09-26' AND tu_gio = '13:30'
                      AND cohort_id = (SELECT id FROM cohorts WHERE code = 'K03'));

-- ── 26/9, dòng 2: LỄ TỐT NGHIỆP & GALA ───────────────────────────────────
-- Một dòng cho cả buổi tối (17h00–22h00) chứ không tách tiếp thành năm khối
-- 30–75 phút của thư mời: `/api/home` chỉ hiện 6 buổi SẮP TỚI, nên năm dòng
-- của cùng một tối sẽ chiếm sạch danh sách và đẩy mọi buổi khác ra ngoài; còn
-- tệp .ics thì đổ năm cuộc hẹn liên tiếp vào lịch điện thoại của 146 người.
-- Chi tiết từng khối nằm trong ghi chú Text, cách đúng một cú chạm.
INSERT INTO lich_hoc (cohort_id, ngay, tu_gio, den_gio, chu_de, giang_vien, ghi_chu)
SELECT id, '2026-09-26', '17:00', '22:00',
       'Lễ Tốt nghiệp & Gala', NULL,
       'Dolce by Wyndham, Giảng Võ'
  FROM cohorts WHERE code = 'K03'
   AND NOT EXISTS (SELECT 1 FROM lich_hoc
                    WHERE ngay = '2026-09-26' AND tu_gio = '17:00'
                      AND cohort_id = (SELECT id FROM cohorts WHERE code = 'K03'));

-- ── Toàn văn thư mời, gắn vào DÒNG 1 ─────────────────────────────────────
-- Neo vào đúng dòng 13:30 (`b.tu_gio = '13:30'`) chứ không chỉ theo ngày: ngày
-- 26/9 nay có HAI dòng, nên `JOIN lich_hoc b ON b.ngay = '2026-09-26'` không
-- kèm điều kiện giờ sẽ khớp cả hai và chèn ghi chú HAI lần. Khác hẳn migration
-- 0032, nơi 11/9 lúc ấy chỉ có đúng một dòng.
--
-- Gắn vào dòng ĐẦU của ngày vì ghi chú này bao cả ngày, và đó là thẻ người ta
-- chạm vào trước.
--
-- scope='class': đây là chương trình chung của cả khoá, không phải ghi chép
-- riêng Nhóm 6 — đúng khuôn 0026 (tóm tắt LEAN) và 0032 (thư mời kiến tập).
INSERT INTO links (cohort_id, scope, group_id, buoi_id, title, kind, tag, content_md, created_by, created_at)
SELECT c.id, 'class', NULL, b.id,
       'Thư mời — Lễ Tốt nghiệp & Gala Lớp K3 CEO (26/9)', 'TEXT', 'buoi',
'VCCI và Andrew School of Business trân trọng kính mời Quý học viên, Quý đối tác và Quý doanh nghiệp hội tụ trong sự kiện khép lại một hành trình học tập và mở ra một chặng đường hợp tác mới.

**HÀNH TRÌNH HỘI TỤ — KẾT NỐI GIÁ TRỊ — KIẾN TẠO TƯƠNG LAI**

### Thông tin chung

- **Thời gian:** 13h30 – 22h00, Thứ Bảy ngày 26/09/2026
- **Địa điểm:** Dolce by Wyndham Hanoi Golden Lake, Giảng Võ, Hà Nội
- **Đối tượng:** Học viên K3 và đối tác, doanh nghiệp bảo trợ và khách mời

### Mục tiêu chương trình

Tổng kết hành trình học tập, ghi nhận xứng đáng kết quả đã đạt được, và mở ra mạng lưới hợp tác — nơi tri thức CEO chuyển hoá thành cơ hội kinh doanh thực sự giữa các học viên.

HỌC TẬP → GHI NHẬN → KẾT NỐI

### Điểm nhấn

- **Bảo vệ Kế hoạch kinh doanh** — 08 KHKD tốt nhất
- **Trao chứng chỉ** — toàn thể học viên K3
- **Kết nối doanh nghiệp** — hợp tác cùng VACEO
- **Gala Dinner** — giao lưu nghệ thuật

### Chương trình chi tiết

- **13h30 – 17h00 · Business Plan Defense.** Bảo vệ và đánh giá KHKD; 08 KHKD tốt nhất; giải Nhất, Nhì, Ba.
- **17h00 – 17h30 · Welcome & Networking.** Đón khách, check-in; chụp ảnh, giao lưu; nhạc nền acoustic.
- **17h30 – 19h45 · Lễ Bế giảng & Gala Dinner.** Khai mạc, phát biểu; trao bằng chứng chỉ; trao giải, vinh danh; tiệc tối và nghệ thuật.
- **19h45 – 20h45 · Business Connection.** Giới thiệu VACEO; 60 phút – 60 cơ hội; 30 giây mỗi học viên.
- **20h45 – 21h15 · Mini-game.** Trò chơi hấp dẫn; quà từ học viên và doanh nghiệp tài trợ.
- **21h15 – 22h00 · Giao lưu & Nghệ thuật.** Ca sĩ, ban nhạc; tiết mục học viên; One More Song.

### Đăng ký tham dự

**Hạn đăng ký: trước 21h00 Thứ Bảy ngày 19/09/2026** để Ban tổ chức sắp xếp chu đáo nhất.

- Đăng ký tham dự chương trình
- Đóng góp kinh phí: **1.000.000 VNĐ/học viên**
- Đăng ký tài trợ hiện vật, sản phẩm hoặc dịch vụ doanh nghiệp

### Tài trợ chương trình

Kính mời Quý học viên, doanh nghiệp đồng hành bằng tiền mặt, hiện vật hoặc sản phẩm/dịch vụ — biến Gala thành sân khấu quảng bá thương hiệu.

Quyền lợi tài trợ:

- Logo trên backdrop và slide tri ân
- Giới thiệu thương hiệu trong chương trình
- Sản phẩm làm quà tặng, được MC giới thiệu

### Thông tin chuyển khoản

**Vũ Thị Ngân** — MBBank — **0975 587 586**

Nội dung chuyển khoản:

- Nếu tham gia chương trình: `K3_Họ & Tên_Tham gia cuối khóa`
- Nếu tài trợ chương trình: `K3_Họ & Tên_Tài trợ cuối khóa`

### Lưu ý

Giờ bắt đầu ghi ở đây là **13h30** theo đính chính mới nhất của Ban cán sự lớp; bản thư mời in ra ghi 13h00. Nếu Ban tổ chức chốt lại khác thì Ban cán sự lớp sửa trực tiếp trong ứng dụng.

*"Chúng ta không chỉ kết thúc một khóa học, mà mở ra một hành trình mới — cùng nhau."*',
       m.id, datetime('now')
  FROM cohorts c
  JOIN lich_hoc b ON b.cohort_id = c.id AND b.ngay = '2026-09-26' AND b.tu_gio = '13:30'
  JOIN members m ON m.full_name = 'Ngô Phú Cường' AND m.is_active = 1
 WHERE c.code = 'K03'
   AND NOT EXISTS (SELECT 1 FROM links l
                    WHERE l.buoi_id = b.id AND l.kind = 'TEXT' AND l.removed_at IS NULL);
