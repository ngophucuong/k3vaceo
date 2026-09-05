#!/bin/bash
# Dựng dữ liệu cho kiem-moi.mjs (link mời xuyên nhóm, POST /api/danh-ba/:id/moi):
#   - roster 106 (Lê Thị Huế, Nhóm 9) CHƯA có hồ sơ nào — kiểm route tự tạo
#     đúng nhóm ghi trong danh sách gốc, và gọi lại lần hai ra token khác.
#   - roster 105 (Nguyễn Thị Hằng Nhi, Nhóm 8) ĐÃ nhận hồ sơ — kiểm việc phát
#     lại link mời cho người đã đăng nhập (mở rộng 5/9) và chốt chặn xác nhận
#     lại số điện thoại ở bước nhận (routes/invite.js).
#   - roster GIẢ "Kiểm Tra Không Số" (seq 9001, Nhóm 6) ĐÃ nhận hồ sơ nhưng
#     KHÔNG có số điện thoại nào — kiểm ca đã trả giá thật 5/9 (Đinh Khánh
#     Toàn, Nhóm 9): bắt gõ đúng một số không tồn tại là khoá vĩnh viễn.
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

-- Dọn sổ tần suất của đúng hai thùng kiem-moi.mjs sẽ đốt (đoán số điện thoại
-- khi phát lại link cho roster 105) — không dọn thì chạy lại trong cùng một
-- giờ là cộng dồn từ lượt trước, phép đếm-chính-xác-số-lần sẽ khoá SỚM một
-- lượt mà không phải do mã sai, chỉ vì sổ chưa sạch.
DELETE FROM rate_events WHERE bucket = 'doan_so_ho_so' AND ip = 'r105';
DELETE FROM rate_events WHERE bucket = 'doan_so_ip' AND ip = '203.0.113.90';

-- Ca 409: roster 105 (Nguyễn Thị Hằng Nhi, Nhóm 8) ĐÃ nhận hồ sơ.
INSERT INTO members (cohort_id, group_id, roster_id, full_name, title, company, phone,
                      claimed_at, is_active, created_at, updated_at)
SELECT r.cohort_id, g.id, r.id, r.full_name, r.title, r.company, r.phone,
       datetime('now'), 1, datetime('now'), datetime('now')
  FROM roster r JOIN groups g ON g.cohort_id = r.cohort_id AND g.label = r.group_label
 WHERE r.id = 105;

-- Ca 'chưa từng có số nào' (phát hiện thật 5/9, Đinh Khánh Toàn Nhóm 9): một
-- roster GIẢ (không dùng ai có thật, để không phụ thuộc id của bất kỳ ai)
-- không có phone, ĐÃ nhận hồ sơ — kiểm nhánh mới của xacNhanLaiSo() (routes/
-- invite.js): không có gì để đối chiếu thì KHÔNG chặn. seq 9001 nằm ngoài dải
-- thật (tối đa 146), không đụng SEQ_TOI_DA của scripts/data/phan-vai.csv.
DELETE FROM members WHERE roster_id IN (SELECT id FROM roster WHERE seq = 9001);
DELETE FROM roster WHERE seq = 9001;

INSERT INTO roster (cohort_id, seq, group_label, full_name, phone, source)
SELECT (SELECT id FROM cohorts WHERE code = 'K03'), 9001, 'Nhóm 6', 'Kiểm Tra Không Số', NULL, 'kiem-moi.mjs';

INSERT INTO members (cohort_id, group_id, roster_id, full_name, phone,
                      claimed_at, is_active, created_at, updated_at)
SELECT r.cohort_id, g.id, r.id, r.full_name, r.phone,
       datetime('now'), 1, datetime('now'), datetime('now')
  FROM roster r JOIN groups g ON g.cohort_id = r.cohort_id AND g.label = r.group_label
 WHERE r.seq = 9001;

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
