import { json, error, readJson } from '../lib/http.js';
import { isClassCommittee, logAudit } from '../permissions.js';
import { cleanText } from '../lib/validate.js';

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

export async function getLich(env, me) {
  const [lich, tb] = await Promise.all([
    env.DB.prepare(
      `SELECT id, ngay, tu_gio, den_gio, chu_de, giang_vien, ghi_chu, huy_luc
         FROM lich_hoc WHERE cohort_id = ?
        ORDER BY ngay, COALESCE(tu_gio, '00:00')`
    ).bind(me.cohort_id).all(),
    env.DB.prepare(
      `SELECT id, noi_dung, nguon, het_han FROM thong_bao WHERE cohort_id = ?
        ORDER BY id DESC`
    ).bind(me.cohort_id).all(),
  ]);
  return json({
    lich_hoc: lich.results ?? [],
    thong_bao: tb.results ?? [],
    can_sua: await phaiLaBanCanSu(env, me),
  });
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

export async function postThongBao(request, env, me, ip) {
  if (!(await phaiLaBanCanSu(env, me))) return error('forbidden', 403);
  const body = await readJson(request);
  const noiDung = cleanText(body.noi_dung, 1000);
  if (!noiDung) return error('noi_dung_required', 422);
  const hetHan = cleanText(body.het_han, 10);
  if (hetHan && !ngayHopLe(hetHan)) return error('ngay_invalid', 422);

  const row = await env.DB.prepare(
    `INSERT INTO thong_bao (cohort_id, noi_dung, nguon, het_han, created_by)
     VALUES (?, ?, ?, ?, ?) RETURNING id`
  ).bind(me.cohort_id, noiDung, cleanText(body.nguon, 60), hetHan || null, me.id).first();

  await logAudit(env, {
    actorId: me.id, action: 'thongbao.create', targetType: 'thong_bao', targetId: row.id, ip,
  });
  return json({ ok: true, id: row.id });
}

export async function deleteThongBao(env, me, id, ip) {
  if (!(await phaiLaBanCanSu(env, me))) return error('forbidden', 403);
  const cu = await env.DB.prepare('SELECT * FROM thong_bao WHERE id = ? AND cohort_id = ?')
    .bind(id, me.cohort_id).first();
  if (!cu) return error('not_found', 404);
  await env.DB.prepare('DELETE FROM thong_bao WHERE id = ?').bind(id).run();
  await logAudit(env, {
    actorId: me.id, action: 'thongbao.delete', targetType: 'thong_bao', targetId: id, ip,
  });
  return json({ ok: true });
}
