#!/bin/bash
# Trả hai hồ sơ thử về "chưa ai nhận" để bộ kiểm chạy lại được nhiều lần.
# Phải dừng dev server trước: chạm D1 lúc nó đang chạy là nó chết (CLAUDE.md).
cd "$(dirname "$0")/../../worker"
fuser -k -n tcp 8787 2>/dev/null; sleep 1
npx wrangler d1 execute k3vaceo --local --command "
DELETE FROM sessions; DELETE FROM rate_events; DELETE FROM credentials;
UPDATE members SET claimed_at=NULL, email=NULL, email_verified_at=NULL
 WHERE roster_id IN (67, 68);
" >/dev/null 2>&1
nohup npx wrangler dev --port 8787 --local > /tmp/k3vaceo-dev.log 2>&1 &
until curl -sf -o /dev/null http://127.0.0.1:8787/api/health 2>/dev/null; do sleep 1; done
echo "đã reset và khởi động lại"
