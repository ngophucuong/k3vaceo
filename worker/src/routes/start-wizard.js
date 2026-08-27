// Wizard khởi tạo nhóm — mục 5 SRS. Mục tiêu: một trưởng nhóm bất kỳ tự dựng
// xong không gian cho nhóm mình trong dưới 5 phút, không cần liên hệ ai.
//
// Wizard KHÔNG cho tạo đợt thu và KHÔNG cấp quyền cấp lớp (ràng buộc mục 5).

import { json, error, readJson } from '../lib/http.js';
import { createSession, sessionCookieHeader, createInviteToken, INVITE_KIND } from '../auth.js';
import { logAudit, logActivity, canManageGroup } from '../permissions.js';
import { cleanText, normalizeEmail, isValidEmail } from '../lib/validate.js';
import { clientIp, allow } from '../lib/ratelimit.js';
import { bare } from '../lib/suggest.js';

const SEARCH_PER_HOUR = 60;

/* ══ Bước 1: bạn là ai — tìm trong 134 người của danh sách gốc ══ */
export async function searchRoster(request, env) {
  const q = cleanText(new URL(request.url).searchParams.get('q'), 60);
  if (!q || q.length < 2) return json({ people: [] });

  if (!(await allow(env, 'roster_search', clientIp(request), SEARCH_PER_HOUR))) {
    return error('rate_limited', 429, { retry_after_minutes: 60 });
  }

  // Tìm không dấu: người ta gõ "cuong" phải ra "Ngô Phú Cường". D1 không có
  // hàm bỏ dấu nên lọc trong JS — 134 dòng thì không đáng kể.
  const rows = await env.DB.prepare(
    `SELECT r.id, r.full_name, r.group_label, r.title, r.company,
            (SELECT COUNT(*) FROM members m WHERE m.roster_id = r.id) AS member_count,
            (SELECT g.label FROM members m JOIN groups g ON g.id = m.group_id
              WHERE m.roster_id = r.id AND m.is_active = 1 LIMIT 1) AS nhom_that,
            -- Có số nào để đối chiếu không. TRẢ CỜ, KHÔNG TRẢ SỐ — đường này
            -- ai gọi cũng được, lộ số là phát tán danh bạ cả lớp.
            --
            -- Điều kiện phải TRÙNG KHÍT với doiChieu() trong routes/onboard.js:
            -- số Ban tổ chức ghi trong danh sách gốc, HOẶC số chính chủ tự đặt
            -- (có phone_self_set_at). Lệch một chút là màn /vao bảo "chưa có
            -- số" trong khi đối chiếu vẫn chạy được, hoặc ngược lại.
            (CASE WHEN COALESCE(r.phone, '') <> '' THEN 1
                  WHEN EXISTS (SELECT 1 FROM members m
                                WHERE m.roster_id = r.id
                                  AND COALESCE(m.phone, '') <> ''
                                  AND m.phone_self_set_at IS NOT NULL) THEN 1
                  ELSE 0 END) AS co_so
     FROM roster r WHERE r.cohort_id = (SELECT id FROM cohorts WHERE code = 'K03')`
  ).all();

  const needle = bare(q);
  const people = (rows.results ?? [])
    .filter(r => bare(r.full_name).includes(needle))
    .slice(0, 12)
    .map(r => ({
      roster_id: r.id, full_name: r.full_name,
      // Nhóm THẬT trước, danh sách gốc chỉ là đường lui. Danh sách gốc là bản
      // ghi ngày 15/8 và không đổi khi Ban tổ chức chuyển ai sang nhóm khác
      // giữa khoá; hiện nhóm cũ thì người ta tưởng ứng dụng ghi sai.
      group_label: r.nhom_that || r.group_label,
      group_label_goc: r.group_label,
      da_chuyen_nhom: !!(r.nhom_that && r.nhom_that !== r.group_label),
      title: r.title, company: r.company, already_member: r.member_count > 0,
      // Giao diện dùng cờ này để chặn NGAY sau khi chọn tên, thay vì bắt người
      // ta gõ số vào rồi mới báo hỏng — 44 người trong danh sách gốc chưa có
      // số nào, thất bại hai lần liền là họ bỏ cuộc.
      co_so_doi_chieu: r.co_so === 1,
    }));
  return json({ people });
}

