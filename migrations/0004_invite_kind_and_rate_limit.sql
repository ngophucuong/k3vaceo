-- Đợt 2 — hai bổ sung nhỏ ngoài DDL gốc mục 3 SRS, đều có lý do:
--
-- 1) invites.kind — SRS mô tả bảng invites cho link mời (mục 4.1) rồi mục 4.2
--    thêm magic link đăng nhập lại. Hai loại khác hẳn nhau về vòng đời: link
--    mời hạn 14 ngày dùng nhiều lần, magic link hạn 15 phút dùng một lần.
--    Không tách loại thì một magic link đem dán vào /i/{token} sẽ chạy như
--    lời mời nhiều lần, tức là "dùng một lần" chỉ còn trên giấy.
--
-- 2) rate_events — mục 8 SRS yêu cầu "20 lần thử token mời mỗi IP mỗi giờ".
--    Không có KV/Durable Object trong phạm vi công cụ này nên đếm bằng D1.

ALTER TABLE invites ADD COLUMN kind TEXT NOT NULL DEFAULT 'invite';  -- invite | magic

CREATE TABLE rate_events (
  id INTEGER PRIMARY KEY,
  bucket TEXT NOT NULL,        -- 'invite_try' | 'magic_request'
  ip TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX ix_rate_events ON rate_events(bucket, ip, created_at);
