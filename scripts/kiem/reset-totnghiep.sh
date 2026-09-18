#!/bin/bash
# Dựng trạng thái cố định cho kiem-totnghiep.mjs và pw-totnghiep.mjs.
#
# BỐN PHIÊN, mỗi phiên ứng với một vai phải phân biệt được:
#   cuong  — Ngô Phú Cường, Nhóm 6, uy_vien cấp lớp → isClassCommittee TRUE
#   thuong — một người Nhóm 6 KHÔNG giữ vai gì      → danh-sach phải 403
#   n7     — một người Nhóm 7                        → kiểm ban-nop không lẫn nhóm
#   (không cookie)                                   → danh-sach phải 401
#
# Vì sao phải dựng "thường" và "n7" bằng tay chứ không mượn người có thật:
# vai ngoài đời đổi bất cứ lúc nào mà bộ kiểm không hay — đúng bài học đã ghi
# cho reset-doi-nhom.sh (hai officer kiểm đổi nhóm đều dựng tay, kể cả khi
# Nhóm 8 đã có trưởng nhóm thật).
#
# Và seed thêm hồ sơ members cho VŨ THỊ NGÂN: trên D1 THẬT chị có members.id
# 48 (do phan-vai.yml tạo từ scripts/data/phan-vai.csv), còn D1 cục bộ mới nạp
# thì migration 0027 CỐ Ý chỉ thêm dòng roster. Thiếu bước này thì đợt thu phí
# của migration 0041 có collector_member_id = NULL ở đây mà KHÁC hẳn bản thật
# — bộ kiểm chạy trên một hình dạng dữ liệu không tồn tại ngoài đời.
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

bam() { printf '%s' "$1" | sha256sum | cut -d' ' -f1; }
H_CUONG=$(bam "tk-tn-cuong")
H_THUONG=$(bam "tk-tn-thuong")
H_N7=$(bam "tk-tn-n7")

npx wrangler d1 execute k3vaceo --local --command "
-- Dọn sạch dấu vết lượt chạy trước. Bộ kiểm này THẬT SỰ ĐỔI TRẠNG THÁI
-- (ghi dang_ky_tot_nghiep, ghi groups.ban_nop_url, khai quỹ), nên reset phải
-- trả CẢ những thứ ấy về gốc chứ không chỉ dọn bảng phụ — đúng bài học đã trả
-- giá ở reset-doi-nhom.sh (lượt hai mở đầu với người xin đã ở nhóm khác).
DELETE FROM members WHERE full_name IN ('Kiểm TN Thường', 'Kiểm TN Nhóm Bảy');
DELETE FROM dang_ky_tot_nghiep;
DELETE FROM fund_declarations;
UPDATE groups SET ban_nop_url = NULL, ban_nop_luc = NULL, ban_nop_boi = NULL;

-- Vũ Thị Ngân: cho giống bản thật (xem chú thích đầu tệp).
INSERT INTO members (cohort_id, group_id, roster_id, full_name, phone, is_active, claimed_at)
SELECT r.cohort_id, (SELECT id FROM groups WHERE no = 1 AND cohort_id = r.cohort_id),
       r.id, r.full_name, r.phone, 1, datetime('now')
  FROM roster r WHERE r.seq = 136 AND r.full_name = 'Vũ Thị Ngân'
   AND NOT EXISTS (SELECT 1 FROM members m WHERE m.roster_id = r.id);
UPDATE fund_rounds
   SET collector_member_id = (SELECT m.id FROM members m JOIN roster r ON r.id = m.roster_id
                               WHERE r.seq = 136 AND r.full_name = 'Vũ Thị Ngân'),
       created_by = (SELECT m.id FROM members m JOIN roster r ON r.id = m.roster_id
                       WHERE r.seq = 136 AND r.full_name = 'Vũ Thị Ngân')
 WHERE scope = 'class' AND amount = 1000000 AND collector_member_id IS NULL;

-- Hai người dựng tay.
INSERT INTO members (cohort_id, group_id, full_name, phone, title, company, is_active, claimed_at)
SELECT c.id, (SELECT id FROM groups WHERE no = 6 AND cohort_id = c.id),
       'Kiểm TN Thường', '0900000061', 'Giám đốc', 'Công ty Kiểm Thử', 1, datetime('now')
  FROM cohorts c WHERE c.code = 'K03';
INSERT INTO members (cohort_id, group_id, full_name, phone, title, company, is_active, claimed_at)
SELECT c.id, (SELECT id FROM groups WHERE no = 7 AND cohort_id = c.id),
       'Kiểm TN Nhóm Bảy', '0900000071', 'Chủ tịch', 'Công ty Bảy', 1, datetime('now')
  FROM cohorts c WHERE c.code = 'K03';

DELETE FROM sessions WHERE member_id IN
  (SELECT id FROM members WHERE full_name IN
     ('Ngô Phú Cường', 'Kiểm TN Thường', 'Kiểm TN Nhóm Bảy'));
INSERT INTO sessions (member_id, token_hash, expires_at)
  SELECT id, '$H_CUONG', datetime('now', '+1 day') FROM members
   WHERE full_name = 'Ngô Phú Cường' AND is_active = 1;
INSERT INTO sessions (member_id, token_hash, expires_at)
  SELECT id, '$H_THUONG', datetime('now', '+1 day') FROM members
   WHERE full_name = 'Kiểm TN Thường';
INSERT INTO sessions (member_id, token_hash, expires_at)
  SELECT id, '$H_N7', datetime('now', '+1 day') FROM members
   WHERE full_name = 'Kiểm TN Nhóm Bảy';
" >/dev/null

nohup npx wrangler dev --port 8787 --local > /tmp/k3vaceo-dev.log 2>&1 &
until curl -sf -o /dev/null http://127.0.0.1:8787/api/health 2>/dev/null; do sleep 1; done
echo "đã reset và khởi động lại"