/* ══ Bước 2+3: nhận nhóm ══ */
export async function claimGroup(request, env) {
  if (!(await allow(env, 'wizard_claim', clientIp(request), 10))) {
    return error('rate_limited', 429, { retry_after_minutes: 60 });
  }

  const body = await readJson(request);
  const rosterId = Number(body.roster_id);
  if (!Number.isInteger(rosterId) || rosterId <= 0) return error('roster_invalid', 422);

  const email = normalizeEmail(body.email);
  if (!email || !isValidEmail(email)) return error('email_invalid', 422);

  const person = await env.DB.prepare('SELECT * FROM roster WHERE id = ?').bind(rosterId).first();
  if (!person) return error('roster_not_found', 404);

  const groupNo = Number(body.group_no ?? String(person.group_label).match(/\d+/)?.[0]);
  if (!Number.isInteger(groupNo) || groupNo <= 0) return error('group_invalid', 422);

  const group = await env.DB.prepare(
    'SELECT * FROM groups WHERE cohort_id = ? AND no = ?'
  ).bind(person.cohort_id, groupNo).first();
  if (!group) return error('group_not_found', 404);

  // Ràng buộc mục 5: một nhóm chỉ có một claimed_by. Người thứ hai chạy wizard
  // cho cùng nhóm không dựng lại được — chuyển sang luồng xin vào nhóm.
  if (group.status !== 'unclaimed') {
    const lead = await env.DB.prepare(
      `SELECT m.full_name, m.phone FROM officers o JOIN members m ON m.id = o.member_id
       WHERE o.group_id = ? AND o.role = 'truong_nhom' AND o.superseded_at IS NULL`
    ).bind(group.id).first();
    const mine = await env.DB.prepare(
      'SELECT id FROM members WHERE roster_id = ? AND group_id = ?'
    ).bind(rosterId, group.id).first();
    return json({
      already_claimed: true,
      group: { no: group.no, label: group.label },
      lead: lead ?? null,
      you_are_already_member: !!mine,
    }, 409);
  }

  const taken = await env.DB.prepare(
    'SELECT full_name FROM members WHERE cohort_id = ? AND email = ?'
  ).bind(person.cohort_id, email).first();
  if (taken) return error('email_taken', 409, { taken_by: taken.full_name });

  const me = await env.DB.prepare(
    `INSERT INTO members (cohort_id, group_id, roster_id, full_name, title, company, phone, email,
                          claimed_at, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), 1, datetime('now'), datetime('now'))
     RETURNING id`
  ).bind(person.cohort_id, group.id, person.id, person.full_name, person.title, person.company,
         person.phone, email).first();

  await env.DB.batch([
    env.DB.prepare(`UPDATE groups SET status = 'active', claimed_by = ?, claimed_at = datetime('now') WHERE id = ?`)
      .bind(me.id, group.id),
    // Người dựng làm trưởng nhóm tạm; bước 4 cho sửa lại.
    env.DB.prepare(
      `INSERT INTO officers (cohort_id, group_id, role, member_id, note, effective_from, recorded_by, created_at)
       VALUES (?, ?, 'truong_nhom', ?, 'người dựng không gian nhóm', date('now'), ?, datetime('now'))`
    ).bind(person.cohort_id, group.id, me.id, me.id),
  ]);

  await logAudit(env, {
    actorId: me.id, action: 'wizard.claim_group', targetType: 'group', targetId: group.id,
    after: { group_no: group.no, roster_id: rosterId }, ip: clientIp(request),
  });
  await logActivity(env, {
    cohortId: person.cohort_id, groupId: group.id, actorId: me.id,
    verb: 'wizard.claim_group', objectType: 'group', objectId: group.id,
    summary: `dựng không gian cho ${group.label}`,
  });

  const token = await createSession(env, me.id, request.headers.get('user-agent'));
  const isHttps = new URL(request.url).protocol === 'https:';

  // Đổ sẵn danh sách còn lại của nhóm từ danh sách gốc cho bước 5.
  const roster = await env.DB.prepare(
    `SELECT id AS roster_id, full_name, title, company, phone FROM roster
     WHERE cohort_id = ? AND group_label = ? AND id <> ? ORDER BY seq`
  ).bind(person.cohort_id, group.label, rosterId).all();

  return json(
    { ok: true, member_id: me.id, group: { id: group.id, no: group.no, label: group.label },
      roster_rest: roster.results ?? [] },
    200,
    { 'set-cookie': sessionCookieHeader(token, isHttps) }
  );
}

