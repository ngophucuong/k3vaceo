import { json, error, readJson } from '../lib/http.js';
import { isGroupOfficer, isClassCommittee, logActivity } from '../permissions.js';
import { cleanText } from '../lib/validate.js';

const KINDS = new Set(['DRIVE', 'SHEET', 'DOCX', 'PDF', 'WEB', 'XLSX']);
const TAGS = new Set(['bai', 'buoi', 'lop']);

export async function listLinks(env, me, tag) {
  // Tag lạ thì báo sai, không lặng lẽ trả về toàn bộ Kho — người gọi sẽ tưởng
  // mình đang xem một mục đã lọc.
  if (tag !== null && tag !== undefined && tag !== '' && tag !== 'all' && !TAGS.has(tag)) {
    return error('tag_invalid', 422);
  }
  const filtered = TAGS.has(tag);
  const rows = filtered
    ? await env.DB.prepare(
        `SELECT * FROM links WHERE removed_at IS NULL AND tag = ? AND (scope = 'class' OR group_id = ?) ORDER BY created_at DESC`
      ).bind(tag, me.group_id).all()
    : await env.DB.prepare(
        `SELECT * FROM links WHERE removed_at IS NULL AND (scope = 'class' OR group_id = ?) ORDER BY created_at DESC`
      ).bind(me.group_id).all();
  // Giao diện cần biết để bày đúng ô chọn phạm vi; máy chủ vẫn kiểm lại trong
  // postLink. Tư liệu của LỚP hiện cho cả mười nhóm, nên ai đăng được là
  // chuyện quyền hạn thật chứ không phải chi tiết trình bày.
  return json({
    links: rows.results ?? [],
    can_dang_lop: await isClassCommittee(env, me.id),
  });
}

export async function postLink(request, env, me) {
  const body = await readJson(request);
  const url = cleanText(body.url, 2000);
  if (!url) return error('url_required', 422);
  if (!/^https:\/\/[^\s/]+\./i.test(url)) return error('url_must_be_https', 422);
  if (body.kind !== undefined && !KINDS.has(body.kind)) return error('kind_invalid', 422);
  if (body.tag !== undefined && !TAGS.has(body.tag)) return error('tag_invalid', 422);

  const title = cleanText(body.title, 200) ?? url;
  const kind = KINDS.has(body.kind) ? body.kind : 'WEB';
  const tag = TAGS.has(body.tag) ? body.tag : 'bai';

  // Tư liệu của LỚP hiện cho cả mười nhóm — chỉ Ban cán sự lớp đăng được.
  // Đây là chỗ Ban tổ chức phát slide bài giảng, mẫu kế hoạch kinh doanh:
  // trước đây mỗi nhóm phải tự dán lại một bản, mười nhóm mười bản, sai một
  // bản là cả nhóm ấy làm theo tài liệu cũ.
  const capLop = body.scope === 'class';
  if (capLop && !(await isClassCommittee(env, me.id))) return error('forbidden', 403);

  const row = await env.DB.prepare(
    `INSERT INTO links (cohort_id, scope, group_id, section_id, url, title, kind, tag, created_by, created_at)
     VALUES (?, ?, ?, NULL, ?, ?, ?, ?, ?, datetime('now')) RETURNING id`
  ).bind(me.cohort_id, capLop ? 'class' : 'group', capLop ? null : me.group_id,
         url, title, kind, tag, me.id).first();

  await logActivity(env, {
    cohortId: me.cohort_id, groupId: me.group_id, actorId: me.id,
    verb: 'links.add', objectType: 'link', objectId: row.id,
    summary: capLop ? 'gắn một tư liệu chung của lớp' : 'gắn một liên kết vào Tư liệu',
  });

  return json({ ok: true, id: row.id });
}

export async function deleteLink(env, me, linkId) {
  // Lọc luôn theo phạm vi đọc được: liên kết của nhóm khác phải "không tồn
  // tại", không phải "bị từ chối" — trả 403 là xác nhận cho người ngoài biết
  // id đó có thật.
  const link = await env.DB.prepare(
    `SELECT * FROM links WHERE id = ? AND removed_at IS NULL AND (scope = 'class' OR group_id = ?)`
  ).bind(linkId, me.group_id).first();
  if (!link) return error('not_found', 404);

  // Người đăng luôn gỡ được của mình. Ngoài ra: trưởng/phó nhóm gỡ được của
  // nhóm mình, Ban cán sự lớp gỡ được tư liệu cấp lớp — không thì người đăng
  // nghỉ học là cả lớp phải sống chung với một đường dẫn hỏng.
  const allowed = link.created_by === me.id
    || (link.scope === 'group' && link.group_id === me.group_id && await isGroupOfficer(env, me.id, me.group_id))
    || (link.scope === 'class' && await isClassCommittee(env, me.id));
  if (!allowed) return error('forbidden', 403);

  await env.DB.prepare(`UPDATE links SET removed_at = datetime('now') WHERE id = ?`).bind(linkId).run();
  await logActivity(env, {
    cohortId: me.cohort_id, groupId: me.group_id, actorId: me.id,
    verb: 'links.remove', objectType: 'link', objectId: linkId, summary: `gỡ liên kết "${link.title}"`,
  });
  return json({ ok: true });
}
