import { json, error, readJson } from '../lib/http.js';
import { createInviteToken, consumeMagicToken, createSession, sessionCookieHeader, MAGIC_KIND } from '../auth.js';
import { normalizeEmail, isValidEmail } from '../lib/validate.js';
import { mailerConfigured, sendMail } from '../mailer.js';
import { clientIp, allow, conQuota, ghiNhan } from '../lib/ratelimit.js';

// Khoá theo EMAIL là cửa thật ở đây: thứ cần chặn là dội thư vào một hộp thư.
// Bản cũ khoá 5 lượt/IP/giờ và không khoá theo email chút nào — vừa hụt cửa
// thật, vừa khoá oan cả lớp ngồi chung một WiFi từ người thứ sáu. Cùng một lỗi
// đã sửa cho mã 6 số hồi Đợt 5, chỗ này sót lại.
const MAGIC_PER_EMAIL_HOUR = 5;   // cửa thật — chặn dội thư
// Đặt bằng đúng OTP_PER_HOUR bên onboard.js, và TRÊN sĩ số lớp: hai đường gửi
// thư này chịu cùng một trần thật (134 người × 5 lượt, do khoá theo email
// quyết định), nên để hai con số khác nhau chỉ tổ phải nhớ hai chỗ.
const MAGIC_PER_IP_HOUR = 150;    // chỉ để chặn máy quét

export async function postEmailRequest(request, env, ctx) {
  const body = await readJson(request);
  const email = normalizeEmail(body.email);
  if (!email || !isValidEmail(email)) return error('email_invalid', 422);

  // Khoá theo email áp cho MỌI địa chỉ, dù có thật hay không: chỉ áp cho email
  // có thật thì chính cái khoá ấy lộ ra địa chỉ nào đã đăng ký.
  const ip = clientIp(request);
  if (!(await allow(env, 'magic_email', email, MAGIC_PER_EMAIL_HOUR)) ||
      !(await allow(env, 'magic_request', ip, MAGIC_PER_IP_HOUR))) {
    return error('rate_limited', 429, { retry_after_minutes: 60 });
  }

  const member = await env.DB.prepare(
    'SELECT id, full_name, email FROM members WHERE email = ? AND is_active = 1'
  ).bind(email).first();

  // Luôn trả về cùng một câu, kể cả khi email không có trong lớp — nếu không
  // thì bất kỳ ai cũng dò được ai đã đăng ký bằng cách thử từng địa chỉ.
  const sameAnswer = json({ ok: true, sent_if_known: true });
  if (!member) return sameAnswer;

  if (!mailerConfigured(env)) return error('mailer_not_configured', 503);

  const token = await createInviteToken(env, member.id, null, MAGIC_KIND);
  const url = `${new URL(request.url).origin}/dangnhap/${token}`;
  const text = [
    `Chào ${member.full_name},`,
    '',
    'Mở đường dẫn dưới đây để vào lại công cụ nhóm K03:',
    url,
    '',
    'Đường dẫn dùng một lần và hết hạn sau 15 phút.',
    'Nếu bạn không yêu cầu đăng nhập thì bỏ qua thư này.',
  ].join('\n');

  // Gửi thư sau khi đã trả lời, để người dùng không phải chờ SMTP bắt tay
  // xong mới thấy màn hình phản hồi.
  const job = sendMail(env, { to: member.email, subject: 'Đường dẫn đăng nhập k3vaceo', text })
    .catch(err => console.error('Gửi thư đăng nhập thất bại:', String(err)));
  // CHỜ gửi xong rồi mới trả lời — xem chú thích dài trong routes/onboard.js:
  // đẩy việc gửi sang ctx.waitUntil thì Cloudflare dọn Worker đi giữa lúc còn
  // đang bắt tay SMTP, thư chết lặng lẽ mà log không có dòng nào.
  await job;

  return sameAnswer;
}

export async function postEmailConsume(request, env, token) {
  // Chung sổ với token lời mời (mục 8 SRS) — cùng một kiểu bí mật, cùng một
  // cách dò. Nhưng chỉ tính lần thử HỤT: bấm đúng link trong hộp thư của mình
  // không phải một lần thử, và cả lớp cùng bấm trên một WiFi thì không được
  // khoá lẫn nhau.
  const ip = clientIp(request);
  if (!(await conQuota(env, 'invite_try', ip, 20))) {
    return error('rate_limited', 429, { retry_after_minutes: 60 });
  }

  const member = await consumeMagicToken(env, token);
  if (!member) {
    await ghiNhan(env, 'invite_try', ip);
    return error('login_link_invalid_or_used', 410);
  }

  const sessionToken = await createSession(env, member.id, request.headers.get('user-agent'));
  const isHttps = new URL(request.url).protocol === 'https:';
  return json(
    { ok: true, member_id: member.id },
    200,
    { 'set-cookie': sessionCookieHeader(sessionToken, isHttps) }
  );
}
