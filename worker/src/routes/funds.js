import { json, error, readJson } from '../lib/http.js';
import { isGroupOfficer, isClassOfficer, isClassCommittee, logAudit, logActivity } from '../permissions.js';
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
// Trả về xem người này đọc được sổ tới đâu:
//   'ca-dot'    — thấy toàn bộ danh sách của đợt
//   'nhom-minh' — chỉ thấy phần nhóm mình
//   null        — không được xem
//
// Chỗ 'nhom-minh' là thứ trước đây thiếu, và thiếu nó thì quỹ lớp không chạy
// được trên thực tế: thủ quỹ mở MỘT đợt cho cả 134 người, nhưng đôn đốc thì
// phải là mười trưởng nhóm, mỗi người lo 14 người của mình. Bản cũ chỉ cho
// Ban cán sự lớp xem, nên trưởng nhóm không biết ai trong nhóm đã chuyển —
// đành phải mở đợt riêng cho nhóm, và tiền của lớp lại đổ vào sổ nhóm.
async function mucXemSo(env, me, round) {
  if (round.collector_member_id === me.id) return 'ca-dot';

  if (round.scope === 'group') {
    if (round.group_id !== me.group_id) return null;
    return (await isGroupOfficer(env, me.id, me.group_id)) ? 'ca-dot' : null;
  }

  // Đợt cấp lớp.
  if (await isClassCommittee(env, me.id)) return 'ca-dot';
  if (me.group_id && (await isGroupOfficer(env, me.id, me.group_id))) return 'nhom-minh';
  return null;
}

