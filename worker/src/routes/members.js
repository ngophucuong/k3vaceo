import { json, error, readJson } from '../lib/http.js';
import { canEditProfile, canManageGroup, logAudit, logActivity } from '../permissions.js';
import { cleanText, normalizeEmail, isValidEmail } from '../lib/validate.js';

// Chỉ nêu "Ban tổ chức ghi: ~~cũ~~" cho field thật sự khác — nếu chưa từng sửa
// gì (members vẫn là bản copy nguyên của roster) thì không có gì để so.
function diffFromRoster(member) {
  const was = {};
  if (member.roster_title !== null && member.roster_title !== member.title) was.title = member.roster_title;
  if (member.roster_company !== null && member.roster_company !== member.company) was.company = member.roster_company;
  if (member.roster_phone !== null && member.roster_phone !== member.phone) was.phone = member.roster_phone;
  return was;
}

function shapeMember(m) {
  return {
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
  };
}

const MEMBER_SELECT = `
  SELECT m.id, m.full_name, m.title, m.company, m.phone, m.email, m.claimed_at, m.group_id,
         r.title AS roster_title, r.company AS roster_company, r.phone AS roster_phone,
         mp.sells_what, mp.sells_to, mp.needs, mp.offers
  FROM members m
  LEFT JOIN roster r ON r.id = m.roster_id
  LEFT JOIN member_profile mp ON mp.member_id = m.id`;

export async function listMembers(env, me) {
  const rows = await env.DB.prepare(
    `${MEMBER_SELECT} WHERE m.group_id = ? AND m.is_active = 1 ORDER BY m.id`
  ).bind(me.group_id).all();
  return json({ members: (rows.results ?? []).map(shapeMember) });
}

// Giao diện cần đọc đúng một hồ sơ trước khi mở form sửa — không có endpoint
// này thì form phải đoán giá trị hiện tại từ bộ nhớ đệm, mà bộ nhớ đệm rỗng
// lúc vừa đăng nhập sẽ khiến bấm Lưu xoá trắng chức vụ/đơn vị/điện thoại.
export async function getMember(env, me, targetId) {
  const row = await env.DB.prepare(
    `${MEMBER_SELECT} WHERE m.id = ? AND m.group_id = ? AND m.is_active = 1`
  ).bind(targetId, me.group_id).first();
  if (!row) return error('not_found', 404);
  return json({ member: shapeMember(row) });
}

