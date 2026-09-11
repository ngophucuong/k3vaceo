// Xin đổi nhóm — tự phục vụ. Xem đầu migrations/0037_yeu_cau_doi_nhom.sql cho
// đầy đủ lý lẽ vì sao có tính năng này và vì sao TRƯỞNG/PHÓ NHÓM ĐÍCH duyệt
// (Ngô Phú Cường chọn trực tiếp, không phải suy đoán).
//
// Nhóm ĐI chỉ CẦN BIẾT, không cần ĐỒNG Ý — logActivity ghi vào feed của CẢ
// HAI nhóm khi duyệt xong, dùng lại nguyên hạ tầng "Hoạt động gần đây" đã có
// (routes/home.js), không phải dựng đường báo tin mới.
import { json, error, readJson } from '../lib/http.js';
import { isGroupOfficer, logAudit, logActivity } from '../permissions.js';
import { cleanText } from '../lib/validate.js';
import { chucDangGiu } from './members.js';

const LY_DO_MAX = 200;

export async function getDoiNhom(env, me) {
  const nhomRes = await env.DB.prepare(
    'SELECT no, label FROM groups WHERE cohort_id = ? ORDER BY no'
  ).bind(me.cohort_id).all();

  const chuc = await chucDangGiu(env, me.id);

  // Đơn gần nhất còn ĐÁNG NÓI: bỏ 'da_huy' vì đó là chuyện chính người này vừa
  // tự bấm, không có gì để nhắc lại. cho_duyet/da_duyet/tu_choi thì luôn hiện
  // — đúng khuôn "trạng thái là lời báo", không cần thêm cờ "đã xem" riêng.
  const cuaToi = await env.DB.prepare(
    `SELECT y.id, y.trang_thai, y.ly_do, y.ly_do_tu_choi, y.created_at, y.quyet_dinh_luc,
            gt.no AS tu_nhom_so, gt.label AS tu_nhom_label,
            gd.no AS den_nhom_so, gd.label AS den_nhom_label
       FROM yeu_cau_doi_nhom y
       JOIN groups gt ON gt.id = y.tu_group_id
       JOIN groups gd ON gd.id = y.den_group_id
      WHERE y.member_id = ? AND y.trang_thai <> 'da_huy'
      ORDER BY y.id DESC LIMIT 1`
  ).bind(me.id).first();

  // Chỉ trưởng/phó/tiêu biểu của CHÍNH nhóm mình mới thấy ai đang xin vào —
  // đúng khuôn can_moi trong danh-ba.js: quyền QUYẾT nằm ở officer, người
  // thường trong nhóm chưa cần biết ai đang xin vào trước khi có quyết định.
  const laOfficer = await isGroupOfficer(env, me.id, me.group_id);
  const choNhomToi = laOfficer ? await env.DB.prepare(
    `SELECT y.id, y.ly_do, y.created_at,
            m.id AS member_id, m.full_name, m.title, m.company,
            g.no AS tu_nhom_so, g.label AS tu_nhom_label
       FROM yeu_cau_doi_nhom y
       JOIN members m ON m.id = y.member_id
       JOIN groups g ON g.id = y.tu_group_id
      WHERE y.den_group_id = ? AND y.trang_thai = 'cho_duyet'
      ORDER BY y.created_at`
  ).bind(me.group_id).all() : null;

  return json({
    nhom: nhomRes.results ?? [],
    dang_giu_chuc: !!chuc,
    cua_toi: cuaToi ?? null,
    cho_nhom_toi: choNhomToi ? (choNhomToi.results ?? []) : [],
  });
}

