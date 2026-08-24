// Đợt 1 (mục 4.1 SRS): nhận diện qua link mời + phiên cookie.
// Đợt 2 (mục 4.2 SRS): đăng nhập lại bằng email — liên kết một lần, hạn 15 phút.
//
// QUY ƯỚC THỜI GIAN — quan trọng: mọi mốc thời gian đều do SQLite sinh và so
// sánh (`datetime('now', ...)`, dạng "YYYY-MM-DD HH:MM:SS"). Tuyệt đối không
// dùng Date.toISOString() để ghi hạn rồi so bằng SQL: chuỗi ISO có chữ 'T' ở
// vị trí thứ 11 còn SQLite dùng dấu cách, nên khi trùng ngày thì 'T' (0x54)
// luôn lớn hơn ' ' (0x20) — một liên kết đã hết hạn trong ngày vẫn được coi
// là còn hạn. Với liên kết 15 phút của Đợt 2 thì nó sống tới tận nửa đêm.

import { parseCookies } from './lib/http.js';
import { randomToken, randomDigits, sha256Hex, equalsHex } from './lib/crypto.js';

const SESSION_COOKIE = 's';
const SESSION_DAYS = 90;
const INVITE_DAYS = 14;
const MAGIC_MINUTES = 15;
const OTP_MINUTES = 10;
export const OTP_MAX_ATTEMPTS = 5;

export const INVITE_KIND = 'invite';
export const MAGIC_KIND = 'magic';

// Link mời (kind='invite'): hạn 14 ngày, DÙNG NHIỀU LẦN tới khi hết hạn.
// Magic link (kind='magic'): hạn 15 phút, DÙNG MỘT LẦN (đặt used_at khi dùng).
// Hai loại nằm chung bảng invites nhưng tách bằng cột kind, để một magic link
// không thể đem dùng lại ở luồng /i/:token như một lời mời nhiều lần.
export async function createInviteToken(env, memberId, createdBy, kind = INVITE_KIND) {
  const token = randomToken(22);
  const tokenHash = await sha256Hex(token);
  const offset = kind === MAGIC_KIND ? `+${MAGIC_MINUTES} minutes` : `+${INVITE_DAYS} days`;
  await env.DB.prepare(
    `INSERT INTO invites (member_id, token_hash, kind, expires_at, created_by, created_at)
     VALUES (?, ?, ?, datetime('now', ?), ?, datetime('now'))`
  ).bind(memberId, tokenHash, kind, offset, createdBy ?? null).run();
  return token;
}

// Phát lại lời mời: đóng mọi lời mời cũ còn hạn rồi cấp token mới. Không tái
// dùng token cũ được vì chỉ có bản băm trong D1 — mà người mất link thì vẫn
// phải có đường vào, nên cấp mới và vô hiệu cái cũ là cách duy nhất đúng.
export async function reissueInviteToken(env, memberId, createdBy) {
  await env.DB.prepare(
    `UPDATE invites SET used_at = datetime('now')
     WHERE member_id = ? AND kind = ? AND used_at IS NULL AND expires_at > datetime('now')`
  ).bind(memberId, INVITE_KIND).run();
  return createInviteToken(env, memberId, createdBy, INVITE_KIND);
}

export async function resolveInviteToken(env, token, kind = INVITE_KIND) {
  const tokenHash = await sha256Hex(token);
  return env.DB.prepare(
    `SELECT i.id AS invite_id, m.* FROM invites i
     JOIN members m ON m.id = i.member_id
     WHERE i.token_hash = ? AND i.kind = ? AND i.used_at IS NULL
       AND i.expires_at > datetime('now') AND m.is_active = 1`
  ).bind(tokenHash, kind).first();
}

// Magic link dùng một lần: đánh dấu đã dùng ngay khi đổi lấy phiên. Dùng
// UPDATE ... WHERE used_at IS NULL rồi xét số dòng đổi được, để hai request
// đến cùng lúc thì chỉ một cái thắng.
export async function consumeMagicToken(env, token) {
  const row = await resolveInviteToken(env, token, MAGIC_KIND);
  if (!row) return null;
  const res = await env.DB.prepare(
    `UPDATE invites SET used_at = datetime('now') WHERE id = ? AND used_at IS NULL`
  ).bind(row.invite_id).run();
  if (!res.meta?.changes) return null;
  return row;
}

export async function createSession(env, memberId, userAgent) {
  const token = randomToken(32);
  const tokenHash = await sha256Hex(token);
  await env.DB.prepare(
    `INSERT INTO sessions (member_id, token_hash, created_at, expires_at, user_agent)
     VALUES (?, ?, datetime('now'), datetime('now', ?), ?)`
  ).bind(memberId, tokenHash, `+${SESSION_DAYS} days`, userAgent ?? null).run();
  return token;
}

