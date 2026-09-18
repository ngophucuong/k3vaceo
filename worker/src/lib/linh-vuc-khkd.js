// Mười lăm lĩnh vực làm Kế hoạch kinh doanh cuối khoá — NGUỒN DUY NHẤT.
//
// ══ VÌ SAO CÓ DANH SÁCH NÀY, VÀ VÌ SAO NÓ KHÔNG PHẢI `NGANH` ══════════════
// Ngô Phú Cường (18/9): "Các nhóm hoạt động không hiệu quả nên lớp quyết định
// nộp đề tài tự do theo cá nhân hoặc cùng lĩnh vực, không bắt buộc ai cũng
// phải nộp." Lớp đã bình chọn lĩnh vực trên Zalo và ĐÃ KHOÁ bình chọn; danh
// sách dưới đây chép đúng 15 mục của lượt bình chọn ấy.
//
// `lib/nganh.js` (19 mã) là thứ KHÁC HẲN, đừng gộp:
//   NGANH        — "doanh nghiệp của bạn làm ngành gì", dùng để GHÉP NỐI ở
//                  tab Giao thương. Là sự thật về người ấy, còn giá trị sau
//                  khi khoá học kết thúc.
//   LINH_VUC_KHKD — "bạn làm bài cuối khoá về lĩnh vực nào", dùng để CHIA
//                  NHÓM LÀM BÀI. Hết hạn 26/9, và một người hoàn toàn có thể
//                  làm bài về lĩnh vực không phải ngành của mình.
// Hai danh sách còn khác cả độ mịn: NGANH tách Y tế và Giáo dục làm hai mã,
// lượt bình chọn của lớp gộp làm một.
//
// ══ TIỀN TỐ `lv-` LÀ CỐ Ý ═════════════════════════════════════════════════
// Không có tiền tố thì `bat-dong-san` hợp lệ ở CẢ HAI danh sách, nên một mã
// truyền nhầm từ bên này sang bên kia sẽ được nhận LẶNG LẼ thay vì bị loại.
// Với tiền tố thì không mã nào của danh sách này lọt qua docNganh(), và ngược
// lại — sai là thấy ngay.
//
// Mã đi vào D1 nên KHÔNG ĐƯỢC ĐỔI về sau: đổi mã là mọi dòng đang lưu mã cũ
// thành mồ côi mà không chỗ nào báo lỗi. Đổi NHÃN thì thoải mái.
export const LINH_VUC_KHKD = [
  { ma: 'lv-y-te-giao-duc',      ten: 'Y tế, Giáo dục' },
  { ma: 'lv-che-bien-nlts',      ten: 'Chế biến Nông - Lâm - Thuỷ sản' },
  { ma: 'lv-nhua',               ten: 'Nhựa & các sản phẩm nhựa' },
  { ma: 'lv-giam-sat-an-ninh',   ten: 'Thiết bị giám sát an ninh' },
  { ma: 'lv-luu-tru-du-lich',    ten: 'Dịch vụ lưu trú, ăn uống, du lịch' },
  { ma: 'lv-van-tai-kho-bai',    ten: 'Vận tải, logistic, kho bãi' },
  { ma: 'lv-nang-luong',         ten: 'Năng lượng' },
  { ma: 'lv-xay-dung-vlxd',      ten: 'Xây dựng, sản xuất vật liệu xây dựng' },
  { ma: 'lv-bat-dong-san',       ten: 'Phát triển & Đầu tư Bất động sản' },
  { ma: 'lv-san-xuat-xe',        ten: 'Sản xuất xe, phụ tùng phụ trợ, linh kiện ô tô' },
  { ma: 'lv-cn-che-bien',        ten: 'Công nghiệp chế biến, chế tạo' },
  { ma: 'lv-khai-khoang',        ten: 'Khai khoáng & sản xuất vật liệu' },
  { ma: 'lv-nong-lam-thuy-san',  ten: 'Nông nghiệp - Lâm nghiệp - Thuỷ sản (trồng trọt & chăn nuôi)' },
  { ma: 'lv-bao-bi-det-may',     ten: 'Bao bì - Dệt may - Da giầy' },
  { ma: 'lv-cntt-truyen-thong',  ten: 'Công nghệ thông tin & truyền thông' },
];

const MA_HOP_LE = new Set(LINH_VUC_KHKD.map(x => x.ma));

// CHỈ MỘT lĩnh vực mỗi người, khác NGANH (tối đa 3). Lượt bình chọn của lớp
// là chọn một, và cả mục đích của nó là xếp người vào một chỗ — cho chọn
// nhiều thì Ban cán sự lớp lại không đếm được ai thuộc về đâu, tức mất đúng
// việc mà bảng này sinh ra để làm.
//
// Mã lạ → null (chưa chọn) chứ không báo lỗi: mã lạ chỉ tới được từ giao diện
// cũ còn trong bộ nhớ đệm của trình duyệt sau khi danh mục đổi, và chặn cả
// lần lưu vì một mã thừa thì người dùng mất nguyên phần vừa gõ mà không hiểu
// vì sao — đúng lý lẽ đã ghi cho docNganh().
export function docLinhVucKhkd(giaTri) {
  const ma = String(giaTri ?? '').trim();
  return MA_HOP_LE.has(ma) ? ma : null;
}

export function tenLinhVucKhkd(ma) {
  return LINH_VUC_KHKD.find(x => x.ma === ma)?.ten ?? null;
}
