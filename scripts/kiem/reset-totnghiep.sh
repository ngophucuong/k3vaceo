#!/bin/bash
# Dựng trạng thái cố định cho kiem-totnghiep.mjs và pw-totnghiep.mjs.
#
# BỐN PHIÊN, mỗi phiên ứng với một vai phải phân biệt được:
#   cuong  — Ngô Phú Cường, Nhóm 6, uy_vien cấp lớp → isClassCommittee TRUE
#   thuong — một người Nhóm 6 KHÔNG giữ vai gì      → danh-sach phải 403
#   n7     — một người Nhóm 7                        → kiểm danh sách không lẫn nhóm
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
-- (ghi dang_ky_tot_nghiep cả ba phần, khai quỹ), nên reset phải
-- trả CẢ những thứ ấy về gốc chứ không chỉ dọn bảng phụ — đúng bài học đã trả
-- giá ở reset-doi-nhom.sh (lượt hai mở đầu với người xin đã ở nhóm khác).
-- THỨ TỰ XOÁ LÀ BẮT BUỘC: dòng con trước, dòng cha sau.
-- dang_ky_tot_nghiep.member_id và fund_declarations.member_id đều trỏ vào
-- members(id), nên xoá members trước là vỡ FOREIGN KEY constraint và cả khối
-- SQL không chạy dòng nào. Đã trả giá đúng ở đây, và cùng họ với lỗi
-- reset-thongbao.sh từng vấp (xem README mục 19).
--
-- khkd_cung_lam (migration 0045) trỏ vào members(id) qua BA cột, nên nó phải
-- đi TRƯỚC mọi lệnh xoá members ở dưới. Và bộ kiểm này thật sự tạo quan hệ
-- rồi đồng ý/từ chối/rời, nên bỏ bước dọn là lượt chạy sau mở đầu với quan hệ
-- còn sót: phép rủ-hai-lần-thì-409 xanh giả (đã có sẵn dòng từ lượt trước),
-- còn phép từ-chối-rồi-rủ-lại-được thì đỏ ở một chỗ chẳng liên quan.
DELETE FROM khkd_cung_lam;
DELETE FROM dang_ky_tot_nghiep;
DELETE FROM fund_declarations;
-- Hai thùng hạn mức của cửa /dangnhap. Bộ kiểm gõ số SAI một lượt (đúng phép
-- canh của nó), và mỗi lượt sai ăn một phần của trần 8-lần-mỗi-hồ-sơ-mỗi-giờ.
-- Không dọn thì chạy lại bộ kiểm trong cùng một giờ là phép số-tự-khai-mở-được
-- -cửa đỏ với 429 rate_limited — một câu trỏ hoàn toàn sai chỗ hỏng, vì mã sản
-- phẩm vẫn đúng. Đúng bài học đã ghi cho reset-moi.sh, nay áp cho bộ kiểm này.
DELETE FROM rate_events WHERE bucket IN ('doan_so_ho_so', 'doan_so_ip');
-- Dòng plans của NHÓM 7, nếu có. Phép canh bước quỹ-đang-mở chạy bằng phiên
-- Nhóm 7 vì Nhóm 6 là nhóm DUY NHẤT có plans trên D1 thật, nên bước 4 (phần
-- bài) luôn chặn trước bước 5 với Cường. Điều kiện ấy NGẦM, và một bộ kiểm
-- KHÁC phá được nó: reset-tulieu-bai.sh cố ý seed một plan_sections của Nhóm 7
-- để chứng minh chốt N6, rồi để lại đó.
--
-- Triệu chứng khi bị phá: phép du_le đỏ với target = plan và câu
-- Con 1 phan chua ai nhan — một chỗ chẳng liên quan gì tới thứ nó đang canh,
-- và chỉ đỏ khi chạy SAU bộ kiểm kia. Đã trả giá 19/9.
-- Thứ tự bắt buộc: plan_sections trỏ vào plans.
DELETE FROM plan_sections WHERE plan_id IN
  (SELECT p.id FROM plans p JOIN groups g ON g.id = p.group_id WHERE g.no <> 6);
