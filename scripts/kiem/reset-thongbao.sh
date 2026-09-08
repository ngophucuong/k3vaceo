#!/bin/bash
# Dựng dữ liệu cho pw-thongbao.mjs (link bấm được, sửa lại thông báo, thanh B/I)
# và kiem-thongbao-ghichu.mjs (đính kèm Ghi chú vào thông báo, migration 0034):
#   - phiên cố định của Ngô Phú Cường (trưởng Nhóm 6, và uỷ viên cấp lớp).
#   - một thông báo của NHÓM 6 có URL DÁN THẲNG trong nội dung — đúng hình
#     Ngô Phú Cường gửi 5/9: link Outline dán nguyên si, đọc được mà bấm không
#     được.
#   - một thông báo của NHÓM KHÁC (Nhóm 7) để kiểm chốt N6 ở đường sửa: phải
#     404 chứ không phải 403, vì 403 là xác nhận id ấy có thật.
#   - bốn Ghi chú/liên kết cho phép kiểm đính kèm: một scope=class (ai cũng
#     đính kèm được), một scope=group của CHÍNH Nhóm 6, một scope=group của
#     NHÓM 7 (phải bị từ chối — cùng chốt N6 ở trên, áp cho đường đính kèm),
#     và một liên kết KHÔNG PHẢI TEXT (phải bị từ chối vì không phải Ghi chú).
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

TOK="tk-cuong-thongbao"
HASH=$(printf '%s' "$TOK" | sha256sum | cut -d' ' -f1)

npx wrangler d1 execute k3vaceo --local --command "
DELETE FROM sessions WHERE member_id IN (
  SELECT id FROM members WHERE full_name = 'Ngô Phú Cường'
);
-- Dọn cả nhật ký lẫn dữ liệu: nội dung thông báo KHÔNG lọt vào activity, nhưng
-- giữ thói quen dọn sạch để lượt sau chạy trên nền y hệt lượt này.
DELETE FROM thong_bao WHERE noi_dung LIKE 'KIEMTB\\_%' ESCAPE '\\';
-- Bất kỳ thông báo NÀO còn trỏ ghi_chu_id vào một fixture sắp xoá dưới đây
-- cũng phải dọn theo — thiếu dòng này thì lượt sau chạy DELETE FROM links là
-- vỡ FOREIGN KEY constraint (thong_bao.ghi_chu_id REFERENCES links(id)), vì
-- D1 cục bộ enforce khoá ngoại còn D1 thật thì không, nên lỗi chỉ lộ ra ở
-- đúng chỗ ta đang kiểm. Đã vấp một lần: một thông báo thử bằng tay (không
-- theo khuôn KIEMTB\_%) trỏ vào KIEMTBGC_lop làm đúng lượt reset kế tiếp chết.
DELETE FROM thong_bao WHERE ghi_chu_id IN (
  SELECT id FROM links WHERE title LIKE 'KIEMTBGC\\_%' ESCAPE '\\'
);
DELETE FROM links WHERE title LIKE 'KIEMTBGC\\_%' ESCAPE '\\';

INSERT INTO links (cohort_id, scope, group_id, title, kind, tag, content_md, created_by)
SELECT m.cohort_id, 'class', NULL, 'KIEMTBGC_lop', 'TEXT', 'lop', 'Nội dung ghi chú cấp lớp.', m.id
  FROM members m WHERE m.full_name = 'Ngô Phú Cường' AND m.is_active = 1;

INSERT INTO links (cohort_id, scope, group_id, title, kind, tag, content_md, created_by)
SELECT m.cohort_id, 'group', m.group_id, 'KIEMTBGC_nhom6', 'TEXT', 'lop', 'Nội dung ghi chú riêng Nhóm 6.', m.id
  FROM members m WHERE m.full_name = 'Ngô Phú Cường' AND m.is_active = 1;

-- Của NHÓM 7 — Ngô Phú Cường (Nhóm 6) không đọc được, nên đính kèm phải bị
-- từ chối. Lấy nhóm theo nhãn để không phụ thuộc id.
INSERT INTO links (cohort_id, scope, group_id, title, kind, tag, content_md, created_by)
SELECT g.cohort_id, 'group', g.id, 'KIEMTBGC_nhom7', 'TEXT', 'lop', 'Nội dung riêng Nhóm 7.', NULL
  FROM groups g WHERE g.label = 'Nhóm 7' AND g.cohort_id = (SELECT id FROM cohorts WHERE code = 'K03');

-- KHÔNG phải Ghi chú (kind DRIVE, có url) — đính kèm phải bị từ chối vì sai
-- loại, dù cùng scope='class' mà Ngô Phú Cường đọc được thoải mái.
INSERT INTO links (cohort_id, scope, group_id, title, kind, tag, url, created_by)
SELECT m.cohort_id, 'class', NULL, 'KIEMTBGC_khongphaitext', 'DRIVE', 'lop', 'https://drive.google.com/x', m.id
  FROM members m WHERE m.full_name = 'Ngô Phú Cường' AND m.is_active = 1;

INSERT INTO thong_bao (cohort_id, group_id, noi_dung, nguon, created_by)
SELECT m.cohort_id, m.group_id,
       'KIEMTB_nhom6 Chi tiết: https://outline.cuongngo.app/s/5e30f127-59a7-472f-aa03-abae19f2d8c2',
       'Nhóm 6', m.id
  FROM members m WHERE m.full_name = 'Ngô Phú Cường' AND m.is_active = 1;

-- Thông báo của MỘT NHÓM KHÁC. Lấy nhóm 7 theo nhãn để không phụ thuộc id.
INSERT INTO thong_bao (cohort_id, group_id, noi_dung, nguon, created_by)
SELECT g.cohort_id, g.id, 'KIEMTB_nhomkhac Việc nội bộ của nhóm khác', 'Nhóm 7', NULL
  FROM groups g WHERE g.label = 'Nhóm 7'
   AND g.cohort_id = (SELECT id FROM cohorts WHERE code = 'K03');

INSERT INTO sessions (member_id, token_hash, expires_at)
SELECT id, '$HASH', datetime('now', '+1 day')
  FROM members WHERE full_name = 'Ngô Phú Cường' AND is_active = 1;
" >/dev/null

nohup npx wrangler dev --port 8787 --local > /tmp/k3vaceo-dev.log 2>&1 &
until curl -sf -o /dev/null http://127.0.0.1:8787/api/health 2>/dev/null; do sleep 1; done
echo "đã reset và khởi động lại"
