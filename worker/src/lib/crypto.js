// Bỏ ký tự dễ đọc nhầm khi phải gõ tay (0/O, 1/l/I) — token vẫn đủ dài để không cần đến chúng.
const TOKEN_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';

// Loại bỏ byte rơi vào phần dư để mọi ký tự có xác suất bằng nhau. Lấy thẳng
// b % 56 sẽ khiến 32 ký tự đầu bảng xuất hiện nhiều hơn số còn lại (256 không
// chia hết cho 56) — chưa tới mức đoán được token, nhưng đây là token xác
// thực nên không có lý do gì để chấp nhận lệch.
const LIMIT = Math.floor(256 / TOKEN_ALPHABET.length) * TOKEN_ALPHABET.length;

export function randomToken(length = 22) {
  let out = '';
  while (out.length < length) {
    for (const b of crypto.getRandomValues(new Uint8Array(length))) {
      if (b >= LIMIT) continue;
      out += TOKEN_ALPHABET[b % TOKEN_ALPHABET.length];
      if (out.length === length) break;
    }
  }
  return out;
}

export async function sha256Hex(text) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
}

// Mã OTP 6 số. Cũng loại byte rơi vào phần dư như randomToken: lấy thẳng
// b % 10 thì chữ số 0–5 xuất hiện nhiều hơn 6–9 (256 không chia hết cho 10).
// Mã chỉ có một triệu khả năng nên không được phép lệch thêm chút nào.
const DIGIT_LIMIT = 250; // 250 = 25 × 10, bội của 10 lớn nhất dưới 256

export function randomDigits(length = 6) {
  let out = '';
  while (out.length < length) {
    for (const b of crypto.getRandomValues(new Uint8Array(length))) {
      if (b >= DIGIT_LIMIT) continue;
      out += String(b % 10);
      if (out.length === length) break;
    }
  }
  return out;
}

// So sánh hai chuỗi hex trong thời gian không phụ thuộc nội dung. Với hash thì
// rò rỉ thời gian gần như không khai thác được (kẻ tấn công không nặn được
// tiền tố hash nếu chưa biết mã), nhưng đây là đường xác thực nên không có lý
// do gì để dùng === sớm-thoát.
export function equalsHex(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
