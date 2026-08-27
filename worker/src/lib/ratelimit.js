// Giới hạn tần suất theo mục 8 SRS ("20 lần thử token mời mỗi IP mỗi giờ").
// Đếm bằng D1 vì công cụ này không dùng KV/Durable Object — với quy mô 134
// người thì bảng rate_events chỉ vài chục dòng mỗi giờ, đếm thẳng là đủ.
//
// ĐẾM LẦN ĐOÁN, ĐỪNG ĐẾM NGƯỜI — bài học ngày 27/8, đo được chứ không suy
// đoán (scripts/kiem/kiem-tanso.mjs).
//
// Mọi cửa vào đều khoá theo địa chỉ IP và tính CẢ lượt thành công. Nhưng lớp
// này học chung một hội trường: 134 người ngồi sau một bộ định tuyến thì
// Cloudflare thấy đúng một địa chỉ IP. Nhà mạng di động Việt Nam cũng dùng
// NAT quy mô lớn, nên hai người lạ mặt vẫn có thể chung một địa chỉ. Hệ quả
// đo được trên bản chưa sửa:
//
//   • người thứ 11 vào lần đầu       → 429
//   • người thứ 21 đăng nhập passkey → 429
//   • link mời thì chết ngay từ lượt ĐẦU TIÊN, vì passkey dùng chung thùng
//     'invite_try' và đã ăn hết 20 lượt
//
// Cách chữa không phải là nới số lên, mà là đếm đúng thứ: một lượt THÀNH CÔNG
// không phải "lần thử". Vì vậy allow() được tách đôi — conQuota() hỏi còn chỗ
// không, ghiNhan() ghi một lần thử hụt — để chỗ gọi tự quyết định lượt nào
// đáng tính. Thùng nào chỉ cần "mỗi IP N lần" thì vẫn gọi allow() như cũ.

export function clientIp(request) {
  return request.headers.get('cf-connecting-ip')
    || request.headers.get('x-forwarded-for')?.split(',')[0].trim()
    || 'unknown';
}

// Còn chỗ trong hạn mức không — KHÔNG ghi gì. Khoá có thể là địa chỉ IP, địa
// chỉ email, hay số thứ tự hồ sơ; cột trong D1 vẫn tên là `ip` vì đổi tên cột
// đòi một migration mà không được thêm gì.
export async function conQuota(env, bucket, khoa, limitPerHour) {
  const row = await env.DB.prepare(
    `SELECT COUNT(*) AS n FROM rate_events
     WHERE bucket = ? AND ip = ? AND created_at > datetime('now', '-1 hour')`
  ).bind(bucket, khoa).first();
  return (row?.n ?? 0) < limitPerHour;
}

// Ghi một lần thử vào sổ.
export async function ghiNhan(env, bucket, khoa) {
  await env.DB.prepare(
    `INSERT INTO rate_events (bucket, ip, created_at) VALUES (?, ?, datetime('now'))`
  ).bind(bucket, khoa).run();

  // Dọn rác cơ hội: thỉnh thoảng xoá bản ghi quá 1 ngày để bảng không phình.
  // Mốc cũ là "lần ghi đầu tiên của thùng này" — nay chỉ tính lần thử hụt nên
  // có thùng cả tuần không ghi dòng nào, thành ra chẳng bao giờ dọn. Gieo
  // ngẫu nhiên thay vì theo bộ đếm: khoảng 3 trên 100 lượt ghi thì dọn một lần.
  if (Math.random() < 0.03) {
    await env.DB.prepare(`DELETE FROM rate_events WHERE created_at < datetime('now', '-1 day')`).run();
  }
}

// Đếm rồi ghi luôn — nghĩa cũ, giữ cho những chỗ mà mỗi lượt gọi đều là một
// lần thử thật (xin gửi thư chẳng hạn: gửi được cũng vẫn là một lá thư đi).
export async function allow(env, bucket, khoa, limitPerHour) {
  if (!(await conQuota(env, bucket, khoa, limitPerHour))) return false;
  await ghiNhan(env, bucket, khoa);
  return true;
}
