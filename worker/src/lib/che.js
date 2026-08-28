// Che bớt thông tin liên hệ khi hiển thị.
//
// CHE Ở MÁY CHỦ, KHÔNG CHE Ở GIAO DIỆN. Gửi số thật xuống rồi lấy CSS hay
// JavaScript che đi thì mở tab Network là đọc được nguyên vẹn — che kiểu ấy
// chỉ lừa được người không nghĩ tới việc nhìn.
//
// Vì sao danh bạ phải che số của người CHƯA đăng nhập: số điện thoại là bí mật
// duy nhất giữ cửa /api/onboard/vao, và cửa ấy chỉ mở được hồ sơ chưa ai nhận.
// Bày số của người chưa đăng nhập ra cho cả lớp là trao chìa khoá vào hồ sơ của
// chính họ — ai cũng nhận được chỗ của họ, kể cả chỗ của một trưởng nhóm (mở sổ
// thu, tạo đợt thu, cho người khác ngừng tham gia). Nhận rồi thì cửa ấy đóng
// vĩnh viễn, nên số thôi là chìa khoá và hiện đủ được.

// "0979755857" → "097****857". Giữ ba số đầu (đầu số nhà mạng, ai cũng đoán ra)
// và ba số cuối (đủ để nhận ra đúng người khi đối chiếu danh thiếp).
//
// Bốn chữ số bị giấu = 10^4 khả năng. Với hạn mức 8 lần đoán sai mỗi hồ sơ mỗi
// giờ (routes/onboard.js) thì dò cạn mất khoảng 52 ngày — dài hơn phần còn lại
// của khoá học, nhưng KHÔNG phải là không thể. Muốn chặt hơn thì giảm SO_CUOI
// xuống 2: giấu 5 chữ số thành 10^5, tức hơn 500 ngày.
const SO_DAU = 3;
const SO_CUOI = 3;

export function cheSoDienThoai(v) {
  const s = String(v ?? '').trim();
  if (!s) return null;
  // Ngắn quá thì che sạch: giữ đầu và cuối của một chuỗi 6 ký tự là chẳng giấu
  // được gì. Số sai khuôn trong danh sách gốc rơi vào nhánh này.
  if (s.length <= SO_DAU + SO_CUOI) return '*'.repeat(s.length);
  return s.slice(0, SO_DAU) + '*'.repeat(s.length - SO_DAU - SO_CUOI) + s.slice(-SO_CUOI);
}

// "ngophucuong@gmail.com" → "ng•••••••@gmail.com". Đủ để chính chủ nhận ra hộp
// thư của mình mà người đứng cạnh không đọc được.
//
// Giữ nguyên tên miền: nó không phải bí mật (gmail.com thì ai cũng đoán được),
// mà lại là thứ giúp người ta nhớ ra mình đã khai địa chỉ nào.
export function cheEmail(email) {
  const [ten, mien] = String(email ?? '').split('@');
  if (!mien) return '•••';
  const dau = ten.slice(0, 2);
  return `${dau}${'•'.repeat(Math.max(3, ten.length - 2))}@${mien}`;
}
