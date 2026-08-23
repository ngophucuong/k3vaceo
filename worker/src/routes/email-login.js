import { json, error, readJson } from '../lib/http.js';
import { createInviteToken, consumeMagicToken, createSession, sessionCookieHeader, MAGIC_KIND } from '../auth.js';
import { normalizeEmail, isValidEmail } from '../lib/validate.js';
import { mailerConfigured, sendMail } from '../mailer.js';
import { clientIp, allow } from '../lib/ratelimit.js';

const MAGIC_PER_HOUR = 5;

export async function postEmailRequest(request, env, ctx) {
  const body = await readJson(request);
  const email = normalizeEmail(body.email);
  if (!email || !isValidEmail(email)) return error('email_invalid', 422);

  const ip = clientIp(request);
  if (!(await allow(env, 'magic_request', ip, MAGIC_PER_HOUR))) {
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
  if (ctx?.waitUntil) ctx.waitUntil(job); else await job;

  return sameAnswer;
}

export async function postEmailConsume(request, env, token) {
  const ip = clientIp(request);
  if (!(await allow(env, 'invite_try', ip, 20))) {
    return error('rate_limited', 429, { retry_after_minutes: 60 });
  }

  const member = await consumeMagicToken(env, token);
  if (!member) return error('login_link_invalid_or_used', 410);

  const sessionToken = await createSession(env, member.id, request.headers.get('user-agent'));
  const isHttps = new URL(request.url).protocol === 'https:';
  return json(
    { ok: true, member_id: member.id },
    200,
    { 'set-cookie': sessionCookieHeader(sessionToken, isHttps) }
  );
}