/* ══ Bước 5: tạo thành viên hàng loạt ══ */
export async function bulkMembers(request, env, me, ip) {
  if (!(await canManageGroup(env, me, me.group_id))) return error('forbidden', 403);

  const body = await readJson(request);
  const list = Array.isArray(body.members) ? body.members.slice(0, 60) : null;
  if (!list) return error('members_required', 422);

  const stmts = [];
  let added = 0;
  for (const raw of list) {
    const fullName = cleanText(raw.full_name, 120);
    if (!fullName) continue;
    const rosterId = Number.isInteger(Number(raw.roster_id)) && Number(raw.roster_id) > 0
      ? Number(raw.roster_id) : null;

    // Bỏ qua người đã có trong nhóm — bấm lại bước 5 không được nhân đôi.
    const exists = rosterId
      ? await env.DB.prepare('SELECT id FROM members WHERE roster_id = ? AND group_id = ?').bind(rosterId, me.group_id).first()
      : await env.DB.prepare('SELECT id FROM members WHERE full_name = ? AND group_id = ?').bind(fullName, me.group_id).first();
    if (exists) continue;

    // RETURNING để người gọi biết id vừa tạo. Thêm một người xong thì việc kế
    // tiếp gần như luôn là phát link mời cho đúng người ấy — không có id thì
    // phải đi dò lại theo tên, mà tên thì có thể trùng.
    stmts.push(env.DB.prepare(
      `INSERT INTO members (cohort_id, group_id, roster_id, full_name, title, company, phone,
                            claimed_at, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NULL, 1, datetime('now'), datetime('now'))
       RETURNING id, full_name`
    ).bind(me.cohort_id, me.group_id, rosterId, fullName,
           cleanText(raw.title, 120), cleanText(raw.company, 160), cleanText(raw.phone, 30)));
    added++;
  }
  const created = [];
  if (stmts.length) {
    const kq = await env.DB.batch(stmts);
    for (const r of kq) for (const d of (r?.results ?? [])) created.push({ id: d.id, full_name: d.full_name });
  }

  await logActivity(env, {
    cohortId: me.cohort_id, groupId: me.group_id, actorId: me.id,
    verb: 'wizard.members', objectType: 'group', objectId: me.group_id,
    summary: added === 1 && created[0]
      ? `thêm ${created[0].full_name} vào nhóm`
      : `nhập hồ sơ ${added} thành viên từ danh sách lớp`,
  });
  return json({ ok: true, added, created });
}

/* ══ Bước 6+7: khung bài và đề tài ══ */
export async function createPlan(request, env, me, ip) {
  if (!(await canManageGroup(env, me, me.group_id))) return error('forbidden', 403);

  const existing = await env.DB.prepare('SELECT id FROM plans WHERE group_id = ?').bind(me.group_id).first();
  if (existing) return error('plan_exists', 409);

  const body = await readJson(request);
  const template = await env.DB.prepare(
    'SELECT id FROM plan_templates WHERE is_default = 1 ORDER BY id LIMIT 1'
  ).first();
  if (!template) return error('template_missing', 500);

  const plan = await env.DB.prepare(
    `INSERT INTO plans (group_id, template_id, topic_product, topic_customers, updated_at)
     VALUES (?, ?, ?, ?, datetime('now')) RETURNING id`
  ).bind(me.group_id, template.id, cleanText(body.topic_product, 300), cleanText(body.topic_customers, 300)).first();

  await env.DB.prepare(
    `INSERT INTO plan_sections (plan_id, ord, title, requirement, owner_member_id, pct, updated_at)
     SELECT ?, ord, title, requirement, NULL, 0, datetime('now')
     FROM plan_template_sections WHERE template_id = ? ORDER BY ord`
  ).bind(plan.id, template.id).run();

  await logActivity(env, {
    cohortId: me.cohort_id, groupId: me.group_id, actorId: me.id,
    verb: 'plan.init', objectType: 'plan', objectId: plan.id,
    summary: 'tạo khung tám phần theo hướng dẫn của giảng viên',
  });
  return json({ ok: true, plan_id: plan.id });
}

