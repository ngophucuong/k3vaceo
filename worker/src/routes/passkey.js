// Passkey — mục 4.3 SRS.
//
// Ba điều SRS nói rõ và code này phải giữ:
//  1. rp.id cố định theo tên miền. Đổi tên miền là mọi passkey chết — không
//     cứu được, nên RP_ID lấy từ biến môi trường và mặc định là tên miền thật.
//  2. Passkey là lối đi nhanh, KHÔNG phải danh tính. Email luôn là đường lui,
//     nên không có chỗ nào bắt buộc phải có passkey mới vào được.
//  3. Trưởng nhóm gỡ được passkey của thành viên khi họ đổi máy — nếu không
//     thì mọi lời kêu cứu đổ về một người.

import {
  generateRegistrationOptions, verifyRegistrationResponse,
  generateAuthenticationOptions, verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import { json, error, readJson } from '../lib/http.js';
import { createSession, sessionCookieHeader } from '../auth.js';
import { isGroupOfficer, logAudit } from '../permissions.js';
import { cleanText } from '../lib/validate.js';
import { randomToken } from '../lib/crypto.js';
import { clientIp, allow } from '../lib/ratelimit.js';

const CHALLENGE_MINUTES = 5;

function rpId(request, env) {
  return env.RP_ID || new URL(request.url).hostname;
}
function expectedOrigin(request) {
  return new URL(request.url).origin;
}

const b64uToBytes = s => {
  const b = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(b, c => c.charCodeAt(0));
};
const bytesToB64u = bytes =>
  btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

async function saveChallenge(env, { memberId, challenge, kind }) {
  const id = randomToken(24);
  await env.DB.prepare(
    `INSERT INTO webauthn_challenges (id, member_id, challenge, kind, created_at, expires_at)
     VALUES (?, ?, ?, ?, datetime('now'), datetime('now', ?))`
  ).bind(id, memberId ?? null, challenge, kind, `+${CHALLENGE_MINUTES} minutes`).run();
  return id;
}

// Lấy ra và xoá luôn — challenge dùng một lần, giữ lại là mở đường phát lại
// chữ ký cũ.
async function takeChallenge(env, id, kind) {
  if (!id) return null;
  const row = await env.DB.prepare(
    `SELECT * FROM webauthn_challenges WHERE id = ? AND kind = ? AND expires_at > datetime('now')`
  ).bind(id, kind).first();
  await env.DB.prepare('DELETE FROM webauthn_challenges WHERE id = ? OR expires_at < datetime(\'now\')').bind(id).run();
  return row;
}

/* ══ Đăng ký passkey (phải đang đăng nhập) ══ */
export async function postRegisterOptions(request, env, me) {
  const existing = await env.DB.prepare(
    'SELECT credential_id FROM credentials WHERE member_id = ?'
  ).bind(me.id).all();

  const options = await generateRegistrationOptions({
    rpName: 'k3vaceo',
    rpID: rpId(request, env),
    userID: new TextEncoder().encode(String(me.id)),
    userName: me.email || me.full_name,
    userDisplayName: me.full_name,
    attestationType: 'none',
    // Không cho đăng ký trùng một khoá đã có trên cùng máy.
    excludeCredentials: (existing.results ?? []).map(c => ({ id: c.credential_id })),
    authenticatorSelection: { residentKey: 'preferred', userVerification: 'preferred' },
  });

  const handle = await saveChallenge(env, { memberId: me.id, challenge: options.challenge, kind: 'register' });
  return json({ handle, options });
}

export async function postRegisterVerify(request, env, me, ip) {
  const body = await readJson(request);
  const saved = await takeChallenge(env, body.handle, 'register');
  if (!saved || saved.member_id !== me.id) return error('challenge_invalid', 410);

  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response: body.response,
      expectedChallenge: saved.challenge,
      expectedOrigin: expectedOrigin(request),
      expectedRPID: rpId(request, env),
      requireUserVerification: false,
    });
  } catch (err) {
    console.error('passkey register verify:', String(err));
    return error('passkey_verify_failed', 400);
  }
  if (!verification.verified || !verification.registrationInfo) return error('passkey_verify_failed', 400);

  const { credential } = verification.registrationInfo;
  const label = cleanText(body.label, 60) ?? 'Thiết bị của tôi';

  try {
    await env.DB.prepare(
      `INSERT INTO credentials (member_id, credential_id, public_key, sign_count, label, created_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'))`
    ).bind(me.id, credential.id, bytesToB64u(credential.publicKey), credential.counter ?? 0, label).run();
  } catch (err) {
    if (String(err).includes('UNIQUE')) return error('passkey_already_registered', 409);
    throw err;
  }

  await logAudit(env, { actorId: me.id, action: 'passkey.register', targetType: 'member', targetId: me.id, after: { label }, ip });
  return json({ ok: true, label });
}

