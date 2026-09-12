#!/bin/bash
# Dựng dữ liệu cho kiem-tro-ly.mjs và pw-tro-ly.mjs (Trợ lý KHKD,
# routes/tro-ly.js, migration 0038).
#
# ĐIỀU KHÁC MỌI BỘ KIỂM KHÁC: sandbox không gọi được ra internet, nên KHÔNG
# một lượt gọi LLM nào chạy được ở đây. Vì vậy fixture phải GIEO SẴN một phiên
# đã có tin nhắn vào D1 — nhờ đó kiểm được tất cả những gì KHÔNG phải là lượt
# gọi ra ngoài (đọc lại phiên, N6, trần lượt, đóng phiên, và toàn bộ giao diện
# hội thoại), còn đường gọi thật thì chỉ kiểm được ở nhánh HỎNG (fetch ném
# lỗi → 502 kèm hong_o_buoc), đúng thứ duy nhất sandbox chứng minh được.
#
# Tham số:  (không có)  → trợ lý BẬT, dùng cho lượt kiểm chính
#           tat         → đặt cai_dat.tro_ly_bat = '0', dùng cho lượt kiểm
#                         công tắc tắt. Phải là một lượt chạy RIÊNG vì
#                         `wrangler d1 execute` chạm D1 lúc server đang chạy
#                         là server chết (CLAUDE.md), nên không đổi được công
#                         tắc giữa chừng một bộ kiểm.
#
# Bốn hồ sơ:
#   - Ngô Phú Cường (Nhóm 6, có sẵn) — người hỏi chính.
#   - "Kiểm Trợ Lý Hết Lượt" (Nhóm 6, giả) — gieo sẵn ĐỦ 40 rate_events để kiểm
#     trần lượt mỗi người mỗi ngày mà KHÔNG làm cạn lượt của Cường.
#   - "Kiểm Trợ Lý Sát Trần" (Nhóm 6, giả) — gieo ĐÚNG 39, tức còn đúng một
#     lượt. Dùng để chứng minh một lượt gọi HỎNG không bị tính vào hạn mức:
#     nếu bị tính thì sổ thành 40 và con_luot lùi về false ngay sau đó.
#   - "Kiểm Trợ Lý Nhóm Khác" (Nhóm 7, giả) — chủ một phiên của nhóm khác, để
#     kiểm N6: Cường gọi vào phiên ấy phải nhận 404 chứ không phải 403.
#   Hai hồ sơ giả dựng tay chứ không mượn ai có thật — vai ngoài đời đổi lúc
#   nào bộ kiểm cũng không hay (bài học của reset-doi-nhom.sh).
#
# Phải dừng dev server trước: chạm D1 lúc nó đang chạy là nó chết (CLAUDE.md).
set -e
cd "$(dirname "$0")/../../worker"

BAT='1'
[ "$1" = "tat" ] && BAT='0'

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

TOK_C="tk-cuong-troly"
TOK_H="tk-hetluot-troly"
TOK_K="tk-nhomkhac-troly"
TOK_S="tk-sattran-troly"
HASH_C=$(printf '%s' "$TOK_C" | sha256sum | cut -d' ' -f1)
HASH_H=$(printf '%s' "$TOK_H" | sha256sum | cut -d' ' -f1)
HASH_K=$(printf '%s' "$TOK_K" | sha256sum | cut -d' ' -f1)
HASH_S=$(printf '%s' "$TOK_S" | sha256sum | cut -d' ' -f1)

npx wrangler d1 execute k3vaceo --local --command "
-- Dọn fixture của lần chạy trước: bộ kiểm này THẬT SỰ ghi phiên, tin nhắn,
-- rate_events và (ở phép chốt bản thảo) một dòng links — chạy lại được nhiều
-- lần là điều kiện bắt buộc (README mục 3).
DELETE FROM tro_ly_tin WHERE phien_id IN (SELECT id FROM tro_ly_phien WHERE tieu_de LIKE 'KIEMTL\\_%' ESCAPE '\\');
DELETE FROM tro_ly_phien WHERE tieu_de LIKE 'KIEMTL\\_%' ESCAPE '\\';
DELETE FROM links WHERE title LIKE 'KIEMTL\\_%' ESCAPE '\\';
DELETE FROM rate_events WHERE bucket = 'tro_ly';
DELETE FROM sessions WHERE member_id IN (
  SELECT id FROM members WHERE full_name IN ('Ngô Phú Cường') OR full_name LIKE 'Kiểm Trợ Lý%'
);
DELETE FROM members WHERE full_name LIKE 'Kiểm Trợ Lý%';

UPDATE cai_dat SET gia_tri = '$BAT', updated_at = datetime('now') WHERE khoa = 'tro_ly_bat';