/* ══ Xin vào nhóm đã có người dựng ══ */
export async function postJoinRequest(request, env) {
  if (!(await allow(env, 'wizard_claim', clientIp(request), 10))) {
    return error('rate_limited', 429, { retry_after_minutes: 60 });
  }
  const body = await readJson(request);
  const groupNo = Number(body.group_no);
  if (!Number.isInteger(groupNo)) return error('group_invalid', 422);

  const group = await env.DB.prepare(
    `SELECT g.id, g.cohort_id FROM groups g JOIN cohorts c ON c.id = g.cohort_id
     WHERE c.code = 'K03' AND g.no = ?`
  ).bind(groupNo).first();
  if (!group) return error('group_not_found', 404);

  const fullName = cleanText(body.full_name, 120);
  if (!fullName) return error('name_required', 422);
  const email = body.email ? normalizeEmail(body.email) : null;
  if (email && !isValidEmail(email)) return error('email_invalid', 422);

  const rosterId = Number.isInteger(Number(body.roster_id)) && Number(body.roster_id) > 0
    ? Number(body.roster_id) : null;

  const dup = await env.DB.prepare(
    `SELECT id FROM join_requests WHERE group_id = ? AND full_name = ? AND status = 'pending'`
  ).bind(group.id, fullName).first();
  if (dup) return json({ ok: true, already_pending: true });

  await env.DB.prepare(
    `INSERT INTO join_requests (cohort_id, group_id, roster_id, full_name, email, note, created_at)
     VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`
  ).bind(group.cohort_id, group.id, rosterId, fullName, email, cleanText(body.note, 200)).run();

  return json({ ok: true });
}

export async function listJoinRequests(env, me) {
  if (!(await canManageGroup(env, me, me.group_id))) return json({ requests: [] });
  const rows = await env.DB.prepare(
    `SELECT id, full_name, email, note, roster_id, created_at FROM join_requests
     WHERE group_id = ? AND status = 'pending' ORDER BY created_at`
  ).bind(me.group_id).all();
  return json({ requests: rows.results ?? [] });
}

// Nhận: tạo dòng members rồi phát link mời luôn, để trưởng nhóm chỉ phải bấm
// một lần. Từ chối: chỉ đóng yêu cầu, không nhắn gì tự động (nguyên tắc N1 —
// việc nói chuyện để Zalo lo).
export async function decideJoinRequest(request, env, me, reqId, ip) {
  if (!(await canManageGroup(env, me, me.group_id))) return error('forbidden', 403);

  const row = await env.DB.prepare(
    `SELECT * FROM join_requests WHERE id = ? AND group_id = ? AND status = 'pending'`
  ).bind(reqId, me.group_id).first();
  if (!row) return error('not_found', 404);

  const body = await readJson(request);
  const accept = body.accept === true;

  if (!accept) {
    await env.DB.prepare(
      `UPDATE join_requests SET status = 'declined', decided_by = ?, decided_at = datetime('now') WHERE id = ?`
    ).bind(me.id, row.id).run();
    await logAudit(env, { actorId: me.id, action: 'join.decline', targetType: 'join_request', targetId: row.id, ip });
    return json({ ok: true, accepted: false });
  }

  let member = await env.DB.prepare(
    'SELECT id FROM members WHERE group_id = ? AND (roster_id IS ? OR full_name = ?)'
  ).bind(me.group_id, row.roster_id, row.full_name).first();

  if (!member) {
    const roster = row.roster_id
      ? await env.DB.prepare('SELECT title, company, phone FROM roster WHERE id = ?').bind(row.roster_id).first()
      : null;
    member = await env.DB.prepare(
      `INSERT INTO members (cohort_id, group_id, roster_id, full_name, title, company, phone,
                            claimed_at, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NULL, 1, datetime('now'), datetime('now')) RETURNING id`
    ).bind(me.cohort_id, me.group_id, row.roster_id, row.full_name,
           roster?.title ?? null, roster?.company ?? null, roster?.phone ?? null).first();
  }

  await env.DB.prepare(
    `UPDATE join_requests SET status = 'accepted', decided_by = ?, decided_at = datetime('now') WHERE id = ?`
  ).bind(me.id, row.id).run();

  const token = await createInviteToken(env, member.id, me.id, INVITE_KIND);
  await logAudit(env, { actorId: me.id, action: 'join.accept', targetType: 'join_request', targetId: row.id, ip });
  await logActivity(env, {
    cohortId: me.cohort_id, groupId: me.group_id, actorId: me.id,
    verb: 'join.accept', objectType: 'member', objectId: member.id,
    summary: `nhận ${row.full_name} vào nhóm`,
  });

  return json({ ok: true, accepted: true, full_name: row.full_name,
    url: `${new URL(request.url).origin}/i/${token}` });
}