export async function getCurrentMember(request, env) {
  const token = parseCookies(request)[SESSION_COOKIE];
  if (!token) return null;
  const tokenHash = await sha256Hex(token);
  // Kèm luôn số nhóm: nội dung chuyển khoản ({NHOM}) và vài chỗ khác cần đến
  // nó, lấy sẵn ở đây đỡ phải truy vấn lại mỗi lần.
  const row = await env.DB.prepare(
    `SELECT m.*, g.no AS group_no FROM sessions s
     JOIN members m ON m.id = s.member_id
     LEFT JOIN groups g ON g.id = m.group_id
     WHERE s.token_hash = ? AND s.expires_at > datetime('now') AND m.is_active = 1`
  ).bind(tokenHash).first();
  return row ?? null;
}

// Secure chỉ bật khi request thật sự qua HTTPS — cho phép chạy cục bộ qua
// http://localhost khi phát triển (trình duyệt bỏ qua cookie Secure trên http).
export function sessionCookieHeader(token, isHttps, maxAgeSeconds = SESSION_DAYS * 86400) {
  const parts = [`${SESSION_COOKIE}=${token}`, 'Path=/', 'HttpOnly', 'SameSite=Lax', `Max-Age=${maxAgeSeconds}`];
  if (isHttps) parts.push('Secure');
  return parts.join('; ');
}

export function clearSessionCookieHeader(isHttps) {
  return sessionCookieHeader('', isHttps, 0);
}

/* ══ OTP 6 số qua email (Đợt 5) ══════════════════════════════════════════
   Khác magic link ở hai chỗ, và cả hai đều bắt buộc:

   1. Mã 6 số chỉ có MỘT TRIỆU khả năng. Không đếm số lần nhập sai thì dò được
      trong vài phút. Vì vậy mỗi mã có bộ đếm riêng, quá OTP_MAX_ATTEMPTS lần
      là mã chết, phải xin mã mới.
   2. Mã lưu dưới dạng băm kèm member_id — cùng một mã "123456" của hai người
      khác nhau cho ra hai bản băm khác nhau, nên không ai lấy mã của mình đi
      thử vào tài khoản người khác được.

   Vì sao 6 số mà không phải link: bấm link trong app Gmail sẽ mở bằng trình
   duyệt nội bộ của app, cookie phiên rơi vào đó chứ không vào trình duyệt
   thật — người dùng quay lại Safari/Chrome thì vẫn chưa đăng nhập. Gõ 6 số
   thì không dính. */

export async function createOtp(env, memberId) {
  // Xin mã mới là mã cũ chết ngay. Nếu để cả hai cùng sống thì kẻ dò có hai
  // lần bộ đếm cho cùng một tài khoản.
  await env.DB.prepare(
    `UPDATE otp_codes SET used_at = datetime('now')
     WHERE member_id = ? AND used_at IS NULL`
  ).bind(memberId).run();

  const code = randomDigits(6);
  await env.DB.prepare(
    `INSERT INTO otp_codes (member_id, code_hash, expires_at, created_at)
     VALUES (?, ?, datetime('now', ?), datetime('now'))`
  ).bind(memberId, await sha256Hex(`${memberId}:${code}`), `+${OTP_MINUTES} minutes`).run();

  return { code, minutes: OTP_MINUTES };
}

export async function verifyOtp(env, memberId, code) {
  const row = await env.DB.prepare(
    `SELECT id, code_hash, attempts FROM otp_codes
     WHERE member_id = ? AND used_at IS NULL AND expires_at > datetime('now')
     ORDER BY id DESC LIMIT 1`
  ).bind(memberId).first();
  if (!row) return { ok: false, reason: 'otp_expired' };
  if (row.attempts >= OTP_MAX_ATTEMPTS) return { ok: false, reason: 'otp_locked' };

  if (!equalsHex(await sha256Hex(`${memberId}:${code}`), row.code_hash)) {
    await env.DB.prepare('UPDATE otp_codes SET attempts = attempts + 1 WHERE id = ?')
      .bind(row.id).run();
    const conLai = OTP_MAX_ATTEMPTS - (row.attempts + 1);
    return conLai > 0
      ? { ok: false, reason: 'otp_wrong', con_lai: conLai }
      : { ok: false, reason: 'otp_locked' };
  }

  // Đánh dấu đã dùng bằng UPDATE ... WHERE used_at IS NULL rồi xét số dòng
  // đổi được — hai request đến cùng lúc thì chỉ một cái thắng, giống hệt cách
  // magic link chống dùng lại.
  const res = await env.DB.prepare(
    `UPDATE otp_codes SET used_at = datetime('now') WHERE id = ? AND used_at IS NULL`
  ).bind(row.id).run();
  if (!res.meta?.changes) return { ok: false, reason: 'otp_expired' };
  return { ok: true };
}
