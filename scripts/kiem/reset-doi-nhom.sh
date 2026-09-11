#!/bin/bash
# Dựng dữ liệu cho kiem-doi-nhom.mjs (xin đổi nhóm, routes/doi-nhom.js).
#
#   - Ngô Phú Cường (trưởng nhóm Nhóm 6, có sẵn) — dùng để kiểm "đang giữ chức
#     thì không xin đổi nhóm được" (409 dang_giu_chuc_nhom), không cần dựng gì
#     thêm vì anh vốn đã là officer trong dữ liệu seed.
#   - Nguyễn Thị Thu Hương (thành viên thường Nhóm 6, có sẵn, không giữ vai
#     gì — cùng fixture reset-moi.sh dùng) — người NỘP đơn xin đổi nhóm.
#   - Hai hồ sơ GIẢ, không phụ thuộc ai có thật (đúng khuôn "Kiểm Tra Không Số"
#     của reset-moi.sh): "Kiểm Đổi Nhóm Đích" giữ phó nhóm Nhóm 7 (nhóm ĐÍCH
#     trong đơn xin của Nguyễn Thị Thu Hương), "Kiểm Đổi Nhóm Khác" giữ phó
#     nhóm Nhóm 8 (một nhóm KHÁC hẳn, dùng để chứng minh N6: officer của nhóm
#     không liên quan phải nhận 404 khi cố duyệt/từ chối đơn không nhắm vào
#     nhóm mình — không có Nhóm 7/8 nào có officer thật trong dữ liệu seed nên
#     phải tự dựng, không dò được ai có sẵn).
#
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

TOK_CUONG="tk-cuong-doinhom"
TOK_HUONG="tk-huong-doinhom"
TOK_DICH="tk-truong-dich-doinhom"
TOK_KHAC="tk-truong-khac-doinhom"
HASH_CUONG=$(printf '%s' "$TOK_CUONG" | sha256sum | cut -d' ' -f1)
HASH_HUONG=$(printf '%s' "$TOK_HUONG" | sha256sum | cut -d' ' -f1)
HASH_DICH=$(printf '%s' "$TOK_DICH" | sha256sum | cut -d' ' -f1)
HASH_KHAC=$(printf '%s' "$TOK_KHAC" | sha256sum | cut -d' ' -f1)

npx wrangler d1 execute k3vaceo --local --command "
-- Dọn fixture cũ của CHÍNH bộ kiểm này, chạy lại được nhiều lần.
--
-- QUAN TRỌNG: kiem-doi-nhom.mjs THẬT SỰ duyệt một đơn và đổi group_id của
-- Nguyễn Thị Thu Hương (Nhóm 6 → Nhóm 7) — đó chính là điều nó kiểm. Lượt
-- chạy trước để lại cô ấy đang ở Nhóm 7, nên phải trả về Nhóm 6 TRƯỚC khi làm
-- gì khác, không thì lượt hai nộp 'den_nhom_so: 7' sẽ vỡ ngay ở da_o_nhom_nay
-- (đã tự vấp đúng lỗi này khi chạy lại lần đầu — bộ kiểm phải chạy lại được
-- nhiều lần, xem README mục 3).
UPDATE members SET group_id =
  (SELECT id FROM groups WHERE cohort_id = (SELECT id FROM cohorts WHERE code = 'K03') AND no = 6),
  updated_at = datetime('now')
 WHERE full_name = 'Nguyễn Thị Thu Hương';
DELETE FROM yeu_cau_doi_nhom WHERE member_id IN (
  SELECT id FROM members WHERE full_name IN ('Nguyễn Thị Thu Hương', 'Kiểm Đổi Nhóm Đích', 'Kiểm Đổi Nhóm Khác')
);
DELETE FROM officers WHERE member_id IN (
  SELECT id FROM members WHERE full_name LIKE 'Kiểm Đổi Nhóm%'
);
DELETE FROM sessions WHERE member_id IN (
  SELECT id FROM members WHERE full_name IN ('Ngô Phú Cường', 'Nguyễn Thị Thu Hương', 'Kiểm Đổi Nhóm Đích', 'Kiểm Đổi Nhóm Khác')
);
DELETE FROM members WHERE full_name LIKE 'Kiểm Đổi Nhóm%';