export async function postDoiNhom(request, env, me, ip) {
  // Đang giữ chức thì phải bàn giao TRƯỚC — cùng chốt "đầu vào" đã dùng cho
  // ngừng tham gia (routes/members.js postNgungThamGia), tránh cơ cấu đứng
  // tên một người không còn ở nhóm đó.
  const chuc = await chucDangGiu(env, me.id);
  if (chuc) return error(chuc.group_id === null ? 'dang_giu_chuc_lop' : 'dang_giu_chuc_nhom', 409);

  const body = await readJson(request);
  const denNhomSo = Number(body.den_nhom_so);
  if (!Number.isInteger(denNhomSo) || denNhomSo < 1) return error('nhom_khong_hop_le', 422);

  const denGroup = await env.DB.prepare(
    'SELECT id, no, label FROM groups WHERE cohort_id = ? AND no = ?'
  ).bind(me.cohort_id, denNhomSo).first();
  if (!denGroup) return error('nhom_khong_hop_le', 422);
  if (denGroup.id === me.group_id) return error('da_o_nhom_nay', 422);

  const lyDo = cleanText(body.ly_do, LY_DO_MAX);

  let yc;
  try {
    yc = await env.DB.prepare(
      `INSERT INTO yeu_cau_doi_nhom (member_id, tu_group_id, den_group_id, ly_do, created_at, updated_at)
       VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
       RETURNING id`
    ).bind(me.id, me.group_id, denGroup.id, lyDo).first();
  } catch (err) {
    // ux_doinhom_dang_cho (migration 0037): đã có đơn CHỜ DUYỆT khác — không
    // cho nộp chồng. Bắt ở đây thay vì SELECT trước rồi INSERT, để không có
    // khe hở giữa hai lượt gọi liền nhau (bấm nhanh hai lần, hay hai tab).
    if (String(err).includes('UNIQUE')) return error('dang_co_don_cho_duyet', 409);
    throw err;
  }

  await logAudit(env, {
    actorId: me.id, action: 'doi_nhom.xin', targetType: 'yeu_cau_doi_nhom', targetId: yc.id,
    after: { tu_group_id: me.group_id, den_group_id: denGroup.id, ly_do: lyDo }, ip,
  });

  // KHÔNG logActivity ở đây: một đơn XIN chưa phải chuyện đã xảy ra, feed chỉ
  // nên nói chuyện đã xong (đúng nếp join_requests — postJoinRequest cũng
  // không ghi feed, chỉ decideJoinRequest mới ghi).
  return json({ ok: true, id: yc.id, den_nhom_label: denGroup.label });
}

export async function postDuyetDoiNhom(env, me, id, ip) {
  const yc = await env.DB.prepare('SELECT * FROM yeu_cau_doi_nhom WHERE id = ?').bind(id).first();
  if (!yc) return error('not_found', 404);

  // N6: sai nhóm nhận 404 như id bịa, không phải 403 — 403 xác nhận id đó có
  // thật (quy ước 6 CLAUDE.md, giống hệt docSectionId/docGhiChuId).
  if (!(await isGroupOfficer(env, me.id, yc.den_group_id))) return error('not_found', 404);
  if (yc.trang_thai !== 'cho_duyet') return error('da_xu_ly_roi', 409, { trang_thai: yc.trang_thai });

  const member = await env.DB.prepare(
    'SELECT id, full_name, group_id, is_active FROM members WHERE id = ?'
  ).bind(yc.member_id).first();
  if (!member || !member.is_active) return error('nguoi_da_ngung_tham_gia', 409);
  // Đơn cũ: nhóm hiện tại đã khác nhóm lúc nộp đơn (một nhánh khác đã xử lý,
  // hoặc migration tay xen vào giữa chừng) — coi là đơn hết hiệu lực, đừng
  // ghi đè lung tung lên một sự thật đã đổi.
  if (member.group_id !== yc.tu_group_id) return error('nhom_hien_tai_da_doi', 409);

  // Phòng đua: có thể ai đó vừa gán chức cho người này SAU khi họ nộp đơn.
  const chuc = await chucDangGiu(env, member.id);
  if (chuc) return error(chuc.group_id === null ? 'dang_giu_chuc_lop' : 'dang_giu_chuc_nhom', 409);

  // Phần bài / suất thuyết trình đang giữ ở nhóm CŨ phải nhả ra — đúng khuôn
  // postNgungThamGia: một phần mang tên người đã sang nhóm khác trông như đã
  // có người làm, tệ hơn để trống.
  const nha = await env.DB.prepare(
    `SELECT ord, title FROM plan_sections
      WHERE owner_member_id = ? OR present_member_id = ? ORDER BY ord`
  ).bind(member.id, member.id).all();

  await env.DB.batch([
    env.DB.prepare("UPDATE members SET group_id = ?, updated_at = datetime('now') WHERE id = ?")
      .bind(yc.den_group_id, member.id),
    env.DB.prepare("UPDATE plan_sections SET owner_member_id = NULL, updated_at = datetime('now') WHERE owner_member_id = ?")
      .bind(member.id),
    env.DB.prepare("UPDATE plan_sections SET present_member_id = NULL, present_minutes = NULL, updated_at = datetime('now') WHERE present_member_id = ?")
      .bind(member.id),
    env.DB.prepare(
      `UPDATE yeu_cau_doi_nhom
          SET trang_thai = 'da_duyet', quyet_dinh_boi = ?, quyet_dinh_luc = datetime('now'), updated_at = datetime('now')
        WHERE id = ?`
    ).bind(me.id, id),
  ]);

  const [nhomCu, nhomMoi] = await Promise.all([
    env.DB.prepare('SELECT label FROM groups WHERE id = ?').bind(yc.tu_group_id).first(),
    env.DB.prepare('SELECT label FROM groups WHERE id = ?').bind(yc.den_group_id).first(),
  ]);

  await logAudit(env, {
    actorId: me.id, action: 'doi_nhom.duyet', targetType: 'member', targetId: member.id,
    before: { group_id: yc.tu_group_id }, after: { group_id: yc.den_group_id }, ip,
  });
  // Hai dòng feed, một cho mỗi nhóm — nhóm ĐI chỉ CẦN BIẾT (không cần đồng ý,
  // xem migration 0037), nhóm ĐẾN thì đúng nghĩa "có người mới".
  await logActivity(env, {
    cohortId: me.cohort_id, groupId: yc.tu_group_id, actorId: me.id,
    verb: 'doi_nhom_di', objectType: 'member', objectId: member.id,
    summary: `${member.full_name} đã chuyển sang ${nhomMoi?.label ?? 'nhóm khác'}`,
  });
  await logActivity(env, {
    cohortId: me.cohort_id, groupId: yc.den_group_id, actorId: me.id,
    verb: 'doi_nhom_den', objectType: 'member', objectId: member.id,
    summary: `${member.full_name} gia nhập từ ${nhomCu?.label ?? 'nhóm khác'}`,
  });

  return json({ ok: true, full_name: member.full_name, nhom_moi: nhomMoi?.label ?? null, nha_phan: nha.results ?? [] });
}

