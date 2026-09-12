// Trợ lý KHKD — phỏng vấn và dẫn dắt học viên xây dựng Kế hoạch Kinh doanh.
// Xem migration 0038 cho lý lẽ và quyết định lệch N1/N2; xem tro-ly/prompt.js
// cho luật cứng của trợ lý; xem lib/llm.js cho đường gọi ra ngoài.
//
// Ba chốt chặn xếp theo thứ tự kiểm, CỐ Ý theo đúng thứ tự này:
//   1. Công tắc tắt trong bảng `cai_dat` — rẻ nhất, chặn được tức thì không
//      cần deploy, nên hỏi trước tiên.
//   2. Có khoá LLM chưa — thiếu thì 503, giao diện ẩn nút.
//   3. Hạn mức của người gọi — đắt hơn vì phải đếm bảng, nhưng vẫn rẻ hơn
//      một lượt gọi ra ngoài.
// Chỉ khi cả ba qua mới tiêu tiền.

import { json, error, readJson } from '../lib/http.js';
import { logActivity } from '../permissions.js';
import { cleanText } from '../lib/validate.js';
import { conQuota, ghiNhan } from '../lib/ratelimit.js';
import { llmCauHinh, goiLLM, LoiLLM } from '../lib/llm.js';
import { boiCanhNhom, loiHePhongVan, loiHeChot } from '../tro-ly/prompt.js';

const CAU_HOI_MAX = 4000;      // một lượt học viên gõ vào
const BAN_THAO_MAX = 8000;     // trùng NOI_DUNG_MAX của links.content_md

async function caiDat(env, khoa, macDinh) {
  const row = await env.DB.prepare('SELECT gia_tri FROM cai_dat WHERE khoa = ?').bind(khoa).first();
  return row?.gia_tri ?? macDinh;
}

// Gộp ba câu hỏi "có được dùng không" vào một chỗ để mọi route hỏi cùng một
// cách — tách ra thì sẽ có route quên kiểm công tắc tắt.
async function congTacVaKhoa(env) {
  if ((await caiDat(env, 'tro_ly_bat', '1')) !== '1') {
    return error('tro_ly_da_tat', 503);
  }
  if (!llmCauHinh(env)) return error('tro_ly_chua_cau_hinh', 503);
  return null;
}

// Trần lượt mỗi người mỗi NGÀY. Khoá theo member_id chứ không theo IP: cả lớp
// ngồi chung WiFi hội trường là chuyện thường xuyên ở đây (bài học 27/8), khoá
// theo IP thì người thứ hai trong phòng đã hết lượt.
async function conLuot(env, me) {
  const tran = Number(await caiDat(env, 'tro_ly_luot_moi_nguoi_moi_ngay', '40'));
  return conQuota(env, 'tro_ly', `m${me.id}`, tran, '-1 day');
}

/* ══ Đọc bối cảnh nhóm ════════════════════════════════════════════════════
   Một truy vấn cho tám phần, một cho tư liệu gắn vào phần — cùng khuôn
   getPlan() (routes/plan.js), lọc theo plan của CHÍNH nhóm người gọi nên N6
   được giữ ngay ở tầng truy vấn, không phải lọc lại ở JS. */
async function docBoiCanh(env, me, ordDangBan) {
  const plan = await env.DB.prepare(
    'SELECT id, topic_product, topic_customers FROM plans WHERE group_id = ?'
  ).bind(me.group_id).first();
  const nhom = await env.DB.prepare('SELECT no, label FROM groups WHERE id = ?')
    .bind(me.group_id).first();
  if (!plan) return { plan: null, nhom, phans: [] };

  const [phanRes, tuLieuRes] = await Promise.all([
    env.DB.prepare(
      'SELECT id, ord, title, requirement, pct, note FROM plan_sections WHERE plan_id = ? ORDER BY ord'
    ).bind(plan.id).all(),
    env.DB.prepare(
      `SELECT l.section_id, l.title, l.content_md FROM links l
         JOIN plan_sections ps ON ps.id = l.section_id
        WHERE ps.plan_id = ? AND l.removed_at IS NULL AND l.content_md IS NOT NULL
        ORDER BY l.created_at`
    ).bind(plan.id).all(),
  ]);

  const theoPhan = new Map();
  for (const r of tuLieuRes.results ?? []) {
    if (!theoPhan.has(r.section_id)) theoPhan.set(r.section_id, []);
    theoPhan.get(r.section_id).push(r);
  }
  const phans = (phanRes.results ?? []).map(p => ({ ...p, tu_lieu: theoPhan.get(p.id) ?? [] }));
  return { plan, nhom, phans, ordDangBan };
}