DELETE FROM plans WHERE group_id IN (SELECT id FROM groups WHERE no <> 6);
-- Từ 18/9 putHoSo GHI NGƯỢC linh_vuc sang member_profile.nganh, để ngành khai
-- ở form tốt nghiệp tới được bộ lọc ngành của tab Giao thương. Nghĩa là bộ
-- kiểm này nay ĐỔI member_profile — nên reset phải trả chính cột ấy về gốc.
--
-- Bỏ bước này là một lỗi IM LẶNG và đã trả giá ngay: lượt chạy trước để lại
-- nganh = khac,van-tai, nên lượt sau mở form ra đã thấy chip Ngành khác BẬT
-- SẴN và ô chữ hiện sẵn — hai phép kiểm ô chữ đỏ lên ở một chỗ chẳng liên
-- quan gì tới thứ chúng đang canh. Đúng bài học của reset-doi-nhom.sh.
UPDATE member_profile SET nganh = NULL
 WHERE member_id IN (SELECT id FROM members WHERE full_name IN
   ('Ngô Phú Cường', 'Kiểm TN Thường', 'Kiểm TN Nhóm Bảy', 'Đinh Khánh Toàn'));
-- Và từ 19/9 putHoSo còn ghi ngược SỐ ĐIỆN THOẠI sang members.phone kèm dấu
-- phone_self_set_at — tức số khai ở form tốt nghiệp thành số tự đăng nhập
-- được ở /dangnhap. Bộ kiểm này ĐỔI chính hai cột ấy, nên reset phải trả
-- chúng về bản danh sách gốc.
--
-- Bỏ bước này là một lỗi IM LẶNG và nó giết đúng phép đối chứng quan trọng
-- nhất: lượt chạy trước để lại dấu phone_self_set_at, nên lượt sau phép
-- 'số tự khai mở được cửa /dangnhap' XANH kể cả khi bản vá đã bị gỡ ra.
UPDATE members
   SET phone = (SELECT r.phone FROM roster r WHERE r.id = members.roster_id),
       phone_self_set_at = NULL
 WHERE full_name = 'Ngô Phú Cường' AND roster_id IS NOT NULL;
-- Phép canh bước quỹ-đang-mở (19/9) điền bốn ô member_profile cho phiên Nhóm
-- Bảy, vì profileCompleteness < 4 là bước ĐỨNG TRƯỚC bước quỹ và sẽ chặn mất.
-- (Không một dấu nháy kép nào trong khối này, kể cả chú thích — xem cảnh báo
--  ở khối trên. Vừa vấp lại đúng chỗ ấy 19/9.)
-- Dòng member_profile ấy trỏ vào members(id), nên phải xoá TRƯỚC dòng cha —
-- cùng thứ tự bắt buộc đã ghi ở đầu khối này.
DELETE FROM member_profile WHERE member_id IN
  (SELECT id FROM members WHERE full_name IN
    ('Kiểm TN Thường', 'Kiểm TN Nhóm Bảy', 'Kiểm TN Chưa Vào'));
DELETE FROM members WHERE full_name IN
  ('Kiểm TN Thường', 'Kiểm TN Nhóm Bảy', 'Kiểm TN Chưa Vào');
-- Đường CÔNG KHAI (migration 0042) TỰ TẠO dòng members cho người chưa có hồ
-- sơ. Không dọn thì lượt chạy sau mở đầu với người ấy ĐÃ có members — phép
-- kiểm route-tự-tạo-hồ-sơ mất răng, và nó im lặng chứ không đỏ. Đúng bài học
-- đã trả giá ở reset-doi-nhom.sh: bộ kiểm nào THẬT SỰ đổi trạng thái thì
-- reset phải trả chính trạng thái ấy về gốc, không chỉ dọn bảng phụ.
--
-- KHÔNG ĐƯỢC CÓ MỘT DẤU NHÁY KÉP NÀO trong khối SQL này, kể cả trong chú
-- thích: cả khối nằm trong một chuỗi shell bọc bằng nháy kép, nên một dấu
-- nháy kép thứ hai là đóng chuỗi ngay tại đó. Đã trả giá: wrangler nhận
-- nguyên phần còn lại làm THAM SỐ DÒNG LỆNH và chết bằng
-- 'Unknown arguments: tự, tạo, hồ, sơ …', còn reset thì lặng lẽ không chạy
-- SQL nào — triệu chứng là bộ kiểm báo 401 cho một phiên vừa mới dựng. Cùng
-- họ với bẫy nháy đơn trong khối 'node -e' của deploy.yml (CLAUDE.md).
DELETE FROM members
 WHERE claimed_at IS NULL
   AND roster_id IN (SELECT id FROM roster WHERE full_name = 'Đinh Khánh Toàn');
