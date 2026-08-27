-- Tư liệu buổi 27/8/2026 — thư mục Drive của Ban tổ chức, Ngô Phú Cường cung
-- cấp ngày 26/8. Gắn thẳng vào buổi học bằng cột links.buoi_id (migration
-- 0014), nên nó hiện ở CẢ tab Tư liệu lẫn dưới buổi 27/8 ở tab Hôm nay —
-- vẫn đúng một dòng, không phải hai bản ghi.
--
-- ĐƯỜNG DẪN ĐÃ BỎ ĐOẠN `/u/0/`. Người dùng đưa link dạng
--   https://drive.google.com/drive/u/0/folders/1nDk…
-- `/u/0/` nghĩa là "tài khoản Google thứ nhất đang đăng nhập trên máy này".
-- Ai đang đăng nhập hai tài khoản (rất phổ biến với người đi làm: một cá nhân,
-- một công ty) sẽ bị Drive ép mở bằng đúng tài khoản thứ nhất — và nếu thư mục
-- chia sẻ cho tài khoản kia thì họ nhận "Bạn cần có quyền truy cập", dù họ có
-- quyền thật. Bỏ `/u/0/` đi thì Google tự chọn tài khoản đúng.
-- Ba thư mục nạp ở migration 0013 cũng đều ở dạng đã bỏ, giữ cho nhất quán.
--
-- Tra buổi theo NGÀY chứ không ghi cứng id: id của lich_hoc trên D1 thật do
-- migration 0011 sinh ra, không có gì bảo đảm nó bằng id ở bản cục bộ.
INSERT INTO links (cohort_id, scope, group_id, buoi_id, url, title, kind, tag,
                   created_by, created_at)
SELECT b.cohort_id, 'class', NULL, b.id,
       'https://drive.google.com/drive/folders/1nDkH0eg7ANLYGt8BmB9H1BvPiTxnZoiM',
       'Tài liệu buổi sáng 27/8 — Chính sách thuế',
       'DRIVE', 'buoi',
       (SELECT id FROM members WHERE full_name = 'Ngô Phú Cường' AND is_active = 1 LIMIT 1),
       datetime('now')
  FROM lich_hoc b
  JOIN cohorts c ON c.id = b.cohort_id AND c.code = 'K03'
 WHERE b.ngay = '2026-08-27'
   -- Chạy lại không nhân đôi. Migration chỉ chạy một lần, nhưng câu này cũng
   -- có thể bị dán tay vào Console D1 — và ở đó không có gì chặn.
   AND NOT EXISTS (
     SELECT 1 FROM links l
      WHERE l.buoi_id = b.id AND l.removed_at IS NULL
        AND l.url LIKE '%1nDkH0eg7ANLYGt8BmB9H1BvPiTxnZoiM%'
   )
 LIMIT 1;
