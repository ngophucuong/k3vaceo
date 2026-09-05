-- Giao thương: danh mục "bán gì, bán cho ai" của cả lớp, và trang công khai.
--
-- ══ VÌ SAO CÓ MIGRATION NÀY ═══════════════════════════════════════════════
-- Ngô Phú Cường quyết ngày 5/9: "Cơ hội giao thương công khai là thứ giá trị
-- tồn tại sau khoá học. Nên bạn có thể bỏ qua các quy định trước (việc ghép
-- nhóm chỉ để làm bài tập)."
--
-- Đây là lệch có chủ ý khỏi N6 (dữ liệu nhóm cách ly), và lý lẽ đứng vững:
-- N6 sinh ra để bảo vệ BÀI TẬP NHÓM — bài của nhóm 6 không phải việc của nhóm
-- 8. Nhưng bài tập hết hạn ngày 26/9, còn quan hệ làm ăn thì không. Sau buổi
-- bảo vệ, lịch học hết buổi, quỹ nhóm hết đợt, bài đã nộp — thứ duy nhất còn
-- lý do để mở ứng dụng ra là tìm được người mua hàng của mình.
--
-- Phạm vi lệch được khoanh HẸP, không phải bỏ N6 toàn cục:
--   • CHỈ bảng member_profile (4 ô "bán gì/bán cho ai/cần gì/giúp được gì")
--     cùng tên, chức vụ, đơn vị mới ra khỏi nhóm.
--   • Quỹ, bài 8 phần, thông báo nhóm, sổ thu, tư liệu nhóm — N6 nguyên vẹn.
--   • Nhóm vẫn là nhóm; danh mục này xếp theo NGÀNH, không xếp theo nhóm.
--
-- ══ MỘT CHỐT GIỮ LẠI, VÀ VÌ SAO ═══════════════════════════════════════════
-- "Trong lớp" và "ra internet" là hai chuyện khác nhau, và cột cong_khai tách
-- đúng hai chuyện ấy:
--
--   cong_khai = 0  (mặc định) → 134 người đã đăng nhập đều xem được. Không cần
--                   xin phép ai: danh sách lớp kèm số điện thoại vốn đã lưu
--                   hành trong lớp, và đây là lứa người trao danh thiếp.
--   cong_khai = 1  → ra internet, ai cũng đọc được, Google index được.
--
-- Mức thứ hai phải do CHÍNH CHỦ bật (mở rộng tự nhiên của N5), không cho sửa
-- hộ, vì hai lẽ:
--   1. Không lùi được. Gỡ khỏi ứng dụng không gỡ được khỏi bộ nhớ đệm của
--      Google, và số điện thoại đã ra ngoài thì đã ra ngoài.
--   2. Lý do sản phẩm, mạnh hơn lý do nguyên tắc: 30 gian hàng do chính chủ
--      bật — số đúng, mô tả thật, người đang chờ điện thoại reo — đáng giá
--      hơn hẳn 134 gian hàng dựng từ dữ liệu cũ của Ban tổ chức mà chủ nhân
--      không biết mình đang ở đó. Người lạ gọi vào số sai một lần là không
--      quay lại trang nữa.
-- ══════════════════════════════════════════════════════════════════════════

-- Ngành nghề, tối đa 3 mã ngăn bằng dấu phẩy (vd 'van-tai,thuong-mai').
-- Danh mục mã nằm ở worker/src/lib/nganh.js và LÀ NGUỒN DUY NHẤT — giao diện
-- không tự chế danh sách, nó nhận qua API. Hai bản danh sách thì sớm muộn
-- lệch nhau, và triệu chứng là mã thô hiện ra màn hình chứ không phải lỗi.
ALTER TABLE member_profile ADD COLUMN nganh TEXT;

-- Bốn ô cũ giới hạn 80 ký tự — vừa đủ để người cùng nhóm nhớ ra nhau khi chia
-- việc, quá ngắn để thuyết phục một người lạ trên internet. Ô này dài hơn và
-- CHỈ dùng ở danh mục giao thương.
ALTER TABLE member_profile ADD COLUMN mo_ta TEXT;

-- Web hoặc trang bán hàng. Chỉ lưu URL, không giữ file (N2 nguyên vẹn).
ALTER TABLE member_profile ADD COLUMN website TEXT;

-- 0 = chỉ trong lớp (mặc định) · 1 = công khai ra internet.
ALTER TABLE member_profile ADD COLUMN cong_khai INTEGER NOT NULL DEFAULT 0;

-- Mốc bật công khai, do SQLite sinh (quy ước 1 CLAUDE.md — tuyệt đối không
-- ghi bằng Date.toISOString()). Giữ để trả lời được câu "tôi bật từ bao giờ".
ALTER TABLE member_profile ADD COLUMN cong_khai_luc TEXT;

-- Có hiện số điện thoại / email trên trang công khai không. Tách khỏi
-- cong_khai vì hai quyết định thật sự khác nhau: nhiều người muốn giới thiệu
-- việc mình làm nhưng chưa muốn số điện thoại nằm trên một trang ai cũng tải
-- về được. Bắt gộp làm một thì phần lớn sẽ chọn "thôi không bật".
ALTER TABLE member_profile ADD COLUMN hien_lien_he INTEGER NOT NULL DEFAULT 0;

-- Đường công khai lọc đúng cột này và là đường nóng duy nhất của bảng (mọi
-- truy vấn còn lại đều đi theo member_id, tức khoá chính).
CREATE INDEX ix_profile_cong_khai ON member_profile(cong_khai);
