#!/bin/bash
# Dựng dữ liệu cho kiem-mail-thongbao.mjs (thư khi có thông báo mới).
#
# Cần HAI phiên, không phải một: phép kiểm đáng giá nhất của tính năng này là
# "tắt một người thì con số người nhận giảm đúng một" — mà công tắc là của
# CHÍNH CHỦ (N5), không ai bật/tắt hộ được. Không có phiên thứ hai thì không
# có cách nào chứng minh chốt ấy chạy.
#
# Phải dừng dev server trước: chạm D1 lúc nó đang chạy là nó chết (CLAUDE.md).
set -e
# Chốt đường dẫn TRƯỚC khi cd — sau cd thì $0 tương đối trỏ vào hư không.
KIEM=$(cd "$(dirname "$0")" && pwd)
cd "$KIEM/../../worker"

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

HASH_A=$(printf '%s' "tk-cuong-mailtb" | sha256sum | cut -d' ' -f1)
HASH_B=$(printf '%s' "tk-bandong-mailtb" | sha256sum | cut -d' ' -f1)

npx wrangler d1 execute k3vaceo --local --command "
DELETE FROM thong_bao WHERE noi_dung LIKE 'KIEMMAIL\_%' ESCAPE '\';
DELETE FROM sessions WHERE token_hash IN ('$HASH_A', '$HASH_B');

-- Người A: Ngô Phú Cường — trưởng Nhóm 6 VÀ uỷ viên cấp lớp, nên đăng được cả
-- thông báo nhóm lẫn thông báo lớp. Một phiên là đủ cho cả hai cấp.
INSERT INTO sessions (member_id, token_hash, expires_at)
SELECT id, '$HASH_A', datetime('now', '+1 day')
  FROM members WHERE full_name = 'Ngô Phú Cường' AND is_active = 1;

-- Người B: một người khác CÙNG Nhóm 6, đang hoạt động và CÓ email — tức đang
-- nằm trong danh sách nhận thư của mọi thông báo Nhóm 6. Chọn theo truy vấn
-- chứ không ghi cứng tên: dữ liệu cục bộ mỗi lần nạp lại một khác.
INSERT INTO sessions (member_id, token_hash, expires_at)
SELECT id, '$HASH_B', datetime('now', '+1 day')
  FROM members
 WHERE is_active = 1 AND COALESCE(email, '') <> ''
   AND group_id = (SELECT group_id FROM members WHERE full_name = 'Ngô Phú Cường')
   AND full_name <> 'Ngô Phú Cường'
 LIMIT 1;

-- Nhóm 6 cục bộ chỉ có một người vừa hoạt động vừa có email, nên phép tắt-một-
-- người-thì-giảm-đúng-một sẽ đo 1 xuống 0 — đúng nhưng yếu, vì 0 cũng là con
-- số một hàm hỏng hoàn toàn trả về. Gieo thêm email cho hai người nữa trong
-- nhóm để phép ấy đo trên số dương ở cả hai đầu.
--
-- (Không dùng dấu nháy kép trong khối SQL này: nó nằm trong chuỗi
--  --command "..." của bash, một dấu nháy kép là cắt chuỗi ngay tại đó và
--  wrangler báo Unknown arguments. Đã vấp ở reset-moi.sh, xem CLAUDE.md.)
UPDATE members SET email = 'kiemmail' || id || '@vidu.test'
 WHERE is_active = 1 AND COALESCE(email,'') = ''
   AND group_id = (SELECT group_id FROM members WHERE full_name = 'Ngô Phú Cường')
   AND id IN (
     SELECT id FROM members
      WHERE is_active = 1 AND COALESCE(email,'') = ''
        AND group_id = (SELECT group_id FROM members WHERE full_name = 'Ngô Phú Cường')
      LIMIT 2);

-- Công tắc phải BẬT hết trước khi đo, không thì lượt chạy trước để lại một
-- người đang tắt và con số nền lệch đi một — đúng loại lỗi làm phép kiểm đỏ
-- mà chẳng phải do mã sai.
UPDATE members SET nhan_mail_thong_bao = 1;
" >/dev/null

# MẪU SỐ đọc TRƯỚC khi dựng server, ghi ra tệp cho bộ kiểm đọc.
#
# Không phải để chạy nhanh hơn: `wrangler dev` GIỮ KHOÁ tệp SQLite từ lúc khởi
# động (CLAUDE.md), nên gọi `wrangler d1 execute --local` trong lúc bộ kiểm
# đang chạy sẽ cắt ngang kết nối HTTP đang mở — bộ kiểm chết giữa chừng với
# `UND_ERR_SOCKET: other side closed` và trông y như máy chủ sập. Đã vấp một
# lần khi viết bộ kiểm này.
#
# Con số phải đọc ĐỘC LẬP với chính mã đang kiểm: hỏi API "có bao nhiêu người
# nhận" rồi so với chính nó thì phép kiểm không có răng.
NHOM6="(SELECT group_id FROM members WHERE full_name = 'Ngô Phú Cường')"
IDA="(SELECT id FROM members WHERE full_name = 'Ngô Phú Cường' AND is_active = 1)"
DUOC="m.is_active = 1 AND COALESCE(m.email,'') <> '' AND m.nhan_mail_thong_bao = 1
      AND m.cohort_id = (SELECT cohort_id FROM members WHERE id = $IDA)"

npx wrangler d1 execute k3vaceo --local --json --command "
SELECT $IDA AS id_a,
       (SELECT COUNT(*) FROM members m WHERE $DUOC AND m.id <> $IDA AND m.group_id = $NHOM6) AS mon_nhom,
       (SELECT COUNT(*) FROM members m WHERE $DUOC AND m.id <> $IDA) AS mon_lop,
       (SELECT COUNT(*) FROM members m WHERE $DUOC) AS mon_lop_ke_ca_minh
" | sed -n '/^\[/,$p' | jq '.[0].results[0]' > "$KIEM/mail-mau-so.json"
cat "$KIEM/mail-mau-so.json"

nohup npx wrangler dev --port 8787 --local > /tmp/k3vaceo-dev.log 2>&1 &
until curl -sf -o /dev/null http://127.0.0.1:8787/api/health 2>/dev/null; do sleep 1; done
echo "đã reset và khởi động lại"
