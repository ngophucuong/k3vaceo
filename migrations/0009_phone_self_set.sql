-- Đợt 6: cho người có số điện thoại sai trong danh sách gốc tự chữa được.
--
-- Vấn đề: màn tự nhận diện /vao đối chiếu số người dùng gõ với roster.phone.
-- Ai bị Ban tổ chức ghi sai số (Lê Trung Đức: 098778525, thiếu một chữ số) hay
-- không có số nào (44/134 người) thì vĩnh viễn không tự vào được — mỗi lần lại
-- phải xin một link mời. Họ vào bằng link mời, sửa đúng số của mình trong hồ
-- sơ, nhưng lần sau /vao vẫn không nhận vì nó chỉ soi bảng roster.
--
-- Cách chữa: cho /vao chấp nhận cả số trong members.phone. Nhưng members.phone
-- thì người CÙNG NHÓM cũng sửa hộ được (ma trận mục 2.2 SRS cho phép), nên nếu
-- nhận bừa thì thành lỗ hổng: A sửa số của B thành số của A, rồi vào /vao nhận
-- mình là B và đổi luôn email đăng nhập của B.
--
-- Nên thêm cột này: chỉ đánh dấu khi CHÍNH CHỦ tự sửa số của mình. /vao chỉ
-- chấp nhận members.phone khi cột này khác NULL. Người sửa hộ không tạo được
-- dấu này, nên đường sửa hộ không mở ra lối chiếm tài khoản.

ALTER TABLE members ADD COLUMN phone_self_set_at TEXT;

-- Ai đã tự nhận chỗ và đang có số khác số Ban tổ chức ghi thì số ấy do chính
-- họ điền lúc nhận chỗ — đánh dấu luôn, khỏi bắt sửa lại lần nữa.
UPDATE members SET phone_self_set_at = datetime('now')
 WHERE claimed_at IS NOT NULL
   AND phone IS NOT NULL
   AND phone <> COALESCE((SELECT r.phone FROM roster r WHERE r.id = members.roster_id), '');
