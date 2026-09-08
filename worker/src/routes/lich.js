import { json, error, readJson } from '../lib/http.js';
import { isClassCommittee, isGroupOfficer, logAudit, logActivity } from '../permissions.js';
import { cleanText } from '../lib/validate.js';
import { guiThongBaoDay } from './push.js';
import { dungIcs, mocSqlite } from '../lib/ics.js';
import { chonNguoiNhanMail, guiThongBaoMail } from './thong-bao-mail.js';

// Lịch học và thông báo của lớp. Đọc thì ai cũng đọc được — đây là thứ cả 134
// người cần. Ghi thì chỉ Ban cán sự lớp, vì lịch sai một ngày là cả lớp đi
// nhầm buổi.
//
// KHÔNG phải điểm danh và cũng không phải chỗ chat (nguyên tắc N1): chỉ là bản
// lịch để chốt lại thứ mà Zalo làm trôi mất sau hai ngày.

// 'YYYY-MM-DD' — kiểm khuôn ở đây để một ngày gõ sai không lặng lẽ nằm trong
// bảng rồi biến mất khỏi màn hình vì so sánh chuỗi không khớp.
function ngayHopLe(s) {
  return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
}
// 'HH:MM' hoặc trống.
function gioHopLe(s) {
  return s == null || s === '' || (typeof s === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(s));
}

async function phaiLaBanCanSu(env, me) {
  return isClassCommittee(env, me.id);
}

/* ══ Lịch công khai — KHÔNG cần đăng nhập ═══════════════════════════════════
   Vì sao mở: lịch học không phải bí mật, Ban tổ chức đã gửi cho cả 134 người
   trên Zalo rồi. Nhưng muốn xem trong ứng dụng thì phải qua năm bước đăng
   nhập — người hoài nghi bỏ cuộc ở bước hai. Trang công khai đảo ngược phễu:
   nhận được thứ mình cần TRƯỚC khi bị hỏi bất cứ điều gì.

   N6 vẫn nguyên vẹn: chỉ trả lich_hoc và vài trường của cohorts. TUYỆT ĐỐI
   không kèm thong_bao ở đây — thông báo có loại nội bộ của từng nhóm, lọt ra
   đường công khai là hỏng nguyên tắc cách ly mà không chỗ nào báo lỗi.

   Không đặt giới hạn tần suất: allow() tốn một SELECT cộng một INSERT, đắt hơn
   chính truy vấn cần bảo vệ (13 dòng, một chỉ mục). Với 134 người thì tải này
   không đáng kể. Bao giờ có dấu hiệu bị lạm dụng thì dùng Cache API, đừng
   dùng rate limit.

   Khoá cứng vào K03: đường công khai thì không được nhận tham số chọn khoá.
   ══════════════════════════════════════════════════════════════════════════ */
const KHOA_CONG_KHAI = 'K03';

async function docLichCongKhai(env) {
  const khoa = await env.DB.prepare(
    'SELECT id, code, name, defense_on, sessions_total FROM cohorts WHERE code = ?'
  ).bind(KHOA_CONG_KHAI).first();
  if (!khoa) return null;

  const lich = await env.DB.prepare(
    `SELECT id, ngay, tu_gio, den_gio, chu_de, giang_vien, ghi_chu, huy_luc,
            CAST(strftime('%s', COALESCE(updated_at, created_at)) AS INTEGER) AS seq,
            -- CHỈ ĐẾM. Ngô Phú Cường quyết 26/8: đường dẫn tài liệu chỉ hiện
            -- sau khi đăng nhập. Con số thì nói được "có thứ đáng lấy ở đây"
            -- mà không đưa gì ra cho người ngoài lớp.
            --
            -- Chỉ đếm tư liệu của LỚP: tư liệu của nhóm là dữ liệu nhóm (N6),
            -- và một con số đổi theo người xem thì vô nghĩa trên trang mà ai
            -- cũng thấy cùng một bản.
            --
            -- Đếm cả url lẫn content_md (ghi chú Text, migration 0025): trước
            -- kia chỉ đếm url, nên một ghi chú Text của lớp sẽ không được tính
            -- — con số nói "chưa có gì" trong khi rõ ràng có.
            (SELECT COUNT(*) FROM links l
              WHERE l.buoi_id = lich_hoc.id AND l.removed_at IS NULL
                AND l.scope = 'class'
                AND (l.url IS NOT NULL OR l.content_md IS NOT NULL)) AS so_tu_lieu
       FROM lich_hoc WHERE cohort_id = ?
      ORDER BY ngay, COALESCE(tu_gio, '00:00')`
  ).bind(khoa.id).all();

  return { khoa, buoi: lich.results ?? [] };
}

