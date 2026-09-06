import { json, error, readJson } from '../lib/http.js';
import { logAudit } from '../permissions.js';
import { cleanText } from '../lib/validate.js';
import { NGANH, nganhRaChuoi } from '../lib/nganh.js';
import { xepGoiY } from '../lib/ghep.js';

/* ══ Giao thương — danh mục "bán gì, bán cho ai" của cả lớp ═════════════════
   Ngô Phú Cường quyết 5/9: đây là thứ giá trị còn lại sau khi khoá học kết
   thúc, nên nó CỐ Ý không bị N6 chặn. Lý lẽ và phạm vi khoanh vùng ghi đầy đủ
   ở migrations/0016_giao_thuong.sql — đọc ở đó trước khi sửa file này.

   Ba đường, ba mức lộ khác nhau, đừng lẫn:

     GET  /api/giao-thuong           phiên  → cả 134 người, kèm liên hệ
     PUT  /api/me/giao-thuong        phiên  → CHỈ sửa gian hàng của chính mình
     GET  /api/giao-thuong/cong-khai KHÔNG  → chỉ ai đã tự bật, liên hệ tuỳ chọn
   ══════════════════════════════════════════════════════════════════════════ */

const KHOA_CONG_KHAI = 'K03';   // đường công khai không nhận tham số chọn khoá

// "Có gian hàng" = đã nói được mình bán gì, giúp được gì, đang cần gì, hoặc
// có đôi lời giới thiệu. CỐ Ý không tính riêng sells_to: "bán cho ai" mà
// không nói bán gì thì người đọc không làm gì được với dòng ấy.
const CO_GIAN_HANG = `(
  COALESCE(TRIM(mp.sells_what), '') <> '' OR
  COALESCE(TRIM(mp.offers), '')     <> '' OR
  COALESCE(TRIM(mp.needs), '')      <> '' OR
  COALESCE(TRIM(mp.mo_ta), '')      <> ''
)`;

function tachNganh(s) {
  return String(s ?? '').split(',').map(x => x.trim()).filter(Boolean);
}

/* ── Trong lớp: đã đăng nhập thì xem được hết ─────────────────────────────
   Không lọc theo group_id — đó chính là điểm của màn này. Vẫn khoá theo
   cohort_id: khoá K04 về sau không được lẫn vào danh mục của K03. */
export async function getGiaoThuong(env, me) {
  const rows = await env.DB.prepare(
    `SELECT m.id, m.full_name, m.title, m.company, m.phone, m.email,
            g.no AS group_no,
            mp.sells_what, mp.sells_to, mp.needs, mp.offers,
            mp.nganh, mp.mo_ta, mp.website, mp.cong_khai, mp.hien_lien_he
       FROM members m
       LEFT JOIN groups g ON g.id = m.group_id
       LEFT JOIN member_profile mp ON mp.member_id = m.id
      WHERE m.cohort_id = ? AND m.is_active = 1
      ORDER BY m.full_name COLLATE NOCASE`
  ).bind(me.cohort_id).all();

  const tatCa = rows.results ?? [];
  const co = tatCa.filter(r =>
    [r.sells_what, r.offers, r.needs, r.mo_ta].some(x => (x ?? '').trim() !== ''));

  const toiTho = tatCa.find(r => r.id === me.id) ?? null;
  // Gợi ý tính ở máy chủ, một lần — lý do ghi đầy đủ ở lib/ghep.js. Người
  // chưa điền gì thì không ghép được với ai: đưa mảng rỗng chứ không đưa
  // danh sách ngẫu nhiên, vì gợi ý sai một lần là mất lòng tin cả tính năng.
  const goiY = toiTho && [toiTho.sells_what, toiTho.offers, toiTho.needs, toiTho.mo_ta]
    .some(x => (x ?? '').trim() !== '')
    ? xepGoiY(toiTho, co)
    : [];

  return json({
    nganh_list: NGANH,
    // Con số này là lời mời điền, không phải lời trách: giao diện dùng nó để
    // nói "còn N người chưa mở gian hàng" chứ không nêu tên ai.
    chua_mo: tatCa.length - co.length,
    goi_y: goiY,
    toi: toiTho ? gianHangCuaToi(toiTho) : null,
    nguoi: co.map(r => ({
      id: r.id,
      full_name: r.full_name,
      title: r.title,
      company: r.company,
      group_no: r.group_no ?? null,
      // Trong lớp thì hiện liên hệ không cần xin phép: danh sách lớp kèm số
      // điện thoại vốn đã lưu hành, và người ta tới lớp để quen nhau.
      phone: r.phone,
      email: r.email,
      nganh: tachNganh(r.nganh),
      sells_what: r.sells_what,
      sells_to: r.sells_to,
      needs: r.needs,
      offers: r.offers,
      mo_ta: r.mo_ta,
      website: r.website,
      cong_khai: r.cong_khai ? 1 : 0,
    })),
  });
}

