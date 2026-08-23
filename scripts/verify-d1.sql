-- Dán vào tab Console của D1 sau khi chạy setup-d1.sql.
-- Cột "ket_qua" phải ra ĐÚNG hết. Chỗ nào "SAI" là nạp chưa xong.

SELECT 'số bảng'              AS muc, COUNT(*) AS thuc_te, 23  AS mong_doi,
       CASE WHEN COUNT(*) = 23  THEN 'ĐÚNG' ELSE 'SAI' END AS ket_qua
  FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
UNION ALL
SELECT 'học viên trong danh sách gốc', COUNT(*), 134,
       CASE WHEN COUNT(*) = 134 THEN 'ĐÚNG' ELSE 'SAI' END FROM roster
UNION ALL
SELECT 'số nhóm', COUNT(*), 10,
       CASE WHEN COUNT(*) = 10  THEN 'ĐÚNG' ELSE 'SAI' END FROM groups
UNION ALL
SELECT 'có số điện thoại', COUNT(*), 90,
       CASE WHEN COUNT(*) = 90  THEN 'ĐÚNG' ELSE 'SAI' END FROM roster WHERE phone IS NOT NULL
UNION ALL
SELECT 'thành viên Nhóm 6', COUNT(*), 14,
       CASE WHEN COUNT(*) = 14  THEN 'ĐÚNG' ELSE 'SAI' END
  FROM members m JOIN groups g ON g.id = m.group_id WHERE g.no = 6
UNION ALL
SELECT 'tám phần bài của Nhóm 6', COUNT(*), 8,
       CASE WHEN COUNT(*) = 8   THEN 'ĐÚNG' ELSE 'SAI' END
  FROM plan_sections ps JOIN plans p ON p.id = ps.plan_id
  JOIN groups g ON g.id = p.group_id WHERE g.no = 6
UNION ALL
SELECT 'cơ cấu Nhóm 6 đang hiệu lực', COUNT(*), 2,
       CASE WHEN COUNT(*) = 2   THEN 'ĐÚNG' ELSE 'SAI' END
  FROM officers o JOIN groups g ON g.id = o.group_id
  WHERE g.no = 6 AND o.superseded_at IS NULL
UNION ALL
SELECT 'migration đã ghi nhớ', COUNT(*), 6,
       CASE WHEN COUNT(*) = 6   THEN 'ĐÚNG' ELSE 'SAI' END FROM d1_migrations
UNION ALL
SELECT 'trưởng nhóm 6 là Ngô Phú Cường', COUNT(*), 1,
       CASE WHEN COUNT(*) = 1   THEN 'ĐÚNG' ELSE 'SAI' END
  FROM officers o JOIN groups g ON g.id = o.group_id JOIN members m ON m.id = o.member_id
  WHERE g.no = 6 AND o.role = 'truong_nhom' AND o.superseded_at IS NULL
    AND m.full_name = 'Ngô Phú Cường';