export async function patchMember(request, env, me, targetId) {
  // Lọc theo nhóm ngay trong câu truy vấn: người nhóm khác phải "không tồn
  // tại" chứ không phải "bị từ chối" — trả 403 là xác nhận cho người ngoài
  // biết id đó có thật, dò dần là dựng lại được danh sách nhóm 6 (N6).
  const target = await env.DB.prepare(
    'SELECT * FROM members WHERE id = ? AND group_id = ? AND is_active = 1'
  ).bind(targetId, me.group_id).first();
  if (!target) return error('not_found', 404);
  if (!(await canEditProfile(env, me, target))) return error('forbidden', 403);

  const body = await readJson(request);
  let email = target.email;
  if ('email' in body) {
    email = normalizeEmail(body.email);
    if (email && !isValidEmail(email)) return error('email_invalid', 422);
  }
  const next = {
    title: 'title' in body ? cleanText(body.title, 120) : target.title,
    company: 'company' in body ? cleanText(body.company, 160) : target.company,
    phone: 'phone' in body ? cleanText(body.phone, 30) : target.phone,
    email,
  };

  // Bắt trùng trước khi ghi để trả lỗi nói được thành lời; vẫn bọc try vì hai
  // request cùng lúc có thể lọt qua khe giữa kiểm tra và ghi.
  if (next.email && next.email !== target.email) {
    const taken = await env.DB.prepare(
      'SELECT full_name FROM members WHERE cohort_id = ? AND email = ? AND id <> ?'
    ).bind(target.cohort_id, next.email, target.id).first();
    if (taken) return error('email_taken', 409, { taken_by: taken.full_name });
  }

  // Chính chủ tự đổi số của mình thì đánh dấu — màn tự nhận diện /dangnhap chỉ tin
  // số có dấu này (xem migration 0009). Người cùng nhóm sửa hộ KHÔNG tạo được
  // dấu, nên đường sửa hộ không biến thành lối chiếm tài khoản.
  const tuDoiSo = me.id === target.id && next.phone && next.phone !== target.phone;

  try {
    await env.DB.prepare(
      `UPDATE members SET title = ?, company = ?, phone = ?, email = ?,
         phone_self_set_at = CASE WHEN ? = 1 THEN datetime('now') ELSE phone_self_set_at END,
         updated_at = datetime('now')
       WHERE id = ?`
    ).bind(next.title, next.company, next.phone, next.email, tuDoiSo ? 1 : 0, target.id).run();
  } catch (err) {
    if (String(err).includes('UNIQUE')) return error('email_taken', 409);
    throw err;
  }

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
  const target = await env.DB.prepare(
    'SELECT * FROM members WHERE id = ? AND group_id = ? AND is_active = 1'
  ).bind(targetId, me.group_id).first();
  if (!target) return error('not_found', 404);
  if (!(await canEditProfile(env, me, target))) return error('forbidden', 403);

  const body = await readJson(request);
  const fields = {
    sells_what: cleanText(body.sells_what, 80),
    sells_to: cleanText(body.sells_to, 80),
    needs: cleanText(body.needs, 80),
    offers: cleanText(body.offers, 80),
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

// ══ Ngừng tham gia ══════════════════════════════════════════════════════════
// Bảo lưu, chuyển trường, nghỉ hẳn — với ứng dụng là cùng một việc: người ấy
// thôi xuất hiện. KHÔNG xoá dòng nào và không đụng tới `roster` (danh sách gốc
// của Ban tổ chức giữ nguyên). Chỉ hạ cờ `is_active`, vì cờ ấy đã được kiểm
// trong hơn ba mươi truy vấn khác nên người ấy tự rụng khỏi đăng nhập, phiên
// đang mở, passkey, thông báo đẩy, danh sách nhóm, danh sách nhận phần bài và
// mọi phép đếm sĩ số — mà lời khai đóng quỹ cũ vẫn còn nguyên để số dư dò
// được ra từng dòng.

async function chucDangGiu(env, memberId) {
  return env.DB.prepare(
    `SELECT role, group_id FROM officers
      WHERE member_id = ? AND superseded_at IS NULL LIMIT 1`
  ).bind(memberId).first();
}

export async function postNgungThamGia(env, me, targetId, ip) {
  if (!(await canManageGroup(env, me, me.group_id))) return error('forbidden', 403);
  // Tự hạ cờ mình là tự khoá mình ra ngoài; nếu lại là trưởng nhóm thì không
  // còn ai mở cửa lại được, chỉ còn cách sửa thẳng vào D1.
  if (targetId === me.id) return error('khong_tu_ngung', 422);

  const target = await env.DB.prepare(
    'SELECT id, full_name FROM members WHERE id = ? AND group_id = ? AND is_active = 1'
  ).bind(targetId, me.group_id).first();
  if (!target) return error('not_found', 404);

  // Người đang giữ chức phải được thay TRƯỚC. Cho ngừng luôn thì cơ cấu vẫn
  // đứng tên một người không bao giờ đăng nhập lại được — getOfficers cố ý
  // không lọc is_active để giữ lịch sử, nên sẽ không có gì nhắc là phải sửa.
  const chuc = await chucDangGiu(env, targetId);
  if (chuc) return error(chuc.group_id === null ? 'dang_giu_chuc_lop' : 'dang_giu_chuc_nhom', 409);

  // Phần bài và suất thuyết trình phải nhả ra. Một phần mang tên người đã nghỉ
  // trông như đã có người nhận trong khi không ai làm — tệ hơn để trống, vì để
  // trống thì giao diện hiện "chưa ai nhận" và có người bấm vào nhận.
  const nha = await env.DB.prepare(
    `SELECT ord, title FROM plan_sections
      WHERE owner_member_id = ? OR present_member_id = ? ORDER BY ord`
  ).bind(targetId, targetId).all();

  await env.DB.batch([
    env.DB.prepare("UPDATE members SET is_active = 0, updated_at = datetime('now') WHERE id = ?").bind(targetId),
    env.DB.prepare("UPDATE plan_sections SET owner_member_id = NULL, updated_at = datetime('now') WHERE owner_member_id = ?").bind(targetId),
    env.DB.prepare("UPDATE plan_sections SET present_member_id = NULL, present_minutes = NULL, updated_at = datetime('now') WHERE present_member_id = ?").bind(targetId),
    // Phiên tự chết vì auth kiểm is_active ở mỗi lượt gọi, nhưng xoá hẳn cho
    // sạch — khỏi để cookie sống lay lắt tới 90 ngày trong bảng.
    env.DB.prepare('DELETE FROM sessions WHERE member_id = ?').bind(targetId),
    // Lời mời chưa dùng phải chết theo, không thì link cũ vẫn mở cửa lại được.
    env.DB.prepare("UPDATE invites SET expires_at = datetime('now', '-1 second') WHERE member_id = ? AND used_at IS NULL").bind(targetId),
    env.DB.prepare("UPDATE push_subscriptions SET disabled_at = datetime('now') WHERE member_id = ? AND disabled_at IS NULL").bind(targetId),
  ]);

  await logAudit(env, {
    actorId: me.id, action: 'member.ngung_tham_gia', targetType: 'member', targetId,
    before: { is_active: 1 },
    after: { is_active: 0, nha_phan: (nha.results ?? []).map(r => r.ord) },
    ip,
  });
  await logActivity(env, {
    cohortId: me.cohort_id, groupId: me.group_id, actorId: me.id,
    verb: 'ngung_tham_gia', objectType: 'member', objectId: targetId,
    summary: `${target.full_name} thôi tham gia nhóm`,
  });

  return json({ ok: true, ho_ten: target.full_name, nha_phan: nha.results ?? [] });
}

// Cho tham gia lại — bảo lưu xong quay về, hoặc đơn giản là bấm nhầm. Không có
// đường này thì sửa sai phải mở D1 ra.
export async function postThamGiaLai(env, me, targetId, ip) {
  if (!(await canManageGroup(env, me, me.group_id))) return error('forbidden', 403);
  const target = await env.DB.prepare(
    'SELECT id, full_name FROM members WHERE id = ? AND group_id = ? AND is_active = 0'
  ).bind(targetId, me.group_id).first();
  if (!target) return error('not_found', 404);

  await env.DB.prepare(
    "UPDATE members SET is_active = 1, updated_at = datetime('now') WHERE id = ?"
  ).bind(targetId).run();

  await logAudit(env, {
    actorId: me.id, action: 'member.tham_gia_lai', targetType: 'member', targetId,
    before: { is_active: 0 }, after: { is_active: 1 }, ip,
  });
  await logActivity(env, {
    cohortId: me.cohort_id, groupId: me.group_id, actorId: me.id,
    verb: 'tham_gia_lai', objectType: 'member', objectId: targetId,
    summary: `${target.full_name} tham gia lại nhóm`,
  });
  // Phần bài đã nhả ra thì không tự đòi lại — người khác có thể đã nhận rồi.
  return json({ ok: true, ho_ten: target.full_name });
}

// Danh sách người đã ngừng, CHỈ trưởng và phó nhóm đọc được. Người thường
// không thấy gì cả — đó là ý nghĩa của "ẩn hẳn".
export async function listNgung(env, me) {
  if (!(await canManageGroup(env, me, me.group_id))) return error('forbidden', 403);
  const rows = await env.DB.prepare(
    `SELECT id, full_name, title, company, updated_at
       FROM members WHERE group_id = ? AND is_active = 0 ORDER BY updated_at DESC, id`
  ).bind(me.group_id).all();
  return json({ members: rows.results ?? [] });
}
