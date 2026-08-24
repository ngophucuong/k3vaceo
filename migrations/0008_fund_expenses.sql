-- Đợt 6: sổ chi của quỹ.
--
-- Lệch có chủ ý so với DDL nguyên văn mục 3 SRS: SRS chỉ tả phần THU
-- (fund_rounds + fund_declarations). Thực tế quỹ lớp và quỹ nhóm còn phải chi
-- ra, và nếu không ghi được khoản chi thì "số dư quỹ" là con số không ai tính
-- được — người giữ tiền phải kê tay ra Zalo, đúng cái mà nguyên tắc N1 muốn
-- tránh (Zalo để bàn, ứng dụng để chốt).
--
-- Ba quyết định thiết kế, ghi lại để sau khỏi phải đoán:
--
-- 1. Khoản chi gắn vào PHẠM VI (quỹ lớp / quỹ của một nhóm), không bắt buộc
--    gắn vào một đợt thu. Quỹ là một cái nồi chảy liên tục: tiền thu đợt 1 có
--    thể tiêu ở tuần thứ ba. Cột round_id vẫn có, để trống được, chỉ dùng khi
--    người ghi muốn nói rõ "khoản này tiêu từ đợt thu ấy".
--
-- 2. receipt_url là URL, không phải tệp — nguyên tắc N2, ứng dụng không giữ
--    file. Ảnh hoá đơn để trên Drive rồi dán đường dẫn vào đây.
--
-- 3. Không có bước duyệt chi. Nguyên tắc N4 — tự giác là chính. Ai ghi, ghi
--    lúc nào, sửa gì đều nằm trong audit_log và hiện công khai cho cả phạm vi
--    đó xem; minh bạch thay cho phê duyệt.

CREATE TABLE fund_expenses (
  id          INTEGER PRIMARY KEY,
  cohort_id   INTEGER NOT NULL REFERENCES cohorts(id),
  scope       TEXT    NOT NULL CHECK (scope IN ('class', 'group')),
  group_id    INTEGER REFERENCES groups(id),
  round_id    INTEGER REFERENCES fund_rounds(id),
  title       TEXT    NOT NULL,
  category    TEXT,
  amount      INTEGER NOT NULL CHECK (amount > 0),
  spent_on    TEXT,
  payee       TEXT,
  note        TEXT,
  receipt_url TEXT,
  created_by  INTEGER NOT NULL REFERENCES members(id),
  created_at  TEXT DEFAULT (datetime('now')),
  updated_at  TEXT,

  -- Quỹ nhóm bắt buộc có group_id, quỹ lớp bắt buộc không có: chặn ngay ở
  -- lược đồ để không bao giờ có khoản chi "lơ lửng" không thuộc sổ nào.
  CHECK ((scope = 'group' AND group_id IS NOT NULL) OR (scope = 'class' AND group_id IS NULL))
);

CREATE INDEX ix_expense_scope ON fund_expenses(cohort_id, scope, group_id, spent_on);
CREATE INDEX ix_expense_round ON fund_expenses(round_id);
