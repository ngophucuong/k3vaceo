// Giới hạn tần suất theo mục 8 SRS ("20 lần thử token mời mỗi IP mỗi giờ").
// Đếm bằng D1 vì công cụ này không dùng KV/Durable Object — với quy mô 134
// người thì bảng rate_events chỉ vài chục dòng mỗi giờ, đếm thẳng là đủ.

export function clientIp(request) {
  return request.headers.get('cf-connecting-ip')
    || request.headers.get('x-forwarded-for')?.split(',')[0].trim()
    || 'unknown';
}

// Trả về true nếu request này được phép đi tiếp.
export async function allow(env, bucket, ip, limitPerHour) {
  const row = await env.DB.prepare(
    `SELECT COUNT(*) AS n FROM rate_events
     WHERE bucket = ? AND ip = ? AND created_at > datetime('now', '-1 hour')`
  ).bind(bucket, ip).first();
  if ((row?.n ?? 0) >= limitPerHour) return false;

  await env.DB.prepare(
    `INSERT INTO rate_events (bucket, ip, created_at) VALUES (?, ?, datetime('now'))`
  ).bind(bucket, ip).run();

  // Dọn rác cơ hội: thỉnh thoảng xoá bản ghi quá 1 ngày để bảng không phình.
  if ((row?.n ?? 0) === 0) {
    await env.DB.prepare(`DELETE FROM rate_events WHERE created_at < datetime('now', '-1 day')`).run();
  }
  return true;
}