-- Hai officer giả, roster_id để NULL (mục 'NULL nếu người mới không có trong
-- danh sách', migration 0001) — không cần dòng roster nào, chỉ cần một
-- members.id thật gắn đúng group_id và một dòng officers trỏ tới nó.
INSERT INTO members (cohort_id, group_id, full_name, claimed_at, is_active, created_at, updated_at)
SELECT (SELECT id FROM cohorts WHERE code = 'K03'),
       (SELECT id FROM groups WHERE cohort_id = (SELECT id FROM cohorts WHERE code = 'K03') AND no = 7),
       'Kiểm Đổi Nhóm Đích', datetime('now'), 1, datetime('now'), datetime('now');
INSERT INTO members (cohort_id, group_id, full_name, claimed_at, is_active, created_at, updated_at)
SELECT (SELECT id FROM cohorts WHERE code = 'K03'),
       (SELECT id FROM groups WHERE cohort_id = (SELECT id FROM cohorts WHERE code = 'K03') AND no = 8),
       'Kiểm Đổi Nhóm Khác', datetime('now'), 1, datetime('now'), datetime('now');

INSERT INTO officers (cohort_id, group_id, role, member_id, note, effective_from, recorded_by, created_at)
SELECT cohort_id, group_id, 'pho_nhom', id, 'kiem-doi-nhom.mjs', date('now'), id, datetime('now')
  FROM members WHERE full_name IN ('Kiểm Đổi Nhóm Đích', 'Kiểm Đổi Nhóm Khác');

INSERT INTO sessions (member_id, token_hash, expires_at)
SELECT id, '$HASH_CUONG', datetime('now', '+1 day') FROM members WHERE full_name = 'Ngô Phú Cường' AND is_active = 1;
INSERT INTO sessions (member_id, token_hash, expires_at)
SELECT id, '$HASH_HUONG', datetime('now', '+1 day') FROM members WHERE full_name = 'Nguyễn Thị Thu Hương' AND is_active = 1;
INSERT INTO sessions (member_id, token_hash, expires_at)
SELECT id, '$HASH_DICH', datetime('now', '+1 day') FROM members WHERE full_name = 'Kiểm Đổi Nhóm Đích' AND is_active = 1;
INSERT INTO sessions (member_id, token_hash, expires_at)
SELECT id, '$HASH_KHAC', datetime('now', '+1 day') FROM members WHERE full_name = 'Kiểm Đổi Nhóm Khác' AND is_active = 1;

-- Gán Nguyễn Thị Thu Hương giữ phần bài cuối (ord=7, 'Kế hoạch Dự phòng rủi
-- ro') của Nhóm 6 — không đụng ord 0-2 vì các bộ kiểm khác nhìn vào 'Phần 1'/
-- 'Phần 2' theo tên. Việc này để kiểm postDuyetDoiNhom() có NHẢ phần bài ra
-- khi duyệt đơn hay không (nha_phan phải khác rỗng) — đúng lỗi 'phần bài
-- không tự báo lỗi' đã trả giá nhiều lần ở tính năng ngừng tham gia.
UPDATE plan_sections SET owner_member_id = NULL, updated_at = datetime('now')
 WHERE plan_id = (SELECT id FROM plans WHERE group_id =
   (SELECT id FROM groups WHERE cohort_id = (SELECT id FROM cohorts WHERE code = 'K03') AND no = 6))
   AND owner_member_id = (SELECT id FROM members WHERE full_name = 'Nguyễn Thị Thu Hương');
UPDATE plan_sections SET owner_member_id = (SELECT id FROM members WHERE full_name = 'Nguyễn Thị Thu Hương'), updated_at = datetime('now')
 WHERE plan_id = (SELECT id FROM plans WHERE group_id =
   (SELECT id FROM groups WHERE cohort_id = (SELECT id FROM cohorts WHERE code = 'K03') AND no = 6))
   AND ord = 7;
" >/dev/null

nohup npx wrangler dev --port 8787 --local > /tmp/k3vaceo-dev.log 2>&1 &
until curl -sf -o /dev/null http://127.0.0.1:8787/api/health 2>/dev/null; do sleep 1; done
echo "đã reset và khởi động lại"
