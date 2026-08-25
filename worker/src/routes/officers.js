import { json, error, readJson } from '../lib/http.js';
import { canManageGroup, logAudit, logActivity } from '../permissions.js';
import { cleanText } from '../lib/validate.js';

// 'tieu_bieu' — thành viên tiêu biểu, quyền ngang phó nhóm (Ngô Phú Cường
// quyết 25/8). Không phải chức danh trang trí: nó đi thẳng vào isGroupOfficer
// nên người giữ vai này làm được đúng mọi việc phó nhóm làm được — tạo đợt
// thu, mở sổ, thêm người, sửa cơ cấu, đăng thông báo, chia phần bài.
const ROLE_LABEL = { truong_nhom: 'trưởng nhóm', pho_nhom: 'phó nhóm', tieu_bieu: 'thành viên tiêu biểu' };

export async function getOfficers(env, me) {
  const rows = await env.DB.prepare(
    `SELECT o.role, o.note, o.effective_from, m.id AS member_id, m.full_name, m.title, m.company
     FROM officers o LEFT JOIN members m ON m.id = o.member_id
     WHERE o.group_id = ? AND o.role IN ('truong_nhom', 'pho_nhom', 'tieu_bieu') AND o.superseded_at IS NULL`
  ).bind(me.group_id).all();
  return json({ officers: rows.results ?? [] });
}

// Ghi bản mới, đóng bản cũ — không bao giờ UPDATE đè lên hàng đang hiệu lực
// (mục 3 SRS: "Bản đang hiệu lực = bản ghi có superseded_at IS NULL").
export async function putOfficers(request, env, me, ip) {
  const body = await readJson(request);
  const role = body.role;
  if (!ROLE_LABEL[role]) return error('role_invalid', 422);
  if (!(await canManageGroup(env, me, me.group_id))) return error('forbidden', 403);

  // member_id phải là số nguyên thật. Nhận "abc" rồi Number() ra NaN sẽ lọt
  // qua `if (memberId)` và bỏ luôn bước kiểm tra người đó có trong nhóm không.
  let memberId = null;
  if (body.member_id !== null && body.member_id !== undefined && body.member_id !== '') {
    memberId = Number(body.member_id);
    if (!Number.isInteger(memberId) || memberId <= 0) return error('member_id_invalid', 422);
    const target = await env.DB.prepare(
      'SELECT id FROM members WHERE id = ? AND group_id = ? AND is_active = 1'
    ).bind(memberId, me.group_id).first();
    if (!target) return error('member_not_in_group', 422);
  }

  const current = await env.DB.prepare(
    `SELECT id, member_id, note FROM officers WHERE group_id = ? AND role = ? AND superseded_at IS NULL`
  ).bind(me.group_id, role).first();

  // Không cho nhóm tự bỏ trống HẾT người phụ trách: mất hết officer là mất luôn
  // đường sửa cơ cấu và phát link mời, chỉ còn cách sửa thẳng vào D1. Từ khi có
  // ba vai thì phải đếm số vai còn người, chứ so đôi một như trước sẽ cho phép
  // bỏ trống cả ba mà vẫn lọt.
  if (memberId === null) {
    const conAi = await env.DB.prepare(
      `SELECT COUNT(*) AS n FROM officers
        WHERE group_id = ? AND role IN ('truong_nhom', 'pho_nhom', 'tieu_bieu')
          AND role <> ? AND member_id IS NOT NULL AND superseded_at IS NULL`
    ).bind(me.group_id, role).first();
    if (!conAi?.n) return error('last_officer', 409);
  }

  const note = cleanText(body.note, 200);

  await env.DB.batch([
    ...(current ? [env.DB.prepare(`UPDATE officers SET superseded_at = datetime('now') WHERE id = ?`).bind(current.id)] : []),
    env.DB.prepare(
      `INSERT INTO officers (cohort_id, group_id, role, member_id, note, effective_from, recorded_by, created_at)
       VALUES (?, ?, ?, ?, ?, date('now'), ?, datetime('now'))`
    ).bind(me.cohort_id, me.group_id, role, memberId, note, me.id),
  ]);

  await logAudit(env, {
    actorId: me.id, action: 'officers.update', targetType: 'group', targetId: me.group_id,
    before: current ? { role, member_id: current.member_id, note: current.note } : null,
    after: { role, member_id: memberId, note },
    ip,
  });
  await logActivity(env, {
    cohortId: me.cohort_id, groupId: me.group_id, actorId: me.id,
    verb: 'officers.update', objectType: 'group', objectId: me.group_id,
    summary: `cập nhật ${ROLE_LABEL[role]}`,
  });

  return json({ ok: true });
}