// Giai đoạn tự nhận ra từ dữ liệu, KHÔNG bắt học viên tự khai mình đang ở đâu.
// Đây là điều Ngô Phú Cường yêu cầu: trợ lý dẫn dắt TỪ Ý TƯỞNG, nên khi nhóm
// còn chưa có đề tài thì nó phải biết mà bắt đầu từ đó thay vì hỏi về phần 5.
function nhanGiaiDoan({ plan, phans }, sectionId) {
  const coDeTai = !!(plan?.topic_product?.trim() || plan?.topic_customers?.trim());
  if (!coDeTai) return 'de_tai';
  if (sectionId) return 'viet_phan';
  const tb = phans.length ? phans.reduce((s, p) => s + (p.pct || 0), 0) / phans.length : 0;
  return tb >= 70 ? 'phan_bien' : 'viet_phan';
}

const LOI_MO = {
  de_tai: 'Nhóm tôi chưa chốt đề tài. Hãy dẫn tôi chọn đề tài phù hợp.',
  phan_bien: 'Hãy đóng vai hội đồng và bắt đầu hỏi phản biện bài của nhóm tôi.',
};
const loiMoPhan = ten =>
  `Hãy soi phần "${ten}" của nhóm tôi theo sáu cổng kiểm soát, rồi bắt đầu phỏng vấn tôi để lấp các khoảng trống.`;

// Mọi lượt gọi LLM đi qua đây để chỗ hỏng luôn nói được HỎNG Ở BƯỚC NÀO —
// sandbox không gọi được ra internet nên bản thật là nơi duy nhất biết sự
// thật, và `hong_o_buoc` là con mắt duy nhất (đúng bài học của đường gửi thư).
async function goi(env, he, tin) {
  try {
    return { kq: await goiLLM(env, { he, tin }) };
  } catch (err) {
    if (err instanceof LoiLLM) {
      console.error('tro-ly LLM:', err.buoc, err.message);
      return { loi: error('tro_ly_loi', 502, { hong_o_buoc: err.buoc }) };
    }
    throw err;
  }
}

async function ghiTin(env, phienId, vai, noiDung) {
  await env.DB.prepare(
    'INSERT INTO tro_ly_tin (phien_id, vai, noi_dung, created_at) VALUES (?, ?, ?, datetime(\'now\'))'
  ).bind(phienId, vai, noiDung).run();
}

async function docTin(env, phienId) {
  const r = await env.DB.prepare(
    'SELECT vai, noi_dung FROM tro_ly_tin WHERE phien_id = ? ORDER BY id'
  ).bind(phienId).all();
  return r.results ?? [];
}

// Phiên của nhóm KHÁC trả 404 chứ không phải 403 — quy ước 6 CLAUDE.md, 403
// là xác nhận id đó có thật.
async function docPhien(env, me, id) {
  return env.DB.prepare(
    `SELECT p.*, ps.ord AS section_ord, ps.title AS section_title
       FROM tro_ly_phien p
       LEFT JOIN plan_sections ps ON ps.id = p.section_id
      WHERE p.id = ? AND p.group_id = ?`
  ).bind(id, me.group_id).first();
}

/* ══ GET /api/tro-ly ══════════════════════════════════════════════════════ */
export async function getTroLy(env, me) {
  const bat = (await caiDat(env, 'tro_ly_bat', '1')) === '1' && !!llmCauHinh(env);
  const phien = await env.DB.prepare(
    `SELECT p.id, p.tieu_de, p.trang_thai, p.so_luot, p.giai_doan, p.updated_at,
            ps.ord AS section_ord, ps.title AS section_title, m.full_name AS mo_boi_ten
       FROM tro_ly_phien p
       LEFT JOIN plan_sections ps ON ps.id = p.section_id
       LEFT JOIN members m ON m.id = p.mo_boi
      WHERE p.group_id = ? ORDER BY p.updated_at DESC LIMIT 30`
  ).bind(me.group_id).all();

  return json({
    bat,
    con_luot: bat ? await conLuot(env, me) : false,
    phien: phien.results ?? [],
  });
}

