import { json, error, readJson } from '../lib/http.js';
import { isGroupOfficer, isClassCommittee, logActivity, logAudit } from '../permissions.js';
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

// Ai được động vào một liên kết. Sửa và gỡ dùng CHUNG một phép kiểm: tách ra
// hai bản sao là có ngày một bên nới lỏng mà bên kia không biết.
async function layLienKetSuaDuoc(env, me, linkId) {
  // Lọc theo phạm vi đọc được: liên kết của nhóm khác phải "không tồn tại",
  // không phải "bị từ chối" — 403 là xác nhận cho người ngoài biết id có thật.
  const link = await env.DB.prepare(
    `SELECT * FROM links WHERE id = ? AND removed_at IS NULL AND (scope = 'class' OR group_id = ?)`
  ).bind(linkId, me.group_id).first();
  if (!link) return { loi: error('not_found', 404) };

  // Người đăng luôn sửa được của mình. Ngoài ra: trưởng/phó nhóm với liên kết
  // của nhóm mình, Ban cán sự lớp với tư liệu cấp lớp — không thì người đăng
  // nghỉ học là cả lớp sống chung với một đường dẫn hỏng.
  const duoc = link.created_by === me.id
    || (link.scope === 'group' && link.group_id === me.group_id && await isGroupOfficer(env, me.id, me.group_id))
    || (link.scope === 'class' && await isClassCommittee(env, me.id));
  return duoc ? { link } : { loi: error('forbidden', 403) };
}

// Sửa một liên kết đã có. Không có đường này thì mục nào lỡ tạo với URL trống
// sẽ trống vĩnh viễn — bốn mục Tư liệu seed từ Đợt 1 nằm trống đúng vì vậy, và
// cách chữa duy nhất là xoá đi tạo lại, mất luôn ngày đăng và người đăng.
export async function patchLink(request, env, me, linkId, ip) {
  const { link, loi } = await layLienKetSuaDuoc(env, me, linkId);
  if (loi) return loi;

  const body = await readJson(request);
  const dat = {};

  if ('url' in body) {
    const u = cleanText(body.url, 2000);
    // Cho phép xoá trắng URL trở lại: có lúc dán nhầm link và muốn để trống
    // chờ link đúng, hơn là để một đường dẫn hỏng cho cả lớp bấm vào.
    if (u && !/^https:\/\/[^\s/]+\./i.test(u)) return error('url_must_be_https', 422);
    dat.url = u ?? null;
  }
  if ('title' in body) {
    const t = cleanText(body.title, 200);
    if (!t) return error('title_required', 422);
    dat.title = t;
  }
  if ('kind' in body) {
    if (!KINDS.has(body.kind)) return error('kind_invalid', 422);
    dat.kind = body.kind;
  }
  if ('tag' in body) {
    if (!TAGS.has(body.tag)) return error('tag_invalid', 422);
    dat.tag = body.tag;
  }
  // Cố ý KHÔNG cho đổi scope: chuyển một liên kết của nhóm thành của lớp là
  // đem dữ liệu nhóm ra cho 134 người xem (nguyên tắc N6). Muốn đổi thì gỡ đi
  // rồi đăng lại, để có một dòng nhật ký rõ ràng.
  const cot = Object.keys(dat);
  if (!cot.length) return error('khong_co_gi_de_sua', 422);

  await env.DB.prepare(
    `UPDATE links SET ${cot.map(k => `${k} = ?`).join(', ')} WHERE id = ?`
  ).bind(...cot.map(k => dat[k]), linkId).run();

  await logAudit(env, {
    actorId: me.id, action: 'links.edit', targetType: 'link', targetId: linkId,
    before: Object.fromEntries(cot.map(k => [k, link[k]])), after: dat, ip,
  });
  // Chỉ ghi vào nhật ký nhóm khi có đường dẫn mới — đổi mỗi cái tên thì không
  // đáng làm phiền cả nhóm.
  if ('url' in dat && dat.url && dat.url !== link.url) {
    await logActivity(env, {
      cohortId: me.cohort_id, groupId: me.group_id, actorId: me.id,
      verb: 'links.edit', objectType: 'link', objectId: linkId,
      summary: `dán đường dẫn cho "${dat.title ?? link.title}"`,
    });
  }
  return json({ ok: true });
}

export async function deleteLink(env, me, linkId) {
  const { link, loi } = await layLienKetSuaDuoc(env, me, linkId);
  if (loi) return loi;

  await env.DB.prepare(`UPDATE links SET removed_at = datetime('now') WHERE id = ?`).bind(linkId).run();
  await logActivity(env, {
    cohortId: me.cohort_id, groupId: me.group_id, actorId: me.id,
    verb: 'links.remove', objectType: 'link', objectId: linkId, summary: `gỡ liên kết "${link.title}"`,
  });
  return json({ ok: true });
}
