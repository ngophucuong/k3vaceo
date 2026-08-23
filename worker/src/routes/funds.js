import { json, error, readJson } from '../lib/http.js';
import { isGroupOfficer, isClassOfficer, logAudit, logActivity } from '../permissions.js';
import { cleanText } from '../lib/validate.js';
import { buildTransferNote, buildQrUrl, isValidBin, bankName, BANKS } from '../lib/vietqr.js';

// Mục 6.4 SRS, ràng buộc câu chữ chứ không phải gợi ý: trạng thái của người
// đóng tiền LUÔN gọi là "đã tự khai", không bao giờ là "đã đóng". Chỉ khi
// người thu soi sao kê và bấm xác nhận mới thành "người thu đã nhận".
const LABEL_DECLARED = 'đã tự khai';
const LABEL_VERIFIED = 'người thu đã nhận';

async function loadRound(env, id) {
  return env.DB.prepare('SELECT * FROM fund_rounds WHERE id = ?').bind(id).first();
}

// Đợt này có áp dụng cho tôi không: quỹ lớp áp cho mọi người cùng khoá,
// quỹ nhóm chỉ áp cho nhóm đó (nguyên tắc N6 — dữ liệu nhóm cách ly).
function roundAppliesTo(round, me) {
  if (round.cohort_id !== me.cohort_id) return false;
  return round.scope === 'class' || round.group_id === me.group_id;
}

async function canCreate(env, me, scope, groupId) {
  if (scope === 'class') return isClassOfficer(env, me.id);
  return groupId === me.group_id && isGroupOfficer(env, me.id, me.group_id);
}

// Ai xem được sổ đầy đủ (ai đã khai, ai chưa): người thu của chính đợt đó,
// cộng trưởng/phó nhóm với đợt của nhóm mình, cộng Ban cán sự lớp với đợt lớp.
async function canSeeLedger(env, me, round) {
  if (round.collector_member_id === me.id) return true;
  if (round.scope === 'group' && round.group_id === me.group_id) {
    return isGroupOfficer(env, me.id, me.group_id);
  }
  if (round.scope === 'class') return isClassOfficer(env, me.id);
  return false;
}

async function shapeRound(env, round, me) {
  const [mine, counts, collector] = await Promise.all([
    env.DB.prepare('SELECT declared_at, verified_at, note FROM fund_declarations WHERE round_id = ? AND member_id = ?')
      .bind(round.id, me.id).first(),
    env.DB.prepare(
      `SELECT COUNT(*) AS declared, SUM(CASE WHEN verified_at IS NOT NULL THEN 1 ELSE 0 END) AS verified
       FROM fund_declarations WHERE round_id = ? AND declared_at IS NOT NULL`
    ).bind(round.id).first(),
    round.collector_member_id
      ? env.DB.prepare('SELECT full_name FROM members WHERE id = ?').bind(round.collector_member_id).first()
      : null,
  ]);

  // Tổng số người mà đợt này áp dụng — để hiện "9/14" mà không lộ tên ai.
  const totalRow = round.scope === 'class'
    ? await env.DB.prepare('SELECT COUNT(*) AS n FROM members WHERE cohort_id = ? AND is_active = 1').bind(round.cohort_id).first()
    : await env.DB.prepare('SELECT COUNT(*) AS n FROM members WHERE group_id = ? AND is_active = 1').bind(round.group_id).first();

  const note = buildTransferNote(round.syntax_template, { fullName: me.full_name, groupNo: me.group_no });

  return {
    id: round.id,
    scope: round.scope,
    title: round.title,
    purpose: round.purpose,
    amount: round.amount,
    bank_bin: round.bank_bin,
    bank_name: round.bank_name || bankName(round.bank_bin),
    account_no: round.account_no,
    account_name: round.account_name,
    collector_name: collector?.full_name ?? null,
    i_am_collector: round.collector_member_id === me.id,
    opens_on: round.opens_on,
    closes_on: round.closes_on,
    status: round.status,
    my_note: mine?.note ?? null,
    i_declared: !!mine?.declared_at,
    i_am_verified: !!mine?.verified_at,
    my_status_label: mine?.verified_at ? LABEL_VERIFIED : (mine?.declared_at ? LABEL_DECLARED : null),
    declared_count: counts?.declared ?? 0,
    verified_count: counts?.verified ?? 0,
    total_people: totalRow?.n ?? 0,
    transfer_note: note,
    qr_url: buildQrUrl(round, note),
    can_see_ledger: await canSeeLedger(env, me, round),
  };
}