function gianHangCuaToi(r) {
  return {
    id: r.id,
    sells_what: r.sells_what, sells_to: r.sells_to,
    needs: r.needs, offers: r.offers,
    nganh: tachNganh(r.nganh),
    mo_ta: r.mo_ta, website: r.website,
    cong_khai: r.cong_khai ? 1 : 0,
    hien_lien_he: r.hien_lien_he ? 1 : 0,
    // Giao diện in lại đúng hai thứ này ở màn xem trước. Người ta phải NHÌN
    // THẤY cái sắp ra internet trước khi bấm bật, không phải đọc mô tả về nó.
    phone: r.phone, email: r.email,
  };
}

/* ── Tự sửa gian hàng của mình ────────────────────────────────────────────
   Không nhận targetId: đây là đường duy nhất trong ứng dụng KHÔNG cho sửa
   hộ. Sửa hộ chức vụ hay số điện thoại thì cùng lắm là sai một dòng trong
   nhóm; bật công khai hộ là đẩy tên, nơi làm việc và có thể cả số điện thoại
   của người khác ra internet — và Google đã lấy về thì gỡ khỏi D1 không gỡ
   được khỏi kết quả tìm kiếm. Bốn ô cũ vẫn sửa hộ được ở tab Nhóm như trước;
   riêng ba trường mới và hai công tắc thì chỉ chính chủ. */
export async function putGianHang(request, env, me, ip) {
  const body = await readJson(request);

  const website = cleanText(body.website, 300);
  // Cùng luật với Tư liệu (routes/links.js): chỉ https. Không phải để làm khó
  // — đây là chuỗi sẽ nằm trong href của một thẻ <a>, mà 'javascript:' thì
  // esc() không cứu được (nó không chứa ký tự HTML nào để thoát).
  if (website && !/^https:\/\/[^\s/]+\./i.test(website)) {
    return error('website_must_be_https', 422);
  }

  const dat = {
    sells_what: cleanText(body.sells_what, 80),
    sells_to: cleanText(body.sells_to, 80),
    needs: cleanText(body.needs, 80),
    offers: cleanText(body.offers, 80),
    nganh: nganhRaChuoi(body.nganh),
    mo_ta: cleanText(body.mo_ta, 300),
    website,
    cong_khai: body.cong_khai ? 1 : 0,
    hien_lien_he: body.hien_lien_he ? 1 : 0,
  };

  const truoc = await env.DB.prepare(
    'SELECT cong_khai, hien_lien_he FROM member_profile WHERE member_id = ?'
  ).bind(me.id).first();

  await env.DB.prepare(
    `INSERT INTO member_profile
       (member_id, sells_what, sells_to, needs, offers, nganh, mo_ta, website,
        cong_khai, cong_khai_luc, hien_lien_he, updated_at, updated_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?,
             CASE WHEN ? = 1 THEN datetime('now') ELSE NULL END,
             ?, datetime('now'), ?)
     ON CONFLICT(member_id) DO UPDATE SET
       sells_what = excluded.sells_what, sells_to = excluded.sells_to,
       needs = excluded.needs, offers = excluded.offers,
       nganh = excluded.nganh, mo_ta = excluded.mo_ta, website = excluded.website,
       cong_khai = excluded.cong_khai,
       -- Giữ nguyên mốc bật cũ khi vẫn đang bật: sửa lại mô tả không phải là
       -- bật lại từ đầu. Tắt thì xoá mốc, bật lần nữa thì ghi mốc mới.
       cong_khai_luc = CASE
         WHEN excluded.cong_khai = 0 THEN NULL
         WHEN member_profile.cong_khai = 1 THEN member_profile.cong_khai_luc
         ELSE datetime('now') END,
       hien_lien_he = excluded.hien_lien_he,
       updated_at = excluded.updated_at, updated_by = excluded.updated_by`
  ).bind(
    me.id, dat.sells_what, dat.sells_to, dat.needs, dat.offers,
    dat.nganh, dat.mo_ta, dat.website,
    dat.cong_khai, dat.cong_khai, dat.hien_lien_he, me.id
  ).run();

  // Chỉ ghi nhật ký khi mức lộ ĐỔI, không ghi mỗi lần sửa câu chữ. Đây là hai
  // hành động cần lần lại được về sau ("ai đưa số của tôi lên internet?" —
  // câu trả lời phải là chính người ấy, và phải có bằng chứng).
  const doiMuc = !truoc
    ? dat.cong_khai === 1 || dat.hien_lien_he === 1
    : (truoc.cong_khai ?? 0) !== dat.cong_khai || (truoc.hien_lien_he ?? 0) !== dat.hien_lien_he;
  if (doiMuc) {
    await logAudit(env, {
      actorId: me.id, action: 'giaothuong.muc_lo', targetType: 'member_profile', targetId: me.id,
      before: truoc ? { cong_khai: truoc.cong_khai, hien_lien_he: truoc.hien_lien_he } : null,
      after: { cong_khai: dat.cong_khai, hien_lien_he: dat.hien_lien_he }, ip,
    });
  }

  return json({ ok: true, cong_khai: dat.cong_khai, hien_lien_he: dat.hien_lien_he });
}

