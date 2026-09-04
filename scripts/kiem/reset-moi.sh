#!/bin/bash
# Dựng dữ liệu cho kiem-moi.mjs (link mời xuyên nhóm, POST /api/danh-ba/:id/moi):
#   - roster 106 (Lê Thị Huế, Nhóm 9) CHƯA có hồ sơ nào — kiểm route tự tạo
#     đúng nhóm ghi trong danh sách gốc, và gọi lại lần hai ra token khác.
#   - roster 105 (Nguyễn Thị Hằng Nhi, Nhóm 8) ĐÃ nhận hồ sơ — kiểm chốt chặn
#     da_nhan_cho.
#   - hai phiên cố định: Ngô Phú Cường (uỷ viên Ban cán sự lớp, migration 0013)
#     và Nguyễn Thị Thu Hương (thành viên thường Nhóm 6, không giữ vai gì) —
#     để so 200 với 403.
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

# Token cố định — hash bằng sha256sum có sẵn, đỡ phải gọi node riêng cho việc
# này. kiem-moi.mjs đọc đúng hai chuỗi này để dựng cookie phiên.
TOK_C="tk-cuong-moi-xuyennhom"
TOK_T="tk-thuong-moi-xuyennhom"
HASH_C=$(printf '%s' "$TOK_C" | sha256sum | cut -d' ' -f1)
HASH_T=$(printf '%s' "$TOK_T" | sha256sum | cut -d' ' -f1)

npx wrangler d1 execute k3vaceo --local --command "
DELETE FROM sessions WHERE member_id IN (
  SELECT id FROM members WHERE full_name IN ('Ngô Phú Cường', 'Nguyễn Thị Thu Hương')
);
DELETE FROM invites WHERE member_id IN (SELECT id FROM members WHERE roster_id IN (105, 106));
DELETE FROM members WHERE roster_id IN (105, 106);

-- Ca 409: roster 105 (Nguyễn Thị Hằng Nhi, Nhóm 8) ĐÃ nhận hồ sơ.
INSERT INTO members (cohort_id, group_id, roster_id, full_name, title, company, phone,
                      claimed_at, is_active, created_at, updated_at)
SELECT r.cohort_id, g.id, r.id, r.full_name, r.title, r.company, r.phone,
       datetime('now'), 1, datetime('now'), datetime('now')
  FROM roster r JOIN groups g ON g.cohort_id = r.cohort_id AND g.label = r.group_label
 WHERE r.id = 105;

INSERT INTO sessions (member_id, token_hash, expires_at)
SELECT id, '$HASH_C', datetime('now', '+1 day')
  FROM members WHERE full_name = 'Ngô Phú Cường' AND is_active = 1;
INSERT INTO sessions (member_id, token_hash, expires_at)
SELECT id, '$HASH_T', datetime('now', '+1 day')
  FROM members WHERE full_name = 'Nguyễn Thị Thu Hương' AND is_active = 1;
" >/dev/null

nohup npx wrangler dev --port 8787 --local > /tmp/k3vaceo-dev.log 2>&1 &
until curl -sf -o /dev/null http://127.0.0.1:8787/api/health 2>/dev/null; do sleep 1; done
echo "đã reset và khởi động lại"
