import { json, error, readJson } from '../lib/http.js';
import { resolveInviteToken, createSession, sessionCookieHeader } from '../auth.js';
import { logActivity } from '../permissions.js';

const clean = v => (typeof v === 'string' && v.trim() !== '' ? v.trim() : null);

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
  const email = clean(body.email);
  if (!email) return error('email_required', 422);
  const title = clean(body.title) ?? member.title;
  const company = clean(body.company) ?? member.company;
  const phone = clean(body.phone) ?? member.phone;
  const wasClaimed = !!member.claimed_at;

  await env.DB.prepare(
    `UPDATE members SET email = ?, phone = ?, title = ?, company = ?,
       claimed_at = COALESCE(claimed_at, datetime('now')), updated_at = datetime('now')
     WHERE id = ?`
  ).bind(email, phone, title, company, member.id).run();

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
