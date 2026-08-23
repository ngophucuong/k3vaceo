import { json, error, readJson } from '../lib/http.js';
import { resolveInviteToken, createSession, sessionCookieHeader } from '../auth.js';
import { logActivity } from '../permissions.js';
import { cleanText, normalizeEmail, isValidEmail } from '../lib/validate.js';

export async function getInvite(env, token) {
  const member = await resolveInviteToken(env, token);
  if (!member) return error('invite_invalid_or_expired', 410);
  const group = await env.DB.prepare('SELECT no, label FROM groups WHERE id = ?').bind(member.group_id).first();
  return json({
    member: {
      id: member.id,
      full_name: member.full_name,
      title: member.title,
      company: member.company,
      phone: member.phone,
      email: member.email,
      already_claimed: !!member.claimed_at,
    },
    group,
  });
}

export async function postInviteClaim(request, env, token) {
  const member = await resolveInviteToken(env, token);
  if (!member) return error('invite_invalid_or_expired', 410);

  const body = await readJson(request);
  const email = normalizeEmail(body.email);
  if (!email) return error('email_required', 422);
  if (!isValidEmail(email)) return error('email_invalid', 422);

  // Không để người này nhận nhầm email của người khác trong lớp — email là
  // đường đăng nhập lại ở Đợt 2 nên trùng email là trùng luôn lối vào.
  const taken = await env.DB.prepare(
    'SELECT full_name FROM members WHERE cohort_id = ? AND email = ? AND id <> ?'
  ).bind(member.cohort_id, email, member.id).first();
  if (taken) return error('email_taken', 409, { taken_by: taken.full_name });

  // Chỉ ghi đè khi người dùng thật sự gửi giá trị — gửi thiếu field thì giữ
  // nguyên bản cũ, không xoá trắng.
  const title = 'title' in body ? (cleanText(body.title, 120) ?? member.title) : member.title;
  const company = 'company' in body ? (cleanText(body.company, 160) ?? member.company) : member.company;
  const phone = 'phone' in body ? (cleanText(body.phone, 30) ?? member.phone) : member.phone;
  const wasClaimed = !!member.claimed_at;

  try {
    await env.DB.prepare(
      `UPDATE members SET email = ?, phone = ?, title = ?, company = ?,
         claimed_at = COALESCE(claimed_at, datetime('now')), updated_at = datetime('now')
       WHERE id = ?`
    ).bind(email, phone, title, company, member.id).run();
  } catch (err) {
    if (String(err).includes('UNIQUE')) return error('email_taken', 409);
    throw err;
  }

  await logActivity(env, {
    cohortId: member.cohort_id,
    groupId: member.group_id,
    actorId: member.id,
    verb: wasClaimed ? 'member.update' : 'member.claim',
    objectType: 'member',
    objectId: member.id,
    summary: wasClaimed ? 'sửa lại hồ sơ' : 'xác nhận hồ sơ của mình',
  });

  const sessionToken = await createSession(env, member.id, request.headers.get('user-agent'));
  const isHttps = new URL(request.url).protocol === 'https:';
  return json(
    { ok: true, member_id: member.id },
    200,
    { 'set-cookie': sessionCookieHeader(sessionToken, isHttps) }
  );
}
