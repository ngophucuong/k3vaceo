-- Đợt 5 — tự nhận diện bằng tên + số điện thoại, rồi OTP 6 số qua email.
--
-- Vì sao KHÔNG nhét mã OTP vào bảng invites như magic link: cột
-- invites.token_hash là UNIQUE. Mã 6 số chỉ có một triệu khả năng, nên cùng
-- một người xin mã nhiều lần là có ngày trùng mã → trùng hash → vỡ ràng buộc
-- UNIQUE ngay giữa luồng đăng nhập. Thêm nữa OTP cần đếm số lần nhập sai, thứ
-- mà invites không có. Tách bảng riêng là đúng bản chất.
CREATE TABLE otp_codes (
  id         INTEGER PRIMARY KEY,
  member_id  INTEGER NOT NULL,
  code_hash  TEXT NOT NULL,              -- sha256("<member_id>:<mã 6 số>")
  attempts   INTEGER NOT NULL DEFAULT 0, -- nhập sai mấy lần; quá ngưỡng thì mã chết
  expires_at TEXT NOT NULL,
  used_at    TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Tra "mã còn sống mới nhất của người này" — đường truy vấn duy nhất khi xác
-- minh, chạy mỗi lần ai đó gõ 6 số.
CREATE INDEX ix_otp_member ON otp_codes(member_id, used_at, expires_at);

-- Mốc chứng minh chính chủ cầm hộp thư đó, khác hẳn "có điền email".
-- Nút đăng ký passkey chỉ hiện khi cột này khác NULL.
ALTER TABLE members ADD COLUMN email_verified_at TEXT;

-- Ngô Phú Cường đã nhận và mở thư đăng nhập thật ngày 24/8 (magic link của
-- Đợt 2, trước khi có cột này), tức đã chứng minh cầm hộp thư. Không đánh dấu
-- thì chính người dựng lại là người duy nhất không đăng ký được passkey.
UPDATE members
   SET email_verified_at = datetime('now')
 WHERE email IS NOT NULL AND claimed_at IS NOT NULL;