export async function postTuChoiDoiNhom(request, env, me, id, ip) {
  const yc = await env.DB.prepare('SELECT * FROM yeu_cau_doi_nhom WHERE id = ?').bind(id).first();
  if (!yc) return error('not_found', 404);
  if (!(await isGroupOfficer(env, me.id, yc.den_group_id))) return error('not_found', 404);
  if (yc.trang_thai !== 'cho_duyet') return error('da_xu_ly_roi', 409, { trang_thai: yc.trang_thai });

  const body = await readJson(request);
  const lyDo = cleanText(body.ly_do, LY_DO_MAX);

  await env.DB.prepare(
    `UPDATE yeu_cau_doi_nhom
        SET trang_thai = 'tu_choi', ly_do_tu_choi = ?, quyet_dinh_boi = ?,
            quyet_dinh_luc = datetime('now'), updated_at = datetime('now')
      WHERE id = ?`
  ).bind(lyDo, me.id, id).run();

  await logAudit(env, {
    actorId: me.id, action: 'doi_nhom.tu_choi', targetType: 'yeu_cau_doi_nhom', targetId: id,
    after: { ly_do_tu_choi: lyDo }, ip,
  });

  // KHÔNG logActivity: từ chối là chuyện giữa officer nhóm đích và người xin
  // (họ đọc được lý do qua chính GET /api/doi-nhom của mình) — không phải
  // chuyện cả nhóm cần biết, đúng nếp decideJoinRequest không nhắn gì khi từ
  // chối (nguyên tắc N1, Zalo lo việc nói chuyện).
  return json({ ok: true });
}

export async function postHuyDoiNhom(env, me, id) {
  const yc = await env.DB.prepare(
    'SELECT id, member_id, trang_thai FROM yeu_cau_doi_nhom WHERE id = ?'
  ).bind(id).first();
  // Không phải đơn của mình: 404 chứ không phải 403 — không xác nhận id đó
  // có tồn tại hay không, đúng quy ước N6 dùng xuyên suốt.
  if (!yc || yc.member_id !== me.id) return error('not_found', 404);
  if (yc.trang_thai !== 'cho_duyet') return error('da_xu_ly_roi', 409, { trang_thai: yc.trang_thai });

  await env.DB.prepare(
    "UPDATE yeu_cau_doi_nhom SET trang_thai = 'da_huy', updated_at = datetime('now') WHERE id = ?"
  ).bind(id).run();

  return json({ ok: true });
}
