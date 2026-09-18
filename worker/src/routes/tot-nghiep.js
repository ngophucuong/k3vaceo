import { json, error, readJson } from '../lib/http.js';
import { isClassCommittee, logAudit, logActivity } from '../permissions.js';
import { cleanText } from '../lib/validate.js';
import { NGANH, nganhRaChuoi } from '../lib/nganh.js';
import { shapeRound } from './funds.js';

/* ══ Zone "Lễ tốt nghiệp" — /totnghiep ══════════════════════════════════════
   Ngô Phú Cường đưa 15 câu Ban tổ chức muốn thu để chuẩn bị Lễ tốt nghiệp
   26/9. Lý lẽ đầy đủ ở migrations/0041_dang_ky_tot_nghiep.sql — đọc ở đó
   trước khi sửa file này.

   Ba phần, BA HẠN KHÁC NHAU, nên lưu độc lập:
     A · Hồ sơ & chứng chỉ   PUT /api/totnghiep/ho-so    hạn 26/9
     B · Đề tài + link KHKD  PATCH /api/totnghiep/ban-nop hạn 26/9, của NHÓM
     C · Lễ + Gala           PUT /api/totnghiep/gala     hạn 21h00 NGÀY 19/9

   MỌI route ở đây đều CẦN PHIÊN — đăng ký trong index.js ở nửa DƯỚI dòng 164.
   Ranh giới công khai/cần-phiên của router này là VỊ TRÍ DÒNG chứ không phải
   một cờ nào, nên đặt nhầm lên nửa trên là thành công khai mà không phép kiểm
   nào kêu lên. Vì zone này chỉ dành cho học viên (Ngô Phú Cường chọn, không
   mở cho khách ngoài lớp) nên ở đây KHÔNG có route công khai nào cả.
   ═══════════════════════════════════════════════════════════════════════════ */

// Hạn đăng ký Gala theo thư mời Ban tổ chức. Giao diện dùng để nói "còn N giờ"
// chứ KHÔNG dùng để chặn: ai đăng ký muộn vẫn ghi được, và Ban cán sự lớp đọc
// mốc gala_luc để biết ai kịp ai không. Chặn cứng thì người lỡ hạn không còn
// đường nào báo là mình muốn đi, mà đó lại đúng là lúc cần biết nhất.
const HAN_GALA = '2026-09-19 21:00';
const NGAY_LE = '2026-09-26';

const DU_LE = ['co', 'khong'];
const TAI_TRO = ['tien', 'hien_vat', 'khong'];

// Một chuỗi chỉ được nhận nếu nằm trong danh sách. Giá trị lạ → null (chưa
// trả lời) chứ không phải lỗi 422: cùng lý lẽ docNganh() đã ghi — một giá trị
// thừa từ giao diện cũ còn trong đệm trình duyệt không nên làm người dùng mất
// nguyên phần vừa gõ.
const motTrong = (v, ds) => (ds.includes(String(v ?? '')) ? String(v) : null);
const coKhong = v => (v === 1 || v === true || v === '1' ? 1 : 0);

async function docDangKy(env, memberId) {
  return env.DB.prepare(
    'SELECT * FROM dang_ky_tot_nghiep WHERE member_id = ?'
  ).bind(memberId).first();
}

/* ── Màn hình chỉ gọi MỘT lượt ────────────────────────────────────────────
   Gộp sẵn mọi thứ: hồ sơ điền sẵn, danh mục ngành, đề tài + link của nhóm,
   danh sách thành viên, đợt thu phí kèm QR, và bản đăng ký đã lưu nếu có. */
