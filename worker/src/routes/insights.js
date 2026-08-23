import { json, error, readJson } from '../lib/http.js';
import { isGroupOfficer, logActivity } from '../permissions.js';
import { cleanText } from '../lib/validate.js';

// "Ghi tên người nói kể cả khi họ chưa dùng ứng dụng" — speaker là chữ tự do,
// không phải khoá ngoại sang members. is_proxy = 1 nghĩa là ghi hộ lời người
// khác, đúng mặc định của cột trong mục 3 SRS.
export async function postInsight(request, env, me) {
  const body = await readJson(request);
  const text = cleanText(body.body, 1000);
  if (!text) return error('body_required', 422);

  let sectionId = null;
  let sectionOrd = null;
  if (body.section_id !== null && body.section_id !== undefined && body.section_id !== '') {
    const id = Number(body.section_id);
    if (!Number.isInteger(id) || id <= 0) return error('section_invalid', 422);
    const section = await env.DB.prepare(
      `SELECT ps.id, ps.ord FROM plan_sections ps JOIN plans p ON p.id = ps.plan_id
       WHERE ps.id = ? AND p.group_id = ?`
    ).bind(id, me.group_id).first();
    if (!section) return error('section_not_in_group', 422);
    sectionId = section.id;
    sectionOrd = section.ord;
  }

  const speaker = cleanText(body.speaker, 120) ?? 'Chưa ghi tên';
  const heardOn = cleanText(body.heard_on, 20);

  const row = await env.DB.prepare(
    `INSERT INTO insights (group_id, section_id, body, speaker, heard_on, is_proxy, created_by, created_at)
     VALUES (?, ?, ?, ?, COALESCE(?, date('now')), 1, ?, datetime('now')) RETURNING id`
  ).bind(me.group_id, sectionId, text, speaker, heardOn, me.id).first();

  await logActivity(env, {
    cohortId: me.cohort_id, groupId: me.group_id, actorId: me.id,
    verb: 'insights.add', objectType: 'insight', objectId: row.id,
    summary: sectionOrd === null ? 'ghi một tâm đắc' : `ghi một tâm đắc vào phần ${sectionOrd}`,
  });

  return json({ ok: true, id: row.id });
}

// Ma trận mục 2.2, dòng "Gỡ liên kết / tâm đắc": thành viên tự gỡ của mình,
// trưởng/phó gỡ được trong nhóm.
export async function deleteInsight(env, me, insightId) {
  const row = await env.DB.prepare(
    'SELECT * FROM insights WHERE id = ? AND group_id = ?'
  ).bind(insightId, me.group_id).first();
  if (!row) return error('not_found', 404);

  const allowed = row.created_by === me.id || await isGroupOfficer(env, me.id, me.group_id);
  if (!allowed) return error('forbidden', 403);

  await env.DB.prepare('DELETE FROM insights WHERE id = ?').bind(insightId).run();
  await logActivity(env, {
    cohortId: me.cohort_id, groupId: me.group_id, actorId: me.id,
    verb: 'insights.remove', objectType: 'insight', objectId: insightId, summary: 'gỡ một tâm đắc',
  });
  return json({ ok: true });
}
