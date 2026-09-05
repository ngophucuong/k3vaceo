#!/bin/bash
# Dựng phiên cố định cho Ngô Phú Cường (Nhóm 6) và một bộ "tám phần" tối
# thiểu cho Nhóm 7 — chỉ để có một plan_sections.id THẬT SỰ thuộc nhóm khác,
# dùng kiểm chốt chặn N6 của docSectionId() (routes/links.js). Nhóm 7 bình
# thường chỉ có bộ phần này sau khi wizard chạy (start-wizard.js); ở D1 cục
# bộ mới nạp thì chỉ Nhóm 6 có sẵn (migration 0003), nên bộ kiểm liên thông
# Bài↔Tư liệu cần script riêng seed thêm, không dùng chung reset-tulieu-text.sh.
#
# Dọn mọi dòng links còn sót từ lần chạy trước của kiem-tulieu-bai.mjs /
# pw-tulieu-bai.mjs (tiền tố tiêu đề KIEMBAI_).
# Phải dừng dev server trước: chạm D1 lúc nó đang chạy là nó chết (CLAUDE.md).
set -e
cd "$(dirname "$0")/../../worker"

dung_server() {
  pkill -f "wrangler dev" 2>/dev/null || true
  pkill -f workerd 2>/dev/null || true
  for _ in $(seq 1 20); do
    curl -sf -o /dev/null -m 1 http://127.0.0.1:8787/api/health 2>/dev/null || return 0
    sleep 1
  done
  echo "CẢNH BÁO: cổng 8787 vẫn có người trả lời" >&2
}

dung_server

TOK_C="tk-cuong-tulieu-text"
HASH_C=$(printf '%s' "$TOK_C" | sha256sum | cut -d' ' -f1)

npx wrangler d1 execute k3vaceo --local --command "
DELETE FROM links WHERE title LIKE 'KIEMBAI\\_%' ESCAPE '\\';
DELETE FROM sessions WHERE member_id IN (SELECT id FROM members WHERE full_name = 'Ngô Phú Cường');
INSERT INTO sessions (member_id, token_hash, expires_at)
SELECT id, '$HASH_C', datetime('now', '+1 day')
  FROM members WHERE full_name = 'Ngô Phú Cường' AND is_active = 1;
INSERT INTO plans (group_id)
  SELECT 7 WHERE NOT EXISTS (SELECT 1 FROM plans WHERE group_id = 7);
INSERT INTO plan_sections (plan_id, ord, title, requirement, pct)
  SELECT p.id, 0, 'Phần của Nhóm 7 (chỉ để kiểm N6)', 'yêu cầu', 0
    FROM plans p WHERE p.group_id = 7
      AND NOT EXISTS (SELECT 1 FROM plan_sections WHERE plan_id = p.id);
" >/dev/null

nohup npx wrangler dev --port 8787 --local > /tmp/k3vaceo-dev.log 2>&1 &
until curl -sf -o /dev/null http://127.0.0.1:8787/api/health 2>/dev/null; do sleep 1; done
echo "đã reset và khởi động lại"
