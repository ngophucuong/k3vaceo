// Số điện thoại ở đây KHÔNG dùng để gửi gì cả — nó là bằng chứng "đúng là
// tôi" ở bước tự nhận diện: tên thì cả lớp ai cũng biết, còn số thì Ban tổ
// chức đã có sẵn. Vì vậy chỉ cần so cho đúng, không cần gọi ra ngoài.

// Bỏ khoảng trắng, chấm, gạch, ngoặc — người ta gõ "0912 345 678",
// "0912.345.678", "(84) 912345678" đều là một số.
export function normalizePhone(v) {
  if (typeof v !== 'string') return null;
  let s = v.replace(/[\s.\-()]/g, '');
  if (s.startsWith('+84')) s = '0' + s.slice(3);
  else if (s.startsWith('0084')) s = '0' + s.slice(4);
  // "84912345678" là số quốc tế thiếu dấu +; nhưng "0849..." lại là số nội địa
  // hợp lệ bắt đầu bằng 0. Chỉ cắt tiền tố 84 khi KHÔNG có số 0 đứng đầu.
  else if (/^84\d{9}$/.test(s)) s = '0' + s.slice(2);
  if (!/^\d+$/.test(s)) return null;
  return s;
}

// Số di động Việt Nam sau quy hoạch 2018: đúng 10 chữ số, bắt đầu bằng 0.
// Dùng cho ô người dùng gõ vào. KHÔNG dùng để lọc dữ liệu Ban tổ chức đã có —
// trong đó có số sai khuôn (Lê Trung Đức: '098778525', thiếu một chữ số) mà ta
// vẫn phải giữ nguyên để biết đường đi hỏi lại.
export function isValidVnPhone(v) {
  const s = normalizePhone(v);
  return !!s && /^0\d{9}$/.test(s);
}

// So sánh sau khi chuẩn hoá cả hai vế. Số sai khuôn trong danh sách gốc sẽ
// không bao giờ khớp với số 10 chữ số người ta gõ vào — đó là hành vi ĐÚNG:
// nó buộc phải sửa dữ liệu chứ không cho qua bừa.
export function phonesMatch(a, b) {
  const x = normalizePhone(a ?? '');
  const y = normalizePhone(b ?? '');
  return !!x && !!y && x === y;
}