/* ══ POST /api/tro-ly/phien — mở phiên và chạy luôn lượt đầu ══════════════ */
export async function postPhien(request, env, me, ip) {
  const chan = await congTacVaKhoa(env);
  if (chan) return chan;
  if (!(await conLuot(env, me))) return error('het_luot_hom_nay', 429);

  const body = await readJson(request);
  let section = null;
  if (body.section_id !== undefined && body.section_id !== null && body.section_id !== '') {
    const sid = Number(body.section_id);
    if (!Number.isInteger(sid) || sid <= 0) return error('section_invalid', 422);
    // Chốt N6: phần bài phải thuộc ĐÚNG NHÓM người gọi — mỗi nhóm giữ một bộ
    // tám dòng RIÊNG (xem mục "Tư liệu gắn vào PHẦN BÀI" trong CLAUDE.md).
    section = await env.DB.prepare(
      `SELECT ps.id, ps.ord, ps.title FROM plan_sections ps
         JOIN plans p ON p.id = ps.plan_id
        WHERE ps.id = ? AND p.group_id = ?`
    ).bind(sid, me.group_id).first();
    if (!section) return error('not_found', 404);
  }

  const bc = await docBoiCanh(env, me, section?.ord ?? null);
  const giaiDoan = nhanGiaiDoan(bc, section?.id ?? null);
  const loiMo = section ? loiMoPhan(section.title) : (LOI_MO[giaiDoan] ?? LOI_MO.de_tai);

  const he = loiHePhongVan({
    giaiDoan,
    boiCanh: boiCanhNhom(bc),
    ordDangBan: section?.ord ?? null,
  });
  const { kq, loi } = await goi(env, he, [{ vai: 'nguoi', noi_dung: loiMo }]);
  if (loi) return loi;

  await ghiNhan(env, 'tro_ly', `m${me.id}`);

  const tieuDe = section ? `Phần ${section.ord + 1}. ${section.title}`
    : (giaiDoan === 'de_tai' ? 'Chọn đề tài' : 'Tập phản biện');
  const phien = await env.DB.prepare(
    `INSERT INTO tro_ly_phien (group_id, section_id, mo_boi, tieu_de, giai_doan,
                               so_luot, token_vao, token_ra, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 1, ?, ?, datetime('now'), datetime('now')) RETURNING id`
  ).bind(me.group_id, section?.id ?? null, me.id, tieuDe, giaiDoan, kq.token_vao, kq.token_ra).first();

  await ghiTin(env, phien.id, 'nguoi', loiMo);
  await ghiTin(env, phien.id, 'tro_ly', kq.tra_loi);

  await logActivity(env, {
    cohortId: me.cohort_id, groupId: me.group_id, actorId: me.id,
    verb: 'tro_ly.phien', objectType: 'tro_ly_phien', objectId: phien.id,
    summary: `mở phiên hỏi trợ lý: ${tieuDe}`,
  });

  return json({
    ok: true, id: phien.id, tieu_de: tieuDe, giai_doan: giaiDoan,
    section_id: section?.id ?? null, section_ord: section?.ord ?? null,
    tin: [{ vai: 'nguoi', noi_dung: loiMo }, { vai: 'tro_ly', noi_dung: kq.tra_loi }],
  });
}

/* ══ GET /api/tro-ly/phien/:id ════════════════════════════════════════════ */
export async function getPhien(env, me, id) {
  const p = await docPhien(env, me, id);
  if (!p) return error('not_found', 404);
  return json({
    id: p.id, tieu_de: p.tieu_de, giai_doan: p.giai_doan, trang_thai: p.trang_thai,
    so_luot: p.so_luot, section_id: p.section_id, section_ord: p.section_ord,
    tin: await docTin(env, id),
  });
}