-- Hai hồ sơ giả (roster_id NULL — hợp lệ theo migration 0001).
INSERT INTO members (cohort_id, group_id, full_name, claimed_at, is_active, created_at, updated_at)
SELECT (SELECT id FROM cohorts WHERE code = 'K03'),
       (SELECT id FROM groups WHERE cohort_id = (SELECT id FROM cohorts WHERE code = 'K03') AND no = 6),
       'Kiểm Trợ Lý Hết Lượt', datetime('now'), 1, datetime('now'), datetime('now');
INSERT INTO members (cohort_id, group_id, full_name, claimed_at, is_active, created_at, updated_at)
SELECT (SELECT id FROM cohorts WHERE code = 'K03'),
       (SELECT id FROM groups WHERE cohort_id = (SELECT id FROM cohorts WHERE code = 'K03') AND no = 6),
       'Kiểm Trợ Lý Sát Trần', datetime('now'), 1, datetime('now'), datetime('now');
INSERT INTO members (cohort_id, group_id, full_name, claimed_at, is_active, created_at, updated_at)
SELECT (SELECT id FROM cohorts WHERE code = 'K03'),
       (SELECT id FROM groups WHERE cohort_id = (SELECT id FROM cohorts WHERE code = 'K03') AND no = 7),
       'Kiểm Trợ Lý Nhóm Khác', datetime('now'), 1, datetime('now'), datetime('now');

INSERT INTO sessions (member_id, token_hash, expires_at)
SELECT id, '$HASH_C', datetime('now', '+1 day') FROM members WHERE full_name = 'Ngô Phú Cường' AND is_active = 1;
INSERT INTO sessions (member_id, token_hash, expires_at)
SELECT id, '$HASH_H', datetime('now', '+1 day') FROM members WHERE full_name = 'Kiểm Trợ Lý Hết Lượt';
INSERT INTO sessions (member_id, token_hash, expires_at)
SELECT id, '$HASH_S', datetime('now', '+1 day') FROM members WHERE full_name = 'Kiểm Trợ Lý Sát Trần';
INSERT INTO sessions (member_id, token_hash, expires_at)
SELECT id, '$HASH_K', datetime('now', '+1 day') FROM members WHERE full_name = 'Kiểm Trợ Lý Nhóm Khác';

-- Nhóm 7 cần một bộ phần bài tối thiểu để có một plan_sections.id THẬT của
-- nhóm khác (chốt N6 của postPhien). Nhóm khác Nhóm 6 chỉ có phần bài sau khi
-- chạy wizard, D1 cục bộ mới nạp thì chưa có (như reset-tulieu-bai.sh).
INSERT INTO plans (group_id)
  SELECT (SELECT id FROM groups WHERE cohort_id = (SELECT id FROM cohorts WHERE code = 'K03') AND no = 7)
   WHERE NOT EXISTS (SELECT 1 FROM plans WHERE group_id =
     (SELECT id FROM groups WHERE cohort_id = (SELECT id FROM cohorts WHERE code = 'K03') AND no = 7));
INSERT INTO plan_sections (plan_id, ord, title, requirement, pct)
  SELECT p.id, 0, 'Phần của Nhóm 7 (chỉ để kiểm N6)', 'yêu cầu', 0
    FROM plans p
   WHERE p.group_id = (SELECT id FROM groups WHERE cohort_id = (SELECT id FROM cohorts WHERE code = 'K03') AND no = 7)
     AND NOT EXISTS (SELECT 1 FROM plan_sections WHERE plan_id = p.id);
" >/dev/null

# ── Ba phiên gieo sẵn ──────────────────────────────────────────────────────
# Gieo bằng lượt gọi THỨ HAI vì phải tra id của phiên vừa chèn. Gộp vào một
# lượt thì phải viết subquery lồng cho mỗi dòng tin nhắn, khó đọc hơn nhiều mà
# chỉ tiết kiệm ~13 giây.
npx wrangler d1 execute k3vaceo --local --command "
-- (a) Phiên của Nhóm 6 gắn vào phần bài ord=1, đang mở, 1 lượt — dùng cho
--     giao diện (vẽ bong bóng) và cho phép chốt bản thảo.
INSERT INTO tro_ly_phien (group_id, section_id, mo_boi, tieu_de, giai_doan, trang_thai, so_luot, created_at, updated_at)
SELECT m.group_id,
       (SELECT ps.id FROM plan_sections ps JOIN plans p ON p.id = ps.plan_id
         WHERE p.group_id = m.group_id AND ps.ord = 1),
       m.id, 'KIEMTL_Phần 2 gieo sẵn', 'viet_phan', 'dang_mo', 1, datetime('now'), datetime('now')
  FROM members m WHERE m.full_name = 'Ngô Phú Cường';

