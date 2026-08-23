-- Dán vào tab Console của D1 sau khi nạp xong dữ liệu.
-- Kết quả là MỘT dòng. Cột cuối cùng `ket_qua` phải là "ĐÚNG HẾT".
-- Mỗi cột đọc theo dạng "thực tế/mong đợi", ví dụ `hoc_vien_134` ra "134/134".
--
-- Nếu báo "no such table: d1_migrations" thì nghĩa là chưa chạy tệp cuối
-- (scripts/d1-parts/16-ghi-nho-va-kiem-tra.sql) — chạy nó rồi kiểm tra lại.
--
-- Cột `bang_23` đếm theo DANH SÁCH TÊN chứ không đếm tất cả bảng trong lược đồ.
-- Lý do: D1 thật có thêm bảng nội bộ của Cloudflare (bản chạy cục bộ thì không),
-- nên đếm tất cả ra 24 và báo sai oan. Đếm theo tên thì thêm bảng nội bộ nào
-- nữa cũng không ảnh hưởng.
--
-- CỐ Ý KHÔNG DÙNG UNION ALL. D1 từ chối câu lệnh có từ 6 nhánh hợp trở lên khi
-- chạy qua tệp: SQLITE_ERROR "too many terms in compound SELECT". Bản cũ dùng
-- 9 nhánh nên chết. Gộp thành một dòng bằng truy vấn con thì không vướng.

WITH d AS (
  SELECT
    (SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name IN (
       'activity','audit_log','cohorts','credentials','d1_migrations',
       'fund_declarations','fund_rounds','groups','insights','invites',
       'join_requests','links','member_profile','members','officers',
       'plan_sections','plan_template_sections','plan_templates','plans',
       'rate_events','roster','sessions','webauthn_challenges'))            AS bang,
    (SELECT COUNT(*) FROM roster)                                           AS hoc_vien,
    (SELECT COUNT(*) FROM groups)                                           AS nhom,
    (SELECT COUNT(*) FROM roster WHERE phone IS NOT NULL)                   AS dien_thoai,
    (SELECT COUNT(*) FROM members m
       JOIN groups g ON g.id = m.group_id WHERE g.no = 6)                   AS nhom6,
    (SELECT COUNT(*) FROM plan_sections ps
       JOIN plans p ON p.id = ps.plan_id
       JOIN groups g ON g.id = p.group_id WHERE g.no = 6)                   AS phan_bai,
    (SELECT COUNT(*) FROM officers o
       JOIN groups g ON g.id = o.group_id
      WHERE g.no = 6 AND o.superseded_at IS NULL)                           AS co_cau,
    (SELECT COUNT(*) FROM d1_migrations)                                    AS migration,
    (SELECT m.full_name FROM officers o
       JOIN groups g ON g.id = o.group_id
       JOIN members m ON m.id = o.member_id
      WHERE g.no = 6 AND o.role = 'truong_nhom' AND o.superseded_at IS NULL) AS truong_nhom
)
SELECT
  bang       || '/23'                     AS bang_23,
  hoc_vien   || '/134'                    AS hoc_vien_134,
  nhom       || '/10'                     AS nhom_10,
  dien_thoai || '/90'                     AS dien_thoai_90,
  nhom6      || '/14'                     AS nhom6_14,
  phan_bai   || '/8'                      AS phan_bai_8,
  co_cau     || '/2'                      AS co_cau_2,
  migration  || '/6'                      AS migration_6,
  COALESCE(truong_nhom, '(chưa có)')      AS truong_nhom,
  CASE WHEN bang = 23 AND hoc_vien = 134 AND nhom = 10 AND dien_thoai = 90
        AND nhom6 = 14 AND phan_bai = 8 AND co_cau = 2 AND migration = 6
        AND truong_nhom = 'Ngô Phú Cường'
       THEN 'ĐÚNG HẾT' ELSE 'CÓ CHỖ SAI' END AS ket_qua
FROM d;
