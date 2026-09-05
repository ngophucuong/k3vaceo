#!/bin/bash
# Dựng một phiên cố định cho Ngô Phú Cường (uỷ viên Ban cán sự lớp — đủ quyền
# đăng tư liệu cấp lớp) và dọn sạch mọi dòng links còn sót lại từ lần chạy
# trước của kiem-tulieu-text.mjs (nhận theo tiền tố tiêu đề KIEMTULIEU_).
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
DELETE FROM links WHERE title LIKE 'KIEMTULIEU\\_%' ESCAPE '\\';
DELETE FROM sessions WHERE member_id IN (SELECT id FROM members WHERE full_name = 'Ngô Phú Cường');
INSERT INTO sessions (member_id, token_hash, expires_at)
SELECT id, '$HASH_C', datetime('now', '+1 day')
  FROM members WHERE full_name = 'Ngô Phú Cường' AND is_active = 1;
" >/dev/null

nohup npx wrangler dev --port 8787 --local > /tmp/k3vaceo-dev.log 2>&1 &
until curl -sf -o /dev/null http://127.0.0.1:8787/api/health 2>/dev/null; do sleep 1; done
echo "đã reset và khởi động lại"
