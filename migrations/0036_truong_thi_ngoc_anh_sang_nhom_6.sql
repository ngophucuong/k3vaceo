-- Chuyển Trương Thị Ngọc Anh (member id 43) từ Nhóm 4 sang Nhóm 6.
-- Ngô Phú Cường yêu cầu trực tiếp 9/9.
--
-- ══ ĐÂY LÀ LOẠI MIGRATION ĐẦU TIÊN LÀM VIỆC NÀY ═════════════════════════
-- Không có route nào đổi group_id của một hồ sơ `members` đã tồn tại —
-- patchMember (routes/members.js) không nhận trường này, group_id chỉ được
-- ghi MỘT LẦN lúc tạo hồ sơ (nhận link mời / /vao / wizard) rồi khoá cứng.
-- Tra hết migration cũ (0021, 0022 — vụ Lưu Minh Tiến) thì cả hai đều là
-- SỬA NHÓM NGAY LÚC TẠO hồ sơ lần đầu, không phải chuyển một người đang
-- hoạt động từ nhóm này sang nhóm khác. Đây là UPDATE đầu tiên loại này.
--
-- ══ ĐÃ SOI D1 THẬT TRƯỚC KHI VIẾT (workflow "Soi dữ liệu thật", 9/9) ═════
-- roster: id=135, seq=135, group_label='Nhóm 4' (migration 0023, 4/9) — số
--   điện thoại 086689856 thiếu một chữ số, ghi nguyên văn, KHÔNG sửa ở đây.
-- members: id=43, roster_id=135, group_id hiện là Nhóm 4 (id 4), is_active=1,
--   claimed_at='2026-09-05 00:33:40' — cô ấy đã tự nhận hồ sơ qua email
--   anhttn@mindx.com.vn chỉ một ngày sau khi được thêm vào roster.
-- officers: KHÔNG có dòng nào — cô ấy không giữ chức vụ gì ở Nhóm 4.
-- plan_sections: KHÔNG có dòng nào owner_member_id hay present_member_id
--   trỏ tới cô ấy — không giữ phần bài, không giữ suất thuyết trình.
--
-- Nhờ hai điều cuối, đây là ca ĐƠN GIẢN NHẤT có thể: chỉ cần đổi group_id,
-- không cần supersede vai nào (permissions.js isGroupOfficer sẽ tự đúng vì
-- không có bản ghi nào để mà dính), không cần nhả phần bài nào về "chưa ai
-- nhận". Nếu sau này lặp lại việc này cho người khác, PHẢI soi lại cả hai
-- bảng ấy trước — một người đang giữ chức hoặc đang giữ phần bài thì đổi
-- group_id suông sẽ để lại quyền/phần việc dính vào nhóm cũ, không chỗ nào
-- báo lỗi.
--
-- roster.group_label GIỮ NGUYÊN 'Nhóm 4' làm bản ghi lịch sử — đúng quy ước
-- đã dùng cho mọi lần lệch nhóm trước (Nguyễn Thị Tùng Vân, Lưu Minh Tiến):
-- đó là bản ghi gốc của Ban tổ chức tại thời điểm ghi danh, không phải nơi
-- người đó đang thật sự học. Nhóm THẬT chỉ đặt vào members.group_id.
--
-- Điều kiện WHERE khoá chặt vào đúng dòng đã soi (id + roster_id + group cũ)
-- chứ không chỉ theo full_name — tên trùng nhau không hiếm trong roster này
-- (hai người tên Tiến, hai người tên Phan Thị Thanh Nga).
UPDATE members
   SET group_id = (SELECT id FROM groups WHERE cohort_id = 1 AND no = 6),
       updated_at = datetime('now')
 WHERE id = 43
   AND roster_id = 135
   AND group_id = (SELECT id FROM groups WHERE cohort_id = 1 AND no = 4);