async function canSeeLedger(env, me, round) {
  return (await mucXemSo(env, me, round)) !== null;
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
    syntax_template: round.syntax_template || '{TEN} N{NHOM}',
    thuoc_quy: round.thuoc_quy || (round.scope === 'class' ? 'lop' : 'nhom'),
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

  // Số dư hai sổ đi kèm luôn, để tab Quỹ hiện được "còn lại bao nhiêu" mà
  // không phải gọi thêm lượt nữa. Sổ nhóm chỉ có khi người này thuộc một nhóm.
  const soQuy = {
    group: me.group_id ? await summarizeScope(env, me.cohort_id, 'group', me.group_id) : null,
    class: await summarizeScope(env, me.cohort_id, 'class', null),
  };

  return json({
    rounds,
    banks: BANKS,
    so_quy: soQuy,
    can_create_group: await isGroupOfficer(env, me.id, me.group_id),
    can_create_class: await isClassOfficer(env, me.id),
    can_chi_group: me.group_id ? await canManageExpense(env, me, 'group', me.group_id) : false,
    can_chi_class: await canManageExpense(env, me, 'class', null),
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

  const cuPhap = cleanText(body.syntax_template, 60) ?? '{TEN} N{NHOM}';
  if (!cuPhap.includes('{TEN}')) return error('syntax_thieu_ten', 422);

  // Tiền của đợt này thuộc quỹ nào. Đợt cấp lớp thì đương nhiên là quỹ lớp.
  // Đợt cấp nhóm thì được chọn: trưởng nhóm thu hộ quỹ lớp là chuyện thường —
  // tiền vào tài khoản thủ quỹ lớp, nên phải cộng vào sổ lớp chứ không phải
  // sổ nhóm, dù người đóng là 14 người của nhóm.
  const thuocQuy = scope === 'class' ? 'lop'
    : (body.thuoc_quy === 'lop' ? 'lop' : 'nhom');

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
        account_name, collector_member_id, syntax_template, thuoc_quy, opens_on, closes_on,
        status, created_by, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, datetime('now'))
     RETURNING id`
  ).bind(
    me.cohort_id, scope, groupId, title, cleanText(body.purpose, 300), amount,
    bankBin, bankName(bankBin) ?? cleanText(body.bank_name, 60), accountNo,
    cleanText(body.account_name, 120), collectorId,
    cuPhap, thuocQuy,
    cleanText(body.opens_on, 20), cleanText(body.closes_on, 20), me.id
  ).first();

  await logAudit(env, {
    actorId: me.id, action: 'fund.create', targetType: 'fund_round', targetId: row.id,
    after: { scope, thuoc_quy: thuocQuy, title, amount, bank_bin: bankBin, account_no: accountNo, collector: collectorId }, ip,
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
  // Cú pháp chuyển khoản sửa được cả sau khi tạo. Người thu hay phát hiện
  // mình cần thêm chữ ("Quylop", "Dot2"...) sau khi đã nhìn sao kê thật; bắt
  // huỷ đợt rồi tạo lại chỉ vì mấy chữ ấy là vô lý.
  // Đổi sổ nhận tiền chỉ khi còn BẢN NHÁP. Đợt đã mở mà đổi thì số dư hai sổ
  // nhảy cùng lúc, người xem không hiểu tiền chạy đi đâu.
  if ('thuoc_quy' in body) {
    if (round.status !== 'draft') return error('thuoc_quy_khoa', 409);
    if (round.scope === 'class' && body.thuoc_quy !== 'lop') return error('thuoc_quy_invalid', 422);
    next.thuoc_quy = body.thuoc_quy === 'lop' ? 'lop' : 'nhom';
  }
  if ('syntax_template' in body) {
    const cp = cleanText(body.syntax_template, 60);
    if (!cp) return error('syntax_required', 422);
    // Thiếu {TEN} thì mọi người chuyển khoản giống hệt nhau, người thu soi sao
    // kê không biết ai là ai — hỏng đúng công dụng của cú pháp.
    if (!cp.includes('{TEN}')) return error('syntax_thieu_ten', 422);
    next.syntax_template = cp;
  }

  await env.DB.prepare(
    `UPDATE fund_rounds SET status = ?, opens_on = ?, closes_on = ?, purpose = ?, title = ?,
       syntax_template = ?, thuoc_quy = ? WHERE id = ?`
  ).bind(next.status, next.opens_on, next.closes_on, next.purpose, next.title,
         next.syntax_template ?? round.syntax_template,
         next.thuoc_quy ?? round.thuoc_quy, round.id).run();

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
     ON CONFLICT(round_id, member_id) DO UPDATE SET declared_at = excluded.declared_at,
       note = excluded.note, declared_by = NULL`
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
  const muc = await mucXemSo(env, me, round);
  if (!muc) return error('forbidden', 403);

  // Trưởng nhóm xem đợt cấp lớp thì CHỈ thấy nhóm mình — lọc ngay trong câu
  // truy vấn chứ không lọc ở giao diện (nguyên tắc N6, và mục 6 CLAUDE.md:
  // phân quyền kiểm ở máy chủ, không tin giao diện).
  const people = round.scope === 'class'
    ? (muc === 'nhom-minh'
        ? await env.DB.prepare(
            `SELECT m.id, m.full_name, m.phone, d.declared_at, d.verified_at, d.note,
                    (SELECT k.full_name FROM members k WHERE k.id = d.declared_by) AS khai_ho_boi,
                (SELECT k.full_name FROM members k WHERE k.id = d.declared_by) AS khai_ho_boi
             FROM members m LEFT JOIN fund_declarations d ON d.member_id = m.id AND d.round_id = ?
             WHERE m.cohort_id = ? AND m.group_id = ? AND m.is_active = 1 ORDER BY m.id`
          ).bind(round.id, round.cohort_id, me.group_id).all()
        : await env.DB.prepare(
            `SELECT m.id, m.full_name, m.phone, d.declared_at, d.verified_at, d.note,
                    (SELECT k.full_name FROM members k WHERE k.id = d.declared_by) AS khai_ho_boi,
                (SELECT k.full_name FROM members k WHERE k.id = d.declared_by) AS khai_ho_boi
             FROM members m LEFT JOIN fund_declarations d ON d.member_id = m.id AND d.round_id = ?
             WHERE m.cohort_id = ? AND m.is_active = 1 ORDER BY m.id`
          ).bind(round.id, round.cohort_id).all())
    : await env.DB.prepare(
        `SELECT m.id, m.full_name, m.phone, d.declared_at, d.verified_at, d.note,
                (SELECT k.full_name FROM members k WHERE k.id = d.declared_by) AS khai_ho_boi
         FROM members m LEFT JOIN fund_declarations d ON d.member_id = m.id AND d.round_id = ?
         WHERE m.group_id = ? AND m.is_active = 1 ORDER BY m.id`
      ).bind(round.id, round.group_id).all();

  return json({
    round: { id: round.id, title: round.title, amount: round.amount, status: round.status, scope: round.scope },
    i_am_collector: round.collector_member_id === me.id,
    // Nói rõ đang xem cả đợt hay chỉ nhóm mình, để không ai nhầm 14 người
    // của Nhóm 6 là toàn bộ 134 người của lớp.
    pham_vi_xem: muc,
    people: (people.results ?? []).map(p => ({
      id: p.id,
      full_name: p.full_name,
      phone: p.phone,
      declared: !!p.declared_at,
      verified: !!p.verified_at,
      note: p.note,
      khai_ho_boi: p.khai_ho_boi ?? null,
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

/* ─────────────────────── Sổ chi và số dư (Đợt 6) ───────────────────────
 * Phần thu ở trên trả lời "ai đã chuyển tiền". Phần dưới trả lời câu mà
 * người giữ tiền bị hỏi nhiều nhất: "quỹ còn bao nhiêu, tiêu vào những gì".
 *
 * Nguyên tắc N3 vẫn nguyên: ứng dụng không giữ tiền, chỉ ghi lại việc đã xảy
 * ra ở ngoài đời. Nguyên tắc N4 nên không có bước duyệt chi — thay vào đó mọi
 * khoản chi hiện công khai cho cả phạm vi đó xem, minh bạch thay cho phê duyệt.
 */

export const EXPENSE_CATEGORIES = [
  { key: 'in_an', label: 'In ấn, tài liệu' },
  { key: 'an_uong', label: 'Ăn uống, nước' },
  { key: 'di_lai', label: 'Đi lại, thuê xe' },
  { key: 'dia_diem', label: 'Thuê địa điểm' },
  { key: 'qua_tang', label: 'Quà tặng, hoa' },
  { key: 'hoc_lieu', label: 'Học liệu, phần mềm' },
  { key: 'khac', label: 'Khác' },
];
const CATEGORY_KEYS = new Set(EXPENSE_CATEGORIES.map(c => c.key));
const CATEGORY_LABEL = Object.fromEntries(EXPENSE_CATEGORIES.map(c => [c.key, c.label]));

// Phạm vi hợp lệ của người đang đăng nhập: 'class' thì ai cùng khoá cũng
// thuộc; 'group' thì chỉ nhóm của chính mình (nguyên tắc N6 — nhóm 8 không
// đọc được gì của nhóm 6).
function scopeOf(me, raw) {
  if (raw === 'class') return { scope: 'class', groupId: null };
  if (raw === 'group' || raw === undefined || raw === null || raw === '') {
    return me.group_id ? { scope: 'group', groupId: me.group_id } : null;
  }
  return null;
}

// Ai được ghi khoản chi: Ban cán sự lớp với sổ lớp, trưởng/phó nhóm với sổ
// nhóm, cộng người thu của bất kỳ đợt nào trong sổ ấy — người cầm tiền thật
// phải ghi được, kể cả khi họ không giữ vai gì.
async function canManageExpense(env, me, scope, groupId) {
  if (scope === 'class') {
    if (await isClassOfficer(env, me.id)) return true;
    const row = await env.DB.prepare(
      `SELECT 1 FROM fund_rounds WHERE cohort_id = ? AND scope = 'class' AND collector_member_id = ?`
    ).bind(me.cohort_id, me.id).first();
    return !!row;
  }
  if (groupId !== me.group_id) return false;
  if (await isGroupOfficer(env, me.id, groupId)) return true;
  const row = await env.DB.prepare(
    `SELECT 1 FROM fund_rounds WHERE scope = 'group' AND group_id = ? AND collector_member_id = ?`
  ).bind(groupId, me.id).first();
  return !!row;
}

// Số tiền của một phạm vi. Chỉ khoản "người thu đã nhận" mới tính là tiền
// thật đã vào quỹ — lời tự khai để riêng một dòng "đang chờ đối chiếu", đúng
// ràng buộc câu chữ mục 6.4 SRS. Cộng dồn theo mức đóng của từng đợt.
async function summarizeScope(env, cohortId, scope, groupId) {
  // Tiền chảy theo THUOC_QUY, không theo scope. Một đợt do trưởng Nhóm 6 mở để
  // thu quỹ lớp (scope='group', thuoc_quy='lop') phải cộng vào sổ LỚP — tiền
  // nằm ở tài khoản thủ quỹ lớp chứ không ở nhóm. Trước đây cộng theo scope
  // nên sổ nhóm phình lên bằng tiền của lớp.
  //
  // COALESCE cho các đợt tạo trước migration 0010, lúc cột chưa tồn tại.
  const cuaLop = `COALESCE(r.thuoc_quy, CASE WHEN r.scope = 'class' THEN 'lop' ELSE 'nhom' END) = 'lop'`;
  const where = scope === 'class'
    ? { sql: `r.cohort_id = ? AND ${cuaLop}`, args: [cohortId] }
    : { sql: `r.cohort_id = ? AND r.group_id = ? AND NOT (${cuaLop})`, args: [cohortId, groupId] };

  const thu = await env.DB.prepare(
    `SELECT
       COALESCE(SUM(CASE WHEN d.verified_at IS NOT NULL THEN r.amount ELSE 0 END), 0) AS da_nhan,
       COALESCE(SUM(CASE WHEN d.verified_at IS NULL AND d.declared_at IS NOT NULL THEN r.amount ELSE 0 END), 0) AS cho_doi_chieu,
       COUNT(DISTINCT r.id) AS so_dot
     FROM fund_rounds r
     LEFT JOIN fund_declarations d ON d.round_id = r.id
     WHERE ${where.sql} AND r.status <> 'draft'`
  ).bind(...where.args).first();

  const chiWhere = scope === 'class'
    ? { sql: `cohort_id = ? AND scope = 'class'`, args: [cohortId] }
    : { sql: `cohort_id = ? AND scope = 'group' AND group_id = ?`, args: [cohortId, groupId] };
  const chi = await env.DB.prepare(
    `SELECT COALESCE(SUM(amount), 0) AS tong, COUNT(*) AS so_khoan FROM fund_expenses WHERE ${chiWhere.sql}`
  ).bind(...chiWhere.args).first();

  const daNhan = thu?.da_nhan ?? 0;
  const tongChi = chi?.tong ?? 0;
  return {
    scope,
    da_nhan: daNhan,
    cho_doi_chieu: thu?.cho_doi_chieu ?? 0,
    da_chi: tongChi,
    con_lai: daNhan - tongChi,
    so_dot: thu?.so_dot ?? 0,
    so_khoan_chi: chi?.so_khoan ?? 0,
  };
}

function shapeExpense(row) {
  return {
    id: row.id,
    scope: row.scope,
    title: row.title,
    category: row.category,
    category_label: row.category ? (CATEGORY_LABEL[row.category] ?? row.category) : null,
    amount: row.amount,
    spent_on: row.spent_on,
    payee: row.payee,
    note: row.note,
    receipt_url: row.receipt_url,
    round_id: row.round_id,
    round_title: row.round_title ?? null,
    created_by_name: row.created_by_name ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

// Sổ chi mở cho cả phạm vi xem — khác sổ thu (chỉ người thu và Ban cán sự
// lớp). Xem khoản chi không lộ chuyện riêng của ai; giấu đi thì mất luôn lý do
// tồn tại của cái sổ.
export async function listExpenses(env, me, url) {
  const sel = scopeOf(me, url.searchParams.get('scope'));
  if (!sel) return error('scope_invalid', 422);

  const where = sel.scope === 'class'
    ? { sql: `e.cohort_id = ? AND e.scope = 'class'`, args: [me.cohort_id] }
    : { sql: `e.cohort_id = ? AND e.scope = 'group' AND e.group_id = ?`, args: [me.cohort_id, sel.groupId] };

  const rows = await env.DB.prepare(
    `SELECT e.*, m.full_name AS created_by_name, r.title AS round_title
     FROM fund_expenses e
     LEFT JOIN members m ON m.id = e.created_by
     LEFT JOIN fund_rounds r ON r.id = e.round_id
     WHERE ${where.sql}
     ORDER BY COALESCE(e.spent_on, date(e.created_at)) DESC, e.id DESC`
  ).bind(...where.args).all();

  return json({
    scope: sel.scope,
    summary: await summarizeScope(env, me.cohort_id, sel.scope, sel.groupId),
    expenses: (rows.results ?? []).map(shapeExpense),
    categories: EXPENSE_CATEGORIES,
    can_manage: await canManageExpense(env, me, sel.scope, sel.groupId),
  });
}

// Đọc và kiểm phần thân dùng chung cho tạo mới và sửa. Trả { loi } khi hỏng.
async function readExpenseBody(env, me, body, sel) {
  const title = cleanText(body.title, 120);
  if (!title) return { loi: 'title_required' };

  const amount = Number(body.amount);
  if (!Number.isInteger(amount) || amount <= 0 || amount > 1_000_000_000) return { loi: 'amount_invalid' };

  const category = cleanText(body.category, 20);
  if (category && !CATEGORY_KEYS.has(category)) return { loi: 'category_invalid' };

  // Ngày chi do người dùng gõ, nên chỉ nhận đúng khuôn YYYY-MM-DD rồi để
  // SQLite tự soi bằng date() — chuỗi rác lọt vào là mọi phép sắp xếp sai.
  const spentOn = cleanText(body.spent_on, 10);
  if (spentOn && !/^\d{4}-\d{2}-\d{2}$/.test(spentOn)) return { loi: 'spent_on_invalid' };
  if (spentOn) {
    const ok = await env.DB.prepare(`SELECT date(?) IS NOT NULL AS ok`).bind(spentOn).first();
    if (!ok?.ok) return { loi: 'spent_on_invalid' };
  }

  // Nguyên tắc N2 — ứng dụng không giữ file. Ảnh hoá đơn nằm trên Drive, ở
  // đây chỉ có đường dẫn, và bắt buộc https như mọi liên kết trong Kho.
  const receiptUrl = cleanText(body.receipt_url, 2000);
  if (receiptUrl && !/^https:\/\/[^\s/]+\./i.test(receiptUrl)) return { loi: 'url_must_be_https' };

  let roundId = null;
  if (body.round_id !== null && body.round_id !== undefined && body.round_id !== '') {
    roundId = Number(body.round_id);
    if (!Number.isInteger(roundId) || roundId <= 0) return { loi: 'round_invalid' };
    const r = await loadRound(env, roundId);
    if (!r || r.cohort_id !== me.cohort_id || r.scope !== sel.scope ||
        (sel.scope === 'group' && r.group_id !== sel.groupId)) return { loi: 'round_invalid' };
  }

  return {
    title, amount, category, spentOn, receiptUrl, roundId,
    payee: cleanText(body.payee, 120),
    note: cleanText(body.note, 300),
  };
}

export async function postExpense(request, env, me, ip) {
  const body = await readJson(request);
  const sel = scopeOf(me, body.scope);
  if (!sel) return error('scope_invalid', 422);
  if (!(await canManageExpense(env, me, sel.scope, sel.groupId))) return error('forbidden', 403);

  const v = await readExpenseBody(env, me, body, sel);
  if (v.loi) return error(v.loi, 422);

  const row = await env.DB.prepare(
    `INSERT INTO fund_expenses
       (cohort_id, scope, group_id, round_id, title, category, amount, spent_on, payee, note,
        receipt_url, created_by, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
     RETURNING id`
  ).bind(
    me.cohort_id, sel.scope, sel.groupId, v.roundId, v.title, v.category, v.amount,
    v.spentOn, v.payee, v.note, v.receiptUrl, me.id
  ).first();

  await logAudit(env, {
    actorId: me.id, action: 'expense.create', targetType: 'fund_expense', targetId: row.id,
    after: { scope: sel.scope, title: v.title, amount: v.amount, spent_on: v.spentOn }, ip,
  });
  await logActivity(env, {
    cohortId: me.cohort_id, groupId: sel.scope === 'group' ? sel.groupId : me.group_id, actorId: me.id,
    verb: 'expense.create', objectType: 'fund_expense', objectId: row.id,
    summary: `ghi khoản chi "${v.title}"`,
  });

  return json({ ok: true, id: row.id });
}

async function loadExpense(env, me, id) {
  const row = await env.DB.prepare('SELECT * FROM fund_expenses WHERE id = ?').bind(id).first();
  if (!row || row.cohort_id !== me.cohort_id) return null;
  // Nguyên tắc N6: khoản chi của nhóm khác coi như không tồn tại. Trả 404 chứ
  // không 403 — 403 là xác nhận id đó có thật (quy ước mục 6 CLAUDE.md).
  if (row.scope === 'group' && row.group_id !== me.group_id) return null;
  return row;
}

export async function patchExpense(request, env, me, id, ip) {
  const cur = await loadExpense(env, me, id);
  if (!cur) return error('not_found', 404);
  const sel = { scope: cur.scope, groupId: cur.group_id };
  if (!(await canManageExpense(env, me, sel.scope, sel.groupId))) return error('forbidden', 403);

  const body = await readJson(request);
  // Sửa từng phần: field nào không gửi thì giữ nguyên giá trị cũ.
  const merged = {
    title: 'title' in body ? body.title : cur.title,
    amount: 'amount' in body ? body.amount : cur.amount,
    category: 'category' in body ? body.category : cur.category,
    spent_on: 'spent_on' in body ? body.spent_on : cur.spent_on,
    payee: 'payee' in body ? body.payee : cur.payee,
    note: 'note' in body ? body.note : cur.note,
    receipt_url: 'receipt_url' in body ? body.receipt_url : cur.receipt_url,
    round_id: 'round_id' in body ? body.round_id : cur.round_id,
  };
  const v = await readExpenseBody(env, me, merged, sel);
  if (v.loi) return error(v.loi, 422);

  await env.DB.prepare(
    `UPDATE fund_expenses SET title = ?, category = ?, amount = ?, spent_on = ?, payee = ?,
       note = ?, receipt_url = ?, round_id = ?, updated_at = datetime('now')
     WHERE id = ?`
  ).bind(v.title, v.category, v.amount, v.spentOn, v.payee, v.note, v.receiptUrl, v.roundId, id).run();

  await logAudit(env, {
    actorId: me.id, action: 'expense.update', targetType: 'fund_expense', targetId: id,
    before: { title: cur.title, amount: cur.amount, spent_on: cur.spent_on },
    after: { title: v.title, amount: v.amount, spent_on: v.spentOn }, ip,
  });
  return json({ ok: true });
}

// Xoá hẳn dòng, nhưng audit_log giữ nguyên nội dung cũ và nhật ký nhóm ghi
// công khai — sổ tiền mà xoá không dấu vết thì không còn là sổ.
export async function deleteExpense(env, me, id, ip) {
  const cur = await loadExpense(env, me, id);
  if (!cur) return error('not_found', 404);
  if (!(await canManageExpense(env, me, cur.scope, cur.group_id))) return error('forbidden', 403);

  await env.DB.prepare('DELETE FROM fund_expenses WHERE id = ?').bind(id).run();

  await logAudit(env, {
    actorId: me.id, action: 'expense.delete', targetType: 'fund_expense', targetId: id,
    before: {
      title: cur.title, amount: cur.amount, spent_on: cur.spent_on, payee: cur.payee,
      note: cur.note, receipt_url: cur.receipt_url, category: cur.category, round_id: cur.round_id,
    }, ip,
  });
  await logActivity(env, {
    cohortId: me.cohort_id, groupId: cur.scope === 'group' ? cur.group_id : me.group_id, actorId: me.id,
    verb: 'expense.delete', objectType: 'fund_expense', objectId: id,
    summary: `xoá khoản chi "${cur.title}"`,
  });
  return json({ ok: true });
}

// Danh sách người trong khoá để chọn người thu cho đợt quỹ LỚP. Chặn bằng
// isClassOfficer — chỉ ai tạo được đợt lớp mới cần danh sách này, và giữ
// nguyên tắc N6 với người còn lại (nhóm khác vẫn không đọc được gì thêm:
// tên và số nhóm là thứ cả lớp đã biết, không kèm điện thoại hay email).
export async function getClassMembers(env, me) {
  if (!(await isClassOfficer(env, me.id))) return error('forbidden', 403);
  const rows = await env.DB.prepare(
    `SELECT m.id, m.full_name, g.no AS group_no
     FROM members m LEFT JOIN groups g ON g.id = m.group_id
     WHERE m.cohort_id = ? AND m.is_active = 1
     ORDER BY g.no, m.full_name`
  ).bind(me.cohort_id).all();
  return json({ members: rows.results ?? [] });
}


/* ─────────────────────────── Khai hộ (Đợt 6b) ───────────────────────────
 * Nhiều học viên gửi ảnh chuyển khoản qua Zalo mà chưa từng mở ứng dụng.
 * Trước nay chỉ chính chủ tự khai được, nên trưởng nhóm không ghi lại được và
 * bảng tiến độ báo cáo lên lớp thành sai.
 *
 * Khai hộ dừng ở "đã tự khai", KHÔNG chạm tới "người thu đã nhận" (mục 6.4
 * SRS). Ảnh chụp là lời khai của người chuyển; chỉ người thu soi sao kê mới
 * xác nhận được tiền đã vào. Giữ ranh giới ấy là giữ đúng ý nghĩa cả hai nhãn.
 *
 * Ai khai hộ được: trưởng/phó nhóm với người trong nhóm mình, người thu của
 * chính đợt ấy, và Ban cán sự lớp với đợt cấp lớp. Cùng tinh thần "sửa hộ" ở
 * ma trận mục 2.2 — và cũng như sửa hộ, luôn ghi rõ ai làm.
 */
async function khaiHoDuoc(env, me, round, target) {
  if (round.collector_member_id === me.id) return true;
  if (target.group_id === me.group_id && (await isGroupOfficer(env, me.id, me.group_id))) return true;
  if (round.scope === 'class') return isClassCommittee(env, me.id);
  return false;
}

// Người được khai hộ phải nằm trong phạm vi đợt thu, y như lúc xác nhận.
async function nguoiTrongDot(env, round, memberId) {
  return round.scope === 'class'
    ? env.DB.prepare('SELECT id, full_name, group_id FROM members WHERE id = ? AND cohort_id = ? AND is_active = 1')
        .bind(memberId, round.cohort_id).first()
    : env.DB.prepare('SELECT id, full_name, group_id FROM members WHERE id = ? AND group_id = ? AND is_active = 1')
        .bind(memberId, round.group_id).first();
}

export async function postDeclareFor(request, env, me, roundId, ip) {
  const round = await loadRound(env, roundId);
  if (!round || !roundAppliesTo(round, me)) return error('not_found', 404);

  const body = await readJson(request);
  const memberId = Number(body.member_id);
  if (!Number.isInteger(memberId) || memberId <= 0) return error('member_invalid', 422);
  if (memberId === me.id) return error('tu_khai_di', 422);

  const target = await nguoiTrongDot(env, round, memberId);
  if (!target) return error('member_not_in_round', 422);
  if (!(await khaiHoDuoc(env, me, round, target))) return error('forbidden', 403);

  const bo = body.bo === true;
  if (bo) {
    // Chỉ gỡ được lời khai do CHÍNH MÌNH khai hộ. Không đụng tới lời tự khai
    // của người ta, cũng không đụng tới xác nhận của người thu.
    const cu = await env.DB.prepare(
      'SELECT declared_by, verified_at FROM fund_declarations WHERE round_id = ? AND member_id = ?'
    ).bind(round.id, memberId).first();
    if (cu?.verified_at) return error('already_verified', 409);
    if (!cu?.declared_by) return error('khong_phai_khai_ho', 409);
    await env.DB.prepare('DELETE FROM fund_declarations WHERE round_id = ? AND member_id = ?')
      .bind(round.id, memberId).run();
  } else {
    await env.DB.prepare(
      `INSERT INTO fund_declarations (round_id, member_id, declared_at, note, declared_by)
       VALUES (?, ?, datetime('now'), ?, ?)
       ON CONFLICT(round_id, member_id) DO UPDATE SET
         declared_at = COALESCE(fund_declarations.declared_at, excluded.declared_at),
         note = excluded.note,
         declared_by = CASE WHEN fund_declarations.declared_at IS NULL
                            THEN excluded.declared_by ELSE fund_declarations.declared_by END`
    ).bind(round.id, memberId, cleanText(body.note, 200), me.id).run();
  }

  await logAudit(env, {
    actorId: me.id, action: bo ? 'fund.undeclare_for' : 'fund.declare_for',
    targetType: 'fund_round', targetId: round.id, after: { member_id: memberId }, ip,
  });
  // Nhật ký công khai: khai hộ ai cũng nhìn thấy, không làm lén được.
  await logActivity(env, {
    cohortId: me.cohort_id, groupId: target.group_id, actorId: me.id,
    verb: bo ? 'fund.undeclare_for' : 'fund.declare_for',
    objectType: 'fund_round', objectId: round.id,
    summary: bo ? `bỏ khai hộ cho ${target.full_name}` : `khai hộ ${target.full_name} đã chuyển "${round.title}"`,
  });
  return json({ ok: true, status_label: bo ? 'chưa khai' : LABEL_DECLARED });
}