export async function listFunds(env, me) {
  const rows = await env.DB.prepare(
    `SELECT * FROM fund_rounds
     WHERE cohort_id = ? AND status <> 'draft' AND (scope = 'class' OR group_id = ?)
     ORDER BY status = 'open' DESC, created_at DESC`
  ).bind(me.cohort_id, me.group_id).all();

  // Bản nháp chỉ người tạo/người thu thấy, để soạn xong mới công bố.
  const drafts = await env.DB.prepare(
    `SELECT * FROM fund_rounds WHERE cohort_id = ? AND status = 'draft'
       AND (created_by = ? OR collector_member_id = ?)`
  ).bind(me.cohort_id, me.id, me.id).all();

  const all = [...(rows.results ?? []), ...(drafts.results ?? [])].filter(r => roundAppliesTo(r, me));
  const rounds = [];
  for (const r of all) rounds.push(await shapeRound(env, r, me));

  return json({
    rounds,
    banks: BANKS,
    can_create_group: await isGroupOfficer(env, me.id, me.group_id),
    can_create_class: await isClassOfficer(env, me.id),
  });
}

export async function postFund(request, env, me, ip) {
  const body = await readJson(request);
  const scope = body.scope === 'class' ? 'class' : 'group';
  const groupId = scope === 'group' ? me.group_id : null;
  if (!(await canCreate(env, me, scope, groupId))) return error('forbidden', 403);

  const title = cleanText(body.title, 120);
  if (!title) return error('title_required', 422);
  const amount = Number(body.amount);
  if (!Number.isInteger(amount) || amount <= 0 || amount > 1_000_000_000) return error('amount_invalid', 422);
  const bankBin = cleanText(body.bank_bin, 6);
  if (!isValidBin(bankBin)) return error('bank_bin_invalid', 422);
  const accountNo = cleanText(body.account_no, 32);
  if (!accountNo || !/^[0-9A-Za-z]+$/.test(accountNo)) return error('account_no_invalid', 422);

  let collectorId = null;
  if (body.collector_member_id !== null && body.collector_member_id !== undefined && body.collector_member_id !== '') {
    collectorId = Number(body.collector_member_id);
    if (!Number.isInteger(collectorId) || collectorId <= 0) return error('collector_invalid', 422);
    // Người thu của đợt nhóm phải ở trong nhóm đó; đợt lớp thì ai trong khoá cũng được.
    const q = scope === 'group'
      ? env.DB.prepare('SELECT id FROM members WHERE id = ? AND group_id = ? AND is_active = 1').bind(collectorId, groupId)
      : env.DB.prepare('SELECT id FROM members WHERE id = ? AND cohort_id = ? AND is_active = 1').bind(collectorId, me.cohort_id);
    if (!(await q.first())) return error('collector_not_found', 422);
  }

  const row = await env.DB.prepare(
    `INSERT INTO fund_rounds
       (cohort_id, scope, group_id, title, purpose, amount, bank_bin, bank_name, account_no,
        account_name, collector_member_id, syntax_template, opens_on, closes_on, status, created_by, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, datetime('now'))
     RETURNING id`
  ).bind(
    me.cohort_id, scope, groupId, title, cleanText(body.purpose, 300), amount,
    bankBin, bankName(bankBin) ?? cleanText(body.bank_name, 60), accountNo,
    cleanText(body.account_name, 120), collectorId,
    cleanText(body.syntax_template, 60) ?? '{TEN} N{NHOM}',
    cleanText(body.opens_on, 20), cleanText(body.closes_on, 20), me.id
  ).first();

  await logAudit(env, {
    actorId: me.id, action: 'fund.create', targetType: 'fund_round', targetId: row.id,
    after: { scope, title, amount, bank_bin: bankBin, account_no: accountNo, collector: collectorId }, ip,
  });

  return json({ ok: true, id: row.id });
}