export async function getTotNghiep(env, me) {
  const [dk, hoSoGoc, nhom, thanhVien, officers, dotPhi] = await Promise.all([
    docDangKy(env, me.id),
    // roster.dob là nguồn DUY NHẤT của ngày sinh — members không có cột này.
    // LEFT JOIN vì người thêm tay (không qua roster) vẫn phải mở form được.
    env.DB.prepare(
      `SELECT r.dob, mp.needs, mp.nganh, mp.mo_ta
         FROM members m
         LEFT JOIN roster r ON r.id = m.roster_id
         LEFT JOIN member_profile mp ON mp.member_id = m.id
        WHERE m.id = ?`
    ).bind(me.id).first(),
    me.group_id
      ? env.DB.prepare(
          `SELECT g.id, g.no, g.label, g.ban_nop_url, g.ban_nop_luc,
                  m.full_name AS ban_nop_boi_ten,
                  p.topic_product, p.topic_customers
             FROM groups g
             LEFT JOIN members m ON m.id = g.ban_nop_boi
             LEFT JOIN plans p ON p.group_id = g.id
            WHERE g.id = ?`
        ).bind(me.group_id).first()
      : null,
    me.group_id
      ? env.DB.prepare(
          'SELECT full_name FROM members WHERE group_id = ? AND is_active = 1 ORDER BY full_name COLLATE NOCASE'
        ).bind(me.group_id).all()
      : { results: [] },
    me.group_id
      ? env.DB.prepare(
          `SELECT o.role, m.full_name FROM officers o
             JOIN members m ON m.id = o.member_id
            WHERE o.group_id = ? AND o.superseded_at IS NULL
              AND o.role IN ('truong_nhom', 'pho_nhom', 'tieu_bieu')`
        ).bind(me.group_id).all()
      : { results: [] },
    // Đợt thu phí Gala — migration 0041 dựng nó với đúng ba dấu này. Tìm theo
    // (scope, amount, account_no) chứ không theo tiêu đề: tiêu đề sửa được
    // bằng nút ✎ trong ứng dụng, so tên là có ngày form mất mã QR mà không
    // chỗ nào báo lỗi.
    env.DB.prepare(
      `SELECT * FROM fund_rounds
        WHERE cohort_id = ? AND scope = 'class' AND amount = 1000000
          AND account_no = '0975587586' LIMIT 1`
    ).bind(me.cohort_id).first(),
  ]);

  return json({
    han_gala: HAN_GALA,
    ngay_le: NGAY_LE,
    nganh_list: NGANH,
    la_ban_can_su: await isClassCommittee(env, me.id),
    // Điền sẵn từ những gì D1 đã biết. Giao diện chỉ dùng phần này khi CHƯA có
    // bản đăng ký — đã lưu rồi thì đọc từ `dang_ky` để không đè bản người ta
    // vừa sửa bằng bản gốc (quy ước 3 CLAUDE.md, lỗi mất dữ liệu Đợt 1).
    goi_y: {
      ho_ten: me.full_name,
      // NGUYÊN VĂN, không chuẩn hoá. 28/146 dòng chỉ có năm ('1966') và 11
      // dòng trống — đo trên D1 thật 18/9. Giao diện gắn nhãn "kiểm lại giúp"
      // khi chuỗi không khớp dd/mm/yyyy, chứ máy chủ không đoán hộ ngày tháng.
      ngay_sinh: hoSoGoc?.dob ?? null,
      dien_thoai: me.phone,
      doanh_nghiep: me.company,
      mo_ta_dn: hoSoGoc?.mo_ta ?? null,
      linh_vuc: hoSoGoc?.nganh ?? null,
      chuc_vu: me.title,
      nhu_cau_ket_noi: hoSoGoc?.needs ?? null,
    },
    dang_ky: dk ?? null,
    // Dùng LẠI shapeRound() của funds.js, không chép trường sang hình dạng
    // thứ hai: nhãn trạng thái ("đã tự khai" / "người thu đã nhận", mục 6.4
    // SRS), cú pháp chuyển khoản và đường dựng QR chỉ có một nguồn. Đường GHI
    // vẫn là POST /api/funds/:id/declare có sẵn — zone này không có route
    // tiền nào của riêng nó.
    dot_phi: dotPhi ? await shapeRound(env, dotPhi, me) : null,
    nhom: nhom
      ? {
          no: nhom.no,
          label: nhom.label,
          topic_product: nhom.topic_product ?? null,
          topic_customers: nhom.topic_customers ?? null,
          ban_nop_url: nhom.ban_nop_url ?? null,
          ban_nop_luc: nhom.ban_nop_luc ?? null,
          ban_nop_boi_ten: nhom.ban_nop_boi_ten ?? null,
          truong_nhom: (officers.results ?? []).find(o => o.role === 'truong_nhom')?.full_name ?? null,
          thanh_vien: (thanhVien.results ?? []).map(x => x.full_name),
        }
      : null,
  });
}

/* ── Phần A: hồ sơ & chứng chỉ ────────────────────────────────────────────
   Không nhận member_id trong thân — chính chủ tự khai, đúng khuôn
   putGianHang và PUT /api/me/mail-thong-bao. Không có chỗ nào để dò. */
