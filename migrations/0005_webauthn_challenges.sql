-- Đợt 3 — passkey (mục 4.3 SRS).
--
-- Bảng credentials đã có sẵn từ 0001. Chỗ còn thiếu là nơi giữ challenge giữa
-- hai chặng của WebAuthn: máy chủ sinh challenge, trình duyệt mang đi ký, rồi
-- gửi lại — phải so đúng challenge đã phát ra, nếu không thì chữ ký cũ đem
-- dùng lại được. Không giữ trong bộ nhớ Worker được vì mỗi request có thể rơi
-- vào một isolate khác.
--
-- member_id để NULL khi đăng nhập: lúc đó chưa biết người dùng là ai, danh
-- tính lấy từ userHandle mà chính passkey trả về.

CREATE TABLE webauthn_challenges (
  id TEXT PRIMARY KEY,            -- handle trả cho trình duyệt, gửi lại ở chặng sau
  member_id INTEGER,              -- NULL khi đăng nhập
  challenge TEXT NOT NULL,
  kind TEXT NOT NULL,             -- register | authenticate
  created_at TEXT DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL
);
CREATE INDEX ix_webauthn_challenges_exp ON webauthn_challenges(expires_at);

CREATE INDEX ix_credentials_member ON credentials(member_id);
CREATE INDEX ix_fund_declarations_round ON fund_declarations(round_id);
CREATE INDEX ix_fund_rounds_scope ON fund_rounds(cohort_id, scope, group_id, status);