/* ── Công khai: KHÔNG cần đăng nhập ───────────────────────────────────────
   Đây là đường duy nhất trong ứng dụng đưa dữ liệu người dùng ra internet,
   nên ba chốt phải đứng cùng lúc và không chốt nào tự báo lỗi khi hỏng:

     1. cong_khai = 1  — chính chủ đã tự bật. Mặc định của cột là 0.
     2. is_active = 1  — người đã ngừng tham gia biến mất khỏi trang ngay.
     3. Liên hệ chỉ ra khi hien_lien_he = 1, quyết định riêng với (1).

   Và dựng phúc đáp bằng cách LIỆT KÊ TỪNG TRƯỜNG, không trải cả dòng — thêm
   cột vào member_profile về sau sẽ không lặng lẽ lọt ra công khai. Đúng bài
   học đã ghi cho /api/lich/cong-khai.

   CỐ Ý không trả group_no: nhóm là đơn vị làm bài tập, không phải đơn vị
   kinh doanh, và người ngoài lớp không có gì để làm với con số ấy. */
export async function getGiaoThuongCongKhai(env) {
  const khoa = await env.DB.prepare(
    'SELECT id, code, name FROM cohorts WHERE code = ?'
  ).bind(KHOA_CONG_KHAI).first();
  if (!khoa) return error('not_found', 404);

  const rows = await env.DB.prepare(
    `SELECT m.id, m.full_name, m.title, m.company, m.phone, m.email,
            mp.sells_what, mp.sells_to, mp.needs, mp.offers,
            mp.nganh, mp.mo_ta, mp.website, mp.hien_lien_he
       FROM member_profile mp
       JOIN members m ON m.id = mp.member_id
      WHERE mp.cong_khai = 1 AND m.is_active = 1 AND m.cohort_id = ?
        AND ${CO_GIAN_HANG}
      ORDER BY m.full_name COLLATE NOCASE`
  ).bind(khoa.id).all();

  return json({
    khoa: { code: khoa.code, name: khoa.name },
    nganh_list: NGANH,
    nguoi: (rows.results ?? []).map(r => ({
      id: r.id,
      full_name: r.full_name,
      title: r.title,
      company: r.company,
      nganh: tachNganh(r.nganh),
      sells_what: r.sells_what,
      sells_to: r.sells_to,
      needs: r.needs,
      offers: r.offers,
      mo_ta: r.mo_ta,
      website: r.website,
      // Hai trường này là cả lý do phải có công tắc thứ hai. Sai ở đây là rò
      // số điện thoại ra internet, và không có phép kiểm nào tự kêu lên.
      phone: r.hien_lien_he ? r.phone : null,
      email: r.hien_lien_he ? r.email : null,
    })),
  }, 200, { 'Cache-Control': 'public, max-age=60' });
}
