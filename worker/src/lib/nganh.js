// Danh mục ngành cho danh mục giao thương — NGUỒN DUY NHẤT.
//
// Giao diện (cả tab trong ứng dụng lẫn trang công khai) KHÔNG tự chế danh
// sách này: cả hai nhận nó qua API. Hai bản danh sách thì sớm muộn lệch nhau,
// và triệu chứng không phải một lỗi mà là mã thô 'bat-dong-san' hiện nguyên
// văn ra màn hình cho người dùng đọc.
//
// Mã ngành đi vào cơ sở dữ liệu nên KHÔNG ĐƯỢC ĐỔI về sau — đổi mã là mọi
// dòng đang lưu mã cũ thành mồ côi mà không chỗ nào báo lỗi. Đổi NHÃN thì
// thoải mái. Thêm ngành mới thì thêm vào cuối, trước 'khac'.
//
// Vì sao 19 mã mà không phải bảng phân ngành chuẩn của Tổng cục Thống kê:
// bảng chuẩn có hàng trăm mã bốn cấp, đúng cho báo cáo nhà nước và vô dụng
// cho một hàng chip lọc trên điện thoại. Đây là lớp CEO của doanh nghiệp vừa
// và nhỏ Việt Nam, 134 người — danh sách phải NGẮN đủ để lướt hết trong một
// màn hình, nếu không thì không ai lọc và tính năng lọc thành trang trí.

export const NGANH = [
  { ma: 'bat-dong-san', ten: 'Bất động sản' },
  { ma: 'xay-dung',     ten: 'Xây dựng · Nội thất' },
  { ma: 'san-xuat',     ten: 'Sản xuất · Gia công' },
  { ma: 'thuong-mai',   ten: 'Thương mại · Phân phối' },
  { ma: 'nong-nghiep',  ten: 'Nông nghiệp · Thực phẩm' },
  { ma: 'am-thuc',      ten: 'Nhà hàng · Cà phê' },
  { ma: 'du-lich',      ten: 'Du lịch · Khách sạn' },
  { ma: 'van-tai',      ten: 'Vận tải · Kho vận' },
  { ma: 'cong-nghe',    ten: 'Công nghệ · Phần mềm' },
  { ma: 'truyen-thong', ten: 'Marketing · Truyền thông' },
  { ma: 'giao-duc',     ten: 'Giáo dục · Đào tạo' },
  { ma: 'y-te',         ten: 'Y tế · Dược · Sức khoẻ' },
  { ma: 'tai-chinh',    ten: 'Tài chính · Bảo hiểm' },
  { ma: 'tu-van',       ten: 'Tư vấn · Luật · Kế toán' },
  { ma: 'nhan-su',      ten: 'Nhân sự · Tuyển dụng' },
  { ma: 'thoi-trang',   ten: 'Thời trang · Mỹ phẩm' },
  { ma: 'co-khi',       ten: 'Cơ khí · Điện · Tự động hoá' },
  { ma: 'moi-truong',   ten: 'Môi trường · Năng lượng' },
  { ma: 'khac',         ten: 'Ngành khác' },
];

const MA_HOP_LE = new Set(NGANH.map(n => n.ma));

// Tối đa 3 ngành. Một người bán nhiều thứ là chuyện thường, nhưng ai chọn cả
// mười ngành thì thành ra không ở ngành nào — và bộ lọc mất hết ý nghĩa vì
// người ấy hiện ra ở mọi chip.
export const NGANH_TOI_DA = 3;

// Đọc chuỗi từ máy khách thành danh sách mã đã lọc sạch. Bỏ mã lạ thay vì báo
// lỗi: mã lạ chỉ tới được từ giao diện cũ còn trong bộ nhớ đệm của trình
// duyệt sau khi danh mục đổi, và chặn cả lần lưu vì một mã thừa thì người
// dùng mất nguyên phần vừa gõ mà không hiểu vì sao.
export function docNganh(giaTri) {
  const tho = Array.isArray(giaTri) ? giaTri : String(giaTri ?? '').split(',');
  const sach = [];
  for (const x of tho) {
    const ma = String(x ?? '').trim();
    if (MA_HOP_LE.has(ma) && !sach.includes(ma)) sach.push(ma);
    if (sach.length >= NGANH_TOI_DA) break;
  }
  return sach;
}

// Dạng lưu xuống D1: chuỗi ngăn bằng dấu phẩy, hoặc NULL khi chưa chọn gì.
// NULL chứ không phải chuỗi rỗng — để "chưa chọn ngành" chỉ có đúng một cách
// biểu diễn, khỏi phải nhớ kiểm cả hai ở mọi truy vấn.
export function nganhRaChuoi(danhSach) {
  const sach = docNganh(danhSach);
  return sach.length ? sach.join(',') : null;
}
