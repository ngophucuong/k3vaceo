#!/bin/bash
# Trả môi trường về mốc đầu cho kiem-tanso.mjs, và gieo sẵn 30 lời mời còn hạn.
# Phải dừng dev server trước: chạm D1 lúc nó đang chạy là nó chết (CLAUDE.md).
#
# Bộ kiểm tần suất TỰ ĐỔI trạng thái (nhận hồ sơ, đốt hạn mức, tiêu lời mời)
# nên không chạy lại được nếu không reset — điểm 3 trong scripts/kiem/README.md.
set -e
cd "$(dirname "$0")/../../worker"

# Dừng dev server cho SẠCH. `fuser -k -n tcp 8787` KHÔNG đủ: wrangler đẻ một
# tiến trình workerd con giữ cổng, giết mỗi cái nghe cổng thì cái kia sống sót
# và lần khởi động sau chồng lên. Đã có lần chín tiến trình cùng chạy, mỗi cái
# một bản D1 riêng — bộ kiểm reset ở bản này rồi đọc kết quả ở bản kia, đỏ
# những phép đáng lẽ xanh. Mất một lúc mới nhìn ra.
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

node ../scripts/kiem/gieo-moi.mjs

npx wrangler d1 execute k3vaceo --local --command "
DELETE FROM rate_events;
DELETE FROM sessions;
DELETE FROM members WHERE roster_id BETWEEN 1 AND 60
   AND group_id <> (SELECT id FROM groups WHERE cohort_id = 1 AND no = 6);
UPDATE members SET claimed_at = NULL, email = NULL, email_verified_at = NULL, is_active = 1
 WHERE roster_id BETWEEN 1 AND 60 AND full_name <> 'Ngô Phú Cường';
INSERT INTO members (cohort_id, group_id, roster_id, full_name, phone, is_active, created_at, updated_at)
SELECT r.cohort_id, (SELECT id FROM groups WHERE cohort_id = r.cohort_id AND label = r.group_label),
       r.id, r.full_name, r.phone, 0, datetime('now'), datetime('now')
  FROM roster r WHERE r.id = 57;
-- Ca 'chưa đăng nhập nhưng ĐÃ có email': xảy ra thật khi ai đó bỏ ngang đường
-- OTP (/api/onboard/start tạo hồ sơ với email mà chưa đặt claimed_at), hoặc khi
-- trưởng nhóm thêm người kèm email. Không gieo thì phép kiểm 'email bị che'
-- trong kiem-danhba.mjs xanh một cách rỗng tuếch — không có email nào để che.
INSERT INTO members (cohort_id, group_id, roster_id, full_name, phone, email, is_active, created_at, updated_at)
SELECT r.cohort_id, (SELECT id FROM groups WHERE cohort_id = r.cohort_id AND label = r.group_label),
       r.id, r.full_name, r.phone, 'bo.ngang@kiemtra.vn', 1, datetime('now'), datetime('now')
  FROM roster r WHERE r.id = 58;
" >/dev/null
npx wrangler d1 execute k3vaceo --local --file /tmp/moi-tanso.sql >/dev/null

nohup npx wrangler dev --port 8787 --local > /tmp/k3vaceo-dev.log 2>&1 &
until curl -sf -o /dev/null http://127.0.0.1:8787/api/health 2>/dev/null; do sleep 1; done
echo "đã reset và khởi động lại"