export async function getLichCongKhai(env) {
  const d = await docLichCongKhai(env);
  if (!d) return error('not_found', 404);
  // hom_nay do SQLite sinh, không lấy từ máy khách: điện thoại đặt sai ngày
  // thì cả trang tô nhầm buổi (quy ước 1 CLAUDE.md).
  const nay = await env.DB.prepare("SELECT date('now', '+7 hours') AS d").first();
  return json({
    khoa: {
      code: d.khoa.code, name: d.khoa.name,
      defense_on: d.khoa.defense_on, sessions_total: d.khoa.sessions_total,
    },
    hom_nay: nay?.d ?? null,
    buoi: d.buoi.map(b => ({
      id: b.id, ngay: b.ngay, tu_gio: b.tu_gio, den_gio: b.den_gio,
      chu_de: b.chu_de, giang_vien: b.giang_vien, ghi_chu: b.ghi_chu,
      da_huy: b.huy_luc ? 1 : 0,
      // Dựng danh sách trả về bằng cách LIỆT KÊ TỪNG TRƯỜNG chứ không trải cả
      // dòng: thêm cột vào lich_hoc về sau sẽ không lặng lẽ lọt ra công khai.
      so_tu_lieu: b.so_tu_lieu ?? 0,
    })),
  }, 200, { 'Cache-Control': 'public, max-age=60' });
}