export async function putHoSo(request, env, me) {
  const body = await readJson(request);
  const cu = await docDangKy(env, me.id);

  const dat = {
    ho_ten: cleanText(body.ho_ten, 120),
    ngay_sinh: cleanText(body.ngay_sinh, 20),
    dien_thoai: cleanText(body.dien_thoai, 20),
    doanh_nghiep: cleanText(body.doanh_nghiep, 200),
    linh_vuc: nganhRaChuoi(body.linh_vuc),
    chuc_vu: cleanText(body.chuc_vu, 120),
    nhu_cau_ket_noi: cleanText(body.nhu_cau_ket_noi, 500),
  };

  await env.DB.prepare(
    `INSERT INTO dang_ky_tot_nghiep
       (member_id, ho_ten, ngay_sinh, dien_thoai, doanh_nghiep, linh_vuc,
        chuc_vu, nhu_cau_ket_noi, ho_so_luc, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
     ON CONFLICT(member_id) DO UPDATE SET
       ho_ten = excluded.ho_ten, ngay_sinh = excluded.ngay_sinh,
       dien_thoai = excluded.dien_thoai, doanh_nghiep = excluded.doanh_nghiep,
       linh_vuc = excluded.linh_vuc, chuc_vu = excluded.chuc_vu,
       nhu_cau_ket_noi = excluded.nhu_cau_ket_noi,
       ho_so_luc = excluded.ho_so_luc, updated_at = excluded.updated_at`
  ).bind(
    me.id, dat.ho_ten, dat.ngay_sinh, dat.dien_thoai, dat.doanh_nghiep,
    dat.linh_vuc, dat.chuc_vu, dat.nhu_cau_ket_noi
  ).run();

  // Chỉ ghi hoạt động LẦN ĐẦU. Sửa lại một chữ mà đẩy thêm một dòng vào feed
  // "Đang diễn ra" của cả nhóm thì feed thành sổ nháp của một người.
  if (!cu?.ho_so_luc) {
    await logActivity(env, {
      cohortId: me.cohort_id, groupId: me.group_id, actorId: me.id,
      verb: 'totnghiep.hoso', objectType: 'dang_ky_tot_nghiep', objectId: me.id,
      summary: 'điền hồ sơ làm chứng chỉ tốt nghiệp',
    });
  }
  return json({ ok: true, dang_ky: await docDangKy(env, me.id) });
}

/* ── Phần C: Lễ tốt nghiệp & Gala ─────────────────────────────────────────
   KHÔNG có trường nào tên "đã đóng phí". Mục 6.4 SRS cấm tuyệt đối chữ ấy;
   trạng thái tiền đọc từ fund_declarations (người ta bấm "Tôi đã chuyển
   khoản" ở tab Quỹ), và chỉ thành "người thu đã nhận" khi chị Ngân soi sao
   kê xác nhận. Chép một cờ "đã đóng" vào đây là dựng nguồn sự thật thứ hai
   cho tiền — thứ nguy hiểm nhất có thể làm. */
export async function putGala(request, env, me) {
  const body = await readJson(request);
  const cu = await docDangKy(env, me.id);

  const duLe = motTrong(body.du_le, DU_LE);
  const taiTro = motTrong(body.tai_tro, TAI_TRO);
  const vanNghe = coKhong(body.van_nghe);

  await env.DB.prepare(
    `INSERT INTO dang_ky_tot_nghiep
       (member_id, du_le, tai_tro, tai_tro_mo_ta, gian_hang, van_nghe,
        van_nghe_mo_ta, gala_luc, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
     ON CONFLICT(member_id) DO UPDATE SET
       du_le = excluded.du_le, tai_tro = excluded.tai_tro,
       tai_tro_mo_ta = excluded.tai_tro_mo_ta, gian_hang = excluded.gian_hang,
       van_nghe = excluded.van_nghe, van_nghe_mo_ta = excluded.van_nghe_mo_ta,
       gala_luc = excluded.gala_luc, updated_at = excluded.updated_at`
  ).bind(
    me.id, duLe, taiTro, cleanText(body.tai_tro_mo_ta, 500),
    coKhong(body.gian_hang), vanNghe, cleanText(body.van_nghe_mo_ta, 500)
  ).run();

  if (!cu?.gala_luc) {
    await logActivity(env, {
      cohortId: me.cohort_id, groupId: me.group_id, actorId: me.id,
      verb: 'totnghiep.gala', objectType: 'dang_ky_tot_nghiep', objectId: me.id,
      summary: duLe === 'co' ? 'đăng ký dự Lễ tốt nghiệp 26/9' : 'trả lời đăng ký Lễ tốt nghiệp',
    });
  }
  return json({ ok: true, dang_ky: await docDangKy(env, me.id) });
}

