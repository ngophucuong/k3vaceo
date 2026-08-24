-- Đợt 7: thông báo của NHÓM, dấu đã đọc, và đăng ký nhận thông báo đẩy.
--
-- ══ LỆCH NGUYÊN TẮC N1, CÓ CHỦ Ý ══
-- Mục 1.3 SRS ghi "không thông báo đẩy", và mục 1.4 xếp nó ngoài phạm vi v1.
-- Ngày 24/8 Ngô Phú Cường quyết định làm, sau khi đã được nêu rõ đây là đổi
-- bản chất sản phẩm chứ không phải thêm tính năng. Ghi lại ở đây để người sau
-- biết đó là một quyết định, không phải một chỗ quên.
--
-- Phần còn lại của N1 GIỮ NGUYÊN: vẫn không có chat. Thông báo đẩy chỉ mang
-- đúng một việc — "có thông báo mới, mở ứng dụng ra xem" — chứ không thành
-- một kênh nhắn tin thứ hai bên cạnh Zalo.

-- ── Thông báo nay có hai cấp ──
-- group_id NULL  = thông báo của LỚP, cả khoá đọc  (Ban cán sự lớp đăng)
-- group_id có số = thông báo của NHÓM ấy           (trưởng/phó nhóm đăng)
ALTER TABLE thong_bao ADD COLUMN group_id INTEGER REFERENCES groups(id);
CREATE INDEX ix_thongbao_nhom ON thong_bao(cohort_id, group_id, het_han);

-- ── Dấu đã đọc ──
-- Một cột thay vì một bảng nối: cái cần biết chỉ là "người này đã xem tới
-- thông báo nào". Bảng nối cho phép đánh dấu đọc từng cái một, nhưng không ai
-- dùng tới mức ấy, mà lại thêm một dòng cho mỗi cặp người × thông báo — 134
-- người thì phình rất nhanh.
--
-- Ghi theo ID chứ KHÔNG theo mốc thời gian. Bản đầu ghi mốc thời gian và có
-- lỗ thật, phép kiểm bắt được ngay: datetime('now') của SQLite chỉ tới GIÂY,
-- nên thông báo đăng đúng giây người ta vừa bấm xem sẽ có created_at BẰNG mốc
-- ấy — mà so sánh phải là ">" chặt (dùng ">=" thì mọi tin vừa đọc lại sáng
-- lên). Tin ấy im lặng biến mất khỏi chấm đỏ. ID thì tăng đơn điệu, không có
-- chuyện hai cái bằng nhau.
ALTER TABLE members ADD COLUMN thong_bao_xem_id INTEGER;

-- ── Đăng ký nhận thông báo đẩy ──
-- Một người có nhiều thiết bị (điện thoại, máy tính), mỗi thiết bị một dòng.
-- endpoint là URL do trình duyệt cấp và là khoá thật sự — UNIQUE ở đó để cùng
-- một máy đăng ký lại nhiều lần cũng chỉ có một dòng.
CREATE TABLE push_subscriptions (
  id          INTEGER PRIMARY KEY,
  member_id   INTEGER NOT NULL REFERENCES members(id),
  endpoint    TEXT    NOT NULL UNIQUE,
  p256dh      TEXT    NOT NULL,          -- khoá công khai của trình duyệt
  auth        TEXT    NOT NULL,          -- bí mật xác thực, dùng khi mã hoá
  user_agent  TEXT,
  created_at  TEXT DEFAULT (datetime('now')),
  last_ok_at  TEXT,                      -- lần gần nhất máy chủ đẩy nhận
  last_error  TEXT,                      -- câu từ chối gần nhất, để lần ra
  -- Máy chủ đẩy trả 404/410 nghĩa là đăng ký chết hẳn (gỡ app, xoá dữ liệu).
  -- Đánh dấu chứ không xoá: còn lần được vì sao một người thôi nhận thông báo.
  disabled_at TEXT
);
CREATE INDEX ix_push_member ON push_subscriptions(member_id, disabled_at);
