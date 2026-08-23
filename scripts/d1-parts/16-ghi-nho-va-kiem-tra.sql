-- k3vaceo — tệp 16/16: đánh dấu đã áp + kiểm tra kết quả
-- Dán cả tệp vào Console D1 rồi Execute. Chạy lại nhiều lần vẫn đúng.
-- Sinh tự động bởi scripts/build-d1-parts.mjs — đừng sửa tay.

CREATE TABLE IF NOT EXISTS d1_migrations(
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT UNIQUE,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
INSERT OR IGNORE INTO d1_migrations (name) VALUES
  ('0001_init.sql'),
  ('0002_seed_roster.sql'),
  ('0003_seed_group6.sql'),
  ('0004_invite_kind_and_rate_limit.sql'),
  ('0005_webauthn_challenges.sql'),
  ('0006_wizard_and_presentation.sql');

-- Kiểm tra: dán tiếp scripts/verify-d1.sql — một dòng, cột cuối "ket_qua"
-- phải là "ĐÚNG HẾT".
