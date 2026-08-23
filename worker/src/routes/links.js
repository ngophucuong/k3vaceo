import { json, error, readJson } from '../lib/http.js';
import { isGroupOfficer, logActivity } from '../permissions.js';

const KINDS = new Set(['DRIVE', 'SHEET', 'DOCX', 'PDF', 'WEB', 'XLSX']);
const TAGS = new Set(['bai', 'buoi', 'lop']);

export async function listLinks(env, me, tag) {
  const rows = tag && TAGS.has(tag)
    ? await env.DB.prepare(
        `SELECT * FROM links WHERE removed_at IS NULL AND tag = ? AND (scope = 'class' OR group_id = ?) ORDER BY created_at DESC`
      ).bind(tag, me.group_id).all()
    : await env.DB.prepare(
        `SELECT * FROM links WHERE removed_at IS NULL AND (scope = 'class' OR group_id = ?) ORDER BY created_at DESC`
      ).bind(me.group_id).all();
  return json({ links: rows.results ?? [] });
}

export async function postLink(request, env, me) {
  const body = await readJson(request);
  const url = typeof body.url === 'string' ? body.url.trim() : '';
  const title = typeof body.title === 'string' && body.title.trim() ? body.title.trim() : url;
  const kind = KINDS.has(body.kind) ? body.kind : 'WEB';
  const tag = TAGS.has(body.tag) ? body.tag : 'bai';
  if (!url) return error('url_required', 422);
  if (!/^https:\/\//i.test(url)) return error('url_must_be_https', 422);

  const row = await env.DB.prepare(
    `INSERT INTO links (cohort_id, scope, group_id, section_id, url, title, kind, tag, created_by, created_at)
     VALUES (?, 'group', ?, NULL, ?, ?, ?, ?, ?, datetime('now')) RETURNING id`
  ).bind(me.cohort_id, me.group_id, url, title, kind, tag, me.id).first();

  await logActivity(env, {
    cohortId: me.cohort_id, groupId: me.group_id, actorId: me.id,
    verb: 'links.add', objectType: 'link', objectId: row.id, summary: 'gắn một liên kết vào Kho',
  });

  return json({ ok: true, id: row.id });
}

export async function deleteLink(env, me, linkId) {
  const link = await env.DB.prepare('SELECT * FROM links WHERE id = ? AND removed_at IS NULL').bind(linkId).first();
  if (!link) return error('not_found', 404);

  const allowed = link.created_by === me.id
    || (link.scope === 'group' && link.group_id === me.group_id && await isGroupOfficer(env, me.id, me.group_id));
  if (!allowed) return error('forbidden', 403);

  await env.DB.prepare(`UPDATE links SET removed_at = datetime('now') WHERE id = ?`).bind(linkId).run();
  await logActivity(env, {
    cohortId: me.cohort_id, groupId: me.group_id, actorId: me.id,
    verb: 'links.remove', objectType: 'link', objectId: linkId, summary: `gỡ liên kết "${link.title}"`,
  });
  return json({ ok: true });
}