export async function getLichIcs(request, env) {
  const d = await docLichCongKhai(env);
  if (!d) return error('not_found', 404);

  // DTSTAMP lấy lúc lịch đổi lần cuối, không lấy giờ máy — nhờ vậy tệp tải
  // hai lần liền cho ra nội dung y hệt, và mốc ấy vẫn do SQLite sinh.
  const moc = await env.DB.prepare(
    `SELECT MAX(COALESCE(updated_at, created_at)) AS m FROM lich_hoc WHERE cohort_id = ?`
  ).bind(d.khoa.id).first();
  const dtstamp = mocSqlite(moc?.m) ?? mocSqlite(
    (await env.DB.prepare("SELECT datetime('now') AS n").first())?.n
  );

  const host = new URL(request.url).hostname;
  const noiDung = dungIcs(d.buoi, d.khoa, dtstamp, host);

  return new Response(noiDung, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="k3vaceo-${d.khoa.code}.ics"`,
      'Cache-Control': 'public, max-age=60',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

export async function getLich(env, me) {
  const [lich, tb, tuLieu] = await Promise.all([
    env.DB.prepare(
      `SELECT id, ngay, tu_gio, den_gio, chu_de, giang_vien, ghi_chu, huy_luc
         FROM lich_hoc WHERE cohort_id = ?
        ORDER BY ngay, COALESCE(tu_gio, '00:00')`
    ).bind(me.cohort_id).all(),
    // N6: phát hiện khi thêm cột ghi_chu_id (migration 0034) — câu này THIẾU
    // điều kiện phạm vi, nên bất kỳ người đã đăng nhập nào gọi GET /api/lich
    // cũng đọc được thông báo NỘI BỘ của MỌI nhóm, không chỉ nhóm mình. Giao
    // diện không lộ ra vì layLichDayDu() (nơi duy nhất gọi route này) chỉ
    // dùng .lich_hoc, chưa từng đọc .thong_bao — nhưng quy ước 6 (CLAUDE.md)
    // là kiểm ở máy chủ, không tin giao diện. Cùng điều kiện đã dùng ở
    // /api/home và postThongBaoDaXem.
    env.DB.prepare(
      `SELECT id, noi_dung, nguon, het_han FROM thong_bao
        WHERE cohort_id = ? AND (group_id IS NULL OR group_id = ?)
        ORDER BY id DESC`
    ).bind(me.cohort_id, me.group_id).all(),
    layTuLieuTheoBuoi(env, me),
  ]);
  return json({
    lich_hoc: (lich.results ?? []).map(b => ({ ...b, tu_lieu: tuLieu.get(b.id) ?? [] })),
    thong_bao: tb.results ?? [],
    can_sua: await phaiLaBanCanSu(env, me),
  });
}

// Tư liệu đã gắn vào buổi, gom theo buổi. MỘT truy vấn cho cả khoá rồi gom
// trong JS — 13 buổi với vài chục liên kết thì rẻ hơn hẳn một truy vấn mỗi buổi.
//
// Phạm vi đọc y hệt listLinks: tư liệu của lớp thì ai cũng thấy, tư liệu của
// nhóm thì chỉ nhóm ấy (N6). Lệch điều kiện này với Tư liệu là cùng một liên
// kết hiện ở màn này mà mất ở màn kia.
export async function layTuLieuTheoBuoi(env, me) {
  const rows = await env.DB.prepare(
    `SELECT id, buoi_id, url, title, kind, scope, content_md FROM links
      WHERE buoi_id IS NOT NULL AND removed_at IS NULL
        AND cohort_id = ? AND (scope = 'class' OR group_id = ?)
      -- 'class' < 'group' theo thứ tự chữ, nên ASC là tài liệu chính của Ban tổ
      -- chức đứng trên, ghi chép riêng của nhóm xuống dưới. DESC thì ngược lại
      -- và trông như ghi chép của nhóm quan trọng hơn slide bài giảng.
      ORDER BY scope, created_at`
  ).bind(me.cohort_id, me.group_id).all();
  const theoBuoi = new Map();
  for (const r of rows.results ?? []) {
    if (!theoBuoi.has(r.buoi_id)) theoBuoi.set(r.buoi_id, []);
    theoBuoi.get(r.buoi_id).push(r);
  }
  return theoBuoi;
}

function docBuoi(body) {
  const ngay = cleanText(body.ngay, 10);
  if (!ngayHopLe(ngay)) return { loi: error('ngay_invalid', 422) };
  const tu = cleanText(body.tu_gio, 5);
  const den = cleanText(body.den_gio, 5);
  if (!gioHopLe(tu) || !gioHopLe(den)) return { loi: error('gio_invalid', 422) };
  const chuDe = cleanText(body.chu_de, 200);
  if (!chuDe) return { loi: error('chu_de_required', 422) };
  return {
    ngay, tu_gio: tu || null, den_gio: den || null, chu_de: chuDe,
    giang_vien: cleanText(body.giang_vien, 200),
    ghi_chu: cleanText(body.ghi_chu, 300),
  };
}

export async function postBuoi(request, env, me, ip) {
  if (!(await phaiLaBanCanSu(env, me))) return error('forbidden', 403);
  const b = docBuoi(await readJson(request));
  if (b.loi) return b.loi;

  const row = await env.DB.prepare(
    `INSERT INTO lich_hoc (cohort_id, ngay, tu_gio, den_gio, chu_de, giang_vien, ghi_chu, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`
  ).bind(me.cohort_id, b.ngay, b.tu_gio, b.den_gio, b.chu_de, b.giang_vien, b.ghi_chu, me.id).first();

  await logAudit(env, {
    actorId: me.id, action: 'lich.create', targetType: 'lich_hoc', targetId: row.id,
    after: { ngay: b.ngay, chu_de: b.chu_de }, ip,
  });
  return json({ ok: true, id: row.id });
}

export async function patchBuoi(request, env, me, id, ip) {
  if (!(await phaiLaBanCanSu(env, me))) return error('forbidden', 403);
  const cu = await env.DB.prepare('SELECT * FROM lich_hoc WHERE id = ? AND cohort_id = ?')
    .bind(id, me.cohort_id).first();
  if (!cu) return error('not_found', 404);

  const body = await readJson(request);
  // Huỷ buổi không xoá dòng: lịch cũ vẫn phải lần lại được khi có người hỏi
  // "hôm ấy rốt cuộc có học không".
  if ('huy' in body && Object.keys(body).length === 1) {
    await env.DB.prepare(
      `UPDATE lich_hoc SET huy_luc = CASE WHEN ? = 1 THEN datetime('now') ELSE NULL END,
         updated_at = datetime('now') WHERE id = ?`
    ).bind(body.huy ? 1 : 0, id).run();
    await logAudit(env, {
      actorId: me.id, action: body.huy ? 'lich.cancel' : 'lich.uncancel',
      targetType: 'lich_hoc', targetId: id, before: { chu_de: cu.chu_de, ngay: cu.ngay }, ip,
    });
    return json({ ok: true });
  }

  const b = docBuoi({ ...cu, ...body });
  if (b.loi) return b.loi;
  await env.DB.prepare(
    `UPDATE lich_hoc SET ngay = ?, tu_gio = ?, den_gio = ?, chu_de = ?, giang_vien = ?,
       ghi_chu = ?, updated_at = datetime('now') WHERE id = ?`
  ).bind(b.ngay, b.tu_gio, b.den_gio, b.chu_de, b.giang_vien, b.ghi_chu, id).run();

  await logAudit(env, {
    actorId: me.id, action: 'lich.update', targetType: 'lich_hoc', targetId: id,
    before: { ngay: cu.ngay, tu_gio: cu.tu_gio, chu_de: cu.chu_de },
    after: { ngay: b.ngay, tu_gio: b.tu_gio, chu_de: b.chu_de }, ip,
  });
  return json({ ok: true });
}

export async function deleteBuoi(env, me, id, ip) {
  if (!(await phaiLaBanCanSu(env, me))) return error('forbidden', 403);
  const cu = await env.DB.prepare('SELECT * FROM lich_hoc WHERE id = ? AND cohort_id = ?')
    .bind(id, me.cohort_id).first();
  if (!cu) return error('not_found', 404);
  await env.DB.prepare('DELETE FROM lich_hoc WHERE id = ?').bind(id).run();
  await logAudit(env, {
    actorId: me.id, action: 'lich.delete', targetType: 'lich_hoc', targetId: id,
    before: { ngay: cu.ngay, chu_de: cu.chu_de }, ip,
  });
  return json({ ok: true });
}

/* Ghi chú (links.kind='TEXT') mà một thông báo đính kèm — migration 0034.
   Trả { loi } nếu sai, { ghiChuId } nếu được. Cùng khuôn docBuoiId/
   docSectionId của links.js.

   CỐ Ý không hạn "chỉ ghi chú chưa gắn buổi/phần bài nào" — xem lý do đầy
   đủ trong migration 0034: ca thật nhất (Thư mời kiến tập 11/9) đã gắn sẵn
   vào một buổi, và chính vì thế mới cần thông báo trỏ tới.

   Điều kiện `(scope = 'class' OR group_id = ?)` là chốt N6: người soạn chỉ
   đính kèm được ghi chú mà CHÍNH HỌ đọc được — không thì mở khoá cho việc
   thông báo trỏ tới ghi chú riêng của nhóm khác. */
async function docGhiChuId(env, me, body) {
  if (!('ghi_chu_id' in body)) return {};
  if (body.ghi_chu_id === null || body.ghi_chu_id === '') return { ghiChuId: null };
  const id = Number(body.ghi_chu_id);
  if (!Number.isInteger(id) || id <= 0) return { loi: error('ghichu_invalid', 422) };
  const co = await env.DB.prepare(
    `SELECT id FROM links WHERE id = ? AND kind = 'TEXT' AND removed_at IS NULL
       AND cohort_id = ? AND (scope = 'class' OR group_id = ?)`
  ).bind(id, me.cohort_id, me.group_id).first();
  if (!co) return { loi: error('ghichu_not_found', 404) };
  return { ghiChuId: id };
}

// Thông báo có hai cấp, và quyền đăng khác nhau:
//   cap = 'lop'  → cả khoá đọc, chỉ Ban cán sự lớp đăng
//   cap = 'nhom' → chỉ nhóm mình đọc, trưởng/phó nhóm đăng
// Mặc định là 'nhom': đăng nhầm cho 134 người khó rút lại hơn nhiều so với
// đăng nhầm trong nhóm mình.
export async function postThongBao(request, env, me, ctx, ip) {
  const body = await readJson(request);
  const capLop = body.cap === 'lop';

  if (capLop) {
    if (!(await phaiLaBanCanSu(env, me))) return error('forbidden', 403);
  } else if (!(await isGroupOfficer(env, me.id, me.group_id))) {
    return error('forbidden', 403);
  }

  const noiDung = cleanText(body.noi_dung, 1000);
  if (!noiDung) return error('noi_dung_required', 422);
  const hetHan = cleanText(body.het_han, 10);
  if (hetHan && !ngayHopLe(hetHan)) return error('ngay_invalid', 422);
  const { loi: loiGhiChu, ghiChuId } = await docGhiChuId(env, me, body);
  if (loiGhiChu) return loiGhiChu;

  const row = await env.DB.prepare(
    `INSERT INTO thong_bao (cohort_id, group_id, noi_dung, nguon, het_han, ghi_chu_id, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id`
  ).bind(me.cohort_id, capLop ? null : me.group_id, noiDung,
         cleanText(body.nguon, 60), hetHan || null, ghiChuId ?? null, me.id).first();

  await logAudit(env, {
    actorId: me.id, action: 'thongbao.create', targetType: 'thong_bao', targetId: row.id,
    after: { cap: capLop ? 'lop' : 'nhom' }, ip,
  });
  if (!capLop) {
    await logActivity(env, {
      cohortId: me.cohort_id, groupId: me.group_id, actorId: me.id,
      verb: 'thongbao.create', objectType: 'thong_bao', objectId: row.id,
      summary: 'đăng một thông báo cho nhóm',
    });
  }

  // Đẩy thông báo cho ai đã đăng ký. Không chặn phúc đáp: người đăng không
  // phải ngồi chờ 134 lượt gọi tới máy chủ đẩy, và đẩy hỏng cũng không được
  // làm hỏng việc đăng — thông báo đã nằm trong D1, mở ứng dụng ra là thấy.
  const day = guiThongBaoDay(env, me, { id: row.id, noi_dung: noiDung, capLop });
  if (ctx?.waitUntil) ctx.waitUntil(day); else await day.catch(() => {});

  // Và gửi THƯ — đường báo tin thật sự tới được người ta lúc này. Xem
  // routes/thong-bao-mail.js: đo ngày 6/9 chỉ 2/146 người bật thông báo đẩy
  // và chưa gói tin nào từng đi, nên chờ đường đẩy là chờ một thứ chưa chạy.
  //
  // Chọn người nhận NGAY (một truy vấn có chỉ mục) để trả con số về cho người
  // đăng thấy "thư đang gửi cho N người"; việc gửi thì chạy nền như đường đẩy.
  const nguoiNhanMail = await chonNguoiNhanMail(env, me, capLop);
  const thu = guiThongBaoMail(env, me, {
    noi_dung: noiDung, capLop, nguon: cleanText(body.nguon, 60), ds: nguoiNhanMail,
  });
  if (ctx?.waitUntil) ctx.waitUntil(thu); else await thu.catch(() => {});

  return json({
    ok: true, id: row.id, cap: capLop ? 'lop' : 'nhom',
    mail: { nguoi_nhan: nguoiNhanMail.length },
  });
}

// Đánh dấu đã xem: ghi lại ID thông báo lớn nhất mà người này ĐƯỢC PHÉP thấy.
// Không nhận số từ máy khách — gửi một số to là tắt vĩnh viễn chấm đỏ của
// chính mình, và tệ hơn là bỏ lỡ thông báo thật.
//
// Không ghi mốc thời gian: datetime('now') chỉ tới giây, nên thông báo đăng
// đúng giây ấy có created_at BẰNG mốc và lọt qua phép so sánh. ID tăng đơn
// điệu nên không có chuyện bằng nhau.
export async function postThongBaoDaXem(env, me) {
  await env.DB.prepare(
    `UPDATE members SET thong_bao_xem_id = (
       SELECT COALESCE(MAX(id), 0) FROM thong_bao
        WHERE cohort_id = ? AND (group_id IS NULL OR group_id = ?)
     ) WHERE id = ?`
  ).bind(me.cohort_id, me.group_id, me.id).run();
  return json({ ok: true });
}

/* Sửa lại thông báo đã đăng (Ngô Phú Cường yêu cầu 5/9). Trước đó chỉ có gỡ
   xuống rồi đăng lại — mà làm vậy thì mất luôn "mới", chấm đỏ nổi lên lần
   nữa, và ai bật thông báo đẩy lại bị báo thêm một lần cho cùng một tin.

   Hai điều CỐ Ý không cho:
   · Đổi CẤP (nhóm ↔ lớp) — cùng lý do PATCH /api/links/:id không cho đổi
     scope: biến thông báo nội bộ của nhóm thành của cả lớp là đem việc nhóm
     cho 146 người đọc, mà nhật ký chỉ ghi "đã sửa" chứ không ai để ý (N6).
   · Gửi lại thông báo đẩy — sửa một dấu phẩy mà 134 điện thoại kêu lần nữa
     thì lần sau người ta tắt thông báo đẩy, mất luôn cả đường báo tin thật. */
export async function patchThongBao(request, env, me, id, ip) {
  // Lọc theo phạm vi ĐỌC trước, y hệt deleteThongBao: thông báo nội bộ của
  // nhóm khác phải "không tồn tại" chứ không phải "bị từ chối" — 403 là xác
  // nhận id đó có thật (N6, quy ước 6).
  const cu = await env.DB.prepare(
    `SELECT * FROM thong_bao WHERE id = ? AND cohort_id = ?
       AND (group_id IS NULL OR group_id = ?)`
  ).bind(id, me.cohort_id, me.group_id).first();
  if (!cu) return error('not_found', 404);

  const duoc = cu.group_id === null
    ? await phaiLaBanCanSu(env, me)
    : await isGroupOfficer(env, me.id, me.group_id);
  if (!duoc) return error('forbidden', 403);

  // Chỉ ghi đè trường thật sự gửi lên — gửi thiếu thì giữ nguyên, không xoá
  // trắng (cùng khuôn với patchLink và postInviteClaim).
  const body = await readJson(request);
  const noiDung = 'noi_dung' in body ? cleanText(body.noi_dung, 1000) : cu.noi_dung;
  if (!noiDung) return error('noi_dung_required', 422);
  const hetHan = 'het_han' in body ? cleanText(body.het_han, 10) : cu.het_han;
  if (hetHan && !ngayHopLe(hetHan)) return error('ngay_invalid', 422);
  const nguon = 'nguon' in body ? cleanText(body.nguon, 60) : cu.nguon;
  const { loi: loiGhiChu, ghiChuId } = await docGhiChuId(env, me, body);
  if (loiGhiChu) return loiGhiChu;
  const ghiChu = 'ghi_chu_id' in body ? ghiChuId : cu.ghi_chu_id;

  await env.DB.prepare(
    'UPDATE thong_bao SET noi_dung = ?, nguon = ?, het_han = ?, ghi_chu_id = ? WHERE id = ?'
  ).bind(noiDung, nguon, hetHan || null, ghiChu ?? null, id).run();

  await logAudit(env, {
    actorId: me.id, action: 'thongbao.edit', targetType: 'thong_bao', targetId: id,
    before: { noi_dung: cu.noi_dung, nguon: cu.nguon, het_han: cu.het_han, ghi_chu_id: cu.ghi_chu_id },
    after: { noi_dung: noiDung, nguon, het_han: hetHan || null, ghi_chu_id: ghiChu ?? null }, ip,
  });
  return json({ ok: true, id });
}

export async function deleteThongBao(env, me, id, ip) {
  // Lọc theo phạm vi ĐỌC trước: thông báo nội bộ của nhóm khác phải "không tồn
  // tại" chứ không phải "bị từ chối" — 403 là xác nhận id đó có thật (N6).
  const cu = await env.DB.prepare(
    `SELECT * FROM thong_bao WHERE id = ? AND cohort_id = ?
       AND (group_id IS NULL OR group_id = ?)`
  ).bind(id, me.cohort_id, me.group_id).first();
  if (!cu) return error('not_found', 404);

  const duoc = cu.group_id === null
    ? await phaiLaBanCanSu(env, me)
    : await isGroupOfficer(env, me.id, me.group_id);
  if (!duoc) return error('forbidden', 403);
  await env.DB.prepare('DELETE FROM thong_bao WHERE id = ?').bind(id).run();
  await logAudit(env, {
    actorId: me.id, action: 'thongbao.delete', targetType: 'thong_bao', targetId: id, ip,
  });
  return json({ ok: true });
}