-- (b) Phiên KHÔNG gắn phần bài, đang mở, so_luot = 30 (chạm trần mỗi phiên).
INSERT INTO tro_ly_phien (group_id, section_id, mo_boi, tieu_de, giai_doan, trang_thai, so_luot, created_at, updated_at)
SELECT m.group_id, NULL, m.id, 'KIEMTL_Phiên chạm trần', 'phan_bien', 'dang_mo', 30, datetime('now'), datetime('now')
  FROM members m WHERE m.full_name = 'Ngô Phú Cường';

-- (c) Phiên của NHÓM 7 — Cường chạm vào phải nhận 404 (N6).
INSERT INTO tro_ly_phien (group_id, section_id, mo_boi, tieu_de, giai_doan, trang_thai, so_luot, created_at, updated_at)
SELECT m.group_id, NULL, m.id, 'KIEMTL_Phiên của Nhóm 7', 'de_tai', 'dang_mo', 1, datetime('now'), datetime('now')
  FROM members m WHERE m.full_name = 'Kiểm Trợ Lý Nhóm Khác';
" >/dev/null

# Tin nhắn cho phiên (a). Câu trả lời của trợ lý CỐ Ý mang bốn ca độc + bốn ca
# markdown thuận: nội dung mô hình sinh ra đi thẳng vào mdSafe() nên đây là
# chỗ duy nhất trong ứng dụng mà chữ KHÔNG do người trong lớp gõ ra được dựng
# thành HTML. pw-tro-ly.mjs kiểm cả hai chiều trên đúng chuỗi này.
npx wrangler d1 execute k3vaceo --local --command "
INSERT INTO tro_ly_tin (phien_id, vai, noi_dung, created_at)
SELECT id, 'nguoi', 'Nhóm tôi bán nước ép cần tây cho dân văn phòng Hà Nội.', datetime('now')
  FROM tro_ly_phien WHERE tieu_de = 'KIEMTL_Phần 2 gieo sẵn';
INSERT INTO tro_ly_tin (phien_id, vai, noi_dung, created_at)
SELECT id, 'tro_ly', '#### Khoảng trống ở cổng 02 SỐ' || char(10) || char(10) ||
       'Bài **chưa có** con số nào cho quy mô thị trường.' || char(10) || char(10) ||
       '- Cỡ thị trường Hà Nội là bao nhiêu? [con số] người' || char(10) ||
       '- Nguồn: [tên nguồn]' || char(10) || char(10) ||
       'Xem https://www.gso.gov.vn/so-lieu-thong-ke-chinh-thuc-nam-2025 để tra.' || char(10) || char(10) ||
       '<img src=x onerror=\"window.__xss_troly=1\"> <script>window.__xss_troly2=1</script> [bấm](javascript:alert(1))',
       datetime('now')
  FROM tro_ly_phien WHERE tieu_de = 'KIEMTL_Phần 2 gieo sẵn';

INSERT INTO tro_ly_tin (phien_id, vai, noi_dung, created_at)
SELECT id, 'nguoi', 'Bắt đầu đi.', datetime('now') FROM tro_ly_phien WHERE tieu_de = 'KIEMTL_Phiên của Nhóm 7';
" >/dev/null

# Gieo rate_events: 40 lượt (chạm trần) cho một hồ sơ, 39 (còn đúng một lượt)
# cho hồ sơ kia. 40 dòng viết tay thì dài; dùng CTE đệ quy của SQLite cho gọn
# (không phải UNION ALL nên không dính bẫy "6 nhánh" của D1).
npx wrangler d1 execute k3vaceo --local --command "
INSERT INTO rate_events (bucket, ip, created_at)
SELECT 'tro_ly', 'm' || (SELECT id FROM members WHERE full_name = 'Kiểm Trợ Lý Hết Lượt'), datetime('now')
  FROM (WITH RECURSIVE d(n) AS (SELECT 1 UNION ALL SELECT n + 1 FROM d WHERE n < 40) SELECT n FROM d);
INSERT INTO rate_events (bucket, ip, created_at)
SELECT 'tro_ly', 'm' || (SELECT id FROM members WHERE full_name = 'Kiểm Trợ Lý Sát Trần'), datetime('now')
  FROM (WITH RECURSIVE d(n) AS (SELECT 1 UNION ALL SELECT n + 1 FROM d WHERE n < 39) SELECT n FROM d);
" >/dev/null

nohup npx wrangler dev --port 8787 --local > /tmp/k3vaceo-dev.log 2>&1 &
until curl -sf -o /dev/null http://127.0.0.1:8787/api/health 2>/dev/null; do sleep 1; done
echo "đã reset và khởi động lại (tro_ly_bat = $BAT)"
