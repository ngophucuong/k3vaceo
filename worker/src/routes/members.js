import { json, error, readJson } from '../lib/http.js';
import { canEditProfile } from '../permissions.js';
import { logAudit, logActivity } from '../permissions.js';

const clean = v => (typeof v === 'string' ? (v.trim() === '' ? null : v.trim()) : v ?? null);

// Chỉ nêu "Ban tổ chức ghi: ~~cũ~~" cho field thật sự khác — nếu chưa từng sửa
// gì (members vẫn là bản copy nguyên của roster) thì không có gì để so.
function diffFromRoster(member) {
  const was = {};
  if (member.roster_title !== null && member.roster_title !== member.title) was.title = member.roster_title;
  if (member.roster_company !== null && member.roster_company !== member.company) was.company = member.roster_company;
  if (member.roster_phone !== null && member.roster_phone !== member.phone) was.phone = member.roster_phone;
  return was;
}

export async function listMembers(env, me) {
  const rows = await env.DB.prepare(
    `SELECT m.id, m.full_name, m.title, m.company, m.phone, m.email, m.claimed_at,
            r.title AS roster_title, r.company AS roster_company, r.phone AS roster_phone,
            mp.sells_what, mp.sells_to, mp.needs, mp.offers
     FROM members m
     LEFT JOIN roster r ON r.id = m.roster_id
     LEFT JOIN member_profile mp ON mp.member_id = m.id
     WHERE m.group_id = ? AND m.is_active = 1
     ORDER BY m.id`
  ).bind(me.group_id).all();

  const members = (rows.results ?? []).map(m => ({
    id: m.id,
    full_name: m.full_name,
    title: m.title,
    company: m.company,
    phone: m.phone,
    email: m.email,
    claimed: !!m.claimed_at,
    was: diffFromRoster(m),
    profile: {
      sells_what: m.sells_what ?? null,
      sells_to: m.sells_to ?? null,
      needs: m.needs ?? null,
      offers: m.offers ?? null,
    },
    profile_filled: ['sells_what', 'sells_to', 'needs', 'offers'].filter(f => m[f] && String(m[f]).trim() !== '').length,
  }));
  return json({ members });
}

export async function patchMember(request, env, me, targetId) {
  const target = await env.DB.prepare('SELECT * FROM members WHERE id = ? AND is_active = 1').bind(targetId).first();
  if (!target) return error('not_found', 404);
  if (!(await canEditProfile(env, me, target))) return error('forbidden', 403);

  const body = await readJson(request);
  const next = {
    title: 'title' in body ? clean(body.title) : target.title,
    company: 'company' in body ? clean(body.company) : target.company,
    phone: 'phone' in body ? clean(body.phone) : target.phone,
    email: 'email' in body ? clean(body.email) : target.email,
  };

  await env.DB.prepare(
    `UPDATE members SET title = ?, company = ?, phone = ?, email = ?, updated_at = datetime('now') WHERE id = ?`
  ).bind(next.title, next.company, next.phone, next.email, target.id).run();

  const isSelf = me.id === target.id;
  if (!isSelf) {
    await logAudit(env, {
      actorId: me.id, action: 'member.edit_by_other', targetType: 'member', targetId: target.id,
      before: { title: target.title, company: target.company, phone: target.phone, email: target.email },
      after: next,
    });
  }
  await logActivity(env, {
    cohortId: target.cohort_id, groupId: target.group_id, actorId: me.id,
    verb: isSelf ? 'member.update' : 'member.update_by_other',
    objectType: 'member', objectId: target.id,
    summary: isSelf ? 'sửa lại hồ sơ' : `sửa hồ sơ hộ ${target.full_name}`,
  });

  return json({ ok: true });
}

export async function putMemberProfile(request, env, me, targetId) {
  const target = await env.DB.prepare('SELECT * FROM members WHERE id = ? AND is_active = 1').bind(targetId).first();
  if (!target) return error('not_found', 404);
  if (!(await canEditProfile(env, me, target))) return error('forbidden', 403);

  const body = await readJson(request);
  const fields = {
    sells_what: clean(body.sells_what)?.slice(0, 80) ?? null,
    sells_to: clean(body.sells_to)?.slice(0, 80) ?? null,
    needs: clean(body.needs)?.slice(0, 80) ?? null,
    offers: clean(body.offers)?.slice(0, 80) ?? null,
  };

  await env.DB.prepare(
    `INSERT INTO member_profile (member_id, sells_what, sells_to, needs, offers, updated_at, updated_by)
     VALUES (?, ?, ?, ?, ?, datetime('now'), ?)
     ON CONFLICT(member_id) DO UPDATE SET
       sells_what = excluded.sells_what, sells_to = excluded.sells_to,
       needs = excluded.needs, offers = excluded.offers,
       updated_at = excluded.updated_at, updated_by = excluded.updated_by`
  ).bind(target.id, fields.sells_what, fields.sells_to, fields.needs, fields.offers, me.id).run();

  const isSelf = me.id === target.id;
  if (!isSelf) {
    await logAudit(env, { actorId: me.id, action: 'profile.edit_by_other', targetType: 'member', targetId: target.id, after: fields });
  }
  await logActivity(env, {
    cohortId: target.cohort_id, groupId: target.group_id, actorId: me.id,
    verb: 'profile.update', objectType: 'member', objectId: target.id,
    summary: isSelf ? 'cập nhật bán gì / cần gì' : `cập nhật hồ sơ mở rộng hộ ${target.full_name}`,
  });

  return json({ ok: true });
}