/* ══ POST /api/tro-ly/phien/:id/hoi ═══════════════════════════════════════ */
export async function postHoi(request, env, me, id, ip) {
  const chan = await congTacVaKhoa(env);
  if (chan) return chan;

  const p = await docPhien(env, me, id);
  if (!p) return error('not_found', 404);
  if (p.trang_thai !== 'dang_mo') return error('phien_da_dong', 409);

  const tranPhien = Number(await caiDat(env, 'tro_ly_luot_moi_phien', '30'));
  if (p.so_luot >= tranPhien) return error('phien_qua_dai', 409, { tran: tranPhien });
  if (!(await conLuot(env, me))) return error('het_luot_hom_nay', 429);

  const body = await readJson(request);
  const cauHoi = cleanText(body.noi_dung, CAU_HOI_MAX);
  if (!cauHoi) return error('noi_dung_required', 422);

  const bc = await docBoiCanh(env, me, p.section_ord ?? null);
  const he = loiHePhongVan({
    giaiDoan: p.giai_doan || 'viet_phan',
    boiCanh: boiCanhNhom(bc),
    ordDangBan: p.section_ord ?? null,
  });

  const lichSu = await docTin(env, id);
  const { kq, loi } = await goi(env, he, [...lichSu, { vai: 'nguoi', noi_dung: cauHoi }]);
  if (loi) return loi;

  await ghiNhan(env, 'tro_ly', `m${me.id}`);
  await ghiTin(env, id, 'nguoi', cauHoi);
  await ghiTin(env, id, 'tro_ly', kq.tra_loi);
  await env.DB.prepare(
    `UPDATE tro_ly_phien
        SET so_luot = so_luot + 1, token_vao = token_vao + ?, token_ra = token_ra + ?,
            updated_at = datetime('now')
      WHERE id = ?`
  ).bind(kq.token_vao, kq.token_ra, id).run();

  return json({ ok: true, tra_loi: kq.tra_loi, so_luot: p.so_luot + 1, tran: tranPhien });
}

/* ══ POST /api/tro-ly/phien/:id/chot ══════════════════════════════════════
   Dựng bản thảo từ chính câu trả lời của học viên rồi ghi thành một GHI CHÚ
   gắn vào phần bài (links kind='TEXT', section_id) — KHÔNG ghi vào
   plan_sections.note, vì cột ấy chỉ chứa 500 ký tự và mang nghĩa "ghi chú
   tiến độ", không phải chỗ để một bản thảo. Ghi chú thì có sẵn 8.000 ký tự,
   hiện ngay ở tab Bài dưới huy hiệu 📎, sửa được bằng thanh B/I đã có. */
export async function postChot(env, me, id, ip) {
  const chan = await congTacVaKhoa(env);
  if (chan) return chan;

  const p = await docPhien(env, me, id);
  if (!p) return error('not_found', 404);
  if (!p.section_id) return error('phien_khong_gan_phan', 422);
  if (!(await conLuot(env, me))) return error('het_luot_hom_nay', 429);

  const bc = await docBoiCanh(env, me, p.section_ord ?? null);
  const he = loiHeChot({ boiCanh: boiCanhNhom(bc), ordDangBan: p.section_ord ?? null });

  const lichSu = await docTin(env, id);
  const { kq, loi } = await goi(env, he, [
    ...lichSu,
    { vai: 'nguoi', noi_dung: 'Dựng giúp tôi bản thảo phần này từ những gì tôi đã trả lời ở trên.' },
  ]);
  if (loi) return loi;

  await ghiNhan(env, 'tro_ly', `m${me.id}`);
  const banThao = kq.tra_loi.slice(0, BAN_THAO_MAX);
  const ngay = new Date().toISOString().slice(0, 10);
  const tieuDe = `Bản thảo ${p.tieu_de} — phiên hỏi đáp ${ngay}`;

  const link = await env.DB.prepare(
    `INSERT INTO links (cohort_id, scope, group_id, section_id, url, title, kind, tag,
                        content_md, created_by, created_at)
     VALUES (?, 'group', ?, ?, NULL, ?, 'TEXT', 'bai', ?, ?, datetime('now')) RETURNING id`
  ).bind(me.cohort_id, me.group_id, p.section_id, tieuDe, banThao, me.id).first();

  await env.DB.prepare(
    `UPDATE tro_ly_phien SET token_vao = token_vao + ?, token_ra = token_ra + ?,
            updated_at = datetime('now') WHERE id = ?`
  ).bind(kq.token_vao, kq.token_ra, id).run();

  await logActivity(env, {
    cohortId: me.cohort_id, groupId: me.group_id, actorId: me.id,
    verb: 'tro_ly.chot', objectType: 'link', objectId: link.id,
    summary: `chốt bản thảo ${p.tieu_de} từ phiên hỏi trợ lý`,
  });

  return json({ ok: true, link_id: link.id, tieu_de: tieuDe, noi_dung: banThao });
}

/* ══ POST /api/tro-ly/phien/:id/dong ══════════════════════════════════════ */
export async function postDong(env, me, id) {
  const p = await docPhien(env, me, id);
  if (!p) return error('not_found', 404);
  await env.DB.prepare(
    "UPDATE tro_ly_phien SET trang_thai = 'da_dong', updated_at = datetime('now') WHERE id = ?"
  ).bind(id).run();
  return json({ ok: true });
}
