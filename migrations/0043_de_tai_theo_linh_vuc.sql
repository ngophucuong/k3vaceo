-- Đề tài KHKD nộp THEO CÁ NHÂN / THEO LĨNH VỰC, không còn theo nhóm.
--
-- ══ VÌ SAO ĐỔI, CHỈ SAU VÀI GIỜ ═══════════════════════════════════════════
-- Migration 0041 (sáng 18/9) đặt link bản nộp trên `groups`: mỗi nhóm một
-- link, ai trong nhóm cũng nộp được. Chiều cùng ngày Ngô Phú Cường nói rõ mô
-- hình đã đổi: "Các nhóm hoạt động không hiệu quả nên lớp quyết định nộp đề
-- tài tự do theo cá nhân hoặc cùng lĩnh vực, không bắt buộc ai cũng phải
-- nộp."
--
-- Lớp đã bình chọn lĩnh vực trên Zalo và ĐÃ KHOÁ bình chọn, nhưng anh nói
-- thẳng vấn đề: "rất khó để Ban cán sự lớp theo dõi". Một lượt bình chọn Zalo
-- cho thấy avatar và con số, không cho biết AI chọn GÌ, không nối được với
-- đề tài hay link bài, và không xuất ra được. Đó là việc migration này chữa.
--
-- ══ GỠ HẲN ĐƯỜNG NỘP THEO NHÓM ═══════════════════════════════════════════
-- Ngô Phú Cường chọn "bỏ hẳn, chỉ còn cá nhân" khi được hỏi. Gỡ bây giờ
-- KHÔNG mất dữ liệu của ai: soi D1 thật lúc 11h34 ngày 18/9, cả 10 nhóm đều
-- `(chưa nộp)`.
--
-- Vì sao không giữ song song cả hai cho chắc: hai chỗ nộp là hai nguồn sự
-- thật cho cùng một việc, và có ngày một người xuất hiện ở cả hai với hai
-- link khác nhau — Ban cán sự lớp không có cách nào biết cái nào đúng. Đây là
-- lỗi CLAUDE.md đã ghi nhiều lần; giữ lại "phòng khi đổi ý" chính là cách nó
-- xảy ra.
ALTER TABLE groups DROP COLUMN ban_nop_url;
ALTER TABLE groups DROP COLUMN ban_nop_luc;
ALTER TABLE groups DROP COLUMN ban_nop_boi;

-- ══ BA CỘT MỚI, ĐẶT TRÊN `dang_ky_tot_nghiep` ════════════════════════════
-- Không dựng bảng riêng, vì đây là cùng một sự thật về cùng một người ở cùng
-- một thời điểm: "tôi làm gì cho buổi 26/9". Và nó được LỢI NGAY hai thứ đã
-- có sẵn từ migration 0041/0042:
--   · đường CÔNG KHAI — 38 người không đăng nhập được vẫn khai được lĩnh vực
--     và nộp được link, thứ mà một bảng riêng sẽ phải dựng lại từ đầu;
--   · màn Ban cán sự lớp + xuất CSV đã có, chỉ thêm cột.
--
-- MỘT lĩnh vực mỗi người (khác `member_profile.nganh` cho tối đa 3): lượt
-- bình chọn của lớp là chọn một, và cả mục đích của nó là xếp người vào một
-- chỗ đếm được. Danh mục 15 mã ở worker/src/lib/linh-vuc-khkd.js — đọc chú
-- thích đầu tệp ấy trước khi đụng vào, nhất là đoạn giải thích vì sao nó KHÔNG
-- phải `lib/nganh.js`.
--
-- Cả ba cột đều để trống được, và đó là chủ ý chứ không phải lười: "không bắt
-- buộc ai cũng phải nộp" là nguyên văn quyết định của lớp. Người chỉ khai
-- lĩnh vực mà chưa có đề tài vẫn là một dòng hợp lệ và vẫn được đếm — Ban cán
-- sự lớp cần thấy cả hai mức, không chỉ mức đã xong.
ALTER TABLE dang_ky_tot_nghiep ADD COLUMN khkd_linh_vuc TEXT;
ALTER TABLE dang_ky_tot_nghiep ADD COLUMN khkd_de_tai TEXT;
ALTER TABLE dang_ky_tot_nghiep ADD COLUMN khkd_url TEXT;
ALTER TABLE dang_ky_tot_nghiep ADD COLUMN khkd_luc TEXT;

-- Ban cán sự lớp đếm theo lĩnh vực — đó là việc thay cho lượt bình chọn Zalo,
-- và là truy vấn chạy nhiều nhất của màn ấy.
CREATE INDEX ix_dktn_linh_vuc ON dang_ky_tot_nghiep(khkd_linh_vuc);

-- KHÔNG chép con số của lượt bình chọn Zalo vào đây. Ảnh chụp cho thấy tổng
-- phiếu mỗi lĩnh vực (14, 13, 8, …) nhưng KHÔNG cho biết ai chọn gì — chỉ có
-- avatar. Gieo sẵn con số mà không có tên là dựng một bảng đếm không ai dò
-- ngược được, đúng thứ đang phải chữa. Cả lớp khai lại trong ứng dụng, và lần
-- này mỗi phiếu có tên.
