-- Đợt 4 — wizard cho nhóm khác và bảng phân công thuyết trình.

-- Bước 3 của wizard (mục 5 SRS): nhóm đã có người dựng thì người thứ hai
-- chuyển sang luồng "xin vào nhóm, gửi yêu cầu cho trưởng nhóm hiện tại".
-- Phần lớn trường hợp sẽ không cần đến bảng này — người trong danh sách gốc
-- đã được wizard tạo sẵn dòng members, chỉ cần trưởng nhóm phát lại link mời.
-- Bảng dành cho trường hợp còn lại: người bị bỏ sót ở bước 5, hoặc người muốn
-- đổi sang nhóm khác với nhóm ghi trong danh sách.
CREATE TABLE join_requests (
  id INTEGER PRIMARY KEY,
  cohort_id INTEGER NOT NULL,
  group_id INTEGER NOT NULL,
  roster_id INTEGER,                     -- NULL nếu người này không có trong danh sách gốc
  full_name TEXT NOT NULL,
  email TEXT,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | accepted | declined
  decided_by INTEGER, decided_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX ix_join_requests_group ON join_requests(group_id, status);

-- Phân công thuyết trình 20 phút. Để ngay trong plan_sections vì mỗi phần bài
-- ứng với một lượt nói — tách bảng riêng chỉ để giữ hai cột là thừa.
-- Ba-rem chấm "không quá 20 phút" và "nhiều người cùng nói", nên giao diện
-- cộng tổng phút và đếm số người nói khác nhau từ hai cột này.
ALTER TABLE plan_sections ADD COLUMN present_member_id INTEGER;
ALTER TABLE plan_sections ADD COLUMN present_minutes INTEGER;
