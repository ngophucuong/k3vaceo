// Đợt 1 (mục 4.1 SRS): nhận diện qua link mời + phiên cookie. Chưa có đăng
// nhập lại bằng email (Đợt 2) — bảng invites đã tính trước để dùng chung cho
// cả hai (xem ghi chú ở createInviteToken).

import { parseCookies } from './lib/http.js';
import { randomToken, sha256Hex } from './lib/crypto.js';

const SESSION_COOKIE = 's';
const SESSION_DAYS = 90;
const INVITE_DAYS = 14;

function daysFromNow(n) {
  return new Date(Date.now() + n * 86400000).toISOString();
}

// Token mời: 22 ký tự, hạn 14 ngày, DÙNG NHIỀU LẦN tới khi hết hạn — vì vậy
// hàm đọc token (xem routes/invite.js) không bao giờ đặt used_at. Đợt 2 sẽ
// thêm một hàm tạo riêng cho magic link (hạn 15 phút, đặt used_at sau khi
// dùng) trên cùng bảng này — không đổi schema, chỉ khác thời hạn và cách đọc.
export async function createInviteToken(env, memberId, createdBy) {
  const token = randomToken(22);
  const tokenHash = await sha256Hex(token);
  await env.DB.prepare(
    `INSERT INTO invites (member_id, token_hash, expires_at, created_by, created_at)
     VALUES (?, ?, ?, ?, datetime('now'))`
  ).bind(memberId, tokenHash, daysFromNow(INVITE_DAYS), createdBy ?? null).run();
  return token;
}

// Trả về lời mời còn hạn gần nhất nếu có, để "phát lại" không sinh token mới
// vô tội vạ mỗi lần bấm; chỉ tạo mới khi không còn cái nào hợp lệ.
export async function reuseOrCreateInviteToken(env, memberId, createdBy) {
  const existing = await env.DB.prepare(
    `SELECT id FROM invites WHERE member_id = ? AND expires_at > datetime('now') ORDER BY created_at DESC LIMIT 1`
  ).bind(memberId).first();
  if (existing) return null; // đã có lời mời còn hạn — không lộ lại token cũ (chỉ có hash được lưu)
  return createInviteToken(env, memberId, createdBy);
}

export async function resolveInviteToken(env, token) {
  const tokenHash = await sha256Hex(token);
  const row = await env.DB.prepare(
    `SELECT i.id AS invite_id, i.expires_at, m.* FROM invites i
     JOIN members m ON m.id = i.member_id
     WHERE i.token_hash = ?`
  ).bind(tokenHash).first();
  if (!row) return null;
  if (row.expires_at <= new Date().toISOString()) return null;
  return row;
}

export async function createSession(env, memberId, userAgent) {
  const token = randomToken(32);
  const tokenHash = await sha256Hex(token);
  await env.DB.prepare(
    `INSERT INTO sessions (member_id, token_hash, created_at, expires_at, user_agent)
     VALUES (?, ?, datetime('now'), ?, ?)`
  ).bind(memberId, tokenHash, daysFromNow(SESSION_DAYS), userAgent ?? null).run();
  return token;
}

export async function getCurrentMember(request, env) {
  const token = parseCookies(request)[SESSION_COOKIE];
  if (!token) return null;
  const tokenHash = await sha256Hex(token);
  const row = await env.DB.prepare(
    `SELECT m.* FROM sessions s JOIN members m ON m.id = s.member_id
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