export async function patchFund(request, env, me, roundId, ip) {
  const round = await loadRound(env, roundId);
  if (!round || !roundAppliesTo(round, me)) return error('not_found', 404);
  if (!(await canCreate(env, me, round.scope, round.group_id))) return error('forbidden', 403);

  const body = await readJson(request);
  const next = { ...round };
  if ('status' in body) {
    if (!['draft', 'open', 'closed'].includes(body.status)) return error('status_invalid', 422);
    next.status = body.status;
  }
  if ('closes_on' in body) next.closes_on = cleanText(body.closes_on, 20);
  if ('opens_on' in body) next.opens_on = cleanText(body.opens_on, 20);
  if ('purpose' in body) next.purpose = cleanText(body.purpose, 300);
  if ('title' in body) next.title = cleanText(body.title, 120) ?? round.title;

  await env.DB.prepare(
    `UPDATE fund_rounds SET status = ?, opens_on = ?, closes_on = ?, purpose = ?, title = ? WHERE id = ?`
  ).bind(next.status, next.opens_on, next.closes_on, next.purpose, next.title, round.id).run();

  await logAudit(env, {
    actorId: me.id, action: 'fund.update', targetType: 'fund_round', targetId: round.id,
    before: { status: round.status, closes_on: round.closes_on },
    after: { status: next.status, closes_on: next.closes_on }, ip,
  });
  if (round.status !== 'open' && next.status === 'open') {
    await logActivity(env, {
      cohortId: me.cohort_id, groupId: me.group_id, actorId: me.id,
      verb: 'fund.open', objectType: 'fund_round', objectId: round.id,
      summary: `mở đợt thu "${next.title}"`,
    });
  }
  return json({ ok: true });
}

// Mã QR riêng cho người đang đăng nhập — nội dung chuyển khoản đã ghép sẵn
// tên họ, khỏi phải gõ tay (bài toán 4 ở mục 1.2 SRS).
export async function getFundQr(env, me, roundId) {
  const round = await loadRound(env, roundId);
  if (!round || !roundAppliesTo(round, me)) return error('not_found', 404);
  const note = buildTransferNote(round.syntax_template, { fullName: me.full_name, groupNo: me.group_no });
  return json({ transfer_note: note, qr_url: buildQrUrl(round, note), amount: round.amount });
}

export async function postDeclare(request, env, me, roundId, ip) {
  const round = await loadRound(env, roundId);
  if (!round || !roundAppliesTo(round, me)) return error('not_found', 404);
  if (round.status !== 'open') return error('round_not_open', 409);

  const body = await readJson(request);
  await env.DB.prepare(
    `INSERT INTO fund_declarations (round_id, member_id, declared_at, note)
     VALUES (?, ?, datetime('now'), ?)
     ON CONFLICT(round_id, member_id) DO UPDATE SET declared_at = excluded.declared_at, note = excluded.note`
  ).bind(round.id, me.id, cleanText(body.note, 200)).run();

  await logAudit(env, { actorId: me.id, action: 'fund.declare', targetType: 'fund_round', targetId: round.id, ip });
  await logActivity(env, {
    cohortId: me.cohort_id, groupId: me.group_id, actorId: me.id,
    verb: 'fund.declare', objectType: 'fund_round', objectId: round.id,
    summary: `tự khai đã chuyển "${round.title}"`,
  });
  return json({ ok: true, status_label: LABEL_DECLARED });
}

// Bỏ khai: xoá hẳn dòng tự khai, nhưng KHÔNG đụng tới xác nhận của người thu
// — tiền đã vào tài khoản rồi thì người đóng không tự rút lại lời xác nhận đó.
export async function deleteDeclare(env, me, roundId, ip) {
  const round = await loadRound(env, roundId);
  if (!round || !roundAppliesTo(round, me)) return error('not_found', 404);

  const row = await env.DB.prepare(
    'SELECT verified_at FROM fund_declarations WHERE round_id = ? AND member_id = ?'
  ).bind(round.id, me.id).first();
  if (row?.verified_at) return error('already_verified', 409);

  await env.DB.prepare('DELETE FROM fund_declarations WHERE round_id = ? AND member_id = ?')
    .bind(round.id, me.id).run();
  await logAudit(env, { actorId: me.id, action: 'fund.undeclare', targetType: 'fund_round', targetId: round.id, ip });
  return json({ ok: true });
}