/* ── Phần B: link bản nộp KHKD ────────────────────────────────────────────
   Ghi vào `groups`, KHÔNG vào `plans` — lý do đầy đủ trong migration 0041:
   chỉ Nhóm 6 có dòng `plans`, chín nhóm còn lại không có chỗ nào để ghi.

   AI GHI ĐƯỢC: bất kỳ thành viên nào của nhóm, KHÔNG phải chỉ trưởng/phó.
   Đây là chỗ cố ý lệch với patchTopic (dùng canManageGroup), và lý do đo
   được chứ không phải suy đoán: trong 10 nhóm mới có Nhóm 6 và Nhóm 8 có
   người giữ vai officer. Gác bằng canManageGroup là TÁM nhóm không ai nộp
   được link, tám ngày trước buổi bảo vệ. Đổi lại, ban_nop_boi ghi rõ ai nộp
   lần cuối và giao diện in tên ấy ra, nên nhóm tự thấy và tự sửa nhau được.

   N6 khoá chặt mà không cần kiểm gì: route KHÔNG nhận group_id trong thân,
   nó ghi thẳng vào me.group_id. Không có id nào để giả mạo. */
export async function patchBanNop(request, env, me, ip) {
  if (!me.group_id) return error('chua_co_nhom', 409);

  const body = await readJson(request);
  const url = cleanText(body.ban_nop_url, 500);
  // Cùng luật với Tư liệu và Giao thương (giao-thuong.js:122): chỉ https.
  // Chuỗi này đi thẳng vào href của một thẻ <a>, mà 'javascript:' thì esc()
  // không cứu được — nó không chứa ký tự HTML nào để thoát.
  if (url && !/^https:\/\/[^\s/]+\./i.test(url)) return error('link_must_be_https', 422);

  const cu = await env.DB.prepare('SELECT ban_nop_url FROM groups WHERE id = ?')
    .bind(me.group_id).first();

  // Xoá trắng được (url = null): thà trống còn hơn một đường dẫn hỏng — đúng
  // quyết định đã áp cho PATCH /api/links/:id ngày 25/8.
  await env.DB.prepare(
    `UPDATE groups SET ban_nop_url = ?,
       ban_nop_luc = CASE WHEN ? IS NULL THEN NULL ELSE datetime('now') END,
       ban_nop_boi = CASE WHEN ? IS NULL THEN NULL ELSE ? END
     WHERE id = ?`
  ).bind(url, url, url, me.id, me.group_id).run();

  await logAudit(env, {
    actorId: me.id, action: 'totnghiep.bannop', targetType: 'group', targetId: me.group_id,
    before: { ban_nop_url: cu?.ban_nop_url ?? null }, after: { ban_nop_url: url }, ip,
  });
  await logActivity(env, {
    cohortId: me.cohort_id, groupId: me.group_id, actorId: me.id,
    verb: 'totnghiep.bannop', objectType: 'group', objectId: me.group_id,
    summary: url ? 'nộp link bản Kế hoạch kinh doanh của nhóm' : 'gỡ link bản Kế hoạch kinh doanh',
  });

  return json({ ok: true, ban_nop_url: url });
}

/* ── Ban cán sự lớp: xem cả lớp ───────────────────────────────────────────
   isClassCommittee (gồm cả uy_vien) chứ không isClassOfficer: đây là quyền
   ĐỌC để báo cáo với Ban tổ chức, không đụng tiền — đúng phân định đã ghi
   trong permissions.js. Nhờ vậy Ngô Phú Cường (uy_vien) xem được ngay. */
async function docDanhSach(env, me) {
  const rows = await env.DB.prepare(
    `SELECT m.id AS member_id, m.full_name, m.email, m.phone AS phone_hoso,
            g.no AS group_no, g.label AS group_label,
            g.ban_nop_url, r.dob AS dob_goc,
            d.ho_ten, d.ngay_sinh, d.dien_thoai, d.doanh_nghiep, d.linh_vuc,
            d.chuc_vu, d.nhu_cau_ket_noi, d.anh_url, d.logo_url, d.ho_so_luc,
            d.du_le, d.tai_tro, d.tai_tro_mo_ta, d.gian_hang, d.van_nghe,
            d.van_nghe_mo_ta, d.gala_luc,
            (SELECT CASE WHEN fd.verified_at IS NOT NULL THEN 'nguoi_thu_da_nhan'
                         WHEN fd.declared_at IS NOT NULL THEN 'da_tu_khai'
                         ELSE NULL END
               FROM fund_declarations fd
               JOIN fund_rounds fr ON fr.id = fd.round_id
              WHERE fd.member_id = m.id AND fr.scope = 'class'
                AND fr.amount = 1000000 LIMIT 1) AS trang_thai_phi
       FROM members m
       LEFT JOIN groups g ON g.id = m.group_id
       LEFT JOIN roster r ON r.id = m.roster_id
       LEFT JOIN dang_ky_tot_nghiep d ON d.member_id = m.id
      WHERE m.cohort_id = ? AND m.is_active = 1
      ORDER BY g.no, m.full_name COLLATE NOCASE`
  ).bind(me.cohort_id).all();
  return rows.results ?? [];
}

