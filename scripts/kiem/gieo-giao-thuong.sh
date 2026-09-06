#!/usr/bin/env bash
# Gieo dữ liệu thử cho tab Giao thương và trang /giao-thuong.
#
#     bash scripts/kiem/gieo-giao-thuong.sh
#
# CHẠY TRƯỚC KHI khởi động `wrangler dev`. Chạm D1 trong lúc dev server đang
# chạy làm nó chết, kể cả lệnh chỉ đọc (xem scripts/kiem/README.md).
#
# Chạy lại được nhiều lần: mọi câu đều INSERT OR REPLACE hoặc UPDATE, không
# câu nào phụ thuộc bảng đang rỗng.
#
# Dữ liệu cố ý dựng để kiểm ĐÚNG ba thứ khó:
#   1. Bỏ N6  — ba người ở nhóm 7, 8, 9; người của nhóm 6 phải thấy cả ba.
#   2. Ghép   — mỗi người khớp với Ngô Phú Cường theo MỘT chiều khác nhau.
#   3. Mức lộ — chỉ MỘT người bật công khai, và chỉ người ấy được ra trang
#               ngoài. Một người khác bật công khai nhưng TẮT liên hệ, để bắt
#               đúng lỗi rò số điện thoại.
set -euo pipefail
cd "$(dirname "$0")/../../worker"

TOKEN="kiemthu-giao-thuong-0001"
HASH=$(printf '%s' "$TOKEN" | sha256sum | cut -d' ' -f1)

sql() { npx wrangler d1 execute k3vaceo --local --command "$1" >/dev/null; }

# ── Ba người ở ba nhóm khác ────────────────────────────────────────────────
sql "INSERT OR REPLACE INTO members (id, cohort_id, group_id, full_name, title, company, phone, email, claimed_at, is_active)
     VALUES (900, 1, 7, 'Trần Văn Kho', 'Giám đốc', 'Công ty Phần mềm Kho Việt', '0900000900', 'kho@vd.test', datetime('now'), 1)"
sql "INSERT OR REPLACE INTO members (id, cohort_id, group_id, full_name, title, company, phone, email, claimed_at, is_active)
     VALUES (901, 1, 8, 'Lê Thị Bao Bì', 'Chủ tịch', 'Bao bì giấy Miền Bắc', '0900000901', 'baobi@vd.test', datetime('now'), 1)"
sql "INSERT OR REPLACE INTO members (id, cohort_id, group_id, full_name, title, company, phone, email, claimed_at, is_active)
     VALUES (902, 1, 9, 'Phạm Nhà Máy', 'Tổng giám đốc', 'Nhà máy sản xuất thép Hoà Phát Nam', '0900000902', 'thep@vd.test', datetime('now'), 1)"

# ── Gian hàng ──────────────────────────────────────────────────────────────
# Ngô Phú Cường (id 6): bán vận tải, cần phần mềm kho, bán cho nhà máy.
sql "INSERT OR REPLACE INTO member_profile
       (member_id, sells_what, sells_to, needs, offers, nganh, mo_ta, website, cong_khai, cong_khai_luc, hien_lien_he, updated_at, updated_by)
     VALUES (6, 'Vận tải container Bắc – Nam', 'Nhà máy sản xuất, công ty xuất nhập khẩu',
             'Phần mềm quản lý kho', 'Kho bãi tại Hải Phòng', 'van-tai,thuong-mai',
             'Đội xe 20 đầu kéo, chạy tuyến Hải Phòng – Đà Nẵng – TP.HCM.',
             'https://vantai-vd.test', 0, NULL, 0, datetime('now'), 6)"

# Khớp chiều 'toi_can': họ bán đúng thứ Cường đang cần.
sql "INSERT OR REPLACE INTO member_profile
       (member_id, sells_what, sells_to, needs, offers, nganh, mo_ta, website, cong_khai, cong_khai_luc, hien_lien_he, updated_at, updated_by)
     VALUES (900, 'Phần mềm quản lý kho và bán hàng', 'Doanh nghiệp vừa và nhỏ',
             'Khách hàng ngành sản xuất', 'Tư vấn chuyển đổi số miễn phí buổi đầu', 'cong-nghe',
             'Triển khai 60 kho trên toàn quốc.', NULL, 1, datetime('now'), 1, datetime('now'), 900)"

# Khớp chiều 'ho_can': họ đang cần đúng thứ Cường bán.
sql "INSERT OR REPLACE INTO member_profile
       (member_id, sells_what, sells_to, needs, offers, nganh, mo_ta, website, cong_khai, cong_khai_luc, hien_lien_he, updated_at, updated_by)
     VALUES (901, 'Bao bì giấy sóng', 'Nhà máy thực phẩm',
             'Đối tác vận tải container tuyến Bắc Nam', NULL, 'san-xuat',
             NULL, NULL, 1, datetime('now'), 0, datetime('now'), 901)"

# Khớp chiều 'dung_khach': họ chính là loại khách Cường tìm. CỐ Ý để cong_khai
# = 0 — người này phải VẮNG MẶT trên trang công khai dù có gian hàng đầy đủ.
sql "INSERT OR REPLACE INTO member_profile
       (member_id, sells_what, sells_to, needs, offers, nganh, mo_ta, website, cong_khai, cong_khai_luc, hien_lien_he, updated_at, updated_by)
     VALUES (902, 'Thép xây dựng', 'Nhà thầu', NULL, NULL, 'san-xuat',
             'Nhà máy sản xuất thép, công suất 200 nghìn tấn một năm.',
             NULL, 0, NULL, 0, datetime('now'), 902)"

# ── Phiên cho Ngô Phú Cường ────────────────────────────────────────────────
sql "DELETE FROM sessions WHERE member_id = 6 AND user_agent = 'kiem-giao-thuong'"
sql "INSERT INTO sessions (member_id, token_hash, expires_at, user_agent)
     VALUES (6, '$HASH', datetime('now', '+1 day'), 'kiem-giao-thuong')"

echo "Đã gieo. Cookie phiên cho Ngô Phú Cường (id 6):"
echo "  s=$TOKEN"
