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