export async function getDanhSachTotNghiep(env, me) {
  if (!(await isClassCommittee(env, me.id))) return error('forbidden', 403);
  const ds = await docDanhSach(env, me);
  return json({
    tong: ds.length,
    xong_ho_so: ds.filter(x => x.ho_so_luc).length,
    xong_gala: ds.filter(x => x.gala_luc).length,
    du_le: ds.filter(x => x.du_le === 'co').length,
    nguoi: ds,
  });
}

/* ── Xuất CSV cho Ban tổ chức ─────────────────────────────────────────────
   CSV chứ không Word: bên làm chứng chỉ mở bằng Excel để trộn thư. lib/docx.js
   để nguyên, không đụng. */
function oCsv(v) {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function getXuatCsv(env, me) {
  if (!(await isClassCommittee(env, me.id))) return error('forbidden', 403);
  const ds = await docDanhSach(env, me);

  const cot = [
    ['Nhóm', x => x.group_label],
    ['Họ và tên', x => x.ho_ten || x.full_name],
    ['Ngày sinh', x => x.ngay_sinh || x.dob_goc],
    ['Điện thoại', x => x.dien_thoai || x.phone_hoso],
    ['Email', x => x.email],
    ['Doanh nghiệp', x => x.doanh_nghiep],
    ['Chức vụ', x => x.chuc_vu],
    ['Lĩnh vực', x => x.linh_vuc],
    ['Nhu cầu kết nối', x => x.nhu_cau_ket_noi],
    ['Ảnh chân dung', x => x.anh_url],
    ['Logo doanh nghiệp', x => x.logo_url],
    ['Link bản KHKD của nhóm', x => x.ban_nop_url],
    ['Dự Lễ 17h-22h', x => (x.du_le === 'co' ? 'Có' : x.du_le === 'khong' ? 'Không' : '')],
    // Nhãn phải đúng mục 6.4 SRS: "đã tự khai" cho tới khi người thu đối
    // chiếu sao kê, KHÔNG BAO GIỜ "đã đóng". Tệp này đi ra ngoài cho Ban tổ
    // chức đọc, nên càng phải đúng chữ.
    ['Phí Gala', x => (x.trang_thai_phi === 'nguoi_thu_da_nhan' ? 'Người thu đã nhận'
      : x.trang_thai_phi === 'da_tu_khai' ? 'Đã tự khai — chờ đối chiếu sao kê' : 'Chưa khai')],
    ['Tài trợ', x => (x.tai_tro === 'tien' ? 'Tiền' : x.tai_tro === 'hien_vat' ? 'Hiện vật'
      : x.tai_tro === 'khong' ? 'Không' : '')],
    ['Tài trợ — chi tiết', x => x.tai_tro_mo_ta],
    ['Gian hàng / standee', x => (x.gian_hang ? 'Có' : '')],
    ['Tiết mục văn nghệ', x => (x.van_nghe ? 'Có' : '')],
    ['Văn nghệ — chi tiết', x => x.van_nghe_mo_ta],
    ['Xong hồ sơ lúc', x => x.ho_so_luc],
    ['Xong đăng ký Lễ lúc', x => x.gala_luc],
  ];

  const dong = [cot.map(c => oCsv(c[0])).join(',')];
  for (const x of ds) dong.push(cot.map(c => oCsv(c[1](x))).join(','));

  // BOM UTF-8 BẮT BUỘC: thiếu nó thì Excel trên Windows đọc tệp bằng bảng mã
  // hệ thống và mọi dấu tiếng Việt thành ký tự rác. Tệp này để Ban tổ chức mở
  // bằng Excel, nên đó không phải chi tiết nhỏ — đó là cả công dụng của tệp.
  // CRLF chứ không LF, cùng lý do (Excel cũ nuốt cả tệp khi chỉ có LF).
  const body = '﻿' + dong.join('\r\n') + '\r\n';
  return new Response(body, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': 'attachment; filename="dang-ky-tot-nghiep-k3vaceo.csv"',
    },
  });
}