-- (cột ban_nop_* đã gỡ ở migration 0043 — đề tài nay theo cá nhân, không theo nhóm)

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
-- Người thứ TƯ, CỐ Ý chưa đăng nhập (claimed_at để trống) và KHÔNG có phiên.
-- Chỉ để một việc: canh rằng rủ người chưa đăng nhập bị chặn, và họ KHÔNG có
-- mặt trong danh sách chọn được. Dựng hẳn một dòng thay vì mượn ai có thật, vì
-- người thật đăng nhập lúc nào cũng được mà bộ kiểm không hay — đúng bài học
-- reset-doi-nhom.sh.
INSERT INTO members (cohort_id, group_id, full_name, phone, title, company, is_active)
SELECT c.id, (SELECT id FROM groups WHERE no = 7 AND cohort_id = c.id),
       'Kiểm TN Chưa Vào', '0900000072', 'Giám đốc', 'Công ty Chưa Vào', 1
  FROM cohorts c WHERE c.code = 'K03';

-- Dọn phiên theo TOKEN_HASH, không theo member_id.
-- token_hash mới là khoá UNIQUE, nên nó là thứ duy nhất chắc chắn dọn hết.
-- Dọn theo member_id thì hụt hai ca có thật: phiên MỒ CÔI (dòng members đã bị
-- xoá ở trên mà phiên còn lại), và lượt reset trước chạy DỞ DANG. Cả hai đều
-- lộ ra bằng đúng một câu SQLITE_CONSTRAINT: UNIQUE constraint failed:
-- sessions.token_hash — đọc lên như lỗi mã sản phẩm chứ không như rác của
-- lượt chạy trước. Đã trả giá 18/9.
DELETE FROM sessions WHERE token_hash IN ('$H_CUONG', '$H_THUONG', '$H_N7');
DELETE FROM sessions WHERE member_id NOT IN (SELECT id FROM members);
INSERT OR REPLACE INTO sessions (member_id, token_hash, expires_at)
  SELECT id, '$H_CUONG', datetime('now', '+1 day') FROM members
   WHERE full_name = 'Ngô Phú Cường' AND is_active = 1;
INSERT OR REPLACE INTO sessions (member_id, token_hash, expires_at)
  SELECT id, '$H_THUONG', datetime('now', '+1 day') FROM members
   WHERE full_name = 'Kiểm TN Thường';
INSERT OR REPLACE INTO sessions (member_id, token_hash, expires_at)
  SELECT id, '$H_N7', datetime('now', '+1 day') FROM members
   WHERE full_name = 'Kiểm TN Nhóm Bảy';
" >/dev/null

# KIỂM LẠI RẰNG SEED ĐÃ CHẠY THẬT, đừng tin `set -e`.
#
# Đã trả giá: khối SQL ở trên chết vì một dấu nháy kép lọt vào chú thích, `set
# -e` cho script thoát — nhưng một tiến trình wrangler CŨ vẫn đang giữ cổng
# 8787 và trả lời bình thường, nên mọi thứ trông y như đã reset xong. Bộ kiểm
# chạy tiếp rồi báo 401 cho một phiên vừa mới dựng, và mất một lúc mới nhìn ra
# thủ phạm không nằm trong mã sản phẩm.
#
# Ba phiên là điều kiện tối thiểu để bộ kiểm có nghĩa; thiếu là dừng ngay ở
# đây, đừng để nó đỏ ở một chỗ chẳng liên quan.
#
# ĐẾM ĐÚNG BA PHIÊN CỦA RIÊNG SCRIPT NÀY, không đếm cả bảng. Đếm cả bảng thì
# một fixture của bộ kiểm KHÁC còn nằm lại (gieo-giao-thuong.sh chẳng hạn) là
# ra 5/3 và script dừng với đúng câu "có dấu nháy kép nào lọt vào không?" —
# một câu trỏ sai hoàn toàn chỗ hỏng. Câu hỏi đúng là "seed CỦA TÔI đã chạy
# chưa", không phải "bảng có sạch không". Đã trả giá 18/9.
so_phien=$(npx wrangler d1 execute k3vaceo --local --json --command \
  "SELECT COUNT(*) AS n FROM sessions WHERE token_hash IN ('$H_CUONG', '$H_THUONG', '$H_N7')" 2>/dev/null \
  | sed -n '/^\[/,$p' | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s)[0].results[0].n))')
if [ "$so_phien" != "3" ]; then
  echo "LỖI: seed không chạy — chỉ có ${so_phien:-0}/3 phiên của script này trong D1." >&2
  echo "     Xem lại khối SQL ở trên: có dấu nháy kép hay backtick nào lọt vào không?" >&2
  exit 1
fi

nohup npx wrangler dev --port 8787 --local > /tmp/k3vaceo-dev.log 2>&1 &
until curl -sf -o /dev/null http://127.0.0.1:8787/api/health 2>/dev/null; do sleep 1; done
echo "đã reset và khởi động lại (3 phiên)"