// Sổ đầy đủ — chỉ người thu, trưởng/phó nhóm (đợt nhóm), Ban cán sự lớp (đợt
// lớp). Thành viên thường chỉ thấy con số đếm trong listFunds, không thấy tên.
// Mục 6.4 SRS: không có nhắc nợ tự động, nên ở đây chỉ trả dữ liệu để người
// thu tự nhắn riêng.
export async function getLedger(env, me, roundId) {
  const round = await loadRound(env, roundId);
  if (!round || !roundAppliesTo(round, me)) return error('not_found', 404);
  if (!(await canSeeLedger(env, me, round))) return error('forbidden', 403);

  const people = round.scope === 'class'
    ? await env.DB.prepare(
        `SELECT m.id, m.full_name, m.phone, d.declared_at, d.verified_at, d.note
         FROM members m LEFT JOIN fund_declarations d ON d.member_id = m.id AND d.round_id = ?
         WHERE m.cohort_id = ? AND m.is_active = 1 ORDER BY m.id`
      ).bind(round.id, round.cohort_id).all()
    : await env.DB.prepare(
        `SELECT m.id, m.full_name, m.phone, d.declared_at, d.verified_at, d.note
         FROM members m LEFT JOIN fund_declarations d ON d.member_id = m.id AND d.round_id = ?
         WHERE m.group_id = ? AND m.is_active = 1 ORDER BY m.id`
      ).bind(round.id, round.group_id).all();

  return json({
    round: { id: round.id, title: round.title, amount: round.amount, status: round.status },
    i_am_collector: round.collector_member_id === me.id,
    people: (people.results ?? []).map(p => ({
      id: p.id,
      full_name: p.full_name,
      phone: p.phone,
      declared: !!p.declared_at,
      verified: !!p.verified_at,
      note: p.note,
      status_label: p.verified_at ? LABEL_VERIFIED : (p.declared_at ? LABEL_DECLARED : 'chưa khai'),
    })),
  });
}

// Chỉ người thu của chính đợt đó xác nhận đã nhận tiền — trưởng nhóm xem được
// sổ nhưng không xác nhận thay được, vì chỉ người thu mới soi được sao kê.
export async function postVerify(request, env, me, roundId, ip) {
  const round = await loadRound(env, roundId);
  if (!round || !roundAppliesTo(round, me)) return error('not_found', 404);
  if (round.collector_member_id !== me.id) return error('only_collector', 403);

  const body = await readJson(request);
  const memberId = Number(body.member_id);
  if (!Number.isInteger(memberId) || memberId <= 0) return error('member_invalid', 422);

  const inScope = round.scope === 'class'
    ? await env.DB.prepare('SELECT id FROM members WHERE id = ? AND cohort_id = ? AND is_active = 1').bind(memberId, round.cohort_id).first()
    : await env.DB.prepare('SELECT id FROM members WHERE id = ? AND group_id = ? AND is_active = 1').bind(memberId, round.group_id).first();
  if (!inScope) return error('member_not_in_round', 422);

  // Mốc thời gian để SQLite sinh, không dùng Date của JS: hai dạng chuỗi khác
  // nhau ('T' và dấu cách) từng làm hạn token so sai ở Đợt 1.
  const undo = body.undo === true;
  const stmt = undo
    ? env.DB.prepare(
        `INSERT INTO fund_declarations (round_id, member_id, declared_at, verified_by, verified_at)
         VALUES (?, ?, datetime('now'), NULL, NULL)
         ON CONFLICT(round_id, member_id) DO UPDATE SET verified_by = NULL, verified_at = NULL`
      ).bind(round.id, memberId)
    : env.DB.prepare(
        `INSERT INTO fund_declarations (round_id, member_id, declared_at, verified_by, verified_at)
         VALUES (?, ?, datetime('now'), ?, datetime('now'))
         ON CONFLICT(round_id, member_id) DO UPDATE SET
           verified_by = excluded.verified_by, verified_at = excluded.verified_at`
      ).bind(round.id, memberId, me.id);
  await stmt.run();

  await logAudit(env, {
    actorId: me.id, action: undo ? 'fund.unverify' : 'fund.verify',
    targetType: 'fund_round', targetId: round.id, after: { member_id: memberId }, ip,
  });
  return json({ ok: true, status_label: undo ? LABEL_DECLARED : LABEL_VERIFIED });
}
