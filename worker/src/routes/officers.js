import { json, error, readJson } from '../lib/http.js';
import { canManageGroup, logAudit, logActivity } from '../permissions.js';

const ROLE_LABEL = { truong_nhom: 'trưởng nhóm', pho_nhom: 'phó nhóm' };

export async function getOfficers(env, me) {
  const rows = await env.DB.prepare(
    `SELECT o.role, o.note, o.effective_from, m.id AS member_id, m.full_name, m.title, m.company
     FROM officers o LEFT JOIN members m ON m.id = o.member_id
     WHERE o.group_id = ? AND o.role IN ('truong_nhom', 'pho_nhom') AND o.superseded_at IS NULL`
  ).bind(me.group_id).all();
  return json({ officers: rows.results ?? [] });
}

// Ghi bản mới, đóng bản cũ — không bao giờ UPDATE đè lên hàng đang hiệu lực
// (mục 3 SRS: "Bản đang hiệu lực = bản ghi có superseded_at IS NULL").
export async function putOfficers(request, env, me) {
  const body = await readJson(request);
  const role = body.role;
  if (!ROLE_LABEL[role]) return error('role_invalid', 422);
  if (!(await canManageGroup(env, me, me.group_id))) return error('forbidden', 403);

  const memberId = body.member_id ? Number(body.member_id) : null;
  if (memberId) {
    const target = await env.DB.prepare('SELECT id FROM members WHERE id = ? AND group_id = ?').bind(memberId, me.group_id).first();
    if (!target) return error('member_not_in_group', 422);
  }
  const note = typeof body.note === 'string' && body.note.trim() ? body.note.trim() : null;

  const current = await env.DB.prepare(
    `SELECT id FROM officers WHERE group_id = ? AND role = ? AND superseded_at IS NULL`
  ).bind(me.group_id, role).first();

  await env.DB.batch([
    ...(current ? [env.DB.prepare(`UPDATE officers SET superseded_at = datetime('now') WHERE id = ?`).bind(current.id)] : []),
    env.DB.prepare(
      `INSERT INTO officers (cohort_id, group_id, role, member_id, note, effective_from, recorded_by, created_at)
       VALUES (?, ?, ?, ?, ?, date('now'), ?, datetime('now'))`
    ).bind(me.cohort_id, me.group_id, role, memberId, note, me.id),
  ]);

  await logAudit(env, { actorId: me.id, action: 'officers.update', targetType: 'group', targetId: me.group_id, after: { role, memberId, note } });
  await logActivity(env, {
    cohortId: me.cohort_id, groupId: me.group_id, actorId: me.id,
    verb: 'officers.update', objectType: 'group', objectId: me.group_id,
    summary: `cập nhật ${ROLE_LABEL[role]}`,
  });

  return json({ ok: true });
}
