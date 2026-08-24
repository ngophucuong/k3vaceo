Sửa tệp này rồi đẩy lên là phát MỘT link mời mới. Ba tham số đọc từ chính tệp
này (bấm tay ở Actions → Phát link mời đầu tiên → Run workflow cũng được, lúc
ấy inputs thắng):

  ho_ten:   họ tên đúng như trong bảng members, hoặc như danh sách gốc nếu
            người này chưa có trong members
  nhom:     để trống là chỉ phát link. Điền số nhóm thì người chưa có trong
            members sẽ được THÊM vào nhóm ấy từ danh sách gốc rồi mới phát link
  so_phut:  link sống bao lâu

Mỗi lần chạy tự huỷ link cũ chưa dùng của đúng người đó, nên token in ở lần
chạy trước chết ngay. Link in ra trong log Actions — repo riêng tư nên chỉ chủ
repo đọc được, nhưng nó vẫn là một lối vào tài khoản.

Trong lớp có hai người trùng tên (hai bà Phan Thị Thanh Nga). Với họ thì
workflow dừng chứ không đoán — phải thêm tay theo số thứ tự.

ho_ten: Nguyễn Thị Tùng Vân
nhom: 6
so_phut: 4320

lần: 3