/* ══ Đăng nhập bằng passkey (chưa đăng nhập) ══ */
export async function postLoginOptions(request, env) {
  if (!(await allow(env, 'invite_try', clientIp(request), 20))) {
    return error('rate_limited', 429, { retry_after_minutes: 60 });
  }
  // Không nhận danh sách credential theo email: làm thế là biến endpoint này
  // thành máy dò xem email nào đã đăng ký passkey. Dùng discoverable
  // credential, để chính passkey khai danh tính qua userHandle.
  const options = await generateAuthenticationOptions({
    rpID: rpId(request, env),
    userVerification: 'preferred',
  });
  const handle = await saveChallenge(env, { memberId: null, challenge: options.challenge, kind: 'authenticate' });
  return json({ handle, options });
}

export async function postLoginVerify(request, env) {
  const body = await readJson(request);
  const saved = await takeChallenge(env, body.handle, 'authenticate');
  if (!saved) return error('challenge_invalid', 410);

  const credentialId = body.response?.id;
  if (!credentialId) return error('passkey_verify_failed', 400);

  const cred = await env.DB.prepare(
    `SELECT c.*, m.is_active FROM credentials c JOIN members m ON m.id = c.member_id
     WHERE c.credential_id = ?`
  ).bind(credentialId).first();
  if (!cred || !cred.is_active) return error('passkey_unknown', 410);

  let verification;
  try {
    verification = await verifyAuthenticationResponse({
      response: body.response,
      expectedChallenge: saved.challenge,
      expectedOrigin: expectedOrigin(request),
      expectedRPID: rpId(request, env),
      credential: {
        id: cred.credential_id,
        publicKey: b64uToBytes(cred.public_key),
        counter: cred.sign_count ?? 0,
      },
      requireUserVerification: false,
    });
  } catch (err) {
    console.error('passkey login verify:', String(err));
    return error('passkey_verify_failed', 400);
  }
  if (!verification.verified) return error('passkey_verify_failed', 400);

  await env.DB.prepare(
    `UPDATE credentials SET sign_count = ?, last_used_at = datetime('now') WHERE id = ?`
  ).bind(verification.authenticationInfo.newCounter, cred.id).run();

  const token = await createSession(env, cred.member_id, request.headers.get('user-agent'));
  const isHttps = new URL(request.url).protocol === 'https:';
  return json({ ok: true, member_id: cred.member_id }, 200, {
    'set-cookie': sessionCookieHeader(token, isHttps),
  });
}

/* ══ Quản lý passkey ══ */
export async function listPasskeys(env, me, targetId) {
  const id = targetId ?? me.id;
  if (id !== me.id) {
    const target = await env.DB.prepare('SELECT id FROM members WHERE id = ? AND group_id = ?').bind(id, me.group_id).first();
    if (!target) return error('not_found', 404);
    if (!(await isGroupOfficer(env, me.id, me.group_id))) return error('forbidden', 403);
  }
  const rows = await env.DB.prepare(
    'SELECT id, label, created_at, last_used_at FROM credentials WHERE member_id = ? ORDER BY id'
  ).bind(id).all();
  return json({ passkeys: rows.results ?? [] });
}

// Tự gỡ passkey của mình, hoặc trưởng/phó nhóm gỡ hộ người cùng nhóm khi họ
// đổi máy (mục 4.3 SRS). Gỡ hết passkey không khoá ai ra ngoài — email vẫn là
// đường lui.
export async function deletePasskey(env, me, credId, ip) {
  const cred = await env.DB.prepare(
    `SELECT c.*, m.group_id, m.full_name FROM credentials c JOIN members m ON m.id = c.member_id
     WHERE c.id = ? AND m.group_id = ?`
  ).bind(credId, me.group_id).first();
  if (!cred) return error('not_found', 404);

  const allowed = cred.member_id === me.id || await isGroupOfficer(env, me.id, me.group_id);
  if (!allowed) return error('forbidden', 403);

  await env.DB.prepare('DELETE FROM credentials WHERE id = ?').bind(credId).run();
  await logAudit(env, {
    actorId: me.id, action: 'passkey.remove', targetType: 'member', targetId: cred.member_id,
    before: { label: cred.label }, ip,
  });
  return json({ ok: true });
}
